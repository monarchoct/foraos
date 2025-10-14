import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs/promises';

export class TwitterApiService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.monitoringInterval = null;
        this.lastMentionId = null;
        this.onMentionFound = null;
        this.credentials = null;
    }

    async initialize() {
        try {
            console.log('🐦 Initializing Twitter API Service...');
            
            // Load API credentials
            const apiKeysData = await fs.readFile('../config/api-keys.json', 'utf-8');
            const apiKeys = JSON.parse(apiKeysData);
            this.credentials = apiKeys.twitter;

            // Initialize Twitter API client
            this.client = new TwitterApi({
                appKey: this.credentials.apiKey,
                appSecret: this.credentials.apiSecret,
                accessToken: this.credentials.accessToken,
                accessSecret: this.credentials.accessTokenSecret,
            });

            // Test the connection
            const me = await this.client.v2.me();
            console.log(`✅ Twitter API connected as: @${me.data.username} (${me.data.name})`);
            
            this.isInitialized = true;
            return {
                success: true,
                username: me.data.username,
                name: me.data.name,
                id: me.data.id
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize Twitter API:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    async tweet(text) {
        if (!this.isInitialized) {
            throw new Error('Twitter API not initialized');
        }

        try {
            console.log(`📤 Posting tweet: "${text}"`);
            const tweet = await this.client.v2.tweet(text);
            console.log(`✅ Tweet posted successfully! ID: ${tweet.data.id}`);
            
            return {
                success: true,
                tweetId: tweet.data.id,
                text: tweet.data.text
            };
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
            
            const reply = await this.client.v2.reply(replyText, tweetId);
            console.log(`✅ Reply posted successfully! ID: ${reply.data.id}`);
            
            return {
                success: true,
                tweetId: reply.data.id,
                text: reply.data.text,
                repliedToId: tweetId
            };
        } catch (error) {
            console.error('❌ Failed to post reply:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkMentions() {
        if (!this.isInitialized) {
            console.warn('⚠️ Twitter API not initialized');
            return [];
        }

        try {
            console.log('🔍 Checking for new mentions...');
            
            // Get mentions timeline
            const mentions = await this.client.v2.userMentionTimeline('me', {
                max_results: 10,
                'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'in_reply_to_user_id'],
                'user.fields': ['username', 'name'],
                expansions: ['author_id']
            });

            const newMentions = [];
            
            if (mentions.data && mentions.data.data) {
                for (const mention of mentions.data.data) {
                    // Skip if we've already processed this mention
                    if (this.lastMentionId && mention.id <= this.lastMentionId) {
                        continue;
                    }

                    // Get author info from includes
                    const author = mentions.data.includes?.users?.find(user => user.id === mention.author_id);
                    
                    const mentionData = {
                        id: mention.id,
                        text: mention.text,
                        created_at: mention.created_at,
                        author: {
                            id: mention.author_id,
                            username: author?.username || 'unknown',
                            name: author?.name || 'Unknown User'
                        },
                        conversation_id: mention.conversation_id,
                        url: `https://twitter.com/i/status/${mention.id}`
                    };

                    newMentions.push(mentionData);
                    
                    // Update last processed mention ID
                    if (!this.lastMentionId || mention.id > this.lastMentionId) {
                        this.lastMentionId = mention.id;
                    }
                }
            }

            if (newMentions.length > 0) {
                console.log(`📢 Found ${newMentions.length} new mention(s)`);
                
                // Process each new mention
                for (const mention of newMentions) {
                    console.log(`📝 New mention from @${mention.author.username}: "${mention.text}"`);
                    
                    if (this.onMentionFound) {
                        await this.onMentionFound(mention);
                    }
                }
            } else {
                console.log('📭 No new mentions found');
            }

            return newMentions;
            
        } catch (error) {
            console.error('❌ Failed to check mentions:', error);
            return [];
        }
    }

    async startMentionMonitoring(intervalMs = 60000) {
        if (this.monitoringInterval) {
            console.log('⚠️ Mention monitoring already running');
            return;
        }

        console.log(`🔄 Starting mention monitoring (checking every ${intervalMs/1000}s)`);
        
        // Initial check
        await this.checkMentions();
        
        // Set up periodic checking
        this.monitoringInterval = setInterval(async () => {
            await this.checkMentions();
        }, intervalMs);
        
        console.log('✅ Mention monitoring started');
    }

    async stopMentionMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('🛑 Mention monitoring stopped');
        }
    }

    getStats() {
        return {
            isInitialized: this.isInitialized,
            isMonitoring: this.monitoringInterval !== null,
            lastMentionId: this.lastMentionId,
            service: 'Twitter API v2'
        };
    }

    async close() {
        await this.stopMentionMonitoring();
        this.isInitialized = false;
        console.log('🔌 Twitter API service closed');
    }
}

