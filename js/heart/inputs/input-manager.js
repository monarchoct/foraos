export class InputManager {
    constructor() {
        this.inputSources = {};
        this.isListening = false;
        this.voiceRecognition = null;
    }

    async initialize() {
        console.log('🔌 Initializing Input Manager...');
        
        // Initialize input sources
        this.inputSources = {
            chat: { enabled: true, active: false },
            voice: { enabled: false, active: false },
            twitch: { enabled: false, active: false },
            twitter: { enabled: false, active: false }
        };
        
        // Initialize voice recognition if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.initializeVoiceRecognition();
        }
        
        console.log('✅ Input Manager initialized!');
    }

    initializeVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.voiceRecognition = new SpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';
            
            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 Voice input received:', transcript);
                this.processVoiceInput(transcript);
            };
            
            this.voiceRecognition.onerror = (event) => {
                console.error('❌ Voice recognition error:', event.error);
            };
            
            this.inputSources.voice.enabled = true;
            console.log('🎤 Voice recognition initialized');
        }
    }

    processVoiceInput(transcript) {
        // Convert voice input to text and process
        console.log('🎤 Processing voice input:', transcript);
        
        // This would trigger the main input processing
        if (window.heartApp && window.heartApp.heartSystem) {
            window.heartApp.heartSystem.processUserInput(transcript);
        }
    }

    startVoiceListening() {
        if (!this.voiceRecognition || this.isListening) {
            return;
        }
        
        try {
            this.voiceRecognition.start();
            this.isListening = true;
            this.inputSources.voice.active = true;
            console.log('🎤 Started voice listening');
        } catch (error) {
            console.error('❌ Error starting voice recognition:', error);
        }
    }

    stopVoiceListening() {
        if (this.voiceRecognition && this.isListening) {
            this.voiceRecognition.stop();
            this.isListening = false;
            this.inputSources.voice.active = false;
            console.log('🎤 Stopped voice listening');
        }
    }

    toggleVoiceListening() {
        if (this.isListening) {
            this.stopVoiceListening();
        } else {
            this.startVoiceListening();
        }
    }

    // Process text input (from chat)
    processTextInput(text) {
        console.log('📝 Processing text input:', text);
        
        if (window.heartApp && window.heartApp.heartSystem) {
            window.heartApp.heartSystem.processUserInput(text);
        }
    }

    // Enable/disable input sources
    enableInputSource(source) {
        if (this.inputSources[source]) {
            this.inputSources[source].enabled = true;
            console.log(`✅ Enabled ${source} input`);
        }
    }

    disableInputSource(source) {
        if (this.inputSources[source]) {
            this.inputSources[source].enabled = false;
            this.inputSources[source].active = false;
            console.log(`❌ Disabled ${source} input`);
        }
    }

    // Get input source status
    getInputSourceStatus() {
        return this.inputSources;
    }

    // Check if voice is available
    isVoiceAvailable() {
        return this.voiceRecognition !== null;
    }

    // Check if currently listening
    isCurrentlyListening() {
        return this.isListening;
    }

    // Get input statistics
    getInputStats() {
        return {
            enabledSources: Object.values(this.inputSources).filter(s => s.enabled).length,
            activeSources: Object.values(this.inputSources).filter(s => s.active).length,
            voiceAvailable: this.isVoiceAvailable(),
            isListening: this.isListening
        };
    }
} 