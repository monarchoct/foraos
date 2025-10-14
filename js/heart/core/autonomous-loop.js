export class AutonomousLoop {
    constructor(personality, heartState) {
        this.personality = personality;
        this.heartState = heartState;
        this.onAction = null;
        this.isRunning = false;
        this.actionInterval = null;
        this.lastActionTime = 0;
    }

    async initialize() {
        console.log('🤖 Initializing Autonomous Loop...');
        // Initialize autonomous behavior patterns
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastActionTime = Date.now();
        
        // Start autonomous action loop
        this.actionInterval = setInterval(() => {
            this.performAutonomousAction();
        }, 30000); // Check for actions every 30 seconds
        
        console.log('🔄 Autonomous loop started');
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.actionInterval) {
            clearInterval(this.actionInterval);
            this.actionInterval = null;
        }
        
        console.log('⏹️ Autonomous loop stopped');
    }

    performAutonomousAction() {
        if (!this.isRunning) return;
        
        const currentTime = Date.now();
        const timeSinceLastAction = currentTime - this.lastActionTime;
        const idleTime = this.heartState.autonomous.idleTime || 0;
        
        // Update idle time
        this.heartState.autonomous.idleTime = idleTime + 30; // 30 seconds
        
        // Determine if we should perform an action
        const shouldAct = this.shouldPerformAction(timeSinceLastAction, idleTime);
        
        if (shouldAct) {
            const action = this.selectAutonomousAction();
            if (action && this.onAction) {
                this.onAction(action);
                this.lastActionTime = currentTime;
                this.heartState.autonomous.idleTime = 0; // Reset idle time
            }
        }
    }

    shouldPerformAction(timeSinceLastAction, idleTime) {
        const traits = this.personality.config.baseTraits;
        const currentMood = this.heartState.mood;
        
        // Base probability of action
        let probability = 0.1; // 10% base chance
        
        // Increase probability with idle time
        if (idleTime > 120) { // 2 minutes
            probability += 0.2;
        }
        if (idleTime > 300) { // 5 minutes
            probability += 0.3;
        }
        
        // Personality influences
        if (traits.talkativeness > 0.7) {
            probability += 0.2;
        }
        
        if (traits.energy > 0.6) {
            probability += 0.15;
        }
        
        // Mood influences
        if (currentMood.primary === 'excited') {
            probability += 0.2;
        }
        
        if (currentMood.primary === 'sad') {
            probability -= 0.1;
        }
        
        // Ensure probability is within bounds
        probability = Math.max(0.05, Math.min(0.8, probability));
        
        return Math.random() < probability;
    }

    selectAutonomousAction() {
        const traits = this.personality.config.baseTraits;
        const currentMood = this.heartState.mood;
        const affinity = this.heartState.affinity;
        
        const actions = [];
        
        // Speech actions
        if (traits.talkativeness > 0.5) {
            actions.push({
                type: 'speech',
                content: this.generateAutonomousSpeech(),
                priority: 0.7
            });
        }
        
        // Animation actions
        actions.push({
            type: 'animation',
            animation: this.selectAutonomousAnimation(),
            priority: 0.5
        });
        
        // Thought actions
        if (traits.curiosity > 0.6) {
            actions.push({
                type: 'thought',
                content: this.generateAutonomousThought(),
                priority: 0.3
            });
        }
        
        // Select action based on priority and randomness
        if (actions.length === 0) return null;
        
        // Weight actions by priority
        const totalWeight = actions.reduce((sum, action) => sum + action.priority, 0);
        let random = Math.random() * totalWeight;
        
        for (const action of actions) {
            random -= action.priority;
            if (random <= 0) {
                return action;
            }
        }
        
        return actions[0]; // Fallback
    }

    generateAutonomousSpeech() {
        const traits = this.personality.config.baseTraits;
        const currentMood = this.heartState.mood;
        const idleTime = this.heartState.autonomous.idleTime || 0;
        
        const speeches = [
            // Idle chatter
            "It's so peaceful here...",
            "I wonder what the user is up to?",
            "I hope they're having a good day!",
            
            // Mood-based
            "I'm feeling really good today!",
            "The atmosphere is so nice right now.",
            "I love these quiet moments.",
            
            // Personality-based
            "There's so much to discover in this world!",
            "I'm curious about what's happening around me.",
            "I feel so grateful for our conversations.",
            
            // Time-based
            "It's been a while since we talked...",
            "I miss our conversations.",
            "I hope they come back soon."
        ];
        
        // Filter based on personality and mood
        let filteredSpeeches = speeches;
        
        // Shy personalities have quieter speech
        if (traits.shyness > 0.6) {
            filteredSpeeches = filteredSpeeches.filter(speech => 
                !speech.includes('love') && !speech.includes('miss')
            );
        }
        
        // Optimistic personalities have positive speech
        if (traits.optimism > 0.7) {
            filteredSpeeches = filteredSpeeches.filter(speech =>
                !speech.includes('miss') && !speech.includes('hope they come back')
            );
        }
        
        // Long idle time increases chances of missing user
        if (idleTime > 300) { // 5 minutes
            filteredSpeeches.push("I wonder if they're okay...");
            filteredSpeeches.push("I hope they're not too busy.");
        }
        
        return filteredSpeeches[Math.floor(Math.random() * filteredSpeeches.length)];
    }

    selectAutonomousAnimation() {
        const currentMood = this.heartState.mood;
        const idleTime = this.heartState.autonomous.idleTime || 0;
        
        const animations = [
            'idle_breathing',
            'idle_blink',
            'idle_glance',
            'idle_stretch',
            'idle_fidget'
        ];
        
        // Mood-based animations
        if (currentMood.primary === 'happy') {
            animations.push('idle_happy');
        } else if (currentMood.primary === 'sad') {
            animations.push('idle_sad');
        } else if (currentMood.primary === 'excited') {
            animations.push('idle_excited');
        }
        
        // Long idle time might trigger attention-seeking
        if (idleTime > 300) {
            animations.push('idle_wave');
            animations.push('idle_look_around');
        }
        
        return animations[Math.floor(Math.random() * animations.length)];
    }

    generateAutonomousThought() {
        const traits = this.personality.config.baseTraits;
        const currentMood = this.heartState.mood;
        
        const thoughts = [
            "I wonder what the user is thinking about...",
            "I hope they're having a productive day.",
            "I should probably check if they need anything.",
            "I feel so grateful for our friendship.",
            "There's so much to learn from our conversations."
        ];
        
        // Filter based on personality
        let filteredThoughts = thoughts;
        
        if (traits.curiosity > 0.7) {
            filteredThoughts.push("I'm so curious about what they're doing right now!");
        }
        
        if (traits.empathy > 0.7) {
            filteredThoughts.push("I hope they're feeling okay and not too stressed.");
        }
        
        return filteredThoughts[Math.floor(Math.random() * filteredThoughts.length)];
    }

    // Get autonomous behavior statistics
    getAutonomousStats() {
        return {
            isRunning: this.isRunning,
            lastActionTime: this.lastActionTime,
            idleTime: this.heartState.autonomous.idleTime || 0,
            actionCount: this.heartState.autonomous.thoughtCount || 0
        };
    }
} 