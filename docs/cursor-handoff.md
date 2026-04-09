# Cursor Handoff — Cute and Chibi Restaurant (doom-ctl-v2)
_Created: 2026-04-09 — for Cursor AI coding agent_

## Project Overview
**URL:** https://doom2.auto-ctl.io  
**Repo:** k4rlski/doom-ctl-v2  
**Server:** root@74.207.245.247 (doom.auto-ctl.io)  
**Stack:** Babylon.js (CDN), Node.js WS server, GLTF models  
**Full RAG:** `docs/doom-ctl-v2-rag.md`

---

## Outstanding Issues (priority order)

### 🔴 P1 — Remote players not visible to each other

**What happens:** Two players join, they can see each other's position updates in the WS server logs, but neither sees the other's character mesh.

**Root cause diagnosed (from console logs):**
```
[doom2] Cloning toca template: silie_local
```
When Player A (Toca) joins, Player B's `_otherCharRoot` (toca.glb) hasn't finished loading yet. The code correctly queues and retries (commit `535c147`), but clones are still not appearing.

**Likely remaining issue:** The clone IS created (confirmed by `Remote joined` log) but mesh has `isVisible=false` or is parented somewhere invisible. Try:

```js
// In handleRemotePlayer, after cloning:
const allMeshes = node.getChildMeshes(true); // recursive=true
allMeshes.forEach(m => {
  m.isVisible = true;
  m.setEnabled(true);
  m.visibility = 1;
  if (m.material) {
    m.material.needDepthPrePass = false;
    m.material.wireframe = false;
  }
});
console.log('[doom2] Clone meshes:', allMeshes.length, allMeshes.map(m => m.name + ':' + m.isVisible));
```

Also check: is `node.position` being set correctly? Log it after set.

**File:** `src/game.js` → `function handleRemotePlayer(msg)`  
**Test:** Open two tabs, pick different characters, both should see each other

---

### 🔴 P2 — Walking animations (most-requested feature)

**What's needed:**
1. Detect camera movement each frame (compare position to last frame)
2. If moving → start `walkAnim`, stop `idleAnim`
3. If still → start `idleAnim`, stop `walkAnim`
4. Broadcast `moving: true/false` in WS position message
5. Apply same logic to remote player clones based on their `moving` field

**Models have animations:** `result.animationGroups` — log them to find idle/walk names.

```js
// After character loads:
result.animationGroups.forEach(ag => console.log(ag.name, ag.targetedAnimations.length));
```

**File:** `src/game.js` → character loading section + `handleRemotePlayer`

---

### 🟡 P3 — Meow Cat character cloning broken

**What happens:** When a remote player picks Meow Cat, `buildMeowCat()` is called. But the procedural cat is a `TransformNode` with box/sphere children — `instantiateHierarchy` doesn't work on it, and the manual clone path may not copy the geometry correctly.

**Fix approach:** Store a pre-built Meow Cat as a reference at `window._meowTemplate`. Clone it via `getChildMeshes(false).forEach(m => m.clone(...))` ensuring all shapes are copied.

**File:** `src/game.js` → `handleRemotePlayer` Meow Cat branch

---

### 🟡 P4 — Level geometry: no outer walls on hub

All the corridor partial-walls were removed (correctly) but the hub has no outer walls — you can walk off the edge. Add simple walls at ±10 on X and Z in `buildLevel`.

---

### 🟡 P5 — kotek.glb not rendering

**What:** The voxel cat model from Goxel (`sprites/kotek.glb`, 184KB, vertex colors) loads successfully (confirmed in logs, 1 mesh) but is invisible in-game.

**Suspected:** Babylon.js doesn't auto-enable vertex colors from GLB. May need:
```js
const mat = new BABYLON.StandardMaterial('kotek', scene);
mat.vertexColorsEnabled = true;
mesh.material = mat;
// OR:
mesh.useVertexColors = true;
```

Also try: bake vertex colors into a texture in Blender before exporting.

---

### 🟢 P6 — Performance on mobile

Frame rate drops on iPhone/iPad when in Cat Café. Causes:
- `onBeforeRenderObservable.add()` called many times (cats, jump, remote players)
- No LOD (level of detail) — full mesh at all distances
- No frustum culling tuning

Quickest fix: merge all `onBeforeRenderObservable` handlers into one.

---

## Key Architecture Notes

### Character select → load flow
```
showCharacterSelect()
  → chosenCharacter = 'silie' | 'toca' | 'meow'
  → if meow: buildMeowCat() → silieRoot
  → else: SceneLoader.ImportMeshAsync(charFile) → silieRoot
  → Preload OTHER char → window._otherCharRoot
  → connectWS()
  → send {type:'player', char, fo:1.8, x,y,z} at 20Hz
```

### Remote player clone flow
```
WS message: {type:'player', id, char, x,y,z,fo}
  → handleRemotePlayer(msg)
  → if char === chosenCharacter: template = silieRoot
  → else: template = window._otherCharRoot (may be null → queue)
  → instantiateHierarchy OR manual mesh clone
  → set position: (x, y-fo, z)
```

### Floor collision system (FRAGILE — read carefully)
- `floor()` helper sets `checkCollisions=true` at creation time
- `onReadyObservable`: freeze decorations, enable gravity after 2 rAF frames
- **NEVER** call `freezeWorldMatrix()` on floors/walls — breaks collision
- See `docs/doom-ctl-v2-rag.md` → "Gravity / Collision System"

### Chat scope bug (fixed 2026-04-09)
`addChatMsg` was declared inside `init()` but called from module-scope `connectWS()`. Fixed by hoisting to module-level `let addChatMsg`.

---

## Deployment
```bash
ssh root@74.207.245.247
cd /opt/doom-ctl-v2
# edit src/game.js
node --check src/game.js   # ALWAYS check before commit
git add -A && git commit -m 'description' && git push
# No service restart needed for client changes
# Restart only if server/index.js changed:
systemctl restart doom-ctl-v2
```

## Backup
```
hiro.datacrypt.org:/opt/backups/doom-ctl-v2/doom-ctl-v2-backup-20260409.tar.gz
```
