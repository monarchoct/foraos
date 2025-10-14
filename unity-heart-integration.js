/**
 * HEART System Unity Integration
 * This shows how to modify your existing HeartSystem to use Unity instead of Three.js
 */

// In js/heart/heart.js - Replace the Three.js renderer initialization

// OLD Three.js approach:
/*
import { Renderer } from './viz/renderer.js';

async initializeVizComponents() {
    console.log('🎨 Initializing visualization components...');
    
    this.renderer = new Renderer();
    await this.renderer.initialize();
    
    console.log('✅ Visualization components initialized');
}
*/

// NEW Unity approach:
import { UnityRenderer } from './viz/unity-renderer.js';

async initializeVizComponents() {
    console.log('🎮 Initializing Unity visualization components...');
    
    try {
        this.unityRenderer = new UnityRenderer();
        await this.unityRenderer.initialize();
        
        // Setup Unity event handlers
        this.setupUnityEventHandlers();
        
        console.log('✅ Unity visualization components initialized');
        
    } catch (error) {
        console.error('❌ Failed to initialize Unity visualization:', error);
        
        // Fallback to Three.js if Unity fails
        console.log('🔄 Falling back to Three.js renderer...');
        const { Renderer } = await import('./viz/renderer.js');
        this.renderer = new Renderer();
        await this.renderer.initialize();
    }
}

setupUnityEventHandlers() {
    // Make Unity callbacks available to HEART system
    window.heartSystem = this;
    
    // Handle Unity emotion changes
    this.handleUnityEmotionChange = (emotion) => {
        console.log(`😊 Unity emotion change: ${emotion}`);
        // Update emotion state if needed
        if (this.emotionEngine) {
            this.emotionEngine.processUnityEmotion(emotion);
        }
    };
    
    // Handle Unity speech finished
    this.onUnitySpeechFinished = () => {
        console.log('🎤 Unity speech finished');
        // Continue with next speech if queued
        if (this.speechPlanner && this.speechPlanner.hasQueuedSpeech()) {
            this.speechPlanner.processNextSpeech();
        }
    };
}

// Update the speak method to use Unity
async speak(text, emotion = null) {
    if (!text || text.trim() === '') return;
    
    console.log(`🗣️ Speaking: "${text}" with emotion: ${emotion}`);
    
    try {
        // Determine emotion for speech
        const speechEmotion = emotion || this.emotionEngine?.getCurrentEmotion()?.primary || 'neutral';
        
        // Update Unity visualization BEFORE speaking
        if (this.unityRenderer && this.unityRenderer.isReady()) {
            // Set emotion
            this.unityRenderer.setEmotion(speechEmotion, 0.8);
            
            // Start speech animation
            this.unityRenderer.startSpeech(text);
            
        } else if (this.renderer) {
            // Fallback to Three.js
            this.renderer.updateEmotion(speechEmotion);
        }
        
        // Use existing speech synthesis
        if (this.voiceManager) {
            await this.voiceManager.speak(text, speechEmotion);
        }
        
        // Log the speech for memory
        if (this.memoryManager) {
            await this.memoryManager.addMemory({
                type: 'speech',
                content: text,
                emotion: speechEmotion,
                timestamp: Date.now()
            });
        }
        
    } catch (error) {
        console.error('❌ Error in speak method:', error);
    }
}

// Update emotion handling
updateVisualization(emotionState) {
    if (!emotionState) return;
    
    console.log('🎨 Updating visualization with emotion:', emotionState);
    
    if (this.unityRenderer && this.unityRenderer.isReady()) {
        // Use Unity renderer
        this.unityRenderer.updateVisualization(emotionState);
        
    } else if (this.renderer) {
        // Fallback to Three.js
        this.renderer.updateEmotion(emotionState.primary);
    }
}

// Add Unity-specific methods
setCharacterModel(modelName) {
    if (this.unityRenderer && this.unityRenderer.isReady()) {
        this.unityRenderer.setCharacterModel(modelName);
        console.log(`👤 Changed character model to: ${modelName}`);
    }
}

playCharacterAnimation(animationName, loop = false) {
    if (this.unityRenderer && this.unityRenderer.isReady()) {
        this.unityRenderer.playAnimation(animationName, loop);
        console.log(`🎭 Playing animation: ${animationName}`);
    }
}

setLightingPreset(preset) {
    if (this.unityRenderer && this.unityRenderer.isReady()) {
        this.unityRenderer.setLighting(preset);
        console.log(`💡 Set lighting preset: ${preset}`);
    }
}

// Debug methods for testing Unity integration
debugUnity() {
    if (this.unityRenderer) {
        this.unityRenderer.debug();
    } else {
        console.log('❌ Unity renderer not available');
    }
}

testUnityEmotion() {
    if (this.unityRenderer && this.unityRenderer.isReady()) {
        const emotion = this.unityRenderer.testEmotion();
        console.log(`🧪 Tested Unity emotion: ${emotion}`);
        return emotion;
    }
}

testUnitySpeech() {
    if (this.unityRenderer && this.unityRenderer.isReady()) {
        const phrase = this.unityRenderer.testSpeech();
        console.log(`🧪 Tested Unity speech: ${phrase}`);
        return phrase;
    }
}

testUnityAnimation() {
    if (this.unityRenderer && this.unityRenderer.isReady()) {
        const animation = this.unityRenderer.testAnimation();
        console.log(`🧪 Tested Unity animation: ${animation}`);
        return animation;
    }
}

// Cleanup method
async cleanup() {
    console.log('🧹 Cleaning up HEART System...');
    
    if (this.unityRenderer) {
        this.unityRenderer.destroy();
    }
    
    if (this.renderer) {
        this.renderer.cleanup();
    }
    
    // Continue with existing cleanup...
}

// Example of how to handle different input modes with Unity
async handlePumpFunMessage(message) {
    console.log('💬 Processing pump.fun message:', message);
    
    // Process message through existing systems
    const response = await this.processMessage(message.content, {
        source: 'pumpfun',
        user: message.username,
        platform: 'pump.fun'
    });
    
    if (response && response.shouldRespond) {
        // Set appropriate emotion for trading context
        const emotion = this.determineTradeEmotion(message.content);
        
        // Update Unity character with trading emotion
        if (this.unityRenderer && this.unityRenderer.isReady()) {
            this.unityRenderer.setEmotion(emotion, 0.9);
            
            // Play contextual animation
            const animation = this.getTradeAnimation(emotion);
            if (animation) {
                this.unityRenderer.playAnimation(animation);
            }
        }
        
        // Speak the response
        await this.speak(response.text, emotion);
    }
}

determineTradeEmotion(message) {
    const content = message.toLowerCase();
    
    if (content.includes('moon') || content.includes('pump') || content.includes('🚀')) {
        return 'excited';
    } else if (content.includes('dump') || content.includes('crash') || content.includes('😭')) {
        return 'sad';
    } else if (content.includes('hold') || content.includes('diamond hands') || content.includes('💎')) {
        return 'determined';
    } else {
        return 'neutral';
    }
}

getTradeAnimation(emotion) {
    const animations = {
        'excited': 'cheer',
        'sad': 'disappointed',
        'determined': 'confident_pose',
        'neutral': 'thinking'
    };
    
    return animations[emotion] || 'idle';
}



