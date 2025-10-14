# Unity GLB Import Troubleshooting Guide

## Common GLB Import Issues and Solutions

### Issue 1: GLB Files Not Showing Up in Unity

**Symptoms:**
- Copied GLB files to Assets folder but they don't appear
- Files show as "unknown" type in Unity

**Solutions:**
1. **Check Unity Version**: Make sure you're using Unity 2021.3 LTS or newer (has better GLB support)
2. **Refresh Assets**: Right-click in Project window → Refresh
3. **Reimport**: Right-click GLB file → Reimport
4. **File Path**: Ensure no special characters in file path or name

### Issue 2: Import Errors in Console

**Common Error Messages and Fixes:**

**"Failed to load model"**
```
Solution: Check if GLB file is corrupted
- Try opening in Blender or online GLB viewer first
- Re-export from original source if needed
```

**"Animation import failed"**
```
Solution: In Import Settings:
- Model Tab: Uncheck "Import Animation" if not needed
- Or Animation Tab: Set Animation Type to "None" temporarily
```

**"Rig import failed"**
```
Solution: In Import Settings:
- Rig Tab: Try "Generic" instead of "Humanoid"
- Or set to "None" if no animation needed
```

### Issue 3: Model Appears Black/No Materials

**Symptoms:**
- Model imports but appears completely black
- Materials missing or not applied

**Solutions:**
1. **Material Import Settings:**
   ```
   Materials Tab:
   - Material Creation Mode: "Standard (Legacy)"
   - Material Location: "Use External Materials (Legacy)"
   - Click "Extract Materials" button
   ```

2. **Manual Material Fix:**
   - Create new Material in Project
   - Assign to model's MeshRenderer component
   - Set Albedo color to white or desired color

3. **Lighting Check:**
   - Add Directional Light to scene if missing
   - Window → Rendering → Lighting Settings → Generate Lighting

### Issue 4: Model Scale Issues

**Symptoms:**
- Model too big/small when imported
- Model not visible in scene

**Solutions:**
1. **Import Scale:**
   ```
   Model Tab:
   - Scale Factor: Try 0.01, 0.1, 1, or 10
   - Convert Units: Check/uncheck
   - Apply changes
   ```

2. **Scene Scale:**
   - Select model in scene
   - Set Transform Scale to (1, 1, 1)
   - Adjust Camera distance instead

### Issue 5: Blend Shapes Not Working

**Symptoms:**
- Facial expressions/morph targets missing
- SkinnedMeshRenderer shows 0 blend shapes

**Solutions:**
1. **Import Settings:**
   ```
   Model Tab:
   - ✅ Import BlendShapes
   - ✅ Import Visibility
   - Apply changes
   ```

2. **Check Original Model:**
   - Verify GLB has blend shapes in Blender
   - GLB export settings should include morph targets

### Issue 6: Rigging/Animation Issues

**Symptoms:**
- "Avatar creation failed" error
- Character doesn't animate properly

**Solutions:**
1. **Humanoid Setup:**
   ```
   Rig Tab:
   - Animation Type: "Humanoid"
   - Avatar Definition: "Create From This Model"
   - Configure → Check bone mapping
   ```

2. **Generic Setup (Alternative):**
   ```
   Rig Tab:
   - Animation Type: "Generic"
   - Avatar Definition: "Create From This Model"
   - Root node: Select character root bone
   ```

## Step-by-Step Import Process

### 1. Prepare Unity Project
```
1. Create new 3D project
2. Create folder structure:
   Assets/
   ├── Models/
   ├── Materials/
   ├── Scripts/
   └── Scenes/
```

### 2. Import GLB Files
```
1. Copy your GLB files to Assets/Models/
2. Select GLB file in Project window
3. In Inspector, configure import settings:

   MODEL TAB:
   - Scale Factor: 1
   - ✅ Import BlendShapes
   - ✅ Import Visibility
   - ✅ Import Cameras (if needed)
   - ✅ Import Lights (if needed)

   RIG TAB:
   - Animation Type: Humanoid
   - Avatar Definition: Create From This Model
   - ✅ Optimize Game Objects

   MATERIALS TAB:
   - Material Creation Mode: Standard (Legacy)
   - Material Location: Use External Materials (Legacy)

4. Click APPLY
5. If errors occur, try Generic rig type instead
```

### 3. Extract Materials (if needed)
```
1. Select GLB file
2. Materials Tab → Extract Materials
3. Choose folder to save materials
4. Materials will be created as separate assets
```

### 4. Test in Scene
```
1. Drag GLB prefab to scene
2. Position at (0, 0, 0)
3. Add Directional Light if scene is dark
4. Play scene to test
```

## Specific Fixes for Your Models

### For kira1.glb and kira2.glb:
```
These are likely character models, so use:
- Animation Type: Humanoid
- Import BlendShapes: ✅ (for facial expressions)
- Scale Factor: Try 0.01 or 0.1 first
```

### For Animetest2.glb and Animetest4.glb:
```
These might need:
- Scale Factor: 1 or 0.1
- Check if they have animations
- Generic rig type might work better
```

## Debug Commands

### Check Import Status:
1. Select GLB file
2. Look at Inspector bottom for import messages
3. Console window shows detailed errors

### Test Model Structure:
```csharp
// Add this script to test model components
public class ModelDebugger : MonoBehaviour 
{
    void Start() 
    {
        SkinnedMeshRenderer smr = GetComponentInChildren<SkinnedMeshRenderer>();
        if (smr != null) 
        {
            Debug.Log($"Blend shapes: {smr.sharedMesh.blendShapeCount}");
            Debug.Log($"Bones: {smr.bones.Length}");
        }
        
        Animator anim = GetComponent<Animator>();
        if (anim != null) 
        {
            Debug.Log($"Has avatar: {anim.avatar != null}");
            Debug.Log($"Is human: {anim.isHuman}");
        }
    }
}
```

## Still Having Issues?

**Tell me exactly:**
1. What Unity version are you using?
2. What error messages do you see in Console?
3. What happens when you drag the GLB to the scene?
4. Do the models work in other applications (Blender, online viewers)?
5. What are the file sizes of your GLB models?

**Send screenshots of:**
- Unity Console errors
- Import settings Inspector
- The model in scene view (if it appears at all)

This will help me give you more specific solutions!


