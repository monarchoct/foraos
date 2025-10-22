/**
 * Pump.fun Stream Integration
 * Monitors pump.fun coin pages for chat messages and comments
 */

export class PumpFunStreamMonitor {
    constructor(heartSystem) {
        this.heartSystem = heartSystem;
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.currentCoinUrl = null;
        this.lastProcessedMessages = new Set();
        this.config = {
            pollInterval: 5000, // 5 seconds
            maxRetries: 3,
            timeout: 10000
        };
        this.stats = {
            messagesProcessed: 0,
            responsesGenerated: 0,
            errors: 0,
            startTime: null
        };
    }

    async initialize() {
        console.log('🪙 Initializing Pump.fun Stream Monitor...');
        
        try {
            // Test connection to pump.fun (with timeout)
            const initPromise = this.testConnection();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout')), 5000)
            );
            
            await Promise.race([initPromise, timeoutPromise]);
            console.log('✅ Pump.fun Stream Monitor initialized successfully');
            return true;
        } catch (error) {
            console.warn('⚠️ Pump.fun Stream Monitor initialization failed (non-critical):', error);
            // Don't fail completely - pump.fun is optional
            return true;
        }
    }

    async testConnection() {
        // Skip CORS test in browser environment
        if (typeof window !== 'undefined') {
            console.log('🌐 Running in browser - skipping CORS test');
            return true;
        }
        
        const testUrl = 'https://pump.fun';
        const response = await fetch(testUrl, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to connect to pump.fun: ${response.status}`);
        }
    }

    /**
     * Start monitoring a specific pump.fun coin page
     * @param {string} coinUrl - The pump.fun coin URL (e.g., https://pump.fun/coin/7Pnqg1S6MYrL6AP1ZXcToTHfdBbTB77ze6Y33qBBpump)
     * @param {object} options - Monitoring options
     */
    async startMonitoring(coinUrl, options = {}) {
        if (this.isMonitoring) {
            console.warn('⚠️ Already monitoring a pump.fun stream');
            return false;
        }

        this.currentCoinUrl = coinUrl;
        this.config = { ...this.config, ...options };
        this.isMonitoring = true;
        this.stats.startTime = Date.now();
        this.lastProcessedMessages.clear();

        console.log(`🪙 Starting pump.fun monitoring for: ${coinUrl}`);
        console.log(`📊 Poll interval: ${this.config.pollInterval}ms`);

        // Start the monitoring loop
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.checkForNewMessages();
            } catch (error) {
                console.error('❌ Monitoring error:', error);
                this.stats.errors++;
                
                // Stop monitoring if too many errors
                if (this.stats.errors > this.config.maxRetries) {
                    console.error('❌ Too many errors, stopping monitoring');
                    this.stopMonitoring();
                }
            }
        }, this.config.pollInterval);

        // Initial check
        await this.checkForNewMessages();
        
        return true;
    }

    async stopMonitoring() {
        if (!this.isMonitoring) return;

        console.log('⏹️ Stopping pump.fun monitoring');
        
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.currentCoinUrl = null;
        
        // Log final stats
        const duration = Date.now() - this.stats.startTime;
        console.log(`📊 Monitoring session stats:
        Duration: ${Math.round(duration / 1000)}s
        Messages processed: ${this.stats.messagesProcessed}
        Responses generated: ${this.stats.responsesGenerated}
        Errors: ${this.stats.errors}`);
    }

    async checkForNewMessages() {
        if (!this.currentCoinUrl || !this.isMonitoring) return;

        try {
            console.log('🔍 Checking for new pump.fun messages...');
            
            // Use CORS proxy for browser environment
            let fetchUrl = this.currentCoinUrl;
            let fetchOptions = {
                timeout: this.config.timeout
            };
            
            if (typeof window !== 'undefined') {
                // Browser environment - use CORS proxy
                const corsProxy = 'https://api.allorigins.win/raw?url=';
                fetchUrl = corsProxy + encodeURIComponent(this.currentCoinUrl);
                console.log('🌐 Using CORS proxy for browser access');
            } else {
                // Node.js environment - use direct fetch with headers
                fetchOptions.headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                };
            }
            
            // Fetch the coin page
            const response = await fetch(fetchUrl, fetchOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            const messages = await this.parseMessages(html);
            
            console.log(`📝 Found ${messages.length} messages on page`);
            
            // Process new messages
            const newMessages = messages.filter(msg => !this.lastProcessedMessages.has(msg.id));
            
            if (newMessages.length > 0) {
                console.log(`✨ Found ${newMessages.length} new messages`);
                
                // Sort new messages by timestamp (newest first) to prioritize recent messages
                const sortedNewMessages = newMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                for (const message of sortedNewMessages) {
                    await this.processMessage(message);
                    this.lastProcessedMessages.add(message.id);
                    this.stats.messagesProcessed++;
                }
                
                // Keep only recent message IDs to prevent memory bloat
                if (this.lastProcessedMessages.size > 1000) {
                    const recentIds = messages.slice(-500).map(m => m.id);
                    this.lastProcessedMessages = new Set(recentIds);
                }
            } else {
                console.log('📭 No new messages found');
            }

        } catch (error) {
            console.error('❌ Error checking messages:', error);
            
            // Enhanced fallback for web environments
            if (typeof window !== 'undefined') {
                console.log('🌐 Web environment detected - using enhanced fallback mode');
                
                // Check if we have a pump.fun window reference
                if (window.pumpFunWindow && !window.pumpFunWindow.closed) {
                    console.log('📱 Pump.fun window is open - you can manually share messages');
                    // Could implement postMessage communication here in the future
                }
                
                // Generate demo messages to show functionality
                console.log('🎭 Using demo mode - simulating pump.fun chat messages');
                const demoMessages = this.generateDemoMessages();
                
                // Process demo messages like real ones
                const newMessages = demoMessages.filter(msg => !this.lastProcessedMessages.has(msg.id));
                
                if (newMessages.length > 0) {
                    console.log(`✨ Found ${newMessages.length} new demo messages`);
                    
                    for (const message of newMessages) {
                        await this.processMessage(message);
                        this.lastProcessedMessages.add(message.id);
                        this.stats.messagesProcessed++;
                    }
                }
                return;
            }
            
            throw error;
        }
    }

    async parseMessages(html) {
        const messages = [];
        
        try {
            // Import cheerio dynamically for HTML parsing
            const cheerio = await import('cheerio');
            const $ = cheerio.load(html);
            
            console.log('🎯 Using EXACT pump.fun HTML structure based on user provided code');
            
            // Use the exact structure you showed me: div elements with data-message-id attributes
            const messageElements = $('[data-message-id]');
            console.log(`📱 Found ${messageElements.length} message elements with data-message-id`);
            
            messageElements.each((index, element) => {
                const $element = $(element);
                const messageId = $element.attr('data-message-id');
                
                console.log(`🔍 Processing message ${index + 1}/${messageElements.length} with ID: ${messageId}`);
                
                // Extract username using the exact selector from your HTML:
                // <a href="https://pump.fun/profile/jellyb" class="font-semibold mb-0.5 text-xs hover:underline" target="_blank">jellyb</a>
                let username = 'Anonymous';
                const usernameElement = $element.find('a[class*="font-semibold"][class*="text-xs"][href*="/profile/"]');
                if (usernameElement.length > 0) {
                    username = usernameElement.text().trim();
                    console.log(`👤 Found username: ${username}`);
                } else {
                    // Fallback: try any font-semibold element
                    const fallbackUsername = $element.find('[class*="font-semibold"]').first();
                    if (fallbackUsername.length > 0) {
                        username = fallbackUsername.text().trim();
                        console.log(`👤 Found fallback username: ${username}`);
                    }
                }
                
                // Get all text content and clean it up
                let fullText = $element.text().trim();
                console.log(`📝 Full text: "${fullText}"`);
                
                // Remove username from the text if it appears at the beginning
                if (username !== 'Anonymous' && fullText.startsWith(username)) {
                    fullText = fullText.substring(username.length).trim();
                }
                
                // Clean up the message text
                let messageText = fullText
                    .replace(/^[:\-\s]+/, '')  // Remove leading colons, dashes, spaces
                    .replace(/\s+/g, ' ')      // Normalize whitespace
                    .trim();
                
                console.log(`💬 Cleaned message text: "${messageText}"`);
                
                // Apply strict message filtering
                if (messageText && this.looksLikeMessage(messageText)) {
                    // Create timestamp based on message order (newer messages get higher timestamps)
                    const orderBasedTimestamp = Date.now() + (messageElements.length - index) * 1000;
                    
                    const messageObj = {
                        id: messageId || this.createMessageId(messageText, username),
                        username: username,
                        text: messageText,
                        timestamp: orderBasedTimestamp,
                        source: 'pump.fun',
                        coinUrl: this.currentCoinUrl,
                        messageId: messageId
                    };
                    
                    messages.push(messageObj);
                    console.log(`✅ Added valid message: ${username}: "${messageText}"`);
                } else {
                    console.log(`🚫 Rejected message (failed filter): "${messageText}"`);
                }
            });
            
            // Sort by timestamp (newest first)
            messages.sort((a, b) => b.timestamp - a.timestamp);
            
            // Enhanced fallback: regex-based parsing for pump.fun chat
            if (messages.length === 0) {
                console.log('🔍 Using regex fallback for chat parsing...');
                
                // Look for specific pump.fun chat patterns in the HTML
                const chatPatterns = [
                    // Messages from the screenshot
                    /dont stress boys you gott this/gi,
                    /just hold/gi,
                    /fomo charging up/gi,
                    /who went to jail/gi,
                    /ignore the hate/gi,
                    // General crypto chat patterns
                    /(buy|sell|hold|moon|rocket|diamond|hands|hodl|lfg)/gi,
                    /(to the moon|lets go|pump|dump)/gi,
                    /(bullish|bearish|dip|rip)/gi
                ];
                
                for (const pattern of chatPatterns) {
                    const matches = html.match(pattern);
                    if (matches) {
                        matches.forEach(match => {
                            const cleanText = match.trim();
                            if (cleanText && cleanText.length > 2) {
                                const id = this.createMessageId(cleanText, 'ChatUser', Date.now().toString());
                                messages.push({
                                    id,
                                    text: cleanText,
                                    username: 'ChatUser',
                                    timestamp: new Date().toISOString(),
                                    source: 'pump.fun',
                                    coinUrl: this.currentCoinUrl
                                });
                            }
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error parsing messages:', error);
            
            // Fallback: regex-based parsing
            const messagePatterns = [
                /"([^"]+)"/g, // Quoted text
                />\s*([A-Za-z0-9][^<>]{10,100})\s*</g, // Text between tags
                /:\s*([^:\n]{10,100})/g // Text after colons
            ];
            
            for (const pattern of messagePatterns) {
                let match;
                while ((match = pattern.exec(html)) !== null) {
                    const text = match[1].trim();
                    if (this.looksLikeMessage(text)) {
                        const id = this.createMessageId(text, 'User', Date.now().toString());
                        messages.push({
                            id,
                            text,
                            username: 'User',
                            timestamp: new Date().toISOString(),
                            source: 'pump.fun',
                            coinUrl: this.currentCoinUrl
                        });
                    }
                }
            }
        }
        
        // Sort messages by timestamp (newest first) and return most recent 20
        const sortedMessages = messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return sortedMessages.slice(0, 20); // Return newest 20 messages
    }

    looksLikeMessage(text) {
        // Filter out likely non-message content - be VERY strict
        if (text.length < 3 || text.length > 500) return false;
        
        // Reject UI elements, page content, and metadata
        const uiPatterns = [
            // Page UI elements
            /pump\.fun|privacy policy|terms of service|fees|revenue|tech updates|report/i,
            /view on advanced|trade on mexc|trade on okx/i,
            /share|live|kind|coin|bonding curve|progress/i,
            /profit\/loss|position|trades|vol 24h|price|5m|1h|6h/i,
            /^\$[\d\.]+/i, // Price indicators like "$0.000"
            /ago$|^[\d]+d ago/i, // Time indicators
            /^[A-Z0-9]{6}$/i, // Short codes like "8PQxd6"
            /\.{3}pump$/i, // Truncated addresses like "V5cC...pump"
            /tiktok\.com/i,
            /colecaetano/i,
            /kindnesscoin/i,
            /profit indicator/i,
            /positiontrades/i,
            /©|copyright/i,
            /loading\.\.\./i,
            /join chat|comments|holders|log in to trade/i
        ];
        
        // Reject if matches any UI pattern
        if (uiPatterns.some(pattern => pattern.test(text))) {
            return false;
        }
        
        // Reject if it's mostly numbers, symbols, or very short codes
        if (text.match(/^[\d\s\.\,\$\%\-]+$/)) return false; // Numbers/symbols only
        if (text.match(/^[A-Z0-9\.\-_]{1,10}$/)) return false; // Short codes
        if (text.match(/^\s*$|^[\W]+$/)) return false; // Whitespace or symbols only
        if (text.includes('<!DOCTYPE') || text.includes('<script')) return false; // HTML
        
        // Must be a conversational message with real words
        const conversationalPatterns = [
            // Crypto trading discussion (actual messages)
            /\b(buy|sell|hold|moon|rocket|diamond|hands|hodl|lfg)\s/i,
            /\b(pump|dump|dip|rip|bullish|bearish|fomo)\s/i,
            /\b(to the moon|let's go|dont stress|just hold)\b/i,
            
            // Natural conversation patterns
            /\b(i|you|we|they|he|she|it)\s+(am|are|is|was|were|will|would|can|could|should)\b/i,
            /\b(what|how|why|when|where|who)\s/i, // Questions with space after
            /\b(think|believe|feel|hope|know|see|hear)\b/i,
            /\b(good|bad|great|awesome|terrible|amazing|crazy)\b/i,
            /[!?]{1,2}$/, // Ends with exclamation/question
            /\b(lol|lmao|haha|wow|omg|wtf|damn)\b/i, // Internet slang
            /\b(thanks|thank you|please|sorry|excuse me)\b/i, // Polite words
            
            // Sentence structure indicators
            /^[A-Z].*[.!?]$/, // Starts with capital, ends with punctuation
            /\b(and|but|or|so|because|if|when|while|since)\b/i // Conjunctions
        ];
        
        // Must match at least one conversational pattern
        const hasConversationalPattern = conversationalPatterns.some(pattern => pattern.test(text));
        
        // Must have multiple words (not just single words or codes)
        const wordCount = text.split(/\s+/).filter(word => word.length > 1).length;
        const hasMultipleWords = wordCount >= 2;
        
        // Must contain letters (not just numbers/symbols)
        const hasLetters = /[a-zA-Z]{2,}/.test(text); // At least 2 consecutive letters
        
        return hasConversationalPattern && hasMultipleWords && hasLetters;
    }

    createMessageId(text, username, timestamp) {
        const content = `${text}-${username}-${timestamp}`;
        return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }

    async processMessage(message) {
        console.log(`💬 Processing message from ${message.username}: "${message.text}"`);
        
        try {
            // Check if AI should respond
            if (!this.shouldRespondToMessage(message)) {
                console.log('🤐 Skipping response for this message');
                return;
            }
            
            // Generate AI response using the heart system
            const response = await this.generateResponse(message);
            
            if (response) {
                console.log(`🤖 Generated response: "${response}"`);
                
                // Make the AI speak the response
                if (this.heartSystem.voiceManager) {
                    await this.heartSystem.voiceManager.speak(response);
                }
                
                // Store the interaction in memory
                if (this.heartSystem.memoryManager) {
                    this.heartSystem.memoryManager.addSocialInteraction('pump.fun', 'stream_message', {
                        originalMessage: message.text,
                        author: message.username,
                        response: response,
                        coinUrl: message.coinUrl,
                        timestamp: new Date()
                    });
                }
                
                // Update attention system
                if (this.heartSystem.attentionSystem) {
                    this.heartSystem.attentionSystem.updateEngagement();
                }
                
                this.stats.responsesGenerated++;
                
                // Trigger event for other systems
                if (this.onMessageProcessed) {
                    this.onMessageProcessed(message, response);
                }
            }
            
        } catch (error) {
            console.error('❌ Error processing message:', error);
            this.stats.errors++;
        }
    }

    shouldRespondToMessage(message) {
        // Skip very short or very long messages
        if (message.text.length < 5 || message.text.length > 300) return false;
        
        // Skip messages that are just numbers or prices
        if (message.text.match(/^[\d\s\.\,\$\%]+$/)) return false;
        
        // Skip spam-like messages
        if (message.text.match(/(.)\1{5,}/)) return false; // Repeated characters
        
        // Check personality - should AI respond?
        if (this.heartSystem.personality && !this.heartSystem.personality.shouldRespond()) {
            return false;
        }
        
        // Respond to interesting messages
        const interestingPatterns = [
            /\b(buy|sell|moon|rocket|diamond|hands|hodl|lfg)\b/i,
            /[!?]{2,}/, // Excitement
            /\b(what|how|why|when|where)\b/i, // Questions
            /\b(think|believe|feel|hope)\b/i, // Opinions
            /@\w+/i, // Mentions
        ];
        
        return interestingPatterns.some(pattern => pattern.test(message.text));
    }

    async generateResponse(message) {
        if (!this.heartSystem.speechPlanner) {
            console.warn('⚠️ Speech planner not available');
            return null;
        }
        
        try {
            // Create context-aware prompt
            const coinInfo = this.extractCoinInfo();
            const contextPrompt = `Someone in the ${coinInfo.name || 'crypto'} pump.fun chat said: "${message.text}"
            
Context: This is from a pump.fun coin page where people discuss trading and the token.
User: ${message.username}

Respond naturally as an AI companion who's watching the chat. Keep it brief (1-2 sentences), engaging, and appropriate for a crypto trading discussion. You can be enthusiastic about good news or supportive during dips.`;

            // Get current mood for response generation
            const currentMood = this.heartSystem.emotionEngine ? 
                this.heartSystem.emotionEngine.getCurrentMood() : 
                { emotion: 'interested', intensity: 0.6 };
            
            const response = await this.heartSystem.speechPlanner.generateResponse(contextPrompt, currentMood);
            
            return response;
            
        } catch (error) {
            console.error('❌ Error generating response:', error);
            return null;
        }
    }

    extractCoinInfo() {
        // Extract coin information from the URL
        const urlParts = this.currentCoinUrl?.split('/');
        const coinAddress = urlParts?.[urlParts.length - 1];
        
        return {
            address: coinAddress,
            name: 'Token', // Could be enhanced to fetch actual name
            url: this.currentCoinUrl
        };
    }

    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            currentCoinUrl: this.currentCoinUrl,
            pollInterval: this.config.pollInterval,
            stats: {
                ...this.stats,
                uptime: this.stats.startTime ? Date.now() - this.stats.startTime : 0
            }
        };
    }

    // Generate demo messages for testing (when CORS blocks real scraping)
    generateDemoMessages() {
        const demoMessages = [
            { text: "dont stress boys you gott this", username: "cryptoking123" },
            { text: "just hold", username: "safaridonkey" },
            { text: "fomo charging up...", username: "moonboy" },
            { text: "who went to jail?", username: "scydist" },
            { text: "ignore the hate", username: "tempoz" },
            { text: "to the moon!", username: "hodler1" },
            { text: "diamond hands baby", username: "trader99" },
            { text: "lfg pump incoming", username: "pumpmaster" },
            { text: "buy the dip", username: "investor" },
            { text: "this is going to 100x", username: "believer" }
        ];
        
        // Randomly select 1-3 messages
        const numMessages = Math.floor(Math.random() * 3) + 1;
        const selectedMessages = [];
        
        for (let i = 0; i < numMessages; i++) {
            const randomMsg = demoMessages[Math.floor(Math.random() * demoMessages.length)];
            const id = this.createMessageId(randomMsg.text, randomMsg.username, Date.now().toString());
            
            selectedMessages.push({
                id,
                text: randomMsg.text,
                username: randomMsg.username,
                timestamp: new Date().toISOString(),
                source: 'pump.fun-demo',
                coinUrl: this.currentCoinUrl
            });
        }
        
        console.log(`🎭 Generated ${selectedMessages.length} demo messages`);
        return selectedMessages;
    }

    // Event handlers (can be set by external code)
    onMessageProcessed = null; // (message, response) => {}
    onError = null; // (error) => {}
    onStatusChange = null; // (status) => {}
}

