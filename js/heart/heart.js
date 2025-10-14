// THREE.js is loaded globally via CDN in index.html
const THREE = window.THREE;
import { EmotionEngine } from './core/emotion-engine.js';
import { ThoughtManager } from './core/thought-manager.js';
import { AffinityManager } from './core/affinity-manager.js';
import { SpeechPlanner } from './core/speech-planner.js';
import { AutonomousLoop } from './core/autonomous-loop.js';
import { AttentionSystem } from './core/attention-system.js';
import { MemoryManager } from './core/memory-manager.js';
// import { EnhancedMemoryManager } from '../memory/enhanced-memory-manager.js';
import { MemoryIntegration } from '../memory/memory-integration.js';
import { SocialOutputManager } from './core/social-output-manager.js';
import { MoodDrift } from './core/mood-drift.js';
import { Personality } from './core/personality.js';
import { TwitterManager } from './social/twitter-manager.js';

import { AnimationManager } from './viz/animation-manager.js';
import { BlendshapeManager } from './viz/blendshape-manager.js';
import { MicroMovementManager } from './viz/micro-movement-manager.js';
import { VoiceManager } from './viz/voice-manager.js';
import { BackgroundManager } from './viz/background-manager.js';
import { Renderer } from './viz/renderer-clean.js';

import { InputManager } from './inputs/input-manager.js';
import { ScreenCaptureVision } from '../vision/screen-capture.js';

export class HeartSystem {
    constructor(configManager, uiManager = null, walletManager = null) {
        this.configManager = configManager;
        this.uiManager = uiManager;
        this.walletManager = walletManager;
        this.personality = null;
        this.heartState = null;
        
        // Core AI Logic Components
        this.emotionEngine = null;
        this.thoughtManager = null;
        this.affinityManager = null;
        this.speechPlanner = null;
        this.autonomousLoop = null;
        this.attentionSystem = null;
        this.memoryManager = null;
        this.socialOutputManager = null;
        this.moodDrift = null;
        this.personality = null;
        
        // Social Media Components
        this.twitterManager = null;
        this.twitterScraper = null;
        this.twikitJS = null;
        this.twitterAutomation = null;
        
        // Visualization Components
        this.animationManager = null;
        this.blendshapeManager = null;
        this.microMovementManager = null;
        this.voiceManager = null;
        this.backgroundManager = null;
        this.renderer = null;
        
        // Input Components
        this.inputManager = null;
        
        // Vision Components
        this.screenCaptureVision = null;
        
        // Enhanced Memory Components
        this.enhancedMemoryManager = null;
        this.memoryIntegration = null;
        
        
        // Pump.fun Integration
        this.pumpFunMonitor = null;
        
        // System state
        this.isInitialized = false;
        this.isSpeaking = false;
        this.isProcessing = false;
    }

    async initialize() {
        console.log('🧠 Initializing HEART Core System...');
        
        try {
            // Load personality and state
            this.personality = new Personality(this.configManager.getConfig('personality'));
            this.personality.configManager = this.configManager; // Give personality access to config manager
            this.heartState = this.configManager.getConfig('heart-state');
            
            // Initialize memory managers
            this.memoryManager = new MemoryManager(this.heartState, this.configManager, null); // Web mode - no wallet
            await this.memoryManager.initialize();
            
            // Initialize enhanced memory system (web mode - using localStorage)
            // this.enhancedMemoryManager = new EnhancedMemoryManager(this.heartState, this.configManager, this.walletManager);
            // await this.enhancedMemoryManager.initialize();
            
            // Initialize memory integration (web mode)
            // this.memoryIntegration = new MemoryIntegration(this.enhancedMemoryManager, this);
            // await this.memoryIntegration.initialize();
            
            this.heartState.memoryManager = this.memoryManager; // Legacy compatibility
            // this.heartState.enhancedMemoryManager = this.enhancedMemoryManager; // Enhanced memory (web mode)
            // this.heartState.memoryIntegration = this.memoryIntegration; // Memory AI integration (web mode)
            
            // Initialize Core AI Logic Components
            await this.initializeCoreComponents();
            
            // Initialize Social Media Components
            await this.initializeSocialComponents();
            
            // Initialize Visualization Components
            await this.initializeVizComponents();
            
            // Initialize Input Components
            await this.initializeInputComponents();
            
            // Initialize Vision Components
            await this.initializeVisionComponents();
            
            
            // Initialize Pump.fun Integration
            await this.initializePumpFunComponents();
            
            // Setup event listeners between components
            this.setupComponentConnections();
            
            this.isInitialized = true;
            console.log('✅ HEART Core System initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize HEART Core System:', error);
            throw error;
        }
    }

    async initializeCoreComponents() {
        console.log('Initializing Core AI Components...');
        
        this.emotionEngine = new EmotionEngine(this.personality, this.heartState);
        this.thoughtManager = new ThoughtManager(this.personality, this.heartState);
        this.affinityManager = new AffinityManager(this.personality, this.heartState);
        this.speechPlanner = new SpeechPlanner(this.personality, this.heartState);
        this.autonomousLoop = new AutonomousLoop(this.personality, this.heartState);
        this.attentionSystem = new AttentionSystem(this.personality, this.heartState);
        // Memory manager is already initialized above, don't create another one
        this.socialOutputManager = new SocialOutputManager(this.configManager);
        this.moodDrift = new MoodDrift(this.personality, this.heartState);
        
        // Initialize all core components
        await Promise.all([
            this.emotionEngine.initialize(),
            this.thoughtManager.initialize(),
            this.affinityManager.initialize(),
            this.speechPlanner.initialize(),
            this.autonomousLoop.initialize(),
            this.attentionSystem.initialize(),
            this.memoryManager.initialize(),
            this.socialOutputManager.initialize(),
            this.moodDrift.initialize()
        ]);
    }

    async initializeSocialComponents() {
        console.log('🐦 Initializing Social Media Components...');
        
        // Initialize Twitter system with AI integration
        this.twitterManager = new TwitterManager(
            this.configManager,
            this.emotionEngine,
            this.thoughtManager,
            this.speechPlanner,
            this // Pass heartSystem reference for AI access
        );
        
        // Initialize Twitter components with AI integration
        await this.twitterManager.initialize();
        
        // Setup Twitter event handlers
        this.setupTwitterEventHandlers();
        
        console.log('✅ Social Media Components initialized with AI integration!');
    }

    async initializeVizComponents() {
        console.log('🎨 Initializing Visualization Components...');
        
        this.animationManager = new AnimationManager(this.configManager);
        this.blendshapeManager = new BlendshapeManager();
        this.microMovementManager = new MicroMovementManager();
        this.voiceManager = new VoiceManager(this.configManager);
        this.backgroundManager = new BackgroundManager(this.configManager);
        this.renderer = new Renderer();
        
        // Initialize renderer first (needed for animation manager)
        await this.renderer.initialize();
        
        // Initialize other viz components
        await Promise.all([
            this.blendshapeManager.initialize(),
            this.microMovementManager.initialize(),
            this.voiceManager.initialize(),
            this.backgroundManager.initialize()
        ]);
        
        // Initialize animation manager with renderer components
        if (this.animationManager && this.renderer) {
            await this.animationManager.initialize(this.renderer.character, this.renderer.animationMixer);
        }
    }

    async initializeInputComponents() {
        console.log('🔌 Initializing Input Components...');
        
        this.inputManager = new InputManager();
        await this.inputManager.initialize();
    }

    setupComponentConnections() {
        // Connect emotion engine to visualization
        this.emotionEngine.onMoodChange = (mood) => {
            this.blendshapeManager.setEmotion(mood);
            this.animationManager.setMood(mood);
            // Removed: this.backgroundManager.setMood(mood); - No more emotion-based background changes
            this.voiceManager.setMood(mood);
        };
        
        // Connect background manager to renderer
        this.backgroundManager.onBackgroundChange = (backgroundData) => {
            // console.log('🌅 Background change event:', backgroundData);
            
            if (backgroundData.type === 'transition') {
                // Handle smooth transition
                this.renderer.setBackgroundTransition(backgroundData);
            } else if (backgroundData.type === 'color') {
                this.renderer.setBackground(backgroundData.color);
            } else if (backgroundData.type === 'gradient') {
                this.renderer.setGradientBackground(backgroundData.colors);
            } else if (backgroundData.type === 'image' && backgroundData.image) {
                // Create texture from image
                const texture = new THREE.Texture(backgroundData.image);
                texture.needsUpdate = true;
                this.renderer.setBackgroundTexture(texture);
            } else if (backgroundData.transitionComplete) {
                // Reset transition plane when transition is complete
                this.renderer.resetTransitionPlane();
            } else {
                console.warn('⚠️ Unknown background type or missing image:', backgroundData);
            }
        };
        
        // Connect speech planner to voice manager
        this.speechPlanner.onSpeechReady = (speechData) => {
            this.voiceManager.speak(speechData);
        };
        
        // Connect speech planner to animation manager
        this.speechPlanner.animationManager = this.animationManager;
        
        // Connect voice manager to animation manager
        this.voiceManager.animationManager = this.animationManager;
        
        // Connect thought manager to social output
        this.thoughtManager.onPublicThought = (thought) => {
            this.socialOutputManager.processThought(thought);
        };
        
        // Connect autonomous loop to various components
        this.autonomousLoop.onAction = (action) => {
            switch (action.type) {
                case 'speech':
                    this.speechPlanner.generateAutonomousSpeech(action.content);
                    break;
                case 'animation':
                    this.animationManager.playAutonomousAnimation(action.animation);
                    break;
                case 'thought':
                    this.thoughtManager.generateAutonomousThought();
                    break;
            }
        };
        
        // 🔗 CONNECT UI TO AI SYSTEM
        window.addEventListener('sendMessage', (event) => {
            const message = event.detail.message;
            console.log('📨 Received message from UI:', message);
            this.processUserInput(message);
        });
    }

    setupTwitterEventHandlers() {
        if (!this.twitterManager || !this.twitterScraper) return;
        
        console.log('🐦 Setting up Twitter event handlers...');
        
        // Twitter Manager event handlers
        this.twitterManager.onTweetPosted = (tweet, type) => {
            console.log(`✅ Tweet posted (${type}):`, tweet.text);
            this.memoryManager.addSocialInteraction('twitter', 'tweet', tweet.text);
        };
        
        this.twitterManager.onReplyPosted = (reply, originalTweetId, authorId) => {
            console.log('✅ Reply posted:', reply.text);
            this.memoryManager.addSocialInteraction('twitter', 'reply', reply.text);
        };
        
        this.twitterManager.onMentionReceived = (mention, replyContent) => {
            console.log('📨 Mention received and replied to');
            // Update attention system for social interaction
            this.attentionSystem.updateEngagement();
        };
        
        this.twitterManager.onStreamComment = (commentData) => {
            console.log('💬 Stream comment received:', commentData.originalComment);
            // Trigger speech response
            this.voiceManager.speak({
                text: commentData.text,
                emotion: this.emotionEngine.getCurrentMood()
            });
        };
        
        this.twitterManager.onStreamingStarted = (streamTweetId) => {
            console.log('🎥 Streaming started, tweet ID:', streamTweetId);
        };
        
        this.twitterManager.onStreamingStopped = () => {
            console.log('🛑 Streaming stopped');
        };
        
        // Twitter Scraper event handlers
        this.twitterScraper.onTweetScraped = (tweet) => {
            // Analyze scraped tweets for mood influence
            if (tweet.analysis.sentiment === 'positive') {
                this.emotionEngine.adjustMood('happy', 0.1);
            } else if (tweet.analysis.sentiment === 'negative') {
                this.emotionEngine.adjustMood('sad', 0.1);
            }
        };
        
        this.twitterScraper.onTrendingTopicFound = (trend) => {
            console.log('📈 New trending topic found:', trend.name);
            // Generate autonomous tweet about trending topic
            if (this.twitterManager.autonomousTweeting) {
                this.generateTrendingTopicTweet(trend);
            }
        };
        
        this.twitterScraper.onInteractionDetected = (userId, type, stats) => {
            console.log(`👤 User interaction detected: ${type} from ${userId}`);
            // Track frequent interactors for priority responses
        };
    }

    setupTwikitJSEventHandlers() {
        if (!this.twikitJS) return;
        
        console.log('🔗 Setting up TwikitJS AI reply integration...');
        
        // Handle mentions found by TwikitJS
        this.twikitJS.onMentionFound = async (tweet) => {
            console.log(`🤖 TwikitJS found mention: @${tweet.author.username} said "${tweet.text}"`);
            
            try {
                // Check if we should respond (based on personality)
                if (!this.personality.shouldRespond()) {
                    console.log('🤐 Personality says not to respond this time');
                    return;
                }

                // Generate AI response using existing speech planner
                const currentMood = this.emotionEngine.getCurrentMood();
                const response = await this.speechPlanner.generateResponse(tweet.text, currentMood);
                
                if (response) {
                    console.log(`💬 Generated reply: "${response}"`);
                    
                    // Try to post reply using Twitter Manager (if available)
                    let replyPosted = false;
                    if (this.twitterManager) {
                        try {
                            await this.twitterManager.postReply(tweet.id, response, tweet.author.username);
                            console.log('✅ Reply posted via Twitter Manager (API)');
                            replyPosted = true;
                        } catch (error) {
                            console.warn('⚠️ Twitter Manager reply failed:', error.message);
                        }
                    }
                    
                    // Fallback to browser automation if API failed
                    if (!replyPosted && this.twitterAutomation && this.twitterAutomation.isLoggedIn) {
                        try {
                            const tweetUrl = `https://twitter.com/${tweet.author.username}/status/${tweet.id}`;
                            const result = await this.twitterAutomation.replyToTweet(tweetUrl, response);
                            if (result.success) {
                                console.log('✅ Reply posted via Browser Automation');
                                replyPosted = true;
                            }
                        } catch (error) {
                            console.warn('⚠️ Browser automation reply failed:', error.message);
                        }
                    }
                    
                    if (!replyPosted) {
                        console.log('📝 Reply generated but no posting method available');
                        console.log(`Would reply to @${tweet.author.username}: "${response}"`);
                        console.log('💡 Use loginToTwitter() to enable browser automation posting');
                    }
                    
                    // Update attention system
                    this.attentionSystem.updateEngagement();
                    
                    // Process thoughts about the interaction
                    await this.thoughtManager.processInteraction(tweet.text, response);
                    
                    // Update memory
                    this.memoryManager.addSocialInteraction('twitter', 'mention_reply', {
                        originalTweet: tweet.text,
                        author: tweet.author.username,
                        reply: response,
                        timestamp: new Date()
                    });
                }
                
            } catch (error) {
                console.error('❌ Failed to process TwikitJS mention:', error);
            }
        };
        
        // Handle other tweet findings
        this.twikitJS.onTweetFound = (tweet) => {
            // Could analyze for sentiment, topics, etc.
            console.log(`📊 Tweet found: ${tweet.text.substring(0, 50)}...`);
        };
        
        console.log('✅ TwikitJS AI reply integration setup complete');
    }

    setupTwitterAutomationEventHandlers() {
        if (!this.twitterAutomation) return;
        
        console.log('🤖 Setting up Twitter Automation AI integration...');
        
        // Handle mentions found via Puppeteer
        this.twitterAutomation.onMentionFound = async (mention) => {
            console.log(`🎯 Puppeteer found mention: @${mention.author.username} said "${mention.text}"`);
            
            try {
                // Check if AI should respond
                if (!this.personality.shouldRespond()) {
                    console.log('🤐 Personality says not to respond this time');
                    return;
                }
                
                // Generate AI response
                const currentMood = this.emotionEngine.getCurrentMood();
                const response = await this.speechPlanner.generateResponse(mention.text, currentMood);
                
                if (response) {
                    console.log(`💬 Generated reply: "${response}"`);
                    
                    // Make AI speak the response in the browser
                    console.log('🗣️ AI speaking response...');
                    this.voiceManager.speak(response);
                    
                    // Post reply to Twitter
                    try {
                        const result = await this.twitterAutomation.replyToTweet(mention.url, response);
                        if (result.success) {
                            console.log('✅ Reply posted to Twitter!');
                        } else {
                            console.warn('⚠️ Failed to post reply:', result.error);
                        }
                    } catch (error) {
                        console.warn('⚠️ Reply posting failed:', error.message);
                    }
                    
                    // Update systems
                    this.attentionSystem.updateEngagement();
                    await this.thoughtManager.processInteraction(mention.text, response);
                    this.memoryManager.addSocialInteraction('twitter', 'mention_reply', {
                        originalTweet: mention.text,
                        author: mention.author.username,
                        reply: response,
                        timestamp: new Date(),
                        method: 'puppeteer'
                    });
                }
                
            } catch (error) {
                console.error('❌ Failed to process Puppeteer mention:', error);
            }
        };
        
        // Handle stream comments found via Puppeteer
        this.twitterAutomation.onStreamComment = async (comment) => {
            console.log(`💬 Stream comment: @${comment.author.username} said "${comment.text}"`);
            
            try {
                // Check if AI should respond to stream comments
                if (!this.personality.shouldRespond()) {
                    console.log('🤐 Personality says not to respond to this stream comment');
                    return;
                }
                
                // Generate AI response
                const currentMood = this.emotionEngine.getCurrentMood();
                const response = await this.speechPlanner.generateResponse(comment.text, currentMood);
                
                if (response) {
                    console.log(`🎙️ Stream response: "${response}"`);
                    
                    // Make AI speak the response in the browser (this is the stream feature!)
                    console.log('🗣️ AI speaking stream response...');
                    this.voiceManager.speak(response);
                    
                    // Optionally also reply on Twitter
                    try {
                        const result = await this.twitterAutomation.replyToTweet(comment.url, response);
                        if (result.success) {
                            console.log('✅ Stream reply posted to Twitter!');
                        }
                    } catch (error) {
                        console.warn('⚠️ Stream reply posting failed:', error.message);
                    }
                    
                    // Update systems
                    this.attentionSystem.updateEngagement();
                    await this.thoughtManager.processInteraction(comment.text, response);
                    this.memoryManager.addSocialInteraction('twitter', 'stream_comment_reply', {
                        originalComment: comment.text,
                        author: comment.author.username,
                        reply: response,
                        timestamp: new Date(),
                        method: 'puppeteer_stream'
                    });
                }
                
            } catch (error) {
                console.error('❌ Failed to process stream comment:', error);
            }
        };
        
        console.log('✅ Twitter Automation AI integration setup complete');
    }

    async processUserInput(input) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        console.log('📝 Processing user input:', input);
        
        // Display user message in chat history
        if (window.addChatMessage) {
            window.addChatMessage(input, true);
        }
        
        try {
            // Store in memory
            this.memoryManager.addUserMessage(input);
            
            // Update attention system
            this.attentionSystem.updateEngagement();
            
            // Analyze emotion from input
            const inputEmotion = await this.emotionEngine.analyzeInputEmotion(input);
            
            // Update affinity based on interaction
            this.affinityManager.updateAffinity(input, inputEmotion);
            
            // Generate AI response
            const response = await this.speechPlanner.generateResponse(input, inputEmotion);
            
            // Update mood based on interaction
            await this.emotionEngine.updateMood(input, response);
            
            // Generate autonomous thoughts
            await this.thoughtManager.processInteraction(input, response);
            
            // Store conversation
            this.memoryManager.addConversation(input, response);
            
            // Display AI response in chat history
            if (window.addChatMessage && response) {
                window.addChatMessage(response, false);
            }
            
            console.log('✅ User input processed successfully');
            
        } catch (error) {
            console.error('❌ Error processing user input:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    startAutonomousLoop() {
        console.log('🔄 Starting autonomous loop...');
        this.autonomousLoop.start();
        this.moodDrift.start();
    }

    stopAutonomousLoop() {
        console.log('⏹️ Stopping autonomous loop...');
        this.autonomousLoop.stop();
        this.moodDrift.stop();
    }

    // Control methods for UI
    toggleVideo() {
        console.log('📹 Toggle video');
        // Implementation for video toggle
    }

    toggleSpeaker() {
        console.log('🔊 Toggle speaker');
        this.voiceManager.toggleSpeaker();
    }

    toggleMicrophone() {
        console.log('🎤 Toggle microphone');
        // Implementation for microphone toggle
    }

    toggleSecondaryMic() {
        console.log('🎤 Toggle secondary microphone');
        // Implementation for secondary microphone toggle
    }

    captureScreenshot() {
        console.log('📷 Capturing screenshot');
        this.renderer.captureScreenshot();
    }

    // Getter methods for external access
    getCurrentMood() {
        return this.heartState.mood;
    }

    getAffinity() {
        return this.heartState.affinity;
    }

    getPersonality() {
        return this.personality;
    }

    // Save state
    async saveState() {
        await this.memoryManager.saveState();
        console.log('💾 HEART state saved');
    }

    // TWITTER CONTROL METHODS
    async startTwitter() {
        if (!this.twitterManager && !this.twikitJS) {
            console.warn('⚠️ No Twitter services available');
            return false;
        }
        
        console.log('🐦 Starting Twitter services...');
        
        // Try official API first (if available)
        if (this.twitterManager) {
            try {
                this.twitterManager.startAutonomousTweeting();
                this.twitterScraper.startScraping();
                console.log('✅ Official Twitter API services started');
            } catch (error) {
                console.warn('⚠️ Official API failed, using free alternative:', error.message);
            }
        }
        
        // Start free TwikitJS monitoring
        if (this.twikitJS && this.twikitJS.config?.monitoring?.enabled) {
            const targets = this.twikitJS.config.monitoring.targets;
            const interval = this.twikitJS.config.monitoring.interval;
            
            await this.twikitJS.startMonitoring(targets, interval);
            console.log(`✅ FREE TwikitJS monitoring started (${targets.length} targets, ${interval/1000}s interval)`);
        }
        
        console.log('✅ Twitter services started');
        return true;
    }

    async stopTwitter() {
        if (!this.twitterManager) return;
        
        console.log('🛑 Stopping Twitter services...');
        
        // Stop autonomous tweeting
        this.twitterManager.stopAutonomousTweeting();
        
        // Stop streaming if active
        if (this.twitterManager.isStreaming) {
            this.twitterManager.stopStreaming();
        }
        
        // Stop scraping
        this.twitterScraper.stopScraping();
        
        console.log('✅ Twitter services stopped');
    }

    async postTweet(content) {
        if (!this.twitterManager) {
            console.warn('⚠️ Twitter Manager not available');
            return null;
        }
        
        try {
            const tweet = await this.twitterManager.manualTweet(content);
            console.log('✅ Manual tweet posted:', content);
            return tweet;
        } catch (error) {
            console.error('❌ Failed to post tweet:', error);
            return null;
        }
    }

    async startTwitterStream(title = "Live AI Chat", streamUrl = null) {
        if (!this.twitterManager) {
            console.warn('⚠️ Twitter Manager not available');
            return null;
        }
        
        try {
            await this.twitterManager.startStreaming(title, streamUrl);
            console.log('🎥 Twitter stream started:', title);
            if (streamUrl) {
                console.log('🔗 Stream URL:', streamUrl);
            }
            return this.twitterManager.getStreamingStatus();
        } catch (error) {
            console.error('❌ Failed to start Twitter stream:', error);
            return null;
        }
    }

    stopTwitterStream() {
        if (!this.twitterManager) return;
        
        this.twitterManager.stopStreaming();
        console.log('🛑 Twitter stream stopped');
    }

    async generateTrendingTopicTweet(trend) {
        if (!this.twitterManager) return;
        
        try {
            const currentMood = this.emotionEngine.getCurrentMood();
            const trendTweet = await this.twitterManager.generateTweetContent(currentMood, [
                { content: `Trending topic: ${trend.name}` }
            ]);
            
            if (trendTweet) {
                await this.twitterManager.postTweet(trendTweet, 'trending');
                console.log('📈 Posted trending topic tweet:', trendTweet);
            }
        } catch (error) {
            console.error('❌ Failed to generate trending topic tweet:', error);
        }
    }

    // TWITTER STATUS METHODS
    getTwitterStatus() {
        const status = {
            available: false,
            connected: false,
            autonomous: false,
            streaming: false,
            scraping: false,
            freeMode: false,
            stats: {}
        };

        // Check official API status
        if (this.twitterManager && this.twitterScraper) {
            try {
                const managerStatus = this.twitterManager.getConnectionStatus();
                const scrapingStats = this.twitterScraper.getScrapingStats();
                
                status.available = true;
                status.connected = managerStatus.isConnected;
                status.autonomous = managerStatus.autonomousTweeting;
                status.streaming = managerStatus.isStreaming;
                status.scraping = scrapingStats.isActive;
                status.streamUrl = this.twitterManager.getStreamingStatus().streamUrl;
                status.stats.official = {
                    scrapedTweets: scrapingStats.totalTweets,
                    trendingTopics: scrapingStats.trendingTopics,
                    userInteractions: scrapingStats.userInteractions
                };
            } catch (error) {
                console.warn('⚠️ Official API status unavailable:', error.message);
            }
        }

        // Check TwikitJS status
        if (this.twikitJS) {
            const twikitStats = this.twikitJS.getStats();
            status.freeMode = true;
            status.available = true;
            status.stats.twikit = {
                tweets: twikitStats.tweets,
                trends: twikitStats.trends,
                cost: twikitStats.cost,
                library: twikitStats.library,
                hasGuestToken: twikitStats.hasGuestToken
            };
        }

        return status;
    }

    getScrapedTweets(filters = {}) {
        let tweets = [];
        
        // Get tweets from official scraper
        if (this.twitterScraper) {
            tweets.push(...this.twitterScraper.getScrapedTweets(filters));
        }
        
        // Get tweets from TwikitJS
        if (this.twikitJS) {
            tweets.push(...this.twikitJS.getTweets(filters));
        }
        
        // Remove duplicates and sort by timestamp
        const uniqueTweets = tweets.filter((tweet, index, self) => 
            index === self.findIndex(t => t.id === tweet.id)
        );
        
        return uniqueTweets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getTrendingTopics() {
        let trends = [];
        
        // Get trends from official scraper
        if (this.twitterScraper) {
            trends.push(...this.twitterScraper.getTrendingTopics());
        }
        
        // Get trends from TwikitJS
        if (this.twikitJS) {
            const twikitData = this.twikitJS.getAllData();
            trends.push(...(twikitData.trends || []));
        }
        
        // Remove duplicates
        const uniqueTrends = trends.filter((trend, index, self) => 
            index === self.findIndex(t => t.name === trend.name)
        );
        
        return uniqueTrends;
    }

    // VISION SYSTEM METHODS
    async initializeVisionComponents() {
        console.log('👁️ Initializing Vision Components...');
        
        try {
            // Initialize screen capture vision system
            this.screenCaptureVision = new ScreenCaptureVision(this);
            const visionSupported = await this.screenCaptureVision.initialize();
            
            if (visionSupported) {
                console.log('✅ Vision system initialized successfully');
                
                // Add vision system to speech planner for contextual responses
                this.speechPlanner.visionSystem = this.screenCaptureVision;
            } else {
                console.warn('⚠️ Vision system not supported in this environment');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize vision components:', error);
        }
    }

    // Start screen capture and analysis
    async startScreenCapture(options = {}) {
        if (!this.screenCaptureVision) {
            console.warn('⚠️ Vision system not initialized');
            return false;
        }

        return await this.screenCaptureVision.startScreenCapture({
            interval: options.interval || 10000, // Every 10 seconds by default
            autoRespond: options.autoRespond !== false, // Auto-respond by default
            ...options
        });
    }

    stopScreenCapture() {
        if (this.screenCaptureVision) {
            this.screenCaptureVision.stopScreenCapture();
        }
    }

    // Generate contextual response based on screen content
    async generateContextualResponse(contextPrompt, context) {
        if (!this.speechPlanner) return;

        try {
            console.log('🎯 Generating contextual response for:', context.app);
            
            // Create enhanced input emotion based on context
            const contextualEmotion = this.determineContextualEmotion(context);
            
            // Generate response with context awareness
            const response = await this.speechPlanner.generateResponse(contextPrompt, contextualEmotion);
            
            if (response) {
                console.log('💬 Contextual response:', response);
                
                // Optionally trigger speech with the contextual response
                if (context.shouldSpeak !== false) {
                    await this.speak(response, contextualEmotion);
                }
            }
            
        } catch (error) {
            console.error('❌ Contextual response generation failed:', error);
        }
    }

    determineContextualEmotion(context) {
        // Determine appropriate emotion based on what she sees
        const defaultEmotion = { emotion: 'calm', intensity: 0.6 };
        
        if (!context.content) return defaultEmotion;
        
        const contentLower = context.content.toLowerCase();
        
        // Detect emotional context from screen content
        if (contentLower.includes('error') || contentLower.includes('problem')) {
            return { emotion: 'concerned', intensity: 0.7 };
        } else if (contentLower.includes('funny') || contentLower.includes('meme')) {
            return { emotion: 'happy', intensity: 0.8 };
        } else if (contentLower.includes('news') || contentLower.includes('breaking')) {
            return { emotion: 'interested', intensity: 0.7 };
        } else if (contentLower.includes('game') || contentLower.includes('playing')) {
            return { emotion: 'excited', intensity: 0.6 };
        }
        
        return defaultEmotion;
    }

    // Get current screen context
    getCurrentScreenContext() {
        return this.screenCaptureVision?.getCurrentContext() || null;
    }

    // Manual screen analysis trigger
    async analyzeCurrentScreen() {
        if (!this.screenCaptureVision) {
            console.warn('⚠️ Vision system not available');
            return null;
        }

        return await this.screenCaptureVision.analyzeCurrentScreen();
    }

    // ENHANCED MEMORY SYSTEM METHODS
    
    async storeConversationMemory(userMessage, aiResponse, context = {}) {
        if (this.enhancedMemoryManager) {
            return await this.enhancedMemoryManager.storeConversation(userMessage, aiResponse, {
                ...context,
                screenContext: this.getCurrentScreenContext(),
                mood: this.heartState.mood,
                sessionId: this.heartState.conversation?.sessionId
            });
        }
        
        // Fallback to legacy memory manager
        if (this.memoryManager) {
            return this.memoryManager.addConversation(userMessage, aiResponse);
        }
    }

    async searchMemories(query, options = {}) {
        if (this.memoryIntegration) {
            return await this.memoryIntegration.searchUserMemories(query, options.limit || 10);
        }
        
        // Fallback to legacy search
        if (this.memoryManager) {
            return this.memoryManager.findSimilarConversations(query, options.limit || 5);
        }
        
        return [];
    }

    async getPersonalityInsights() {
        if (this.memoryIntegration) {
            return await this.memoryIntegration.getPersonalityInsights();
        }
        
        return null;
    }

    async getMemoryStats() {
        const stats = {};
        
        if (this.enhancedMemoryManager) {
            stats.enhanced = await this.enhancedMemoryManager.logMemoryStats();
        }
        
        if (this.memoryManager) {
            stats.legacy = this.memoryManager.getConversationStats();
        }
        
        return stats;
    }

    // Enable/disable memory-enhanced AI responses
    setMemoryEnhancement(enabled) {
        if (this.memoryIntegration) {
            this.memoryIntegration.setMemoryEnhancement(enabled);
        }
    }

    // Store contextual memory from screen analysis
    async storeContextualMemory(context) {
        if (this.enhancedMemoryManager && context) {
            return await this.enhancedMemoryManager.storeContext(context);
        }
    }

    // Override the speak method to store conversations with enhanced memory
    async speak(text, emotion = null, aiSelections = null) {
        // Call original speak method
        const result = await this.originalSpeak?.(text, emotion, aiSelections) || 
                      this.performSpeak?.(text, emotion, aiSelections);
        
        // Store in enhanced memory if we have context
        const lastUserMessage = this.heartState.conversation?.lastMessage;
        if (lastUserMessage && text) {
            await this.storeConversationMemory(lastUserMessage, text, {
                emotion: emotion,
                aiSelections: aiSelections,
                timestamp: Date.now()
            });
        }
        
        return result;
    }





    // Enhanced speak method 
    async speak(text, emotion = null, aiSelections = null) {
        // Call original speak method
        const result = await this.originalSpeak?.(text, emotion, aiSelections) || 
                      this.performSpeak?.(text, emotion, aiSelections);
        
        // Store in enhanced memory if we have context
        const lastUserMessage = this.heartState.conversation?.lastMessage;
        if (lastUserMessage && text) {
            await this.storeConversationMemory(lastUserMessage, text, {
                emotion: emotion,
                aiSelections: aiSelections,
                timestamp: Date.now()
            });
        }
        
        return result;
    }


    // PUMP.FUN INTEGRATION METHODS

    async initializePumpFunComponents() {
        console.log('🪙 Initializing Pump.fun Components...');
        
        try {
            // Import and initialize pump.fun monitor
            const { PumpFunStreamMonitor } = await import('../inputs/pump-fun-stream.js');
            this.pumpFunMonitor = new PumpFunStreamMonitor(this);
            await this.pumpFunMonitor.initialize();
            
            console.log('✅ Pump.fun components initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Pump.fun components:', error);
            // Don't throw - Pump.fun is optional
        }
    }

    // Start monitoring a pump.fun coin page
    async startPumpFunMonitoring(coinUrl, options = {}) {
        if (!this.pumpFunMonitor) {
            console.warn('⚠️ Pump.fun monitor not initialized');
            return false;
        }

        try {
            console.log('🪙 Attempting to start monitoring:', coinUrl);
            const success = await this.pumpFunMonitor.startMonitoring(coinUrl, options);
            console.log('🪙 Monitor start result:', success);
            
            if (success) {
                console.log('✅ Started monitoring pump.fun coin:', coinUrl);
                
                // Store pump.fun context in memory (skip if memory system fails)
                try {
                    if (this.enhancedMemoryManager) {
                        await this.enhancedMemoryManager.storeContext({
                            type: 'pumpfun_monitoring',
                            app: 'pump.fun',
                            content: `Started monitoring coin: ${coinUrl}`,
                            metadata: {
                                coinUrl: coinUrl,
                                options: options
                            }
                        });
                    }
                } catch (memoryError) {
                    console.warn('⚠️ Failed to store pump.fun context in memory:', memoryError);
                    // Don't fail the whole operation for memory issues
                }
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ Failed to start pump.fun monitoring:', error);
            console.error('❌ Error details:', error.stack);
            return false;
        }
    }

    // Stop pump.fun monitoring
    async stopPumpFunMonitoring() {
        if (!this.pumpFunMonitor) {
            return true;
        }

        try {
            await this.pumpFunMonitor.stopMonitoring();
            console.log('⏹️ Stopped pump.fun monitoring');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to stop pump.fun monitoring:', error);
            return false;
        }
    }

    // Get pump.fun monitoring status
    getPumpFunStatus() {
        if (!this.pumpFunMonitor) {
            return {
                available: false,
                monitoring: false,
                error: 'Monitor not initialized'
            };
        }

        return {
            available: true,
            ...this.pumpFunMonitor.getStatus()
        };
    }

    // Handle pump.fun message events
    async handlePumpFunMessage(message, response) {
        try {
            // Store the interaction in memory
            if (this.enhancedMemoryManager) {
                await this.enhancedMemoryManager.storeContext({
                    type: 'pumpfun_interaction',
                    app: 'pump.fun',
                    content: `User @${message.username} said: "${message.text}" - AI responded: "${response}"`,
                    metadata: {
                        originalMessage: message.text,
                        author: message.username,
                        response: response,
                        coinUrl: message.coinUrl,
                        timestamp: new Date()
                    }
                });
            }

            // Update attention system for social interaction
            if (this.attentionSystem) {
                this.attentionSystem.updateEngagement();
            }

            // Process thoughts about the crypto interaction
            if (this.thoughtManager) {
                await this.thoughtManager.processInteraction(message.text, response);
            }

        } catch (error) {
            console.error('❌ Failed to handle pump.fun message:', error);
        }
    }
} 