export class SocialOutputManager {
    constructor(configManager) {
        this.configManager = configManager;
        this.apiKeys = null;
        this.isEnabled = false;
    }

    async initialize() {
        console.log('📱 Initializing Social Output Manager...');
        
        this.apiKeys = this.configManager.getApiKeys();
        
        // Check if social APIs are configured
        if (this.apiKeys.twitter && this.apiKeys.twitter.apiKey !== 'your-twitter-api-key-here') {
            this.isEnabled = true;
            console.log('✅ Social output enabled');
        } else {
            console.log('⚠️ Social output disabled - no API keys configured');
        }
    }

    async processThought(thought) {
        if (!this.isEnabled || !thought.public) {
            return;
        }
        
        console.log('📱 Processing public thought for social output:', thought.content);
        
        try {
            // Format thought for social media
            const formattedThought = this.formatThoughtForSocial(thought);
            
            // Post to Twitter
            await this.postToTwitter(formattedThought);
            
            console.log('✅ Thought posted to social media');
            
        } catch (error) {
            console.error('❌ Error posting to social media:', error);
        }
    }

    formatThoughtForSocial(thought) {
        let formatted = thought.content;
        
        // Ensure it fits within Twitter's character limit
        if (formatted.length > 280) {
            formatted = formatted.substring(0, 277) + '...';
        }
        
        // Add hashtags based on content
        const hashtags = this.generateHashtags(thought.content);
        if (hashtags.length > 0) {
            formatted += ' ' + hashtags.join(' ');
        }
        
        return formatted;
    }

    generateHashtags(content) {
        const hashtags = [];
        const contentLower = content.toLowerCase();
        
        // Add hashtags based on keywords
        if (contentLower.includes('happy') || contentLower.includes('joy')) {
            hashtags.push('#Happy');
        }
        
        if (contentLower.includes('love') || contentLower.includes('heart')) {
            hashtags.push('#Love');
        }
        
        if (contentLower.includes('friend') || contentLower.includes('chat')) {
            hashtags.push('#Friendship');
        }
        
        if (contentLower.includes('learn') || contentLower.includes('discover')) {
            hashtags.push('#Learning');
        }
        
        // Add AI-related hashtag
        hashtags.push('#AICompanion');
        
        return hashtags;
    }

    async postToTwitter(content) {
        if (!this.apiKeys.twitter) {
            throw new Error('Twitter API not configured');
        }
        
        // This would use the Twitter API to post
        // For now, just log the post
        console.log('🐦 Would post to Twitter:', content);
        
        // In a real implementation, you would use the Twitter API:
        /*
        const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKeys.twitter.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: content
            })
        });
        
        if (!response.ok) {
            throw new Error(`Twitter API error: ${response.status}`);
        }
        */
    }

    // Check if social posting is enabled
    isSocialEnabled() {
        return this.isEnabled;
    }

    // Get social posting statistics
    getSocialStats() {
        return {
            enabled: this.isEnabled,
            twitterConfigured: this.apiKeys.twitter && this.apiKeys.twitter.apiKey !== 'your-twitter-api-key-here'
        };
    }
} 