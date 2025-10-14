import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import { config, NETWORK_CONFIGS } from './config.js';
import { TwitterApiService } from './twitter-api-service.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = config.PORT;
const JWT_SECRET = config.JWT_SECRET;

// Solana Configuration
const SOLANA_NETWORK = config.SOLANA_NETWORK;
const REQUIRED_TOKEN_MINT = config.REQUIRED_TOKEN_MINT;
const MIN_TOKEN_BALANCE = config.MIN_TOKEN_BALANCE;

const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Initialize Twitter API Service
const twitterService = new TwitterApiService();

// AI Response Generator
class AIResponseGenerator {
    constructor() {
        this.personality = null;
        this.apiKeys = null;
        this.loadConfigs();
    }

    async loadConfigs() {
        try {
            const personalityData = await fs.readFile('../config/personality.json', 'utf-8');
            this.personality = JSON.parse(personalityData);
            
            const apiKeysData = await fs.readFile('../config/api-keys.json', 'utf-8');
            this.apiKeys = JSON.parse(apiKeysData);
            
            console.log('✅ AI configs loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load AI configs:', error);
        }
    }

    async generateReply(mentionText, authorUsername) {
        if (!this.apiKeys?.venice?.apiKey || !this.personality) {
            console.error('❌ Venice AI configuration not loaded');
            return null;
        }

        try {
            const prompt = this.buildPrompt(mentionText, authorUsername);
            
            const response = await fetch(`${this.apiKeys.venice.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.venice.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.apiKeys.venice.model || 'venice-uncensored',
                    messages: [
                        {
                            role: 'system',
                            content: prompt
                        },
                        {
                            role: 'user',
                            content: `@mimicOSX ${mentionText}`
                        }
                    ],
                    max_tokens: this.apiKeys.venice.maxTokens || 150,
                    temperature: this.apiKeys.venice.temperature || 0.8
                })
            });

            const data = await response.json();
            
            if (data.choices && data.choices[0]?.message?.content) {
                const reply = data.choices[0].message.content.trim();
                console.log(`🤖 Generated Venice AI reply: "${reply}"`);
                return reply;
            } else {
                console.error('❌ No response from Venice AI:', data);
                return null;
            }
            
        } catch (error) {
            console.error('❌ Failed to generate Venice AI reply:', error);
            return null;
        }
    }

    buildPrompt(mentionText, authorUsername) {
        const personality = this.personality;
        
        return `You are ${personality.name}, ${personality.description}

Background: ${personality.backgroundStory.personality}

Key traits:
- ${personality.backgroundStory.interests.slice(0, 5).join('\n- ')}

Respond to this Twitter mention as ${personality.name}. Keep it:
- Under 280 characters (Twitter limit)
- Natural and conversational 
- True to your playful, teasing personality
- Don't use hashtags unless very relevant
- Don't mention being an AI
- Respond directly to what they said

The user @${authorUsername} mentioned you saying: "${mentionText}"

Generate a brief, witty reply that ${personality.name} would naturally say:`;
    }
}

const aiGenerator = new AIResponseGenerator();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database(config.DATABASE_PATH);

// Create tables
db.serialize(() => {
  // Users table (now using wallet addresses)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Memory table
  db.run(`CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    conversation_history TEXT,
    emotional_history TEXT,
    last_saved DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_start DATETIME,
    total_messages INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

// Solana Token Verification
async function verifyTokenBalance(walletAddress, tokenMint, minBalance) {
  try {
    const walletPublicKey = new PublicKey(walletAddress);
    const tokenMintPublicKey = new PublicKey(tokenMint);

    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    // Find the specific token account
    const tokenAccount = tokenAccounts.value.find(account => 
      account.account.data.parsed.info.mint === tokenMint
    );

    if (!tokenAccount) {
      console.log(`❌ No token account found for mint: ${tokenMint}`);
      return false;
    }

    const balance = tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
    console.log(`💰 Wallet ${walletAddress} has ${balance} tokens of mint ${tokenMint}`);
    
    return balance >= minBalance;
  } catch (error) {
    console.error('❌ Error verifying token balance:', error);
    return false;
  }
}

// Verify Solana signature
async function verifySignature(message, signature, publicKey) {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey);
    
    // Verify the signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes.toBytes()
    );
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Phantom Wallet Login
app.post('/api/wallet-login', async (req, res) => {
  try {
    const { walletAddress, signature, message, username } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Wallet address, signature, and message required' });
    }

    // Verify the signature (optional - can be done client-side)
    // const isValidSignature = await verifySignature(message, signature, walletAddress);
    // if (!isValidSignature) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Verify token balance
    const hasRequiredTokens = await verifyTokenBalance(walletAddress, REQUIRED_TOKEN_MINT, MIN_TOKEN_BALANCE);
    
    if (!hasRequiredTokens) {
      return res.status(403).json({ 
        error: 'Insufficient token balance',
        required: {
          tokenMint: REQUIRED_TOKEN_MINT,
          minBalance: MIN_TOKEN_BALANCE,
          network: SOLANA_NETWORK
        }
      });
    }

    // Check if user exists
    db.get('SELECT * FROM users WHERE wallet_address = ?', [walletAddress], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        // Create new user
        db.run('INSERT INTO users (wallet_address, username) VALUES (?, ?)', 
          [walletAddress, username || `User_${walletAddress.slice(0, 8)}`], function(err) {
          if (err) {
            return res.status(500).json({ error: 'User creation error' });
          }

          // Create JWT token
          const token = jwt.sign({ 
            id: this.lastID, 
            walletAddress,
            username: username || `User_${walletAddress.slice(0, 8)}`
          }, JWT_SECRET, { expiresIn: '7d' });
          
          res.json({ 
            message: 'User registered and logged in successfully',
            token,
            user: { 
              id: this.lastID, 
              walletAddress,
              username: username || `User_${walletAddress.slice(0, 8)}`
            },
            tokenVerification: {
              hasRequiredTokens: true,
              tokenMint: REQUIRED_TOKEN_MINT,
              minBalance: MIN_TOKEN_BALANCE
            }
          });
        });
      } else {
        // Update last login
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE wallet_address = ?', [walletAddress]);
        
        // Create JWT token
        const token = jwt.sign({ 
          id: user.id, 
          walletAddress,
          username: user.username
        }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ 
          message: 'Login successful',
          token,
          user: { 
            id: user.id, 
            walletAddress,
            username: user.username
          },
          tokenVerification: {
            hasRequiredTokens: true,
            tokenMint: REQUIRED_TOKEN_MINT,
            minBalance: MIN_TOKEN_BALANCE
          }
        });
      }
    });
  } catch (error) {
    console.error('❌ Wallet login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get wallet info (for frontend verification)
app.get('/api/wallet-info', async (req, res) => {
  try {
    const { walletAddress } = req.query;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const hasRequiredTokens = await verifyTokenBalance(walletAddress, REQUIRED_TOKEN_MINT, MIN_TOKEN_BALANCE);
    
    res.json({
      walletAddress,
      hasRequiredTokens,
      requirements: {
        tokenMint: REQUIRED_TOKEN_MINT,
        minBalance: MIN_TOKEN_BALANCE,
        network: SOLANA_NETWORK
      }
    });
  } catch (error) {
    console.error('❌ Wallet info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save memory
app.post('/api/memory', authenticateToken, (req, res) => {
  try {
    const { conversationHistory, emotionalHistory, sessionStart, totalMessages } = req.body;
    const userId = req.user.id;

    const memoryData = {
      conversationHistory: JSON.stringify(conversationHistory),
      emotionalHistory: JSON.stringify(emotionalHistory),
      sessionStart: sessionStart || new Date().toISOString(),
      totalMessages: totalMessages || 0
    };

    // Check if memory exists for user
    db.get('SELECT id FROM memories WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        // Update existing memory
        db.run(`UPDATE memories SET 
          conversation_history = ?, 
          emotional_history = ?, 
          last_saved = CURRENT_TIMESTAMP,
          session_start = ?,
          total_messages = ?
          WHERE user_id = ?`, 
          [memoryData.conversationHistory, memoryData.emotionalHistory, memoryData.sessionStart, memoryData.totalMessages, userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Memory update error' });
            }
            res.json({ message: 'Memory updated successfully' });
          });
      } else {
        // Create new memory
        db.run(`INSERT INTO memories (user_id, conversation_history, emotional_history, session_start, total_messages) 
          VALUES (?, ?, ?, ?, ?)`,
          [userId, memoryData.conversationHistory, memoryData.emotionalHistory, memoryData.sessionStart, memoryData.totalMessages],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Memory creation error' });
            }
            res.json({ message: 'Memory saved successfully' });
          });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get memory
app.get('/api/memory', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    db.get('SELECT * FROM memories WHERE user_id = ?', [userId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.json({ 
          conversationHistory: [],
          emotionalHistory: [],
          lastSaved: null,
          sessionStart: null,
          totalMessages: 0
        });
      }

      res.json({
        conversationHistory: JSON.parse(row.conversation_history || '[]'),
        emotionalHistory: JSON.parse(row.emotional_history || '[]'),
        lastSaved: row.last_saved,
        sessionStart: row.session_start,
        totalMessages: row.total_messages
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Twitter API Endpoints

// Initialize Twitter Service (Development - No Auth Required)
app.post('/api/twitter/init', async (req, res) => {
  try {
    console.log('🤖 Initializing Twitter Service...');
    const result = await twitterService.initialize();
    res.json({ 
      message: 'Twitter service initialized successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Twitter init error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post Tweet (Development - No Auth Required)
app.post('/api/twitter/tweet', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Tweet content required' });
    }
    
    const result = await twitterService.postTweet(content);
    res.json({ 
      message: 'Tweet posted successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Tweet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reply to Tweet (Development - No Auth Required)
app.post('/api/twitter/reply', async (req, res) => {
  try {
    const { tweetUrl, content } = req.body;
    
    if (!tweetUrl || !content) {
      return res.status(400).json({ error: 'Tweet URL and reply content required' });
    }
    
    const result = await twitterService.replyToTweet(tweetUrl, content);
    res.json({ 
      message: 'Reply posted successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Reply error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check Mentions (Development - No Auth Required)
app.get('/api/twitter/mentions', async (req, res) => {
  try {
    const mentions = await twitterService.checkMentions();
    res.json({ 
      mentions,
      count: mentions.length
    });
  } catch (error) {
    console.error('❌ Mentions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start Mention Monitoring (Development - No Auth Required)
app.post('/api/twitter/monitor/start', async (req, res) => {
  try {
    const { interval = 30000 } = req.body;
    
    // Set up callback for new mentions with AI replies
    twitterService.onMentionFound = async (mention) => {
      console.log(`📢 NEW MENTION: @${mention.author.username} said "${mention.text}"`);
      
      try {
        // Generate AI response using Kira's personality
        console.log('🤖 Generating AI response...');
        const aiReply = await aiGenerator.generateReply(mention.text, mention.author.username);
        
        if (aiReply) {
          console.log(`💬 AI Reply: "${aiReply}"`);
          
          // Post reply to Twitter
          console.log('📤 Posting reply to Twitter...');
          const replyResult = await twitterService.replyToTweet(mention.id, aiReply);
          
          if (replyResult.success) {
            console.log('✅ AI reply posted successfully to Twitter!');
          } else {
            console.error('❌ Failed to post AI reply:', replyResult.error);
          }
        } else {
          console.warn('⚠️ Could not generate AI reply');
        }
        
      } catch (error) {
        console.error('❌ Error processing mention:', error);
      }
    };
    
    await twitterService.startMentionMonitoring(interval);
    res.json({ 
      message: 'Mention monitoring started',
      interval: interval
    });
  } catch (error) {
    console.error('❌ Monitor start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop Mention Monitoring (Development - No Auth Required)
app.post('/api/twitter/monitor/stop', async (req, res) => {
  try {
    twitterService.stopMentionMonitoring();
    res.json({ message: 'Mention monitoring stopped' });
  } catch (error) {
    console.error('❌ Monitor stop error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Twitter Service Stats (Development - No Auth Required)
app.get('/api/twitter/stats', (req, res) => {
  try {
    const stats = twitterService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    config: {
      network: SOLANA_NETWORK,
      requiredTokenMint: REQUIRED_TOKEN_MINT,
      minTokenBalance: MIN_TOKEN_BALANCE
    },
    twitter: twitterService.getStats()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HEART Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Token-gated access enabled`);
  console.log(`💰 Required token: ${REQUIRED_TOKEN_MINT} (min: ${MIN_TOKEN_BALANCE})`);
  console.log(`🌐 Network: ${SOLANA_NETWORK}`);
}); 