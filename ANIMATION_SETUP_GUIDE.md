# 🎭 Animation Setup Guide

## 📋 Overview
This system organizes your character's shapekeys and animations into 5 categories for easy control.

## 🎯 5 Categories

### 1. **Mouth Movement** (Shapekeys)
Control mouth expressions and speech.

**Available Functions:**
- `setMouthMovement('mouthOpen', value)` - Open mouth
- `setMouthMovement('mouthClose', value)` - Close mouth  
- `setMouthMovement('smile', value)` - Smile
- `setMouthMovement('frown', value)` - Frown
- `setMouthMovement('pucker', value)` - Pucker lips

### 2. **Blinking** (Shapekeys)
Control eye blinking.

**Available Functions:**
- `setBlink('blinkLeft', value)` - Blink left eye
- `setBlink('blinkRight', value)` - Blink right eye
- `setBlink('blinkBoth', value)` - Blink both eyes

### 3. **Emotions** (Shapekeys)
Control facial expressions and emotions.

**Available Functions:**
- `setEmotion('happy', value)` - Happy expression
- `setEmotion('sad', value)` - Sad expression
- `setEmotion('angry', value)` - Angry expression
- `setEmotion('surprised', value)` - Surprised expression
- `setEmotion('calm', value)` - Calm expression
- `setEmotion('excited', value)` - Excited expression

### 4. **Idle Animations** (Animations)
Subtle background animations.

**Available Functions:**
- `playIdleAnimation('breathing')` - Breathing animation
- `playIdleAnimation('idle1')` - Idle animation 1
- `playIdleAnimation('idle2')` - Idle animation 2
- `playIdleAnimation('idle3')` - Idle animation 3

### 5. **Action Animations** (Animations)
Character actions and gestures.

**Available Functions:**
- `playActionAnimation('wave')` - Wave hand
- `playActionAnimation('point')` - Point gesture
- `playActionAnimation('nod')` - Nod head
- `playActionAnimation('shake')` - Shake head
- `playActionAnimation('shrug')` - Shrug shoulders

## 🎯 Setup Steps

### Step 1: Load Your Model
1. Put your GLB file in the `models/` folder
2. Update the model path in `renderer.js`
3. Refresh the page
4. Check the browser console (F12) for available assets

### Step 2: Configure Shapekeys
In the browser console, run these commands to map your shapekeys:

```javascript
// Get the animation manager
const animManager = window.heartSystem.renderer.animationManager;

// Configure mouth movements
animManager.configureShapekey('mouthMovement', 'mouthOpen', 'your_mouth_open_shapekey_name');
animManager.configureShapekey('mouthMovement', 'smile', 'your_smile_shapekey_name');

// Configure blinking
animManager.configureShapekey('blinking', 'blinkBoth', 'your_blink_shapekey_name');

// Configure emotions
animManager.configureShapekey('emotions', 'happy', 'your_happy_shapekey_name');
animManager.configureShapekey('emotions', 'sad', 'your_sad_shapekey_name');
```

### Step 3: Configure Animations
```javascript
// Configure idle animations
animManager.configureAnimation('idle', 'breathing', 'your_breathing_animation_name');
animManager.configureAnimation('idle', 'idle1', 'your_idle_animation_name');

// Configure action animations
animManager.configureAnimation('actions', 'wave', 'your_wave_animation_name');
animManager.configureAnimation('actions', 'nod', 'your_nod_animation_name');
```

### Step 4: Test Your Setup
```javascript
// Test shapekeys
animManager.setEmotion('happy', 1.0);  // Full happy expression
animManager.setBlink('blinkBoth', 1.0); // Full blink
animManager.setMouthMovement('smile', 0.5); // Half smile

// Test animations
animManager.playIdleAnimation('breathing');
animManager.playActionAnimation('wave');
```

## 🔍 Debugging

### Check Available Assets
```javascript
animManager.printAvailableAssets();
```

### Check Current Configuration
```javascript
animManager.printConfiguration();
```

### Check What's Available
The console will show:
- 📋 Available animations
- 🎭 Available shapekeys for each mesh
- 📊 Total count of each

## 💡 Tips

1. **Shapekey Values**: Use 0.0 to 1.0 (0 = off, 1 = full effect)
2. **Animation Names**: Must match exactly what's in your GLB file
3. **Mesh Names**: Shapekeys are tied to specific meshes
4. **Testing**: Start with simple values like 0.5 to see the effect

## 🎭 Example Usage

```javascript
// Make character happy and wave
animManager.setEmotion('happy', 1.0);
animManager.playActionAnimation('wave');

// Make character blink and smile
animManager.setBlink('blinkBoth', 1.0);
animManager.setMouthMovement('smile', 0.7);

// Play idle breathing
animManager.playIdleAnimation('breathing');
```

## 🚨 Troubleshooting

**"Shapekey not found"**: Check the exact name in your 3D software
**"Animation not found"**: Check the exact animation name in your GLB file
**"No shapekeys detected"**: Make sure to export shapekeys in your 3D software
**"No animations detected"**: Make sure to export animations in your 3D software 