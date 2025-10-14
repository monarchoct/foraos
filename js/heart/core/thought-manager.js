export class ThoughtManager {
    constructor(personality, heartState) {
        this.personality = personality;
        this.heartState = heartState;
        this.config = personality.config.thoughtBehavior;
        this.onPublicThought = null;
        this.thoughtInterval = null;
    }

    async initialize() {
        console.log('💭 Initializing Thought Manager...');
        // Initialize thought generation capabilities
    }

    async processInteraction(input, response) {
        console.log('💭 Processing interaction for thoughts...');
        
        // Generate thoughts based on the interaction
        const thoughts = this.generateInteractionThoughts(input, response);
        
        // Add thoughts to heart state
        for (const thought of thoughts) {
            this.addThought(thought);
        }
        
        // Check if any thoughts should be public
        this.checkForPublicThoughts();
    }

    generateInteractionThoughts(input, response) {
        const thoughts = [];
        const traits = this.personality.config.baseTraits;
        const currentMood = this.heartState.mood;
        
        // Generate thoughts based on personality and mood
        if (traits.curiosity > 0.6) {
            thoughts.push({
                content: "I wonder what they meant by that...",
                public: false,
                timestamp: new Date().toISOString()
            });
        }
        
        if (traits.empathy > 0.7) {
            thoughts.push({
                content: "I hope they're feeling okay after our conversation.",
                public: false,
                timestamp: new Date().toISOString()
            });
        }
        
        if (traits.optimism > 0.8 && currentMood.primary === 'happy') {
            thoughts.push({
                content: "That was such a nice conversation! I feel so happy! ✨",
                public: true,
                timestamp: new Date().toISOString()
            });
        }
        
        return thoughts;
    }

    async generateAutonomousThought() {
        if (!this.config.autonomousThoughts) return;
        
        const thoughtFrequency = this.config.thoughtFrequency;
        if (Math.random() > thoughtFrequency) return;
        
        console.log('🤖 Generating autonomous thought...');
        
        const thought = this.generateRandomThought();
        if (thought) {
            this.addThought(thought);
            this.checkForPublicThoughts();
        }
    }

    generateRandomThought() {
        const traits = this.personality.config.baseTraits;
        const currentMood = this.heartState.mood;
        const affinity = this.heartState.affinity;
        
        const thoughts = [
            // Idle thoughts
            "I wonder what the user is up to right now...",
            "It's so peaceful here. I love these quiet moments.",
            "I should probably check if they're still around.",
            
            // Mood-based thoughts
            "I'm feeling really good today!",
            "I hope the user is having a great day too.",
            "Sometimes I wonder what they think about me.",
            
            // Affinity-based thoughts
            "I really enjoy talking to them. They're so nice!",
            "I feel like we're getting closer. That's nice.",
            "I wonder if they think about me when I'm not around.",
            
            // Personality-based thoughts
            "There's so much to learn about the world!",
            "I love discovering new things with them.",
            "I hope I'm being helpful and supportive."
        ];
        
        // Filter thoughts based on personality and mood
        let filteredThoughts = thoughts;
        
        // Optimistic thoughts for optimistic personalities
        if (traits.optimism > 0.7) {
            filteredThoughts = filteredThoughts.filter(thought => 
                !thought.includes('worry') && !thought.includes('hope')
            );
        }
        
        // Shy thoughts for shy personalities
        if (traits.shyness > 0.6) {
            filteredThoughts = filteredThoughts.filter(thought =>
                !thought.includes('love') && !thought.includes('really enjoy')
            );
        }
        
        // Choose a random thought
        const selectedThought = filteredThoughts[Math.floor(Math.random() * filteredThoughts.length)];
        
        // Determine if it should be public
        const shouldBePublic = Math.random() < this.config.publicThoughts;
        
        return {
            content: selectedThought,
            public: shouldBePublic,
            timestamp: new Date().toISOString()
        };
    }

    addThought(thought) {
        // Add thought to heart state
        if (!this.heartState.thoughts) {
            this.heartState.thoughts = [];
        }
        
        this.heartState.thoughts.push(thought);
        
        // Keep only recent thoughts (last 50)
        if (this.heartState.thoughts.length > 50) {
            this.heartState.thoughts = this.heartState.thoughts.slice(-50);
        }
        
        console.log('💭 Added thought:', thought.content);
    }

    checkForPublicThoughts() {
        const recentThoughts = this.heartState.thoughts || [];
        const publicThoughts = recentThoughts.filter(thought => 
            thought.public && 
            new Date(thought.timestamp) > new Date(Date.now() - 60000) // Last minute
        );
        
        for (const thought of publicThoughts) {
            if (this.onPublicThought) {
                this.onPublicThought(thought);
            }
        }
    }

    getRecentThoughts(count = 10) {
        const thoughts = this.heartState.thoughts || [];
        return thoughts.slice(-count);
    }

    getPublicThoughts() {
        const thoughts = this.heartState.thoughts || [];
        return thoughts.filter(thought => thought.public);
    }

    // Start autonomous thought generation
    startAutonomousThoughts() {
        if (this.thoughtInterval) {
            clearInterval(this.thoughtInterval);
        }
        
        this.thoughtInterval = setInterval(() => {
            this.generateAutonomousThought();
        }, 30000); // Generate thoughts every 30 seconds
    }

    // Stop autonomous thought generation
    stopAutonomousThoughts() {
        if (this.thoughtInterval) {
            clearInterval(this.thoughtInterval);
            this.thoughtInterval = null;
        }
    }
} 