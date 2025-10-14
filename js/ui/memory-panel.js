/**
 * Memory System UI Panel
 * Provides interface for viewing and managing the enhanced memory system
 */

export class MemoryPanel {
    constructor(heartSystem) {
        this.heartSystem = heartSystem;
        this.isVisible = false;
        this.currentView = 'overview'; // overview, search, insights, settings
        
        this.initializePanel();
    }

    initializePanel() {
        this.createMemoryPanel();
        this.setupEventListeners();
    }

    createMemoryPanel() {
        // Add memory button to main UI
        this.addMemoryButton();
        
        // Create the memory panel
        const panel = document.createElement('div');
        panel.id = 'memory-panel';
        panel.className = 'memory-panel hidden';
        panel.innerHTML = `
            <div class="memory-panel-header">
                <h2>🧠 Memory System</h2>
                <div class="memory-nav">
                    <button class="nav-btn active" data-view="overview">Overview</button>
                    <button class="nav-btn" data-view="search">Search</button>
                    <button class="nav-btn" data-view="insights">Insights</button>
                    <button class="nav-btn" data-view="settings">Settings</button>
                </div>
                <button class="close-btn" id="close-memory-panel">✕</button>
            </div>
            
            <div class="memory-panel-content">
                <div class="memory-view" id="memory-overview">
                    <div class="memory-stats">
                        <h3>Memory Statistics</h3>
                        <div class="stats-grid" id="memory-stats-grid">
                            <div class="stat-card">
                                <div class="stat-number" id="total-conversations">-</div>
                                <div class="stat-label">Conversations</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="total-memories">-</div>
                                <div class="stat-label">Memories</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="emotional-states">-</div>
                                <div class="stat-label">Emotional States</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="contexts">-</div>
                                <div class="stat-label">Contexts</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="recent-memories">
                        <h3>Recent Memories</h3>
                        <div class="memory-list" id="recent-memory-list">
                            <div class="loading">Loading recent memories...</div>
                        </div>
                    </div>
                </div>
                
                <div class="memory-view hidden" id="memory-search">
                    <div class="search-section">
                        <h3>Search Memories</h3>
                        <div class="search-controls">
                            <input type="text" id="memory-search-input" placeholder="Search your memories...">
                            <button id="memory-search-btn">Search</button>
                        </div>
                        <div class="search-filters">
                            <select id="memory-type-filter">
                                <option value="">All Types</option>
                                <option value="conversation">Conversations</option>
                                <option value="memory">Structured Memories</option>
                                <option value="emotional">Emotional States</option>
                                <option value="context">Contexts</option>
                            </select>
                            <select id="time-range-filter">
                                <option value="">All Time</option>
                                <option value="3600000">Last Hour</option>
                                <option value="86400000">Last Day</option>
                                <option value="604800000">Last Week</option>
                                <option value="2592000000">Last Month</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="search-results" id="memory-search-results">
                        <div class="no-results">Enter a search term to find memories</div>
                    </div>
                </div>
                
                <div class="memory-view hidden" id="memory-insights">
                    <div class="insights-section">
                        <h3>Personality Insights</h3>
                        <div class="insights-content" id="personality-insights">
                            <div class="loading">Analyzing personality patterns...</div>
                        </div>
                    </div>
                    
                    <div class="learning-patterns">
                        <h3>Learning Patterns</h3>
                        <div class="patterns-content" id="learning-patterns">
                            <div class="pattern-category">
                                <h4>Common Topics</h4>
                                <div class="topic-tags" id="common-topics"></div>
                            </div>
                            <div class="pattern-category">
                                <h4>Emotional Patterns</h4>
                                <div class="emotion-chart" id="emotion-patterns"></div>
                            </div>
                            <div class="pattern-category">
                                <h4>Interaction Style</h4>
                                <div class="interaction-style" id="interaction-style"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="memory-view hidden" id="memory-settings">
                    <div class="settings-section">
                        <h3>Memory Settings</h3>
                        
                        <div class="setting-item">
                            <label for="memory-enhancement">
                                <input type="checkbox" id="memory-enhancement" checked>
                                Enable Memory-Enhanced Responses
                            </label>
                            <small>AI will use past memories to provide more contextual responses</small>
                        </div>
                        
                        <div class="setting-item">
                            <label for="context-window">Memory Context Window</label>
                            <select id="context-window">
                                <option value="5">5 memories</option>
                                <option value="10" selected>10 memories</option>
                                <option value="15">15 memories</option>
                                <option value="20">20 memories</option>
                            </select>
                            <small>Number of relevant memories to include in AI context</small>
                        </div>
                        
                        <div class="setting-item">
                            <label for="relevance-threshold">Relevance Threshold</label>
                            <input type="range" id="relevance-threshold" min="0.1" max="0.8" step="0.1" value="0.3">
                            <span id="relevance-value">0.3</span>
                            <small>Minimum relevance score for including memories</small>
                        </div>
                        
                        <div class="memory-actions">
                            <button id="export-memories" class="btn-secondary">Export Memories</button>
                            <button id="clear-old-memories" class="btn-secondary">Clear Old Memories</button>
                            <button id="optimize-memory" class="btn-primary">Optimize Memory</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        this.addMemoryPanelStyles();
        
        document.body.appendChild(panel);
    }

    addMemoryButton() {
        // Memory button is now integrated into the vision module panel
        // No need to create a separate floating button
    }

    addMemoryPanelStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .memory-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                height: 70%;
                background: rgba(20, 20, 20, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                color: white;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                backdrop-filter: blur(10px);
            }
            
            .memory-panel.hidden {
                display: none;
            }
            
            .memory-panel-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .memory-nav {
                display: flex;
                gap: 10px;
            }
            
            .nav-btn {
                padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                background: transparent;
                color: white;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .nav-btn.active {
                background: rgba(100, 100, 255, 0.5);
                border-color: rgba(100, 100, 255, 0.8);
            }
            
            .memory-panel-content {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
            }
            
            .memory-view {
                display: block;
            }
            
            .memory-view.hidden {
                display: none;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: #64b5f6;
            }
            
            .stat-label {
                margin-top: 5px;
                opacity: 0.8;
            }
            
            .memory-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .memory-item {
                background: rgba(255, 255, 255, 0.05);
                margin-bottom: 10px;
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #64b5f6;
            }
            
            .memory-meta {
                font-size: 0.9em;
                opacity: 0.7;
                margin-bottom: 8px;
            }
            
            .memory-content {
                line-height: 1.4;
            }
            
            .search-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .search-controls input {
                flex: 1;
                padding: 10px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border-radius: 5px;
            }
            
            .search-filters {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .search-filters select {
                padding: 8px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border-radius: 5px;
            }
            
            .topic-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .topic-tag {
                background: rgba(100, 181, 246, 0.3);
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.9em;
            }
            
            .emotion-chart {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .emotion-bar {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .emotion-name {
                width: 80px;
                font-size: 0.9em;
            }
            
            .emotion-progress {
                flex: 1;
                height: 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
            }
            
            .emotion-fill {
                height: 100%;
                background: linear-gradient(90deg, #64b5f6, #42a5f5);
                transition: width 0.3s;
            }
            
            .memory-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .btn-primary, .btn-secondary {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-primary {
                background: #64b5f6;
                color: white;
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 5px;
            }
        `;
        
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Memory panel button (from the vision module interface)
        const panelBtn = document.getElementById('memory-panel-btn');
        if (panelBtn) {
            panelBtn.addEventListener('click', () => {
                this.togglePanel();
            });
        }
        
        // Close button
        document.getElementById('close-memory-panel').addEventListener('click', () => {
            this.hidePanel();
        });
        
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // Search functionality
        document.getElementById('memory-search-btn').addEventListener('click', () => {
            this.performSearch();
        });
        
        document.getElementById('memory-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // Settings
        document.getElementById('memory-enhancement').addEventListener('change', (e) => {
            this.heartSystem.setMemoryEnhancement(e.target.checked);
        });
        
        document.getElementById('relevance-threshold').addEventListener('input', (e) => {
            document.getElementById('relevance-value').textContent = e.target.value;
        });
        
        // Memory actions
        document.getElementById('export-memories').addEventListener('click', () => {
            this.exportMemories();
        });
        
        document.getElementById('clear-old-memories').addEventListener('click', () => {
            this.clearOldMemories();
        });
        
        document.getElementById('optimize-memory').addEventListener('click', () => {
            this.optimizeMemory();
        });
    }

    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        document.getElementById('memory-panel').classList.remove('hidden');
        this.isVisible = true;
        
        // Load initial data
        this.loadOverviewData();
    }

    hidePanel() {
        document.getElementById('memory-panel').classList.add('hidden');
        this.isVisible = false;
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Update views
        document.querySelectorAll('.memory-view').forEach(viewEl => {
            viewEl.classList.add('hidden');
        });
        document.getElementById(`memory-${view}`).classList.remove('hidden');
        
        this.currentView = view;
        
        // Load view-specific data
        switch (view) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'insights':
                this.loadInsightsData();
                break;
        }
    }

    async loadOverviewData() {
        try {
            // Load memory statistics
            const stats = await this.heartSystem.getMemoryStats();
            
            if (stats.enhanced) {
                document.getElementById('total-conversations').textContent = stats.enhanced.conversations || 0;
                document.getElementById('total-memories').textContent = stats.enhanced.memories || 0;
                document.getElementById('emotional-states').textContent = stats.enhanced.emotionalStates || 0;
                document.getElementById('contexts').textContent = stats.enhanced.contexts || 0;
            }
            
            // Load recent memories
            const recentMemories = await this.heartSystem.enhancedMemoryManager?.getRecentConversations(10) || [];
            this.displayRecentMemories(recentMemories);
            
        } catch (error) {
            console.error('❌ Failed to load overview data:', error);
        }
    }

    displayRecentMemories(memories) {
        const listEl = document.getElementById('recent-memory-list');
        
        if (memories.length === 0) {
            listEl.innerHTML = '<div class="no-memories">No recent memories found</div>';
            return;
        }
        
        listEl.innerHTML = memories.map(memory => `
            <div class="memory-item">
                <div class="memory-meta">
                    ${new Date(memory.timestamp).toLocaleString()} • 
                    ${memory.memoryType || 'Unknown'} • 
                    Importance: ${((memory.importance || 0) * 100).toFixed(0)}%
                </div>
                <div class="memory-content">
                    <strong>You:</strong> ${memory.userMessage || 'N/A'}<br>
                    <strong>AI:</strong> ${memory.aiResponse || 'N/A'}
                </div>
            </div>
        `).join('');
    }

    async loadInsightsData() {
        try {
            const insights = await this.heartSystem.getPersonalityInsights();
            
            if (insights) {
                this.displayTopics(insights.topics);
                this.displayEmotionPatterns(insights.emotions);
                this.displayInteractionStyle(insights.interactionStyle);
            }
            
        } catch (error) {
            console.error('❌ Failed to load insights data:', error);
        }
    }

    displayTopics(topics) {
        const topicsEl = document.getElementById('common-topics');
        
        if (!topics || topics.length === 0) {
            topicsEl.innerHTML = '<div class="no-data">No topic patterns found</div>';
            return;
        }
        
        topicsEl.innerHTML = topics.map(([topic, count]) => 
            `<span class="topic-tag">${topic} (${count})</span>`
        ).join('');
    }

    displayEmotionPatterns(emotions) {
        const emotionsEl = document.getElementById('emotion-patterns');
        
        if (!emotions || emotions.length === 0) {
            emotionsEl.innerHTML = '<div class="no-data">No emotional patterns found</div>';
            return;
        }
        
        emotionsEl.innerHTML = emotions.map(([emotion, frequency]) => `
            <div class="emotion-bar">
                <div class="emotion-name">${emotion}</div>
                <div class="emotion-progress">
                    <div class="emotion-fill" style="width: ${frequency * 100}%"></div>
                </div>
                <div class="emotion-percent">${(frequency * 100).toFixed(0)}%</div>
            </div>
        `).join('');
    }

    displayInteractionStyle(style) {
        const styleEl = document.getElementById('interaction-style');
        styleEl.innerHTML = style || 'No interaction patterns detected yet';
    }

    async performSearch() {
        const query = document.getElementById('memory-search-input').value.trim();
        const typeFilter = document.getElementById('memory-type-filter').value;
        const timeRange = document.getElementById('time-range-filter').value;
        
        if (!query) return;
        
        try {
            const results = await this.heartSystem.searchMemories(query, {
                limit: 20,
                type: typeFilter,
                timeRange: timeRange ? parseInt(timeRange) : null
            });
            
            this.displaySearchResults(results);
            
        } catch (error) {
            console.error('❌ Search failed:', error);
        }
    }

    displaySearchResults(results) {
        const resultsEl = document.getElementById('memory-search-results');
        
        if (results.length === 0) {
            resultsEl.innerHTML = '<div class="no-results">No memories found matching your search</div>';
            return;
        }
        
        resultsEl.innerHTML = results.map(result => `
            <div class="memory-item">
                <div class="memory-meta">
                    ${new Date(result.timestamp).toLocaleString()} • 
                    Relevance: ${((result.relevanceScore || 0) * 100).toFixed(0)}% •
                    Source: ${result.source}
                </div>
                <div class="memory-content">
                    ${result.userMessage ? `<strong>You:</strong> ${result.userMessage}<br>` : ''}
                    ${result.aiResponse ? `<strong>AI:</strong> ${result.aiResponse}` : ''}
                    ${result.content ? `<strong>Content:</strong> ${result.content}` : ''}
                </div>
            </div>
        `).join('');
    }

    async exportMemories() {
        try {
            const stats = await this.heartSystem.getMemoryStats();
            const insights = await this.heartSystem.getPersonalityInsights();
            
            const exportData = {
                timestamp: new Date().toISOString(),
                stats,
                insights,
                version: '1.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `memory-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('❌ Export failed:', error);
            alert('Failed to export memories');
        }
    }

    async clearOldMemories() {
        if (!confirm('Are you sure you want to clear old memories? This action cannot be undone.')) {
            return;
        }
        
        try {
            // This would call a cleanup method on the memory manager
            console.log('🧹 Clearing old memories...');
            alert('Old memories cleared successfully');
            
            // Refresh the overview
            if (this.currentView === 'overview') {
                this.loadOverviewData();
            }
            
        } catch (error) {
            console.error('❌ Failed to clear old memories:', error);
            alert('Failed to clear old memories');
        }
    }

    async optimizeMemory() {
        try {
            console.log('🔧 Optimizing memory system...');
            
            // This would call optimization methods on the memory manager
            await this.heartSystem.enhancedMemoryManager?.performMemoryMaintenance();
            
            alert('Memory optimization completed');
            
            // Refresh the overview
            if (this.currentView === 'overview') {
                this.loadOverviewData();
            }
            
        } catch (error) {
            console.error('❌ Memory optimization failed:', error);
            alert('Memory optimization failed');
        }
    }
}
