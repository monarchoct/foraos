# Unity Model Import Setup Guide

## Step 1: Create New Unity Project

1. **Open Unity Hub**
2. **Click "New Project"**
3. **Select Template**: "3D (Built-in Render Pipeline)" 
4. **Project Name**: `MimicOS_Unity`
5. **Location**: `C:\Users\leon\Desktop\MimicOS_Unity`
6. **Click "Create Project"**

## Step 2: Project Folder Structure

Create this structure in your Unity project Assets folder:

```
Assets/
├── Scripts/
│   ├── Controllers/
│   └── Communication/
├── Models/
│   ├── Characters/
│   │   ├── Kira1/
│   │   ├── Kira2/
│   │   ├── AnimeTest2/
│   │   └── AnimeTest4/
├── Animations/
├── Materials/
├── Scenes/
└── StreamingAssets/
```

## Step 3: Import Your GLB Models

### Copy Models to Unity:
1. **Copy these files from your MimicOS2.0/models/ folder to Unity's Assets/Models/Characters/**:
   - `kira1.glb` → `Assets/Models/Characters/Kira1/`
   - `kira2.glb` → `Assets/Models/Characters/Kira2/`
   - `Animetest2.glb` → `Assets/Models/Characters/AnimeTest2/`
   - `Animetest4.glb` → `Assets/Models/Characters/AnimeTest4/`

### Configure Import Settings:
For each GLB file in Unity:

1. **Select the .glb file in Project window**
2. **In Inspector, configure these settings**:

   **Model Tab:**
   - ✅ Import BlendShapes (for facial expressions)
   - ✅ Import Visibility
   - ✅ Import Cameras (if needed)
   - ✅ Import Lights (if needed)
   - Scale Factor: 1 (adjust if model is too big/small)
   - Convert Units: ✅

   **Rig Tab:**
   - Animation Type: **Humanoid** (for full body animation)
   - Avatar Definition: **Create From This Model**
   - ✅ Optimize Game Objects (for better performance)

   **Animation Tab:**
   - ✅ Import Animation (if your models have animations)
   - Animation Type: **Humanoid** (same as Rig)
   - Loop Time: ✅ (for idle animations)

   **Materials Tab:**
   - Material Creation Mode: **Standard (Legacy)**
   - Material Location: **Use External Materials (Legacy)**

3. **Click "Apply" button**

## Step 4: Copy Unity Scripts

1. **Create folder**: `Assets/Scripts/Controllers/`
2. **Copy these files from MimicOS2.0/unity-scripts/ to Assets/Scripts/Controllers/**:
   - `HeartSystemController.cs`
   - `EmotionController.cs`
   - `SpeechAnimationController.cs`
   - `LightingController.cs`

## Step 5: Scene Setup

### Create Main Scene:
1. **File > New Scene**
2. **Save as**: `Assets/Scenes/MainScene.unity`

### Add GameObjects to Scene:
1. **Create Empty GameObject** → Rename to "HeartSystemController"
2. **Add Component** → HeartSystemController script
3. **Drag one of your character models** from Project to Scene
4. **Position character at (0, 0, 0)**

### Configure HeartSystemController:
1. **Select HeartSystemController GameObject**
2. **In Inspector, drag references**:
   - Character Animator: Your character's Animator component
   - Character Renderer: Your character's SkinnedMeshRenderer  
   - Character Root: Your character's root Transform
   - Character Models: Drag all your character prefabs here

## Step 6: Create Animator Controller

1. **Right-click in Project** → Create → Animator Controller
2. **Name it**: "CharacterController"
3. **Assign to character's Animator component**

### Add States:
- Idle (default state)
- Happy
- Sad  
- Angry
- Surprised
- Excited
- Neutral

### Add Parameters:
- **Triggers**: happy, sad, angry, surprised, excited, neutral
- **Float**: EmotionIntensity (0-1)
- **Bool**: Loop

### Add Transitions:
- **Any State → Each Emotion State** (use triggers)
- **Each Emotion State → Idle** (exit time or neutral trigger)

## Step 7: Test in Unity Editor

1. **Press Play button**
2. **Check Console for any errors**
3. **In HeartSystemController Inspector**, test emotion changes
4. **Verify character animates properly**

## Step 8: Build for WebGL

### Configure Build Settings:
1. **File > Build Settings**
2. **Platform**: WebGL
3. **Add Open Scenes**: Add MainScene
4. **Player Settings**:
   - Company Name: "MimicOS"
   - Product Name: "HEART System"
   - **WebGL Settings**:
     - Template: Minimal
     - Compression Format: Brotli
     - Memory Size: 512 MB
   - **Publishing Settings**:
     - ✅ Data caching
     - ✅ Decompression Fallback

### Build:
1. **Set build folder**: `C:\Users\leon\Desktop\MimicOS2.0\unity-build\`
2. **Click "Build"**

## Troubleshooting Common Issues

### Model Import Problems:
- **Model appears black**: Check materials and lighting
- **Model too big/small**: Adjust Scale Factor in Model import settings
- **No animations**: Make sure Animation Type is set to Humanoid
- **Facial expressions not working**: Ensure Import BlendShapes is checked

### Animation Issues:
- **Character not animating**: Check Animator Controller is assigned
- **Transitions not working**: Verify trigger names match exactly
- **Animations look wrong**: Check Animation Type is Humanoid

### Build Issues:
- **Build fails**: Check Console for specific error messages
- **Large file size**: Use Brotli compression, optimize textures
- **Slow loading**: Reduce texture sizes, optimize models

## Next Steps

After successful build:
1. Update your Electron app to load Unity instead of Three.js
2. Test Unity-Electron communication
3. Verify all emotion states work correctly
4. Test model switching functionality

Let me know if you encounter any specific issues during this process!


