export class AttentionSystem {
    constructor(personality, heartState) {
        this.personality = personality;
        this.heartState = heartState;
        this.lastInteractionTime = Date.now();
        this.interactionCount = 0;
    }

    async initialize() {
        console.log('👁️ Initializing Attention System...');
        // Initialize attention tracking
    }

    updateEngagement() {
        const currentTime = Date.now();
        const timeSinceLastInteraction = currentTime - this.lastInteractionTime;
        
        // Update last interaction time
        this.lastInteractionTime = currentTime;
        this.heartState.attention.lastInteraction = new Date().toISOString();
        
        // Update interaction count
        this.interactionCount++;
        this.heartState.conversation.messageCount = this.interactionCount;
        
        // Calculate engagement based on interaction frequency
        this.calculateEngagement(timeSinceLastInteraction);
        
        console.log('👁️ Engagement updated, interaction count:', this.interactionCount);
    }

    calculateEngagement(timeSinceLastInteraction) {
        const currentEngagement = this.heartState.attention.engagement || 0.8;
        const currentBoredom = this.heartState.attention.boredom || 0.2;
        
        // Reset boredom on interaction
        const newBoredom = Math.max(0, currentBoredom - 0.3);
        this.heartState.attention.boredom = newBoredom;
        
        // Increase engagement on interaction
        const newEngagement = Math.min(1.0, currentEngagement + 0.2);
        this.heartState.attention.engagement = newEngagement;
        
        // Personality affects engagement recovery
        const traits = this.personality.config.baseTraits;
        if (traits.energy > 0.7) {
            this.heartState.attention.engagement = Math.min(1.0, newEngagement + 0.1);
        }
    }

    shouldCheckOnUser() {
        const currentTime = Date.now();
        const timeSinceLastInteraction = currentTime - this.lastInteractionTime;
        const minutesSinceInteraction = timeSinceLastInteraction / (1000 * 60);
        
        // Check if user has been away for a while
        if (minutesSinceInteraction > 5) {
            const boredom = this.heartState.attention.boredom || 0;
            const traits = this.personality.config.baseTraits;
            
            // More likely to check on user if bored or empathetic
            let probability = 0.1;
            
            if (boredom > 0.5) probability += 0.2;
            if (traits.empathy > 0.7) probability += 0.15;
            if (traits.curiosity > 0.8) probability += 0.1;
            
            return Math.random() < probability;
        }
        
        return false;
    }

    getAttentionLevel() {
        const engagement = this.heartState.attention.engagement || 0.8;
        const boredom = this.heartState.attention.boredom || 0.2;
        
        if (engagement > 0.8 && boredom < 0.2) return 'high';
        if (engagement > 0.5 && boredom < 0.5) return 'medium';
        return 'low';
    }

    getAttentionDescription() {
        const level = this.getAttentionLevel();
        const timeSinceLastInteraction = (Date.now() - this.lastInteractionTime) / (1000 * 60);
        
        const descriptions = {
            high: "I'm fully engaged and paying attention! 😊",
            medium: "I'm here and listening to you.",
            low: "I'm getting a bit distracted... Are you still there?"
        };
        
        if (timeSinceLastInteraction > 10) {
            return "It's been a while since we talked. I miss you! 💕";
        }
        
        return descriptions[level] || descriptions.medium;
    }

    shouldAskIfUserIsStillThere() {
        const currentTime = Date.now();
        const timeSinceLastInteraction = currentTime - this.lastInteractionTime;
        const minutesSinceInteraction = timeSinceLastInteraction / (1000 * 60);
        
        // Ask if user has been away for more than 3 minutes
        return minutesSinceInteraction > 3;
    }

    getInteractionStats() {
        const currentTime = Date.now();
        const timeSinceLastInteraction = currentTime - this.lastInteractionTime;
        
        return {
            interactionCount: this.interactionCount,
            timeSinceLastInteraction: timeSinceLastInteraction / (1000 * 60), // in minutes
            engagement: this.heartState.attention.engagement,
            boredom: this.heartState.attention.boredom,
            attentionLevel: this.getAttentionLevel()
        };
    }
} 