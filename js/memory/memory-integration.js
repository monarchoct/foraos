/**
 * Memory Integration Layer
 * Connects the enhanced memory system with the AI and provides intelligent memory retrieval
 */

export class MemoryIntegration {
    constructor(enhancedMemoryManager, heartSystem) {
        this.memoryManager = enhancedMemoryManager;
        this.heartSystem = heartSystem;
        
        // Memory-enhanced AI features
        this.contextWindow = 10; // Number of recent memories to include in AI context
        this.relevanceThreshold = 0.3; // Minimum relevance score for memory inclusion
        this.memoryInfluenceWeight = 0.4; // How much memories influence responses
        
        // Memory learning patterns
        this.learningPatterns = {
            userPreferences: new Map(),
            conversationTopics: new Map(),
            emotionalTriggers: new Map(),
            behaviorPatterns: new Map()
        };
        
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🔗 Initializing Memory Integration...');
        
        try {
            // Analyze existing memories to build learning patterns
            await this.analyzeExistingMemories();
            
            // Setup memory-enhanced AI hooks
            this.setupAIMemoryHooks();
            
            // Setup memory learning triggers
            this.setupMemoryLearning();
            
            this.isInitialized = true;
            console.log('✅ Memory Integration initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Memory Integration:', error);
            throw error;
        }
    }

    // MEMORY-ENHANCED AI RESPONSE GENERATION

    async enhanceAIPromptWithMemories(originalPrompt, userMessage, context = {}) {
        if (!this.isInitialized) return originalPrompt;

        try {
            console.log('🧠 Enhancing AI prompt with relevant memories...');
            
            // Get relevant memories for this conversation
            const relevantMemories = await this.getRelevantMemories(userMessage, context);
            
            if (relevantMemories.length === 0) {
                return originalPrompt;
            }

            // Build memory context
            const memoryContext = this.buildMemoryContext(relevantMemories);
            
            // Get user preferences and patterns
            const userPatterns = await this.getUserPatterns();
            
            // Enhance the prompt
            const enhancedPrompt = `${originalPrompt}

MEMORY CONTEXT:
${memoryContext}

USER PATTERNS & PREFERENCES:
${userPatterns}

IMPORTANT: Use this memory context to provide more personalized and contextually aware responses. Reference past conversations when relevant, and maintain consistency with established preferences and patterns.`;

            console.log('✅ AI prompt enhanced with memory context');
            return enhancedPrompt;
            
        } catch (error) {
            console.error('❌ Failed to enhance AI prompt with memories:', error);
            return originalPrompt;
        }
    }

    async getRelevantMemories(userMessage, context = {}) {
        const relevantMemories = [];
        
        try {
            // 1. Get semantically similar conversations
            const similarConversations = await this.memoryManager.searchMemories(userMessage, {
                limit: 5,
                minImportance: this.relevanceThreshold
            });
            relevantMemories.push(...similarConversations);
            
            // 2. Get contextual memories (same app/situation)
            if (context.app) {
                const contextualMemories = await this.memoryManager.getContextualMemories(context, 3);
                relevantMemories.push(...contextualMemories);
            }
            
            // 3. Get emotional memories if current mood matches
            if (this.heartSystem.heartState?.mood?.primary) {
                const emotionalMemories = await this.memoryManager.getMemoriesByEmotion(
                    this.heartSystem.heartState.mood.primary, 2
                );
                relevantMemories.push(...emotionalMemories);
            }
            
            // 4. Get recent important memories
            const recentImportant = await this.memoryManager.getRecentConversations(3);
            const importantRecent = recentImportant.filter(m => (m.importance || 0) > 0.7);
            relevantMemories.push(...importantRecent);
            
            // Remove duplicates and sort by relevance
            const uniqueMemories = this.deduplicateMemories(relevantMemories);
            return uniqueMemories.slice(0, this.contextWindow);
            
        } catch (error) {
            console.error('❌ Failed to get relevant memories:', error);
            return [];
        }
    }

    buildMemoryContext(memories) {
        if (memories.length === 0) return 'No relevant past memories found.';
        
        let context = 'Relevant past memories:\n';
        
        memories.forEach((memory, index) => {
            const timeAgo = this.formatTimeAgo(memory.timestamp);
            
            if (memory.source === 'conversation') {
                context += `${index + 1}. ${timeAgo}: User said "${memory.userMessage}" and you responded "${memory.aiResponse}"\n`;
            } else {
                context += `${index + 1}. ${timeAgo}: ${memory.content}\n`;
            }
            
            // Add context info if available
            if (memory.context?.app && memory.context.app !== 'unknown') {
                context += `   (Context: ${memory.context.app})\n`;
            }
            
            // Add emotional context
            if (memory.emotion?.primary) {
                context += `   (Mood: ${memory.emotion.primary})\n`;
            }
        });
        
        return context;
    }

    async getUserPatterns() {
        try {
            let patterns = 'User behavior patterns:\n';
            
            // Analyze conversation topics
            const topicFrequency = await this.analyzeTopicFrequency();
            if (topicFrequency.size > 0) {
                patterns += 'Common topics: ' + Array.from(topicFrequency.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([topic, count]) => `${topic} (${count} times)`)
                    .join(', ') + '\n';
            }
            
            // Analyze emotional patterns
            const emotionalPatterns = await this.analyzeEmotionalPatterns();
            if (emotionalPatterns.size > 0) {
                patterns += 'Emotional patterns: ' + Array.from(emotionalPatterns.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([emotion, frequency]) => `${emotion} (${(frequency * 100).toFixed(0)}%)`)
                    .join(', ') + '\n';
            }
            
            // Analyze interaction preferences
            const interactionPrefs = await this.analyzeInteractionPreferences();
            if (interactionPrefs) {
                patterns += `Interaction style: ${interactionPrefs}\n`;
            }
            
            return patterns || 'No established patterns yet.';
            
        } catch (error) {
            console.error('❌ Failed to get user patterns:', error);
            return 'No pattern data available.';
        }
    }

    // MEMORY LEARNING AND PATTERN ANALYSIS

    async analyzeExistingMemories() {
        console.log('📊 Analyzing existing memories for patterns...');
        
        try {
            const allConversations = await this.memoryManager.getAllMemories('conversations');
            
            // Analyze topics
            for (const conversation of allConversations) {
                this.updateTopicFrequency(conversation);
                this.updateEmotionalPatterns(conversation);
                this.updateBehaviorPatterns(conversation);
            }
            
            console.log('✅ Memory analysis completed');
            
        } catch (error) {
            console.error('❌ Failed to analyze existing memories:', error);
        }
    }

    updateTopicFrequency(conversation) {
        if (!conversation.tags) return;
        
        for (const tag of conversation.tags) {
            const current = this.learningPatterns.conversationTopics.get(tag) || 0;
            this.learningPatterns.conversationTopics.set(tag, current + 1);
        }
    }

    updateEmotionalPatterns(conversation) {
        if (!conversation.emotion?.primary) return;
        
        const emotion = conversation.emotion.primary;
        const current = this.learningPatterns.emotionalTriggers.get(emotion) || 0;
        this.learningPatterns.emotionalTriggers.set(emotion, current + 1);
    }

    updateBehaviorPatterns(conversation) {
        // Analyze user message patterns
        if (!conversation.userMessage) return;
        
        const message = conversation.userMessage.toLowerCase();
        
        // Question vs statement preference
        const isQuestion = message.includes('?');
        const current = this.learningPatterns.behaviorPatterns.get('questions') || 0;
        if (isQuestion) {
            this.learningPatterns.behaviorPatterns.set('questions', current + 1);
        }
        
        // Message length preference
        const length = message.length;
        const lengthCategory = length < 50 ? 'short' : length < 150 ? 'medium' : 'long';
        const lengthCount = this.learningPatterns.behaviorPatterns.get(`length_${lengthCategory}`) || 0;
        this.learningPatterns.behaviorPatterns.set(`length_${lengthCategory}`, lengthCount + 1);
    }

    async analyzeTopicFrequency() {
        return this.learningPatterns.conversationTopics;
    }

    async analyzeEmotionalPatterns() {
        const total = Array.from(this.learningPatterns.emotionalTriggers.values())
            .reduce((sum, count) => sum + count, 0);
        
        if (total === 0) return new Map();
        
        const frequencies = new Map();
        for (const [emotion, count] of this.learningPatterns.emotionalTriggers) {
            frequencies.set(emotion, count / total);
        }
        
        return frequencies;
    }

    async analyzeInteractionPreferences() {
        const patterns = this.learningPatterns.behaviorPatterns;
        
        const questionCount = patterns.get('questions') || 0;
        const shortCount = patterns.get('length_short') || 0;
        const mediumCount = patterns.get('length_medium') || 0;
        const longCount = patterns.get('length_long') || 0;
        
        const total = shortCount + mediumCount + longCount;
        if (total === 0) return null;
        
        let style = '';
        
        // Determine question preference
        if (questionCount / total > 0.6) {
            style += 'Prefers asking questions, ';
        }
        
        // Determine length preference
        const maxLength = Math.max(shortCount, mediumCount, longCount);
        if (maxLength === shortCount) {
            style += 'prefers brief messages';
        } else if (maxLength === mediumCount) {
            style += 'prefers moderate-length messages';
        } else {
            style += 'prefers detailed messages';
        }
        
        return style;
    }

    // MEMORY-ENHANCED CONVERSATION HOOKS

    setupAIMemoryHooks() {
        if (!this.heartSystem.speechPlanner) return;
        
        // Hook into the AI response generation
        const originalCreatePrompt = this.heartSystem.speechPlanner.createPrompt.bind(this.heartSystem.speechPlanner);
        
        this.heartSystem.speechPlanner.createPrompt = async (input, inputEmotion) => {
            const originalPrompt = originalCreatePrompt(input, inputEmotion);
            
            // Enhance with memory context
            const context = this.heartSystem.getCurrentScreenContext() || {};
            return await this.enhanceAIPromptWithMemories(originalPrompt, input, context);
        };
        
        console.log('🔗 AI memory hooks established');
    }

    setupMemoryLearning() {
        // Hook into conversation storage to update learning patterns
        const originalStoreConversation = this.memoryManager.storeConversation.bind(this.memoryManager);
        
        this.memoryManager.storeConversation = async (userMessage, aiResponse, context) => {
            // Store the conversation
            const result = await originalStoreConversation(userMessage, aiResponse, context);
            
            // Update learning patterns
            const conversation = { userMessage, aiResponse, context, tags: this.memoryManager.extractTags(userMessage + ' ' + aiResponse) };
            this.updateTopicFrequency(conversation);
            this.updateBehaviorPatterns(conversation);
            
            return result;
        };
        
        console.log('🧠 Memory learning hooks established');
    }

    // UTILITY METHODS

    deduplicateMemories(memories) {
        const seen = new Set();
        return memories.filter(memory => {
            const key = memory.id || (memory.userMessage + memory.timestamp);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days} days ago`;
        if (hours > 0) return `${hours} hours ago`;
        if (minutes > 0) return `${minutes} minutes ago`;
        return 'Just now';
    }

    // PUBLIC API

    async getMemoryStats() {
        return await this.memoryManager.logMemoryStats();
    }

    async searchUserMemories(query, limit = 10) {
        return await this.memoryManager.searchMemories(query, { limit });
    }

    async getPersonalityInsights() {
        const topicFreq = await this.analyzeTopicFrequency();
        const emotionalPatterns = await this.analyzeEmotionalPatterns();
        const interactionPrefs = await this.analyzeInteractionPreferences();
        
        return {
            topics: Array.from(topicFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
            emotions: Array.from(emotionalPatterns.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
            interactionStyle: interactionPrefs
        };
    }

    // Enable/disable memory enhancement
    setMemoryEnhancement(enabled) {
        this.memoryInfluenceWeight = enabled ? 0.4 : 0;
        console.log(`🧠 Memory enhancement ${enabled ? 'enabled' : 'disabled'}`);
    }
}







