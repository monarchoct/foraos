/**
 * Unity Manager - Replaces Three.js Renderer
 * Handles Unity WebGL integration for 3D character rendering
 */

export class UnityManager {
    constructor() {
        this.unityInstance = null;
        this.isLoaded = false;
        this.isInitializing = false;
        this.container = null;
        this.canvas = null;
        this.loadingBar = null;
        
        // Unity build configuration
        this.config = {
            dataUrl: 'unity-build/Build/HeartSystem.data',
            frameworkUrl: 'unity-build/Build/HeartSystem.framework.js',
            codeUrl: 'unity-build/Build/HeartSystem.wasm',
            streamingAssetsUrl: 'StreamingAssets',
            companyName: 'HEART System',
            productName: 'AI Companion',
            productVersion: '1.0',
            showBanner: false,
        };
    }

    async initialize() {
        if (this.isInitializing || this.isLoaded) {
            return;
        }

        console.log('🎮 Initializing Unity WebGL...');
        this.isInitializing = true;

        try {
            // Get container (same as Three.js used)
            this.container = document.getElementById('three-container');
            if (!this.container) {
                throw new Error('Unity container not found');
            }

            // Create Unity-specific elements
            this.setupUnityHTML();
            
            // Load Unity WebGL
            await this.loadUnityWebGL();
            
            console.log('✅ Unity initialized successfully!');
            
        } catch (error) {
            console.error('❌ Unity initialization failed:', error);
            this.createFallbackRenderer();
        } finally {
            this.isInitializing = false;
        }
    }

    setupUnityHTML() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create Unity canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'unity-canvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.background = '#231F20';
        this.canvas.style.display = 'block';
        
        // Create loading bar
        this.loadingBar = document.createElement('div');
        this.loadingBar.id = 'unity-loading-bar';
        this.loadingBar.innerHTML = `
            <div id="unity-logo" style="
                width: 154px; 
                height: 130px; 
                background: url('unity-build/TemplateData/unity-logo-dark.png') no-repeat center; 
                background-size: contain;
                margin: 20px auto;
            "></div>
            <div id="unity-progress-bar-empty" style="
                width: 141px; 
                height: 18px; 
                margin: 10px auto; 
                background: url('unity-build/TemplateData/progress-bar-empty-dark.png') no-repeat center; 
                background-size: contain;
                position: relative;
            ">
                <div id="unity-progress-bar-full" style="
                    width: 0%; 
                    height: 18px; 
                    background: url('unity-build/TemplateData/progress-bar-full-dark.png') no-repeat center; 
                    background-size: contain;
                "></div>
            </div>
        `;
        this.loadingBar.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            z-index: 1000;
        `;

        // Add elements to container
        this.container.appendChild(this.canvas);
        this.container.appendChild(this.loadingBar);
    }

    async loadUnityWebGL() {
        return new Promise((resolve, reject) => {
            // Check if Unity loader already exists
            if (window.createUnityInstance) {
                this.createUnityInstance(resolve, reject);
                return;
            }

            // Load Unity loader script
            const script = document.createElement('script');
            script.src = 'unity-build/Build/HeartSystem.loader.js';
            script.onload = () => {
                this.createUnityInstance(resolve, reject);
            };
            script.onerror = () => {
                reject(new Error('Failed to load Unity loader script'));
            };
            
            document.head.appendChild(script);
        });
    }

    createUnityInstance(resolve, reject) {
        const progressBarFull = document.getElementById('unity-progress-bar-full');
        
        window.createUnityInstance(this.canvas, this.config, (progress) => {
            // Update loading progress
            if (progressBarFull) {
                progressBarFull.style.width = Math.round(progress * 100) + '%';
            }
            console.log(`🎮 Unity loading: ${Math.round(progress * 100)}%`);
            
        }).then((unityInstance) => {
            // Unity loaded successfully
            this.unityInstance = unityInstance;
            this.isLoaded = true;
            
            // Hide loading bar
            if (this.loadingBar) {
                this.loadingBar.style.display = 'none';
            }
            
            // Setup Unity communication
            this.setupUnityCallbacks();
            
            resolve();
            
        }).catch((message) => {
            console.error('❌ Unity instance creation failed:', message);
            reject(new Error(message));
        });
    }

    setupUnityCallbacks() {
        // Make Unity manager available globally for Unity callbacks
        window.unityManager = this;
        
        // Setup message handling
        window.receiveFromUnity = (data) => {
            this.handleUnityMessage(data);
        };
        
        console.log('🔗 Unity callbacks initialized');
    }

    // Send data to Unity
    sendToUnity(gameObjectName, methodName, value = '') {
        if (this.isLoaded && this.unityInstance) {
            try {
                this.unityInstance.SendMessage(gameObjectName, methodName, value);
                console.log(`📤 Sent to Unity: ${gameObjectName}.${methodName}(${value})`);
            } catch (error) {
                console.error('❌ Failed to send message to Unity:', error);
            }
        } else {
            console.warn('⚠️ Unity not loaded, cannot send message');
        }
    }

    // Handle messages from Unity
    handleUnityMessage(data) {
        console.log('📥 Received from Unity:', data);
        
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'emotion_changed':
                    this.onEmotionChanged(message.emotion);
                    break;
                case 'animation_complete':
                    this.onAnimationComplete(message.animation);
                    break;
                case 'speech_finished':
                    this.onSpeechFinished();
                    break;
                default:
                    console.log('🔄 Unity message:', message);
            }
            
        } catch (error) {
            console.error('❌ Failed to parse Unity message:', error);
        }
    }

    // Unity event handlers
    onEmotionChanged(emotion) {
        // Notify HEART system of emotion change
        if (window.heartSystem) {
            window.heartSystem.handleUnityEmotionChange(emotion);
        }
    }

    onAnimationComplete(animation) {
        console.log(`✅ Unity animation complete: ${animation}`);
    }

    onSpeechFinished() {
        console.log('🎤 Unity speech animation finished');
        // Notify speech system that visual speech is done
        if (window.heartSystem) {
            window.heartSystem.onUnitySpeechFinished();
        }
    }

    // HEART System Integration Methods
    setEmotion(emotion, intensity = 1.0) {
        this.sendToUnity('EmotionController', 'SetEmotion', JSON.stringify({
            emotion: emotion,
            intensity: intensity
        }));
    }

    startSpeech(text) {
        this.sendToUnity('SpeechController', 'StartSpeech', text);
    }

    stopSpeech() {
        this.sendToUnity('SpeechController', 'StopSpeech');
    }

    setCharacterModel(modelName) {
        this.sendToUnity('ModelController', 'LoadModel', modelName);
    }

    playAnimation(animationName, loop = false) {
        this.sendToUnity('AnimationController', 'PlayAnimation', JSON.stringify({
            name: animationName,
            loop: loop
        }));
    }

    setLighting(preset) {
        this.sendToUnity('LightingController', 'SetPreset', preset);
    }

    // Fallback renderer if Unity fails
    createFallbackRenderer() {
        console.log('🔧 Creating fallback 2D renderer...');
        
        this.container.innerHTML = `
            <div style="
                width: 100%; 
                height: 100%; 
                background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: Arial, sans-serif;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🤖</div>
                <div style="font-size: 24px; margin-bottom: 10px;">HEART System</div>
                <div style="font-size: 16px; opacity: 0.7;">3D Renderer (Fallback Mode)</div>
                <div id="fallback-status" style="margin-top: 20px; font-size: 14px; opacity: 0.5;">
                    Ready
                </div>
            </div>
        `;
        
        // Create simple fallback methods
        this.isLoaded = true;
        this.setEmotion = (emotion) => {
            const status = document.getElementById('fallback-status');
            if (status) status.textContent = `Emotion: ${emotion}`;
        };
        
        this.startSpeech = (text) => {
            const status = document.getElementById('fallback-status');
            if (status) status.textContent = `Speaking: ${text.substring(0, 30)}...`;
        };
    }

    // Cleanup
    destroy() {
        if (this.unityInstance) {
            this.unityInstance.Quit();
        }
        this.isLoaded = false;
        this.unityInstance = null;
        
        // Clean up global references
        if (window.unityManager === this) {
            window.unityManager = null;
        }
        if (window.receiveFromUnity) {
            window.receiveFromUnity = null;
        }
    }

    // Resize handling
    onResize() {
        if (this.canvas && this.container) {
            const rect = this.container.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    }
}

// Export for use in HEART system
export default UnityManager;



