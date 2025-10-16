import http from 'http';
import https from 'https';
import { URL } from 'url';
import fetch from 'node-fetch';

// Use Railway's PORT environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Load API key from environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('❌ No OpenAI API key found in environment variables');
}

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Handle health check
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'OK', message: 'ForaOS Proxy server is running', port: PORT }));
        return;
    }
    
    // Handle chat API requests
    if (req.url === '/api/chat') {
        handleChatRequest(req, res);
        return;
    }
    
    res.writeHead(404);
    res.end('Not found');
});

function handleChatRequest(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method not allowed');
        return;
    }
    
    console.log('🔄 Received chat request');
    
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', async () => {
        try {
            const requestData = JSON.parse(body);
            
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: requestData.messages,
                    max_tokens: requestData.max_tokens || 150,
                    temperature: requestData.temperature || 0.7,
                }),
            });

            const data = await response.json();
            console.log(`✅ Response status: ${response.status}`);
            
            res.writeHead(response.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
            
        } catch (error) {
            console.error("❌ Error:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    });
}

server.listen(PORT, () => {
    console.log(`🚀 ForaOS Proxy server running on port ${PORT}`);
    console.log(`🔗 OpenAI API proxy: /api/chat`);
    console.log(`💚 Health check: /health`);
});

export default server;
