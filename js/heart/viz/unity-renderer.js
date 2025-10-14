/**
 * Unity Renderer - Replacement for Three.js Renderer
 * Integrates Unity WebGL into the HEART system
 */

import { UnityManager } from '../../unity/unity-manager.js';

export class UnityRenderer {
    constructor() {
        this.unityManager = new UnityManager();
        this.isInitialized = false;
        this.currentEmotion = 'neutral';
        this.currentModel = 'default';
        
        // Animation states
        this.isAnimating = false;
        this.animationQueue = [];
        
        // Speech states
        this.isSpeaking = false;
        this.speechQueue = [];
    }

    async initialize() {
        console.log('🎮 Initializing Unity Renderer...');
        
        try {
            await this.unityManager.initialize();
            this.isInitialized = true;
            
            // Setup resize handling
            window.addEventListener('resize', () => {
                this.unityManager.onResize();
            });
            
            // Initialize default state
            this.setEmotion('neutral');
            this.setLighting('default');
            
            console.log('✅ Unity Renderer initialized successfully!');
            
        } catch (error) {
            console.error('❌ Unity Renderer initialization failed:', error);
            throw error;
        }
    }

    // Emotion Management
    setEmotion(emotion, intensity = 1.0) {
        if (!this.isInitialized) {
            console.warn('⚠️ Unity Renderer not initialized');
            return;
        }
        
        this.currentEmotion = emotion;
        this.unityManager.setEmotion(emotion, intensity);
        
        console.log(`😊 Set emotion: ${emotion} (intensity: ${intensity})`);
    }

    // Speech Animation
    startSpeech(text) {
        if (!this.isInitialized) {
            console.warn('⚠️ Unity Renderer not initialized');
            return;
        }
        
        if (this.isSpeaking) {
            // Queue speech if already speaking
            this.speechQueue.push(text);
            return;
        }
        
        this.isSpeaking = true;
        this.unityManager.startSpeech(text);
        
        console.log(`🎤 Started speech animation for: ${text.substring(0, 50)}...`);
    }

    stopSpeech() {
        if (!this.isInitialized) return;
        
        this.isSpeaking = false;
        this.speechQueue = [];
        this.unityManager.stopSpeech();
        
        console.log('🛑 Stopped speech animation');
    }

    onSpeechFinished() {
        this.isSpeaking = false;
        
        // Process speech queue
        if (this.speechQueue.length > 0) {
            const nextSpeech = this.speechQueue.shift();
            this.startSpeech(nextSpeech);
        }
        
        console.log('✅ Speech animation finished');
    }

    // Character Model Management
    setCharacterModel(modelName) {
        if (!this.isInitialized) {
            console.warn('⚠️ Unity Renderer not initialized');
            return;
        }
        
        this.currentModel = modelName;
        this.unityManager.setCharacterModel(modelName);
        
        console.log(`👤 Set character model: ${modelName}`);
    }

    // Animation System
    playAnimation(animationName, loop = false) {
        if (!this.isInitialized) {
            console.warn('⚠️ Unity Renderer not initialized');
            return;
        }
        
        if (this.isAnimating && !loop) {
            // Queue animation if not looping
            this.animationQueue.push({ name: animationName, loop });
            return;
        }
        
        this.isAnimating = true;
        this.unityManager.playAnimation(animationName, loop);
        
        console.log(`🎭 Playing animation: ${animationName} (loop: ${loop})`);
    }

    onAnimationComplete(animationName) {
        this.isAnimating = false;
        
        // Process animation queue
        if (this.animationQueue.length > 0) {
            const nextAnimation = this.animationQueue.shift();
            this.playAnimation(nextAnimation.name, nextAnimation.loop);
        }
        
        console.log(`✅ Animation complete: ${animationName}`);
    }

    // Lighting Control
    setLighting(preset) {
        if (!this.isInitialized) return;
        
        this.unityManager.setLighting(preset);
        console.log(`💡 Set lighting preset: ${preset}`);
    }

    // HEART System Integration
    updateVisualization(emotionState) {
        if (!emotionState) return;
        
        // Update emotion
        this.setEmotion(emotionState.primary, emotionState.intensity || 0.8);
        
        // Trigger appropriate animation based on emotion
        const emotionAnimations = {
            'happy': 'smile',
            'sad': 'frown',
            'angry': 'scowl',
            'surprised': 'gasp',
            'neutral': 'idle',
            'excited': 'bounce',
            'confused': 'tilt_head'
        };
        
        const animation = emotionAnimations[emotionState.primary] || 'idle';
        this.playAnimation(animation);
    }

    // Handle Unity Messages
    handleUnityMessage(message) {
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
            case 'model_loaded':
                this.onModelLoaded(message.model);
                break;
            default:
                console.log('🔄 Unity message:', message);
        }
    }

    onEmotionChanged(emotion) {
        console.log(`😊 Unity emotion changed: ${emotion}`);
        // Could trigger additional effects or notify other systems
    }

    onModelLoaded(model) {
        console.log(`👤 Unity model loaded: ${model}`);
    }

    // Utility Methods
    isReady() {
        return this.isInitialized && this.unityManager.isLoaded;
    }

    getCurrentEmotion() {
        return this.currentEmotion;
    }

    getCurrentModel() {
        return this.currentModel;
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            loaded: this.unityManager.isLoaded,
            emotion: this.currentEmotion,
            model: this.currentModel,
            speaking: this.isSpeaking,
            animating: this.isAnimating,
            speechQueue: this.speechQueue.length,
            animationQueue: this.animationQueue.length
        };
    }

    // Cleanup
    destroy() {
        console.log('🧹 Destroying Unity Renderer...');
        
        this.stopSpeech();
        this.animationQueue = [];
        this.speechQueue = [];
        
        if (this.unityManager) {
            this.unityManager.destroy();
        }
        
        this.isInitialized = false;
        console.log('✅ Unity Renderer destroyed');
    }

    // Development/Debug Methods
    debug() {
        console.log('🔍 Unity Renderer Debug Info:', {
            status: this.getStatus(),
            unityManager: this.unityManager,
            container: document.getElementById('three-container')
        });
    }

    // Test methods for development
    testEmotion() {
        const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'excited'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        this.setEmotion(randomEmotion);
        return randomEmotion;
    }

    testSpeech() {
        const testPhrases = [
            "Hello! I'm your AI companion.",
            "How are you feeling today?",
            "I'm here to help with whatever you need.",
            "Let's have a great conversation!"
        ];
        const randomPhrase = testPhrases[Math.floor(Math.random() * testPhrases.length)];
        this.startSpeech(randomPhrase);
        return randomPhrase;
    }

    testAnimation() {
        const animations = ['wave', 'nod', 'shake_head', 'point', 'thumbs_up'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        this.playAnimation(randomAnimation);
        return randomAnimation;
    }
}

export default UnityRenderer;



