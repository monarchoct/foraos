import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Health check
    if (req.url === '/health' || req.url === '/api/proxy/health') {
        res.status(200).json({ 
            status: 'OK', 
            message: 'ForaOS Proxy server is running',
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    // Only handle OpenAI API requests
    if (!req.url.startsWith('/api/proxy/openai/')) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    
    console.log(`🔄 Proxying ${req.method} request to OpenAI API`);
    
    // Extract OpenAI path
    const openaiPath = req.url.replace('/api/proxy/openai', '');
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
    
    try {
        // Make request to OpenAI
        const response = await fetch(openaiUrl, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });
        
        console.log(`📥 Response status: ${response.status}`);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ 
            error: 'Proxy server error', 
            details: error.message 
        });
    }
}
