// Simple CORS proxy server for OpenAI API
// This can be hosted on your domain to avoid CORS issues

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy endpoint for OpenAI API
app.post('/api/openai-proxy', async (req, res) => {
  try {
    const { messages, model, max_tokens, temperature, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.8
      })
    });
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

app.listen(PORT, () => {
  console.log(`CORS proxy server running on port ${PORT}`);
});
