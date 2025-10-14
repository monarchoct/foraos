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
            
            // Detect current input mode and set language accordingly
            this.updateLanguageForCurrentMode();
            
            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 Voice input received:', transcript);
                this.processVoiceInput(transcript);
            };
            
            this.voiceRecognition.onerror = (event) => {
                console.error('❌ Voice recognition error:', event.error);
            };
            
            this.inputSources.voice.enabled = true;
            console.log('🎤 Voice recognition initialized with language:', this.voiceRecognition.lang);
        }
    }

    updateLanguageForCurrentMode() {
        if (!this.voiceRecognition) return;
        
        // Check current active input mode
        const activeMode = this.getCurrentInputMode();
        
        if (activeMode === 'china') {
            this.voiceRecognition.lang = 'zh-CN';
            console.log('🇨🇳 Voice recognition set to Chinese (zh-CN)');
        } else {
            this.voiceRecognition.lang = 'en-US';
            console.log('🇺🇸 Voice recognition set to English (en-US)');
        }
    }

    getCurrentInputMode() {
        // Check which input mode is currently active
        const activeButton = document.querySelector('.input-mode-button.active');
        if (activeButton) {
            return activeButton.getAttribute('data-mode');
        }
        
        // Fallback: check which input container is visible
        const chatContainer = document.querySelector('.chat-input-container');
        const chinaContainer = document.querySelector('.china-input-container');
        
        if (chinaContainer && !chinaContainer.style.display.includes('none')) {
            return 'china';
        }
        
        return 'chat'; // default
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
            // Update language based on current input mode before starting
            this.updateLanguageForCurrentMode();
            
            this.voiceRecognition.start();
            this.isListening = true;
            this.inputSources.voice.active = true;
            console.log('🎤 Started voice listening in language:', this.voiceRecognition.lang);
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