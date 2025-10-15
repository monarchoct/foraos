// Backup method using local proxy server
// This would be used if CORS proxies continue to fail

async generateWithAIBackup(prompt, input) {
    try {
        const apiKeys = this.personality.configManager?.getApiKeys();
        
        if (!apiKeys?.openai?.apiKey || apiKeys.openai.apiKey === '') {
            console.warn('OpenAI API key not configured, using fallback');
            return this.generateFallbackResponse(input);
        }
        
        console.log('🤖 Generating AI response via local proxy...');
        
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
        
        // Use local proxy server
        const response = await fetch('/api/openai-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messages,
                model: apiKeys.openai.model || 'gpt-3.5-turbo',
                max_tokens: apiKeys.openai.maxTokens || 150,
                temperature: apiKeys.openai.temperature || 0.8,
                apiKey: apiKeys.openai.apiKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`Proxy API error: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content?.trim();
        
        if (aiResponse) {
            console.log('🤖 Local proxy generated response:', aiResponse);
            return aiResponse;
        } else {
            throw new Error('No response from local proxy');
        }
        
    } catch (error) {
        console.warn('Local proxy not available, using fallback:', error.message);
        return this.generateFallbackResponse();
    }
}
