export class BlendshapeManager {
    constructor() {
        this.currentEmotion = 'neutral';
        this.blendshapes = {};
        this.isTransitioning = false;
    }

    async initialize() {
        console.log('😊 Initializing Blendshape Manager...');
        
        // Initialize blendshapes for different emotions
        this.blendshapes = {
            neutral: { intensity: 0.0 },
            happy: { intensity: 0.0 },
            sad: { intensity: 0.0 },
            excited: { intensity: 0.0 },
            calm: { intensity: 0.0 },
            surprised: { intensity: 0.0 },
            angry: { intensity: 0.0 }
        };
        
        console.log('✅ Blendshape Manager initialized!');
    }

    setEmotion(emotion) {
        console.log('😊 Setting emotion:', emotion);
        
        if (this.isTransitioning) {
            console.log('⚠️ Already transitioning, queuing emotion change');
            return;
        }
        
        this.isTransitioning = true;
        
        // Smooth transition to new emotion
        this.transitionToEmotion(emotion);
    }

    transitionToEmotion(emotion) {
        const targetEmotion = emotion.primary || emotion;
        const intensity = emotion.intensity || 0.5;
        
        // Reset all blendshapes
        Object.keys(this.blendshapes).forEach(key => {
            this.blendshapes[key].intensity = 0.0;
        });
        
        // Set target emotion
        if (this.blendshapes[targetEmotion]) {
            this.blendshapes[targetEmotion].intensity = intensity;
        }
        
        this.currentEmotion = targetEmotion;
        
        // Simulate transition time
        setTimeout(() => {
            this.isTransitioning = false;
            console.log('✅ Emotion transition complete:', targetEmotion);
        }, 500);
    }

    getCurrentBlendshapes() {
        return this.blendshapes;
    }

    getCurrentEmotion() {
        return this.currentEmotion;
    }

    // Blend multiple emotions
    blendEmotions(primaryEmotion, secondaryEmotion, blendFactor = 0.3) {
        console.log('🔄 Blending emotions:', primaryEmotion, '+', secondaryEmotion);
        
        // Reset all blendshapes
        Object.keys(this.blendshapes).forEach(key => {
            this.blendshapes[key].intensity = 0.0;
        });
        
        // Apply primary emotion
        if (this.blendshapes[primaryEmotion]) {
            this.blendshapes[primaryEmotion].intensity = 1.0 - blendFactor;
        }
        
        // Apply secondary emotion
        if (this.blendshapes[secondaryEmotion]) {
            this.blendshapes[secondaryEmotion].intensity = blendFactor;
        }
        
        this.currentEmotion = `${primaryEmotion}_${secondaryEmotion}`;
    }

    // Get blendshape values for Three.js
    getBlendshapeValues() {
        const values = {};
        
        Object.entries(this.blendshapes).forEach(([name, config]) => {
            values[name] = config.intensity;
        });
        
        return values;
    }

    // Apply micro-expressions
    applyMicroExpression(expression, duration = 200) {
        console.log('😊 Applying micro-expression:', expression);
        
        const originalIntensity = this.blendshapes[expression]?.intensity || 0;
        
        // Temporarily increase expression
        if (this.blendshapes[expression]) {
            this.blendshapes[expression].intensity = Math.min(1.0, originalIntensity + 0.3);
        }
        
        // Reset after duration
        setTimeout(() => {
            if (this.blendshapes[expression]) {
                this.blendshapes[expression].intensity = originalIntensity;
            }
        }, duration);
    }

    // Get emotion intensity
    getEmotionIntensity(emotion) {
        return this.blendshapes[emotion]?.intensity || 0;
    }

    // Check if currently transitioning
    isCurrentlyTransitioning() {
        return this.isTransitioning;
    }
} 