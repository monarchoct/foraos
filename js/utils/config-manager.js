export class ConfigManager {
    constructor() {
        this.configs = {};
        this.configPaths = {
            'personality': 'config/personality.json',
            'heart-state': 'config/heart-state.json',
            'memory': 'config/memory.json'
        };
        this.envApiKeys = null;
        this.loadEnvApiKeys();
    }

    loadEnvApiKeys() {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            // In browser, we can't access process.env directly
            // We'll rely on Vite to inject environment variables
            this.envApiKeys = {
                openai: {
                    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
                    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
                    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 150,
                    temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.8
                },
                venice: {
                    apiKey: import.meta.env.VITE_VENICE_API_KEY || '',
                    baseUrl: import.meta.env.VITE_VENICE_BASE_URL || 'https://api.venice.ai/api/v1',
                    model: import.meta.env.VITE_VENICE_MODEL || 'claude-3-5-sonnet',
                    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 150,
                    temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.8,
                    characterSlug: import.meta.env.VITE_VENICE_CHARACTER_SLUG || ''
                },
                elevenlabs: {
                    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
                    baseUrl: import.meta.env.VITE_ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1'
                },
                twitter: {
                    apiKey: import.meta.env.VITE_TWITTER_API_KEY || '',
                    apiSecret: import.meta.env.VITE_TWITTER_API_SECRET || '',
                    accessToken: import.meta.env.VITE_TWITTER_ACCESS_TOKEN || '',
                    accessTokenSecret: import.meta.env.VITE_TWITTER_ACCESS_TOKEN_SECRET || '',
                    bearerToken: import.meta.env.VITE_TWITTER_BEARER_TOKEN || ''
                },
                twitch: {
                    clientId: import.meta.env.VITE_TWITCH_CLIENT_ID || '',
                    clientSecret: import.meta.env.VITE_TWITCH_CLIENT_SECRET || '',
                    accessToken: import.meta.env.VITE_TWITCH_ACCESS_TOKEN || ''
                }
            };
            console.log('🔑 Environment API keys loaded from Vite');
            return;
        }
        
        // In Node.js environment, load from process.env
        try {
            this.envApiKeys = {
                openai: {
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 150,
                    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.8
                },
                venice: {
                    apiKey: process.env.VENICE_API_KEY || '',
                    baseUrl: process.env.VENICE_BASE_URL || 'https://api.venice.ai/api/v1',
                    model: process.env.VENICE_MODEL || 'claude-3-5-sonnet',
                    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 150,
                    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.8,
                    characterSlug: process.env.VENICE_CHARACTER_SLUG || ''
                },
                elevenlabs: {
                    apiKey: process.env.ELEVENLABS_API_KEY || '',
                    baseUrl: process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1'
                },
                twitter: {
                    apiKey: process.env.TWITTER_API_KEY || '',
                    apiSecret: process.env.TWITTER_API_SECRET || '',
                    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
                    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
                    bearerToken: process.env.TWITTER_BEARER_TOKEN || ''
                },
                twitch: {
                    clientId: process.env.TWITCH_CLIENT_ID || '',
                    clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
                    accessToken: process.env.TWITCH_ACCESS_TOKEN || ''
                }
            };
            console.log('🔑 Environment API keys loaded from process.env');
        } catch (error) {
            console.error('❌ Failed to load environment API keys:', error);
        }
    }

    async loadConfigs() {
        try {
            const promises = Object.entries(this.configPaths).map(async ([key, path]) => {
                const config = await this.loadConfig(path);
                this.configs[key] = config;
            });
            
            await Promise.all(promises);
            
        } catch (error) {
            console.error('Error loading configurations:', error);
            throw error;
        }
    }

    async loadConfig(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Config file not found: ${path} - using defaults`);
                    return this.getDefaultConfig(path);
                }
                throw new Error(`Failed to load config: ${response.statusText}`);
            }
            const config = await response.json();
            return config;
        } catch (error) {
            console.error(`Error loading config from ${path}:`, error);
            console.warn(`Using default config for ${path}`);
            return this.getDefaultConfig(path);
        }
    }

    getDefaultConfig(path) {
        if (path.includes('heart-state')) {
            return { emotions: {}, thoughts: [], memories: [] };
        } else if (path.includes('memory')) {
            return { conversations: [], emotionalStates: [] };
        }
        return {};
    }

    getConfig(configName) {
        return this.configs[configName] || null;
    }

    getPersonality() {
        return this.configs['personality'];
    }

    getApiKeys() {
        // Only return environment API keys - no config file fallback
        if (this.envApiKeys && this.hasEnvApiKeys()) {
            return this.envApiKeys;
        }
        
        // Return empty structure if no env keys are available
        console.warn('⚠️ No environment API keys found. Please configure your .env file.');
        return {
            openai: { apiKey: '', model: 'gpt-3.5-turbo', maxTokens: 150, temperature: 0.8 },
            venice: { apiKey: '', baseUrl: 'https://api.venice.ai/api/v1', model: 'claude-3-5-sonnet', maxTokens: 150, temperature: 0.8, characterSlug: '' },
            elevenlabs: { apiKey: '', baseUrl: 'https://api.elevenlabs.io/v1' },
            twitter: { apiKey: '', apiSecret: '', accessToken: '', accessTokenSecret: '', bearerToken: '' },
            twitch: { clientId: '', clientSecret: '', accessToken: '' }
        };
    }

    hasEnvApiKeys() {
        if (!this.envApiKeys) return false;
        
        // Check if any environment API keys are set and not empty
        return Object.values(this.envApiKeys).some(service => 
            service.apiKey && service.apiKey.trim() !== '' && 
            !service.apiKey.includes('your-') && 
            !service.apiKey.includes('here') &&
            !service.apiKey.includes('_here')
        );
    }

    getHeartState() {
        return this.configs['heart-state'];
    }

    // Update a specific configuration
    async updateConfig(configName, newConfig) {
        try {
            this.configs[configName] = newConfig;
            console.log(`Updated ${configName} configuration`);
            return true;
        } catch (error) {
            console.error(`Error updating ${configName} configuration:`, error);
            return false;
        }
    }
    
    // Save configuration to file
    async saveConfigToFile(configName, configData) {
        try {
            // For now, we'll use localStorage as a fallback since we can't write to files from browser
            const storageKey = `heart-config-${configName}`;
            localStorage.setItem(storageKey, JSON.stringify(configData, null, 2));
            console.log(`Saved ${configName} to localStorage`);
            return true;
        } catch (error) {
            console.error(`❌ Error saving ${configName} to file:`, error);
            return false;
        }
    }

    // Save heart state
    async saveHeartState(heartState) {
        try {
            this.configs['heart-state'] = heartState;
            // In a real application, you might want to save to localStorage or server
            console.log('💾 Heart state saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving heart state:', error);
            return false;
        }
    }

    // Get API key for a specific service
    getApiKey(service) {
        const apiKeys = this.getApiKeys();
        if (!apiKeys || !apiKeys[service]) {
            console.warn(`⚠️ No API key found for service: ${service}`);
            return null;
        }
        return apiKeys[service];
    }

    // Check if API keys are configured
    areApiKeysConfigured() {
        const apiKeys = this.getApiKeys();
        if (!apiKeys) return false;
        
        // Check if essential API keys are present and not empty
        const hasOpenAI = apiKeys.openai && 
            apiKeys.openai.apiKey && 
            apiKeys.openai.apiKey.trim() !== '' && 
            !apiKeys.openai.apiKey.includes('your-') &&
            !apiKeys.openai.apiKey.includes('_here');
            
        const hasElevenLabs = apiKeys.elevenlabs && 
            apiKeys.elevenlabs.apiKey && 
            apiKeys.elevenlabs.apiKey.trim() !== '' && 
            !apiKeys.elevenlabs.apiKey.includes('your-') &&
            !apiKeys.elevenlabs.apiKey.includes('_here');
        
        return hasOpenAI || hasElevenLabs;
    }

    // Get all configuration names
    getConfigNames() {
        return Object.keys(this.configs);
    }

    // Validate configuration
    validateConfig(configName) {
        const config = this.getConfig(configName);
        if (!config) {
            console.error(`❌ Configuration ${configName} not found`);
            return false;
        }
        
        // Add validation logic based on config type
        switch (configName) {
            case 'personality':
                return this.validatePersonalityConfig(config);
            case 'heart-state':
                return this.validateHeartStateConfig(config);
            default:
                return true;
        }
    }

    validatePersonalityConfig(config) {
        const required = ['name', 'description', 'baseTraits', 'emotions'];
        for (const field of required) {
            if (!config[field]) {
                console.error(`❌ Personality config missing required field: ${field}`);
                return false;
            }
        }
        return true;
    }


    validateHeartStateConfig(config) {
        const required = ['mood', 'affinity', 'attention'];
        for (const field of required) {
            if (!config[field]) {
                console.error(`❌ Heart state config missing required field: ${field}`);
                return false;
            }
        }
        return true;
    }
} 