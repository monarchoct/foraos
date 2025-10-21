import { getBrowserApiKeys } from '../../config/env-config.js';

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
            return this.generateFallbackResponse(input);
        } finally {
            this.isGenerating = false;
        }
    }

    createPrompt(input, inputEmotion) {
        const traits = this.personality.getAllTraits();
        const mood = this.heartState.mood;
        
        return `You are ${traits.name}, a ${traits.personality} AI companion with these characteristics:
- Personality: ${traits.personality}
- Communication style: ${traits.communicationStyle}
- Current mood: ${mood.name} (${mood.description})
- Emotional state: ${inputEmotion}

Respond to the user's input: "${input}"

Guidelines:
- Keep responses under 100 characters
- Match your personality and current mood
- Be engaging and natural
- Use appropriate emotional tone for ${inputEmotion}
- Don't repeat yourself or be overly formal`;
    }

    async generateWithAI(prompt, input) {
        // Try to use OpenAI if available
        try {
            // Get API key from config or environment
            const apiKey = this.getApiKey();
            
            if (!apiKey || apiKey === 'your-api-key-here') {
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
            
            // Add conversation history
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
            
            // Try local proxy first, then direct API
            const response = await this.makeApiRequest(messages, apiKey);
            
            if (response) {
                console.log('🤖 OpenAI generated response:', response);
                return response;
            } else {
                throw new Error('No response from OpenAI');
            }
            
        } catch (error) {
            console.warn('OpenAI not available, using fallback:', error.message);
            return this.generateFallbackResponse(input);
        }
    }

    getApiKey() {
        // Try multiple sources for API key
        const browserKeys = getBrowserApiKeys();
        const apiKey = browserKeys.openai?.apiKey || 
                      this.personality?.configManager?.getApiKeys?.()?.openai?.apiKey ||
                      (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY);
        
        console.log('🔑 OpenAI API Key Debug:', {
            fromBrowser: !!browserKeys.openai?.apiKey,
            fromConfig: !!this.personality?.configManager?.getApiKeys?.()?.openai?.apiKey,
            fromEnv: !!(typeof process !== 'undefined' && process.env?.OPENAI_API_KEY),
            keyLength: apiKey ? apiKey.length : 0,
            localStorage: localStorage.getItem('foraos_api_keys') ? 'exists' : 'missing'
        });
        
        return apiKey;
    }

    async makeApiRequest(messages, apiKey) {
        // Try local proxy first
        try {
            const proxyResponse = await fetch('http://localhost:3001/api/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    max_tokens: 150,
                    temperature: 0.8
                })
            });
            
            if (proxyResponse.ok) {
                const data = await proxyResponse.json();
                return data.choices[0]?.message?.content?.trim();
            }
        } catch (error) {
            console.log('Local proxy not available, trying direct API...');
        }
        
        // Fallback to direct API (if CORS allows)
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    max_tokens: 150,
                    temperature: 0.8
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.choices[0]?.message?.content?.trim();
            }
        } catch (error) {
            console.log('Direct API call failed:', error.message);
        }
        
        return null;
    }

    generateFallbackResponse(input) {
        const traits = this.personality.getAllTraits();
        const mood = this.heartState.mood;
        
        const fallbacks = [
            "I'm here! What's on your mind?",
            "Tell me more about that.",
            "That's interesting!",
            "I'm listening.",
            "What else?",
            "Go on...",
            "I understand.",
            "That sounds important.",
            "Tell me about it.",
            "I'm here for you."
        ];
        
        // Add mood-based responses
        if (mood.name === 'happy') {
            fallbacks.push("That's wonderful!", "I'm so glad!", "This is great!");
        } else if (mood.name === 'sad') {
            fallbacks.push("I'm here with you.", "That must be hard.", "I understand.");
        } else if (mood.name === 'excited') {
            fallbacks.push("That's amazing!", "I'm excited too!", "This is fantastic!");
        }
        
        const response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        console.log('🎭 Using fallback response:', response);
        return response;
    }

    processResponse(response, inputEmotion) {
        if (!response) return this.generateFallbackResponse();
        
        // Apply personality-based processing
        const traits = this.personality.getAllTraits();
        
        // Adjust response based on communication style
        if (traits.communicationStyle === 'formal') {
            response = response.replace(/!/g, '.');
        } else if (traits.communicationStyle === 'casual') {
            response = response.toLowerCase();
        }
        
        // Ensure response length is appropriate
        if (response.length > 100) {
            response = response.substring(0, 97) + '...';
        }
        
        return response.trim();
    }

    async selectAnimationsForResponse(response, emotion) {
        if (!this.animationManager) return [];
        
        try {
            // Simple animation selection based on emotion and response content
            const animations = [];
            
            if (emotion.includes('happy') || response.includes('!')) {
                animations.push('smile', 'nod');
            } else if (emotion.includes('sad')) {
                animations.push('concerned', 'nod');
            } else if (emotion.includes('excited')) {
                animations.push('excited', 'wave');
            } else {
                animations.push('idle', 'blink');
            }
            
            return animations;
        } catch (error) {
            console.warn('Animation selection failed:', error);
            return ['idle', 'blink'];
        }
    }

    setAnimationManager(animationManager) {
        this.animationManager = animationManager;
    }

    setOnSpeechReady(callback) {
        this.onSpeechReady = callback;
    }
}
