export class EmotionEngine {
    constructor(personality, heartState) {
        this.personality = personality;
        this.heartState = heartState;
        this.emotions = personality.config.emotions;
        this.onMoodChange = null;
    }

    async initialize() {
        console.log('😊 Initializing Emotion Engine...');
        // Initialize emotion analysis capabilities
    }

    async analyzeInputEmotion(input) {
        // Simple emotion analysis based on keywords
        const emotionKeywords = {
            happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', '❤️', '😊', '😄'],
            sad: ['sad', 'depressed', 'unhappy', 'cry', 'tears', '😢', '😭', '💔'],
            angry: ['angry', 'mad', 'furious', 'hate', 'annoyed', '😠', '😡', '💢'],
            surprised: ['wow', 'omg', 'amazing', 'incredible', '😲', '😱', '🤯'],
            calm: ['calm', 'peaceful', 'relaxed', 'chill', '😌', '🧘'],
            excited: ['excited', 'thrilled', 'pumped', 'energetic', '🤩', '⚡']
        };

        const inputLower = input.toLowerCase();
        let detectedEmotions = [];

        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const matches = keywords.filter(keyword => inputLower.includes(keyword));
            if (matches.length > 0) {
                detectedEmotions.push({
                    emotion,
                    intensity: matches.length / keywords.length,
                    confidence: matches.length / keywords.length
                });
            }
        }

        // Default to neutral if no emotion detected
        if (detectedEmotions.length === 0) {
            detectedEmotions.push({
                emotion: 'calm',
                intensity: 0.3,
                confidence: 0.5
            });
        }

        // Sort by intensity and return primary emotion
        detectedEmotions.sort((a, b) => b.intensity - a.intensity);
        return detectedEmotions[0];
    }

    async updateMood(input, response) {
        const inputEmotion = await this.analyzeInputEmotion(input);
        const currentMood = this.heartState.mood;
        
        // Calculate mood change based on input emotion and personality
        const moodChange = this.calculateMoodChange(inputEmotion, currentMood);
        
        // Apply personality influence
        const personalityInfluence = this.applyPersonalityInfluence(moodChange);
        
        // Update mood with blending
        const newMood = this.blendMoods(currentMood, personalityInfluence);
        
        // Update heart state
        this.heartState.mood = newMood;
        this.heartState.mood.lastUpdate = new Date().toISOString();
        
        // Trigger mood change event
        if (this.onMoodChange) {
            this.onMoodChange(newMood);
        }
        
        console.log('😊 Mood updated:', newMood);
    }

    calculateMoodChange(inputEmotion, currentMood) {
        const emotionConfig = this.emotions[inputEmotion.emotion];
        if (!emotionConfig) return currentMood;

        const intensity = inputEmotion.intensity * emotionConfig.intensity;
        
        return {
            primary: inputEmotion.emotion,
            secondary: currentMood.primary,
            intensity: Math.min(1.0, intensity),
            lastUpdate: new Date().toISOString()
        };
    }

    applyPersonalityInfluence(moodChange) {
        const traits = this.personality.config.baseTraits;
        
        // Optimism affects positive emotions
        if (['happy', 'excited', 'calm'].includes(moodChange.primary)) {
            moodChange.intensity *= (1 + traits.optimism * 0.3);
        }
        
        // Empathy affects emotional sensitivity
        moodChange.intensity *= (1 + traits.empathy * 0.2);
        
        // Shyness affects emotional expression
        if (traits.shyness > 0.5) {
            moodChange.intensity *= 0.8;
        }
        
        return moodChange;
    }

    blendMoods(currentMood, newMood) {
        // Simple mood blending - can be enhanced with more sophisticated algorithms
        const blendFactor = 0.3; // How much the new mood affects the current one
        
        const blendedMood = {
            primary: newMood.primary,
            secondary: currentMood.primary,
            intensity: currentMood.intensity * (1 - blendFactor) + newMood.intensity * blendFactor,
            lastUpdate: newMood.lastUpdate
        };
        
        // Ensure intensity stays within bounds
        blendedMood.intensity = Math.max(0.1, Math.min(1.0, blendedMood.intensity));
        
        return blendedMood;
    }

    getCurrentEmotion() {
        return this.heartState.mood;
    }

    getEmotionConfig(emotion) {
        return this.emotions[emotion] || null;
    }

    // Get voice modifiers for current emotion
    getVoiceModifiers() {
        const currentMood = this.heartState.mood;
        const emotionConfig = this.emotions[currentMood.primary];
        
        if (emotionConfig && emotionConfig.voiceModifier) {
            return {
                ...emotionConfig.voiceModifier,
                intensity: currentMood.intensity
            };
        }
        
        return {
            pitch: 1.0,
            speed: 1.0,
            intensity: currentMood.intensity
        };
    }

    // Get animation for current emotion
    getCurrentAnimation() {
        const currentMood = this.heartState.mood;
        const emotionConfig = this.emotions[currentMood.primary];
        
        return emotionConfig ? emotionConfig.animation : 'idle_calm';
    }

    // Get blendshape for current emotion
    getCurrentBlendshape() {
        const currentMood = this.heartState.mood;
        const emotionConfig = this.emotions[currentMood.primary];
        
        return emotionConfig ? emotionConfig.blendshape : 'neutral';
    }
} 