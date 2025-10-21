// Environment Configuration
// This file can be safely committed to git
// Users should set their actual API keys via the web interface or environment variables

export const ENV_CONFIG = {
    // API Keys - these should be set via environment variables or user configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || 'your-elevenlabs-api-key-here',
    
    // Server Configuration
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // API Endpoints
    OPENAI_BASE_URL: 'https://api.openai.com/v1',
    ELEVENLABS_BASE_URL: 'https://api.elevenlabs.io/v1'
};

// Function to validate environment
export function validateEnvironment() {
    const issues = [];
    
    if (!ENV_CONFIG.OPENAI_API_KEY || ENV_CONFIG.OPENAI_API_KEY === 'your-openai-api-key-here') {
        issues.push('OpenAI API key not configured');
    }
    
    if (!ENV_CONFIG.ELEVENLABS_API_KEY || ENV_CONFIG.ELEVENLABS_API_KEY === 'your-elevenlabs-api-key-here') {
        issues.push('ElevenLabs API key not configured');
    }
    
    return {
        isValid: issues.length === 0,
        issues: issues,
        config: ENV_CONFIG
    };
}

// Function to get API keys for browser use
export function getBrowserApiKeys() {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
        const storedKeys = localStorage.getItem('foraos_api_keys');
        if (storedKeys) {
            try {
                return JSON.parse(storedKeys);
            } catch (e) {
                console.warn('Failed to parse stored API keys:', e);
            }
        }
        
        // Try to get from window object
        if (window.API_KEYS) {
            return window.API_KEYS;
        }
    }
    
    // Return default structure
    return {
        openai: { apiKey: 'your-openai-api-key-here' },
        elevenlabs: { apiKey: 'your-elevenlabs-api-key-here' }
    };
}
