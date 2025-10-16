export class VoiceManager {
    constructor(configManager) {
        this.configManager = configManager;
        this.isSpeaking = false;
        this.currentAudio = null;
        this.voiceSettings = null;
        this.animationManager = null; // Will be set by HeartSystem
    }

    async initialize() {
        console.log('🎤 Initializing Voice Manager...');
        
        // Load voice settings from personality config
        const personality = this.configManager.getConfig('personality');
        this.voiceSettings = personality.voiceSettings;
        
        console.log('🎤 Voice settings loaded:', this.voiceSettings);
        console.log('🎤 English voice ID:', this.voiceSettings?.voiceId);
        console.log('🎤 Chinese voice ID:', this.voiceSettings?.chineseVoiceId);
        console.log('🎤 Auto detect language:', this.voiceSettings?.autoDetectLanguage);
        
        console.log('✅ Voice Manager initialized!');
    }

    async speak(speechData) {
        if (this.isSpeaking) {
            console.log('🎤 Already speaking, queuing speech...');
            return;
        }
        
        this.isSpeaking = true;
        console.log('🎤 Speaking:', speechData.text);
        
        try {
            // Get voice modifiers based on emotion
            const voiceModifiers = this.getVoiceModifiers(speechData);
            
            // Generate speech using ElevenLabs
            const audioBlob = await this.generateSpeech(speechData.text, voiceModifiers);
            
            // Start animations with AI selections if available
            if (speechData.aiSelections && this.animationManager) {
                const audioDuration = await this.getAudioDuration(audioBlob);
                this.animationManager.startSpeech(audioDuration, speechData.text, speechData.aiSelections);
                console.log('Started animations with AI selections:', speechData.aiSelections);
            }
            
            // Play the audio
            await this.playAudio(audioBlob);
            
        } catch (error) {
            console.error('❌ Error in speech generation:', error);
            // Fallback to browser TTS
            this.fallbackTTS(speechData.text);
        } finally {
            this.isSpeaking = false;
        }
    }

    getVoiceModifiers(speechData) {
        // No tonality modifiers - keep voice natural
        return {
            pitch: 1.0,
            speed: 1.0,
            stability: this.voiceSettings.stability || 0.5,
            similarityBoost: this.voiceSettings.similarityBoost || 0.75
        };
    }

    async generateSpeech(text, modifiers) {
        const apiKeys = this.configManager.getApiKeys();
        
        if (!apiKeys.elevenlabs || apiKeys.elevenlabs.apiKey === 'your-elevenlabs-api-key-here') {
            throw new Error('ElevenLabs API key not configured');
        }
        
        // Detect if text contains Chinese characters
        const hasChinese = /[\u4e00-\u9fff]/.test(text);
        const voiceId = hasChinese ? this.voiceSettings.chineseVoiceId : this.voiceSettings.voiceId;
        
        console.log(`🎤 Text: "${text}"`);
        console.log(`🎤 Contains Chinese: ${hasChinese}`);
        console.log(`🎤 Using voice: ${hasChinese ? 'Chinese' : 'English'} (${voiceId})`);
        console.log(`🎤 Voice settings available:`, {
            englishVoiceId: this.voiceSettings.voiceId,
            chineseVoiceId: this.voiceSettings.chineseVoiceId,
            autoDetectLanguage: this.voiceSettings.autoDetectLanguage
        });
        
        const requestBody = {
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: modifiers.stability,
                similarity_boost: modifiers.similarityBoost,
                style: this.voiceSettings.style || 0.0,
                use_speaker_boost: this.voiceSettings.useSpeakerBoost || true
            }
        };
        
        console.log('🔍 Request details:', {
            voiceId: voiceId,
            modelId: requestBody.model_id,
            textLength: text.length,
            voiceSettings: requestBody.voice_settings
        });
        
        // Use backend TTS endpoint instead of direct ElevenLabs API
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = isLocal ? 'http://localhost:3000/api/tts' : 'https://foraos-production.up.railway.app/api/tts';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voice_id: voiceId,
                model_id: requestBody.model_id,
                voice_settings: requestBody.voice_settings
            })
        });
        
        if (!response.ok) {
            // Get detailed error message
            let errorMessage = `ElevenLabs API error: ${response.status}`;
            try {
                const errorData = await response.text();
                errorMessage += ` - ${errorData}`;
                console.error('❌ ElevenLabs API Error Details:', errorData);
            } catch (e) {
                console.error('❌ Could not parse error response');
            }
            throw new Error(errorMessage);
        }
        
        return await response.blob();
    }

    async playAudio(audioBlob) {
        return new Promise((resolve, reject) => {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            
            audio.onerror = (error) => {
                URL.revokeObjectURL(audioUrl);
                reject(error);
            };
            
            this.currentAudio = audio;
            audio.play();
        });
    }

    fallbackTTS(text) {
        console.log('🔄 Using fallback TTS for:', text);
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Apply voice settings
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Try to use a female voice
            const voices = speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            speechSynthesis.speak(utterance);
        } else {
            console.warn('⚠️ Speech synthesis not supported');
        }
    }

    setMood(mood) {
        console.log('😊 Voice mood set to:', mood);
        // This would affect future speech generation
    }

    toggleSpeaker() {
        if (this.currentAudio) {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
                console.log('🔊 Speaker enabled');
            } else {
                this.currentAudio.pause();
                console.log('🔇 Speaker disabled');
            }
        }
    }

    stopSpeaking() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        this.isSpeaking = false;
        console.log('⏹️ Speech stopped');
    }

    isCurrentlySpeaking() {
        return this.isSpeaking;
    }

    getVoiceSettings() {
        return this.voiceSettings;
    }

    // 🎯 GET AUDIO DURATION FOR ANIMATION TIMING
    async getAudioDuration(audioBlob) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(audioBlob);
            
            audio.addEventListener('loadedmetadata', () => {
                const durationMs = audio.duration * 1000;
                URL.revokeObjectURL(audio.src);
                resolve(durationMs);
            });
            
            audio.addEventListener('error', () => {
                console.warn('⚠️ Could not determine audio duration, using default');
                resolve(3000); // Default 3 seconds
            });
        });
    }
} 