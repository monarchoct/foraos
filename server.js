import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from the current directory
app.use(express.static('.'));

// Load API key from environment variable or config file
let OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    try {
        const configPath = path.join(process.cwd(), 'config', 'api-keys.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        OPENAI_API_KEY = config.openai?.apiKey;
        console.log('🔑 Loaded API key from config file');
    } catch (error) {
        console.error('❌ Failed to load API key from config:', error.message);
    }
}

if (!OPENAI_API_KEY) {
    console.error('❌ No OpenAI API key found in environment variables or config file');
}

app.post("/api/chat", async (req, res) => {
  try {
    console.log("🔄 Received chat request");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5",
        messages: req.body.messages,
        max_tokens: req.body.max_tokens || 150,
        temperature: req.body.temperature || 0.7,
      }),
    });

    const data = await response.json();
    console.log(`✅ Response status: ${response.status}`);
    res.json(data);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "ForaOS Web Server is running" });
});

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
