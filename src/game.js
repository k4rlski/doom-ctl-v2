/**
 * doom-ctl v2 — Babylon.js WebGL Engine
 * Real level geometry + full multiplayer (remote players as Silie clones)
 */

'use strict';

const DOOM2 = (() => {
  const canvas  = document.getElementById('render-canvas');
  const loading = document.getElementById('loading');
  const fill    = document.getElementById('loading-fill');
  const status  = document.getElementById('loading-status');

  function setProgress(pct, msg) {
    fill.style.width = pct + '%';
    status.textContent = msg;
  }

  // ── Character Select Screen ───────────────────────────────────────────────
  let chosenCharacter = null; // 'silie' or 'toca'

  function showCharacterSelect() {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.id = 'char-select';
      overlay.style.cssText = `
        position:fixed; inset:0; z-index:100;
        background:#04010a;
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        font-family:'Courier New',monospace; color:#fff;
      `;

      overlay.innerHTML = `
        <div style="text-align:center; margin-bottom:2.5rem;">
          <div style="font-size:0.75rem; letter-spacing:0.3em; color:#ff00cc; text-transform:uppercase; margin-bottom:0.5rem;">
            doom-ctl v2
          </div>
          <h1 style="font-size:2.4rem; color:#fff; text-shadow:0 0 24px #ff00cc, 0 0 60px #aa00aa; margin:0 0 0.4rem;">
            Choose Your Character
          </h1>
          <p style="font-size:0.85rem; color:#cc88ff; opacity:0.7;">
            Your selection becomes your in-game avatar
          </p>
        </div>

        <div style="display:flex; gap:3rem; justify-content:center; flex-wrap:wrap;">

          <!-- Silie -->
          <div class="char-card" data-char="silie" style="
            cursor:pointer; width:220px; border:2px solid #550055;
            border-radius:12px; padding:1.8rem 1.5rem 1.5rem;
            background:linear-gradient(160deg,#1a0022 0%,#0a000f 100%);
            text-align:center; transition:all 0.2s;
            box-shadow:0 0 20px #55005540;
          ">
            <div style="font-size:4rem; margin-bottom:0.8rem;">👧</div>
            <div style="font-size:1.3rem; font-weight:bold; color:#ff88ff; margin-bottom:0.4rem;">Silie</div>
            <div style="font-size:0.78rem; color:#cc88cc; line-height:1.5;">
              Teal hair · Anime style<br>Original character
            </div>
            <button class="select-btn" data-char="silie" style="
              margin-top:1.2rem; padding:0.55rem 1.6rem;
              background:transparent; border:1.5px solid #ff00cc;
              color:#ff00cc; border-radius:6px; cursor:pointer;
              font-family:'Courier New',monospace; font-size:0.85rem;
              text-transform:uppercase; letter-spacing:0.1em;
              transition:all 0.15s;
            ">Select</button>
          </div>

          <!-- Toca Prin-Wolf -->
          <div class="char-card" data-char="toca" style="
            cursor:pointer; width:220px; border:2px solid #330055;
            border-radius:12px; padding:1.8rem 1.5rem 1.5rem;
            background:linear-gradient(160deg,#100020 0%,#06000f 100%);
            text-align:center; transition:all 0.2s;
            box-shadow:0 0 20px #33005540;
          ">
            <div style="font-size:4rem; margin-bottom:0.8rem;">🐺</div>
            <div style="font-size:1.3rem; font-weight:bold; color:#cc88ff; margin-bottom:0.4rem;">Toca Prin-Wolf</div>
            <div style="font-size:0.78rem; color:#aa88cc; line-height:1.5;">
              61 meshes · Full rig<br>Brought to you by TOCA
            </div>
            <button class="select-btn" data-char="toca" style="
              margin-top:1.2rem; padding:0.55rem 1.6rem;
              background:transparent; border:1.5px solid #aa00ff;
              color:#aa00ff; border-radius:6px; cursor:pointer;
              font-family:'Courier New',monospace; font-size:0.85rem;
              text-transform:uppercase; letter-spacing:0.1em;
              transition:all 0.15s;
            ">Select</button>
          </div>
        </div>

        <p style="margin-top:2.5rem; font-size:0.75rem; color:#440044; letter-spacing:0.15em;">
          WASD · MOUSE · SPACE TO JUMP
        </p>
      `;

      document.body.appendChild(overlay);

      // Hover effects
      overlay.querySelectorAll('.char-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          card.style.borderColor = '#ff00cc';
          card.style.boxShadow = '0 0 40px #ff00cc55';
          card.style.transform = 'translateY(-4px)';
        });
        card.addEventListener('mouseleave', () => {
          const isSelected = card.dataset.char === chosenCharacter;
          card.style.borderColor = card.dataset.char === 'silie' ? '#550055' : '#330055';
          card.style.boxShadow   = card.dataset.char === 'silie' ? '0 0 20px #55005540' : '0 0 20px #33005540';
          card.style.transform   = '';
        });
      });

      // Click to select
      overlay.querySelectorAll('.select-btn, .char-card').forEach(el => {
        el.addEventListener('click', (e) => {
          const char = e.currentTarget.dataset.char;
          if (!char) return;
          chosenCharacter = char;

          // Flash selected state then fade out
          overlay.querySelectorAll('.char-card').forEach(c => {
            c.style.opacity = c.dataset.char === char ? '1' : '0.3';
          });
          overlay.querySelectorAll('.select-btn').forEach(b => {
            if (b.dataset.char === char) {
              b.textContent = '✓ Entering...';
              b.style.background = char === 'silie' ? '#ff00cc22' : '#aa00ff22';
            }
          });

          setTimeout(() => {
            overlay.style.transition = 'opacity 0.4s';
            overlay.style.opacity = '0';
            setTimeout(() => {
              overlay.remove();
              resolve(char);
            }, 420);
          }, 500);
        });
      });
    });
  }



  // ── WebSocket / Multiplayer ────────────────────────────────────────────────
  const WS_TOKEN   = 'b571e78fd651706ada84b3d017bab50ba50aa1046d69c44e';
  const myId       = 'p2_' + Math.random().toString(36).slice(2, 7);
  const remotes    = {};   // id → { mesh, lastSeen }
  let   ws         = null;
  let   scene_ref  = null;
  let   silieRoot  = null; // loaded GLB root — clone for each remote player

  function connectWS() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws?token=${WS_TOKEN}`);

    ws.onopen = () => console.log('[doom2] WS connected');

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'player' && msg.id !== myId && scene_ref) {
          handleRemotePlayer(msg);
        }
        if (msg.type === 'player_left') {
          removeRemotePlayer(msg.id);
        }
      } catch {}
    };

    ws.onclose = () => {
      console.log('[doom2] WS closed, reconnecting...');
      setTimeout(connectWS, 3000);
    };
  }

  function handleRemotePlayer(msg) {
    if (!scene_ref || !silieRoot) return;

    if (!remotes[msg.id]) {
      // Clone Silie for this player
      const entries   = scene_ref.getNodeByName('__root__');
      const cloneRoot = new BABYLON.TransformNode('remote_' + msg.id, scene_ref);

      // Use the correct template for this remote player's chosen character
      const remoteChar = msg.char || 'silie';
      const myChar     = chosenCharacter;
      const template   = (remoteChar === myChar) ? silieRoot : (window._otherCharRoot || silieRoot);

      template.getChildMeshes(false).forEach(m => {
        const clone = m.clone('r_' + msg.id + '_' + m.name, cloneRoot);
        if (clone) clone.isVisible = true;
      });

      remotes[msg.id] = { node: cloneRoot, lastSeen: Date.now() };
      console.log('[doom2] Remote player joined:', msg.id);
    }

    // Update position
    const r = remotes[msg.id];
    r.node.position.set(msg.x || 0, msg.y || 0, msg.z || 0);
    r.lastSeen = Date.now();
  }

  function removeRemotePlayer(id) {
    if (!remotes[id]) return;
    remotes[id].node.getChildMeshes(false).forEach(m => m.dispose());
    remotes[id].node.dispose();
    delete remotes[id];
    console.log('[doom2] Remote player left:', id);
  }

  // Prune stale players
  setInterval(() => {
    const now = Date.now();
    Object.keys(remotes).forEach(id => {
      if (now - remotes[id].lastSeen > 5000) removeRemotePlayer(id);
    });
  }, 5000);

  // ── Level Builder ─────────────────────────────────────────────────────────
  function buildLevel(scene) {
    const wallMat = new BABYLON.StandardMaterial('wallMat', scene);
    wallMat.diffuseColor   = new BABYLON.Color3(0.12, 0.14, 0.12);
    wallMat.emissiveColor  = new BABYLON.Color3(0.01, 0.03, 0.02);
    wallMat.specularColor  = new BABYLON.Color3(0, 0, 0);

    const floorMat = new BABYLON.StandardMaterial('floorMat', scene);
    floorMat.diffuseColor  = new BABYLON.Color3(0.07, 0.08, 0.07);
    floorMat.specularColor = new BABYLON.Color3(0, 0, 0);

    const ceilMat = new BABYLON.StandardMaterial('ceilMat', scene);
    ceilMat.diffuseColor   = new BABYLON.Color3(0.05, 0.06, 0.05);
    ceilMat.specularColor  = new BABYLON.Color3(0, 0, 0);

    const glowMat = new BABYLON.StandardMaterial('glowMat', scene);
    glowMat.diffuseColor   = new BABYLON.Color3(0.6, 0, 0.5);
    glowMat.emissiveColor  = new BABYLON.Color3(1, 0.1, 0.85);

    // Helper: box with material
    function box(name, w, h, d, x, y, z, mat) {
      const b = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
      b.position.set(x, y, z);
      b.material = mat;
      return b;
    }

    function floor(name, w, d, x, z) {
      const f = BABYLON.MeshBuilder.CreateGround(name, { width: w, height: d }, scene);
      f.position.set(x, 0, z);
      f.material = floorMat;
    }

    function ceil(name, w, d, x, z, y = 4) {
      const c = BABYLON.MeshBuilder.CreateGround(name, { width: w, height: d }, scene);
      c.position.set(x, y, z);
      c.rotation.x = Math.PI;
      c.material = ceilMat;
    }

    // ── Room A: Main Hub (centre) ─────────────────────────────────────────
    floor('hub_floor', 20, 20, 0, 0);
    ceil ('hub_ceil',  20, 20, 0, 0);
    // walls (N, S, E, W) leaving gaps for corridors
    box('hub_N1', 7, 4, 0.3, -6.5, 2,  10,  wallMat);
    box('hub_N2', 7, 4, 0.3,  6.5, 2,  10,  wallMat);
    box('hub_S1', 7, 4, 0.3, -6.5, 2, -10,  wallMat);
    box('hub_S2', 7, 4, 0.3,  6.5, 2, -10,  wallMat);
    box('hub_E1', 0.3, 4, 7,  10, 2,   6.5, wallMat);
    box('hub_E2', 0.3, 4, 7,  10, 2,  -6.5, wallMat);
    box('hub_W1', 0.3, 4, 7, -10, 2,   6.5, wallMat);
    box('hub_W2', 0.3, 4, 7, -10, 2,  -6.5, wallMat);
    // Corner pillars
    [[-9,9],[9,9],[9,-9],[-9,-9]].forEach(([x,z], i) => {
      box(`pillar${i}`, 0.8, 4, 0.8, x, 2, z, wallMat);
    });
    // Glow strip around floor
    box('hub_glow_N', 18, 0.05, 0.1, 0, 0.05,  9.9, glowMat);
    box('hub_glow_S', 18, 0.05, 0.1, 0, 0.05, -9.9, glowMat);
    box('hub_glow_E', 0.1, 0.05, 18,  9.9, 0.05, 0, glowMat);
    box('hub_glow_W', 0.1, 0.05, 18, -9.9, 0.05, 0, glowMat);

    // ── Corridor North (hub → room B) ───────────────────────────────────
    floor('corr_N_floor', 6, 16, 0, 18);
    ceil ('corr_N_ceil',  6, 16, 0, 18);
    box('corr_N_W', 0.3, 4, 16, -3, 2, 18, wallMat);
    box('corr_N_E', 0.3, 4, 16,  3, 2, 18, wallMat);

    // ── Room B: North Chamber ────────────────────────────────────────────
    floor('roomB_floor', 18, 18, 0, 36);
    ceil ('roomB_ceil',  18, 18, 0, 36);
    box('roomB_N', 18, 4, 0.3,  0, 2,  45, wallMat);
    box('roomB_S1', 6, 4, 0.3, -6, 2,  27, wallMat);
    box('roomB_S2', 6, 4, 0.3,  6, 2,  27, wallMat);
    box('roomB_E', 0.3, 4, 18,  9, 2,  36, wallMat);
    box('roomB_W', 0.3, 4, 18, -9, 2,  36, wallMat);
    // Glow
    box('roomB_glow', 16, 0.05, 0.1, 0, 0.05, 44.9, glowMat);

    // ── Corridor South (hub → room C) ───────────────────────────────────
    floor('corr_S_floor', 6, 16, 0, -18);
    ceil ('corr_S_ceil',  6, 16, 0, -18);
    box('corr_S_W', 0.3, 4, 16, -3, 2, -18, wallMat);
    box('corr_S_E', 0.3, 4, 16,  3, 2, -18, wallMat);

    // ── Room C: South Chamber ────────────────────────────────────────────
    floor('roomC_floor', 18, 18, 0, -36);
    ceil ('roomC_ceil',  18, 18, 0, -36);
    box('roomC_S', 18, 4, 0.3,  0, 2, -45, wallMat);
    box('roomC_N1', 6, 4, 0.3, -6, 2, -27, wallMat);
    box('roomC_N2', 6, 4, 0.3,  6, 2, -27, wallMat);
    box('roomC_E', 0.3, 4, 18,  9, 2, -36, wallMat);
    box('roomC_W', 0.3, 4, 18, -9, 2, -36, wallMat);
    box('roomC_glow', 16, 0.05, 0.1, 0, 0.05, -44.9, glowMat);

    // ── Corridor East (hub → room D) ────────────────────────────────────
    floor('corr_E_floor', 16, 6, 18, 0);
    ceil ('corr_E_ceil',  16, 6, 18, 0);
    box('corr_E_N', 16, 4, 0.3, 18, 2,  3, wallMat);
    box('corr_E_S', 16, 4, 0.3, 18, 2, -3, wallMat);

    // ── Room D: East Chamber ─────────────────────────────────────────────
    floor('roomD_floor', 18, 18, 36, 0);
    ceil ('roomD_ceil',  18, 18, 36, 0);
    box('roomD_E', 0.3, 4, 18,  45, 2, 0, wallMat);
    box('roomD_W1', 0.3, 4, 6, 27, 2,  6, wallMat);
    box('roomD_W2', 0.3, 4, 6, 27, 2, -6, wallMat);
    box('roomD_N', 18, 4, 0.3, 36, 2,  9, wallMat);
    box('roomD_S', 18, 4, 0.3, 36, 2, -9, wallMat);
    box('roomD_glow', 0.1, 0.05, 16, 44.9, 0.05, 0, glowMat);


    // ── Room E: West Chamber ───────────────────────────────────────────────
    floor('corr_W_floor', 16, 6, -18, 0);
    ceil ('corr_W_ceil',  16, 6, -18, 0);
    box('corr_W_N', 16, 4, 0.3, -18, 2,  3, wallMat);
    box('corr_W_S', 16, 4, 0.3, -18, 2, -3, wallMat);

    floor('roomE_floor', 18, 18, -36, 0);
    ceil ('roomE_ceil',  18, 18, -36, 0);
    box('roomE_W', 0.3, 4, 18, -45, 2, 0, wallMat);
    box('roomE_E1', 0.3, 4, 6,  -27, 2,  6, wallMat);
    box('roomE_E2', 0.3, 4, 6,  -27, 2, -6, wallMat);
    box('roomE_N', 18, 4, 0.3, -36, 2,  9, wallMat);
    box('roomE_S', 18, 4, 0.3, -36, 2, -9, wallMat);
    box('roomE_glow', 0.1, 0.05, 16, -44.9, 0.05, 0, glowMat);

    // ── Room F: Southeast (diagonal shortcut feel) ──────────────────────────
    floor('corr_SE_floor', 6, 12, 6, -21);
    ceil ('corr_SE_ceil',  6, 12, 6, -21);
    box('corr_SE_W', 0.3, 4, 12, 3, 2, -21, wallMat);
    box('corr_SE_E', 0.3, 4, 12, 9, 2, -21, wallMat);

    floor('roomF_floor', 16, 16, 14, -34);
    ceil ('roomF_ceil',  16, 16, 14, -34);
    box('roomF_N1', 5, 4, 0.3, 8, 2, -27, wallMat);
    box('roomF_N2', 5, 4, 0.3, 18, 2, -27, wallMat);
    box('roomF_S', 16, 4, 0.3, 14, 2, -42, wallMat);
    box('roomF_E', 0.3, 4, 16, 22, 2, -34, wallMat);
    box('roomF_W', 0.3, 4, 16, 6, 2, -34, wallMat);
    box('roomF_glow', 14, 0.05, 0.1, 14, 0.05, -41.9, glowMat);

    // ── Cloud on wall (Room B east wall) ────────────────────────────────────
    const cloudMat = new BABYLON.StandardMaterial('cloudMat', scene);
    cloudMat.diffuseColor  = new BABYLON.Color3(0.9, 0.8, 1.0);
    cloudMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.4);
    cloudMat.alpha = 0.85;
    // Cloud = cluster of overlapping ellipsoids on the east wall of Room B
    const cloudParts = [
      [0, 0,   0.55, 0.38, 0.25],
      [0.55, 0.15, 0.4, 0.3, 0.2],
      [-0.5, 0.1,  0.42, 0.32, 0.2],
      [0.25, -0.2, 0.35, 0.28, 0.18],
      [-0.2, -0.18,0.35, 0.3, 0.18],
    ];
    cloudParts.forEach(([dx, dy, rx, ry, rz], i) => {
      const s = BABYLON.MeshBuilder.CreateSphere(`cloud${i}`,
        { diameterX: rx*2, diameterY: ry*2, diameterZ: rz*2, segments: 8 }, scene);
      s.position.set(8.85 + rz, 2.8 + dy, 36 + dx);
      s.rotation.y = Math.PI / 2;
      s.material = cloudMat;
    });

    // ── Flower pots scattered on floor ──────────────────────────────────────
    const potMat = new BABYLON.StandardMaterial('potMat', scene);
    potMat.diffuseColor  = new BABYLON.Color3(0.5, 0.2, 0.1);
    potMat.emissiveColor = new BABYLON.Color3(0.15, 0.04, 0.02);
    const soilMat = new BABYLON.StandardMaterial('soilMat', scene);
    soilMat.diffuseColor = new BABYLON.Color3(0.25, 0.12, 0.06);
    const plantMat = new BABYLON.StandardMaterial('plantMat', scene);
    plantMat.diffuseColor  = new BABYLON.Color3(0.1, 0.7, 0.2);
    plantMat.emissiveColor = new BABYLON.Color3(0.02, 0.2, 0.05);

    const potPositions = [
      [7, 7], [-7, 7], [7, -7], [-7, -7],   // hub corners
      [2, 36], [-2, 36], [2, -36], [-2, -36], // room centres
      [36, 2], [36, -2], [-36, 2], [-36, -2],
    ];
    potPositions.forEach(([px, pz], i) => {
      // Pot body
      const pot = BABYLON.MeshBuilder.CreateCylinder(`pot${i}`, {
        height: 0.45, diameterTop: 0.32, diameterBottom: 0.24, tessellation: 12
      }, scene);
      pot.position.set(px, 0.225, pz);
      pot.material = potMat;
      // Soil disc
      const soil = BABYLON.MeshBuilder.CreateCylinder(`soil${i}`, {
        height: 0.05, diameter: 0.30, tessellation: 12
      }, scene);
      soil.position.set(px, 0.47, pz);
      soil.material = soilMat;
      // Plant (little cluster of spheres)
      [0, 0.12, -0.1, 0.1, -0.08].forEach((dx, j) => {
        const leaf = BABYLON.MeshBuilder.CreateSphere(`leaf${i}_${j}`, { diameter: 0.18 + j*0.02, segments: 6 }, scene);
        leaf.position.set(px + dx*0.6, 0.62 + j*0.06, pz + (j%2===0?0:dx));
        leaf.material = plantMat;
      });
    });

    // ── Purple neon sign: TOCA PRINWOLF ──────────────────────────────────────
    function makeNeonSign(scene) {
      // Background panel
      const panelMat = new BABYLON.StandardMaterial('signPanel', scene);
      panelMat.diffuseColor   = new BABYLON.Color3(0.04, 0.01, 0.08);
      panelMat.emissiveColor  = new BABYLON.Color3(0.08, 0.01, 0.12);
      const panel = BABYLON.MeshBuilder.CreateBox('signPanel', { width: 8, height: 1.6, depth: 0.12 }, scene);
      panel.position.set(0, 3.0, 44.8);  // north wall of Room B
      panel.material = panelMat;

      // Neon tube (emissive purple bar behind text plane)
      const tubeMat = new BABYLON.StandardMaterial('signTube', scene);
      tubeMat.diffuseColor  = new BABYLON.Color3(0.5, 0, 0.9);
      tubeMat.emissiveColor = new BABYLON.Color3(0.7, 0, 1.0);
      tubeMat.alpha = 0.9;
      const tube = BABYLON.MeshBuilder.CreateBox('signTube', { width: 7.6, height: 1.2, depth: 0.06 }, scene);
      tube.position.set(0, 3.0, 44.72);
      tube.material = tubeMat;

      // Dynamic texture for the text
      const dt = new BABYLON.DynamicTexture('signTex', { width: 1024, height: 256 }, scene, true);
      const ctx = dt.getContext();

      // Background
      ctx.fillStyle = '#0a0015';
      ctx.fillRect(0, 0, 1024, 256);

      // Glow effect — draw text multiple times with blur
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer purple glow
      ctx.save();
      ctx.shadowColor = '#cc00ff';
      ctx.shadowBlur = 32;
      ctx.fillStyle = '#cc00ff';
      ctx.font = 'bold 72px Arial';
      for (let i = 0; i < 4; i++) {
        ctx.fillText('Brought to you by', 512, 80);
        ctx.font = 'bold 88px Arial';
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.fillText('TOCA PRINWOLF', 512, 178);
      }
      ctx.restore();

      // Bright white core
      ctx.font = 'bold 72px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText('Brought to you by', 512, 80);
      ctx.font = 'bold 88px Arial';
      ctx.fillStyle = '#ff88ff';
      ctx.fillText('TOCA PRINWOLF', 512, 178);
      dt.update();

      const signMat = new BABYLON.StandardMaterial('signMat', scene);
      signMat.diffuseTexture  = dt;
      signMat.emissiveTexture = dt;
      signMat.emissiveColor   = new BABYLON.Color3(1, 1, 1);
      signMat.backFaceCulling = false;

      const signPlane = BABYLON.MeshBuilder.CreatePlane('signPlane', { width: 7.6, height: 1.2 }, scene);
      signPlane.position.set(0, 3.0, 44.65);
      signPlane.material = signMat;

      // Purple point light for the sign
      const signLight = new BABYLON.PointLight('signLight', new BABYLON.Vector3(0, 3.0, 43), scene);
      signLight.diffuse    = new BABYLON.Color3(0.7, 0, 1);
      signLight.intensity  = 1.5;
      signLight.range      = 12;
    }

    makeNeonSign(scene);

    // ── Some crates / props scattered around ──────────────────────────────
    const crateMat = new BABYLON.StandardMaterial('crateMat', scene);
    crateMat.diffuseColor = new BABYLON.Color3(0.2, 0.15, 0.1);
    [
      [5, 0, 5], [-5, 0, -5], [4, 0, 36], [-4, 0, 36],
      [4, 0, -36], [36, 0, 4], [36, 0, -4],
    ].forEach(([x, y, z], i) => {
      const c = BABYLON.MeshBuilder.CreateBox(`crate${i}`, { size: 1 }, scene);
      c.position.set(x, 0.5, z);
      c.material = crateMat;
    });

    // ── Glowing terminal plinths (decorative for now) ─────────────────────
    const termMat = new BABYLON.StandardMaterial('termMat', scene);
    termMat.diffuseColor  = new BABYLON.Color3(0.35, 0, 0.55);
    termMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0.8);

    [
      [0, 0, 36], [0, 0, -36], [36, 0, 0],
    ].forEach(([x, y, z], i) => {
      const plinth = BABYLON.MeshBuilder.CreateBox(`term${i}`, { width: 1.2, height: 1.5, depth: 0.4 }, scene);
      plinth.position.set(x, 0.75, z);
      plinth.material = termMat;

      // Screen glow light
      const light = new BABYLON.PointLight(`termLight${i}`, new BABYLON.Vector3(x, 2, z), scene);
      light.diffuse    = new BABYLON.Color3(1, 0.1, 0.85);
      light.intensity  = 0.9;
      light.range      = 8;
    });
  }

  // ── Main init ─────────────────────────────────────────────────────────────
  async function init() {
    // Show character select first
    setProgress(0, 'Choose your character...');
    chosenCharacter = await showCharacterSelect();
    console.log('[doom2] Chosen character:', chosenCharacter);

    setProgress(5, 'Creating engine...');

    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    engine.resize();
    window.addEventListener('resize', () => engine.resize());

    const scene = new BABYLON.Scene(engine);
    scene_ref = scene;
    scene.clearColor = new BABYLON.Color4(0.04, 0.01, 0.06, 1);

    // Fog for atmosphere
    scene.fogMode    = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogStart   = 20;
    scene.fogEnd     = 55;
    scene.fogColor   = new BABYLON.Color3(0.05, 0.01, 0.06);

    setProgress(15, 'Camera...');

    const camera = new BABYLON.UniversalCamera('cam', new BABYLON.Vector3(0, 1.8, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 1.8, 5));
    camera.attachControl(canvas, true);
    camera.speed        = 0.2;
    camera.angularSpeed = 0.005;
    camera.minZ         = 0.1;
    camera.ellipsoid    = new BABYLON.Vector3(0.4, 0.9, 0.4);
    camera.checkCollisions = true;
    scene.gravity       = new BABYLON.Vector3(0, -0.98, 0);
    camera.applyGravity = true;
    camera.keysUp    = [87, 38];
    camera.keysDown  = [83, 40];
    camera.keysLeft  = [65, 37];
    camera.keysRight = [68, 39];

    setProgress(25, 'Lighting...');

    // Dim ambient
    const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity   = 0.55;
    ambient.diffuse     = new BABYLON.Color3(0.25, 0.05, 0.2);
    ambient.groundColor = new BABYLON.Color3(0.1, 0.02, 0.08);

    // Central hub light
    const hub = new BABYLON.PointLight('hub', new BABYLON.Vector3(0, 3.5, 0), scene);
    hub.diffuse    = new BABYLON.Color3(1, 0.05, 0.7);
    hub.intensity  = 1.4;
    hub.range      = 25;

    setProgress(40, 'Building level...');
    buildLevel(scene);

    // Enable collisions on all meshes
    scene.meshes.forEach(m => { m.checkCollisions = true; });

    setProgress(60, 'Loading Silie...');

    const charFile = chosenCharacter === 'toca' ? 'toca.glb' : 'silie.glb';
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync('', 'sprites/', charFile, scene);
      console.log('[doom2] Character loaded:', charFile, result.meshes.length, 'meshes');

      // Find the root and fix scale/orientation
      const root = result.meshes.find(m => !m.parent) || result.meshes[0];
      if (root) {
        root.name = 'silie_local';

        // Blender-exported GLB: Y-up corrected, units in meters
        // Compute bounding box to auto-scale to ~1.8m and floor-align
        root.computeWorldMatrix(true);
        const bb = root.getHierarchyBoundingVectors();
        const rawH = bb.max.y - bb.min.y;
        const scale = rawH > 0.1 ? 1.8 / rawH : 1.0;
        root.scaling.setAll(scale);
        root.computeWorldMatrix(true);
        const bb2 = root.getHierarchyBoundingVectors();
        // Place so feet are at y=0
        root.position.set(3, -bb2.min.y, 3);
        console.log(`[doom2] Silie: rawH=${rawH.toFixed(2)} scale=${scale.toFixed(3)} floorY=${(-bb2.min.y).toFixed(3)}`);

        // Store for cloning remote players (this player's chosen char)
        silieRoot = root;
        root.setEnabled(true);
        // Pre-load the OTHER character silently so remotes using it can be cloned
        const otherFile = chosenCharacter === 'toca' ? 'silie.glb' : 'toca.glb';
        BABYLON.SceneLoader.ImportMeshAsync('', 'sprites/', otherFile, scene).then(r => {
          const otherRoot = r.meshes.find(m => !m.parent) || r.meshes[0];
          if (otherRoot) {
            otherRoot.computeWorldMatrix(true);
            const ob = otherRoot.getHierarchyBoundingVectors();
            const oh = ob.max.y - ob.min.y;
            otherRoot.scaling.setAll(oh > 0.1 ? 1.8/oh : 1.0);
            otherRoot.computeWorldMatrix(true);
            const ob2 = otherRoot.getHierarchyBoundingVectors();
            otherRoot.position.set(-999, -ob2.min.y, -999); // park off-level
            otherRoot.name = 'other_char_template';
            window._otherCharRoot = otherRoot;
            if (r.animationGroups?.length > 0) r.animationGroups[0].stop();
            console.log('[doom2] Other char pre-loaded:', otherFile);
          }
        }).catch(() => {});


      }

      // Play first animation if any
      if (result.animationGroups?.length > 0) {
        result.animationGroups[0].start(true);
        console.log('[doom2] Anim:', result.animationGroups[0].name);
      }
    } catch (e) {
      console.warn('[doom2] silie.glb load failed:', e.message);
      // Cyan placeholder
      const box = BABYLON.MeshBuilder.CreateBox('silie_placeholder', { width: 0.6, height: 1.8, depth: 0.4 }, scene);
      box.position.set(3, 0.9, 3);
      const m = new BABYLON.StandardMaterial('pm', scene);
      m.diffuseColor  = new BABYLON.Color3(0, 0.85, 1);
      m.emissiveColor = new BABYLON.Color3(0, 0.2, 0.3);
      box.material = m;
      silieRoot = box;
    }

    setProgress(80, 'Multiplayer...');
    connectWS();

    // Send position at 20Hz
    setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        const p = camera.position;
        ws.send(JSON.stringify({
          type: 'player', id: myId,
          x: p.x, y: p.y, z: p.z,
          char: chosenCharacter,
          token: WS_TOKEN,
        }));
      }
    }, 50);

    setProgress(90, 'HUD...');

    // ── HUD: player count overlay (plain DOM — no BABYLON.GUI needed) ────────
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = `
      position:fixed; bottom:14px; left:14px;
      font-family:'Courier New',monospace; font-size:13px;
      color:#00ff88; text-shadow:0 0 8px #00ff88;
      pointer-events:none; z-index:10;
    `;
    document.body.appendChild(hud);

    // Update HUD every second
    setInterval(() => {
      const n = Object.keys(remotes).length + 1;
      hud.textContent = `● ${n} player${n !== 1 ? 's' : ''} online`;
    }, 1000);

    // Crosshair
    const xh = document.createElement('div');
    xh.style.cssText = `
      position:fixed; top:50%; left:50%;
      transform:translate(-50%,-50%);
      width:14px; height:14px;
      pointer-events:none; z-index:10;
    `;
    xh.innerHTML = `<svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <line x1="7" y1="0" x2="7" y2="14" stroke="#00ff88" stroke-width="1" opacity="0.7"/>
      <line x1="0" y1="7" x2="14" y2="7" stroke="#00ff88" stroke-width="1" opacity="0.7"/>
    </svg>`;
    document.body.appendChild(xh);

    setProgress(98, 'Starting...');
    engine.runRenderLoop(() => scene.render());

    // ── Jump (Space bar) ────────────────────────────────────────────────────
    let jumping = false;
    let jumpVel = 0;
    const groundY = 1.8; // camera eye height at floor
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'Space') && !jumping) {
        jumping  = true;
        jumpVel  = 7;
        e.preventDefault();
      }
    });
    scene.onBeforeRenderObservable.add(() => {
      if (jumping) {
        const dt = engine.getDeltaTime() / 1000;
        jumpVel        -= 18 * dt;
        camera.position.y += jumpVel * dt;
        if (camera.position.y <= groundY) {
          camera.position.y = groundY;
          jumping = false;
          jumpVel = 0;
        }
      }
    });

    // Lock pointer on click for FPS feel
    canvas.addEventListener('click', () => canvas.requestPointerLock());

    await new Promise(r => setTimeout(r, 400));
    loading.style.transition = 'opacity 0.5s';
    loading.style.opacity    = '0';
    setTimeout(() => loading.style.display = 'none', 520);

    console.log('[doom2] Ready. WASD to move, mouse to look, click canvas to lock pointer.');
  }

  window.addEventListener('load', () => {
    init().catch(e => {
      console.error('[doom2] Boot error:', e);
      status.textContent = 'Error: ' + e.message;
      fill.style.background = '#ff4444';
    });
  });

})();
