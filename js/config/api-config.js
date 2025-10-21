// API Configuration
// This file contains placeholder API keys that should be replaced with real ones
// The actual API keys should be set via environment variables or user configuration

export const API_CONFIG = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.8
    },
    elevenlabs: {
        apiKey: process.env.ELEVENLABS_API_KEY || 'your-elevenlabs-api-key-here',
        voiceId: 'jqcCZkN6Knx8BJ5TBdYR',
        model: 'eleven_multilingual_v2'
    }
};

// Function to get API keys from various sources
export function getApiKeys() {
    // Try to get from window object (browser)
    if (typeof window !== 'undefined' && window.API_KEYS) {
        return window.API_KEYS;
    }
    
    // Try to get from environment variables
    if (typeof process !== 'undefined' && process.env) {
        return {
            openai: {
                apiKey: process.env.OPENAI_API_KEY || API_CONFIG.openai.apiKey,
                model: API_CONFIG.openai.model,
                maxTokens: API_CONFIG.openai.maxTokens,
                temperature: API_CONFIG.openai.temperature
            },
            elevenlabs: {
                apiKey: process.env.ELEVENLABS_API_KEY || API_CONFIG.elevenlabs.apiKey,
                voiceId: API_CONFIG.elevenlabs.voiceId,
                model: API_CONFIG.elevenlabs.model
            }
        };
    }
    
    // Return default config
    return API_CONFIG;
}

// Function to validate API keys
export function validateApiKeys(keys) {
    const issues = [];
    
    if (!keys.openai.apiKey || keys.openai.apiKey === 'your-openai-api-key-here') {
        issues.push('OpenAI API key not configured');
    }
    
    if (!keys.elevenlabs.apiKey || keys.elevenlabs.apiKey === 'your-elevenlabs-api-key-here') {
        issues.push('ElevenLabs API key not configured');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues
    };
}
