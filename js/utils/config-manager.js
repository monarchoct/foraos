export class ConfigManager {
    constructor() {
        this.configs = {};
        this.configPaths = {
            'personality': 'config/personality.json',
            'api-keys': 'config/api-keys.json',
            'heart-state': 'config/heart-state.json',
            'memory': 'config/memory.json'
        };
    }

    async loadConfigs() {
        console.log('Loading configurations...');
        
        try {
            const promises = Object.entries(this.configPaths).map(async ([key, path]) => {
                const config = await this.loadConfig(path);
                this.configs[key] = config;
                console.log(`✅ Loaded ${key} configuration`);
            });
            
            await Promise.all(promises);
            console.log('✅ All configurations loaded successfully!');
            
        } catch (error) {
            console.error('❌ Error loading configurations:', error);
            throw error;
        }
    }

    async loadConfig(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`❌ Error loading config from ${path}:`, error);
            throw error;
        }
    }

    getConfig(configName) {
        return this.configs[configName] || null;
    }

    getPersonality() {
        return this.configs['personality'];
    }

    getApiKeys() {
        return this.configs['api-keys'];
    }

    getHeartState() {
        return this.configs['heart-state'];
    }

    // Update a specific configuration
    async updateConfig(configName, newConfig) {
        try {
            this.configs[configName] = newConfig;
            console.log(`✅ Updated ${configName} configuration`);
            return true;
        } catch (error) {
            console.error(`❌ Error updating ${configName} configuration:`, error);
            return false;
        }
    }
    
    // Save configuration to file
    async saveConfigToFile(configName, configData) {
        try {
            // For now, we'll use localStorage as a fallback since we can't write to files from browser
            const storageKey = `heart-config-${configName}`;
            localStorage.setItem(storageKey, JSON.stringify(configData, null, 2));
            console.log(`💾 Saved ${configName} to localStorage (${storageKey})`);
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
        
        // Check if essential API keys are present
        const hasOpenAI = apiKeys.openai && apiKeys.openai.apiKey !== 'your-openai-api-key-here';
        const hasElevenLabs = apiKeys.elevenlabs && apiKeys.elevenlabs.apiKey !== 'your-elevenlabs-api-key-here';
        
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
            case 'api-keys':
                return this.validateApiKeysConfig(config);
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

    validateApiKeysConfig(config) {
        // API keys are optional for basic functionality
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