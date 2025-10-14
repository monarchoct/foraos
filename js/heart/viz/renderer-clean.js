// Clean THREE.js GLB loader implementation
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class Renderer {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Character
        this.character = null;
        this.animationMixer = null;
        
        // Anime/Cartoon filter
        this.outlineEffect = null;
        
        // Post-processing
        this.composer = null;
        this.bloomPass = null;
        
        // Model configuration
        this.modelPath = './models/fora8.glb';
        
        // Container reference
        this.container = null;
        
        // Animation manager
        this.animationManager = null;
        
        // Animation properties (needed for startFirstAnimation)
        this.actions = {};
        this.activeIdleAction = null;  // Current idle animation
        this.activeActionAnimation = null;  // Current action animation (plays on top)
        this.previousAction = null;
        this.currentAnimation = null;
        this.isAnimating = false;
        
        // Animation layering weights
        this.idleWeight = 1.0;
        this.actionWeight = 0.0;
        
        // Manual crossfade system
        this.crossfadeState = {
            isCrossfading: false,
            fromAction: null,
            toAction: null,
            crossfadeTime: 0,
            crossfadeDuration: 2.0, // 2 second crossfade
            fromWeight: 1.0,
            toWeight: 0.0
        };
    }

    async initialize() {
        console.log('🎨 Initializing Three.js Renderer...');
        
        // Get container
        this.container = document.getElementById('three-container');
        if (!this.container) {
            console.error('❌ Three.js container not found! Looking for #three-container');
            // Try to create it if it doesn't exist
            this.container = document.createElement('div');
            this.container.id = 'three-container';
            document.body.appendChild(this.container);
            console.log('✅ Created three-container div');
        } else {
            console.log('✅ Found three-container div');
        }
        
        // Setup in order
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        await this.loadCharacter();
        this.setupAnimeFilter();
        // this.setupPostProcessing(); // Disabled bloom effects
        
        // Start animation loop
        this.animate();
        
        // Setup window resize handler
        this.setupResizeHandler();
        
        console.log('✅ Renderer initialized successfully!');
    }

    setupScene() {
        console.log('Setting up Three.js scene...');
        this.scene = new THREE.Scene();
        
        // Load cement background with 30% dark overlay
        const loader = new THREE.TextureLoader();
        loader.load('./backgrounds/cement.jpg', (texture) => {
            this.scene.background = texture;
            
            // Create a dark overlay to make background 30% darker
            const overlayGeometry = new THREE.PlaneGeometry(20, 20);
            const overlayMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.5  // 50% dark overlay
            });
            const darkOverlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
            darkOverlay.position.z = -5; // Behind character but in front of background
            this.scene.add(darkOverlay);
            
            console.log('✅ Cement background loaded with 50% dark overlay');
        });
    }

    setupCamera() {
        console.log('📷 Setting up camera...');
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0.8, 4); // Normal camera position
    }

    setupRenderer() {
        console.log('🖥️ Setting up MINIMAL renderer - no processing at all...');
        
        // Most basic renderer possible - no effects, no processing
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            alpha: true,
            powerPreference: "low-power"  // Disable any GPU processing tricks
        });
        
        // Set pixel ratio for high-DPI displays (mobile retina screens)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Use full window size
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        
        // Disable ALL possible processing
        this.renderer.shadowMap.enabled = false;
        this.renderer.setClearColor(0x000000, 0);
        
        // Force basic rendering
        this.renderer.info.autoReset = false;
        
        this.container.appendChild(this.renderer.domElement);
        console.log(`✅ MINIMAL renderer created - absolutely no processing`);
    }

    setupLights() {
        console.log('💡 Setting up full lighting system...');
        
        // Create a separate group for lighting that only affects characters
        this.lightGroup = new THREE.Group();
        this.scene.add(this.lightGroup);
        
        // Ambient light that won't affect background
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.723);
        this.lightGroup.add(ambientLight);
        
        // Create ring light setup - multiple lights in a circle
        const ringRadius = 3;
        const ringHeight = 2;
        const numLights = 6;
        
        for (let i = 0; i < numLights; i++) {
            const angle = (i / numLights) * Math.PI * 2;
            const x = Math.cos(angle) * ringRadius;
            const z = Math.sin(angle) * ringRadius;
            
            const ringLight = new THREE.DirectionalLight(0xffffff, 0.867);
            ringLight.position.set(x, ringHeight, z);
            ringLight.target.position.set(0, 0, 0);
            this.lightGroup.add(ringLight);
            this.lightGroup.add(ringLight.target);
        }
        
        // Add overhead key light
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.084);
        keyLight.position.set(0, 5, 0);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        this.lightGroup.add(keyLight);
        
        // Ensure lights only affect characters, not background
        this.lightGroup.visible = true;
        console.log('✅ Full lighting setup complete');
    }

    setupControls() {
        console.log('🎮 Setting up controls...');
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.target.set(0, -1, 0); // Target lower but visible position
    }

    setupAnimeFilter() {
        console.log('🎨 Setting up anime/cartoon filter...');
        
        // Create outline effect for anime-style black outlines
        this.outlineEffect = new OutlineEffect(this.renderer, {
            defaultThickness: 0.003,
            defaultColor: [0, 0, 0], // Black outlines
            defaultAlpha: 1.0,
            defaultKeepAlive: true
        });
        
        console.log('✅ Anime filter initialized');
    }

    setupPostProcessing() {
        console.log('✨ Setting up post-processing effects...');
        
        // Create effect composer
        this.composer = new EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom pass for subtle glowing effects
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.3,    // strength - much more subtle
            0.4,    // radius
            0.9     // threshold - only very bright areas bloom
        );
        this.composer.addPass(this.bloomPass);
        
        console.log('✅ Post-processing effects initialized');
    }

    async loadCharacter() {
        console.log('👤 Loading character model...');
        
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            
            loader.load(
                this.modelPath,
                (gltf) => {
                    console.log('✅ GLB model loaded successfully:', gltf);
                    
                    this.character = gltf.scene;
                    
                    // Scale and position - make it larger and move even lower
                    this.character.scale.set(0.0184, 0.0184, 0.0184); // 15% larger (0.016 * 1.15)
                    
                    // Center the model first
                    const box = new THREE.Box3().setFromObject(this.character);
                    const center = box.getCenter(new THREE.Vector3());
                    this.character.position.sub(center);
                    
                    // Then move down on Y axis (after centering)
                    this.character.position.y -= 3.36; // Move down 5% more (3.2 * 1.05 = 3.36)
                    
                    // Tilt character back 15 degrees to fix forward lean
                    this.character.rotation.x = -0.26; // -15 degrees in radians (15 * Math.PI / 180)
                    
                    // Enable shadows and fix materials
                    this.character.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Exclude eyes and hair from outline effect
                            const meshName = child.name.toLowerCase();
                            if (meshName.includes('eye') || meshName.includes('hair') || meshName.includes('eyebrow')) {
                                child.userData.noOutline = true;
                            }
                            
                            // Keep original materials - don't modify them
                            if (child.material) {
                                child.material.needsUpdate = true;
                            }
                        }
                    });
                    
                    // Add to scene
                    this.scene.add(this.character);
                    
                    // Setup animation mixer FIRST if animations exist
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.animationMixer = new THREE.AnimationMixer(this.character);
                        console.log(`🎬 Found ${gltf.animations.length} animations`);
                        
                        // Initialize actions object for animation manager
                        this.actions = {};
                        gltf.animations.forEach(animation => {
                            const action = this.animationMixer.clipAction(animation);
                            action.enabled = true;
                            action.clampWhenFinished = false;
                            this.actions[animation.name] = action;
                        });
                        console.log(`🎭 Initialized ${Object.keys(this.actions).length} actions:`, Object.keys(this.actions));
                    }
                    
                    // THEN initialize animation manager (needs mixer to exist)
                    if (window.heartSystem && window.heartSystem.animationManager) {
                        console.log('🔗 Setting up animation manager...');
                        this.animationManager = window.heartSystem.animationManager;
                        this.animationManager.initialize(this.character, this.animationMixer);
                        console.log('✅ Animation manager initialized');
                    } else {
                        console.log('⚠️ Heart system or animation manager not available - will retry later');
                        console.log('Heart system:', !!window.heartSystem);
                        console.log('Animation manager:', !!window.heartSystem?.animationManager);
                        this.needsAnimationManagerInit = true;
                    }
                    
                    console.log('✅ Character added to scene');
                    resolve();
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.error('❌ Failed to load GLB model:', error);
                    console.log('Creating fallback character...');
                    
                    // Create a fallback character
                    const geometry = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
                    const material = new THREE.MeshLambertMaterial({ color: 0x00ff64 });
                    this.character = new THREE.Mesh(geometry, material);
                    this.character.position.set(0, 0.75, 0);
                    this.character.castShadow = true;
                    this.character.receiveShadow = true;
                    
                    this.scene.add(this.character);
                    resolve();
                }
            );
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Update animation mixer
        if (this.animationMixer) {
            this.animationMixer.update(0.016);
        }
        
        // Update manual crossfade system
        this.updateManualCrossfade(0.016);
        
        // Update animation manager (for blinking, mouth movements, etc.)
        if (this.animationManager) {
            this.animationManager.updateAnimations(0.016);
        } else if (this.needsAnimationManagerInit && window.heartSystem?.animationManager) {
            // Retry animation manager initialization
            console.log('🔄 Retrying animation manager initialization...');
            this.animationManager = window.heartSystem.animationManager;
            this.animationManager.initialize(this.character, this.animationMixer);
            this.needsAnimationManagerInit = false;
            console.log('✅ Animation manager retry successful!');
        } else if (!this.animationManagerDebugLogged) {
            // Debug: Log once when animation manager is missing
            console.log('⚠️ Animation manager not available in renderer');
            this.animationManagerDebugLogged = true;
        }
        
        // Render without outline effect
        this.renderer.render(this.scene, this.camera);
    }

    setupResizeHandler() {
        // Debounced resize handler for mobile zoom issues
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.onWindowResize(), 100);
        };
        
        window.addEventListener('resize', debouncedResize);
        window.addEventListener('orientationchange', debouncedResize);
    }

    // Handle window resize
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        console.log(`📱 Resizing to: ${width}x${height}, pixelRatio: ${window.devicePixelRatio}`);
        
        // Update pixel ratio for mobile retina screens
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Update camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(width, height);
        
        // Update post-processing composer
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        
        // Update bloom pass
        if (this.bloomPass) {
            this.bloomPass.setSize(width, height);
        }
        
        console.log(`📐 Resized to ${width}x${height}`);
    }

    // Start first animation with proper looping and smooth crossfading
    startFirstAnimation(animationName) {
        
        if (!this.actions[animationName]) {
            console.warn(`⚠️ Animation '${animationName}' not found`);
            return;
        }
        
        const newAction = this.actions[animationName];
        
        // Check if this is an idle animation
        const isIdle = animationName.toLowerCase().includes('idle');
        
        if (isIdle) {
            // Handle idle animation with manual crossfade
            newAction.setLoop(THREE.LoopRepeat, Infinity);
            newAction.clampWhenFinished = false;
            newAction.setEffectiveTimeScale(0.177); // Set idle speed to 0.177 (15% faster than 0.154)
            
            if (this.activeIdleAction && this.activeIdleAction !== newAction) {
                // Start manual crossfade (2 second transition)
                this.startManualCrossfade(this.activeIdleAction, newAction, animationName);
                console.log(`🔄 Starting 2-second crossfade from ${this.currentAnimation} to ${animationName}`);
            } else {
                // First idle animation or same animation - make sure it plays
                newAction.reset();
                newAction.play();
                newAction.setEffectiveWeight(1.0);
                newAction.enabled = true;
                console.log(`🎭 Starting initial idle animation: ${animationName}`);
                
                this.activeIdleAction = newAction;
                this.currentAnimation = animationName;
                this.isAnimating = true;
            }
        } else {
            // Not an idle animation, just play it normally
            newAction.setLoop(THREE.LoopRepeat, Infinity);
            newAction.reset();
            newAction.play();
            
            this.currentAnimation = animationName;
            this.isAnimating = true;
        }
    }

    // Play action animation during speech (layered on top of idle)
    playActionAnimation(actionName, duration) {
        if (!this.actions[actionName]) {
            console.warn(`⚠️ Action animation '${actionName}' not found`);
            return;
        }
        
        const action = this.actions[actionName];
        
        // Stop previous action animation if one is playing
        if (this.activeActionAnimation) {
            this.activeActionAnimation.fadeOut(0.3);
        }
        
        // Configure action animation to loop during whole speech
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.enabled = true;
        action.reset();
        
        // Keep normal speed for looping
        action.setEffectiveTimeScale(1.0);
        
        // Start with weight 0 and fade in (allows blending with other animations)
        action.setEffectiveWeight(0);
        action.play();
        action.fadeIn(0.3);
        
        // Store speech duration for fade out when speech ends
        action.userData = { speechDuration: duration || 3000 };
        
        this.activeActionAnimation = action;
        console.log(`🎬 Playing action animation (layered): ${actionName}`);
    }

    // Manual crossfade system for smooth idle transitions
    startManualCrossfade(fromAction, toAction, toAnimationName) {
        // Set up crossfade state
        this.crossfadeState.isCrossfading = true;
        this.crossfadeState.fromAction = fromAction;
        this.crossfadeState.toAction = toAction;
        this.crossfadeState.crossfadeTime = 0;
        this.crossfadeState.fromWeight = 1.0;
        this.crossfadeState.toWeight = 0.0;
        
        // Start the new animation
        toAction.reset();
        toAction.play();
        toAction.setEffectiveWeight(0);
        toAction.enabled = true;
    }

    updateManualCrossfade(deltaTime) {
        if (!this.crossfadeState.isCrossfading) return;
        
        this.crossfadeState.crossfadeTime += deltaTime;
        const progress = this.crossfadeState.crossfadeTime / this.crossfadeState.crossfadeDuration;
        
        if (progress >= 1.0) {
            // Crossfade complete
            this.crossfadeState.fromAction.setEffectiveWeight(0);
            this.crossfadeState.toAction.setEffectiveWeight(1.0);
            
            // Update active action
            this.activeIdleAction = this.crossfadeState.toAction;
            this.currentAnimation = this.crossfadeState.toAction._clip.name;
            
            // Reset crossfade state
            this.crossfadeState.isCrossfading = false;
            this.crossfadeState.fromAction = null;
            this.crossfadeState.toAction = null;
            
            console.log(`✅ Crossfade complete: now playing ${this.currentAnimation}`);
        } else {
            // Update weights during crossfade
            this.crossfadeState.fromWeight = 1.0 - progress;
            this.crossfadeState.toWeight = progress;
            
            this.crossfadeState.fromAction.setEffectiveWeight(this.crossfadeState.fromWeight);
            this.crossfadeState.toAction.setEffectiveWeight(this.crossfadeState.toWeight);
        }
    }

    // Background methods for background manager integration
    setBackground(color) {
        if (this.scene) {
            this.scene.background = new THREE.Color(color);
        }
    }

    setGradientBackground(colors) {
        if (!this.scene) return;
        
        // Validate colors parameter
        if (!colors) {
            console.warn('⚠️ setGradientBackground called with undefined colors, using default');
            colors = [0x87CEEB, 0xFF69B4]; // Default gradient colors
        }
        
        // Create a gradient texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        if (Array.isArray(colors)) {
            colors.forEach((color, index) => {
                const stop = index / (colors.length - 1);
                // Ensure color is a valid number
                const validColor = (typeof color === 'number') ? color : 0x87CEEB;
                gradient.addColorStop(stop, `#${validColor.toString(16).padStart(6, '0')}`);
            });
        } else {
            // Single color fallback
            const validColor = (typeof colors === 'number') ? colors : 0x87CEEB;
            gradient.addColorStop(0, `#${validColor.toString(16).padStart(6, '0')}`);
            gradient.addColorStop(1, `#${validColor.toString(16).padStart(6, '0')}`);
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
    }

    setBackgroundTexture(texture) {
        if (this.scene && texture) {
            this.scene.background = texture;
        }
    }

    setBackgroundTransition(backgroundData) {
        if (!this.scene) return;
        
        if (backgroundData.blendValues) {
            const blendValues = backgroundData.blendValues;
            
            // Handle color transition
            if (blendValues.type === 'color' && blendValues.color) {
                this.scene.background = new THREE.Color(blendValues.color);
            }
            
            // Handle gradient transition
            if (blendValues.type === 'gradient' && blendValues.colors) {
                this.setGradientBackground(blendValues.colors);
            }
            
            // Handle image transition
            if (blendValues.type === 'image') {
                // Convert image to texture and apply
                if (blendValues.toImage) {
                    const texture = new THREE.Texture(blendValues.toImage);
                    texture.needsUpdate = true;
                    this.scene.background = texture;
                }
            }
            
            // Handle mixed transition
            if (blendValues.type === 'mixed') {
                // For mixed transitions, use the target background
                const toBackground = blendValues.toBackground;
                if (toBackground.type === 'color') {
                    this.scene.background = new THREE.Color(toBackground.color);
                } else if (toBackground.type === 'gradient') {
                    this.setGradientBackground(toBackground.colors);
                } else if (toBackground.type === 'image' && toBackground.image) {
                    const texture = new THREE.Texture(toBackground.image);
                    texture.needsUpdate = true;
                    this.scene.background = texture;
                }
            }
        } else if (backgroundData.type === 'image' && backgroundData.image) {
            // Direct image application (fallback)
            const texture = new THREE.Texture(backgroundData.image);
            texture.needsUpdate = true;
            this.scene.background = texture;
        }
    }

    resetTransitionPlane() {
        // Clean renderer doesn't use transition planes, so this is a no-op
        // This method exists for compatibility with the background manager
    }

}
