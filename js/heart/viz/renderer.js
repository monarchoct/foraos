// THREE.js is imported as ES module
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AnimationManager } from './animation-manager.js';
import { PhysicsManager } from './physics-manager.js';

export class Renderer {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        

        
        // Character and animation
        this.character = null;
        this.animationMixer = null;
        this.actions = {};
        this.activeAction = null;
        this.previousAction = null;
        
        // Multi-animation system (inspired by three-gltf-viewer)
        this.activeActions = {}; // Track multiple active animations
        this.actionStates = {}; // Track state of each animation
        this.animationWeights = {}; // Weight/blending for layered animations
        
        // Animation transition system
        this.currentAnimation = null;
        this.isAnimating = false;
        this.fadeDuration = 1.2;
        this.transitionQueue = [];
        this.isTransitioning = false;
        
        // Lighting system
        this.lights = {};
        
        // Background and transitions
        this.background = null;
        this.transitionPlane = null;
        
        // Model configuration
        this.modelPath = './models/fora11.glb';
        this.usePlaceholder = false; // Try to load actual model
        
        // Container reference
        this.container = null;
        
        // Controls
        this.controls = null;
        
        // Managers
        this.animationManager = null;
        this.physicsManager = new PhysicsManager();
    }

    async initialize() {
        console.log('🎨 Initializing Three.js Renderer...');
        
        // Get container
        this.container = document.getElementById('three-container');
        if (!this.container) {
            throw new Error('Three.js container not found');
        }
        
                // Initialize in proper order (following tutorial pattern)
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.setupRenderer();
        this.setupControls();
        await this.loadCharacter();
        
        // Start animation loop
        this.animate();
        
        console.log('✅ Renderer initialized successfully!');
    }

    setupScene() {
        console.log('Setting up Three.js scene...');
        
        // Create scene (following tutorial pattern)
        this.scene = new THREE.Scene();
        
        // Create transition plane for smooth background transitions
        this.createTransitionPlane();
        
        console.log('✅ Scene setup complete');
    }

    setupCamera() {
        console.log('📷 Setting up camera...');
        
        // Calculate aspect ratio (following tutorial pattern)
        const aspect = this.container.clientWidth / this.container.clientHeight;
        
        // Create perspective camera (following tutorial pattern)
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        
        // Position camera for character view (adjusted for better view)
        this.camera.position.set(0, 1.6, 4);
        this.camera.lookAt(0, 1.6, 0);
        
        // Handle window resize (following tutorial pattern)
        window.addEventListener('resize', () => {
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.aspect = aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
        
        console.log('✅ Camera setup complete');
    }

    setupControls() {
        console.log('🎮 Setting up orbit controls...');
        
        // Create orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Configure controls for character viewing
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.enableRotate = false;
        
        // Set rotation limits (prevent upside down)
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = Math.PI;
        
        // Set zoom limits
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        
        // Set initial target (character position)
        this.controls.target.set(0, 1.6, 0);
        
        console.log('✅ Controls setup complete');
        
        // Add keyboard shortcuts for camera control
        this.setupKeyboardControls();
    }

    setupKeyboardControls() {
        // Multi-animation keyboard controls
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            
            switch(key) {
                case 's':
                    this.logAnimationStatus();
                    break;
                case 'm':
                    // Test multi-animation: play first two available animations
                    const animationNames = Object.keys(this.actions);
                    if (animationNames.length >= 2) {
                        this.playMultipleAnimations([animationNames[0], animationNames[1]], {
                            weights: { [animationNames[0]]: 1.0, [animationNames[1]]: 0.5 }
                        });
                    }
                    break;
                case 'a':
                    // Play all animations
                    this.playAllAnimations();
                    break;
                case 'l':
                    // Test animation layering (idle + another animation)
                    const animations = Object.keys(this.actions);
                    const idleAnim = animations.find(name => name.toLowerCase().includes('idle'));
                    const otherAnim = animations.find(name => !name.toLowerCase().includes('idle'));
                    if (idleAnim && otherAnim) {
                        this.layerAnimations(idleAnim, otherAnim, 0.3);
                    }
                    break;
                case 'x':
                    // Stop all multi-animations
                    this.stopAllMultiAnimations();
                    break;
                case '1':
                    // Test weight adjustment
                    const activeAnims = Object.keys(this.activeActions);
                    if (activeAnims.length >= 2) {
                        this.updateAnimationWeights({
                            [activeAnims[0]]: 1.0,
                            [activeAnims[1]]: 0.2
                        });
                    }
                    break;
                case '2':
                    // Test different weight adjustment
                    const activeAnims2 = Object.keys(this.activeActions);
                    if (activeAnims2.length >= 2) {
                        this.updateAnimationWeights({
                            [activeAnims2[0]]: 0.2,
                            [activeAnims2[1]]: 1.0
                        });
                    }
                    break;
            }
        });
        
        console.log('⌨️ Multi-Animation Keyboard Controls:');
        console.log('   S - Log animation status');
        console.log('   M - Play multiple animations (first two)');
        console.log('   A - Play all animations');
        console.log('   L - Layer animations (idle + another)');
        console.log('   X - Stop all multi-animations');
        console.log('   1/2 - Adjust animation weights');
    }

    resetCameraView() {
        if (this.controls) {
            // Reset camera position
            this.camera.position.set(0, 1.6, 4);
            this.camera.lookAt(0, 1.6, 0);
            
            // Reset controls target
            this.controls.target.set(0, 1.6, 0);
            this.controls.update();
            
            console.log('📷 Camera view reset');
        }
    }

    setupLights() {
        console.log('💡 Setting up VERY SOFT lighting like Ani...');
        
        // Store original light positions in world space
        this.originalLightPositions = {};
        
        // Very soft ambient light - warm white with very slight pink tint
        this.lights.ambient = new THREE.AmbientLight(0xfff8fa, 0.15);
        this.scene.add(this.lights.ambient);
        console.log('✅ Added very soft warm ambient light with intensity 0.15');
        
        // Very soft rim light - left side (much less bright)
        this.lights.leftRim = new THREE.DirectionalLight(0xffb6c1, 0.8);
        this.lights.leftRim.position.set(-8, 0, 0);
        this.originalLightPositions.leftRim = this.lights.leftRim.position.clone();
        this.scene.add(this.lights.leftRim);
        console.log('✅ Added very soft left rim light with intensity 0.8');
        
        // Very soft rim light - right side (much less bright)
        this.lights.rightRim = new THREE.DirectionalLight(0xffb6c1, 0.8);
        this.lights.rightRim.position.set(8, 0, 0);
        this.originalLightPositions.rightRim = this.lights.rightRim.position.clone();
        this.scene.add(this.lights.rightRim);
        console.log('✅ Added very soft right rim light with intensity 0.8');
        
        // Soft back rim light (brighter)
        this.lights.backRim = new THREE.DirectionalLight(0xffc0cb, 0.6);
        this.lights.backRim.position.set(0, 0, -12);
        this.originalLightPositions.backRim = this.lights.backRim.position.clone();
        this.scene.add(this.lights.backRim);
        console.log('✅ Added soft back rim light with intensity 0.6');
        
        // Soft key light for gentle skin visibility
        this.lights.key = new THREE.DirectionalLight(0xffffff, 1.8);
        this.lights.key.position.set(2, 1, 3);
        this.originalLightPositions.key = this.lights.key.position.clone();
        this.scene.add(this.lights.key);
        console.log('✅ Added soft white key light with intensity 1.8');
        
        // Additional lights from all sides for comprehensive lighting
        
        // Top light
        this.lights.top = new THREE.DirectionalLight(0xfff8fa, 0.8);
        this.lights.top.position.set(0, 8, 0);
        this.originalLightPositions.top = this.lights.top.position.clone();
        this.scene.add(this.lights.top);
        console.log('✅ Added top light with intensity 0.8');
        
        // Bottom light (fill light)
        this.lights.bottom = new THREE.DirectionalLight(0xfff8fa, 0.4);
        this.lights.bottom.position.set(0, -6, 0);
        this.originalLightPositions.bottom = this.lights.bottom.position.clone();
        this.scene.add(this.lights.bottom);
        console.log('✅ Added bottom fill light with intensity 0.4');
        
        // Front light (additional key)
        this.lights.front = new THREE.DirectionalLight(0xffffff, 0.6);
        this.lights.front.position.set(0, 0, 8);
        this.originalLightPositions.front = this.lights.front.position.clone();
        this.scene.add(this.lights.front);
        console.log('✅ Added front light with intensity 0.6');
        
        // Make all directional lights target the character's position (fixed in world space)
        const targetPosition = new THREE.Vector3(0, 0, 0);
        Object.values(this.lights).forEach(light => {
            if (light.type === 'DirectionalLight') {
                // Create a target object for each directional light
                const target = new THREE.Object3D();
                target.position.copy(targetPosition);
                this.scene.add(target);
                light.target = target;
            }
        });
        
        // Ensure lights are positioned in world space, not relative to character
        console.log('🌍 Lights positioned in world space:');
        Object.entries(this.lights).forEach(([name, light]) => {
            if (light.position) {
                console.log(`   ${name}: position [${light.position.x}, ${light.position.y}, ${light.position.z}]`);
            }
        });
        
        // Store light targets for later updates
        this.lightTargets = [];
        Object.values(this.lights).forEach(light => {
            if (light.type === 'DirectionalLight' && light.target) {
                this.lightTargets.push(light.target);
            }
        });
        
        console.log('✅ VERY SOFT lighting setup complete!');
        
        // Force scene update to ensure lighting is applied
        this.scene.traverse((child) => {
            if (child.material) {
                child.material.needsUpdate = true;
            }
        });
    }

    // Method to test lighting visibility
    testLighting() {
        console.log('🧪 Testing lighting visibility...');
        
        // Log all lights in scene
        const lights = [];
        this.scene.traverse((child) => {
            if (child.isLight) {
                lights.push({
                    name: child.name || 'unnamed',
                    type: child.type,
                    intensity: child.intensity,
                    color: child.color.getHexString(),
                    position: child.position.toArray()
                });
            }
        });
        
        console.log('💡 Lights in scene:', lights);
        
        // Force a render update
        this.renderer.render(this.scene, this.camera);
        console.log('✅ Forced render update');
    }

    // Method to fix hair materials specifically
    fixHairMaterials() {
        console.log('💇‍♀️ Fixing hair materials...');
        
        this.character.traverse((child) => {
            if (child.isMesh && (child.name.toLowerCase().includes('hair') || child.name.toLowerCase().includes('head'))) {
                console.log(`🔧 Found hair/head mesh: ${child.name}`);
                
                if (child.material) {
                    // For hair, try to preserve original material properties
                    if (child.material.type === 'MeshBasicMaterial') {
                        console.log(`   Converting hair material to MeshLambertMaterial`);
                        
                        const newMaterial = new THREE.MeshLambertMaterial({
                            color: child.material.color || 0x8B4513, // Brown hair color
                            map: child.material.map,
                            transparent: true,
                            opacity: 0.9,
                            side: THREE.DoubleSide
                        });
                        child.material = newMaterial;
                        console.log(`   ✅ Hair material fixed`);
                    }
                }
            }
        });
    }

    // Method to force ALL materials to respond to lighting
    forceAllMaterialsToLighting() {
        console.log('💡 Forcing ALL materials to respond to lighting...');
        
        this.character.traverse((child) => {
            if (child.isMesh) {
                console.log(`🔧 Processing mesh: ${child.name}`);
                
                if (child.material) {
                    console.log(`   Original material type: ${child.material.type}`);
                    console.log(`   Original material color: ${child.material.color ? child.material.color.getHexString() : 'none'}`);
                    
                    // Only convert if it's a basic material that ignores lighting
                    if (child.material.type === 'MeshBasicMaterial') {
                        console.log(`   Converting MeshBasicMaterial to MeshLambertMaterial for lighting`);
                        
                        // Convert to MeshLambertMaterial for lighting
                        const newMaterial = new THREE.MeshLambertMaterial({
                            color: child.material.color || 0xffffff,
                            map: child.material.map,
                            transparent: child.material.transparent,
                            opacity: child.material.opacity,
                            side: child.material.side || THREE.FrontSide
                        });
                        
                        child.material = newMaterial;
                        child.material.needsUpdate = true;
                        console.log(`   ✅ Converted ${child.name} to MeshLambertMaterial`);
                    } else {
                        // For other materials, just ensure they're updated
                        child.material.needsUpdate = true;
                        console.log(`   ✅ ${child.material.type} material updated for ${child.name}`);
                    }
                }
            }
        });
        
        console.log('✅ Materials processed for lighting!');
    }

    // Method to specifically force skin materials to respond to lighting
    forceSkinMaterialsToLighting() {
        console.log('👤 Forcing skin materials to respond to lighting...');
        
        this.character.traverse((child) => {
            if (child.isMesh) {
                // Look for skin-related meshes
                const meshName = child.name.toLowerCase();
                const isSkinMesh = meshName.includes('skin') || 
                                  meshName.includes('body') || 
                                  meshName.includes('face') || 
                                  meshName.includes('head') ||
                                  meshName.includes('arm') ||
                                  meshName.includes('leg') ||
                                  meshName.includes('hand') ||
                                  meshName.includes('foot') ||
                                  meshName.includes('torso') ||
                                  meshName.includes('chest') ||
                                  meshName.includes('neck') ||
                                  meshName.includes('shoulder') ||
                                  meshName.includes('waist') ||
                                  meshName.includes('hip');
                
                if (isSkinMesh) {
                    console.log(`🔧 Found skin mesh: ${child.name}`);
                    console.log(`   Material type: ${child.material.type}`);
                    console.log(`   Material color: ${child.material.color ? child.material.color.getHexString() : 'none'}`);
                    
                    // Force convert to MeshLambertMaterial regardless of current type
                    const newMaterial = new THREE.MeshLambertMaterial({
                        color: child.material.color || 0xffdbac, // Default skin color
                        map: child.material.map,
                        transparent: child.material.transparent,
                        opacity: child.material.opacity || 1.0,
                        side: child.material.side || THREE.FrontSide
                    });
                    
                    child.material = newMaterial;
                    child.material.needsUpdate = true;
                    console.log(`   ✅ Converted skin material to MeshLambertMaterial`);
                    console.log(`   ✅ New material color: ${newMaterial.color.getHexString()}`);
                }
            }
        });
        
        // Also force ALL materials to respond to lighting as a backup
        console.log('🔧 Force converting ALL materials to respond to lighting...');
        this.character.traverse((child) => {
            if (child.isMesh && child.material) {
                // Convert any material that's not already lighting-responsive
                if (child.material.type === 'MeshBasicMaterial') {
                    const newMaterial = new THREE.MeshLambertMaterial({
                        color: child.material.color || 0xffffff,
                        map: child.material.map,
                        transparent: child.material.transparent,
                        opacity: child.material.opacity || 1.0,
                        side: child.material.side || THREE.FrontSide
                    });
                    child.material = newMaterial;
                    child.material.needsUpdate = true;
                    console.log(`   ✅ Converted ${child.name} to MeshLambertMaterial`);
                }
            }
        });
        
        console.log('✅ Skin materials forced to respond to lighting!');
    }

    // Method to debug ALL materials and force lighting response
    debugAllMaterials() {
        console.log('🔍 Debugging ALL materials...');
        
        this.character.traverse((child) => {
            if (child.isMesh) {
                console.log(`📋 Mesh: ${child.name}`);
                console.log(`   Material type: ${child.material.type}`);
                console.log(`   Material color: ${child.material.color ? child.material.color.getHexString() : 'none'}`);
                console.log(`   Material name: ${child.material.name || 'unnamed'}`);
                
                // Only convert MeshBasicMaterial to MeshLambertMaterial (safer approach)
                if (child.material.type === 'MeshBasicMaterial') {
                    const newMaterial = new THREE.MeshLambertMaterial({
                        color: child.material.color || 0xffffff,
                        map: child.material.map,
                        transparent: child.material.transparent,
                        opacity: child.material.opacity || 1.0,
                        side: child.material.side || THREE.FrontSide
                    });
                    
                    child.material = newMaterial;
                    child.material.needsUpdate = true;
                    console.log(`   ✅ Converted MeshBasicMaterial to MeshLambertMaterial`);
                } else {
                    console.log(`   ⚠️  Keeping ${child.material.type} as is`);
                }
            }
        });
        
        console.log('✅ Materials debugged and safely converted!');
    }

    setupRenderer() {
        console.log('🎨 Setting up WebGL renderer...');
        
        // Create WebGL renderer (following tutorial pattern)
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        
        // Set renderer size (following tutorial pattern)
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable shadows (following tutorial pattern)
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Add renderer to container (following tutorial pattern)
        this.container.appendChild(this.renderer.domElement);
        
        console.log('✅ Renderer setup complete');
    }



    async loadCharacter() {
        console.log('👤 Loading character model...');
        
        if (this.usePlaceholder) {
            console.log('Using placeholder character');
            await this.createPlaceholderCharacter();
        } else {
            await this.loadGLBModel();
        }
        
        console.log('✅ Character loaded successfully!');
    }

    // Utility method to adjust model scale
    setModelScale(scale) {
        if (this.character) {
            this.character.scale.set(scale, scale, scale);
            console.log(`📏 Model scale set to: ${scale}`);
        }
    }

    // Utility method to get current model scale
    getModelScale() {
        if (this.character) {
            return this.character.scale.x;
        }
        return 1;
    }

    // Utility method to log current animation status
    logAnimationStatus() {
        if (this.activeAction) {
            const action = this.activeAction;
            const clip = action._clip;
            console.log(`ANIMATION STATUS: ${clip.name}`);
            console.log(`   Running: ${action.isRunning()}`);
            console.log(`   Time: ${action.time.toFixed(2)}s / ${clip.duration.toFixed(2)}s`);
            console.log(`   Speed: ${action.getEffectiveTimeScale()}`);
            console.log(`   Loop: ${action.loop === THREE.LoopRepeat ? 'Repeat' : 'Once'}`);
            console.log(`   Weight: ${action.getEffectiveWeight()}`);
        } else {
            console.log('ANIMATION STATUS: No active animation');
        }
        
        // Log multi-animation status
        if (Object.keys(this.activeActions).length > 0) {
            console.log('MULTI-ANIMATION STATUS:');
            Object.entries(this.activeActions).forEach(([name, action]) => {
                console.log(`   ${name}: Running=${action.isRunning()}, Weight=${action.getEffectiveWeight().toFixed(2)}`);
            });
        }
    }

    // Multi-animation system methods (inspired by three-gltf-viewer)
    
    /**
     * Play multiple animations simultaneously
     * @param {string[]} animationNames - Array of animation names to play
     * @param {Object} options - Options for multi-animation
     */
    playMultipleAnimations(animationNames, options = {}) {
        const {
            weights = {}, // Custom weights for each animation
            fadeInDuration = 0.5,
            blendMode = 'additive' // 'additive' or 'override'
        } = options;

        console.log(`🎭 Playing multiple animations: ${animationNames.join(', ')}`);

        animationNames.forEach(name => {
            if (this.actions[name]) {
                // Get or create action
                let action = this.activeActions[name];
                if (!action) {
                    action = this.animationMixer.clipAction(this.actions[name]._clip);
                    this.activeActions[name] = action;
                }

                // Set weight (default to 1.0 if not specified)
                const weight = weights[name] !== undefined ? weights[name] : 1.0;
                action.setEffectiveWeight(weight);
                this.animationWeights[name] = weight;

                // Set animation speed based on type
                if (name.toLowerCase().includes('idle')) {
                    action.setEffectiveTimeScale(0.70); // Idle speed (30% slower)
                } else {
                    action.setEffectiveTimeScale(1.0); // Normal speed for actions
                }

                // Play the action
                action.reset().fadeIn(fadeInDuration).play();
                this.actionStates[name] = true;

                console.log(`   ▶️ Started: ${name} (weight: ${weight})`);
            } else {
                console.warn(`   ⚠️ Animation '${name}' not found`);
            }
        });
    }

    /**
     * Stop specific animations while keeping others running
     * @param {string[]} animationNames - Animations to stop
     * @param {number} fadeOutDuration - Fade out duration
     */
    stopAnimations(animationNames, fadeOutDuration = 0.5) {
        console.log(`🛑 Stopping animations: ${animationNames.join(', ')}`);

        animationNames.forEach(name => {
            const action = this.activeActions[name];
            if (action && action.isRunning()) {
                action.fadeOut(fadeOutDuration);
                this.actionStates[name] = false;
                console.log(`   ⏹️ Stopped: ${name}`);
            }
        });
    }

    /**
     * Update animation weights for blending
     * @param {Object} weights - New weights for animations
     * @param {number} fadeDuration - Duration for weight transitions
     */
    updateAnimationWeights(weights, fadeDuration = 0.3) {
        Object.entries(weights).forEach(([name, weight]) => {
            const action = this.activeActions[name];
            if (action) {
                action.setEffectiveWeight(weight);
                this.animationWeights[name] = weight;
                console.log(`   📊 Updated weight for ${name}: ${weight}`);
            }
        });
    }

    /**
     * Play all available animations (like three-gltf-viewer's playAllClips)
     */
    playAllAnimations() {
        const allAnimations = Object.keys(this.actions);
        console.log(`🎬 Playing all animations: ${allAnimations.join(', ')}`);
        
        // Set lower weights so they don't overpower each other
        const weights = {};
        allAnimations.forEach(name => {
            weights[name] = 0.5; // Lower weight for all animations
        });
        
        this.playMultipleAnimations(allAnimations, { weights });
    }

    /**
     * Stop all multi-animations and return to single animation mode
     */
    stopAllMultiAnimations() {
        console.log('🛑 Stopping all multi-animations');
        
        Object.keys(this.activeActions).forEach(name => {
            const action = this.activeActions[name];
            if (action && action.isRunning()) {
                action.fadeOut(0.5);
                this.actionStates[name] = false;
            }
        });
        
        this.activeActions = {};
        this.actionStates = {};
        this.animationWeights = {};
    }

    /**
     * Layer animations with different weights (e.g., idle + facial expression)
     * @param {string} baseAnimation - Base animation (usually idle)
     * @param {string} layerAnimation - Animation to layer on top
     * @param {number} layerWeight - Weight of the layered animation (0-1)
     */
    layerAnimations(baseAnimation, layerAnimation, layerWeight = 0.5) {
        console.log(`🎭 Layering animations: ${baseAnimation} + ${layerAnimation} (weight: ${layerWeight})`);
        
        // Play base animation with full weight
        this.playMultipleAnimations([baseAnimation], { weights: { [baseAnimation]: 1.0 } });
        
        // Add layer animation with specified weight
        setTimeout(() => {
            this.playMultipleAnimations([layerAnimation], { 
                weights: { [layerAnimation]: layerWeight },
                fadeInDuration: 0.3
            });
        }, 100);
    }

    async loadGLBModel() {
        console.log('📁 Loading GLB model from:', this.modelPath);
        
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            
            loader.load(
                this.modelPath,
                (gltf) => {
                    console.log('✅ GLB model loaded successfully:', gltf);
                    console.log('Scene children:', gltf.scene.children.length);
                    console.log('Animations:', gltf.animations ? gltf.animations.length : 0);
                    
                    // Get the main mesh from the loaded model
                    this.character = gltf.scene;
                    
                    // Scale the model to appropriate size (15% bigger)
                    this.character.scale.set(0.575, 0.575, 0.575);
                    
                    // Position character properly (moved down 0.5 on Y)
                    this.character.position.set(0, -0.5, 0);
                    
                    // Enable shadows and fix materials for lighting
                    this.character.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Ensure geometry has vertex normals for proper lighting
                    if (child.geometry && (!child.geometry.attributes?.normal || child.geometry.attributes.normal.count === 0)) {
                        console.log(`🔧 Computing vertex normals for: ${child.name}`);
                        try {
                            child.geometry.computeVertexNormals();
                            if (child.geometry.attributes?.normal) {
                                child.geometry.attributes.normal.needsUpdate = true;
                            }
                            console.log(`   ✅ Vertex normals computed for ${child.name}`);
                        } catch (e) {
                            console.warn(`   ⚠️ Failed to compute vertex normals for ${child.name}:`, e);
                        }
                    }
                    
                    // Smart material handling for lighting
                    if (child.material) {
                        console.log(`🔧 Checking material for mesh: ${child.name}`);
                        console.log(`   Material type: ${child.material.type}`);
                        console.log(`   Material color: ${child.material.color ? child.material.color.getHexString() : 'none'}`);
                        
                        // Force convert ALL materials to respond to lighting
                        if (child.material.type === 'MeshBasicMaterial') {
                            console.log(`   Converting MeshBasicMaterial to MeshLambertMaterial for lighting`);
                            
                            // Use MeshLambertMaterial instead - better for hair and skin
                            const newMaterial = new THREE.MeshLambertMaterial({
                                color: child.material.color || 0xffffff,
                                map: child.material.map,
                                transparent: child.material.transparent,
                                opacity: child.material.opacity,
                                side: child.material.side
                            });
                            child.material = newMaterial;
                            console.log(`   ✅ Converted to MeshLambertMaterial`);
                        } else if (child.material.type === 'MeshStandardMaterial') {
                            // Already good for lighting, just ensure it's updated
                            child.material.needsUpdate = true;
                            console.log(`   ✅ MeshStandardMaterial already good for lighting`);
            } else {
                            // For other material types, just ensure they're updated
                            child.material.needsUpdate = true;
                            console.log(`   ✅ ${child.material.type} material updated`);
                        }
                        
                        // Force material update regardless
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            // Force skin materials to respond to lighting specifically
            this.forceSkinMaterialsToLighting();
            

            
            this.scene.add(this.character);
            
            // Create animation mixer (following tutorial pattern)
            this.animationMixer = new THREE.AnimationMixer(this.character);
            
            // Create actions from animations (following tutorial pattern)
            if (gltf.animations && gltf.animations.length > 0) {
                gltf.animations.forEach((clip) => {
                    const action = this.animationMixer.clipAction(clip);
                    action.enabled = true;
                    this.actions[clip.name] = action;
                    
                    // Add animation end event listener
                    this.animationMixer.addEventListener('finished', (event) => {
                        if (event.action === action) {
                            console.log(`🏁 ANIMATION FINISHED: ${clip.name} (duration: ${clip.duration.toFixed(2)}s)`);
                        }
                    });
                    
                    // Add animation loop event listener
                    this.animationMixer.addEventListener('loop', (event) => {
                        if (event.action === action) {
                            console.log(`🔄 ANIMATION LOOPED: ${clip.name} (loop count: ${action._loopCount || 0})`);
                        }
                    });
                    
                    // Add animation start event listener
                    this.animationMixer.addEventListener('start', (event) => {
                        if (event.action === action) {
                            console.log(`ANIMATION STARTED: ${clip.name}`);
                        }
                    });
                    
                    // Add animation pause event listener
                    this.animationMixer.addEventListener('pause', (event) => {
                        if (event.action === action) {
                            console.log(`⏸️ ANIMATION PAUSED: ${clip.name}`);
                        }
                    });
                    
                    // Add animation resume event listener
                    this.animationMixer.addEventListener('resume', (event) => {
                        if (event.action === action) {
                            console.log(`▶️ ANIMATION RESUMED: ${clip.name}`);
                        }
                        });
                    });
                
                console.log('Loaded animations:', gltf.animations.length);
                console.log('Available actions:', Object.keys(this.actions));
            }
            
            // Test lighting after character loads
            this.testLighting();
            
            // Fix hair materials specifically
            this.fixHairMaterials();
            
            // Force ALL materials to respond to lighting (including skin)
            this.forceAllMaterialsToLighting();
            
            // Specifically force skin materials to respond to lighting
            this.forceSkinMaterialsToLighting();
            
            // Debug ALL materials to see what's happening
            this.debugAllMaterials();
            
            // Initialize animation manager
            if (window.heartSystem && window.heartSystem.animationManager) {
                this.animationManager = window.heartSystem.animationManager;
                await this.animationManager.initialize(this.character, this.animationMixer);
                
                // Start idle animation after everything is loaded
                console.log('Animation config loaded:', this.animationManager.animationConfig);
                console.log('Idle animation from config:', this.animationManager.animationConfig?.animations?.idle?.animation);
                
                if (this.animationManager.animationConfig?.animations?.idle?.animation) {
                    const idleAnimation = this.animationManager.animationConfig.animations.idle.animation;
                    
                    // Check if the idle animation exists in the loaded model
                    if (this.actions[idleAnimation]) {
                        this.startFirstAnimation(idleAnimation);
                        console.log(`Started idle animation from config: ${idleAnimation}`);
                    } else {
                        console.warn(`Idle animation '${idleAnimation}' from config not found in model. Available animations:`, Object.keys(this.actions));
                        
                        // Fallback to first available animation
                        const availableAnimations = Object.keys(this.actions);
                        if (availableAnimations.length > 0) {
                            const fallbackAnimation = availableAnimations[0];
                            this.startFirstAnimation(fallbackAnimation);
                            console.log(`Using fallback animation: ${fallbackAnimation}`);
                        }
                    }
                } else {
                    console.warn('No idle animation configured in JSON config');
                }
            } else {
                console.warn('Animation manager not found in HeartSystem - will retry later');
                // Store a flag to retry animation manager initialization later
                this.needsAnimationManagerInit = true;
            }
            
        } catch (error) {
            console.error('❌ Failed to load GLB model:', error);
            throw error;
        }
    }

    analyzeGLTFStructure(gltf) {
        console.log('Analyzing GLTF structure...');
        console.log('Scene:', gltf.scene);
        console.log('Animations:', gltf.animations);
        console.log('Asset:', gltf.asset);
        
        // Log animation details
        if (gltf.animations) {
            gltf.animations.forEach((clip, index) => {
                console.log(`Animation ${index + 1}: "${clip.name}" (Duration: ${clip.duration.toFixed(2)}s)`);
            });
        }
    }

    readShapekeys() {
        if (this.character) {
            let totalShapekeys = 0;
        this.character.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary) {
                    const shapekeyNames = Object.keys(child.morphTargetDictionary);
                    totalShapekeys += shapekeyNames.length;
                    
                    console.log('Found shapekeys for mesh:', child.name);
                    console.log('Shapekey names:', shapekeyNames);
                    console.log('Total shapekeys in this mesh:', shapekeyNames.length);
                }
            });
            console.log('Total shapekeys found:', totalShapekeys);
        }
    }

    async createPlaceholderCharacter() {
        console.log('Creating placeholder character...');
        
        // Create a simple cube as placeholder
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.character = new THREE.Mesh(geometry, material);
        
        this.character.position.set(0, 1, 0);
        this.character.castShadow = true;
        this.character.receiveShadow = true;
        
        this.scene.add(this.character);
        
        // Create animation mixer for placeholder
        this.animationMixer = new THREE.AnimationMixer(this.character);
        
        // Add a simple rotation animation
        this.addIdleAnimation();
    }

    addIdleAnimation() {
        // Create a simple rotation animation for placeholder
        const rotationTrack = new THREE.VectorKeyframeTrack(
            '.rotation[y]',
            [0, 2],
            [0, Math.PI * 2]
        );
        
        const clip = new THREE.AnimationClip('idle', 2, [rotationTrack]);
        const action = this.animationMixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        this.actions['idle'] = action;
        
        console.log('Added placeholder idle animation');
    }

    // Animation loop (following tutorial pattern)
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Get delta time (following tutorial pattern)
        const delta = this.clock.getDelta();
        
        // Update animation mixer (following tutorial pattern)
        if (this.animationMixer) {
            this.animationMixer.update(delta);
        }
        
        // Update animation manager (ensures continuous animation)
        if (window.heartSystem?.animationManager) {
            window.heartSystem.animationManager.updateAnimations(delta);
        }
        
        // Update controls (following tutorial pattern)
        if (this.controls) {
            this.controls.update();
        }
        
                // Render scene (following tutorial pattern)
        this.renderer.render(this.scene, this.camera);
        
        // Update O shapekey when not talking
        this.updateOShapekey();
        
        // Update light targets to follow character
        this.updateLightTargets();
    }

    // Method to set O shapekey to 0.2 when not talking
    updateOShapekey() {
        if (!this.character) return;
        
        // Check if AI is currently talking
        const isTalking = window.heartSystem?.animationManager?.speechState?.isSpeaking || false;
        
        if (!isTalking) {
            // Set O shapekey to 0.2 when not talking
            this.character.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary) {
                    const oIndex = child.morphTargetDictionary['O'];
                    if (oIndex !== undefined) {
                        child.morphTargetInfluences[oIndex] = 0.2;
                    }
                }
            });
        }
    }

    // Method to update light targets to follow character position
    updateLightTargets() {
        if (!this.character || !this.lightTargets) return;
        
        // Get character's world position
        const characterPosition = new THREE.Vector3();
        this.character.getWorldPosition(characterPosition);
        
        // Update all light targets to point at character
        this.lightTargets.forEach(target => {
            target.position.copy(characterPosition);
        });
        
        // Reset lights to their original world positions (counter scene rotation)
        if (this.originalLightPositions) {
            Object.entries(this.originalLightPositions).forEach(([lightName, originalPosition]) => {
                const light = this.lights[lightName];
                if (light && light.position) {
                    // Reset to original world position
                    light.position.copy(originalPosition);
                }
            });
        }
    }

    // 🎭 MODULAR CROSSFADE SYSTEM (following Three.js best practices)
    
    setWeight(action, weight) {
                action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(weight);
    }
    
    prepareCrossFade(startAction, endAction, duration) {
        if (this.currentAnimation === 'idle' || !startAction || !endAction) {
            this.executeCrossFade(startAction, endAction, duration);
                    } else {
            this.synchronizeCrossFade(startAction, endAction, duration);
        }
    }
    
    synchronizeCrossFade(startAction, endAction, duration) {
        this.animationMixer.addEventListener('loop', this.onLoopFinished);
        
        this.onLoopFinished = (event) => {
            if (event.action === startAction) {
                this.animationMixer.removeEventListener('loop', this.onLoopFinished);
                this.executeCrossFade(startAction, endAction, duration);
            }
        };
    }
    
    executeCrossFade(startAction, endAction, duration) {
        if (endAction) {
            this.setWeight(endAction, 1);
            endAction.time = 0;
            
            if (startAction) {
                startAction.crossFadeTo(endAction, duration, true);
            } else {
                endAction.fadeIn(duration);
            }
        } else {
            startAction.fadeOut(duration);
        }
    }

    // Helper method to detect action animations
    isActionAnimation(animationName) {
        const actionKeywords = ['wave', 'point', 'nod', 'shake', 'dance', 'fight', 'jump', 'walk', 'run', 'handshake', 'confused'];
        const name = animationName.toLowerCase();
        return actionKeywords.some(keyword => name.includes(keyword));
    }

    // Play action with transition queuing (following Three.js best practices)
    playAction(name, duration = this.fadeDuration) {
        if (!this.actions[name]) {
            console.warn(`Animation '${name}' not found`);
            return;
        }

        this.previousAction = this.activeAction;
        this.activeAction = this.actions[name];

        if (this.previousAction !== this.activeAction) {
            console.log(`PLAYING ANIMATION: ${name}`);
            
            // Log when previous animation is stopped
            if (this.previousAction && this.previousAction.isRunning()) {
                console.log(`⏹️ STOPPING PREVIOUS ANIMATION: ${this.previousAction._clip.name}`);
            }
            
            // Set animation speed based on type
        if (name.toLowerCase().includes('idle')) {
            this.activeAction.setEffectiveTimeScale(0.70); // Idle speed (30% slower)
        } else {
            this.activeAction.setEffectiveTimeScale(1.0); // Normal speed for actions
        }
            
            if (this.previousAction) {
                // Simple crossfade
                this.previousAction.fadeOut(duration);
                this.activeAction.reset().fadeIn(duration).play();
        } else {
                // First animation
                this.activeAction.reset().fadeIn(duration).play();
            }
        }
        
        this.currentAnimation = name;
        this.isAnimating = true;
        console.log(`✅ ANIMATION PLAYING: ${name} (speed: ${this.activeAction.getEffectiveTimeScale()})`);
    }

    // Play action animation with proper idle → action → idle sequence
    playActionAnimation(actionName, speechDuration) {
        if (!this.actions[actionName]) {
            console.warn(`❌ Action animation '${actionName}' not found`);
            console.log(`Available actions:`, Object.keys(this.actions));
            return;
        }

        console.log(`🎬 Starting action sequence: idle → ${actionName} → idle`);
        
        // Step 1: Crossfade out current animation
        const currentIdleAction = this.activeAction;
        if (currentIdleAction) {
            console.log(`🔄 Crossfading out current animation: ${this.currentAnimation}`);
            currentIdleAction.fadeOut(0.3); // Quick fade out
        }
        
        // Step 2: Crossfade in action animation
        const actionAnimation = this.actions[actionName];
        actionAnimation.setLoop(THREE.LoopOnce, 1); // Play once
        actionAnimation.clampWhenFinished = false; // Don't stay in final pose
        actionAnimation.setEffectiveTimeScale(0.2); // 20% speed
        actionAnimation.reset();
        actionAnimation.fadeIn(0.3); // Quick fade in
        actionAnimation.play();
        
        this.activeAction = actionAnimation;
        this.currentAnimation = actionName;
        
        console.log(`▶️ Action animation started: ${actionName}`);
        
        // Step 3: After action completes, return to idle
        const actionDuration = actionAnimation._clip.duration;
        
        console.log(`⏱️ Action will play for ${actionDuration.toFixed(2)}s`);
        
        setTimeout(() => {
            console.log(`🔄 Action complete, crossfading back to idle`);
            
            // Crossfade out action animation
            actionAnimation.fadeOut(0.5);
            
            // Crossfade in idle animation
            this.startIdleAnimationWithFade();
            
        }, actionDuration * 1000);
        
        console.log(`✅ Action sequence started: ${actionName} (${actionDuration.toFixed(2)}s)`);
    }

    // Helper method to start idle animation
    startIdleAnimation() {
        // If already in idle, don't restart - just continue
        if (this.currentAnimation === 'idle') {
            console.log(`🔄 Already in idle, no restart needed`);
            return;
        }
        
        const idleAnimationName = 'idle';
        if (this.actions[idleAnimationName]) {
            const idleAction = this.actions[idleAnimationName];
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            idleAction.setEffectiveTimeScale(0.225); // Use the slow speed
            idleAction.reset();
            idleAction.play();
            
            this.activeAction = idleAction;
            this.currentAnimation = idleAnimationName;
            
            console.log(`🔄 Idle animation restarted`);
        }
    }

    // Helper method to start idle animation with fade in
    startIdleAnimationWithFade() {
        // If already in idle, don't crossfade - just continue
        if (this.currentAnimation === 'idle') {
            console.log(`🔄 Already in idle, no crossfade needed`);
            return;
        }
        
        const idleAnimationName = 'idle';
        if (this.actions[idleAnimationName]) {
            const idleAction = this.actions[idleAnimationName];
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            idleAction.setEffectiveTimeScale(0.225); // Use the slow speed
            idleAction.reset();
            idleAction.fadeIn(0.5); // Smooth fade in
            idleAction.play();
            
            this.activeAction = idleAction;
            this.currentAnimation = idleAnimationName;
            
            console.log(`🔄 Idle animation restarted with fade`);
        }
    }

    // Force stop action animation and return to idle
    forceStopActionAndReturnToIdle() {
        if (this.activeAction && this.currentAnimation !== 'idle') {
            console.log(`🛑 Force stopping action animation: ${this.currentAnimation}`);
            
            // Fade out current action
            this.activeAction.fadeOut(0.3);
            
            // Start idle with fade in
            setTimeout(() => {
                this.startIdleAnimationWithFade();
            }, 100); // Small delay to let fade out start
        }
    }

    // Start first animation with proper looping
    startFirstAnimation(animationName) {
        console.log(`STARTING ANIMATION: ${animationName}`);
        console.log(`Available actions:`, Object.keys(this.actions));
        console.log(`Looking for action: ${animationName}`);
        
        if (this.actions[animationName]) {
            this.activeAction = this.actions[animationName];
            
            // Ensure proper looping for idle animations
            if (animationName.toLowerCase().includes('idle')) {
                // Create a shorter version of the idle animation
                const originalClip = this.activeAction._clip;
                const shorterClip = this.createShorterIdleAnimation(originalClip);
                
                // Create new action with the shorter clip
                const shorterAction = this.animationMixer.clipAction(shorterClip);
                shorterAction.setLoop(THREE.LoopRepeat, Infinity);
                shorterAction.clampWhenFinished = false;
                shorterAction.setEffectiveTimeScale(0.30); // Set idle speed (30% slower)
                
                // Replace the original action with the shorter one
                this.activeAction = shorterAction;
                console.log(`✂️ Created shorter idle animation: ${originalClip.duration.toFixed(2)}s → ${shorterClip.duration.toFixed(2)}s`);
            }
            
            this.activeAction.play();
            
            this.currentAnimation = animationName;
            this.isAnimating = true;
            console.log(`✅ ANIMATION STARTED: ${animationName} (speed: ${this.activeAction.getEffectiveTimeScale()})`);
        } else {
            console.warn(`⚠️ Animation '${animationName}' not found`);
            console.log(`Available animations:`, Object.keys(this.actions));
        }
    }

    // Create a shorter version of idle animation using AnimationUtils.subclip
    createShorterIdleAnimation(originalClip) {
        const fps = 30; // Assuming 30fps, adjust if needed
        const totalFrames = Math.floor(originalClip.duration * fps);
        
        // Take only the first 50% of the animation (adjust this percentage as needed)
        const endFrame = Math.floor(totalFrames * 0.354);
        
        // Create shorter clip using AnimationUtils.subclip
        const shorterClip = THREE.AnimationUtils.subclip(
            originalClip,
            originalClip.name + '_short',
            0, // startFrame
            endFrame, // endFrame
            fps
        );
        
        console.log(`✂️ Shortened idle animation: ${originalClip.duration.toFixed(2)}s → ${shorterClip.duration.toFixed(2)}s`);
        return shorterClip;
    }

    // Pre-load animation to prevent T-pose
    preloadAnimation(animationName) {
        if (this.animationMixer) {
            const action = this.animationMixer._actions.find(action => action._clip.name === animationName);
            if (action) {
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = false;
                action.timeScale = 0.4;
                action.enabled = true;
                action.reset();
                console.log(`📦 Pre-loaded animation: ${animationName}`);
            }
        }
    }

    // Background methods (following tutorial pattern)
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
            // Prevent background stretching by using proper texture settings
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
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
                // For now, just switch to the target image
                if (blendValues.toImage) {
                    this.scene.background = blendValues.toImage;
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
                    this.scene.background = toBackground.image;
                }
            }
        }
    }

    resetTransitionPlane() {
        if (this.transitionPlane) {
            this.transitionPlane.material.opacity = 0.0;
        }
    }

    // Create transition plane for smooth background transitions
    createTransitionPlane() {
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            depthTest: false,
            depthWrite: false
        });
        
        this.transitionPlane = new THREE.Mesh(geometry, material);
        this.transitionPlane.position.z = -1;
        this.scene.add(this.transitionPlane);
    }

    // Utility methods
    setCrossfadeDuration(duration) {
        this.fadeDuration = duration;
        console.log(`Crossfade duration set to ${duration}s`);
    }

    disableCrossfade() {
        this.fadeDuration = 0;
        console.log('Crossfade disabled - instant transitions');
    }

    enableCrossfade() {
        this.fadeDuration = 1.0;
        console.log('Crossfade enabled with 1.0s duration');
    }



    // Retry animation manager initialization
    async retryAnimationManagerInit() {
        if (this.needsAnimationManagerInit && window.heartSystem && window.heartSystem.animationManager) {
            console.log('Retrying animation manager initialization...');
            this.animationManager = window.heartSystem.animationManager;
            
            // Force reload the config to ensure we get the latest version
            await this.animationManager.loadAnimationConfig();
            await this.animationManager.initialize(this.character, this.animationMixer);
            
            // Start idle animation after everything is loaded
            console.log('Animation config loaded:', this.animationManager.animationConfig);
            console.log('Idle animation from config:', this.animationManager.animationConfig?.animations?.idle?.animation);
            
            if (this.animationManager.animationConfig?.animations?.idle?.animation) {
                const idleAnimation = this.animationManager.animationConfig.animations.idle.animation;
                
                // Check if the idle animation exists in the loaded model
                if (this.actions[idleAnimation]) {
                    this.startFirstAnimation(idleAnimation);
                    console.log(`Started idle animation from config: ${idleAnimation}`);
                } else {
                    console.warn(`Idle animation '${idleAnimation}' from config not found in model. Available animations:`, Object.keys(this.actions));
                    
                    // Fallback to first available animation
                    const availableAnimations = Object.keys(this.actions);
                    if (availableAnimations.length > 0) {
                        const fallbackAnimation = availableAnimations[0];
                        this.startFirstAnimation(fallbackAnimation);
                        console.log(`Using fallback animation: ${fallbackAnimation}`);
                    }
                }
            } else {
                console.warn('No idle animation configured in JSON config');
            }
            
            this.needsAnimationManagerInit = false;
        }
    }

    // Cleanup
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.animationMixer) {
            this.animationMixer.stopAllAction();
        }
        if (this.controls) {
            this.controls.dispose();
        }
        console.log('Renderer disposed');
    }
} 