import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3001;

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
    
    // Only handle OpenAI API requests
    if (!req.url.startsWith('/api/openai/')) {
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'OK', message: 'Proxy server is running' }));
            return;
        }
        res.writeHead(404);
        res.end('Not found');
        return;
    }
    
    console.log(`🔄 Proxying ${req.method} request to OpenAI API`);
    
    // Extract OpenAI path
    const openaiPath = req.url.replace('/api/openai', '');
    const openaiUrl = `https://api.openai.com${openaiPath}`;
    
    console.log(`📍 Target URL: ${openaiUrl}`);
    
    // Prepare headers
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
    
    // Make request to OpenAI
    const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: openaiPath,
        method: req.method,
        headers: headers
    };
    
    const proxyReq = https.request(options, (proxyRes) => {
        console.log(`📥 Response status: ${proxyRes.statusCode}`);
        
        // Set response headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        // Pipe response data
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (error) => {
        console.error('❌ Proxy error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy server error', details: error.message }));
    });
    
    // Pipe request data
    req.pipe(proxyReq);
});

server.listen(PORT, () => {
    console.log(`🚀 Simple proxy server running on http://localhost:${PORT}`);
    console.log(`🔗 OpenAI API proxy: http://localhost:${PORT}/api/openai/v1/chat/completions`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

export default server;
