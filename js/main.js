import { ConfigManager } from './utils/config-manager.js';
import { UIManager } from './ui/ui-manager.js';
import { HeartSystem } from './heart/heart.js';

class HEARTApp {
    constructor() {
        this.configManager = null;
        this.uiManager = null;
        this.heartSystem = null;
        this.isInitialized = false;
        this.isAuthenticated = false;
    }

    async initialize() {
        console.log('🚀 Initializing HEART System...');
        
        try {
            console.log('📝 Step 1: Initializing ConfigManager...');
            this.configManager = new ConfigManager();
            await this.configManager.loadConfigs();
            console.log('✅ ConfigManager initialized');
            
            console.log('📝 Step 2: Initializing UIManager...');
            this.uiManager = new UIManager();
            await this.uiManager.initialize();
            console.log('✅ UIManager initialized');
            
            console.log('📝 Step 3: Initializing HeartSystem...');
            this.heartSystem = new HeartSystem(this.configManager, this.uiManager);
            await this.heartSystem.initialize();
            console.log('✅ HeartSystem initialized');
            
            console.log('📝 Step 4: Hiding loading screen...');
            this.uiManager.hideLoadingScreen();
            console.log('✅ Loading screen hidden');
            
            this.isInitialized = true;
            console.log('✅ HEART System initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize HEART System:', error);
            console.error('❌ Error stack:', error.stack);
            
            // Try to hide loading screen even on error
            if (this.uiManager) {
                this.uiManager.hideLoadingScreen();
            }
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Global sendMessage function for English
window.sendMessage = function() {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        const message = chatInput.value.trim();
        if (message) {
            console.log('💬 Sending message:', message);
            chatInput.value = '';
            
            // Add clicked class for light ray animation
            const sendButton = document.getElementById('send-button');
            if (sendButton) {
                sendButton.classList.add('clicked');
                setTimeout(() => {
                    sendButton.classList.remove('clicked');
                }, 500); // Remove after animation completes
            }
            
            // Play send sound
            playButtonSound('send');
            
            // Trigger the message event
            window.dispatchEvent(new CustomEvent('sendMessage', {
                detail: { message }
            }));
        }
    }
};

// Global sendChineseMessage function
window.sendChineseMessage = function() {
    const chatInput = document.getElementById('china-chat-input');
    if (chatInput) {
        const message = chatInput.value.trim();
        if (message) {
            console.log('💬 Sending Chinese message:', message);
            chatInput.value = '';
            
            // Add clicked class for light ray animation
            const sendButton = document.getElementById('china-send-button');
            if (sendButton) {
                sendButton.classList.add('clicked');
                setTimeout(() => {
                    sendButton.classList.remove('clicked');
                }, 500); // Remove after animation completes
            }
            
            // Play send sound
            playButtonSound('send');
            
            // Trigger the message event
            window.dispatchEvent(new CustomEvent('sendMessage', {
                detail: { message }
            }));
        }
    }
};

// Input mode switching
window.switchInputMode = function(mode) {
    console.log('🔄 Switching input mode to:', mode);
    
    // Remove active class from all buttons
    document.querySelectorAll('.input-mode-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Add active class to clicked button
    const activeButton = document.querySelector(`[data-mode="${mode}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Hide all input interfaces
    document.querySelectorAll('.input-interface').forEach(inputInterface => {
        inputInterface.classList.remove('active');
    });
    
    // Show the appropriate input interface
    const targetInterface = document.querySelector(`.${mode}-mode`);
    if (targetInterface) {
        targetInterface.classList.add('active');
    }
    
    // Store current mode
    window.currentInputMode = mode;
};

// Sound effects
const playButtonSound = (type = 'click') => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different button types
    switch(type) {
        case 'module':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.05);
            break;
        case 'voice':
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.08);
            break;
        case 'send':
            oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.06);
            break;
        default:
            oscillator.frequency.setValueAtTime(160, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.07);
    }
    
    gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.005, audioContext.currentTime + 0.08);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
};

// Settings Module Functions
function initializeSettings() {
    console.log('Initializing settings module...');
    
    // Load saved settings
    loadSettings();
    
    // Add event listeners for settings controls
    setupSettingsEventListeners();
    
    // Add event listeners for voice controls
    setupVoiceEventListeners();
    
    // Update display values
    updateSettingsDisplay();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('heartSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        window.currentSettings = settings;
        console.log('Loaded saved settings:', settings);
    } else {
        // Default settings
        window.currentSettings = {
            background: {
                imageRotation: false
            }
        };
        console.log('Using default settings');
    }
}

// Voice recording functionality
let recognition = null;
let isRecording = false;

function detectLanguagePreference() {
    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    console.log('🌍 Browser language:', browserLang);
    
    // Check if Chinese is detected
    if (browserLang.includes('zh') || browserLang.includes('cn')) {
        return 'zh-CN';
    }
    
    // Check current UI mode for hints
    const currentMode = document.querySelector('.input-mode-button.active')?.dataset?.mode;
    if (currentMode === 'china') {
        return 'zh-CN';
    }
    
    // Default to English
    return 'en-US';
}

function initializeVoiceRecognition() {
    console.log('🔍 Checking browser support for speech recognition...');
    console.log('User agent:', navigator.userAgent);
    console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
    console.log('SpeechRecognition available:', 'SpeechRecognition' in window);
    
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        console.log('✅ Using webkitSpeechRecognition');
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
        console.log('✅ Using SpeechRecognition');
    } else {
        console.warn('⚠️ Speech recognition not supported in this browser');
        console.log('💡 Try using Chrome, Edge, or Safari for best compatibility');
        return false;
    }

    // Configure recognition
    recognition.continuous = false;
    recognition.interimResults = true;
    
    // Try to detect language preference
    const detectedLang = detectLanguagePreference();
    recognition.lang = detectedLang;
    console.log(`🌍 Setting speech recognition language to: ${detectedLang}`);

    recognition.onstart = function() {
        console.log('🎤 Voice recognition started');
        isRecording = true;
        updateVoiceUI(true);
    };

    recognition.onresult = function(event) {
        let transcript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                isFinal = true;
            }
        }
        
        updateTranscript(transcript, isFinal);
        
        if (isFinal) {
            console.log('📝 Final transcript:', transcript);
            // Send the transcript to the AI
            sendVoiceMessage(transcript);
        }
    };

    recognition.onerror = function(event) {
        console.error('❌ Speech recognition error:', event.error);
        isRecording = false;
        updateVoiceUI(false);
    };

    recognition.onend = function() {
        console.log('🎤 Voice recognition ended');
        isRecording = false;
        updateVoiceUI(false);
    };

    return true;
}

function updateVoiceUI(recording) {
    const voiceButton = document.getElementById('voice-button');
    const transcriptText = document.querySelector('.transcript-text');
    
    if (recording) {
        // The CSS class will handle the bright red styling
        voiceButton.classList.add('recording');
        const currentMode = document.querySelector('.input-mode-button.active')?.dataset?.mode;
        const lang = currentMode === 'china' ? '正在听...' : 'Listening... Speak now';
        transcriptText.textContent = lang;
    } else {
        voiceButton.classList.remove('recording');
        const currentMode = document.querySelector('.input-mode-button.active')?.dataset?.mode;
        const lang = currentMode === 'china' ? '点击麦克风开始录音...' : 'Click microphone to start recording...';
        transcriptText.textContent = lang;
    }
}

function updateTranscript(text, isFinal) {
    const transcriptText = document.querySelector('.transcript-text');
    if (isFinal) {
        transcriptText.textContent = `Final: ${text}`;
    } else {
        transcriptText.textContent = `Listening: ${text}`;
    }
}

function sendVoiceMessage(transcript) {
    // Send the transcribed text to the chat system
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.value = transcript;
        // Trigger the send button click
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
            sendButton.click();
        }
    }
}

function toggleVoiceRecognition() {
    if (!recognition) {
        if (!initializeVoiceRecognition()) {
            const browserName = navigator.userAgent.includes('OPR') ? 'Opera GX' : 
                               navigator.userAgent.includes('Chrome') ? 'Chrome' :
                               navigator.userAgent.includes('Firefox') ? 'Firefox' :
                               navigator.userAgent.includes('Safari') ? 'Safari' : 'this browser';
            
            alert(`Voice recognition not supported in ${browserName}.\n\nFor best results, try:\n• Chrome (recommended)\n• Edge\n• Safari\n\nOpera GX may have limited support for Web Speech API.`);
            return;
        }
    }

    if (isRecording) {
        recognition.stop();
    } else {
        try {
            // Update language before starting if needed
            const currentMode = document.querySelector('.input-mode-button.active')?.dataset?.mode;
            if (currentMode === 'china') {
                recognition.lang = 'zh-CN';
                console.log('🇨🇳 Switching to Chinese recognition');
            } else {
                recognition.lang = 'en-US';
                console.log('🇺🇸 Switching to English recognition');
            }
            
            recognition.start();
        } catch (error) {
            console.error('❌ Failed to start voice recognition:', error);
            alert('Failed to start voice recognition. Please check your microphone permissions and try again.');
        }
    }
}

function setupVoiceEventListeners() {
    const voiceButton = document.getElementById('voice-button');
    if (voiceButton) {
        voiceButton.addEventListener('click', toggleVoiceRecognition);
    }
}

function setupSettingsEventListeners() {
    // Background settings
    const imageRotation = document.getElementById('image-rotation');
    const backgroundUpload = document.getElementById('background-upload');
    
    // Image rotation toggle
    if (imageRotation) {
        // Set initial text based on saved setting
        if (window.currentSettings?.background?.imageRotation) {
            imageRotation.classList.add('active');
            imageRotation.textContent = 'Image Rotation ON';
        } else {
            imageRotation.classList.remove('active');
            imageRotation.textContent = 'Image Rotation OFF';
        }
        
        imageRotation.addEventListener('click', (e) => {
            const isActive = imageRotation.classList.contains('active');
            
            if (isActive) {
                imageRotation.classList.remove('active');
                imageRotation.textContent = 'Image Rotation OFF';
                window.currentSettings.background.imageRotation = false;
                // Stop automatic background changes
                if (window.heartSystem?.backgroundManager) {
                    window.heartSystem.backgroundManager.stopAutoBackgroundChanges();
                }
            } else {
                imageRotation.classList.add('active');
                imageRotation.textContent = 'Image Rotation ON';
                window.currentSettings.background.imageRotation = true;
                // Start automatic background changes
                if (window.heartSystem?.backgroundManager) {
                    window.heartSystem.backgroundManager.startAutoBackgroundChanges();
                }
            }
            
            // Add clicked class for light ray animation
            imageRotation.classList.add('clicked');
            setTimeout(() => {
                imageRotation.classList.remove('clicked');
            }, 500);
            
            saveSettingsToStorage();
        });
    }
    
    // Background image upload
    if (backgroundUpload) {
        backgroundUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleBackgroundUpload(file);
            }
        });
    }
    
    // Background darkness slider
    const darknessSlider = document.getElementById('background-darkness');
    const darknessValue = document.getElementById('darkness-value');
    if (darknessSlider && darknessValue) {
        darknessSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            darknessValue.textContent = value + '%';
            applyBackgroundDarkness(value / 100);
        });
    }
}

function updateSettingsDisplay() {
    // Set values from current settings
    const settings = window.currentSettings;
    
    // Update image rotation toggle state
    const imageRotation = document.getElementById('image-rotation');
    if (imageRotation && settings.background) {
        if (settings.background.imageRotation) {
            imageRotation.classList.add('active');
            imageRotation.textContent = 'Image Rotation ON';
        } else {
            imageRotation.classList.remove('active');
            imageRotation.textContent = 'Image Rotation OFF';
        }
    }
}

function updateSettingValue(elementId, value) {
    const valueElement = document.querySelector(`#${elementId} + .setting-value`);
    if (valueElement) {
        valueElement.textContent = value;
    }
}

function applyIdleAnimation(animationName) {
    if (window.heartSystem?.animationManager) {
        // Update the JSON config
        window.heartSystem.animationManager.animationConfig.animations.idle.animation = animationName;
        // Restart idle animation
        window.heartSystem.animationManager.startIdleAnimation();
        console.log('Applied idle animation:', animationName);
    }
}

function applyAnimationSpeed(speed) {
    if (window.heartSystem?.renderer?.activeAction) {
        window.heartSystem.renderer.activeAction.setEffectiveTimeScale(speed);
        console.log('Applied animation speed:', speed);
    }
}

function applyBlinkFrequency(frequency) {
    if (window.heartSystem?.animationManager) {
        window.heartSystem.animationManager.blinkState.blinkDuration = frequency;
        console.log('Applied blink frequency:', frequency + 'ms');
    }
}

function applyModelScale(scale) {
    if (window.heartSystem?.renderer?.character) {
        window.heartSystem.renderer.character.scale.set(scale, scale, scale);
        console.log('Applied model scale:', scale);
    }
}

function applyBackgroundColor(color) {
    if (window.heartSystem?.renderer?.scene) {
        window.heartSystem.renderer.scene.background.setHex(color.replace('#', '0x'));
        console.log('Applied background color:', color);
    }
}

function applyLightIntensity(intensity) {
    if (window.heartSystem?.renderer?.scene) {
        const lights = window.heartSystem.renderer.scene.children.filter(child => child.isLight);
        lights.forEach(light => {
            if (light.intensity !== undefined) {
                light.intensity = intensity;
            }
        });
        console.log('Applied light intensity:', intensity);
    }
}

function applyBackgroundDarkness(opacity) {
    if (window.heartSystem?.renderer?.scene && window.THREE) {
        console.log('🎛️ Applying background darkness:', opacity);
        
        // Find existing dark overlay if it exists
        const existingOverlay = window.heartSystem.renderer.scene.children.find(child => 
            child.isMesh && child.position && child.position.z === -5 && 
            child.material && child.material.transparent === true
        );
        
        if (existingOverlay) {
            if (opacity > 0) {
                // Update existing overlay opacity instead of removing/adding
                console.log('🔄 Updating existing overlay opacity to:', opacity);
                existingOverlay.material.opacity = opacity;
                existingOverlay.material.needsUpdate = true;
                console.log('✅ Overlay opacity updated');
                return;
            } else {
                // Remove overlay if opacity is 0
                console.log('🗑️ Removing existing overlay (opacity = 0)');
                window.heartSystem.renderer.scene.remove(existingOverlay);
                console.log('✅ Overlay removed');
        return;
            }
        }
        
        // Add new overlay if opacity > 0
        if (opacity > 0) {
            console.log('➕ Adding new overlay with opacity:', opacity);
            
            try {
                // Create geometry and material
                const overlayGeometry = new window.THREE.PlaneGeometry(20, 20);
                const overlayMaterial = new window.THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: opacity
                });
                
                // Create mesh
                const darkOverlay = new window.THREE.Mesh(overlayGeometry, overlayMaterial);
                
                // Set position
                darkOverlay.position.set(0, 0, -5);
                
                // Ensure userData exists
                if (!darkOverlay.userData) {
                    darkOverlay.userData = {};
                }
                darkOverlay.userData.isDarknessOverlay = true;
                
                // Verify the mesh is valid before adding
                console.log('🔍 Mesh created:', darkOverlay);
                console.log('🔍 Mesh isMesh:', darkOverlay.isMesh);
                console.log('🔍 Mesh type:', darkOverlay.type);
                
                // Add to scene
                window.heartSystem.renderer.scene.add(darkOverlay);
                console.log('✅ Overlay added to scene');
                
            } catch (error) {
                console.error('❌ Error creating overlay:', error);
            }
        } else {
            console.log('🚫 No overlay needed (opacity = 0)');
        }
        
        console.log('✅ Applied background darkness:', (opacity * 100) + '%');
    } else {
        console.error('❌ Renderer, scene, or THREE not available');
        console.error('Renderer:', window.heartSystem?.renderer);
        console.error('Scene:', window.heartSystem?.renderer?.scene);
        console.error('THREE:', window.THREE);
    }
}

function saveSettingsToStorage() {
    localStorage.setItem('heartSettings', JSON.stringify(window.currentSettings));
    console.log('Settings auto-saved');
}

async function handleBackgroundUpload(file) {
    console.log('📁 Processing background upload:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type. Please select an image file.');
        return;
    }
    
    // Check file size (warn but allow large files)
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 50) {
        console.warn('⚠️ Large file detected (' + fileSizeMB.toFixed(2) + 'MB). This may take a moment...');
    }
    
    try {
        // Use the background manager's addImageBackground method
        if (window.heartSystem?.backgroundManager) {
            // Generate a unique key for this uploaded background
            const backgroundKey = `uploaded_${Date.now()}`;
            const backgroundName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
            
            console.log('🔄 Adding uploaded background to background manager...');
            
            // Create a data URL for the image
            const imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            // Create an image element and load it
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log('🖼️ Image loaded, dimensions:', img.width, 'x', img.height);
                    resolve();
                };
                img.onerror = reject;
                img.src = imageData;
            });
            
            // Add the background to the background manager
            await window.heartSystem.backgroundManager.addImageBackground(
                backgroundKey, 
                imageData, // Use data URL as the path
                backgroundName
            );
            
            // Set this as the current background with smooth transition
            window.heartSystem.backgroundManager.setBackground(backgroundKey, 1500);
            
            console.log('✅ Uploaded background applied successfully via background manager');
            console.log('🎨 Background key:', backgroundKey);
            
            // Reapply current darkness setting if slider exists
            const darknessSlider = document.getElementById('background-darkness');
            if (darknessSlider) {
                const currentOpacity = darknessSlider.value / 100;
                console.log('🔄 Reapplying darkness:', currentOpacity);
                applyBackgroundDarkness(currentOpacity);
            }
            
        } else {
            console.warn('⚠️ Background manager not available, falling back to direct application');
            
            // Fallback to direct texture application
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                const img = new Image();
                img.onload = function() {
                    const loader = new window.THREE.TextureLoader();
                    const texture = loader.load(imageData + '?v=' + Date.now(), function(loadedTexture) {
                        if (window.heartSystem?.renderer) {
                            window.heartSystem.renderer.scene.background = loadedTexture;
                            console.log('✅ Background applied via fallback method');
                        }
                    });
                };
                img.src = imageData;
            };
            reader.readAsDataURL(file);
        }
        
    } catch (error) {
        console.error('❌ Failed to process uploaded background:', error);
    }
}

// Test function for darkness slider
window.testDarkness = (value = 50) => {
    console.log('🧪 Testing darkness slider with value:', value);
    const slider = document.getElementById('background-darkness');
    const valueDisplay = document.getElementById('darkness-value');
    
    if (slider && valueDisplay) {
        slider.value = value;
        valueDisplay.textContent = value + '%';
        applyBackgroundDarkness(value / 100);
        console.log('✅ Darkness test applied:', value + '%');
    } else {
        console.error('❌ Darkness slider elements not found');
    }
};

// Force action animation command with smooth crossfading
window.forceAction = (actionName = 'Quick Nod') => {
    console.log('🎬 FORCE ACTION:', actionName);
    
    if (window.heartSystem?.renderer?.actions) {
        const actions = window.heartSystem.renderer.actions;
        console.log('📋 Available actions:', Object.keys(actions));
        
        if (actions[actionName]) {
            const action = actions[actionName];
            console.log('▶️ Playing action with crossfade:', actionName);
            
            // Set up action animation
            action.reset();
            action.setLoop(window.THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.setEffectiveTimeScale(0.3); // 30% slower speed
            action.setEffectiveWeight(0); // Start at 0 weight
            action.enabled = true;
            action.play();
            
            // Smooth crossfade from idle to action (2.5 seconds with easing)
            const crossfadeDuration = 2500; // 2.5 seconds - slower crossfade
            let startTime = Date.now();
            
            const crossfadeToAction = () => {
                const elapsed = Date.now() - startTime;
                const rawProgress = Math.min(elapsed / crossfadeDuration, 1);
                
                // Apply easing: ease-in-out for natural feel
                const progress = rawProgress < 0.5 
                    ? 2 * rawProgress * rawProgress  // Ease in (accelerate)
                    : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2; // Ease out (decelerate)
                
                if (rawProgress < 1) {
                    // Fade out idle, fade in action (no speed changes)
                    if (window.heartSystem.renderer.activeIdleAction) {
                        const idleWeight = 1 - progress;
                        window.heartSystem.renderer.activeIdleAction.setEffectiveWeight(idleWeight);
                    }
                    
                    action.setEffectiveWeight(progress);
                    
                    requestAnimationFrame(crossfadeToAction);
    } else {
                    // Crossfade complete
                    if (window.heartSystem.renderer.activeIdleAction) {
                        window.heartSystem.renderer.activeIdleAction.setEffectiveWeight(0);
                    }
                    action.setEffectiveWeight(1);
                    console.log('✅ Crossfade to action complete');
                }
            };
            
            crossfadeToAction();
            
            // Set up to crossfade back to idle when action finishes
            action.getMixer().addEventListener('finished', (event) => {
                if (event.action === action) {
                    console.log('🔄 Action finished, crossfading back to idle');
                    forceCrossfadeBackToIdle(action);
                }
            });
            
            console.log('✅ Action animation started with crossfade:', actionName);
    } else {
            console.error('❌ Action not found:', actionName);
            console.log('Available actions:', Object.keys(actions));
        }
    } else {
        console.error('❌ Renderer or actions not available');
    }
};

// Helper function for crossfading back to idle
function forceCrossfadeBackToIdle(actionAnimation) {
    if (!window.heartSystem.renderer.activeIdleAction) {
        console.log('⚠️ No idle action to crossfade back to');
        return;
    }
    
    const idleAction = window.heartSystem.renderer.activeIdleAction;
    const crossfadeDuration = 2500; // 2.5 seconds - slower crossfade
    let startTime = Date.now();
    
    // Ensure idle is ready
    idleAction.reset();
    idleAction.play();
    idleAction.setEffectiveWeight(0);
    idleAction.enabled = true;
    
    const crossfadeToIdle = () => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(elapsed / crossfadeDuration, 1);
        
        // Apply easing: ease-in-out for natural feel
        const progress = rawProgress < 0.5 
            ? 2 * rawProgress * rawProgress  // Ease in (accelerate)
            : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2; // Ease out (decelerate)
        
        if (rawProgress < 1) {
            // Fade out action, fade in idle (no speed changes)
            const actionWeight = 1 - progress;
            actionAnimation.setEffectiveWeight(actionWeight);
            
            idleAction.setEffectiveWeight(progress);
            
            requestAnimationFrame(crossfadeToIdle);
            } else {
            // Crossfade complete
            actionAnimation.setEffectiveWeight(0);
            idleAction.setEffectiveWeight(1);
            console.log('✅ Crossfade back to idle complete');
        }
    };
    
    crossfadeToIdle();
}

function toggleFullscreenMode() {
    const appElement = document.getElementById('app');
    const isFullscreen = appElement.classList.contains('fullscreen-mode');
    
    if (isFullscreen) {
        // Exit fullscreen mode
        appElement.classList.remove('fullscreen-mode');
        console.log('🖥️ Exited fullscreen mode');
    } else {
        // Enter fullscreen mode
        appElement.classList.add('fullscreen-mode');
        console.log('🖥️ Entered fullscreen mode - UI hidden');
    }
}

// App will be initialized in DOMContentLoaded listener

// Module Integration Functions
window.initializeModuleIntegrations = function() {
    console.log('🔗 Initializing module integrations...');
    
    
    // Initialize Vision module controls
    initializeVisionModule();
    
    // Update status periodically
    setInterval(updateModuleStatuses, 5000);
};


function initializeVisionModule() {
    const startBtn = document.getElementById('vision-start-btn');
    const analyzeBtn = document.getElementById('vision-analyze-btn');
    const memoryBtn = document.getElementById('memory-panel-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            const heartSystem = window.heartSystem;
            if (!heartSystem) return;
            
            try {
                if (startBtn.textContent === 'Start Vision') {
                    await heartSystem.startScreenCapture();
                    updateVisionStatus('active', 'Active');
                    startBtn.textContent = 'Stop Vision';
                    startBtn.classList.remove('primary');
                    startBtn.classList.add('secondary');
                    analyzeBtn.disabled = false;
                } else {
                    await heartSystem.stopScreenCapture();
                    updateVisionStatus('inactive', 'Inactive');
                    startBtn.textContent = 'Start Vision';
                    startBtn.classList.remove('secondary');
                    startBtn.classList.add('primary');
                    analyzeBtn.disabled = true;
                }
                
            } catch (error) {
                console.error('❌ Vision system error:', error);
            }
        });
    }
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const heartSystem = window.heartSystem;
            if (!heartSystem) return;
            
            try {
                analyzeBtn.disabled = true;
                analyzeBtn.textContent = 'Analyzing...';
                
                const analysis = await heartSystem.analyzeCurrentScreen();
                
                if (analysis) {
                    console.log('🔍 Screen analysis:', analysis);
                    // Could show a notification or update UI with results
                }
                
                analyzeBtn.textContent = 'Analyze Screen';
                analyzeBtn.disabled = false;
                
            } catch (error) {
                console.error('❌ Screen analysis failed:', error);
                analyzeBtn.textContent = 'Analyze Screen';
                analyzeBtn.disabled = false;
            }
        });
    }
    
    if (memoryBtn) {
        memoryBtn.addEventListener('click', () => {
            // Initialize Memory panel if not already done
            if (!window.memoryPanel && window.heartSystem) {
                import('./ui/memory-panel.js').then(module => {
                    window.memoryPanel = new module.MemoryPanel(window.heartSystem);
                    window.memoryPanel.showPanel();
                });
            } else if (window.memoryPanel) {
                window.memoryPanel.showPanel();
            }
        });
    }
}


function updateModuleStatuses() {
    const heartSystem = window.heartSystem;
    if (!heartSystem) return;
    
    // Update Vision status
    const visionActive = heartSystem.screenCaptureVision?.isCapturing;
    if (visionActive) {
        updateVisionStatus('active', 'Active');
    } else {
        updateVisionStatus('inactive', 'Inactive');
    }
}

function updateVisionStatus(status, text) {
    const statusElement = document.querySelector('.vision-status');
    const statusText = document.querySelector('.vision-status-text');
    
    if (statusElement && statusText) {
        statusElement.className = `vision-status ${status}`;
        statusText.textContent = text;
    }
}

// Make heartSystem globally accessible for the capture button
window.heartSystem = null;
// Module integrations setup (moved to after app initialization)
window.initializeModuleIntegrations = () => {
    console.log('🔗 Setting up module integrations...');
    
    // Initialize pump.fun module
    initializePumpFunModule();
    
    // Retry animation manager initialization if needed
    if (window.heartSystem?.renderer?.retryAnimationManagerInit) {
        window.heartSystem.renderer.retryAnimationManagerInit();
    }
    
    // Add click handlers for input mode buttons
    document.querySelectorAll('.input-mode-button').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.getAttribute('data-mode');
                window.switchInputMode(mode);
                
                // Add clicked class for light ray animation
                button.classList.add('clicked');
                setTimeout(() => {
                    button.classList.remove('clicked');
                }, 500); // Remove after animation completes
                
                // Play module sound
                playButtonSound('module');
            });
        });
        
        // Add click handlers for voice button
        const voiceButton = document.getElementById('voice-button');
        const transcriptText = document.querySelector('.transcript-text');
        if (voiceButton) {
            let isRecording = false;
            voiceButton.addEventListener('click', () => {
                isRecording = !isRecording;
                
                if (isRecording) {
                    // Start recording - turn white background
                    voiceButton.style.background = 'rgba(255, 255, 255, 0.9)';
                    voiceButton.style.transform = 'scale(1.1)';
                    // Change icon to black
                    const micIcon = voiceButton.querySelector('.voice-icon');
                    if (micIcon) {
                        micIcon.style.filter = 'brightness(0)'; // Makes it black
                    }
                    // Update transcript
                    if (transcriptText) {
                        transcriptText.textContent = 'Recording... Speak now';
                        transcriptText.style.opacity = '1';
                    }
                } else {
                    // Stop recording - return to normal
                    voiceButton.style.background = 'rgba(255, 255, 255, 0.1)';
                    voiceButton.style.transform = 'scale(1)';
                    // Change icon back to white
                    const micIcon = voiceButton.querySelector('.voice-icon');
                    if (micIcon) {
                        micIcon.style.filter = 'brightness(0) invert(1)'; // Makes it white
                    }
                    // Update transcript
                    if (transcriptText) {
                        transcriptText.textContent = 'Click microphone to start recording...';
                        transcriptText.style.opacity = '0.7';
                    }
                }
                
                // Add clicked class for white light ray animation
                voiceButton.classList.add('clicked');
                setTimeout(() => {
                    voiceButton.classList.remove('clicked');
                }, 500);
                
                // Play voice sound
                playButtonSound('voice');
            });
        }
        
        // Add Enter key handler for chat input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    const message = chatInput.value.trim();
                    if (message) {
                        console.log('💬 Sending message:', message);
                        chatInput.value = '';
                        
                        // Play send sound
                        playButtonSound('send');
                        
                        // Trigger the message event
                        window.dispatchEvent(new CustomEvent('sendMessage', {
                            detail: { message }
                        }));
                    }
                }
            });
        }
        
        // Settings Module Functionality
        initializeSettings();
        
        // Pump.fun Module Functionality
        initializePumpFunModule();
        
        // Add click handlers for refresh buttons
        const refreshTwitch = document.getElementById('refresh-twitch');
        if (refreshTwitch) {
            refreshTwitch.addEventListener('click', () => {
                refreshTwitch.classList.add('clicked');
                setTimeout(() => {
                    refreshTwitch.classList.remove('clicked');
                }, 500);
                
                // Play default sound
                playButtonSound('click');
            });
        }

        // Add ESC key handler for fullscreen mode
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                toggleFullscreenMode();
            }
        });
};

// Pump.fun Module Functions
function initializePumpFunModule() {
    console.log('🪙 Initializing pump.fun module...');
    
    const startBtn = document.getElementById('pumpfun-start-btn');
    const stopBtn = document.getElementById('pumpfun-stop-btn');
    const statusBtn = document.getElementById('pumpfun-status-btn');
    const browserBtn = document.getElementById('pumpfun-browser-btn');
    const urlInput = document.getElementById('pumpfun-url');
    const statusIndicator = document.querySelector('.pumpfun-status-indicator');
    const messagesCount = document.getElementById('pumpfun-messages');
    const responsesCount = document.getElementById('pumpfun-responses');
    
    if (startBtn) {
        startBtn.addEventListener('click', async (e) => {
            e.target.classList.add('clicked');
            setTimeout(() => e.target.classList.remove('clicked'), 500);
            
            const coinUrl = urlInput.value.trim();
            if (!coinUrl) {
                alert('Please enter a pump.fun coin URL');
                return;
            }
            
            // Validate URL format
            if (!coinUrl.includes('pump.fun/coin/')) {
                alert('Please enter a valid pump.fun coin URL (e.g., https://pump.fun/coin/...)');
                return;
            }
            
            if (!window.heartSystem) {
                alert('AI system not ready. Please wait for initialization to complete.');
                return;
            }
            
            try {
                startBtn.disabled = true;
                startBtn.textContent = 'Starting...';
                
                const success = await window.heartSystem.startPumpFunMonitoring(coinUrl, {
                    pollInterval: 5000 // Check every 5 seconds
                });
                
                if (success) {
                    updatePumpFunStatus(true);
                    startBtn.textContent = 'Start Monitor';
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                    
                    console.log('✅ Pump.fun monitoring started successfully');
                } else {
                    startBtn.textContent = 'Start Monitor';
                    startBtn.disabled = false;
                    alert('Failed to start pump.fun monitoring. Check console for details.');
                }
                
            } catch (error) {
                console.error('❌ Error starting pump.fun monitoring:', error);
                startBtn.textContent = 'Start Monitor';
                startBtn.disabled = false;
                alert('Error starting monitoring: ' + error.message);
            }
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', async (e) => {
            e.target.classList.add('clicked');
            setTimeout(() => e.target.classList.remove('clicked'), 500);
            
            if (!window.heartSystem) return;
            
            try {
                stopBtn.disabled = true;
                stopBtn.textContent = 'Stopping...';
                
                const success = await window.heartSystem.stopPumpFunMonitoring();
                
                if (success) {
                    updatePumpFunStatus(false);
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                    stopBtn.textContent = 'Stop';
                    
                    console.log('⏹️ Pump.fun monitoring stopped');
                }
                
            } catch (error) {
                console.error('❌ Error stopping pump.fun monitoring:', error);
                stopBtn.textContent = 'Stop';
                stopBtn.disabled = false;
            }
        });
    }
    
    if (statusBtn) {
        statusBtn.addEventListener('click', (e) => {
            e.target.classList.add('clicked');
            setTimeout(() => e.target.classList.remove('clicked'), 500);
            
            if (!window.heartSystem) {
                alert('AI system not ready');
                return;
            }
            
            const status = window.heartSystem.getPumpFunStatus();
            
            let message = 'Pump.fun Monitor Status:\n\n';
            
            if (status.available) {
                message += `Monitoring: ${status.isMonitoring ? '✅ Active' : '❌ Inactive'}\n`;
                if (status.currentCoinUrl) {
                    message += `Coin URL: ${status.currentCoinUrl}\n`;
                }
                if (status.stats) {
                    message += `Messages Processed: ${status.stats.messagesProcessed}\n`;
                    message += `Responses Generated: ${status.stats.responsesGenerated}\n`;
                    if (status.stats.uptime) {
                        message += `Uptime: ${Math.round(status.stats.uptime / 1000)}s\n`;
                    }
                }
            } else {
                message += 'Monitor not available\n';
                if (status.error) {
                    message += `Error: ${status.error}`;
                }
            }
            
            alert(message);
            
            // Update UI stats
            updatePumpFunStats(status.stats || {});
        });
    }
    
    if (browserBtn) {
        browserBtn.addEventListener('click', async (e) => {
            e.target.classList.add('clicked');
            setTimeout(() => e.target.classList.remove('clicked'), 500);
            
            try {
                const coinUrl = urlInput?.value || 'https://pump.fun/coin/V5cCiSixPLAiEDX2zZquT5VuLm4prr5t35PWmjNpump';
                
                browserBtn.disabled = true;
                browserBtn.textContent = '🌐 Opening...';
                
                // Check if we're in Electron or web environment
                const isElectron = typeof window.electronAPI !== 'undefined' || typeof window.require !== 'undefined';
                
                if (isElectron && typeof window.electronAPI !== 'undefined') {
                    // Electron: Use IPC to create controlled browser window
                    const result = await window.electronAPI.invoke('create-pump-fun-window', coinUrl);
                    if (result.success) {
                        console.log('✅ Pump.fun browser window opened in Electron');
                        alert('✅ Browser window opened! You can now log in to pump.fun and view the chat.');
                    } else {
                        throw new Error(result.error || 'Failed to open browser window');
                    }
                } else {
                    // Web: Open in new tab/window
                    const newWindow = window.open(coinUrl, 'pumpfun-monitor', 
                        'width=1400,height=900,scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no');
                    
                    if (newWindow) {
                        console.log('🌐 Opened pump.fun in new window/tab');
                        alert('🌐 Opened pump.fun in new window! Please log in to see the chat.\n\n' +
                              '💡 Tip: You can manually copy chat messages from that window to interact with the AI.');
                        
                        // Store reference for potential future use
                        window.pumpFunWindow = newWindow;
                    } else {
                        throw new Error('Popup blocked or failed to open window');
                    }
                }
                
            } catch (error) {
                console.error('❌ Error opening browser window:', error);
                alert('Error opening browser window: ' + error.message);
            } finally {
                browserBtn.disabled = false;
                browserBtn.textContent = '🌐 Browser';
            }
        });
    }
    
    // Manual message input for web version
    const manualMessageInput = document.getElementById('manual-message-input');
    const submitManualMessageBtn = document.getElementById('submit-manual-message');
    
    if (manualMessageInput && submitManualMessageBtn) {
        const submitManualMessage = async () => {
            const messageText = manualMessageInput.value.trim();
            if (!messageText) return;
            
            try {
                // Parse message format: "username: message" or just "message"
                let username = 'Anonymous';
                let text = messageText;
                
                const colonIndex = messageText.indexOf(':');
                if (colonIndex > 0 && colonIndex < 20) { // Reasonable username length
                    username = messageText.substring(0, colonIndex).trim();
                    text = messageText.substring(colonIndex + 1).trim();
                }
                
                // Create message object
                const message = {
                    id: `manual-${Date.now()}`,
                    username: username,
                    text: text,
                    timestamp: Date.now(),
                    source: 'manual-input'
                };
                
                console.log('💬 Manual message submitted:', message);
                
                // Send to AI system if available
                if (window.heartSystem && window.heartSystem.handlePumpFunMessage) {
                    await window.heartSystem.handlePumpFunMessage(message);
                    
                    // Update stats
                    const messagesCount = document.getElementById('pumpfun-messages');
                    if (messagesCount) {
                        const currentCount = parseInt(messagesCount.textContent) || 0;
                        messagesCount.textContent = currentCount + 1;
                    }
                    
                    // Clear input
                    manualMessageInput.value = '';
                    
                    // Visual feedback
                    submitManualMessageBtn.textContent = '✅ Sent!';
                    setTimeout(() => {
                        submitManualMessageBtn.textContent = 'Send';
                    }, 2000);
                } else {
                    throw new Error('AI system not ready');
                }
                
            } catch (error) {
                console.error('❌ Error submitting manual message:', error);
                alert('Error: ' + error.message);
            }
        };
        
        // Submit on button click
        submitManualMessageBtn.addEventListener('click', submitManualMessage);
        
        // Submit on Enter key
        manualMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitManualMessage();
            }
        });
    }
    
    // Update status periodically
    setInterval(() => {
        if (window.heartSystem) {
            const status = window.heartSystem.getPumpFunStatus();
            updatePumpFunStats(status.stats || {});
        }
    }, 2000);
}

function updatePumpFunStatus(isActive) {
    const statusIndicator = document.querySelector('.pumpfun-status-indicator');
    if (statusIndicator) {
        if (isActive) {
            statusIndicator.classList.remove('inactive');
            statusIndicator.classList.add('active');
        } else {
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('inactive');
        }
    }
}

function updatePumpFunStats(stats) {
    const messagesCount = document.getElementById('pumpfun-messages');
    const responsesCount = document.getElementById('pumpfun-responses');
    
    if (messagesCount) {
        messagesCount.textContent = stats.messagesProcessed || 0;
    }
    
    if (responsesCount) {
        responsesCount.textContent = stats.responsesGenerated || 0;
    }
}

// Global pump.fun functions for console access
window.startPumpFunMonitor = async (coinUrl) => {
    if (window.heartSystem) {
        return await window.heartSystem.startPumpFunMonitoring(coinUrl || 'https://pump.fun/coin/V5cCiSixPLAiEDX2zZquT5VuLm4prr5t35PWmjNpump');
    }
    console.warn('⚠️ HEART System not available');
    return false;
};

window.stopPumpFunMonitor = async () => {
    if (window.heartSystem) {
        return await window.heartSystem.stopPumpFunMonitoring();
    }
    console.warn('⚠️ HEART System not available');
    return false;
};

window.getPumpFunStatus = () => {
    if (window.heartSystem) {
        return window.heartSystem.getPumpFunStatus();
    }
    console.warn('⚠️ HEART System not available');
    return null;
};

// Initialize the HEART App when the page loads
let app;
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌐 DOM loaded, starting HEART App...');
    
    try {
        app = new HEARTApp();
        await app.initialize();
        
        // Make the app and heart system globally available
        window.app = app;
        window.heartSystem = app.heartSystem;
        
        // Initialize module integrations
        window.initializeModuleIntegrations();
        
        // Add event listeners for send buttons
        const sendButton = document.getElementById('send-button');
        if (sendButton) {
            sendButton.addEventListener('click', window.sendMessage);
        }
        
        const chinaSendButton = document.getElementById('china-send-button');
        if (chinaSendButton) {
            chinaSendButton.addEventListener('click', window.sendChineseMessage);
        }
        
        // Add Enter key support for both inputs
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    window.sendMessage();
                }
            });
        }
        
        const chinaChatInput = document.getElementById('china-chat-input');
        if (chinaChatInput) {
            chinaChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    window.sendChineseMessage();
                }
            });
        }
        
        console.log('✅ HEART App started successfully!');
    } catch (error) {
        console.error('❌ Failed to start HEART App:', error);
        
        // Hide loading screen even on error
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
});

// Chat History Management
function addChatMessage(message, isUser = false) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'ai'}`;
    
    const messageText = document.createElement('div');
    // Filter out emojis and special characters, keep only text
    const filteredMessage = message.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    messageText.textContent = filteredMessage;
    messageDiv.appendChild(messageText);
    
    // Don't add timestamp since it's hidden anyway
    
    chatHistory.appendChild(messageDiv);
    
    // Auto-scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // Limit to 10 messages to prevent memory issues
    const messages = chatHistory.querySelectorAll('.chat-message');
    if (messages.length > 10) {
        messages[0].remove();
    }
}

function clearChatHistory() {
    const chatHistory = document.getElementById('chat-history');
    if (chatHistory) {
        chatHistory.innerHTML = '';
    }
}

// Make functions globally available
window.addChatMessage = addChatMessage;
window.clearChatHistory = clearChatHistory; 