# 🎭 Animation & Shapekey Setup Guide

## 📋 Overview

This system uses a JSON configuration file (`config/animation-config.json`) for manual setup of animations and shapekeys, with AI-powered selection for speech and interactions.

## 🎬 Configuration Structure

### Animations
```json
{
  "animations": {
    "idle": {
      "description": "Single idle animation that loops continuously",
      "animation": "idle"
    },
    "actions": {
      "description": "Action animations that AI can select from",
      "animations": [
        "dance", "jump", "fight", "Handshake", "Handwave"
      ]
    }
  }
}
```

### Shapekeys
```json
{
  "shapekeys": {
    "blinking": {
      "description": "Single blink shapekey that cycles smoothly",
      "shapekey": "Blink",
      "autoCycle": {
        "enabled": true,
        "minInterval": 2000,
        "maxInterval": 5000,
        "duration": 150
      }
    },
    "mouthMovement": {
      "description": "Mouth shapekeys for AI speech selection",
      "shapekeys": [
        "Mouth_Open", "Smile", "Frown", "Lip_Pucker"
      ]
    },
    "emotions": {
      "description": "Emotion shapekeys for AI mood selection",
      "shapekeys": [
        "Happy", "Sad", "Angry", "Surprised"
      ]
    }
  }
}
```

## 🤖 AI Selection System

### How It Works
1. **Message Analysis**: AI analyzes the input message
2. **Selection**: Chooses appropriate items from each category
3. **Application**: Applies the selections to the character

### Selection Categories
- **Actions**: Physical animations (dance, jump, wave, etc.)
- **Mouth Movement**: Speech-related shapekeys
- **Emotions**: Mood-related shapekeys

### AI Prompt
```json
{
  "aiSelection": {
    "prompt": "Based on the message: '{message}', select the most appropriate items from each category. Choose one action animation, one mouth movement shapekey, and one emotion shapekey that best fits the content and mood of the message."
  }
}
```

## 🎯 Setup Instructions

### 1. Configure Your Animations
Edit `config/animation-config.json`:

```json
{
  "animations": {
    "idle": {
      "animation": "your_idle_animation_name"
    },
    "actions": {
      "animations": [
        "your_action_1",
        "your_action_2",
        "your_action_3"
      ]
    }
  }
}
```

### 2. Configure Your Shapekeys
```json
{
  "shapekeys": {
    "blinking": {
      "shapekey": "your_blink_shapekey_name"
    },
    "mouthMovement": {
      "shapekeys": [
        "your_mouth_shapekey_1",
        "your_mouth_shapekey_2"
      ]
    },
    "emotions": {
      "shapekeys": [
        "your_emotion_shapekey_1",
        "your_emotion_shapekey_2"
      ]
    }
  }
}
```

### 3. Customize AI Selection Rules
```json
{
  "aiSelection": {
    "selectionRules": {
      "actions": "Choose action based on message content and context",
      "mouthMovement": "Choose mouth shape based on speech sounds and expression",
      "emotions": "Choose emotion based on message mood and sentiment"
    }
  }
}
```

## 🧪 Testing

### Test Page
Open `test-ai-selection.html` to test the system:

1. **Load Configuration**: See your JSON config
2. **Test AI Selection**: Enter messages and see AI choices
3. **Test Individual Systems**: Test blinking, mouth movement, emotions
4. **View Available Arrays**: See what the AI can choose from

### Example Tests
```javascript
// Test AI selection
await animationManager.testAISelection("I am happy and want to dance!");

// Test blinking
animationManager.startBlink();

// Test mouth movement
animationManager.setShapekeyByCategory('mouthMovement', 'smile', 1.0);

// Test emotions
animationManager.setShapekeyByCategory('emotions', 'happy', 1.0);
```

## 🔧 Advanced Configuration

### Blinking System
```json
{
  "blinking": {
    "autoCycle": {
      "enabled": true,
      "minInterval": 2000,  // Minimum time between blinks (ms)
      "maxInterval": 5000,   // Maximum time between blinks (ms)
      "duration": 150        // Blink duration (ms)
    }
  }
}
```

### Speech Integration
```javascript
// Start speech with AI selection
await animationManager.startSpeech(3000, "Hello, I'm happy to see you!");

// The system will:
// 1. Analyze the message
// 2. Select appropriate action, mouth movement, and emotion
// 3. Apply them to the character
// 4. Return to idle after speech ends
```

## 📊 Available Shapekeys

To see what shapekeys are available in your model:

1. Check the console logs during initialization
2. Look for: `📋 Available shapekeys: [list of shapekey names]`
3. Use these names in your JSON configuration

## 🎭 Available Animations

To see what animations are available:

1. Check the console logs during initialization  
2. Look for: `🎬 Available animations: [list of animation names]`
3. Use these names in your JSON configuration

## 🔄 Integration with Main System

The animation manager integrates with the main HEART system:

```javascript
// In your speech system
const aiSelections = await animationManager.selectAIAnimations(message);
animationManager.processAISelections(aiSelections);

// In your main loop
animationManager.updateAnimations(deltaTime);
```

## 🐛 Troubleshooting

### Common Issues

1. **Shapekey not found**: Check the exact name in your model
2. **Animation not found**: Verify animation names match your model
3. **AI not selecting**: Check the selection arrays are populated
4. **Blinking not working**: Verify blink shapekey name and autoCycle settings

### Debug Commands
```javascript
// Log current status
animationManager.logInitializationSummary();

// Check available arrays
console.log(animationManager.aiSelectionArrays);

// Test individual systems
animationManager.testAISelection("test message");
```

## 📝 Example Configuration

Here's a complete example configuration:

```json
{
  "animations": {
    "idle": {
      "description": "Single idle animation that loops continuously",
      "animation": "idle"
    },
    "actions": {
      "description": "Action animations that AI can select from",
      "animations": [
        "dance", "jump", "fight", "Handshake", "Handwave", "pray"
      ]
    }
  },
  "shapekeys": {
    "blinking": {
      "description": "Single blink shapekey that cycles smoothly",
      "shapekey": "Blink",
      "autoCycle": {
        "enabled": true,
        "minInterval": 2000,
        "maxInterval": 5000,
        "duration": 150
      }
    },
    "mouthMovement": {
      "description": "Mouth shapekeys for AI speech selection",
      "shapekeys": [
        "Mouth_Open", "Smile", "Frown", "Lip_Pucker"
      ]
    },
    "emotions": {
      "description": "Emotion shapekeys for AI mood selection",
      "shapekeys": [
        "Happy", "Sad", "Angry", "Surprised"
      ]
    }
  },
  "aiSelection": {
    "prompt": "Based on the message: '{message}', select the most appropriate items from each category.",
    "selectionRules": {
      "actions": "Choose action based on message content and context",
      "mouthMovement": "Choose mouth shape based on speech sounds and expression", 
      "emotions": "Choose emotion based on message mood and sentiment"
    }
  }
}
```

This system gives you complete manual control over your animations and shapekeys while providing intelligent AI selection for dynamic character behavior! 