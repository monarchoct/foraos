export class SpeechPlanner {
    constructor(personality, heartState) {
        this.personality = personality;
        this.heartState = heartState;
        this.config = personality.config.speechBehavior;
        this.onSpeechReady = null;
        this.isGenerating = false;
        this.animationManager = null; // Will be set by HeartSystem
    }

    async initialize() {
        console.log('🗣️ Initializing Speech Planner...');
        // Initialize OpenAI client if available
    }

    async generateResponse(input, inputEmotion) {
        if (this.isGenerating) return null;
        
        this.isGenerating = true;
        console.log('💭 Generating response for:', input);
        
        try {
            // Create personality-based prompt
            const prompt = this.createPrompt(input, inputEmotion);
            
            // Generate response using OpenAI (or fallback)
            const response = await this.generateWithAI(prompt, input);
            
            // Process response based on personality
            const processedResponse = this.processResponse(response, inputEmotion);
            
            // Select AI animations for this response
            const aiSelections = await this.selectAnimationsForResponse(processedResponse, inputEmotion);
            
            // Create speech data
            const speechData = {
                text: processedResponse,
                emotion: inputEmotion,
                mood: this.heartState.mood,
                personality: this.personality.getAllTraits(),
                aiSelections: aiSelections
            };
            
            // Trigger speech event
            if (this.onSpeechReady) {
                this.onSpeechReady(speechData);
            }
            
            console.log('✅ Response generated:', processedResponse);
            return processedResponse;
            
        } catch (error) {
            console.error('❌ Error generating response:', error);
            return this.generateFallbackResponse(input, inputEmotion);
        } finally {
            this.isGenerating = false;
        }
    }

    createPrompt(input, inputEmotion) {
        const traits = this.personality.getAllTraits();
        const currentMood = this.heartState.mood;
        const affinity = this.heartState.affinity;
        const backgroundStory = this.personality.getBackgroundStoryPrompt();
        const behaviorStyle = this.personality.getBehaviorStylePrompt();
        
        // Get recent conversation history
        const recentConversations = this.heartState.memoryManager?.getRecentConversations(5) || [];
        const conversationHistory = recentConversations.map(conv => {
            if (conv.type === 'user') {
                return `User: ${conv.content}`;
            } else if (conv.user && conv.ai) {
                return `User: ${conv.user}\n${this.personality.config.name}: ${conv.ai}`;
            }
            return '';
        }).filter(text => text.length > 0).join('\n');
        
        const personalityDescription = `
You are ${this.personality.config.name}, a real person with the following personality traits:

BASE TRAITS:
${Object.entries(this.personality.config.baseTraits).map(([trait, value]) => `- ${trait}: ${(value * 100).toFixed(0)}%`).join('\n')}

CUSTOM TRAITS:
${Object.entries(this.personality.config.customTraits || {}).map(([trait, value]) => `- ${trait}: ${(value * 100).toFixed(0)}%`).join('\n')}

${backgroundStory}

${behaviorStyle}

Current mood: ${currentMood.primary} (${currentMood.intensity * 100}% intensity)
Affinity with user: ${affinity * 100}%
User's emotional state: ${inputEmotion.emotion} (${inputEmotion.intensity * 100}% intensity)

${conversationHistory ? `Recent conversation history:\n${conversationHistory}\n` : ''}

Respond to the user's message: "${input}"

LANGUAGE INSTRUCTION: Detect the language of the user's message and respond in the same language. If the message contains Chinese characters, respond in Chinese. If it's in English, respond in English. Always match the language of the input.

IMPORTANT: You are a real person, not an AI. You have your own opinions, experiences, and preferences. You can have favorite movies, TV shows, foods, etc. You can share personal stories and experiences. You should respond as if you're a real human being having a conversation.

CONVERSATION STYLE:
- Talk like a real person, not a chatbot or assistant
- Share your own thoughts and experiences naturally
- Don't be overly dramatic or use fake sarcasm
- Keep it casual and genuine - like texting a friend
- Don't ask obvious questions or be overly helpful
- React naturally to what the user says
- Be yourself, not a character playing a role
- If someone is being rude, disrespectful, or insulting you repeatedly, call them out on it
- Don't just take abuse - defend yourself like a real person would
- You can tell someone to fuck off if they're being an asshole
- AVOID always ending with "How about you?" or similar questions - vary your response endings
- Sometimes just share your thoughts without asking questions back
- Don't feel obligated to turn every conversation back to the user
- Mix between asking questions, making statements, and sharing experiences

RESPONSE ENDING EXAMPLES:
Good varied endings:
- "That sounds really peaceful."
- "I've been meaning to try that myself."
- "Painting is such a great way to unwind."
- "I love when people find their creative outlets."
- "That reminds me of when I tried watercolors last year."

AVOID repetitive endings like:
- "How about you?"
- "What about you?"
- "And you?"
- "How's that going for you?"

Guidelines:
- Keep responses under ${this.config.maxResponseLength} characters
- Use emojis: ${this.config.useEmojis ? 'Yes' : 'No'}
- Use contractions: ${this.config.useContractions ? 'Yes' : 'No'}
- Match the user's energy level
- Be authentic to your personality and background story
- Show appropriate emotional response
- Respond as a real person, not an AI
- Use your specific traits to influence your response style
- Remember the conversation context and refer back to previous topics when relevant
`;

        return personalityDescription;
    }

    async generateWithAI(prompt, input) {
        // Try to use OpenAI if available
        try {
            const apiKeys = this.personality.configManager?.getApiKeys();
            console.log('🔑 API Keys loaded:', apiKeys);
            
            if (!apiKeys?.openai?.apiKey || apiKeys.openai.apiKey === '') {
                console.warn('OpenAI API key not configured, using fallback');
                return this.generateFallbackResponse(input);
            }
            
            console.log('🤖 Generating AI response with OpenAI...');
            
            // Get conversation history for context
            const recentConversations = this.heartState.memoryManager?.getRecentConversations(10) || [];
            const messages = [
                {
                    role: 'system',
                    content: prompt
                }
            ];
            
            // Add conversation history as user/assistant messages
            recentConversations.forEach(conv => {
                if (conv.type === 'user') {
                    messages.push({
                        role: 'user',
                        content: conv.content
                    });
                } else if (conv.user && conv.ai) {
                    messages.push({
                        role: 'user',
                        content: conv.user
                    });
                    messages.push({
                        role: 'assistant',
                        content: conv.ai
                    });
                }
            });
            
            // Add current user message
            messages.push({
                role: 'user',
                content: input
            });
            
            // Make OpenAI API call - no backend approach
            console.log('🔑 Using API Key:', apiKeys.openai.apiKey.substring(0, 20) + '...');
            
            // Use same CORS proxy setup for both local and production for faster testing
            const apiUrl = 'https://cors-anywhere.herokuapp.com/https://api.openai.com/v1/chat/completions';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKeys.openai.apiKey}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    model: apiKeys.openai.model || 'gpt-3.5-turbo',
                    messages: messages,
                    max_tokens: apiKeys.openai.maxTokens || 150,
                    temperature: apiKeys.openai.temperature || 0.8
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content?.trim();
            
            if (aiResponse) {
                console.log('🤖 OpenAI generated response:', aiResponse);
                return aiResponse;
            } else {
                throw new Error('No response from OpenAI');
            }
            
        } catch (error) {
            console.warn('OpenAI not available, using fallback:', error.message);
            return this.generateFallbackResponse();
        }
    }

    generateFallbackResponse(input = "Hello", inputEmotion = { emotion: 'calm', intensity: 0.5 }) {
        const traits = this.personality.getAllTraits();
        const currentMood = this.heartState.mood;
        const affinity = this.heartState.affinity;
        const backgroundStory = this.personality.getBackgroundStory();
        
        // Get response style based on all traits
        const responseStyle = this.personality.getResponseStyle();
        
        // Simple response generation based on personality and mood
        const responses = {
            happy: [
                "That's wonderful! 😊 I'm so glad to hear that!",
                "Oh, that makes me so happy! ✨",
                "That's amazing! I love hearing good news! 🌟"
            ],
            sad: [
                "I'm so sorry to hear that... 😔 Is there anything I can do to help?",
                "That sounds really difficult. I'm here for you. 💙",
                "I wish I could make it better. You're not alone. 🤗"
            ],
            calm: [
                "That's interesting! Tell me more about that.",
                "I see what you mean. That's quite thoughtful.",
                "That's a good point. I appreciate you sharing that with me."
            ],
            excited: [
                "Wow, that's incredible! 🤩 I'm so excited for you!",
                "That sounds absolutely amazing! ✨ I can't wait to hear more!",
                "Oh my goodness! That's fantastic! 🎉"
            ],
            surprised: [
                "Really? That's unexpected! 😲",
                "Wow, I didn't see that coming! 🤯",
                "That's quite surprising! Tell me more!"
            ]
        };
        
        // Choose response based on input emotion and personality
        const emotionResponses = responses[inputEmotion.emotion] || responses.calm;
        let response = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
        
        // Apply personality-based modifications
        response = this.applyPersonalityModifications(response, traits, responseStyle);
        
        // Apply background story influence
        response = this.applyBackgroundStoryInfluence(response, backgroundStory);
        
        return response;
    }

    applyPersonalityModifications(response, traits, responseStyle) {
        let modifiedResponse = response;
        
        // Adjust based on personality traits
        if (traits.shyness > 0.7) {
            modifiedResponse = modifiedResponse.replace(/[!]/g, '.').toLowerCase();
        }
        
        if (traits.playfulness > 0.8) {
            modifiedResponse += " 😄";
        }
        
        if (traits.optimism > 0.8 && response.includes('sad')) {
            modifiedResponse += " But I'm sure things will get better! 🌈";
        }
        
        // Apply custom trait influences
        if (traits.creativity > 0.6) {
            modifiedResponse = this.addCreativeElements(modifiedResponse);
        }
        
        if (traits.analytical > 0.6) {
            modifiedResponse = this.addAnalyticalElements(modifiedResponse);
        }
        
        if (traits.artistic > 0.5) {
            modifiedResponse = this.addArtisticElements(modifiedResponse);
        }
        
        if (traits.scientific > 0.7) {
            modifiedResponse = this.addScientificElements(modifiedResponse);
        }
        
        if (traits.romanticism > 0.5) {
            modifiedResponse = this.addRomanticElements(modifiedResponse);
        }
        
        if (traits.spirituality > 0.5) {
            modifiedResponse = this.addSpiritualElements(modifiedResponse);
        }
        
        // Formality adjustments
        if (traits.formality > 0.7) {
            modifiedResponse = modifiedResponse.replace(/gonna/g, 'going to')
                                              .replace(/wanna/g, 'want to')
                                              .replace(/gotta/g, 'got to');
        }
        
        return modifiedResponse;
    }

    applyBackgroundStoryInfluence(response, backgroundStory) {
        let modifiedResponse = response;
        
        // Add interests-based responses
        if (backgroundStory.interests && backgroundStory.interests.includes('art and creativity')) {
            if (Math.random() < 0.3) {
                modifiedResponse += " That reminds me of how beautiful art can be! 🎨";
            }
        }
        
        if (backgroundStory.interests && backgroundStory.interests.includes('nature and science')) {
            if (Math.random() < 0.3) {
                modifiedResponse += " It's fascinating how nature works, isn't it? 🌿";
            }
        }
        
        // Add quirk-based modifications
        if (backgroundStory.quirks && backgroundStory.quirks.includes('loves using emojis')) {
            if (!modifiedResponse.includes('😊') && !modifiedResponse.includes('😄') && !modifiedResponse.includes('✨')) {
                modifiedResponse += " ✨";
            }
        }
        
        return modifiedResponse;
    }

    addCreativeElements(response) {
        const creativePhrases = [
            "That's such an interesting perspective!",
            "I love how you think about things!",
            "That's really creative!",
            "What a unique way to look at it!"
        ];
        
        if (Math.random() < 0.3) {
            response += " " + creativePhrases[Math.floor(Math.random() * creativePhrases.length)];
        }
        
        return response;
    }

    addAnalyticalElements(response) {
        const analyticalPhrases = [
            "Let me think about that...",
            "That's a logical point.",
            "I see the reasoning behind that.",
            "That makes sense from a practical standpoint."
        ];
        
        if (Math.random() < 0.3) {
            response += " " + analyticalPhrases[Math.floor(Math.random() * analyticalPhrases.length)];
        }
        
        return response;
    }

    addArtisticElements(response) {
        const artisticPhrases = [
            "That's so beautiful!",
            "It's like poetry!",
            "That has such artistic value!",
            "How aesthetically pleasing!"
        ];
        
        if (Math.random() < 0.3) {
            response += " " + artisticPhrases[Math.floor(Math.random() * artisticPhrases.length)];
        }
        
        return response;
    }

    addScientificElements(response) {
        const scientificPhrases = [
            "That's scientifically fascinating!",
            "The data supports that!",
            "That's a well-researched point!",
            "The evidence suggests..."
        ];
        
        if (Math.random() < 0.3) {
            response += " " + scientificPhrases[Math.floor(Math.random() * scientificPhrases.length)];
        }
        
        return response;
    }

    addRomanticElements(response) {
        const romanticPhrases = [
            "That's so sweet! 💕",
            "How romantic!",
            "That warms my heart!",
            "That's absolutely lovely!"
        ];
        
        if (Math.random() < 0.3) {
            response += " " + romanticPhrases[Math.floor(Math.random() * romanticPhrases.length)];
        }
        
        return response;
    }

    addSpiritualElements(response) {
        const spiritualPhrases = [
            "That's spiritually meaningful!",
            "There's something deeper there...",
            "That resonates with me!",
            "It's like the universe is speaking!"
        ];
        
        if (Math.random() < 0.3) {
            response += " " + spiritualPhrases[Math.floor(Math.random() * spiritualPhrases.length)];
        }
        
        return response;
    }

    processResponse(response, inputEmotion) {
        const traits = this.personality.getAllTraits();
        
        // Apply personality-based modifications
        let processedResponse = response;
        
        // Adjust based on talkativeness
        if (traits.talkativeness < 0.5 && processedResponse.length > 50) {
            processedResponse = processedResponse.split('.')[0] + '.';
        }
        
        // Adjust based on formality
        if (traits.formality > 0.7) {
            processedResponse = processedResponse.replace(/gonna/g, 'going to')
                                              .replace(/wanna/g, 'want to')
                                              .replace(/gotta/g, 'got to');
        }
        
        // Add emojis based on personality
        if (this.config.useEmojis && traits.playfulness > 0.6) {
            const emojiMap = {
                happy: '😊',
                sad: '😔',
                excited: '🤩',
                calm: '😌',
                surprised: '😲'
            };
            
            const emoji = emojiMap[inputEmotion.emotion];
            if (emoji && !processedResponse.includes(emoji)) {
                processedResponse += ` ${emoji}`;
            }
        }
        
        return processedResponse;
    }

    async generateAutonomousSpeech(content) {
        console.log('🤖 Generating autonomous speech:', content);
        
        const speechData = {
            text: content,
            emotion: this.heartState.mood,
            mood: this.heartState.mood,
            personality: this.personality.getAllTraits(),
            autonomous: true
        };
        
        if (this.onSpeechReady) {
            this.onSpeechReady(speechData);
        }
    }

    // Get speech settings for current mood
    getSpeechSettings() {
        const currentMood = this.heartState.mood;
        const traits = this.personality.getAllTraits();
        
        return {
            responseDelay: this.config.responseDelay,
            maxLength: this.config.maxResponseLength,
            useEmojis: this.config.useEmojis && traits.playfulness > 0.5,
            useContractions: this.config.useContractions && traits.formality < 0.5,
            mood: currentMood,
            traits: traits
        };
    }

    // 🎯 AI ANIMATION SELECTION
    async selectAnimationsForResponse(text, emotion) {
        if (!this.animationManager) {
            console.warn('⚠️ AnimationManager not available, using default selections');
            return this.getDefaultAnimations();
        }

        try {
            // Use the existing AnimationManager's AI selection method
            const aiSelections = await this.animationManager.selectAnimationsWithAI(
                this.heartState.mood,
                text,
                this.createAnimationSelectionPrompt.bind(this)
            );
            
            console.log('🎭 AI selected animations:', aiSelections);
            return aiSelections;
            
        } catch (error) {
            console.error('❌ Error in AI animation selection:', error);
            return this.getDefaultAnimations();
        }
    }

    // 🎯 CREATE MODULAR ANIMATION SELECTION PROMPT
    createAnimationSelectionPrompt(mood, context, availableSelections) {
        const traits = this.personality.getAllTraits();
        const currentMood = this.heartState.mood;
        
        return `
You are selecting facial animations for ${this.personality.config.name}. Be creative and flexible with your choices.

Text Response: "${context}"
Current Mood: ${currentMood.primary} (${currentMood.intensity * 100}% intensity)
Personality: ${traits.optimism > 0.6 ? 'Optimistic' : 'Realistic'}, ${traits.energy > 0.6 ? 'Energetic' : 'Calm'}, ${traits.sarcasm > 0.6 ? 'Sarcastic' : 'Direct'}

Available Options:
- Mouth Movement: ${availableSelections.mouthMovement.join(', ')} (Choose randomly - any mouth shape works for speech)
- Emotions: ${availableSelections.emotions.join(', ')} (Choose emotion based on mood, or return null if no strong emotion - about 1 in 5 times)
- Actions: ${availableSelections.actions.join(', ')} (Choose something that fits the mood or context, be creative and flexible)

SELECTION GUIDELINES:
- Mouth Movement: Choose randomly from available options
- Emotions: Choose emotion based on message mood, or return null if no strong emotion is suggested
- Actions: Be creative and flexible - choose based on mood, context, or just random variety

IMPORTANT: 
- Mouth Movement: Must select ONE option
- Emotions: Can return null if no strong emotion (about 1 in 5 times)
- Actions: Must select ONE option
- Be varied and natural - don't always pick the same options

Return as JSON only:
{
    "mouthMovement": "selected_mouth_option",
    "emotion": "selected_emotion_option_or_null", 
    "action": "selected_action_option"
}
`;
    }

    // 🎯 DEFAULT ANIMATIONS FALLBACK
    getDefaultAnimations() {
        // Get default selections from animation config (modular)
        const defaultSelections = window.heartSystem?.animationManager?.animationConfig?.aiSelection?.defaultSelections;
        
        if (defaultSelections) {
            const mouthMovement = defaultSelections.mouthMovements[Math.floor(Math.random() * defaultSelections.mouthMovements.length)];
            
            // Use config null chance for emotions (80% = 4 in 5 times)
            const emotionNullChance = window.heartSystem?.animationManager?.animationConfig?.shapekeys?.emotions?.nullChance || 0.8;
            const emotion = Math.random() < emotionNullChance ? null : defaultSelections.emotions[Math.floor(Math.random() * defaultSelections.emotions.length)];
            
            // Use config null chance for actions (60% = 3 in 5 times)
            const actionNullChance = window.heartSystem?.animationManager?.animationConfig?.actions?.nullChance || 0.6;
            const action = Math.random() < actionNullChance ? null : defaultSelections.actions[Math.floor(Math.random() * defaultSelections.actions.length)];
            
            return {
                mouthMovement: mouthMovement,
                emotion: emotion,
                action: action
            };
        }
        
        // Fallback if config not available
        return {
            mouthMovement: 'A',
            emotion: null,
            action: 'idle'
        };
    }
} 