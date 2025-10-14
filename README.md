# HEART AI Companion System

A sophisticated AI companion system with emotional intelligence, personality-driven responses, and lifelike 3D visualization using Three.js.

## 🌟 Features

### 🧠 Core AI Logic
- **Emotion Engine**: Analyzes user input and manages emotional states
- **Personality System**: Customizable traits affecting behavior and responses
- **Thought Manager**: Generates autonomous thoughts and internal dialogue
- **Affinity Manager**: Tracks relationship development with the user
- **Speech Planner**: Generates contextual, personality-based responses
- **Memory Manager**: Stores conversation history and emotional states
- **Autonomous Loop**: Makes the AI act independently without user input

### 🎨 Visualization
- **Three.js Renderer**: 3D character rendering with cel-shading
- **Animation Manager**: Smooth character animations and transitions
- **Blendshape Manager**: Facial expressions and emotion visualization
- **Micro Movement Manager**: Subtle movements like blinking and breathing
- **Background Manager**: Dynamic, mood-based environment changes
- **Voice Manager**: Text-to-speech with ElevenLabs integration

### 🔌 Input/Output
- **Chat Interface**: Text-based conversation
- **Voice Input**: Speech recognition for hands-free interaction
- **Social Integration**: Twitter posting for autonomous thoughts
- **Screenshot Capture**: Save moments with the AI companion

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Edit `config/api-keys.json` and add your API keys:
```json
{
  "openai": {
    "apiKey": "your-openai-api-key-here"
  },
  "elevenlabs": {
    "apiKey": "your-elevenlabs-api-key-here"
  }
}
```

### 3. Customize Personality
Edit `config/personality.json` to modify the AI's personality:
```json
{
  "name": "Airi",
  "baseTraits": {
    "optimism": 0.8,
    "empathy": 0.9,
    "playfulness": 0.8
  }
}
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open in Browser
Navigate to `http://localhost:5173`

## 🎛️ Configuration

### Personality Traits
- **optimism**: How positive the AI is (0-1)
- **empathy**: Emotional sensitivity (0-1)
- **playfulness**: Fun-loving nature (0-1)
- **curiosity**: Interest in learning (0-1)
- **shyness**: Social confidence (0-1)
- **talkativeness**: How much the AI speaks (0-1)
- **energy**: Activity level (0-1)
- **formality**: Communication style (0-1)
- **intelligence**: Problem-solving ability (0-1)

### Emotions
Each emotion has:
- **intensity**: How strong the emotion is
- **blendshape**: 3D facial expression
- **voiceModifier**: Speech characteristics
- **animation**: Character movement

### Voice Settings
- **voiceId**: ElevenLabs voice ID
- **stability**: Voice consistency (0-1)
- **similarityBoost**: Voice similarity (0-1)
- **style**: Voice style (0-1)

## 🏗️ Architecture

### HEART-CORE (AI Logic)
```
emotionEngine.js      - Emotional state management
thoughtManager.js     - Autonomous thinking
affinityManager.js    - Relationship tracking
speechPlanner.js      - Response generation
autonomousLoop.js     - Independent actions
attentionSystem.js    - User engagement
memoryManager.js      - Conversation history
socialOutputMgr.js    - Social media integration
moodDrift.js         - Passive mood changes
personality.js       - Trait management
```

### HEART-VIZ (Visualization)
```
renderer.js           - Three.js scene management
animationManager.js   - Character animations
blendshapeManager.js  - Facial expressions
microMovementMgr.js  - Subtle movements
voiceManager.js       - Text-to-speech
backgroundManager.js  - Dynamic backgrounds
```

### Input/Output
```
inputManager.js       - User input handling
ui-manager.js         - Interface management
config-manager.js     - Configuration loading
```

## 🎮 Usage

### Basic Interaction
1. Type messages in the chat input at the bottom
2. The AI will respond based on its personality and current mood
3. Watch the character's expressions and animations change
4. Use the control buttons for additional features

### Control Buttons
- **📹 Video**: Toggle video features
- **🔊 Speaker**: Toggle audio output
- **🎤 Mic**: Toggle voice input
- **⚙️ Settings**: Open configuration menu

### Menu Options
- **Personality**: View and edit AI traits
- **Current Mood**: See emotional state
- **Recent Thoughts**: View autonomous thoughts
- **Settings**: Configure APIs and preferences

## 🔧 Customization

### Adding New Emotions
Edit `config/personality.json`:
```json
{
  "emotions": {
    "newEmotion": {
      "intensity": 0.7,
      "blendshape": "new_expression",
      "voiceModifier": { "pitch": 1.1, "speed": 1.0 },
      "animation": "idle_new_emotion"
    }
  }
}
```

### Modifying Personality
Adjust trait values in `config/personality.json`:
```json
{
  "baseTraits": {
    "optimism": 0.9,    // Very optimistic
    "shyness": 0.1,     // Very outgoing
    "playfulness": 0.8  // Quite playful
  }
}
```

### Custom Voice
Get a voice ID from ElevenLabs and update:
```json
{
  "voiceSettings": {
    "voiceId": "your-voice-id-here"
  }
}
```

## 🎨 3D Character

### Loading Custom Models
1. Place your GLB file in the `models/` directory
2. Update the renderer to load your model
3. Ensure your model has blendshapes for emotions

### Blendshape Names
- `happy` - Joyful expression
- `sad` - Sad expression
- `excited` - Excited expression
- `calm` - Peaceful expression
- `surprised` - Surprised expression
- `angry` - Angry expression

## 🔌 API Integration

### OpenAI (Optional)
- Used for advanced response generation
- Falls back to built-in responses if not configured

### ElevenLabs (Optional)
- Provides high-quality text-to-speech
- Falls back to browser TTS if not configured

### Twitter (Optional)
- Posts autonomous thoughts publicly
- Requires Twitter API credentials

## 🐛 Troubleshooting

### Common Issues

**Character not loading?**
- Check browser console for errors
- Ensure Three.js is properly loaded
- Verify model file path

**Voice not working?**
- Check ElevenLabs API key
- Ensure microphone permissions
- Try browser TTS fallback

**Responses not generating?**
- Check OpenAI API key
- Verify network connection
- Check browser console for errors

### Debug Mode
Open browser console to see detailed logs:
```
🚀 Initializing HEART AI Companion System...
🧠 Initializing HEART Core System...
🎨 Initializing Visualization Components...
✅ HEART System initialized successfully!
```

## 📝 Development

### Project Structure
```
├── index.html              # Main HTML file
├── styles.css              # CSS styles
├── js/
│   ├── main.js            # Application entry point
│   ├── heart/
│   │   ├── heart.js       # Main HEART system
│   │   ├── core/          # AI logic components
│   │   ├── viz/           # Visualization components
│   │   └── inputs/        # Input handling
│   └── utils/             # Utility functions
├── config/
│   ├── personality.json   # AI personality
│   ├── api-keys.json      # API configurations
│   └── heart-state.json   # Current state
└── models/                # 3D character models
```

### Adding New Features
1. Create new component in appropriate directory
2. Add initialization to main HEART system
3. Update configuration files as needed
4. Test thoroughly before deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Three.js for 3D rendering
- ElevenLabs for voice synthesis
- OpenAI for language processing
- The AI companion community for inspiration

---

**Made with ❤️ for creating meaningful AI companions** 