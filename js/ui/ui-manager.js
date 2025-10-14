export class UIManager {
    constructor() {
        this.isInitialized = false;
        this.loadingScreen = null;
        this.chatInput = null;
        this.sendButton = null;
        this.chatHistory = null;
        this.maxMessages = 10;
    }

    async initialize() {
        console.log('🎨 Initializing UI Manager...');
        
        this.setupLoadingScreen();
        this.setupChatInput();
        this.setupChatHistory();
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ UI Manager initialized successfully!');
    }

    setupLoadingScreen() {
        this.loadingScreen = document.getElementById('loading-screen');
        if (!this.loadingScreen) {
            console.warn('⚠️ Loading screen not found');
        }
    }

    setupChatInput() {
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-button');
        
        if (!this.chatInput || !this.sendButton) {
            console.warn('⚠️ Chat input elements not found');
        }
    }

    setupChatHistory() {
        this.chatHistory = document.getElementById('chat-history');
        
        if (!this.chatHistory) {
            console.warn('⚠️ Chat history container not found');
            return;
        }
        
        console.log('✅ Chat history container found');
    }

    setupEventListeners() {
        // Enter key to send message
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Send button click
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }

    sendMessage() {
        if (!this.chatInput) return;
        
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        console.log('💬 Sending message:', message);
        
        // Add user message to chat history
        this.addMessage(message, true);
        
        // Clear input
        this.chatInput.value = '';
        
        // Trigger global message event
        window.dispatchEvent(new CustomEvent('sendMessage', {
            detail: { message }
        }));
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
            this.loadingScreen.classList.remove('hidden');
        }
    }

    setInputPlaceholder(placeholder) {
        if (this.chatInput) {
            this.chatInput.placeholder = placeholder;
        }
    }

    disableInput() {
        if (this.chatInput) {
            this.chatInput.disabled = true;
        }
        if (this.sendButton) {
            this.sendButton.disabled = true;
        }
    }

    enableInput() {
        if (this.chatInput) {
            this.chatInput.disabled = false;
        }
        if (this.sendButton) {
            this.sendButton.disabled = false;
        }
    }

    focusInput() {
        if (this.chatInput) {
            this.chatInput.focus();
        }
    }

    addMessage(message, isUser = false) {
        if (!this.chatHistory) {
            console.warn('⚠️ Chat history container not available');
            return;
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isUser ? 'user' : 'ai'}`;
        messageElement.textContent = message;

        // Add message to history
        this.chatHistory.appendChild(messageElement);

        // Remove old messages if we exceed the limit
        const messages = this.chatHistory.children;
        if (messages.length > this.maxMessages) {
            this.chatHistory.removeChild(messages[0]);
        }

        // Scroll to bottom
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
} 