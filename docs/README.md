# doom-ctl-v2

A browser-based 3D multiplayer game built with Babylon.js + WebGL.  
Walk around, chat, fly, explore — with friends.

🎮 **Live:** https://doom2.auto-ctl.io  
📦 **v1 (raycaster):** https://doom.auto-ctl.io  
🐙 **Repo:** k4rlski/doom-ctl-v2

---

## Quick Start

Open https://doom2.auto-ctl.io in any modern browser. No install needed.

**Controls:**
| Action | Desktop | Mobile/iPad |
|--------|---------|-------------|
| Move | WASD or arrow keys | Left joystick |
| Look | Mouse drag | Right-side drag |
| Jump | Space | ⬆ button |
| Chat | T → type → Enter | 💬 button |
| Pointer lock | Click canvas | — |

**Chat commands:**
```
/fly       — disable gravity, free-fly mode
/land      — re-enable gravity
/meow      — unmute NPC cat sounds
/no-meow   — mute NPC cat sounds
/help      — list commands
```

---

## Characters

Choose your character at the start screen:

| Character | Model | Size | Notes |
|-----------|-------|------|-------|
| 🐱 Silie | `sprites/silie.glb` | 1.8m | Daughter's original character |
| 🐺 Toca Prin-Wolf | `sprites/toca.glb` | 1.8m | Karl's character |
| 🌈 Meow Cat | Procedural code | 0.54m | Tiny Nyan Cat-style cat |

Remote players appear as their chosen character.

---

## Level

```
                    [Room B - North]
                         |
          [Room E] — [Hub] — [Room D]
                         |
                    [Room C - South]
                         |
                   [Café Corridor]
                         |
                    [Cat Café ☕]
                         |
                  [Outdoor Patio 🌞]
                         |
                     [Grass / Sky]

[Room F] connects diagonally from Hub southeast
```

### Cat Café features
- Bakery display (croissants, muffins, cakes, donuts, lemon tart)
- 9 tables with chairs and coffee cups
- Chalk menu board
- CAT CAFE neon sign
- String lights

### Outdoor Patio
- Sky dome with sun and clouds
- Umbrella tables
- Flower planters and trees
- Zigzag string lights

---

## NPC Cats

4 cartoon cats roam the level meowing:
- 🟠 **Orange Tabby** — M forehead marking, white chest, banded tail
- 🩶 **Grey** — silver-grey with darker stripes
- 🖤 **Dark** — near-black with brown accents
- 🍦 **Cream** — pale beige with tan stripes

Sound: `sprites/meow.mp3` — real cat meow, random pitch per meow.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| 3D Engine | Babylon.js 6 (CDN) |
| Models | GLTF/GLB (Blender Y-up export) |
| Multiplayer | WebSocket (Node.js, port 3667) |
| Audio | HTML5 Audio (meow.mp3) |
| Touch | Custom virtual joystick (no library) |
| Hosting | Nginx on Linode (doom.auto-ctl.io) |

---

## Server Setup

```bash
# Server: root@74.207.245.247
cd /opt/doom-ctl-v2

# WS server
systemctl status doom-ctl-v2
systemctl restart doom-ctl-v2

# Deploy
git add -A && git commit -m 'description' && git push
node --check src/game.js  # always check syntax first
```

---

## Adding a New Character

1. Export FBX from 3D app
2. Convert: `blender --background --python convert.py` (see `docs/`)
3. Copy GLB to `sprites/yourchar.glb`
4. Add a card in `showCharacterSelect()` in `src/game.js`
5. Add a load branch in the character loading section

**Model requirements:**
- GLB format (GLTF Binary), Y-up (Blender export handles this)
- Auto-scaled to 1.8m via bounding box — any size FBX works
- Animations optional — first animationGroup plays if present

---

## Gravity / Collision Notes

This is the most fragile system. Rules:

1. `floor()` helper sets `checkCollisions=true` at creation — never change this
2. **Never** call `freezeWorldMatrix()` on collision meshes
3. `camera.applyGravity` is enabled after `scene.onReadyObservable` + 2 rAF frames
4. If a player falls through a floor, check the console for: `[doom2] Gravity ON. Collision floors: N`
5. If N=0, a floor is missing `checkCollisions=true`

See `docs/doom-ctl-v2-rag.md` for full architecture reference.

---

## File Structure

```
/opt/doom-ctl-v2/
├── index.html          # Entry point, character select, loading screen
├── src/
│   └── game.js         # Entire client engine (~2000 lines)
├── server/
│   └── index.js        # WebSocket server (port 3667)
├── sprites/
│   ├── silie.glb       # Silie character (40 meshes)
│   ├── toca.glb        # Toca Prin-Wolf (61 meshes)
│   ├── meow.mp3        # Cat meow sound
│   ├── nyan-cat.jpg    # Meow Cat char select image
│   └── kpop-poster.jpg # Wall decoration
├── docs/
│   ├── README.md       # This file
│   └── doom-ctl-v2-rag.md  # Architecture RAG
└── config/
    └── doom-ctl.yml    # Credentials (gitignored)
```

---

## Related

- **doom-ctl v1** — raycaster version: https://doom.auto-ctl.io / k4rlski/doom-ctl
- **Characters** — Silie by Karl's daughter, Toca Prin-Wolf by Karl
- **Sound** — meow.mp3 from dragon-studio (Envato)
