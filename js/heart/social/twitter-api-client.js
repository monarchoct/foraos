/**
 * Modern Twitter API Client for Browser
 * Handles general tweets, mentions, and stream monitoring
 */

export class TwitterApiClient {
    constructor(configManager, heartSystem = null) {
        this.configManager = configManager;
        this.heartSystem = heartSystem; // Access to speech planner and AI
        this.credentials = null;
        this.isInitialized = false;
        this.monitoringInterval = null;
        this.streamInterval = null;
        this.lastMentionId = null;
        this.lastStreamCheckId = null;
        this.targetStreamTweetId = null;
        
        // Callbacks
        this.onMentionFound = null;
        this.onStreamReply = null;
        this.onError = null;
    }

    async initialize() {
        try {
            console.log('🐦 Initializing Twitter API Client...');
            
            // Load Twitter credentials
            this.credentials = this.configManager.getConfig('api-keys').twitter;
            
            if (!this.credentials || !this.credentials.bearerToken) {
                throw new Error('Twitter API credentials not found');
            }

            // Test the connection by getting user info
            const userInfo = await this.getUserInfo();
            if (userInfo) {
                console.log(`✅ Twitter API connected as: @${userInfo.username}`);
                this.isInitialized = true;
                return true;
            } else {
                throw new Error('Failed to verify Twitter API connection');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Twitter API:', error);
            this.isInitialized = false;
            if (this.onError) this.onError(error);
            return false;
        }
    }

    async makeApiRequest(endpoint, options = {}) {
        // Use local proxy to avoid CORS issues
        const proxyUrl = `http://localhost:3002/api/twitter/${endpoint}`;
        
        try {
            const fetchOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };

            // Handle query parameters for GET requests
            let finalUrl = proxyUrl;
            if (options.params && (options.method || 'GET') === 'GET') {
                const searchParams = new URLSearchParams(options.params);
                finalUrl += '?' + searchParams.toString();
            }

            // Handle body for POST requests
            if (options.body && (options.method === 'POST')) {
                fetchOptions.body = JSON.stringify(options.body);
            }

            const response = await fetch(finalUrl, fetchOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Twitter API Error ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ Twitter API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async getUserInfo() {
        try {
            const response = await this.makeApiRequest('users/me');
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get user info:', error);
            return null;
        }
    }

    async postTweet(text) {
        if (!this.isInitialized) {
            throw new Error('Twitter API not initialized');
        }

        try {
            console.log(`📤 Posting tweet: "${text}"`);
            
            const response = await this.makeApiRequest('tweets', {
                method: 'POST',
                body: { text: text }
            });

            if (response.data) {
                console.log(`✅ Tweet posted successfully! ID: ${response.data.id}`);
                return {
                    success: true,
                    tweetId: response.data.id,
                    text: response.data.text
                };
            } else {
                throw new Error('No data in response');
            }
            
        } catch (error) {
            console.error('❌ Failed to post tweet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async replyToTweet(tweetId, replyText) {
        if (!this.isInitialized) {
            throw new Error('Twitter API not initialized');
        }

        try {
            console.log(`💬 Replying to tweet ${tweetId}: "${replyText}"`);
            
            const response = await this.makeApiRequest('tweets', {
                method: 'POST',
                body: {
                    text: replyText,
                    reply: {
                        in_reply_to_tweet_id: tweetId
                    }
                }
            });

            if (response.data) {
                console.log(`✅ Reply posted successfully! ID: ${response.data.id}`);
                return {
                    success: true,
                    tweetId: response.data.id,
                    text: response.data.text,
                    repliedToId: tweetId
                };
            } else {
                throw new Error('No data in response');
            }
            
        } catch (error) {
            console.error('❌ Failed to post reply:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getMentions(maxResults = 10) {
        if (!this.isInitialized) {
            return [];
        }

        try {
            const userInfo = await this.getUserInfo();
            if (!userInfo) return [];

            const params = {
                max_results: maxResults.toString(),
                'tweet.fields': 'created_at,author_id,conversation_id,in_reply_to_user_id,public_metrics',
                'user.fields': 'username,name,profile_image_url',
                'expansions': 'author_id'
            };

            const response = await this.makeApiRequest(`users/${userInfo.id}/mentions`, { params });
            
            if (!response.data) return [];

            const mentions = response.data.map(tweet => {
                const author = response.includes?.users?.find(user => user.id === tweet.author_id);
                return {
                    id: tweet.id,
                    text: tweet.text,
                    created_at: tweet.created_at,
                    author: {
                        id: tweet.author_id,
                        username: author?.username || 'unknown',
                        name: author?.name || 'Unknown User',
                        profile_image: author?.profile_image_url
                    },
                    conversation_id: tweet.conversation_id,
                    url: `https://twitter.com/i/status/${tweet.id}`,
                    metrics: tweet.public_metrics
                };
            });

            return mentions;
            
        } catch (error) {
            console.error('❌ Failed to get mentions:', error);
            return [];
        }
    }

    async checkMentions() {
        if (!this.isInitialized) return;

        try {
            console.log('🔍 Checking for new mentions...');
            const mentions = await this.getMentions();
            
            const newMentions = mentions.filter(mention => {
                return !this.lastMentionId || mention.id > this.lastMentionId;
            });

            if (newMentions.length > 0) {
                console.log(`📢 Found ${newMentions.length} new mention(s)`);
                
                // Update last mention ID
                const latestId = Math.max(...newMentions.map(m => parseInt(m.id)));
                this.lastMentionId = latestId.toString();

                // Process new mentions with AI responses
                for (const mention of newMentions) {
                    console.log(`📝 New mention from @${mention.author.username}: "${mention.text}"`);
                    await this.handleMentionWithAI(mention);
                }
            } else {
                console.log('📭 No new mentions');
            }

        } catch (error) {
            console.error('❌ Error checking mentions:', error);
            if (this.onError) this.onError(error);
        }
    }

    async handleMentionWithAI(mention) {
        try {
            // Clean the mention text (remove @your_username mentions)
            const cleanText = mention.text.replace(/@\w+/g, '').trim();
            
            console.log(`🤖 Generating AI response to: "${cleanText}"`);
            
            // Use existing speech planner to generate response
            if (this.heartSystem?.speechPlanner) {
                const aiResponse = await this.heartSystem.speechPlanner.generateResponse(
                    cleanText,
                    { emotion: 'neutral', intensity: 0.5 }
                );
                
                if (aiResponse) {
                    console.log(`💬 AI Response: "${aiResponse}"`);
                    
                    // Post reply to Twitter
                    const replyResult = await this.replyToTweet(mention.id, aiResponse);
                    
                    if (replyResult.success) {
                        console.log('✅ AI reply posted successfully to Twitter!');
                    } else {
                        console.error('❌ Failed to post AI reply:', replyResult.error);
                    }
                } else {
                    console.warn('⚠️ Could not generate AI response');
                }
            } else {
                console.warn('⚠️ Speech planner not available');
            }
            
            // Call original callback if set
            if (this.onMentionFound) {
                await this.onMentionFound(mention);
            }
            
        } catch (error) {
            console.error('❌ Error handling mention with AI:', error);
        }
    }

    async getTweetReplies(tweetId, maxResults = 20) {
        try {
            const params = {
                query: `conversation_id:${tweetId}`,
                max_results: maxResults.toString(),
                'tweet.fields': 'created_at,author_id,conversation_id,in_reply_to_user_id,public_metrics',
                'user.fields': 'username,name,profile_image_url',
                'expansions': 'author_id',
                'sort_order': 'recency'
            };

            const response = await this.makeApiRequest('tweets/search/recent', { params });
            
            if (!response.data) return [];

            const replies = response.data.map(tweet => {
                const author = response.includes?.users?.find(user => user.id === tweet.author_id);
                return {
                    id: tweet.id,
                    text: tweet.text,
                    created_at: tweet.created_at,
                    author: {
                        id: tweet.author_id,
                        username: author?.username || 'unknown',
                        name: author?.name || 'Unknown User',
                        profile_image: author?.profile_image_url
                    },
                    conversation_id: tweet.conversation_id,
                    in_reply_to: tweet.in_reply_to_user_id,
                    url: `https://twitter.com/i/status/${tweet.id}`,
                    metrics: tweet.public_metrics
                };
            });

            return replies;
            
        } catch (error) {
            console.error(`❌ Failed to get replies for tweet ${tweetId}:`, error);
            return [];
        }
    }

    async monitorTweetStream(tweetId, intervalMs = 30000) {
        if (this.streamInterval) {
            console.log('⚠️ Stream monitoring already active');
            return;
        }

        this.targetStreamTweetId = tweetId;
        console.log(`🌊 Starting stream monitoring for tweet: ${tweetId}`);
        
        // Initial check
        await this.checkTweetStream();
        
        // Set up periodic monitoring
        this.streamInterval = setInterval(async () => {
            await this.checkTweetStream();
        }, intervalMs);
        
        console.log(`✅ Stream monitoring started (checking every ${intervalMs/1000}s)`);
    }

    async checkTweetStream() {
        if (!this.targetStreamTweetId) return;

        try {
            console.log(`🔍 Checking stream for tweet: ${this.targetStreamTweetId}`);
            const replies = await this.getTweetReplies(this.targetStreamTweetId);
            
            const newReplies = replies.filter(reply => {
                return !this.lastStreamCheckId || reply.id > this.lastStreamCheckId;
            });

            if (newReplies.length > 0) {
                console.log(`🌊 Found ${newReplies.length} new stream reply(s)`);
                
                // Update last stream check ID
                const latestId = Math.max(...newReplies.map(r => parseInt(r.id)));
                this.lastStreamCheckId = latestId.toString();

                // Process new stream replies with AI
                for (const reply of newReplies) {
                    console.log(`💬 New stream reply from @${reply.author.username}: "${reply.text}"`);
                    await this.handleStreamReplyWithAI(reply);
                }
            } else {
                console.log('🌊 No new stream replies');
            }

        } catch (error) {
            console.error('❌ Error checking tweet stream:', error);
            if (this.onError) this.onError(error);
        }
    }

    startMentionMonitoring(intervalMs = 60000) {
        if (this.monitoringInterval) {
            console.log('⚠️ Mention monitoring already active');
            return;
        }

        console.log(`🔄 Starting mention monitoring (checking every ${intervalMs/1000}s)`);
        
        // Initial check
        this.checkMentions();
        
        // Set up periodic monitoring
        this.monitoringInterval = setInterval(() => {
            this.checkMentions();
        }, intervalMs);
        
        console.log('✅ Mention monitoring started');
    }

    stopMentionMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Mention monitoring stopped');
        }
    }

    stopStreamMonitoring() {
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
            this.targetStreamTweetId = null;
            console.log('🛑 Stream monitoring stopped');
        }
    }

    async handleStreamReplyWithAI(reply) {
        try {
            // Clean the reply text
            const cleanText = reply.text.replace(/@\w+/g, '').trim();
            
            console.log(`🤖 Generating AI response to stream reply: "${cleanText}"`);
            
            // Use existing speech planner to generate response
            if (this.heartSystem?.speechPlanner) {
                const aiResponse = await this.heartSystem.speechPlanner.generateResponse(
                    cleanText,
                    { emotion: 'neutral', intensity: 0.5 }
                );
                
                if (aiResponse) {
                    console.log(`💬 AI Stream Response: "${aiResponse}"`);
                    
                    // Post reply to the stream
                    const replyResult = await this.replyToTweet(reply.id, aiResponse);
                    
                    if (replyResult.success) {
                        console.log('✅ AI stream reply posted successfully!');
                    } else {
                        console.error('❌ Failed to post AI stream reply:', replyResult.error);
                    }
                } else {
                    console.warn('⚠️ Could not generate AI stream response');
                }
            } else {
                console.warn('⚠️ Speech planner not available for stream reply');
            }
            
            // Call original callback if set
            if (this.onStreamReply) {
                await this.onStreamReply(reply);
            }
            
        } catch (error) {
            console.error('❌ Error handling stream reply with AI:', error);
        }
    }

    async generateAndPostTweet(topic = null) {
        if (!this.isInitialized) {
            throw new Error('Twitter API not initialized');
        }

        try {
            console.log('🤖 Generating general tweet...');
            
            // Use speech planner to generate a tweet
            if (this.heartSystem?.speechPlanner) {
                const prompt = topic ? `Talk about ${topic}` : "Share a thought or observation";
                
                const tweetContent = await this.heartSystem.speechPlanner.generateResponse(
                    prompt,
                    { emotion: 'neutral', intensity: 0.6 }
                );
                
                if (tweetContent) {
                    console.log(`📝 Generated tweet: "${tweetContent}"`);
                    
                    // Post the tweet
                    const result = await this.postTweet(tweetContent);
                    return result;
                } else {
                    throw new Error('Could not generate tweet content');
                }
            } else {
                throw new Error('Speech planner not available');
            }
            
        } catch (error) {
            console.error('❌ Failed to generate and post tweet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getStats() {
        return {
            isInitialized: this.isInitialized,
            isMentionMonitoring: this.monitoringInterval !== null,
            isStreamMonitoring: this.streamInterval !== null,
            lastMentionId: this.lastMentionId,
            lastStreamCheckId: this.lastStreamCheckId,
            targetStreamTweetId: this.targetStreamTweetId,
            hasAI: !!this.heartSystem?.speechPlanner,
            service: 'Twitter API v2 (Browser)'
        };
    }

    async close() {
        this.stopMentionMonitoring();
        this.stopStreamMonitoring();
        this.isInitialized = false;
        console.log('🔌 Twitter API client closed');
    }
}
