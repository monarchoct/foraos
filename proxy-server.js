import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON bodies
app.use(express.json());

// Proxy endpoint for OpenAI API
app.all('/api/openai/*', async (req, res) => {
    try {
        console.log(`🔄 Proxying ${req.method} request to OpenAI API`);
        
        // Extract the path after /api/openai/
        const openaiPath = req.path.replace('/api/openai', '');
        const openaiUrl = `https://api.openai.com${openaiPath}`;
        
        console.log(`📍 Target URL: ${openaiUrl}`);
        
        // Prepare headers (exclude host and other problematic headers)
        const headers = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Authorization': req.headers['authorization']
        };
        
        // Remove undefined headers
        Object.keys(headers).forEach(key => {
            if (headers[key] === undefined) {
                delete headers[key];
            }
        });
        
        console.log(`📤 Headers:`, headers);
        console.log(`📦 Body:`, req.body);
        
        // Make request to OpenAI
        const response = await fetch(openaiUrl, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        
        const data = await response.text();
        
        console.log(`📥 Response status: ${response.status}`);
        console.log(`📥 Response data:`, data);
        
        // Set response headers
        res.status(response.status);
        response.headers.forEach((value, key) => {
            if (key.toLowerCase() !== 'content-encoding') {
                res.setHeader(key, value);
            }
        });
        
        // Send response
        res.send(data);
        
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ error: 'Proxy server error', details: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Proxy server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`🔗 OpenAI API proxy: http://localhost:${PORT}/api/openai/v1/chat/completions`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

export default app;