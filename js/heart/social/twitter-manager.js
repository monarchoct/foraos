import { TwitterApiClient } from './twitter-api-client.js';

export class TwitterManager {
    constructor(configManager, emotionEngine, thoughtManager, speechPlanner, heartSystem = null) {
        this.configManager = configManager;
        this.emotionEngine = emotionEngine;
        this.thoughtManager = thoughtManager;
        this.speechPlanner = speechPlanner;
        this.heartSystem = heartSystem;
        
        // Initialize Twitter API client
        this.twitterClient = new TwitterApiClient(configManager, heartSystem);
        
        // Twitter API configuration
        this.apiKeys = null;
        this.isConnected = false;
        this.rateLimitInfo = {
            tweets: { remaining: 300, resetTime: null },
            mentions: { remaining: 75, resetTime: null },
            timeline: { remaining: 300, resetTime: null }
        };
        
        // Tweet monitoring
        this.mentionStream = null;
        this.lastMentionId = null;
        this.lastTweetId = null;
        this.isMonitoring = false;
        
        // Autonomous tweeting
        this.autonomousTweeting = false;
        this.tweetInterval = null;
        this.minTweetInterval = 30 * 60 * 1000; // 30 minutes
        this.maxTweetInterval = 2 * 60 * 60 * 1000; // 2 hours
        
        // Streaming features
        this.isStreaming = false;
        this.streamTweetId = null;
        this.streamCommentMonitor = null;
        this.onStreamComment = null; // Callback for speech responses
        
        // Reply tracking
        this.recentReplies = new Set();
        this.replyTimeouts = new Map();
        
        // Event callbacks
        this.onTweetPosted = null;
        this.onReplyPosted = null;
        this.onMentionReceived = null;
        this.onStreamingStarted = null;
        this.onStreamingStopped = null;
    }

    async initialize() {
        console.log('🐦 Initializing Twitter Manager...');
        
        try {
            // Initialize Twitter API client
            const success = await this.twitterClient.initialize();
            if (!success) {
                console.warn('⚠️ Twitter API client failed to initialize');
                return false;
            }
            
            this.isConnected = true;
            
            // Start monitoring mentions with AI responses
            this.startMentionMonitoring();
            
            console.log('✅ Twitter Manager initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Twitter Manager:', error);
            return false;
        }
    }

    async testConnection() {
        console.log('🔗 Testing Twitter API connection...');
        
        try {
            const response = await this.makeTwitterRequest('GET', 'users/me', {
                'user.fields': 'id,name,username,public_metrics'
            });
            
            if (response.data) {
                console.log('✅ Connected to Twitter as:', response.data.username);
                console.log('📊 Followers:', response.data.public_metrics?.followers_count || 0);
                return true;
            }
            
        } catch (error) {
            console.error('❌ Twitter connection test failed:', error);
            throw error;
        }
    }

    // AUTONOMOUS TWEETING
    startAutonomousTweeting() {
        if (this.autonomousTweeting) return;
        
        console.log('🤖 Starting autonomous tweeting...');
        this.autonomousTweeting = true;
        this.scheduleNextTweet();
    }

    stopAutonomousTweeting() {
        console.log('🛑 Stopping autonomous tweeting...');
        this.autonomousTweeting = false;
        if (this.tweetInterval) {
            clearTimeout(this.tweetInterval);
            this.tweetInterval = null;
        }
    }

    scheduleNextTweet() {
        if (!this.autonomousTweeting) return;
        
        // Random interval between min and max
        const interval = Math.random() * (this.maxTweetInterval - this.minTweetInterval) + this.minTweetInterval;
        
        this.tweetInterval = setTimeout(async () => {
            try {
                await this.generateAndPostAutonomousTweet();
                this.scheduleNextTweet(); // Schedule next tweet
            } catch (error) {
                console.error('❌ Failed to post autonomous tweet:', error);
                // Try again in 10 minutes
                setTimeout(() => this.scheduleNextTweet(), 10 * 60 * 1000);
            }
        }, interval);
        
        console.log(`⏰ Next autonomous tweet scheduled in ${Math.round(interval / 60000)} minutes`);
    }

    async generateAndPostAutonomousTweet() {
        console.log('🤖 Generating autonomous tweet...');
        
        try {
            // Use the Twitter API client's AI tweet generation
            const result = await this.twitterClient.generateAndPostTweet();
            
            if (result.success) {
                console.log('✅ Posted autonomous tweet:', result.text);
                
                if (this.onTweetPosted) {
                    this.onTweetPosted(result, 'autonomous');
                }
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ Failed to generate autonomous tweet:', error);
            throw error;
        }
    }

    async generateTweetContent(mood, thoughts) {
        const prompt = `Generate a tweet based on the current mood and thoughts.

Current mood: ${mood.primary} (${Math.round(mood.intensity * 100)}% intensity)
Recent thoughts: ${thoughts.map(t => t.content).join(', ')}

Guidelines:
- Keep it under 280 characters
- Match the current mood and personality
- Be authentic and engaging
- Don't mention being an AI
- Use natural language
- Can include emojis if appropriate
- Can be about daily observations, feelings, or random thoughts

Generate a single tweet:`;

        try {
            const response = await this.speechPlanner.generateResponse(prompt, mood);
            return response.length <= 280 ? response : response.substring(0, 277) + '...';
        } catch (error) {
            console.error('❌ Failed to generate tweet content:', error);
            return null;
        }
    }

    // MENTION MONITORING & REPLIES
    startMentionMonitoring() {
        if (this.isMonitoring) return;
        
        console.log('👀 Starting mention monitoring with AI responses...');
        this.isMonitoring = true;
        
        // Use the Twitter API client's built-in monitoring with AI
        this.twitterClient.startMentionMonitoring(60000); // Check every minute
        
        // Set up callbacks
        this.twitterClient.onMentionFound = (mention) => {
            if (this.onMentionReceived) {
                this.onMentionReceived(mention);
            }
        };
    }

    stopMentionMonitoring() {
        console.log('🛑 Stopping mention monitoring...');
        this.isMonitoring = false;
        this.twitterClient.stopMentionMonitoring();
    }

    async checkMentions() {
        if (!this.isConnected) return;
        
        try {
            const mentions = await this.getMentions();
            
            for (const mention of mentions) {
                if (!this.recentReplies.has(mention.id)) {
                    await this.handleMention(mention);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to check mentions:', error);
        }
    }

    async getMentions() {
        const params = {
            'tweet.fields': 'created_at,author_id,context_annotations,public_metrics',
            'user.fields': 'username,name,public_metrics',
            'expansions': 'author_id',
            'max_results': 10
        };
        
        if (this.lastMentionId) {
            params.since_id = this.lastMentionId;
        }
        
        const response = await this.makeTwitterRequest('GET', 'users/me/mentions', params);
        
        if (response.data && response.data.length > 0) {
            this.lastMentionId = response.data[0].id;
            return response.data;
        }
        
        return [];
    }

    async handleMention(mention) {
        console.log('📨 Handling mention from:', mention.author_id);
        
        try {
            // Generate reply based on mention content and current mood
            const currentMood = this.emotionEngine.getCurrentMood();
            const replyContent = await this.generateReply(mention.text, currentMood);
            
            if (replyContent) {
                await this.postReply(mention.id, replyContent, mention.author_id);
                
                // Track reply to avoid duplicates
                this.recentReplies.add(mention.id);
                setTimeout(() => {
                    this.recentReplies.delete(mention.id);
                }, 24 * 60 * 60 * 1000); // Remove after 24 hours
                
                // Trigger callback
                if (this.onMentionReceived) {
                    this.onMentionReceived(mention, replyContent);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to handle mention:', error);
        }
    }

    async generateReply(mentionText, mood) {
        const prompt = `Generate a reply to this tweet mention:
"${mentionText}"

Current mood: ${mood.primary} (${Math.round(mood.intensity * 100)}% intensity)

Guidelines:
- Keep it under 280 characters
- Be friendly and engaging
- Match the current mood
- Respond naturally to the content
- Don't mention being an AI
- Can ask questions or continue conversation

Generate a reply:`;

        try {
            const response = await this.speechPlanner.generateResponse(prompt, mood);
            return response.length <= 280 ? response : response.substring(0, 277) + '...';
        } catch (error) {
            console.error('❌ Failed to generate reply:', error);
            return null;
        }
    }

    // STREAMING FEATURES
    async startStreaming(streamTitle = "Live Chat Stream", streamUrl = null) {
        if (this.isStreaming) {
            console.warn('⚠️ Already streaming');
            return;
        }
        
        console.log('🎥 Starting streaming mode...');
        
        try {
            // Post stream announcement tweet
            let streamTweet = `🔴 LIVE NOW: ${streamTitle}\n\nCome chat with me! I'll respond to your comments live with voice! 💬🎤`;
            
            if (streamUrl) {
                streamTweet += `\n\n🎥 Watch: ${streamUrl}`;
            }
            
            streamTweet += `\n\n#LiveStream #AI #Chat`;
            
            const response = await this.twitterClient.postTweet(streamTweet);
            if (response.success) {
                this.streamTweetId = response.tweetId;
                this.streamUrl = streamUrl;
                this.isStreaming = true;
                
                // Start monitoring replies to stream tweet with AI
                this.startStreamCommentMonitoring();
                
                if (this.onStreamingStarted) {
                    this.onStreamingStarted(this.streamTweetId);
                }
                
                console.log('✅ Streaming started, tweet ID:', this.streamTweetId);
            } else {
                throw new Error(response.error);
            }
            
        } catch (error) {
            console.error('❌ Failed to start streaming:', error);
            throw error;
        }
    }

    stopStreaming() {
        if (!this.isStreaming) return;
        
        console.log('🛑 Stopping streaming mode...');
        
        this.isStreaming = false;
        this.streamTweetId = null;
        this.streamUrl = null;
        
        if (this.streamCommentMonitor) {
            clearInterval(this.streamCommentMonitor);
            this.streamCommentMonitor = null;
        }
        
        if (this.onStreamingStopped) {
            this.onStreamingStopped();
        }
        
        console.log('✅ Streaming stopped');
    }

    startStreamCommentMonitoring() {
        if (!this.streamTweetId) return;
        
        console.log('👀 Monitoring stream comments with AI...');
        
        // Use Twitter API client's stream monitoring with AI responses
        this.twitterClient.monitorTweetStream(this.streamTweetId, 15000); // Check every 15 seconds
        
        // Set up callback for stream replies
        this.twitterClient.onStreamReply = async (reply) => {
            // Generate speech response for the browser
            if (this.onStreamComment) {
                const currentMood = this.emotionEngine.getCurrentMood();
                const speechResponse = await this.generateStreamResponse(reply.text, currentMood);
                
                if (speechResponse) {
                    this.onStreamComment({
                        text: speechResponse,
                        author: reply.author.username,
                        originalComment: reply.text
                    });
                }
            }
        };
    }

    async getStreamReplies() {
        if (!this.streamTweetId) return [];
        
        const params = {
            'tweet.fields': 'created_at,author_id,in_reply_to_user_id',
            'user.fields': 'username,name',
            'expansions': 'author_id',
            'max_results': 10
        };
        
        const response = await this.makeTwitterRequest('GET', `tweets/search/recent?query=conversation_id:${this.streamTweetId}`, params);
        
        return response.data || [];
    }

    async handleStreamComment(reply) {
        console.log('💬 Handling stream comment:', reply.text);
        
        try {
            // Generate speech response
            const currentMood = this.emotionEngine.getCurrentMood();
            const speechResponse = await this.generateStreamResponse(reply.text, currentMood);
            
            if (speechResponse && this.onStreamComment) {
                // Trigger speech response in browser
                this.onStreamComment({
                    text: speechResponse,
                    author: reply.author_id,
                    originalComment: reply.text
                });
            }
            
            // Also post a text reply
            const textReply = await this.generateReply(reply.text, currentMood);
            if (textReply) {
                await this.postReply(reply.id, textReply, reply.author_id);
            }
            
            // Track to avoid duplicates
            this.recentReplies.add(reply.id);
            
        } catch (error) {
            console.error('❌ Failed to handle stream comment:', error);
        }
    }

    async generateStreamResponse(commentText, mood) {
        const prompt = `Generate a spoken response to this live stream comment:
"${commentText}"

Current mood: ${mood.primary} (${Math.round(mood.intensity * 100)}% intensity)

Guidelines:
- Keep it conversational and natural for speech
- Be friendly and engaging
- Thank them for watching/commenting
- Respond to their specific comment
- Keep it under 100 words for speech
- Sound natural when spoken aloud

Generate a spoken response:`;

        try {
            const response = await this.speechPlanner.generateResponse(prompt, mood);
            return response;
        } catch (error) {
            console.error('❌ Failed to generate stream response:', error);
            return null;
        }
    }

    // TWITTER API METHODS
    async postTweet(content, type = 'manual') {
        console.log(`📝 Posting ${type} tweet:`, content);
        
        try {
            const response = await this.makeTwitterRequest('POST', 'tweets', {
                text: content
            });
            
            if (response.data) {
                console.log('✅ Tweet posted successfully, ID:', response.data.id);
                
                if (this.onTweetPosted) {
                    this.onTweetPosted(response.data, type);
                }
                
                return response.data;
            }
            
        } catch (error) {
            console.error('❌ Failed to post tweet:', error);
            throw error;
        }
    }

    async postReply(replyToId, content, authorId) {
        console.log(`💬 Posting reply to ${replyToId}:`, content);
        
        try {
            const response = await this.makeTwitterRequest('POST', 'tweets', {
                text: content,
                reply: {
                    in_reply_to_tweet_id: replyToId
                }
            });
            
            if (response.data) {
                console.log('✅ Reply posted successfully, ID:', response.data.id);
                
                if (this.onReplyPosted) {
                    this.onReplyPosted(response.data, replyToId, authorId);
                }
                
                return response.data;
            }
            
        } catch (error) {
            console.error('❌ Failed to post reply:', error);
            throw error;
        }
    }

    async makeTwitterRequest(method, endpoint, data = {}) {
        const baseUrl = 'https://api.twitter.com/2/';
        let url = baseUrl + endpoint;
        
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.apiKeys.bearerToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'GET' && Object.keys(data).length > 0) {
            const params = new URLSearchParams(data);
            url += '?' + params.toString();
        } else if (method === 'POST') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    // PUBLIC METHODS
    async manualTweet(content) {
        const result = await this.twitterClient.postTweet(content);
        if (result.success && this.onTweetPosted) {
            this.onTweetPosted(result, 'manual');
        }
        return result;
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isMonitoring: this.isMonitoring,
            autonomousTweeting: this.autonomousTweeting,
            isStreaming: this.isStreaming,
            rateLimits: this.rateLimitInfo
        };
    }

    getStreamingStatus() {
        return {
            isStreaming: this.isStreaming,
            streamTweetId: this.streamTweetId,
            streamUrl: this.streamUrl,
            tweetUrl: this.streamTweetId ? `https://twitter.com/i/status/${this.streamTweetId}` : null
        };
    }
}
