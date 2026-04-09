# NPC Cat System — doom-ctl-v2
_Last updated: 2026-04-09_

## Current State

**Active NPC cats:** 4 roaming voxel koteks (`kotek.glb`)  
**Saved procedural cats:** `docs/saved-cats.js` (not deleted, just archived)  

---

## The Voxel Kotek (current default)

**File:** `sprites/kotek.glb` — 184KB  
**Source:** Free model made in Goxel (open source voxel editor), ASCII OBJ format  
**Converted via:** Blender 4.0 with vertex color material → GLB  
**Safety:** 100% clean — plain geometry + RGB vertex colors, no scripts, no textures

### How it works
```js
BABYLON.SceneLoader.ImportMeshAsync('', 'sprites/', 'kotek.glb', scene).then(r => {
  const kr = r.meshes.find(m => !m.parent) || r.meshes[0];
  
  // Scale to ~35cm
  const kH = maxY - minY;
  kr.scaling.setAll(0.35 / kH);
  
  // Enable vertex colors (Goxel bakes color into vertices)
  r.meshes.forEach(m => {
    if (m.material) m.material.vertexColorsEnabled = true;
  });
  
  // Position on floor, bob animation, roam AI, meow sounds
});
```

### 4 spawn positions
```js
const catStartPositions = [
  [5, 0, 5],      // hub, right of spawn
  [-5, 0, -5],    // hub, left of spawn
  [-8, 0, -50],   // inside Cat Café
  [8, 0, -50],    // inside Cat Café
];
```

### Vertex colors
Goxel exports per-vertex RGB in the OBJ `v` lines (4th/5th/6th floats).
Blender reads these correctly and bakes them into the GLB as a color attribute.
Babylon.js needs `m.material.vertexColorsEnabled = true` to display them.

---

## Saved Procedural Cats (archived, not active)

**File:** `docs/saved-cats.js`

Three procedural cat styles were built using pure Babylon.js geometry — no file needed:

| Cat | Fur color | Accent | Special |
|-----|-----------|--------|---------|
| Orange Tabby | `[0.88, 0.52, 0.15]` | dark brown | M forehead, white chest, banded tail, cheek stripes, white paw tips |
| Grey | `[0.85, 0.85, 0.85]` | mid-grey | Basic cartoon cat |
| Dark | `[0.15, 0.12, 0.1]` | brown | Basic cartoon cat |
| Cream | `[0.9, 0.85, 0.7]` | tan | Basic cartoon cat |

### Orange Tabby special features (tabbyMode=true)
- **M-marking** on forehead: 3 raised ridges + horizontal bar (classic tabby forehead)
- **White chest/belly patch**: oval sphere on front of body
- **White chin**: small sphere under muzzle
- **Cheek stripes**: 2 dark dashes each side
- **Banded tail**: 4 alternating dark/orange torus rings
- **White paw tips**: flat spheres on all 4 feet

### Anatomy of buildCartoonCat()
```js
function buildCartoonCat(scene, name, furColor, accentColor, tabbyMode) {
  const root = new BABYLON.TransformNode(name, scene);
  const S = 0.38; // ~38cm height
  
  // Body: oval sphere (diameterX > diameterY)
  // Head: rounder sphere
  // Muzzle: 2 small white spheres
  // Nose: small pink-red sphere
  // Eyes: white sclera + vertical black pupil + white catchlight
  // Ears: triangular cones (outer fur + inner pink)
  // Legs: 4 cylinders with oval white paws
  // Tail: torus + sphere tip
  // Stripes: 3 box-shaped markings on back
  // tabbyMode extras: M mark, white patches, cheek stripes, banded tail, white paw tips
  
  // Bob animation: sin wave on Y position
}
```

---

## How to Restore Procedural Cats

### Quick restore (replace kotek with procedural cats)

1. Copy `buildCartoonCat` back into `src/game.js` at module scope (before `connectWS`):
```bash
# On doom server:
cat docs/saved-cats.js
# Copy the function into src/game.js
```

2. Update `spawnRoamingCats` to use `buildCartoonCat`:
```js
const catColors = [
  [[0.88, 0.52, 0.15], [0.42, 0.18, 0.02], true],  // orange tabby
  [[0.85, 0.85, 0.85], [0.5, 0.5, 0.5],   false],  // grey
  [[0.15, 0.12, 0.1],  [0.35, 0.28, 0.2], false],  // dark
  [[0.9, 0.85, 0.7],   [0.6, 0.45, 0.25], false],  // cream
];
const [fur, accent, tabbyMode] = catColors[i % catColors.length];
const cat = buildCartoonCat(scene, 'npc_cat_' + i, fur, accent, tabbyMode);
cat.position.set(...startPos);
cat._baseY = startPos[1];
```

3. Check syntax and commit:
```bash
node --check src/game.js
git add -A && git commit -m 'restore: procedural cartoon cats' && git push
```

### Mix kotek + procedural cats

```js
catStartPositions.forEach((startPos, i) => {
  if (i === 0) {
    // Kotek for cat 0
    BABYLON.SceneLoader.ImportMeshAsync('', 'sprites/', 'kotek.glb', scene).then(...);
  } else {
    // Procedural for others
    const cat = buildCartoonCat(scene, 'npc_cat_' + i, fur, accent, tabbyMode);
  }
});
```

---

## Adding More Cat Models

### From OBJ (Goxel, MagicaVoxel, etc.)
1. Drop `.obj` file in `/tmp/`
2. Convert via Blender:
```python
# /tmp/convert_cat.py
import bpy, os
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath='/tmp/mycat.obj')
# Apply vertex color material if needed
bpy.ops.export_scene.gltf(filepath='/tmp/mycat.glb', export_format='GLB',
  export_apply=True, export_colors=True)
print(os.path.getsize('/tmp/mycat.glb'))
```
3. `scp /tmp/mycat.glb root@74.207.245.247:/opt/doom-ctl-v2/sprites/`
4. Load in `spawnRoamingCats` like kotek

### From GLB directly (Sketchfab, etc.)
Same as above but skip step 2 — just scp the GLB directly.

### Recommended free 3D cat sources
- **Sketchfab.com** — search "low poly cat" → filter Free → Download GLB
- **Quaternius (quaternius.com)** — free low-poly animal packs, GLB/FBX
- **Kenney.nl** — cartoon animal packs, free, GLB available

---

## Meow Sound System

**Current:** Synthesized via Web Audio API (no file)  
**Alternative:** `sprites/meow.mp3` (real recording) was previously used

### To switch back to MP3:
Replace `playMeow()` in `spawnRoamingCats` with:
```js
function playMeow() {
  if (!window._meowUnlocked) return;
  const m = new Audio('sprites/meow.mp3');
  m.volume = 0.55 + Math.random() * 0.3;
  m.playbackRate = 0.88 + Math.random() * 0.24;
  m.play().catch(() => {});
}
```
And add unlock logic:
```js
const meowAudio = new Audio('sprites/meow.mp3');
const unlock = () => { window._meowUnlocked = true; meowAudio.play().then(()=>meowAudio.pause()).catch(()=>{}); };
document.addEventListener('click', unlock, {once:true});
```

### Chat commands
- `/meow` — unmute (`window._meowEnabled = true`)
- `/no-meow` — mute (`window._meowEnabled = false`)

---

## Performance Notes

- **kotek.glb** loads 4 times (one per cat) — 4 × 184KB = ~736KB network
- Each load is async, spawned after `setTimeout(2000)` on game start
- If performance is an issue, load once and `instantiateHierarchy()` for clones
- Procedural cats: zero network cost, ~200 meshes total, `freezeWorldMatrix` eligible
