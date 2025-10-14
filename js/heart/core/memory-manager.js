export class MemoryManager {
    constructor(heartState, configManager, walletManager = null) {
        this.heartState = heartState;
        this.configManager = configManager;
        this.walletManager = walletManager;
        this.conversationHistory = [];
        this.emotionalHistory = [];
        this.maxHistorySize = 100;
        this.memoryConfig = null;
    }

    async initialize() {
        console.log('🧠 Initializing Memory Manager...');
        
        // Load memory from JSON file
        await this.loadFromFile();
        
        // Initialize conversation and emotional history arrays
        if (!this.heartState.conversation) {
            this.heartState.conversation = {
                lastMessage: "",
                messageCount: 0,
                sessionStart: new Date().toISOString()
            };
        }
        
        console.log('✅ Memory Manager initialized!');
    }

    async loadFromFile() {
        try {
            // Try to load from backend first if wallet manager is available
            if (this.walletManager && this.walletManager.getConnectionStatus().isAuthenticated) {
                try {
                    const backendData = await this.walletManager.loadMemory();
                    this.conversationHistory = backendData.conversationHistory || [];
                    this.emotionalHistory = backendData.emotionalHistory || [];
                    this.memoryConfig = backendData;
                    console.log('📂 Loaded memory from backend:', {
                        conversations: this.conversationHistory.length,
                        emotions: this.emotionalHistory.length,
                        lastSaved: backendData.lastSaved
                    });
                    return;
                } catch (error) {
                    console.log('⚠️ Failed to load from backend, falling back to local storage');
                }
            }
            
            // Fallback to config and localStorage
            this.memoryConfig = this.configManager.getConfig('memory');
            
            if (!this.memoryConfig || !this.memoryConfig.conversationHistory) {
                const storedData = localStorage.getItem('heart-memory-data');
                if (storedData) {
                    this.memoryConfig = JSON.parse(storedData);
                    console.log('📂 Loaded memory from localStorage');
                }
            }
            
            if (this.memoryConfig) {
                this.conversationHistory = this.memoryConfig.conversationHistory || [];
                this.emotionalHistory = this.memoryConfig.emotionalHistory || [];
                console.log('📂 Loaded memory:', {
                    conversations: this.conversationHistory.length,
                    emotions: this.emotionalHistory.length,
                    lastSaved: this.memoryConfig.lastSaved
                });
            }
        } catch (error) {
            console.error('❌ Error loading memory:', error);
        }
    }

    async saveToFile() {
        try {
            const dataToSave = {
                conversationHistory: this.conversationHistory,
                emotionalHistory: this.emotionalHistory,
                lastSaved: new Date().toISOString(),
                sessionStart: this.heartState.conversation?.sessionStart || new Date().toISOString(),
                totalMessages: this.conversationHistory.length,
                memoryVersion: "1.0"
            };
            
            // Try to save to backend first if wallet manager is available
            if (this.walletManager && this.walletManager.getConnectionStatus().isAuthenticated) {
                try {
                    await this.walletManager.saveMemory(dataToSave);
                    console.log('💾 Memory saved to backend');
                } catch (error) {
                    console.log('⚠️ Failed to save to backend, falling back to local storage');
                }
            }
            
            // Update the memory config in memory
            this.memoryConfig = dataToSave;
            await this.configManager.updateConfig('memory', dataToSave);
            
            // Save to localStorage with proper structure
            localStorage.setItem('heart-memory-data', JSON.stringify(dataToSave, null, 2));
            
            console.log('💾 Memory saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving memory:', error);
        }
    }

    addUserMessage(message) {
        const conversationEntry = {
            type: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            emotion: null // Will be filled by emotion engine
        };
        
        this.conversationHistory.push(conversationEntry);
        this.heartState.conversation.lastMessage = message;
        
        // Keep history within size limit
        if (this.conversationHistory.length > this.maxHistorySize) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistorySize);
        }
        
        // Save to file
        this.saveToFile();
        
        console.log('💾 Stored user message in memory');
    }

    addConversation(userMessage, aiResponse) {
        const conversationEntry = {
            user: userMessage,
            ai: aiResponse,
            timestamp: new Date().toISOString(),
            mood: this.heartState.mood
        };
        
        this.conversationHistory.push(conversationEntry);
        
        // Keep history within size limit
        if (this.conversationHistory.length > this.maxHistorySize) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistorySize);
        }
        
        // Save to file
        this.saveToFile();
        
        console.log('💾 Stored conversation in memory');
    }

    addEmotionalState(mood, trigger) {
        const emotionalEntry = {
            mood: mood,
            trigger: trigger,
            timestamp: new Date().toISOString()
        };
        
        this.emotionalHistory.push(emotionalEntry);
        
        // Keep emotional history within size limit
        if (this.emotionalHistory.length > this.maxHistorySize) {
            this.emotionalHistory = this.emotionalHistory.slice(-this.maxHistorySize);
        }
        
        // Save to storage
        this.saveToStorage();
        
        console.log('💾 Stored emotional state in memory');
    }

    getRecentConversations(count = 10) {
        return this.conversationHistory.slice(-count);
    }

    getConversationHistory() {
        return this.conversationHistory;
    }

    getEmotionalHistory() {
        return this.emotionalHistory;
    }

    getRecentMoodChanges(count = 5) {
        return this.emotionalHistory.slice(-count);
    }

    findSimilarConversations(query, limit = 5) {
        const queryLower = query.toLowerCase();
        
        return this.conversationHistory
            .filter(entry => {
                if (entry.user) {
                    return entry.user.toLowerCase().includes(queryLower) ||
                           entry.ai.toLowerCase().includes(queryLower);
                }
                return false;
            })
            .slice(-limit);
    }

    getConversationStats() {
        const totalMessages = this.conversationHistory.length;
        const userMessages = this.conversationHistory.filter(entry => entry.type === 'user').length;
        const aiMessages = totalMessages - userMessages;
        
        const sessionStart = new Date(this.heartState.conversation.sessionStart);
        const sessionDuration = (Date.now() - sessionStart.getTime()) / (1000 * 60); // in minutes
        
        return {
            totalMessages,
            userMessages,
            aiMessages,
            sessionDuration,
            averageResponseTime: this.calculateAverageResponseTime()
        };
    }

    calculateAverageResponseTime() {
        // This would calculate average response time from conversation history
        // For now, return a placeholder
        return 2.5; // seconds
    }

    getMoodTrend() {
        const recentMoods = this.emotionalHistory.slice(-10);
        
        if (recentMoods.length < 2) {
            return 'stable';
        }
        
        // Analyze mood changes
        const moodChanges = recentMoods.map(entry => entry.mood.primary);
        const uniqueMoods = new Set(moodChanges);
        
        if (uniqueMoods.size === 1) {
            return 'stable';
        } else if (uniqueMoods.size > 3) {
            return 'volatile';
        } else {
            return 'changing';
        }
    }

    async saveState() {
        try {
            await this.saveToStorage();
            console.log('💾 Memory state saved to localStorage');
            return true;
        } catch (error) {
            console.error('❌ Error saving memory state:', error);
            return false;
        }
    }

    async loadState() {
        try {
            await this.loadFromStorage();
            console.log('📂 Memory state loaded from localStorage');
            return true;
        } catch (error) {
            console.error('❌ Error loading memory state:', error);
            return false;
        }
    }

    clearHistory() {
        this.conversationHistory = [];
        this.emotionalHistory = [];
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Memory history cleared from localStorage');
    }

    getMemoryUsage() {
        return {
            conversationHistorySize: this.conversationHistory.length,
            emotionalHistorySize: this.emotionalHistory.length,
            maxSize: this.maxHistorySize,
            storageSize: JSON.stringify(this.conversationHistory).length + JSON.stringify(this.emotionalHistory).length
        };
    }

    // Export memory as JSON file
    exportMemory() {
        const exportData = {
            conversationHistory: this.conversationHistory,
            emotionalHistory: this.emotionalHistory,
            exportDate: new Date().toISOString(),
            stats: this.getConversationStats()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `heart-memory-${Date.now()}.json`;
        link.click();
        
        console.log('📤 Memory exported as JSON file');
    }

    // Import memory from JSON file
    async importMemory(file) {
        try {
            const text = await file.text();
            const importedData = JSON.parse(text);
            
            if (importedData.conversationHistory) {
                this.conversationHistory = importedData.conversationHistory;
            }
            if (importedData.emotionalHistory) {
                this.emotionalHistory = importedData.emotionalHistory;
            }
            
            await this.saveToStorage();
            console.log('📥 Memory imported from JSON file');
            
            return true;
        } catch (error) {
            console.error('❌ Error importing memory:', error);
            return false;
        }
    }
} 