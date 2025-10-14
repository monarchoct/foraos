# Unity Project Setup for HEART System

## Step 1: Create Unity Project

1. **Open Unity Hub**
2. **Click "New Project"**
3. **Select Template**: "3D (Built-in Render Pipeline)" or "3D (URP)" 
4. **Project Name**: `HeartSystem3D`
5. **Location**: Choose a folder (e.g., `C:\Unity\HeartSystem3D`)
6. **Click "Create Project"**

## Step 2: Project Structure Setup

Create this folder structure in your Unity project:

```
Assets/
├── Scripts/
│   ├── Controllers/
│   │   ├── HeartSystemController.cs
│   │   ├── EmotionController.cs
│   │   ├── SpeechAnimationController.cs
│   │   └── LightingController.cs
│   ├── Communication/
│   │   └── WebGLBridge.cs
│   └── Utils/
├── Models/
│   ├── Characters/
│   │   ├── Kira/
│   │   └── Default/
│   └── Props/
├── Animations/
│   ├── Emotions/
│   ├── Speech/
│   └── Gestures/
├── Materials/
│   ├── Character/
│   └── Environment/
├── Scenes/
│   └── MainScene.unity
└── StreamingAssets/
```

## Step 3: Import Character Model

### Option A: Use Unity's Built-in Character
1. **Window > Package Manager**
2. **Search for "Starter Assets - Third Person"**
3. **Install** (gives you a basic character)

### Option B: Import Your Existing Models
1. **Copy your .glb files** from `MimicOS2.0/models/` to `Assets/Models/Characters/`
2. **Select the .glb file** in Unity
3. **In Inspector**:
   - **Model Tab**: Check "Import BlendShapes" (for facial expressions)
   - **Rig Tab**: Animation Type = "Humanoid"
   - **Animation Tab**: Import any animations
   - **Click "Apply"**

### Option C: Download Free Character
1. **Unity Asset Store** (Window > Asset Store)
2. **Search**: "Free Character" or "RPG Character"
3. **Download and Import** a character you like

## Step 4: Scene Setup

### Create Main Scene:
1. **File > New Scene**
2. **Save as**: `Assets/Scenes/MainScene.unity`

### Add Essential GameObjects:
```
MainScene
├── Main Camera (default position: 0, 1.6, 4)
├── Directional Light (default lighting)
├── Character
│   └── [Your imported character model]
├── Controllers
│   └── HeartSystemController (Empty GameObject)
├── Lighting
│   ├── Key Light (Directional Light)
│   ├── Fill Light (Directional Light, lower intensity)
│   └── Rim Light (Directional Light, behind character)
└── Environment (optional)
    └── Ground Plane
```

## Step 5: Add Scripts to GameObjects

### HeartSystemController Setup:
1. **Create Empty GameObject** named "HeartSystemController"
2. **Add Component > HeartSystemController script**
3. **In Inspector**, drag references:
   - **Character Animator**: Your character's Animator component
   - **Character Renderer**: Your character's SkinnedMeshRenderer
   - **Character Root**: Your character's root transform

### Character Setup:
1. **Select your character**
2. **Add Component > Animator** (if not already present)
3. **Create Animator Controller**: 
   - Right-click in Project > Create > Animator Controller
   - Name it "CharacterController"
   - Assign to character's Animator component

## Step 6: Create Animator Controller

### Emotion States:
1. **Open Animator Controller**
2. **Create States**:
   - Idle
   - Happy
   - Sad
   - Angry
   - Surprised
   - Excited
   - Neutral

### Parameters:
- **Triggers**: Happy, Sad, Angry, Surprised, Excited, Neutral
- **Bool**: Loop
- **Float**: EmotionIntensity

### Transitions:
- **Any State → Emotion States** (triggered by emotion triggers)
- **Emotion States → Idle** (exit time or trigger)

## Step 7: WebGL Build Settings

### Configure for WebGL:
1. **File > Build Settings**
2. **Platform**: WebGL
3. **Add Open Scenes**: Add your MainScene
4. **Player Settings**:
   - **Company Name**: "HEART System"
   - **Product Name**: "AI Companion"
   - **WebGL Settings**:
     - **Template**: Minimal
     - **Compression Format**: Brotli (smaller file size)
   - **Publishing Settings**:
     - **Memory Size**: 512 MB (or higher if needed)
   - **Resolution and Presentation**:
     - **Default Canvas Width**: 1920
     - **Default Canvas Height**: 1080
     - **Run In Background**: ✓

### Build Location:
- **Set build folder**: `C:\Users\leon\Desktop\MimicOS2.0\unity-build\`
- **Click "Build"**

## Step 8: Test Integration

### After building:
1. **Copy build files** to your MimicOS project
2. **Update** `js/unity/unity-manager.js` with correct paths
3. **Replace Three.js** initialization with Unity initialization
4. **Test** in your Electron app

## Step 9: Development Workflow

### For testing and iteration:
1. **Make changes** in Unity
2. **Build to WebGL** (File > Build Settings > Build)
3. **Refresh** your Electron app
4. **Test** the changes

### For debugging:
1. **Use Unity Console** for Unity-side debugging
2. **Use Browser DevTools** for WebGL debugging
3. **Use Electron DevTools** for integration debugging



