import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';

const app = express();
const PORT = 3002;

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));

app.use(express.json());

let twitterCredentials = null;

// Load Twitter credentials
async function loadCredentials() {
    try {
        const apiKeysData = await fs.readFile('../config/api-keys.json', 'utf-8');
        const apiKeys = JSON.parse(apiKeysData);
        twitterCredentials = apiKeys.twitter;
        console.log('✅ Twitter credentials loaded');
    } catch (error) {
        console.error('❌ Failed to load Twitter credentials:', error);
    }
}

// Proxy Twitter API requests
app.all('/api/twitter/*', async (req, res) => {
    if (!twitterCredentials) {
        return res.status(500).json({ error: 'Twitter credentials not loaded' });
    }

    try {
        // Extract the Twitter API path
        const twitterPath = req.path.replace('/api/twitter/', '');
        const twitterUrl = `https://api.twitter.com/2/${twitterPath}`;
        
        // Build request options
        const options = {
            method: req.method,
            headers: {
                'Authorization': `Bearer ${twitterCredentials.bearerToken}`,
                'Content-Type': 'application/json'
            }
        };

        // Add query parameters for GET requests
        let finalUrl = twitterUrl;
        if (req.method === 'GET' && Object.keys(req.query).length > 0) {
            const params = new URLSearchParams(req.query);
            finalUrl += '?' + params.toString();
        }

        // Add body for POST requests
        if (req.method === 'POST' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        console.log(`🔄 Proxying ${req.method} ${finalUrl}`);
        
        // Make request to Twitter API
        const response = await fetch(finalUrl, options);
        const data = await response.json();

        // Forward the response
        res.status(response.status).json(data);

    } catch (error) {
        console.error('❌ Twitter proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Twitter API Proxy',
        hasCredentials: !!twitterCredentials
    });
});

// Start server
async function start() {
    await loadCredentials();
    
    app.listen(PORT, () => {
        console.log('🚀 Twitter API Proxy running on port', PORT);
        console.log('📡 Proxying requests to Twitter API v2');
        console.log('🔗 Health check: http://localhost:3002/health');
    });
}

start().catch(console.error);

