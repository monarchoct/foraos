# Twitter Integration

## Overview

The Twitter integration provides comprehensive social media functionality for the AI character, including autonomous tweeting, AI-powered replies, and live streaming features.

## Components

### TwitterManager (`twitter-manager.js`)
Handles all Twitter posting and interaction functionality:

- **Autonomous Tweeting**: AI generates and posts tweets based on mood and thoughts
- **AI Replies**: Automatically responds to mentions and tags
- **Live Streaming**: Creates stream tweets and responds to comments with speech
- **Mention Monitoring**: Tracks and responds to user interactions

### TwitterScraper (`twitter-scraper.js`)
Scrapes and analyzes Twitter data:

- **Timeline Scraping**: Monitors followed accounts and home timeline
- **Trending Topics**: Tracks trending hashtags and topics
- **Keyword Monitoring**: Searches for specific keywords and hashtags
- **User Interaction Tracking**: Analyzes user engagement patterns

## Features

### 🤖 Autonomous Tweeting
- Generates tweets based on AI's current mood and recent thoughts
- Configurable posting intervals (30 minutes to 2 hours)
- Responds to trending topics automatically
- Maintains personality consistency

### 💬 AI-Powered Replies
- Monitors mentions and replies in real-time
- Generates contextual responses based on AI's mood
- Tracks conversation history to avoid duplicate replies
- Maintains natural conversation flow

### 🎥 Live Streaming
- Creates stream announcement tweets
- Monitors stream comments in real-time
- Responds to comments with both text and speech
- Provides immersive live interaction experience

### 🕷️ Data Scraping
- Scrapes timeline, trends, and keyword mentions
- Analyzes sentiment and engagement metrics
- Influences AI mood based on scraped content
- Provides data for autonomous tweet generation

## Setup

### 1. API Keys
Add your Twitter API credentials to `config/api-keys.json`:

```json
{
  "twitter": {
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret", 
    "accessToken": "your-access-token",
    "accessTokenSecret": "your-access-token-secret",
    "bearerToken": "your-bearer-token"
  }
}
```

### 2. Twitter API v2 Requirements
- Twitter API v2 access with read/write permissions
- Bearer token for read operations
- OAuth 1.0a tokens for posting operations

## Usage

### UI Controls
- **Auto Tweets Toggle**: Enable/disable autonomous tweeting
- **Refresh Twitter**: Check connection status and recent activity

### Console Commands
```javascript
// Post a manual tweet
await twitterPost("Hello Twitter! 🤖");

// Start live streaming
await twitterStream("Live AI Chat Session");

// Check Twitter status
twitterStatus();

// Get recent scraped tweets
heartSystem.getScrapedTweets({ minEngagement: 10 });

// Get trending topics
heartSystem.getTrendingTopics();
```

### Programmatic Control
```javascript
// Start Twitter services
await heartSystem.startTwitter();

// Stop Twitter services  
await heartSystem.stopTwitter();

// Post tweet
await heartSystem.postTweet("Custom tweet content");

// Start streaming
await heartSystem.startTwitterStream("Stream Title");

// Stop streaming
heartSystem.stopTwitterStream();
```

## Configuration

### Autonomous Tweeting
- **Minimum Interval**: 30 minutes
- **Maximum Interval**: 2 hours
- **Content Generation**: Based on mood + recent thoughts
- **Character Limit**: 280 characters (auto-truncated)

### Mention Monitoring
- **Check Frequency**: Every 2 minutes
- **Reply Generation**: Contextual based on mention content
- **Duplicate Prevention**: 24-hour tracking window

### Scraping Settings
- **Timeline**: Every 5 minutes
- **Trends**: Every 15 minutes
- **Data Retention**: 7 days for tweets, 24 hours for trends
- **Followed Accounts**: Configurable list in scraper

### Streaming Features
- **Comment Monitoring**: Every 10 seconds during stream
- **Speech Response**: Automatic voice replies to comments
- **Text Replies**: Also posts text responses to comments

## Events & Callbacks

The Twitter system triggers various events that integrate with the AI system:

- **Tweet Posted**: Logs to memory system
- **Reply Posted**: Updates attention system
- **Mention Received**: Triggers engagement tracking
- **Stream Comment**: Generates speech response
- **Trending Topic**: Influences autonomous tweet generation
- **Scraped Content**: Affects AI mood based on sentiment

## Error Handling

- **Rate Limiting**: Automatic retry with backoff
- **API Errors**: Graceful degradation and logging
- **Connection Issues**: Automatic reconnection attempts
- **Invalid Content**: Content validation and sanitization

## Security Considerations

- API keys stored in configuration files (not committed to git)
- Rate limiting to prevent API abuse
- Content filtering for appropriate responses
- User interaction tracking for spam prevention
