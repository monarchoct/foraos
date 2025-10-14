export class AffinityManager {
    constructor(personality, heartState) {
        this.personality = personality;
        this.heartState = heartState;
        this.baseAffinity = 0.5;
    }

    async initialize() {
        console.log('💕 Initializing Affinity Manager...');
        // Initialize affinity tracking
    }

    updateAffinity(input, inputEmotion) {
        const currentAffinity = this.heartState.affinity;
        const traits = this.personality.config.baseTraits;
        
        // Calculate affinity change based on interaction
        let affinityChange = this.calculateAffinityChange(input, inputEmotion);
        
        // Apply personality influence
        affinityChange = this.applyPersonalityInfluence(affinityChange, traits);
        
        // Update affinity with bounds
        const newAffinity = Math.max(0.0, Math.min(1.0, currentAffinity + affinityChange));
        
        this.heartState.affinity = newAffinity;
        
        console.log('💕 Affinity updated:', currentAffinity.toFixed(2), '→', newAffinity.toFixed(2));
        
        return newAffinity;
    }

    calculateAffinityChange(input, inputEmotion) {
        let change = 0;
        
        // Positive emotions increase affinity
        if (['happy', 'excited', 'calm'].includes(inputEmotion.emotion)) {
            change += 0.05 * inputEmotion.intensity;
        }
        
        // Negative emotions decrease affinity slightly
        if (['sad', 'angry'].includes(inputEmotion.emotion)) {
            change -= 0.02 * inputEmotion.intensity;
        }
        
        // Input length affects affinity (longer messages = more engagement)
        const inputLength = input.length;
        if (inputLength > 50) {
            change += 0.02;
        } else if (inputLength < 10) {
            change -= 0.01;
        }
        
        // Greeting messages increase affinity
        const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
        const inputLower = input.toLowerCase();
        if (greetings.some(greeting => inputLower.includes(greeting))) {
            change += 0.03;
        }
        
        // Thank you messages increase affinity
        if (inputLower.includes('thank') || inputLower.includes('thanks')) {
            change += 0.04;
        }
        
        // Questions increase affinity (shows interest)
        if (input.includes('?') || inputLower.includes('what') || inputLower.includes('how') || inputLower.includes('why')) {
            change += 0.02;
        }
        
        return change;
    }

    applyPersonalityInfluence(affinityChange, traits) {
        // Empathetic personalities are more sensitive to user emotions
        if (traits.empathy > 0.7) {
            affinityChange *= 1.2;
        }
        
        // Shy personalities have slower affinity changes
        if (traits.shyness > 0.6) {
            affinityChange *= 0.8;
        }
        
        // Optimistic personalities are more forgiving
        if (traits.optimism > 0.7) {
            affinityChange = Math.max(affinityChange, -0.01); // Less negative impact
        }
        
        return affinityChange;
    }

    getAffinityLevel() {
        const affinity = this.heartState.affinity;
        
        if (affinity >= 0.8) return 'very_high';
        if (affinity >= 0.6) return 'high';
        if (affinity >= 0.4) return 'medium';
        if (affinity >= 0.2) return 'low';
        return 'very_low';
    }

    getAffinityDescription() {
        const level = this.getAffinityLevel();
        const descriptions = {
            very_high: "We have a very close and trusting relationship! 💕",
            high: "I really enjoy our conversations and feel close to you! 😊",
            medium: "I'm getting to know you better and enjoying our time together.",
            low: "I'm still learning about you, but I'm here to chat!",
            very_low: "I'm here to help and get to know you better."
        };
        
        return descriptions[level] || descriptions.medium;
    }

    shouldShowAffection() {
        const affinity = this.heartState.affinity;
        return affinity > 0.6;
    }

    getResponseStyle() {
        const affinity = this.heartState.affinity;
        const traits = this.personality.config.baseTraits;
        
        return {
            formal: affinity < 0.3,
            friendly: affinity >= 0.3 && affinity < 0.7,
            close: affinity >= 0.7,
            playful: affinity > 0.6 && traits.playfulness > 0.5,
            supportive: affinity > 0.5 && traits.empathy > 0.6
        };
    }
} 