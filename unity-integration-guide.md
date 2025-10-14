# Unity 3D Model Integration Guide

## Option 1: Unity WebGL Build (Recommended)

### Step 1: Export Unity Project
```csharp
// In Unity Editor:
// 1. File > Build Settings
// 2. Select "WebGL" platform
// 3. Player Settings > Resolution and Presentation > WebGL Template: "Minimal"
// 4. Publishing Settings > Compression Format: "Gzip" or "Brotli"
// 5. Build to: ./unity-build/
```

### Step 2: Replace Three.js Container
```html
<!-- Replace #three-container with Unity container -->
<div id="unity-container">
    <canvas id="unity-canvas" style="width: 100%; height: 100%; background: #231F20"></canvas>
    <div id="unity-loading-bar">
        <div id="unity-logo"></div>
        <div id="unity-progress-bar-empty">
            <div id="unity-progress-bar-full"></div>
        </div>
    </div>
</div>
```

### Step 3: Unity Loader Script
```javascript
// js/unity/unity-loader.js
export class UnityManager {
    constructor() {
        this.unityInstance = null;
        this.isLoaded = false;
    }

    async initialize() {
        console.log('🎮 Initializing Unity...');
        
        const container = document.getElementById('unity-container');
        const canvas = document.getElementById('unity-canvas');
        const loadingBar = document.getElementById('unity-loading-bar');
        
        const buildUrl = 'unity-build/Build';
        const loaderUrl = buildUrl + '/UnityBuild.loader.js';
        const config = {
            dataUrl: buildUrl + '/UnityBuild.data',
            frameworkUrl: buildUrl + '/UnityBuild.framework.js',
            codeUrl: buildUrl + '/UnityBuild.wasm',
            streamingAssetsUrl: 'StreamingAssets',
            companyName: 'YourCompany',
            productName: 'HEART System',
            productVersion: '1.0',
            showBanner: false,
        };

        // Load Unity
        const script = document.createElement('script');
        script.src = loaderUrl;
        document.body.appendChild(script);

        script.onload = () => {
            createUnityInstance(canvas, config, (progress) => {
                // Update loading bar
                const progressBarFull = document.getElementById('unity-progress-bar-full');
                progressBarFull.style.width = 100 * progress + '%';
            }).then((unityInstance) => {
                this.unityInstance = unityInstance;
                this.isLoaded = true;
                loadingBar.style.display = 'none';
                console.log('✅ Unity loaded successfully!');
            }).catch((message) => {
                console.error('❌ Unity failed to load:', message);
            });
        };
    }

    // Send data to Unity
    sendToUnity(gameObjectName, methodName, value) {
        if (this.isLoaded && this.unityInstance) {
            this.unityInstance.SendMessage(gameObjectName, methodName, value);
        }
    }

    // Receive data from Unity (called by Unity)
    receiveFromUnity(data) {
        console.log('📥 Received from Unity:', data);
        // Handle Unity messages here
        window.heartSystem?.handleUnityMessage(data);
    }
}

// Make Unity callback globally available
window.receiveFromUnity = (data) => {
    window.unityManager?.receiveFromUnity(data);
};
```

## Option 2: Unity as a Service (Advanced)

### Step 1: Unity Standalone Application
```csharp
// Unity C# Script: HeartSystemBridge.cs
using UnityEngine;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

public class HeartSystemBridge : MonoBehaviour 
{
    private UdpClient udpClient;
    private Thread udpListenerThread;
    private bool isListening = false;

    void Start() 
    {
        // Start UDP listener for Electron communication
        udpClient = new UdpClient(7777);
        udpListenerThread = new Thread(new ThreadStart(UDPListener));
        udpListenerThread.IsBackground = true;
        udpListenerThread.Start();
        isListening = true;
    }

    private void UDPListener() 
    {
        IPEndPoint remoteEndPoint = new IPEndPoint(IPAddress.Any, 0);
        
        while (isListening) 
        {
            try 
            {
                byte[] data = udpClient.Receive(ref remoteEndPoint);
                string message = Encoding.UTF8.GetString(data);
                
                // Handle message from Electron
                HandleElectronMessage(message);
            }
            catch (System.Exception e) 
            {
                Debug.Log("UDP Listener error: " + e.ToString());
            }
        }
    }

    private void HandleElectronMessage(string message) 
    {
        // Parse and handle different message types
        if (message.StartsWith("EMOTION:"))
        {
            string emotion = message.Substring(8);
            SetCharacterEmotion(emotion);
        }
        else if (message.StartsWith("SPEAK:"))
        {
            string text = message.Substring(6);
            TriggerSpeechAnimation(text);
        }
    }

    public void SetCharacterEmotion(string emotion)
    {
        // Update character's facial expression/animation
        Animator animator = GetComponent<Animator>();
        animator.SetTrigger(emotion);
    }

    public void TriggerSpeechAnimation(string text)
    {
        // Trigger lip sync or speech gestures
        // You could integrate with Unity's Timeline or Animation systems
    }

    // Send data back to Electron
    public void SendToElectron(string message)
    {
        try 
        {
            IPEndPoint endPoint = new IPEndPoint(IPAddress.Parse("127.0.0.1"), 7778);
            byte[] data = Encoding.UTF8.GetBytes(message);
            udpClient.Send(data, data.Length, endPoint);
        }
        catch (System.Exception e) 
        {
            Debug.Log("Send to Electron error: " + e.ToString());
        }
    }

    void OnDestroy() 
    {
        isListening = false;
        udpListenerThread?.Abort();
        udpClient?.Close();
    }
}
```

### Step 2: Electron Unity Bridge
```javascript
// js/unity/unity-service.js
import dgram from 'dgram';

export class UnityService {
    constructor() {
        this.udpClient = dgram.createSocket('udp4');
        this.udpServer = dgram.createSocket('udp4');
        this.unityPort = 7777;
        this.electronPort = 7778;
        this.isConnected = false;
    }

    async initialize() {
        console.log('🎮 Starting Unity service...');
        
        // Listen for messages from Unity
        this.udpServer.bind(this.electronPort);
        this.udpServer.on('message', (msg, rinfo) => {
            const message = msg.toString();
            this.handleUnityMessage(message);
        });

        // Launch Unity executable
        const { spawn } = await import('child_process');
        this.unityProcess = spawn('./unity-build/HeartSystem.exe', [], {
            detached: true,
            stdio: 'ignore'
        });

        this.isConnected = true;
        console.log('✅ Unity service started!');
    }

    sendToUnity(message) {
        if (this.isConnected) {
            const buffer = Buffer.from(message);
            this.udpClient.send(buffer, this.unityPort, 'localhost');
        }
    }

    handleUnityMessage(message) {
        console.log('📥 Received from Unity:', message);
        // Forward to HEART system
        window.heartSystem?.handleUnityMessage(message);
    }

    setEmotion(emotion) {
        this.sendToUnity(`EMOTION:${emotion}`);
    }

    triggerSpeech(text) {
        this.sendToUnity(`SPEAK:${text}`);
    }

    cleanup() {
        this.isConnected = false;
        this.udpClient.close();
        this.udpServer.close();
        if (this.unityProcess) {
            this.unityProcess.kill();
        }
    }
}
```

## Option 3: Unity Addressables (Cloud-based)

### Unity Addressables Setup
```csharp
// Load 3D models dynamically from cloud
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class DynamicModelLoader : MonoBehaviour 
{
    public async void LoadCharacterModel(string modelKey)
    {
        AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>(modelKey);
        GameObject model = await handle.Task;
        
        if (model != null)
        {
            Instantiate(model, transform.position, transform.rotation);
            Debug.Log($"Loaded model: {modelKey}");
        }
    }
}
```

## Integration with HEART System

### Update HeartSystem to use Unity
```javascript
// js/heart/heart.js - Replace Three.js initialization
async initializeVizComponents() {
    console.log('🎨 Initializing Unity visualization...');
    
    // Replace Three.js renderer with Unity manager
    this.unityManager = new UnityManager();
    await this.unityManager.initialize();
    
    // Or use Unity service for standalone app
    // this.unityService = new UnityService();
    // await this.unityService.initialize();
}

// Update emotion handling
updateVisualization(emotionState) {
    if (this.unityManager) {
        this.unityManager.sendToUnity('EmotionController', 'SetEmotion', emotionState.primary);
    }
    // or
    if (this.unityService) {
        this.unityService.setEmotion(emotionState.primary);
    }
}

// Handle speech
speak(text, emotion = 'neutral') {
    // Trigger Unity speech animation
    if (this.unityManager) {
        this.unityManager.sendToUnity('SpeechController', 'StartSpeech', text);
    }
    
    // Continue with existing speech synthesis
    super.speak(text, emotion);
}
```

## Pros and Cons

### Unity WebGL (Option 1)
✅ **Pros**: Easy integration, runs in browser, no separate process
❌ **Cons**: Larger file size, limited Unity features, performance constraints

### Unity Service (Option 2)  
✅ **Pros**: Full Unity features, better performance, native rendering
❌ **Cons**: More complex setup, requires Unity executable, platform-specific

### Unity Addressables (Option 3)
✅ **Pros**: Dynamic content loading, smaller initial size, cloud-based models
❌ **Cons**: Requires internet, more complex asset management

## Recommended Approach

For your HEART System, I'd recommend **Option 1 (Unity WebGL)** because:
- Seamless integration with existing Electron app
- No additional processes to manage
- Cross-platform compatibility
- Easier deployment and updates

Would you like me to implement any of these approaches?



