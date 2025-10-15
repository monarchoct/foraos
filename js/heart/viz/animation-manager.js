// THREE.js is loaded globally via CDN in index.html
const THREE = window.THREE;

export class AnimationManager {
    constructor(configManager = null) {
        // Core components
        this.character = null;
        this.animationMixer = null;
        this.configManager = configManager;
        
        // Animation state
        this.currentAnimation = null;
        this.isAnimating = false;
        
        // Idle rotation system (loop-based)
        this.idleRotation = {
            enabled: false,
            currentLoops: 0,
            targetLoops: 0,
            lastAnimationTime: 0
        };
        
        // Configuration from JSON
        this.animationConfig = null;
        this.availableAnimations = [];
        this.availableShapekeys = {};
        this.animationMapping = {};
        
        // AI selection arrays (populated from JSON config)
        this.aiSelectionArrays = {
            actions: [],
            mouthMovement: [],
            emotions: []
        };
        
        // Blinking system
        this.blinkState = {
            isBlinking: false,
            lastBlinkTime: 0,
            blinkInterval: 0,
            blinkDuration: 0
        };
        
        // Random smile system
        this.smileState = {
            isSmiling: false,
            lastSmileTime: 0,
            smileInterval: 0,
            smileDuration: 2000
        };
        
        // Idle mouth movement system (subtle random movements when not speaking)
        this.idleMouthState = {
            isMoving: false,
            lastMovementTime: 0,
            movementInterval: 0,
            movementDuration: 0,
            cycleTime: 0,
            cycleDuration: 0.8, // Slower and more subtle than speech
            currentValue: 0,
            currentShapekey: null
        };
        
        // Speech state
        this.speechState = {
            isSpeaking: false,
            speechStartTime: 0,
            speechDuration: 0,
            currentAction: null,
            currentMouthMovement: null,
            currentEmotion: null,
            mouthMovementCycle: {
                isActive: false,
                cycleTime: 0,
                cycleDuration: 0.3, // 300ms per cycle (0 to 1 to 0) - even slower and smoother
                currentValue: 0
            },
            emotionCycle: {
                isActive: false,
                cycleTime: 0,
                cycleDuration: 0.3, // 300ms per cycle (0 to 1 to 0) - same as mouth movement
                currentValue: 0
            }
        };
        
        // Animation behaviors
        this.behaviors = {
            idle: {
                fadeIn: 1.2,
                fadeOut: 1.2
            },
            actions: {
                fadeIn: 0.8,
                fadeOut: 0.8
            },
            mouthMovement: {
                fadeIn: 0.2,
                fadeOut: 0.2
            },
            emotions: {
                fadeIn: 1.0,
                fadeOut: 1.0
            }
        };
    }

    async initialize(character, animationMixer) {
        console.log('Initializing Animation Manager...');
        
        // Set core components
        this.character = character;
        this.animationMixer = animationMixer;
        
        // Load JSON configuration first
        await this.loadAnimationConfig();
        
        // Initialize eye baseline after config is loaded
        this.initializeEyeBaseline();
        
        // Read available assets (for validation)
        this.readAvailableAnimations();
        this.readAvailableShapekeys();
        
        // Setup from JSON configuration
        this.setupFromConfig();
        
        console.log('Animation Manager initialized!');
        this.logInitializationSummary();
        
        // Setup global test functions
        this.setupGlobalTestFunctions();
        
        // Start initial idle animation
        this.startIdleAnimation();
        
        // Set mouth_02001 to always be open
        this.setMouthAlwaysOpen();
    }

    initializeEyeBaseline() {
        if (!this.character) return;
        
        // Initialize eye baseline
        const eyeBaseline = this.animationConfig?.shapekeys?.blinking?.baseline || 0.25;
        console.log(`👁️ Initializing eye baseline to ${eyeBaseline}`);
        
        // Set both eyes to baseline
        this.setShapekeyByCategory('blinking', 'leftEye', eyeBaseline);
        this.setShapekeyByCategory('blinking', 'rightEye', eyeBaseline);
        
        // Initialize mouth baselines
        const mouthBaselines = this.animationConfig?.shapekeys?.mouthMovement?.baseline;
        if (mouthBaselines) {
            console.log(`😊 Initializing mouth baselines:`, mouthBaselines);
            Object.entries(mouthBaselines).forEach(([shapekeyName, value]) => {
                console.log(`Setting ${shapekeyName} to ${value}`);
                this.character.traverse((child) => {
                    if (child.isMesh && child.morphTargetDictionary && 
                        child.morphTargetDictionary[shapekeyName] !== undefined) {
                        const index = child.morphTargetDictionary[shapekeyName];
                        child.morphTargetInfluences[index] = value;
                    }
                });
            });
        }
    }

    async loadAnimationConfig() {
        try {
            // Add aggressive cache-busting parameters to force fresh load
            const timestamp = Date.now();
            const random = Math.random();
            const response = await fetch(`config/animation-config.json?t=${timestamp}&r=${random}&v=2`);
            if (!response.ok) {
                throw new Error(`Failed to load animation config: ${response.status}`);
            }
            this.animationConfig = await response.json();
            console.log('Animation config loaded:', this.animationConfig);
            console.log('Config file URL:', `config/animation-config.json?t=${timestamp}&r=${random}&v=2`);
        } catch (error) {
            console.error('Failed to load animation config:', error);
            // Fallback to default config
            this.animationConfig = {
                animations: { idle: { animation: 'idle' }, actions: { animations: [] } },
                shapekeys: { blinking: {}, mouthMovement: { shapekeys: [] }, emotions: { shapekeys: [] } }
            };
        }
    }

    readAvailableAnimations() {
        if (!this.animationMixer) {
            console.warn('⚠️ No animation mixer available');
            return;
        }
        
            this.availableAnimations = this.animationMixer._actions.map(action => action._clip.name);
        console.log('Available animations:', this.availableAnimations);
            console.log('Total animations found:', this.availableAnimations.length);
            
        // Show you what animations are available
            this.animationMixer._actions.forEach((action, index) => {
                const clip = action._clip;
                console.log(`Animation ${index + 1}: "${clip.name}" (Duration: ${clip.duration.toFixed(2)}s)`);
        });
    }

    readAvailableShapekeys() {
        if (!this.character) {
            console.warn('⚠️ No character available');
            return;
        }
        
            let totalShapekeys = 0;
            this.character.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary) {
                    this.availableShapekeys[child.name] = {
                        dictionary: child.morphTargetDictionary,
                        influences: child.morphTargetInfluences
                    };
                    const shapekeyNames = Object.keys(child.morphTargetDictionary);
                    totalShapekeys += shapekeyNames.length;
                    
                    console.log('Found shapekeys for mesh:', child.name);
                    console.log('Shapekey names:', shapekeyNames);
            }
        });
        console.log('📊 Total shapekeys found:', totalShapekeys);
    }



    setupFromConfig() {
        console.log('Setting up from JSON configuration...');
        console.log('Using config file: config/animation-config.json');
        
        // Store JSON config directly (no manual mapping)
        this.animationConfig = this.animationConfig;
        
        // Setup AI selection arrays from JSON
        this.populateAISelectionArrays();
        
        // Setup blinking system from JSON
        this.setupBlinkingSystem();
        
        // Setup emotion system from JSON
        this.setupEmotionSystem();
        
        console.log('Configuration setup complete from JSON file');
        console.log('Using JSON config directly:', this.animationConfig);
    }

    // No longer needed - using JSON config directly
    // setupShapekeysFromConfig() method removed

    setupBlinkingSystem() {
        if (this.animationConfig.shapekeys.blinking.autoCycle) {
            const blinkConfig = this.animationConfig.shapekeys.blinking.autoCycle;
            this.blinkState.blinkDuration = blinkConfig.duration;
            console.log(`✅ Blinking system configured (duration: ${blinkConfig.duration}ms)`);
        }
    }

    setupEmotionSystem() {
        if (this.animationConfig.shapekeys.emotions) {
            const emotionConfig = this.animationConfig.shapekeys.emotions;
            
            // Set fade durations from config
            this.speechState.emotionCycle.fadeInDuration = emotionConfig.fadeInDuration || 0.5;
            this.speechState.emotionCycle.fadeOutDuration = emotionConfig.fadeOutDuration || 0.5;
            
            console.log(`✅ Emotion system configured (fade in: ${this.speechState.emotionCycle.fadeInDuration}s, fade out: ${this.speechState.emotionCycle.fadeOutDuration}s)`);
        }
    }

    populateAISelectionArrays() {
        // Populate from JSON configuration
        if (this.animationConfig.animations.actions.animations) {
            this.aiSelectionArrays.actions = [...this.animationConfig.animations.actions.animations];
        }
        
        if (this.animationConfig.shapekeys.mouthMovement.shapekeys) {
            this.aiSelectionArrays.mouthMovement = [...this.animationConfig.shapekeys.mouthMovement.shapekeys];
        }
        
        if (this.animationConfig.shapekeys.emotions.shapekeys) {
            // Emotions is now an object with emotion names as keys, extract the keys
            this.aiSelectionArrays.emotions = Object.keys(this.animationConfig.shapekeys.emotions.shapekeys);
        }
        
        console.log('🤖 AI selection arrays populated:', this.aiSelectionArrays);
    }

    // AI Selection System
    async selectAIAnimations(message) {
        console.log('AI selecting animations for message:', message);
        
        // Create AI prompt from config
        const prompt = this.animationConfig.aiSelection.prompt.replace('{message}', message);
        console.log('AI Prompt:', prompt);
        
        // For now, use simple selection logic (you can replace with actual AI)
        const selections = this.simpleAISelection(message);
        
        console.log('AI Selections:', selections);
        return selections;
    }

    // Method called by Speech Planner
    async selectAnimationsWithAI(mood, text, promptCreator) {
        console.log('Speech Planner requesting AI animations for:', text);
        
        // Use the existing AI selection method
        const selections = await this.selectAIAnimations(text);
        
        // Convert to the format expected by Speech Planner
        return {
            mouthMovement: selections.mouthMovement,
            emotions: selections.emotion,
            actions: selections.action
        };
    }

    simpleAISelection(message) {
        const lowerMessage = message.toLowerCase();
        
        // Simple keyword-based selection
        let action = this.aiSelectionArrays.actions[0]; // Default
        let mouthMovement = this.aiSelectionArrays.mouthMovement[0]; // Default
        let emotion = null; // Start with null, only set if strong emotion detected
        
        // Select action based on message content (more flexible)
        if (lowerMessage.includes('dance')) action = 'dance';
        else if (lowerMessage.includes('jump')) action = 'jump';
        else if (lowerMessage.includes('fight')) action = 'fight';
        else if (lowerMessage.includes('wave')) action = 'Handwave';
        else if (lowerMessage.includes('pray')) action = 'pray';
        else if (lowerMessage.includes('sit')) action = 'sitting';
        else if (lowerMessage.includes('fall')) action = 'falling';
        else if (lowerMessage.includes('drunk')) action = 'drunk';
        else if (lowerMessage.includes('ninja')) action = 'ninjaidle';
        else if (lowerMessage.includes('shake')) action = 'shakeidle';
        else if (lowerMessage.includes('sad')) action = 'sadidle';
        else if (lowerMessage.includes('confused')) action = 'confused';
        else if (lowerMessage.includes('slip')) action = 'slip';
        else if (lowerMessage.includes('idle')) action = 'idledance';
        else {
            // Use config null chance for actions (60% = 3 in 5 times)
            const nullChance = this.animationConfig?.actions?.nullChance || 0.6;
            if (Math.random() < nullChance) {
                action = null; // No action (3 in 5 times)
            } else {
                // Random action from available options
                action = this.aiSelectionArrays.actions[Math.floor(Math.random() * this.aiSelectionArrays.actions.length)];
            }
        }
        
        // Select mouth movement based on speech
        if (lowerMessage.includes('open') || lowerMessage.includes('speak')) mouthMovement = 'A';
        else if (lowerMessage.includes('close') || lowerMessage.includes('shut')) mouthMovement = 'O';
        else if (lowerMessage.includes('pucker') || lowerMessage.includes('kiss')) mouthMovement = 'E';
        else mouthMovement = this.aiSelectionArrays.mouthMovement[Math.floor(Math.random() * this.aiSelectionArrays.mouthMovement.length)]; // Random mouth movement
        
        // Select emotion based on mood (only if strong emotion detected)
        if (lowerMessage.includes('happy') || lowerMessage.includes('joy') || lowerMessage.includes('excited')) emotion = 'happy';
        else if (lowerMessage.includes('sad') || lowerMessage.includes('sorrow') || lowerMessage.includes('cry')) emotion = 'sad';
        else if (lowerMessage.includes('angry') || lowerMessage.includes('rage') || lowerMessage.includes('mad')) emotion = 'angry';
        else if (lowerMessage.includes('surprised') || lowerMessage.includes('shock') || lowerMessage.includes('wow')) emotion = 'surprised';
        else if (lowerMessage.includes('fear') || lowerMessage.includes('terror') || lowerMessage.includes('scared')) emotion = 'fear';
        else if (lowerMessage.includes('disgust') || lowerMessage.includes('gross')) emotion = 'disgust';
        else if (lowerMessage.includes('fun') || lowerMessage.includes('excited')) emotion = 'really happy';
        else {
            // Use config null chance (80% = 4 in 5 times)
            const nullChance = this.animationConfig?.shapekeys?.emotions?.nullChance || 0.8;
            if (Math.random() < nullChance) {
                emotion = null; // No emotion (4 in 5 times)
            } else {
                // Random emotion from available options
                emotion = this.aiSelectionArrays.emotions[Math.floor(Math.random() * this.aiSelectionArrays.emotions.length)];
            }
        }
        
        return {
            action: action,
            mouthMovement: mouthMovement,
            emotion: emotion
        };
    }

    // Blinking system
    updateBlinking(deltaTime) {
        if (!this.animationConfig?.shapekeys?.blinking?.autoCycle?.enabled) {
            console.log('👁️ Blinking disabled or config missing');
            return;
        }
        
        const currentTime = Date.now();
        const config = this.animationConfig.shapekeys.blinking.autoCycle;
        
        // Set next blink interval if not set
        if (this.blinkState.blinkInterval === 0) {
            this.blinkState.blinkInterval = Math.random() * (config.maxInterval - config.minInterval) + config.minInterval;
        }
        
        // Check if it's time to blink
        if (currentTime - this.blinkState.lastBlinkTime > this.blinkState.blinkInterval) {
            this.startBlink();
        }
        
        // Update blink animation
        if (this.blinkState.isBlinking) {
            const blinkProgress = (currentTime - this.blinkState.lastBlinkTime) / this.blinkState.blinkDuration;
            const baseline = this.animationConfig.shapekeys.blinking.baseline || 0.25;
            
            if (blinkProgress <= 0.5) {
                // Blink closing (baseline to 1)
                const blinkValue = baseline + (blinkProgress * 2) * (1 - baseline);
                this.setShapekeyByCategory('blinking', 'leftEye', blinkValue);
                this.setShapekeyByCategory('blinking', 'rightEye', blinkValue);
            } else if (blinkProgress <= 1.0) {
                // Blink opening (1 to baseline)
                const blinkValue = 1 - ((blinkProgress - 0.5) * 2) * (1 - baseline);
                this.setShapekeyByCategory('blinking', 'leftEye', blinkValue);
                this.setShapekeyByCategory('blinking', 'rightEye', blinkValue);
            } else {
                // Blink finished - return to baseline
                this.setShapekeyByCategory('blinking', 'leftEye', baseline);
                this.setShapekeyByCategory('blinking', 'rightEye', baseline);
                this.blinkState.isBlinking = false;
                this.blinkState.lastBlinkTime = currentTime;
                this.blinkState.blinkInterval = 0; // Reset for next blink
            }
        }
    }

    startBlink() {
        this.blinkState.isBlinking = true;
        this.blinkState.lastBlinkTime = Date.now();
    }

    // Random smile system
    updateRandomSmile(deltaTime) {
        if (!this.animationConfig?.shapekeys?.mouthMovement?.autoCycle?.enabled) return;
        
        const currentTime = Date.now();
        const config = this.animationConfig.shapekeys.mouthMovement.autoCycle;
        
        // Set next smile interval if not set
        if (this.smileState.smileInterval === 0) {
            this.smileState.smileInterval = Math.random() * (config.maxInterval - config.minInterval) + config.minInterval;
        }
        
        // Check if it's time to smile
        if (currentTime - this.smileState.lastSmileTime > this.smileState.smileInterval) {
            this.startRandomSmile();
        }
        
        // Update smile animation
        if (this.smileState.isSmiling) {
            const smileProgress = (currentTime - this.smileState.lastSmileTime) / this.smileState.smileDuration;
            const baseline = this.animationConfig.shapekeys.mouthMovement.baseline["mouth smile 02"] || 0.25;
            const maxValue = this.animationConfig.shapekeys.mouthMovement.autoCycle.maxValue || 0.75;
            
            if (smileProgress <= 0.3) {
                // Smile up (baseline to max)
                const smileValue = baseline + (smileProgress / 0.3) * (maxValue - baseline);
                this.setSmileValue(smileValue);
            } else if (smileProgress <= 0.7) {
                // Hold smile at max
                this.setSmileValue(maxValue);
            } else {
                // Smile down (max to baseline)
                const smileValue = maxValue - ((smileProgress - 0.7) / 0.3) * (maxValue - baseline);
                this.setSmileValue(smileValue);
                
                if (smileProgress >= 1.0) {
                    // Smile finished - return to baseline
                    this.setSmileValue(baseline);
                    this.smileState.isSmiling = false;
                    this.smileState.lastSmileTime = currentTime;
                    this.smileState.smileInterval = 0; // Reset for next smile
                }
            }
        }
    }

    startRandomSmile() {
        this.smileState.isSmiling = true;
        this.smileState.lastSmileTime = Date.now();
    }

    setSmileValue(value) {
        this.character.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary && 
                child.morphTargetDictionary["mouth smile 02"] !== undefined) {
                const index = child.morphTargetDictionary["mouth smile 02"];
                child.morphTargetInfluences[index] = value;
            }
        });
    }

    // Idle mouth movement system (disabled - only use mouth movements during actual speech)
    updateIdleMouthMovement(deltaTime) {
        // Disabled - mouth movements only during speech
        return;
    }

    startIdleMouthMovement() {
        // Disabled - mouth movements only during speech
        return;
    }

    stopIdleMouthMovement() {
        // Disabled - mouth movements only during speech
        return;
    }

    updateMouthMovementCycling(deltaTime) {
        if (!this.speechState.mouthMovementCycle.isActive || !this.speechState.currentMouthMovement) {
            return;
        }
        
        // Disable mouth movement when emotion is active (if configured)
        if (this.animationConfig?.shapekeys?.emotions?.disableMouthMovement && 
            this.speechState.emotionCycle.isActive && this.speechState.currentEmotion) {
            
            // Set mouth movement to 0 during emotion bursts
            if (this.character && this.speechState.currentMouthMovement) {
                this.character.traverse((child) => {
                    if (child.isMesh && child.morphTargetDictionary) {
                        if (child.morphTargetDictionary[this.speechState.currentMouthMovement] !== undefined) {
                            const index = child.morphTargetDictionary[this.speechState.currentMouthMovement];
                            child.morphTargetInfluences[index] = 0.0;
                        }
                    }
                });
            }
            return;
        }

        const cycle = this.speechState.mouthMovementCycle;
        cycle.cycleTime += deltaTime;

        // Check if current cycle is finished and start a new one with random duration
        if (cycle.cycleTime >= cycle.cycleDuration) {
            // Reset for new cycle with random duration
            cycle.cycleTime = 0;
            // Random cycle duration: slowest (2.0-4.0s) to fastest (1.5-3.0s) - slower talking
            const slowestMin = 2.0;
            const slowestMax = 4.0;
            const fastestMin = 1.5;  // 25% faster than 2.0
            const fastestMax = 3.0;  // 25% faster than 4.0
            cycle.cycleDuration = fastestMin + Math.random() * (fastestMax - fastestMin);
            console.log(`🔄 New mouth cycle: ${cycle.cycleDuration.toFixed(2)}s`);
        }

        // Calculate cycle progress (0 to 1)
        const cycleProgress = cycle.cycleTime / cycle.cycleDuration;
        
        // Create a smooth 0->0.7->0 cycle using sine wave for random talking rhythm
        // Scale to max 0.7 for more subtle mouth opening
        cycle.currentValue = Math.sin(cycleProgress * Math.PI) * 0.7;

        // Apply the mouth movement value directly to the character
        if (this.character && this.speechState.currentMouthMovement) {
            let foundShapekey = false;
            this.character.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary) {
                    if (child.morphTargetDictionary[this.speechState.currentMouthMovement] !== undefined) {
                        const index = child.morphTargetDictionary[this.speechState.currentMouthMovement];
                        child.morphTargetInfluences[index] = cycle.currentValue;
                        foundShapekey = true;
                        

                    }
                }
            });
            
            if (!foundShapekey) {
                console.warn(`❌ Shapekey '${this.speechState.currentMouthMovement}' not found in model`);
            }
        } else {
            console.warn('❌ No character or mouth movement available');
        }
    }

    updateEmotionCycling(deltaTime) {
        if (!this.speechState.emotionCycle.isActive || !this.speechState.currentEmotion) {
            return;
        }
        
        const cycle = this.speechState.emotionCycle;
        cycle.cycleTime += deltaTime;

        // Three phases: fade in (0.5s) → hold (1.0s) → fade out (0.5s) = 2.0s total
        const fadeInDuration = 0.5;
        const holdDuration = 1.0;
        const fadeOutDuration = 0.5;
        const totalDuration = fadeInDuration + holdDuration + fadeOutDuration;

        if (cycle.cycleTime < fadeInDuration) {
            // Phase 1: Fade in to 0.6
            const fadeProgress = cycle.cycleTime / fadeInDuration;
            cycle.currentValue = fadeProgress * 0.6;
        } else if (cycle.cycleTime < fadeInDuration + holdDuration) {
            // Phase 2: Hold at 0.6
            cycle.currentValue = 0.6;
        } else if (cycle.cycleTime < totalDuration) {
            // Phase 3: Fade out from 0.6 to 0
            const fadeOutProgress = (cycle.cycleTime - fadeInDuration - holdDuration) / fadeOutDuration;
            cycle.currentValue = 0.6 * (1.0 - fadeOutProgress);
        } else {
            // Animation complete - stop cycling
            cycle.isActive = false;
            cycle.currentValue = 0;
            console.log(`😊 Emotion burst complete: ${this.speechState.currentEmotion}`);
        }

        // Apply the emotion value directly to the character
        if (this.character && this.speechState.currentEmotion) {
            let foundShapekey = false;
            
            // Get emotion config from the new structure
            const emotionConfig = this.animationConfig?.shapekeys?.emotions?.shapekeys?.[this.speechState.currentEmotion];
            
            if (emotionConfig) {
                const targetMesh = emotionConfig.mesh;
                const targetShapekey = emotionConfig.shapekey;
                
                this.character.traverse((child) => {
                    if (child.isMesh && child.name === targetMesh && child.morphTargetDictionary) {
                        if (child.morphTargetDictionary[targetShapekey] !== undefined) {
                            const index = child.morphTargetDictionary[targetShapekey];
                            child.morphTargetInfluences[index] = cycle.currentValue;
                            foundShapekey = true;
                        }
                    }
                });
                
                if (!foundShapekey) {
                    console.warn(`❌ Shapekey '${targetShapekey}' not found on mesh '${targetMesh}'`);
                }
            } else {
                console.warn(`❌ Emotion config not found for: ${this.speechState.currentEmotion}`);
            }
        } else {
            console.warn('❌ No character or emotion available');
        }
    }

    // Test method to demonstrate AI selection
    async testAISelection(message) {
        console.log('Testing AI selection with message:', message);
        
        const selections = await this.selectAIAnimations(message);
        
        // Apply the selections
        this.processAISelections(selections);
        
        // Start speech with the selections
        await this.startSpeech(3000, message);
        
        console.log('AI selection test completed');
        return selections;
    }

    // Test function to manually trigger speech with mouth movements
    testMouthMovement() {
        console.log('🎤 Testing mouth movement...');
        this.startSpeech(5000, 'Hello, this is a test of mouth movements!');
    }

    // Play action animation during speech with smooth crossfading
    playSpeechActionAnimation(actionName) {
        console.log('🎬 SPEECH ACTION:', actionName);
        
        if (window.heartSystem?.renderer?.actions) {
            const actions = window.heartSystem.renderer.actions;
            
            if (actions[actionName]) {
                const action = actions[actionName];
                console.log('▶️ Playing speech action with crossfade:', actionName);
                
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
                        this.crossfadeBackToIdle(action);
                    }
                });
                
                console.log('✅ Speech action animation started with crossfade:', actionName);
            } else {
                console.error('❌ Speech action not found:', actionName);
                console.log('Available actions:', Object.keys(actions));
            }
        } else {
            console.error('❌ Renderer or actions not available for speech action');
        }
    }

    // Crossfade back to idle animation
    crossfadeBackToIdle(actionAnimation) {
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

    // Set mood for emotion system
    setMood(mood) {
        console.log('😊 Animation Manager: Setting mood:', mood);
        // Mood changes are handled by the emotion cycling system during speech
        // This function is here to satisfy the interface requirement
    }

    // Fade out mouth movement smoothly
    fadeOutMouthMovement() {
        if (!this.character || !this.speechState.currentMouthMovement) return;
        
        const fadeDuration = 0.5; // 0.5 seconds fade out
        const startValue = this.speechState.mouthMovementCycle.currentValue;
        const startTime = Date.now();
        
        const fadeOut = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / fadeDuration, 1);
            
            // Smooth fade from current value to 0
            const currentValue = startValue * (1 - progress);
            
            this.character.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary && 
                    child.morphTargetDictionary[this.speechState.currentMouthMovement] !== undefined) {
                    const index = child.morphTargetDictionary[this.speechState.currentMouthMovement];
                    child.morphTargetInfluences[index] = currentValue;
                }
            });
            
            if (progress < 1) {
                requestAnimationFrame(fadeOut);
            } else {
                console.log(`🎤 Mouth movement faded out: ${this.speechState.currentMouthMovement}`);
            }
        };
        
        fadeOut();
    }

    // Set mouth_02001 mesh mouth open to always be 0.75
    setMouthAlwaysOpen() {
        if (this.character) {
            let foundMouthMesh = false;
            this.character.traverse((child) => {
                if (child.isMesh && child.name === 'mouth_02001' && child.morphTargetDictionary) {
                    // Target the specific "mouth open" shapekey on the mouth_02001 mesh
                    if (child.morphTargetDictionary['mouth open'] !== undefined) {
                        const index = child.morphTargetDictionary['mouth open'];
                        child.morphTargetInfluences[index] = 0.75;
                        foundMouthMesh = true;
                        console.log(`🎤 Set mouth_02001 mouth open to 0.75`);
                    } else {
                        console.warn(`❌ 'mouth open' shapekey not found on mouth_02001 mesh`);
                    }
                }
            });
            
            if (!foundMouthMesh) {
                console.warn(`❌ mouth_02001 mesh not found in character model`);
            }
        } else {
            console.warn('❌ No character available for mouth_02001');
        }
    }

    // Make test function globally accessible
    setupGlobalTestFunctions() {
        if (window.heartSystem?.animationManager) {
            window.testMouthMovement = () => window.heartSystem.animationManager.testMouthMovement();
            window.playAction = (actionName, duration = 3000) => window.heartSystem.animationManager.playActionOnDemand(actionName, duration);
            window.setMouthOpen = () => window.heartSystem.animationManager.setMouthAlwaysOpen();
            
            // Quick action commands
            window.nod = () => window.heartSystem.animationManager.playActionOnDemand('Quick Nod', 2000);
            window.shake = () => window.heartSystem.animationManager.playActionOnDemand('Headshake', 2000);
            window.dance = () => window.heartSystem.animationManager.playActionOnDemand('Dance 1', 5000);
            window.agree = () => window.heartSystem.animationManager.playActionOnDemand('Agree', 3000);
            window.angry = () => window.heartSystem.animationManager.playActionOnDemand('Angry Gesture', 2500);
            
            console.log('🎤 Test function available: window.testMouthMovement()');
            console.log('🎬 Action function available: window.playAction(actionName, duration)');
            console.log('🎭 Quick commands: nod(), shake(), dance(), agree(), angry()');
            console.log('🎭 Available actions:', Object.keys(window.heartSystem?.renderer?.actions || {}));
        }
    }

    playActionOnDemand(actionName, duration = 3000) {
        if (!window.heartSystem?.renderer) {
            console.warn('❌ Renderer not available');
            return;
        }
        
        if (!window.heartSystem.renderer.actions[actionName]) {
            console.warn(`❌ Action '${actionName}' not found`);
            console.log('Available actions:', Object.keys(window.heartSystem.renderer.actions || {}));
            return;
        }
        
        console.log(`🎬 Playing action on demand: ${actionName} for ${duration}ms`);
        window.heartSystem.renderer.playActionAnimation(actionName, duration);
    }

    startIdleAnimation() {
        
        // Get idle animation(s) directly from JSON config
        const idleConfig = this.animationConfig.animations.idle;
        
        if (!idleConfig) {
            console.warn('No idle animation configured in JSON');
            return;
        }
        
        // Handle both single animation (old format) and multiple animations (new format)
        if (idleConfig.animations && Array.isArray(idleConfig.animations)) {
            // Multiple idle animations - pick a random one
            const randomIndex = Math.floor(Math.random() * idleConfig.animations.length);
            const idleAnimation = idleConfig.animations[randomIndex];
            
            if (idleAnimation && window.heartSystem?.renderer) {
                window.heartSystem.renderer.startFirstAnimation(idleAnimation);
                console.log(`🎭 Started idle animation: ${idleAnimation}`);
                
                // Set up rotation if enabled
                if (idleConfig.rotationEnabled) {
                    this.scheduleNextIdleRotation();
                }
            }
        } else if (idleConfig.animation) {
            // Single idle animation (old format)
            if (window.heartSystem?.renderer) {
                window.heartSystem.renderer.startFirstAnimation(idleConfig.animation);
            }
        } else {
            console.warn('Invalid idle animation configuration');
        }
    }

    scheduleNextIdleRotation() {
        const idleConfig = this.animationConfig.animations.idle;
        
        if (!idleConfig || !idleConfig.rotationEnabled) {
            this.idleRotation.enabled = false;
            return;
        }
        
        // Calculate random number of loops between min and max
        const minLoops = idleConfig.minLoops || 5;
        const maxLoops = idleConfig.maxLoops || 15;
        const randomLoops = Math.floor(minLoops + Math.random() * (maxLoops - minLoops + 1));
        
        this.idleRotation.enabled = true;
        this.idleRotation.currentLoops = 0;
        this.idleRotation.targetLoops = randomLoops;
        this.idleRotation.lastAnimationTime = 0;
        
        console.log(`⏰ Next idle rotation after ${randomLoops} loops`);
    }

    checkIdleRotation() {
        // Only rotate if not speaking and rotation is enabled
        if (!this.idleRotation.enabled || this.speechState.isSpeaking) {
            return;
        }
        
        // Get current animation time from renderer
        if (!window.heartSystem?.renderer?.activeIdleAction) {
            return;
        }
        
        const currentAction = window.heartSystem.renderer.activeIdleAction;
        const currentTime = currentAction.time;
        
        // Check if animation has looped (time went back to near 0)
        if (this.idleRotation.lastAnimationTime > currentTime + 0.5) {
            // Animation looped!
            this.idleRotation.currentLoops++;
            console.log(`🔁 Idle loop ${this.idleRotation.currentLoops}/${this.idleRotation.targetLoops}`);
            
            // Check if we've reached target loops
            if (this.idleRotation.currentLoops >= this.idleRotation.targetLoops) {
                console.log('🔄 Rotating to next idle animation...');
                this.startIdleAnimation();
            }
        }
        
        this.idleRotation.lastAnimationTime = currentTime;
    }

    // Speech management with AI selection
    async startSpeech(duration, message = '', aiSelections = null) {
        console.log(`🎤 START SPEECH CALLED - duration: ${duration}, aiSelections:`, aiSelections);
        
        this.speechState.isSpeaking = true;
        this.speechState.speechStartTime = Date.now();
        this.speechState.speechDuration = duration;
        
        // Use provided AI selections or generate new ones
        let selections = aiSelections;
        if (!selections) {
            console.log(`🤖 No selections provided, generating new ones...`);
            selections = await this.selectAIAnimations(message);
        }
        
        console.log(`🎯 About to process selections:`, selections);
        
        // Apply AI selections
        this.processAISelections(selections);
        
        console.log(`Speech started (duration: ${duration}ms, selections:`, selections);
    }

    processAISelections(aiSelections) {
        console.log(`🚨 PROCESS AI SELECTIONS CALLED:`, aiSelections);
        
        // Apply AI-selected animations using multi-animation system
        if (aiSelections.actions && aiSelections.actions !== 'null' && aiSelections.actions !== null) {
            this.speechState.currentAction = aiSelections.actions;
            console.log(`🎬 Selected action: ${aiSelections.actions}`);
            
            // Use new multi-animation system to layer action on top of idle
            if (window.heartSystem?.renderer?.playMultipleAnimations) {
                console.log(`🎭 Using multi-animation system for speech action`);
                
                // Get current idle animation name
                const currentIdle = this.getCurrentIdleAnimationName();
                console.log(`🔄 Current idle animation: ${currentIdle}`);
                
                // Layer the action animation on top of the idle animation with proper settings
                const actionName = aiSelections.actions;
                
                // Get the action and configure it properly
                if (window.heartSystem?.renderer?.actions?.[actionName]) {
                    const action = window.heartSystem.renderer.actions[actionName];
                    
                    // Configure action animation settings with smooth transition
                    action.reset();
                    action.setLoop(THREE.LoopRepeat, 3); // Max 3 loops
                    action.clampWhenFinished = true;
                    action.setEffectiveTimeScale(0.4); // 40% slower speed
                    action.setEffectiveWeight(0); // Start at 0 weight
                    action.enabled = true;
                    
                    // Smooth fade in to prevent T-pose clipping
                    action.fadeIn(0.8); // 0.8 second fade in
                    action.play();
                    
                    // Gradually increase weight to target after fade-in
                    setTimeout(() => {
                        action.setEffectiveWeight(0.7); // Reach target weight
                    }, 200); // Small delay after fade-in starts
                    
                    console.log(`✅ Speech action configured: ${actionName} (3 loops max, 40% speed, smooth transition)`);
                } else {
                    // Fallback to layerAnimations method
                    window.heartSystem.renderer.layerAnimations(
                        currentIdle, 
                        actionName, 
                        0.7 // 70% weight for the action animation
                    );
                }
                
                console.log(`✅ Speech action layered on idle: ${aiSelections.actions} (70% weight)`);
                
                // Set up automatic fade out after speech duration with smooth transition
                setTimeout(() => {
                    if (window.heartSystem?.renderer?.actions?.[aiSelections.actions]) {
                        const action = window.heartSystem.renderer.actions[aiSelections.actions];
                        action.fadeOut(1.0); // 1 second smooth fade out
                        console.log(`🛑 Speech action fading out: ${aiSelections.actions}`);
                    } else if (window.heartSystem?.renderer?.stopAnimations) {
                        window.heartSystem.renderer.stopAnimations([aiSelections.actions], 1.0);
                        console.log(`🛑 Speech action faded out: ${aiSelections.actions}`);
                    }
                }, this.speechState.speechDuration || 3000);
                
            } else {
                console.warn(`⚠️ Multi-animation system not available, falling back to old method`);
                // Fallback to old method if multi-animation not available
                if (window.heartSystem?.renderer?.actions?.[aiSelections.actions]) {
                    this.playSpeechActionAnimation(aiSelections.actions);
                }
            }
        } else {
            console.log(`🎭 No action selected for this speech`);
        }
        
        // Handle emotions (can be null) - DISABLED FOR NOW
        if (false && aiSelections.emotions && aiSelections.emotions !== 'null' && aiSelections.emotions !== null) {
            this.speechState.currentEmotion = aiSelections.emotions;
            // Start emotion fade sequence: fade in → hold → fade out
            this.speechState.emotionCycle.isActive = true;
            this.speechState.emotionCycle.cycleTime = 0;
            this.speechState.emotionCycle.currentValue = 0;
            console.log(`😊 Starting emotion fade sequence: ${aiSelections.emotions} (2.0s total: fade in → hold at 0.8 → fade out)`);
        } else {
            console.log(`😐 Emotions disabled for now`);
        }
        
        if (aiSelections.mouthMovement) {
            this.speechState.currentMouthMovement = aiSelections.mouthMovement;
            // Start mouth movement cycling with random speed
            this.speechState.mouthMovementCycle.isActive = true;
            this.speechState.mouthMovementCycle.cycleTime = 0;
            this.speechState.mouthMovementCycle.currentValue = 0;
            // Random cycle duration: slowest (2.0-4.0s) to fastest (1.5-3.0s) - slower talking
            const slowestMin = 2.0;
            const slowestMax = 4.0;
            const fastestMin = 1.5;  // 25% faster than 2.0
            const fastestMax = 3.0;  // 25% faster than 4.0
            this.speechState.mouthMovementCycle.cycleDuration = fastestMin + Math.random() * (fastestMax - fastestMin);
            console.log(`🎤 Starting mouth movement cycling with: ${aiSelections.mouthMovement} (speed: ${this.speechState.mouthMovementCycle.cycleDuration.toFixed(2)}s)`);
        }
    }

    // Helper method to get current idle animation name for multi-animation system
    getCurrentIdleAnimationName() {
        // Try to get current idle animation from renderer
        if (window.heartSystem?.renderer?.currentAnimation) {
            const currentAnim = window.heartSystem.renderer.currentAnimation;
            if (currentAnim.toLowerCase().includes('idle')) {
                return currentAnim;
            }
        }
        
        // Try to get from active idle action
        if (window.heartSystem?.renderer?.activeIdleAction) {
            const idleAction = window.heartSystem.renderer.activeIdleAction;
            if (idleAction._clip && idleAction._clip.name.toLowerCase().includes('idle')) {
                return idleAction._clip.name;
            }
        }
        
        // Fallback: look for any idle animation in available actions
        if (window.heartSystem?.renderer?.actions) {
            const actions = window.heartSystem.renderer.actions;
            for (const [name, action] of Object.entries(actions)) {
                if (name.toLowerCase().includes('idle')) {
                    return name;
                }
            }
        }
        
        // Final fallback
        console.warn('⚠️ No idle animation found, using fallback');
        return 'idle'; // Generic fallback
    }

    // Main update loop
    updateAnimations(deltaTime) {
        
        // Update blinking
        this.updateBlinking(deltaTime);
        
        // Update random smile
        this.updateRandomSmile(deltaTime);
        
        // Check for idle animation rotation
        this.checkIdleRotation();
        
        // Idle mouth movements disabled - only use mouth movements during actual speech
        
        // Handle speech-related updates
        if (this.speechState.isSpeaking) {
            // Check if speech duration has expired
            const currentTime = Date.now();
            const speechElapsed = currentTime - this.speechState.speechStartTime;
            
            if (speechElapsed >= this.speechState.speechDuration) {
                // Speech finished
                this.speechState.isSpeaking = false;
                this.fadeOutSpeechAnimations();
                console.log('Speech duration expired, stopping mouth movement');
            } else {
                // Update mouth movement cycling during speech
                this.updateMouthMovementCycling(deltaTime);
                // Update emotion cycling during speech (EXACTLY like mouth movement)
                this.updateEmotionCycling(deltaTime);
            }
        }
    }


    fadeOutSpeechAnimations() {
        // Stop mouth movement cycling
        this.speechState.mouthMovementCycle.isActive = false;
        
        // Stop emotion cycling (EXACTLY like mouth movement)
        this.speechState.emotionCycle.isActive = false;
        
        // Stop looping action animation when speech ends
        if (this.speechState.currentAction && window.heartSystem?.renderer?.activeActionAnimation) {
            const action = window.heartSystem.renderer.activeActionAnimation;
            action.fadeOut(0.3);
            window.heartSystem.renderer.activeActionAnimation = null;
            console.log(`🎬 Action animation stopped: ${this.speechState.currentAction}`);
        }
        
        // Fade out speech-related animations smoothly
        if (this.speechState.currentMouthMovement && this.character) {
            this.fadeOutMouthMovement();
        }
        
        // Reset emotion to 0 (EXACTLY like mouth movement)
        if (this.speechState.currentEmotion && this.character) {
            // Get emotion config from the new structure
            const emotionConfig = this.animationConfig?.shapekeys?.emotions?.shapekeys?.[this.speechState.currentEmotion];
            
            if (emotionConfig) {
                const targetMesh = emotionConfig.mesh;
                const targetShapekey = emotionConfig.shapekey;
                
                this.character.traverse((child) => {
                    if (child.isMesh && child.name === targetMesh && child.morphTargetDictionary && 
                        child.morphTargetDictionary[targetShapekey] !== undefined) {
                        const index = child.morphTargetDictionary[targetShapekey];
                        child.morphTargetInfluences[index] = 0.0;
                        console.log(`Emotion reset: ${this.speechState.currentEmotion} (${targetShapekey} on ${targetMesh}) = 0`);
                    }
                });
            }
        }
        
        // The updateAnimations loop will handle returning to idle automatically
        console.log('Speech animations faded out, idle will resume automatically');
    }

    // JSON Configuration Methods (no manual mapping needed)
    getAnimationFromConfig(category, functionName) {
        if (category === 'idle' && this.animationConfig.animations.idle) {
            return this.animationConfig.animations.idle.animation;
        } else if (category === 'actions' && this.animationConfig.animations.actions.animations) {
            return this.animationConfig.animations.actions.animations.find(
                name => name.toLowerCase().replace(/[^a-z]/g, '') === functionName
            );
        }
        return null;
    }

    getShapekeyFromConfig(category, functionName) {
        if (category === 'blinking' && this.animationConfig.shapekeys.blinking) {
            return this.animationConfig.shapekeys.blinking.shapekey;
        } else if (category === 'mouthMovement' && this.animationConfig.shapekeys.mouthMovement.shapekeys) {
            return this.animationConfig.shapekeys.mouthMovement.shapekeys.find(
                name => name.toLowerCase().replace(/[^a-z]/g, '') === functionName
            );
        } else if (category === 'emotions' && this.animationConfig.shapekeys.emotions.shapekeys) {
            return this.animationConfig.shapekeys.emotions.shapekeys.find(
                name => name.toLowerCase().replace(/[^a-z]/g, '') === functionName
            );
        }
        return null;
    }

    // Shapekey methods
    setShapekeyByCategory(categoryName, functionName, value) {
        // Get shapekey name directly from JSON config
        let shapekeyName = null;
        
        if (categoryName === 'blinking' && this.animationConfig.shapekeys.blinking) {
            // Handle new structure with separate left/right eye shapekeys
            if (this.animationConfig.shapekeys.blinking.shapekeys && 
                this.animationConfig.shapekeys.blinking.shapekeys[functionName]) {
                shapekeyName = this.animationConfig.shapekeys.blinking.shapekeys[functionName];
            } else if (this.animationConfig.shapekeys.blinking.shapekey) {
                // Fallback to old single shapekey structure
                shapekeyName = this.animationConfig.shapekeys.blinking.shapekey;
            }
        } else if (categoryName === 'mouthMovement' && this.animationConfig.shapekeys.mouthMovement.shapekeys) {
            // Find shapekey by function name (simplified name)
            shapekeyName = this.animationConfig.shapekeys.mouthMovement.shapekeys.find(
                name => name.toLowerCase().replace(/[^a-z]/g, '') === functionName
            );
        } else if (categoryName === 'emotions' && this.animationConfig.shapekeys.emotions.shapekeys) {
            // Find shapekey by function name (simplified name)
            shapekeyName = this.animationConfig.shapekeys.emotions.shapekeys.find(
                name => name.toLowerCase().replace(/[^a-z]/g, '') === functionName
            );
        }
        
        if (shapekeyName && this.character) {
            this.character.traverse((child) => {
                if (child.isMesh && child.morphTargetDictionary && 
                    child.morphTargetDictionary[shapekeyName] !== undefined) {
                    const index = child.morphTargetDictionary[shapekeyName];
                    child.morphTargetInfluences[index] = value;
                }
            });
        }
    }

    // Utility methods
    getCurrentAnimation() {
        return this.currentAnimation;
    }

    isCurrentAnimationAction() {
        if (!this.currentAnimation) return false;
        const actionKeywords = ['wave', 'point', 'nod', 'shake', 'dance', 'fight', 'jump', 'walk', 'run'];
        const name = this.currentAnimation.toLowerCase();
        return actionKeywords.some(keyword => name.includes(keyword));
    }

    // Debug and logging methods
    logInitializationSummary() {
        console.log('📊 Animation Manager Summary:');
        console.log('🎬 Available animations:', this.availableAnimations);
        console.log('📋 Animation mappings:', this.animationMapping);
        console.log('🎭 Available shapekeys:', this.availableShapekeys);
        console.log('🤖 AI selection arrays:', this.aiSelectionArrays);
    }

    printConfiguration() {
        console.log('📋 Animation Categories:', this.animationCategories);
        console.log('📋 Shapekey Categories:', this.shapekeyCategories);
        console.log('📋 Animation Mappings:', this.animationMapping);
    }

    // Cleanup
    dispose() {
        if (this.animationMixer) {
            this.animationMixer.stopAllAction();
        }
        console.log('🧹 Animation Manager disposed');
    }
} 