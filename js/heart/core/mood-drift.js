export class MoodDrift {
    constructor(personality, heartState) {
        this.personality = personality;
        this.heartState = heartState;
        this.isRunning = false;
        this.driftInterval = null;
        this.lastDriftTime = Date.now();
    }

    async initialize() {
        console.log('🌊 Initializing Mood Drift...');
        // Initialize mood drift system
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastDriftTime = Date.now();
        
        // Start mood drift loop
        this.driftInterval = setInterval(() => {
            this.performMoodDrift();
        }, 60000); // Check for drift every minute
        
        console.log('🌊 Mood drift started');
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.driftInterval) {
            clearInterval(this.driftInterval);
            this.driftInterval = null;
        }
        
        console.log('⏹️ Mood drift stopped');
    }

    performMoodDrift() {
        if (!this.isRunning) return;
        
        const currentTime = Date.now();
        const timeSinceLastInteraction = currentTime - new Date(this.heartState.attention.lastInteraction).getTime();
        const currentMood = this.heartState.mood;
        const traits = this.personality.config.baseTraits;
        
        // Calculate drift based on time and personality
        const drift = this.calculateMoodDrift(timeSinceLastInteraction, currentMood, traits);
        
        if (Math.abs(drift.intensity) > 0.01) {
            // Apply drift
            const newIntensity = Math.max(0.1, Math.min(1.0, currentMood.intensity + drift.intensity));
            
            this.heartState.mood.intensity = newIntensity;
            this.heartState.mood.lastUpdate = new Date().toISOString();
            
            console.log('🌊 Mood drifted:', currentMood.intensity.toFixed(2), '→', newIntensity.toFixed(2));
        }
        
        // Update boredom based on interaction
        this.updateBoredom(timeSinceLastInteraction);
    }

    calculateMoodDrift(timeSinceLastInteraction, currentMood, traits) {
        let intensityDrift = 0;
        
        // Time-based drift
        const minutesSinceInteraction = timeSinceLastInteraction / (1000 * 60);
        
        if (minutesSinceInteraction > 10) {
            // After 10 minutes, start drifting toward neutral
            const driftFactor = Math.min(0.1, (minutesSinceInteraction - 10) * 0.005);
            intensityDrift -= driftFactor;
        }
        
        // Personality-based drift
        if (traits.optimism > 0.7) {
            // Optimistic personalities drift toward positive moods
            if (['sad', 'angry'].includes(currentMood.primary)) {
                intensityDrift += 0.02;
            }
        }
        
        if (traits.shyness > 0.6) {
            // Shy personalities have slower mood changes
            intensityDrift *= 0.5;
        }
        
        // Mood-specific drift
        switch (currentMood.primary) {
            case 'excited':
                // Excitement naturally fades
                intensityDrift -= 0.03;
                break;
            case 'sad':
                // Sadness can persist but eventually fades
                if (minutesSinceInteraction > 5) {
                    intensityDrift += 0.02;
                }
                break;
            case 'angry':
                // Anger fades quickly
                intensityDrift += 0.05;
                break;
            case 'surprised':
                // Surprise fades quickly
                intensityDrift -= 0.04;
                break;
        }
        
        return {
            intensity: intensityDrift,
            timeSinceInteraction: minutesSinceInteraction
        };
    }

    updateBoredom(timeSinceLastInteraction) {
        const minutesSinceInteraction = timeSinceLastInteraction / (1000 * 60);
        const currentBoredom = this.heartState.attention.boredom || 0;
        
        // Increase boredom over time
        let boredomChange = 0;
        
        if (minutesSinceInteraction > 2) {
            boredomChange = Math.min(0.1, (minutesSinceInteraction - 2) * 0.02);
        }
        
        // Personality affects boredom
        const traits = this.personality.config.baseTraits;
        if (traits.energy > 0.7) {
            boredomChange *= 1.5; // High energy = gets bored faster
        }
        
        if (traits.curiosity > 0.8) {
            boredomChange *= 1.2; // Curious = gets bored faster
        }
        
        const newBoredom = Math.max(0, Math.min(1, currentBoredom + boredomChange));
        this.heartState.attention.boredom = newBoredom;
        
        // Update engagement inversely
        this.heartState.attention.engagement = Math.max(0, 1 - newBoredom);
    }

    // Get current drift statistics
    getDriftStats() {
        const currentTime = Date.now();
        const timeSinceLastInteraction = currentTime - new Date(this.heartState.attention.lastInteraction).getTime();
        
        return {
            isRunning: this.isRunning,
            timeSinceLastInteraction: timeSinceLastInteraction / (1000 * 60), // in minutes
            currentMood: this.heartState.mood,
            boredom: this.heartState.attention.boredom,
            engagement: this.heartState.attention.engagement
        };
    }
} 