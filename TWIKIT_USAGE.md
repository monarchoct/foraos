# 🐦 TwikitJS Usage Guide

## **🚀 How to Use TwikitJS (FREE Twitter API)**

TwikitJS is now integrated into your system! No API keys needed, completely free.

---

## **📱 UI Usage**

### **Start Twitter Services**
1. Click the **"Auto Tweets"** toggle in the Twitter module
2. This automatically starts both official API (if available) and TwikitJS
3. TwikitJS will begin monitoring mentions and trends every 2 minutes

### **Check Status**
- Click **"Refresh Twitter"** to see current status
- Shows both official API and TwikitJS stats

---

## **💻 Console Commands**

### **Basic Usage**
```javascript
// Check if TwikitJS is working
twitterStatus();
// Returns: { freeMode: true, available: true, stats: {...} }

// Get TwikitJS stats
twikitStats();
// Returns: { tweets: 42, cost: 0, library: 'TwikitJS (Free)' }
```

### **Search Tweets** 🔍
```javascript
// Search for tweets about AI
const aiTweets = await searchTweets('artificial intelligence', 50);
console.log(`Found ${aiTweets.length} AI tweets`);

// Search for mentions of your AI
const mentions = await searchTweets('@your_ai_name OR your AI name', 20);

// Search hashtags
const hashtagTweets = await searchTweets('#AI #MachineLearning', 30);
```

### **Get User Tweets** 👤
```javascript
// Get Elon's latest tweets
const elonTweets = await getUserTweets('elonmusk', 20);

// Get OpenAI's tweets
const openaiTweets = await getUserTweets('openai', 15);

// Get any user's tweets
const userTweets = await getUserTweets('username', 10);
```

### **Get Trending Topics** 📈
```javascript
// Get current trending topics
const trends = await getTrends();
console.log('Trending now:', trends.map(t => t.name));
```

### **Advanced Usage**
```javascript
// Get all scraped data (from both official API and TwikitJS)
const allTweets = heartSystem.getScrapedTweets();
const allTrends = heartSystem.getTrendingTopics();

// Filter tweets
const popularTweets = heartSystem.getScrapedTweets({ minLikes: 100 });
const recentTweets = heartSystem.getScrapedTweets({ author: 'elonmusk' });
```

---

## **🔧 Programmatic Usage**

### **Direct TwikitJS Access**
```javascript
// Access TwikitJS directly
const twikit = heartSystem.twikitJS;

// Start custom monitoring
await twikit.startMonitoring([
    { type: 'search', query: 'your brand mentions' },
    { type: 'user', username: 'competitor' },
    { type: 'trends' }
], 60000); // Every minute

// Get filtered data
const tweets = twikit.getTweets({
    author: 'elonmusk',
    minLikes: 50,
    text: 'AI'
});
```

---

## **⚡ Real-World Examples**

### **Monitor Brand Mentions**
```javascript
// Monitor what people say about your AI
const mentions = await searchTweets('your AI name OR @your_handle', 50);
mentions.forEach(tweet => {
    console.log(`${tweet.author.username}: ${tweet.text}`);
    console.log(`Engagement: ${tweet.metrics.likes} likes, ${tweet.metrics.retweets} RTs`);
});
```

### **Analyze Competitors**
```javascript
// See what competitors are tweeting
const competitorTweets = await getUserTweets('competitor_username', 20);
const topics = competitorTweets.map(t => t.hashtags).flat();
console.log('Competitor focuses on:', [...new Set(topics)]);
```

### **Trend Analysis**
```javascript
// Get trending topics and related tweets
const trends = await getTrends();
for (const trend of trends.slice(0, 5)) {
    console.log(`\n📈 Trending: ${trend.name}`);
    const trendTweets = await searchTweets(trend.name, 10);
    console.log(`Found ${trendTweets.length} tweets about this trend`);
}
```

### **Content Ideas**
```javascript
// Find popular content in your niche
const aiTweets = await searchTweets('AI chatbot', 30);
const popular = aiTweets
    .filter(t => t.metrics.likes > 20)
    .sort((a, b) => b.metrics.likes - a.metrics.likes)
    .slice(0, 5);

console.log('Popular AI content ideas:');
popular.forEach(tweet => {
    console.log(`💡 "${tweet.text}" (${tweet.metrics.likes} likes)`);
});
```

---

## **📊 Monitoring Dashboard**

### **Create a Live Dashboard**
```javascript
// Set up continuous monitoring
setInterval(async () => {
    const status = twitterStatus();
    const stats = twikitStats();
    
    console.clear();
    console.log('🐦 Twitter Dashboard');
    console.log('==================');
    console.log(`Status: ${status.freeMode ? '🆓 FREE MODE' : '💰 PAID API'}`);
    console.log(`Tweets Collected: ${stats.tweets}`);
    console.log(`Trends Tracked: ${stats.trends}`);
    console.log(`Cost: $${stats.cost} (FREE!)`);
    
    // Show recent activity
    const recentTweets = heartSystem.getScrapedTweets().slice(0, 3);
    console.log('\n📝 Recent Tweets:');
    recentTweets.forEach(tweet => {
        console.log(`@${tweet.author.username}: ${tweet.text.substring(0, 80)}...`);
    });
    
}, 30000); // Update every 30 seconds
```

---

## **🎯 Best Practices**

### **Rate Limiting**
- TwikitJS has built-in rate limiting (1 second between requests)
- Don't make too many requests too quickly
- The system automatically handles this

### **Data Management**
```javascript
// Check how much data you've collected
const stats = twikitStats();
if (stats.tweets > 1000) {
    console.log('💾 Lots of data collected! Consider processing it.');
}
```

### **Error Handling**
```javascript
try {
    const tweets = await searchTweets('AI', 50);
    console.log(`✅ Found ${tweets.length} tweets`);
} catch (error) {
    console.error('❌ Search failed:', error.message);
    // TwikitJS will automatically try fallback methods
}
```

---

## **💡 Tips & Tricks**

1. **Start Small**: Begin with small queries (10-20 tweets) to test
2. **Use Specific Searches**: More specific queries = better results
3. **Monitor Regularly**: Set up monitoring for continuous data collection
4. **Combine Data**: Use both official API and TwikitJS for maximum coverage
5. **Check Status**: Use `twitterStatus()` to see what's working

---

## **🆓 Cost Comparison**

| Feature | Official Twitter API | TwikitJS |
|---------|---------------------|----------|
| **Monthly Cost** | $200-5000 | **FREE** ✅ |
| **Rate Limits** | Very strict | Reasonable |
| **Setup** | Complex API keys | Auto-configured |
| **Data Access** | Limited by tier | Full public data |
| **Reliability** | High | High (multiple fallbacks) |

---

## **🚀 You're Ready!**

TwikitJS is now running in your system! Try these commands:

```javascript
// Quick test
twitterStatus();
await searchTweets('hello world', 5);
twikitStats();
```

**No API keys needed, no monthly costs, unlimited usage!** 🎉
