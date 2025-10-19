# 🎭 Animation System Test Guide

## 🎯 How the System Works

### **1. Speech-Driven Animation System**
The system automatically handles different behaviors based on speech state:

- **Mouth Movement**: Oscillates 0→1→0 during speech
- **Blinking**: Continuous random blinking (always active)
- **Emotions**: Rise during speech, fade after speech
- **Idle**: Random animations with smooth transitions
- **Actions**: 30% chance during speech, with timing controls

### **2. AI-Driven Selection**
The AI gets arrays of available options and selects from them:

```javascript
// AI gets these arrays to choose from:
{
  mouthMovement: ["mouthOpen", "smile", "frown", "pucker"],
  emotions: ["happy", "sad", "angry", "surprised", "calm", "excited"],
  actions: ["wave", "point", "nod", "shake", "shrug"]
}
```

## 🎯 Test Commands

### **Step 1: Get the Animation Manager**
```javascript
const animManager = window.heartSystem.renderer.animationManager;
```

### **Step 2: Configure Your Shapekeys/Animations**
```javascript
// Configure mouth movements
animManager.configureShapekey('mouthMovement', 'mouthOpen', 'your_mouth_open_shapekey');
animManager.configureShapekey('mouthMovement', 'smile', 'your_smile_shapekey');

// Configure emotions
animManager.configureShapekey('emotions', 'happy', 'your_happy_shapekey');
animManager.configureShapekey('emotions', 'sad', 'your_sad_shapekey');

// Configure actions
animManager.configureAnimation('actions', 'wave', 'your_wave_animation');
animManager.configureAnimation('actions', 'nod', 'your_nod_animation');
```

### **Step 3: Test Speech System**
```javascript
// Start speech with AI selections
animManager.startSpeech(5000, {
    mouthMovement: 'mouthOpen',
    emotion: 'happy',
    action: 'wave'
});

// Stop speech
animManager.stopSpeech();
```

### **Step 4: Check Available Selections**
```javascript
// See what the AI can choose from
console.log(animManager.getAvailableSelections());
```

## 🎯 Expected Behaviors

### **During Speech (5 seconds):**
- ✅ **Mouth**: Oscillates between open/closed
- ✅ **Emotion**: Rises to full, holds, then fades
- ✅ **Action**: 30% chance to trigger wave gesture
- ✅ **Blinking**: Continues randomly
- ✅ **Idle**: Continues with random animations

### **After Speech:**
- ✅ **Mouth**: Returns to 0 (closed)
- ✅ **Emotion**: Fades to 0
- ✅ **Action**: Stops
- ✅ **Blinking**: Continues
- ✅ **Idle**: Continues

## 🎯 Customization

### **Adjust Behaviors:**
```javascript
// Make actions more frequent
animManager.behaviors.actions.triggerChance = 0.5; // 50% chance

// Make blinking faster
animManager.behaviors.blinking.minInterval = 1000; // 1 second
animManager.behaviors.blinking.maxInterval = 3000; // 3 seconds

// Make emotions fade slower
animManager.behaviors.emotions.fadeOut = 2.0; // 2 seconds
```

### **Add Your Own Categories:**
```javascript
// Add new shapekey category
animManager.addShapekeyCategory('hairMovement', 'Control hair physics', {
    hairWave: { description: "Hair wave", defaultValue: 1.0 },
    hairBounce: { description: "Hair bounce", defaultValue: 1.0 }
});

// Add new animation category
animManager.addAnimationCategory('dance', 'Dance animations', {
    spin: { description: "Spin", defaultValue: null },
    jump: { description: "Jump", defaultValue: null }
});
```

## 🎯 Integration with AI

### **For the AI System:**
1. **Get available selections**: `animManager.getAvailableSelections()`
2. **Start speech**: `animManager.startSpeech(duration, aiSelections)`
3. **Stop speech**: `animManager.stopSpeech()`

### **Example AI Integration:**
```javascript
// AI decides what to do
const aiSelections = {
    mouthMovement: 'smile',    // AI chose smile
    emotion: 'happy',          // AI chose happy emotion
    action: 'wave'             // AI chose wave gesture
};

// Start speech with AI choices
animManager.startSpeech(3000, aiSelections); // 3 seconds

// Stop when done
setTimeout(() => {
    animManager.stopSpeech();
}, 3000);
```

## 🎯 Debug Commands

```javascript
// Check current state
console.log(animManager.speechState);

// Check behaviors
console.log(animManager.behaviors);

// Check active animations
console.log(animManager.activeAnimations);

// Print full configuration
animManager.printConfiguration();
```

## 🎯 Troubleshooting

**"No animations playing"**: Check if animations are configured
**"Shapekeys not working"**: Check if shapekeys are mapped correctly
**"Speech not starting"**: Make sure duration is in milliseconds
**"AI selections not working"**: Check if selections match available arrays

The system is now fully automated and AI-driven! 🎭✨ 