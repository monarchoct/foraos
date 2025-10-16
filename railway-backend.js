import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(cors());

// Load API keys from environment variables or config file
let OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VENICE_API_KEY;
let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Fallback to config file if environment variables are missing
if (!OPENAI_API_KEY || !ELEVENLABS_API_KEY) {
    try {
        const configPath = path.join(process.cwd(), 'config', 'api-keys.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            OPENAI_API_KEY = OPENAI_API_KEY || config.openai?.apiKey;
            ELEVENLABS_API_KEY = ELEVENLABS_API_KEY || config.elevenlabs?.apiKey;
            console.log('📁 Loaded API keys from config file');
        }
    } catch (error) {
        console.error('❌ Failed to load config file:', error.message);
    }
}

// Debug ALL environment variables
console.log('🔍 ALL Environment Variables:');
Object.keys(process.env).forEach(key => {
    if (key.includes('API') || key.includes('KEY') || key.includes('SECRET')) {
        console.log(`  ${key}: ${process.env[key] ? 'SET (' + process.env[key].length + ' chars)' : 'NOT SET'}`);
    }
});

console.log('🔍 Railway-specific variables:');
console.log('  - RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('  - RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID);
console.log('  - RAILWAY_SERVICE_ID:', process.env.RAILWAY_SERVICE_ID);

console.log('🔑 OpenAI API Key:', OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('🔑 ElevenLabs API Key:', ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing');

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        message: "ForaOS Backend is running",
        services: {
            openai: OPENAI_API_KEY ? "configured" : "missing",
            elevenlabs: ELEVENLABS_API_KEY ? "configured" : "missing"
        }
    });
});

// OpenAI Chat endpoint
app.post("/api/chat", async (req, res) => {
    try {
        console.log("🔄 Received chat request");
        
        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: "OpenAI API key not configured" });
        }
        
        const { messages, max_tokens = 150, temperature = 0.8 } = req.body;
        
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
                max_tokens: max_tokens,
                temperature: temperature,
            }),
        });

        const data = await response.json();
        console.log(`✅ OpenAI Response status: ${response.status}`);
        
        if (!response.ok) {
            console.error("❌ OpenAI Error:", data);
            return res.status(response.status).json(data);
        }
        
        res.json(data);
        
    } catch (error) {
        console.error("❌ Chat API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ElevenLabs Text-to-Speech endpoint
app.post("/api/tts", async (req, res) => {
    try {
        console.log("🎤 Received TTS request");
        
        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ error: "ElevenLabs API key not configured" });
        }
        
        const { text, voice_id = "jqcCZkN6Knx8BJ5TBdYR", model_id = "eleven_multilingual_v2" } = req.body;
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text,
                model_id: model_id,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ ElevenLabs Error:", errorData);
            return res.status(response.status).json(errorData);
        }
        
        // Return the audio data
        const audioBuffer = await response.arrayBuffer();
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength
        });
        res.send(Buffer.from(audioBuffer));
        
    } catch (error) {
        console.error("❌ TTS API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Serve static files (for web app)
app.use(express.static('.'));

// Serve the main page
app.get("/", (req, res) => {
    res.sendFile('index.html', { root: '.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ForaOS Backend running on port ${PORT}`);
    console.log(`📍 Chat API: http://localhost:${PORT}/api/chat`);
    console.log(`🎤 TTS API: http://localhost:${PORT}/api/tts`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
