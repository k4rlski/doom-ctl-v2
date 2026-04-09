# doom-ctl-v2 RAG — Architecture & Development Reference
_Last updated: 2026-04-09_

## Overview
doom-ctl-v2 is a browser-based 3D multiplayer game built with Babylon.js + WebGL.
It lives alongside doom-ctl v1 (raycaster) on the same server.

**Live:** https://doom2.auto-ctl.io  
**Server:** doom.auto-ctl.io — 74.207.245.247 (Linode Dedicated, Ubuntu 24.04)  
**Repo:** k4rlski/doom-ctl-v2  
**Service:** `systemctl restart doom-ctl-v2` (WS server on port 3667)  
**Deploy:** edit files on server → `git add -A && git commit && git push`  

---

## File Structure
```
/opt/doom-ctl-v2/
  index.html          — entry point, Babylon.js CDN, loading screen, char select
  src/game.js         — entire client engine (~1700 lines)
  server/index.js     — WebSocket server (port 3667)
  config/doom-ctl.yml — credentials (gitignored)
  sprites/
    silie.glb         — Silie character (40 meshes, Blender Y-up export)
    toca.glb          — Toca Prin-Wolf (61 meshes, Blender Y-up export)
    meow.mp3          — real cat meow sound (64KB)
    nyan-cat.jpg      — Meow Cat character select card image
    kpop-poster.jpg   — K-pop poster wall decoration
  docs/
    doom-ctl-v2-rag.md — this file
```

---

## Engine Architecture (src/game.js)

### Module structure (IIFE)
```
DOOM2 = (() => {
  // Module-level state
  let chosenCharacter, scene_ref, silieRoot, remotes, ws, myId

  function buildMeowCat(scene, name)        // procedural cat model
  function buildCartoonCat(scene, name, fur, accent, tabbyMode)  // NPC cat
  function connectWS()                      // WebSocket connection + reconnect
  function handleRemotePlayer(msg)          // clone char for new remote player
  function removeRemotePlayer(id)           // dispose remote player mesh

  async function init() {
    showCharacterSelect()    // blocks until player picks character
    // Engine + scene setup
    // Camera (UniversalCamera, WASD, gravity, ellipsoid collision)
    // Lighting
    // buildLevel(scene)      // all geometry
    // buildCatCafe(scene)    // Cat Café + outdoor patio
    // Load chosen character GLB (or build Meow Cat procedurally)
    // Preload other character for remote player cloning
    // connectWS()
    // Chat bar (DOM)
    // HUD (DOM)
    // Touch controls (if touch device)
    // Roaming NPC cats + meow sounds
    // scene.onReadyObservable → set collisions, freeze decorations, enable gravity
    // engine.runRenderLoop
  }

  window.addEventListener('load', init)
})()
```

### Key constants
- `WS_TOKEN` — auth token (matches config/doom-ctl.yml)
- `myId` — `'p2_' + random 5-char` — unique per session
- Eye height: 1.82m (camera Y at floor level)

---

## Characters

### Silie
- File: `sprites/silie.glb` (8.4MB, Blender Y-up GLB export from FBX)
- Auto-scaled to 1.8m via per-mesh BoundingInfo
- Floor-aligned: `root.position.y = -minY2`
- First animationGroup started on load (if present)

### Toca Prin-Wolf
- File: `sprites/toca.glb` (21MB, Blender Y-up GLB export from FBX)
- Same scaling/positioning logic as Silie
- Karl's character

### Meow Cat (procedural)
- No GLB — built in `buildMeowCat(scene, name)`
- Pop-Tart body (pink box) + grey cat head + ears + eyes + rainbow tail stripes
- Scale: 0.54m (30% of 1.8m)
- Bob animation (sin wave on Y)
- Karl's playable character

### NPC Cartoon Cats (4 roaming)
- Built in `buildCartoonCat(scene, name, furColor, accentColor, tabbyMode)`
- Full cat anatomy: oval body, round head, triangular ears, 4 legs, paws, banded tail, stripes
- `tabbyMode=true` (cat #0): adds M forehead, white chest/chin, cheek stripes, banded tail rings, white paw tips
- Colors: orange tabby, grey, dark brown, cream
- Scale: 0.38m (slightly smaller than Meow Cat)
- Roam AI: pick waypoint → move toward it → pause → pick new waypoint
- Meow: `meow.mp3` cloneNode(), random volume + playbackRate per meow
- Positions: hub [5,0,5], hub [-5,0,-5], café [-8,0,-50], café [8,0,-50]

---

## Level Geometry (buildLevel)

### Coordinate system
- Hub centre: (0, 0, 0)
- Y=0 is floor level, Y=4 is ceiling
- Positive Z = north, negative Z = south

### Rooms
| Room | Centre | Size | Notes |
|------|--------|------|-------|
| Hub | (0,0,0) | 20×20 | Entry point, spawn |
| Room B | (0,0,36) | 18×18 | North chamber, TOCA PRINWOLF sign |
| Room C | (0,0,-36) | 18×18 | South chamber, leads to café |
| Room D | (36,0,0) | 18×18 | East chamber |
| Room E | (-36,0,0) | 18×18 | West chamber |
| Room F | (14,0,-34) | 16×16 | Southeast chamber, diagonal corridor |
| Cat Café | (0,0,-50) | 28×28 | Full café, 4.5m ceiling |
| Outdoor Patio | (0,0,-62) | 28×24 | Open air, leads to grass |

### Corridors
All corridors are 6 units wide, 4m tall. Walls removed — open floor plan.

### Floor convention
All floors at Y=0 except:
- Café floor: Y=0.005 (avoids z-fighting)
- Patio floor: Y=0.005
- Grass: Y=0.006

### Collision prefixes (structural only)
`hub_floor, hub_ceil, corr_, roomA, roomB, roomC, roomD, roomE, roomF, cafeFloor, cafeW_, cafeCon, cafeConn, cafCorr, patio, patioW`

Decorative meshes are frozen with `freezeWorldMatrix()` — do NOT add these to collision list.

---

## Cat Café (buildCatCafe)

### Layout
- **North wall:** CAT CAFE DynamicTexture neon sign (pink glow, faces south)
- **Bakery counter** (against north wall): glass case, marble top, 2 display shelves
  - Bottom shelf: 5× croissants + muffins
  - Top shelf: red velvet cake, chocolate cake, 3 donuts, lemon tart
  - Coffee machine with steam, 5 coffee cups + saucers
- **9 café tables** (3×3 grid): marble tops, dark wood legs, pink cushions, 2 chairs each
- **String lights**: emissive spheres + 3 point lights
- **Chalk menu board** (east wall, faces west): 8 menu items
- **4 potted plants** in corners

### Outdoor Patio
- **Sky dome**: large sphere, BACKSIDE render, emissive blue, `disableLighting=true`
- **Sun**: sphere + PointLight (warm yellow, range 200)
- **3 cloud clusters**: 2 spheres each, isPickable=false
- **Stone floor** + grass field
- **5 patio tables** with coloured umbrellas (alternating red/blue)
- **Flower planters** + 4 trees with layered canopy
- **Zigzag string lights** + 2 outdoor point lights

---

## Multiplayer (WebSocket)

### Server (server/index.js, port 3667)
- Auth: token in query string on connect
- Message types:
  - `player` → broadcastExcept: `{type, id, x, y, z, angle, char, fo}`
  - `chat` → broadcastAll: `{type, id, char, text}`
  - `player_left` → broadcastExcept on disconnect
- Stores `ws._playerId` and `ws._playerChar` per connection

### Client position message
```js
{ type:'player', id:myId, x, y, z, char:chosenCharacter, fo:window._myFloorOffset, token }
```
Sent at 20Hz (50ms interval).

### Remote player rendering
1. On first `player` message from new id → clone character mesh
2. `char === 'meow'` → `buildMeowCat()` fresh instance
3. Other chars → `template.instantiateHierarchy()` (preserves FBX hierarchy)
4. Position: `node.position.y = (msg.y - msg.fo)` (subtract sender's floor offset)
5. Pruned after 5s of no updates

### Floor offset (fo)
Each player broadcasts `window._myFloorOffset` (= `minY2` from bounding box scan).
Remote players use this to place the character's feet on the floor correctly.
Without it, Toca (taller model) appears floating.

---

## Chat System

### UI
- Fixed bar at bottom of screen (DOM, not Babylon GUI)
- **T** → focus input, **Enter** → send, **Esc** → blur
- Space bar does not jump while typing (stopPropagation)
- Messages colored by character: Silie=`#ff88ff`, Toca=`#cc88ff`, Meow=`#00ccff`

### Commands (typed in chat)
| Command | Effect |
|---------|--------|
| `/fly` | Disables gravity, free camera movement |
| `/land` | Re-enables gravity, snaps to min y=1.82 |
| `/meow` | Unmutes NPC cat sounds (`window._meowEnabled=true`) |
| `/no-meow` | Mutes NPC cat sounds |
| `/help` | Lists commands |

### Server relay
Chat uses `broadcastAll` (not `broadcastExcept`) so sender also sees their own message via WS echo. Client does NOT locally echo — everything goes through server.

---

## Touch Controls (iPad / iPhone)

Shown only on `'ontouchstart' in window || navigator.maxTouchPoints > 0`.

| Control | Location | Action |
|---------|----------|--------|
| Joystick | Bottom-left | Move (forward/back/strafe) |
| Look drag | Right 55% of screen | Rotate camera |
| ⬆ button | Bottom-right | Jump |
| 💬 button | Bottom-right (lower) | Focus chat input |

- Phone (<768px): smaller sizes (100px joystick, 58px buttons)
- Tablet: larger sizes (130px joystick, 72px buttons)
- iOS fixes: `position:fixed` on body, `user-scalable=no`, `apple-mobile-web-app-capable`

---

## Audio

### Cat meows
- `sprites/meow.mp3` — real cat meow (64KB, 256kbps)
- `meowAudio.cloneNode()` per meow → overlapping meows work
- Random volume 0.55–0.85, random playbackRate 0.88–1.12 (pitch variation)
- Unlocked on first click/keydown/touchstart (browser autoplay policy)
- Gated by `window._meowEnabled` (default true, /no-meow sets false)

---

## Performance Notes

- **`freezeWorldMatrix()`** on all decorative meshes = biggest single gain
  - Do NOT freeze collision meshes (floors, walls) — breaks collision detection
  - Order: set collisions FIRST, then freeze decorations
- **PointLights**: limit total. String lights use emissive spheres + 3 shared lights
- **Sky dome**: `segments:6`, `disableLighting:true`, `isPickable:false`
- **Clouds**: `isPickable:false`, 2 spheres each
- **Gravity**: enabled AFTER `scene.onReadyObservable` fires (not during init)
  - If enabled too early, camera falls before floors have collision computed

---

## Known Issues / Tech Debt
- Walking animations not yet implemented (models have animation tracks, not wired)
- Remote player rotation (facing direction) not broadcast — remotes always face spawn direction
- No respawn logic — if you fall out, refresh to rejoin
- Room F (southeast) accessible via diagonal corridor but slightly off-grid
- NPC cats don't avoid furniture or walls — simple waypoint roaming

---

## Deployment
```bash
# Edit files on server (server = source of truth)
ssh root@74.207.245.247
cd /opt/doom-ctl-v2
# ... edit src/game.js ...
node --check src/game.js   # always check syntax before commit
git add -A
git commit -m 'description'
git push   # uses PAT in remote URL

# Restart WS server if server/index.js changed
systemctl restart doom-ctl-v2
```

## Related Repos / Services
- doom-ctl v1: k4rlski/doom-ctl — https://doom.auto-ctl.io
- DNS: dns-ctl on rodan — `doom2 A 74.207.245.247` (DNSimple)
- SSL cert: `/etc/letsencrypt/live/doom2.auto-ctl.io/` expires 2026-07-07

---

## Gravity / Collision System — Definitive Implementation (2026-04-09)

### The Problem History
Multiple patch attempts failed because:
1. `freezeWorldMatrix()` on floor meshes silently breaks collision detection
2. Setting `checkCollisions` retroactively (prefix-list in onReady) was unreliable
3. Gravity enabled too early races with collision initialization

### Current Working Implementation

**Rule: Set collisions at mesh creation, not retroactively.**

```js
// In buildLevel floor() helper:
function floor(name, w, d, x, z) {
  const f = BABYLON.MeshBuilder.CreateGround(name, {...}, scene);
  f.position.set(x, 0, z);
  f.material = floorMat;
  f.checkCollisions = true;  // ← set immediately, never changed
  return f;
}
```

cafeFloor and patioFloor in buildCatCafe also set `checkCollisions=true` explicitly.

**Rule: onReadyObservable ONLY defers gravity. Never touches collisions.**

```js
scene.onReadyObservable.addOnce(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // 2 frames after scene ready
    camera.position.y = Math.max(camera.position.y, 1.85);
    camera.applyGravity = true;
  }));
});
```

**Rule: Never freeze structural meshes.**

`freezeWorldMatrix()` only on decorative meshes (tables, cakes, trees etc).
Floors and walls NEVER get frozen.

### Debugging Falls
Open browser console. Look for:
```
[doom2] Gravity ON. Collision floors: 25 hub_floor,corr_N_floor,...
```
If count is 0 → a floor() call lost its checkCollisions somewhere.
If count < 10 → some floors missing, check buildCatCafe explicit tags.

### When Things Break (Recovery)
```bash
# Restore from last known-good commit
git log --oneline -10
git show <hash>:src/game.js > /tmp/game_good.js
cp /tmp/game_good.js src/game.js
# Then apply only surgical patches, never full block replacements
```

Last known-good with café: commit `2f9fa02`

---

## 3D Model Format Notes

**GLB (GLTF Binary)** — the format we use. Correct for Babylon.js.
- Exported via Blender 4.0 from FBX
- `export_yup=True` in Blender fixes FBX Y-axis (models right-side-up)
- Auto-scaled via bounding box: `1.8 / rawHeight`
- Floor offset: `root.position.y = -minY2` (feet on floor)

**NOT compatible with our engine:**
- PNG spritesheets (2D only, e.g. GraphicRiver cat sprites)
- OBJ files (no animations)
- FBX directly (must convert via Blender first)

**Good sources for 3D cat models:**
- Sketchfab.com — free/paid GLB downloads
- Unity Asset Store → FBX → Blender → GLB
- Mixamo (Adobe, free) — rigged characters with animations, exports FBX

**NPC cats are procedural code** — no file needed, no download weight.
Replacing them with GLB would add ~2-10MB per cat × 4 = significant load.
Only worth it for photorealistic cats.
