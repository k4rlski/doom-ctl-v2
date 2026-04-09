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
        align-items:center; justify-content:flex-start;
        font-family:'Courier New',monospace; color:#fff;
        overflow-y:auto; -webkit-overflow-scrolling:touch;
        padding:20px 12px 40px; box-sizing:border-box;
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
            cursor:pointer; width:min(220px,85vw); border:2px solid #550055;
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

          
          <!-- Meow Cat -->
          <div class="char-card" data-char="meow" style="
            cursor:pointer; width:min(220px,85vw); border:2px solid #003355;
            border-radius:12px; padding:1.8rem 1.5rem 1.5rem;
            background:linear-gradient(160deg,#00101a 0%,#000a12 100%);
            text-align:center; transition:all 0.2s;
            box-shadow:0 0 20px #00335540;
          ">
            <img src="sprites/nyan-cat.jpg" alt="Nyan Cat"
              style="width:100%; height:100px; object-fit:cover; border-radius:6px; margin-bottom:0.8rem;"/>
            <div style="font-size:1.3rem; font-weight:bold; color:#00ccff; margin-bottom:0.4rem;">Meow Cat</div>
            <div style="font-size:0.78rem; color:#88aacc; line-height:1.5;">
              30% size &middot; Rainbow trail<br>Secret tiny mode &#128049;
            </div>
            <button class="select-btn" data-char="meow" style="
              margin-top:1.2rem; padding:0.55rem 1.6rem;
              background:transparent; border:1.5px solid #00ccff;
              color:#00ccff; border-radius:6px; cursor:pointer;
              font-family:'Courier New',monospace; font-size:0.85rem;
              text-transform:uppercase; letter-spacing:0.1em;
              transition:all 0.15s;
            ">Select</button>
          </div>

<!-- Toca Prin-Wolf -->
          <div class="char-card" data-char="toca" style="
            cursor:pointer; width:min(220px,85vw); border:2px solid #330055;
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



  // ── Meow Cat: procedural Babylon.js model ───────────────────────────────
    function buildMeowCat(scn, nm) {
    const root = new BABYLON.TransformNode(nm || 'meow_cat', scn);
    const S = 0.54; // 30% of 1.8m

    const mk = (n, c, e) => { const m = new BABYLON.StandardMaterial(n, scn);
      m.diffuseColor = new BABYLON.Color3(...c);
      if (e) m.emissiveColor = new BABYLON.Color3(...e);
      return m; };
    const grey  = mk('mGrey', [0.55,0.55,0.58],[0.04,0.04,0.05]);
    const pink  = mk('mPink', [1,0.5,0.7],[0.3,0.05,0.15]);
    const white = mk('mWhite',[0.95,0.95,0.95]);
    const black = mk('mBlk',  [0.1,0.1,0.1]);

    const attach = (mesh) => { mesh.parent = root; return mesh; };

    // Pop-Tart body
    attach(BABYLON.MeshBuilder.CreateBox('toast',{width:S*0.9,height:S*0.7,depth:S*0.4},scn))
      .position.set(0,S*0.55,0); root.getChildMeshes()[0].material=pink;

    // Cat head
    const head = attach(BABYLON.MeshBuilder.CreateSphere('head',{diameter:S*0.5,segments:8},scn));
    head.position.set(S*0.38,S*0.75,0); head.material=grey;

    // Ears
    [-1,1].forEach((side,i)=>{
      const e=attach(BABYLON.MeshBuilder.CreateCylinder('ear'+i,{height:S*0.18,diameterBottom:S*0.14,diameterTop:0.01,tessellation:4},scn));
      e.position.set(S*0.38+side*S*0.13,S*0.95,0); e.material=grey;
    });

    // Eyes
    [-1,1].forEach((side,i)=>{
      const ew=attach(BABYLON.MeshBuilder.CreateSphere('eye'+i,{diameter:S*0.1},scn));
      ew.position.set(S*0.62,S*0.78,side*S*0.12); ew.material=white;
      const ep=attach(BABYLON.MeshBuilder.CreateSphere('pup'+i,{diameter:S*0.055},scn));
      ep.position.set(S*0.635,S*0.78,side*S*0.12); ep.material=black;
    });

    // Blush
    [-1,1].forEach((side,i)=>{
      const b=attach(BABYLON.MeshBuilder.CreateSphere('blush'+i,{diameter:S*0.08},scn));
      b.position.set(S*0.65,S*0.70,side*S*0.19); b.material=pink;
    });

    // Legs
    [[-0.3,-0.6],[-0.3,0.6],[0.3,-0.6],[0.3,0.6]].forEach(([lx,lz],i)=>{
      const l=attach(BABYLON.MeshBuilder.CreateCylinder('leg'+i,{height:S*0.2,diameter:S*0.12,tessellation:6},scn));
      l.position.set(lx*S*0.7,S*0.1,lz); l.material=grey;
    });

    // Rainbow tail stripes
    [[1,0,0],[1,0.55,0],[1,1,0],[0,0.8,0],[0,0.5,1],[0.55,0,1]].forEach(([r,g,b],i)=>{
      const stripe=attach(BABYLON.MeshBuilder.CreateBox('str'+i,{width:S*1.6,height:S*0.065,depth:S*0.04},scn));
      stripe.position.set(-S*1.1,S*0.28+i*S*0.072,0);
      const sm=new BABYLON.StandardMaterial('strM'+i,scn);
      sm.diffuseColor=new BABYLON.Color3(r,g,b);
      sm.emissiveColor=new BABYLON.Color3(r*0.5,g*0.5,b*0.5);
      stripe.material=sm;
    });

    // Bob animation
    let t=Math.random()*6;
    scn.onBeforeRenderObservable.add(()=>{ t+=0.04; root.position.y=(root._baseY||0)+Math.sin(t)*0.025; });
    return root;
  }



  // ── Cartoon Cat: realistic cat anatomy for NPCs ──────────────────────────
  function buildCartoonCat(scene, name, furColor, accentColor, tabbyMode) {
    const root = new BABYLON.TransformNode(name, scene);
    const S = 0.38; // ~38cm — small roaming cat

    const mk = (n, c, e) => {
      const m = new BABYLON.StandardMaterial(n + '_' + name, scene);
      m.diffuseColor = new BABYLON.Color3(...c);
      if (e) m.emissiveColor = new BABYLON.Color3(...e);
      return m;
    };
    const furMat    = mk('fur',    furColor,    furColor.map(v => v * 0.08));
    const accentMat = mk('accent', accentColor, accentColor.map(v => v * 0.06));
    const pinkMat   = mk('pink',   [0.95, 0.55, 0.65], [0.15, 0.04, 0.06]);
    const whiteMat  = mk('white',  [0.95, 0.95, 0.95]);
    const blackMat  = mk('black',  [0.08, 0.08, 0.08]);
    const noseMat   = mk('nose',   [0.85, 0.3, 0.4],   [0.1, 0.02, 0.04]);

    function attach(mesh, mat) {
      mesh.parent = root;
      if (mat) mesh.material = mat;
      return mesh;
    }

    // ── Body: oval torso ──────────────────────────────────────────────────
    const body = attach(
      BABYLON.MeshBuilder.CreateSphere('body', { diameterX: S*1.1, diameterY: S*0.9, diameterZ: S*0.75, segments: 10 }, scene),
      furMat
    );
    body.position.set(0, S * 0.6, 0);

    // ── Head: rounder than body ───────────────────────────────────────────
    const head = attach(
      BABYLON.MeshBuilder.CreateSphere('head', { diameter: S * 0.85, segments: 10 }, scene),
      furMat
    );
    head.position.set(S * 0.58, S * 1.0, 0);

    // ── Muzzle: two small bumps ────────────────────────────────────────────
    [-1, 1].forEach((side, i) => {
      const muz = attach(
        BABYLON.MeshBuilder.CreateSphere('muz' + i, { diameter: S * 0.22, segments: 8 }, scene),
        whiteMat
      );
      muz.position.set(S * 0.93, S * 0.95, side * S * 0.13);
    });

    // ── Nose ──────────────────────────────────────────────────────────────
    const nose = attach(
      BABYLON.MeshBuilder.CreateSphere('nose', { diameterX: S*0.1, diameterY: S*0.07, diameterZ: S*0.06, segments: 6 }, scene),
      noseMat
    );
    nose.position.set(S * 1.0, S * 0.98, 0);

    // ── Eyes: white sclera + black pupil ──────────────────────────────────
    [-1, 1].forEach((side, i) => {
      const eyeW = attach(
        BABYLON.MeshBuilder.CreateSphere('eyeW' + i, { diameter: S * 0.18, segments: 8 }, scene),
        whiteMat
      );
      eyeW.position.set(S * 0.88, S * 1.08, side * S * 0.24);

      const eyeB = attach(
        BABYLON.MeshBuilder.CreateSphere('eyeB' + i, { diameterX: S*0.08, diameterY: S*0.13, diameterZ: S*0.06, segments: 8 }, scene),
        blackMat
      );
      eyeB.position.set(S * 0.905, S * 1.08, side * S * 0.24);

      // Catchlight
      const shine = attach(
        BABYLON.MeshBuilder.CreateSphere('shine' + i, { diameter: S * 0.04, segments: 6 }, scene),
        whiteMat
      );
      shine.position.set(S * 0.915, S * 1.1, side * S * 0.23);
    });

    // ── Ears: triangular cones ────────────────────────────────────────────
    [-1, 1].forEach((side, i) => {
      const ear = attach(
        BABYLON.MeshBuilder.CreateCylinder('ear' + i,
          { height: S * 0.3, diameterBottom: S * 0.22, diameterTop: 0.01, tessellation: 4 }, scene),
        furMat
      );
      ear.position.set(S * 0.42, S * 1.4, side * S * 0.27);
      ear.rotation.z = side * 0.2;

      // Inner ear (pink)
      const earIn = attach(
        BABYLON.MeshBuilder.CreateCylinder('earIn' + i,
          { height: S * 0.22, diameterBottom: S * 0.13, diameterTop: 0.01, tessellation: 4 }, scene),
        pinkMat
      );
      earIn.position.set(S * 0.44, S * 1.38, side * S * 0.27);
      earIn.rotation.z = side * 0.2;
    });

    // ── Legs: 4 cylinders with paws ───────────────────────────────────────
    [[-0.32, -0.28], [-0.32, 0.28], [0.32, -0.28], [0.32, 0.28]].forEach(([lx, lz], i) => {
      const leg = attach(
        BABYLON.MeshBuilder.CreateCylinder('leg' + i,
          { height: S * 0.42, diameter: S * 0.2, tessellation: 8 }, scene),
        furMat
      );
      leg.position.set(lx * S, S * 0.2, lz * S);

      // Paw (slightly wider oval at bottom)
      const paw = attach(
        BABYLON.MeshBuilder.CreateSphere('paw' + i,
          { diameterX: S*0.22, diameterY: S*0.1, diameterZ: S*0.24, segments: 6 }, scene),
        whiteMat
      );
      paw.position.set(lx * S, S * 0.02, lz * S);
    });

    // ── Tail: curved using two tori ───────────────────────────────────────
    const tail1 = attach(
      BABYLON.MeshBuilder.CreateTorus('tail1',
        { diameter: S * 0.55, thickness: S * 0.1, tessellation: 14 }, scene),
      accentMat
    );
    tail1.position.set(-S * 0.45, S * 0.55, 0);
    tail1.rotation.z = -0.5;
    tail1.rotation.x = Math.PI / 2;

    const tailTip = attach(
      BABYLON.MeshBuilder.CreateSphere('tailTip', { diameter: S * 0.18, segments: 6 }, scene),
      accentMat
    );
    tailTip.position.set(-S * 0.9, S * 0.9, 0);

    // ── Stripe markings on back ────────────────────────────────────────────
    [-0.15, 0, 0.15].forEach((ox, i) => {
      const stripe = attach(
        BABYLON.MeshBuilder.CreateBox('stripe' + i,
          { width: S * 0.06, height: S * 0.55, depth: S * 0.55 }, scene),
        accentMat
      );
      stripe.position.set(ox * S * 0.4, S * 0.7, 0);
    });

    // ── Real tabby features (only when tabbyMode=true) ─────────────────────
    if (tabbyMode) {
      const whitePatchMat = mk('wPatch', [0.98, 0.97, 0.95], [0.04, 0.04, 0.04]);
      const deepOrangeMat = mk('dOrange', [0.6, 0.25, 0.02], [0.08, 0.02, 0.0]);

      // White chest/belly patch
      const chest = attach(
        BABYLON.MeshBuilder.CreateSphere('chest',
          { diameterX: S*0.55, diameterY: S*0.5, diameterZ: S*0.4, segments: 8 }, scene),
        whitePatchMat
      );
      chest.position.set(S*0.15, S*0.5, 0);

      // White chin
      const chin = attach(
        BABYLON.MeshBuilder.CreateSphere('chin', { diameter: S*0.28, segments: 6 }, scene),
        whitePatchMat
      );
      chin.position.set(S*0.9, S*0.88, 0);

      // M-marking on forehead: 3 ridges above eyes
      [-0.18, 0, 0.18].forEach((oz, mi) => {
        const mMark = attach(
          BABYLON.MeshBuilder.CreateBox('mMark' + mi,
            { width: S*0.06, height: S*0.09, depth: S*0.05 }, scene),
          deepOrangeMat
        );
        mMark.position.set(S*0.82, S*1.22, oz*S);
      });
      const mBar = attach(
        BABYLON.MeshBuilder.CreateBox('mBar',
          { width: S*0.05, height: S*0.04, depth: S*0.44 }, scene),
        deepOrangeMat
      );
      mBar.position.set(S*0.82, S*1.18, 0);

      // Cheek stripes
      [-1,1].forEach((side, si) => {
        [0, 0.1].forEach((dy, di) => {
          const cs = attach(
            BABYLON.MeshBuilder.CreateBox('chkStr'+si+'_'+di,
              { width: S*0.18, height: S*0.035, depth: S*0.04 }, scene),
            deepOrangeMat
          );
          cs.position.set(S*0.75, S*(1.0-dy), side*S*0.35);
        });
      });

      // Banded tail rings (alternating colors)
      for (let ri = 0; ri < 4; ri++) {
        const ring = attach(
          BABYLON.MeshBuilder.CreateTorus('tring' + ri,
            { diameter: S*0.22, thickness: S*0.055, tessellation: 10 }, scene),
          ri % 2 === 0 ? deepOrangeMat : accentMat
        );
        ring.position.set(-S*(0.3 + ri*0.15), S*(0.6 + ri*0.12), 0);
        ring.rotation.x = Math.PI/2;
        ring.rotation.z = 0.4 + ri*0.1;
      }

      // White paw tips
      [[-0.32,-0.28],[-0.32,0.28],[0.32,-0.28],[0.32,0.28]].forEach(([lx,lz], pi) => {
        const tip = attach(
          BABYLON.MeshBuilder.CreateSphere('pawTip'+pi,
            { diameterX: S*0.14, diameterY: S*0.06, diameterZ: S*0.17, segments: 5 }, scene),
          whitePatchMat
        );
        tip.position.set(lx*S*1.0, S*-0.01, lz*S*1.0);
      });
    }

    // Gentle sit-bob animation
    let t = Math.random() * Math.PI * 2;
    scene.onBeforeRenderObservable.add(() => {
      t += 0.025;
      root.position.y = (root._baseY || 0) + Math.sin(t) * 0.015;
    });

    return root;
  }

  // Chat function — defined properly in init(), stub here for connectWS scope
  let addChatMsg = (sender, text, color) => {
    console.log('[chat]', sender + ':', text);
  };

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
        if (msg.type === 'chat') {
          const cn = { silie:'Silie', toca:'Toca', meow:'Meow Cat' };
          const colors = { silie:'#ff88ff', toca:'#cc88ff', meow:'#00ccff' };
          addChatMsg(cn[msg.char] || 'Player', msg.text || '', colors[msg.char] || '#ccc');
        }
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
    if (!scene_ref) return;

    if (!remotes[msg.id]) {
      const remoteChar = msg.char || 'silie';
      let node = null;

      if (remoteChar === 'meow') {
        node = buildMeowCat(scene_ref, 'remote_' + msg.id);
        node._baseY = 0;
      } else {
        // Pick correct template — must match remote's chosen character exactly
        const isSameChar = remoteChar === chosenCharacter;
        const template = isSameChar ? silieRoot : window._otherCharRoot;
        if (!template) {
          // Other char not loaded yet — queue and retry when it loads
          window._pendingRemotes = window._pendingRemotes || {};
          window._pendingRemotes[msg.id] = msg;
          console.log('[doom2] Queued remote', msg.id, 'waiting for', remoteChar, 'template');
          return;
        }
        console.log('[doom2] Cloning', remoteChar, 'from', template.name);

        // Try instantiateHierarchy (GLB meshes)
        let cloned = null;
        if (template.instantiateHierarchy) {
          try {
            cloned = template.instantiateHierarchy(null, { doNotInstantiate: true });
          } catch(e) {}
        }

        if (cloned) {
          cloned.name = 'remote_' + msg.id;
          cloned.getChildMeshes(true).forEach(m => { m.isVisible = true; m.setEnabled(true); });
          if (template.scaling) cloned.scaling = template.scaling.clone();
          node = cloned;
        } else {
          // Fallback: manual clone of all child meshes
          const root = new BABYLON.TransformNode('remote_' + msg.id, scene_ref);
          if (template.scaling) root.scaling = template.scaling.clone();
          template.getChildMeshes(false).forEach(m => {
            const c = m.clone('r_' + msg.id + '_' + m.name, root);
            if (c) { c.isVisible = true; c.setEnabled(true); c.getChildMeshes(true).forEach(gc=>{gc.isVisible=true;gc.setEnabled(true);}); }
          });
          node = root;
        }
      }

      remotes[msg.id] = { node, lastSeen: Date.now() };
      console.log('[doom2] Remote joined:', msg.id, 'as', remoteChar);
    }

    const r = remotes[msg.id];
    if (!r) return;
    const eyeH = 1.8;
    const fo = (msg.fo !== undefined) ? msg.fo : eyeH;
    const rx = msg.x || 0, ry = (msg.y || eyeH) - fo, rz = msg.z || 0;
    r.node.position.set(rx, ry, rz);
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
      f.checkCollisions = true;
      return f;
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

    // ── Room B: North Chamber ────────────────────────────────────────────
    floor('roomB_floor', 18, 18, 0, 36);
    ceil ('roomB_ceil',  18, 18, 0, 36);
    box('roomB_N', 18, 4, 0.3,  0, 2,  45, wallMat);


    box('roomB_E', 0.3, 4, 18,  9, 2,  36, wallMat);
    box('roomB_W', 0.3, 4, 18, -9, 2,  36, wallMat);
    // Glow
    box('roomB_glow', 16, 0.05, 0.1, 0, 0.05, 44.9, glowMat);

    // ── Corridor South (hub → room C) ───────────────────────────────────
    floor('corr_S_floor', 6, 16, 0, -18);
    ceil ('corr_S_ceil',  6, 16, 0, -18);

    // ── Room C: South Chamber ────────────────────────────────────────────
    floor('roomC_floor', 18, 18, 0, -36);
    ceil ('roomC_ceil',  18, 18, 0, -36);


    floor('cafCorr_floor', 6, 18, 0, -53);
    ceil('cafCorr_ceil',   6, 18, 0, -53);


    box('roomC_E', 0.3, 4, 18,  9, 2, -36, wallMat);
    box('roomC_W', 0.3, 4, 18, -9, 2, -36, wallMat);
    box('roomC_glow', 16, 0.05, 0.1, 0, 0.05, -44.9, glowMat);

    // ── Corridor East (hub → room D) ────────────────────────────────────
    floor('corr_E_floor', 16, 6, 18, 0);
    ceil ('corr_E_ceil',  16, 6, 18, 0);

    // ── Room D: East Chamber ─────────────────────────────────────────────
    floor('roomD_floor', 18, 18, 36, 0);
    ceil ('roomD_ceil',  18, 18, 36, 0);
    box('roomD_E', 0.3, 4, 18,  45, 2, 0, wallMat);


    box('roomD_N', 18, 4, 0.3, 36, 2,  9, wallMat);
    box('roomD_S', 18, 4, 0.3, 36, 2, -9, wallMat);
    box('roomD_glow', 0.1, 0.05, 16, 44.9, 0.05, 0, glowMat);


    // ── Room E: West Chamber ───────────────────────────────────────────────
    floor('corr_W_floor', 16, 6, -18, 0);
    ceil ('corr_W_ceil',  16, 6, -18, 0);

    floor('roomE_floor', 18, 18, -36, 0);
    ceil ('roomE_ceil',  18, 18, -36, 0);
    box('roomE_W', 0.3, 4, 18, -45, 2, 0, wallMat);


    box('roomE_N', 18, 4, 0.3, -36, 2,  9, wallMat);
    box('roomE_S', 18, 4, 0.3, -36, 2, -9, wallMat);
    box('roomE_glow', 0.1, 0.05, 16, -44.9, 0.05, 0, glowMat);

    // ── Room F: Southeast (diagonal shortcut feel) ──────────────────────────
    floor('corr_SE_floor', 6, 12, 6, -21);
    ceil ('corr_SE_ceil',  6, 12, 6, -21);

    floor('roomF_floor', 16, 16, 14, -34);
    ceil ('roomF_ceil',  16, 16, 14, -34);


    box('roomF_S', 16, 4, 0.3, 14, 2, -42, wallMat);
    box('roomF_E', 0.3, 4, 16, 22, 2, -34, wallMat);
    box('roomF_W', 0.3, 4, 16, 6, 2, -34, wallMat);
    box('roomF_glow', 14, 0.05, 0.1, 14, 0.05, -41.9, glowMat);


    // ── Hallway neon strips ─────────────────────────────────────────────────
    const nHues = [[1,0.05,0.85],[1,0.05,0.85],[0.2,0,1],[0,1,0.5]];
    // Floor strips — north/south corridors (z=18/-18, x=±3), east/west (x=±18, z=±3)
    const neonDefs = [
      {pos:[-2.9,0.05,18],sz:[0.06,0.06,14],h:0},{pos:[2.9,0.05,18],sz:[0.06,0.06,14],h:0},
      {pos:[-2.9,0.05,-18],sz:[0.06,0.06,14],h:1},{pos:[2.9,0.05,-18],sz:[0.06,0.06,14],h:1},
      {pos:[18,0.05,-2.9],sz:[14,0.06,0.06],h:2},{pos:[18,0.05,2.9],sz:[14,0.06,0.06],h:2},
      {pos:[-18,0.05,-2.9],sz:[14,0.06,0.06],h:3},{pos:[-18,0.05,2.9],sz:[14,0.06,0.06],h:3},
      {pos:[-2.9,3.9,18],sz:[0.06,0.06,14],h:0},{pos:[2.9,3.9,18],sz:[0.06,0.06,14],h:0},
    ];
    neonDefs.forEach(({pos,sz,h},i)=>{
      const nm=new BABYLON.StandardMaterial('neonM'+i,scene);
      nm.diffuseColor=new BABYLON.Color3(...nHues[h].map(v=>v*0.3));
      nm.emissiveColor=new BABYLON.Color3(...nHues[h]);
      const ns=BABYLON.MeshBuilder.CreateBox('neonS'+i,{width:sz[0],height:sz[1],depth:sz[2]},scene);
      ns.position.set(...pos); ns.material=nm;
    });
    [[0,2,18,0],[0,2,-18,1],[18,2,0,2],[-18,2,0,3]].forEach(([x,y,z,c])=>{
      const pl=new BABYLON.PointLight('nPL'+c,new BABYLON.Vector3(x,y,z),scene);
      pl.diffuse=new BABYLON.Color3(...nHues[c]); pl.intensity=0.8; pl.range=10;
    });

    // ── K-pop poster (south corridor east wall) ──────────────────────────────
    const kpTex=new BABYLON.Texture('sprites/kpop-poster.jpg',scene);
    const kpMat=new BABYLON.StandardMaterial('kpM',scene);
    kpMat.diffuseTexture=kpTex; kpMat.emissiveTexture=kpTex;
    kpMat.emissiveColor=new BABYLON.Color3(0.7,0.7,0.7); kpMat.backFaceCulling=false;
    const kpFrame=BABYLON.MeshBuilder.CreateBox('kpFrame',{width:3.2,height:2.2,depth:0.08},scene);
    kpFrame.position.set(2.8,2.1,-18); kpFrame.rotation.y=Math.PI/2;
    const kpFM=new BABYLON.StandardMaterial('kpFM',scene);
    kpFM.diffuseColor=new BABYLON.Color3(0.4,0,0.6); kpFM.emissiveColor=new BABYLON.Color3(0.1,0,0.2);
    kpFrame.material=kpFM;
    const kpPlane=BABYLON.MeshBuilder.CreatePlane('kpPlane',{width:3.0,height:2.0},scene);
    kpPlane.position.set(2.76,2.1,-18); kpPlane.rotation.y=-Math.PI/2; kpPlane.material=kpMat;
    const kpSpot=new BABYLON.SpotLight('kpSpot',new BABYLON.Vector3(0,3.5,-18),new BABYLON.Vector3(1,-0.5,0),Math.PI/4,2,scene);
    kpSpot.diffuse=new BABYLON.Color3(1,0.8,1); kpSpot.intensity=1.2; kpSpot.range=6;

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
    scene.fogStart   = 40;
    scene.fogEnd     = 90;
    scene.fogColor   = new BABYLON.Color3(0.05, 0.01, 0.06);

    setProgress(15, 'Camera...');

    const camera = new BABYLON.UniversalCamera('cam', new BABYLON.Vector3(0, 1.8, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 1.8, 5));
    camera.attachControl(canvas, true);
    camera.speed        = 0.2;
    camera.angularSpeed = 0.005;
    camera.minZ         = 0.1;
    camera.maxZ         = 500;
    camera.ellipsoid    = new BABYLON.Vector3(0.4, 0.9, 0.4);
    camera.checkCollisions = true;
    scene.gravity       = new BABYLON.Vector3(0, -0.98, 0);
    camera.applyGravity = false; // enabled after scene loads
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

    // collision handled in post-build onReadyObservable below

    setProgress(60, 'Loading Silie...');



    if (chosenCharacter === 'meow') {
      const meow = buildMeowCat(scene, 'silie_local');
      meow._baseY = 0; meow.position.set(3, 0, 3); silieRoot = meow;
      BABYLON.SceneLoader.ImportMeshAsync('','sprites/','silie.glb',scene).then(r=>{
        const or=r.meshes.find(m=>!m.parent)||r.meshes[0];
        if(or){or.position.set(-999,0,-999);or.name='other_char_template';window._otherCharRoot=or;}
      }).catch(()=>{});
    } else {
    const charFile = chosenCharacter === 'toca' ? 'toca.glb' : 'silie.glb';
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync('', 'sprites/', charFile, scene);
      console.log('[doom2] Character loaded:', charFile, result.meshes.length, 'meshes');

      // Find the root and fix scale/orientation
      const root = result.meshes.find(m => !m.parent) || result.meshes[0];
      if (root) {
        root.name = 'silie_local';

        // Compute bounding box from individual child meshes (reliable on GLTF)
        result.meshes.forEach(m => m.computeWorldMatrix(true));
        let minY = Infinity, maxY = -Infinity;
        result.meshes.forEach(m => {
          if (!m.getBoundingInfo) return;
          const bi = m.getBoundingInfo();
          minY = Math.min(minY, bi.boundingBox.minimumWorld.y);
          maxY = Math.max(maxY, bi.boundingBox.maximumWorld.y);
        });
        const rawH  = maxY - minY;
        const scale = (rawH > 0.1 && rawH < 1000) ? 1.8 / rawH : 1.0;
        root.scaling.setAll(scale);
        result.meshes.forEach(m => m.computeWorldMatrix(true));

        // Re-measure after scaling to get floor offset
        let minY2 = Infinity;
        result.meshes.forEach(m => {
          if (!m.getBoundingInfo) return;
          m.computeWorldMatrix(true);
          minY2 = Math.min(minY2, m.getBoundingInfo().boundingBox.minimumWorld.y);
        });
        // Set root y so feet sit exactly at y=0
        root.position.set(3, -minY2, 3);
        window._myFloorOffset = 1.8; // fixed eye height (minY2 unreliable on GLTF)
        console.log(`[doom2] char bounds: rawH=${rawH.toFixed(2)} scale=${scale.toFixed(3)} minY2=${minY2.toFixed(3)}`);

        // Store for cloning remote players (this player's chosen char)
        silieRoot = root;
        root.setEnabled(true);
        // Pre-load the OTHER character silently so remotes using it can be cloned
        const otherFile = chosenCharacter === 'toca' ? 'silie.glb' : 'toca.glb';
        BABYLON.SceneLoader.ImportMeshAsync('', 'sprites/', otherFile, scene).then(r => {
          const otherRoot = r.meshes.find(m => !m.parent) || r.meshes[0];
          if (otherRoot) {
            r.meshes.forEach(m => m.computeWorldMatrix(true));
            let oMinY = Infinity, oMaxY = -Infinity;
            r.meshes.forEach(m => {
              if (!m.getBoundingInfo) return;
              const bi = m.getBoundingInfo();
              oMinY = Math.min(oMinY, bi.boundingBox.minimumWorld.y);
              oMaxY = Math.max(oMaxY, bi.boundingBox.maximumWorld.y);
            });
            const oH = oMaxY - oMinY;
            otherRoot.scaling.setAll((oH > 0.1 && oH < 1000) ? 1.8/oH : 1.0);
            r.meshes.forEach(m => m.computeWorldMatrix(true));
            let oMinY2 = Infinity;
            r.meshes.forEach(m => {
              if (!m.getBoundingInfo) return;
              m.computeWorldMatrix(true);
              oMinY2 = Math.min(oMinY2, m.getBoundingInfo().boundingBox.minimumWorld.y);
            });
            otherRoot.position.set(-999, -oMinY2, -999); // park off-level
            otherRoot.name = 'other_char_template';
            window._otherCharRoot = otherRoot;
            if (r.animationGroups?.length > 0) r.animationGroups[0].stop();
            console.log('[doom2] Other char pre-loaded:', otherFile);
        // Retry remotes that were queued waiting for this template
        if (window._pendingRemotes) {
          Object.values(window._pendingRemotes).forEach(m => handleRemotePlayer(m));
          window._pendingRemotes = {};
        }
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
    } // end non-meow

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
          fo: window._myFloorOffset || 0,
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


    // ── Chat bar ─────────────────────────────────────────────────────────────
    const chatMessages = [];
    const MAX_CHAT = 8;
    const charNames = { silie: 'Silie', toca: 'Toca', meow: 'Meow Cat' };

    const chatWrap = document.createElement('div');
    chatWrap.style.cssText = `
      position:fixed; bottom:0; left:0; right:0; z-index:20;
      display:flex; flex-direction:column; pointer-events:none;
    `;
    document.body.appendChild(chatWrap);

    const chatLog = document.createElement('div');
    chatLog.style.cssText = `
      padding:6px 10px; max-height:160px; overflow-y:auto;
      background:linear-gradient(transparent, rgba(0,0,0,0.7));
      font-family:'Courier New',monospace; font-size:0.8rem;
      pointer-events:none;
    `;
    chatWrap.appendChild(chatLog);

    const chatInputRow = document.createElement('div');
    chatInputRow.style.cssText = `
      display:flex; background:rgba(0,0,0,0.75); border-top:1px solid #ff00cc44;
      pointer-events:all;
    `;
    const chatName = document.createElement('span');
    chatName.style.cssText = `padding:6px 8px; color:#ff88ff; font-family:'Courier New',monospace; font-size:0.8rem; white-space:nowrap;`;
    chatName.textContent = (charNames[chosenCharacter] || 'Player') + ':';
    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = 'Type and press Enter to chat...';
    chatInput.style.cssText = `
      flex:1; background:transparent; border:none; outline:none;
      color:#fff; font-family:'Courier New',monospace; font-size:0.8rem;
      padding:6px 8px;
    `;
    chatInputRow.appendChild(chatName);
    chatInputRow.appendChild(chatInput);
    chatWrap.appendChild(chatInputRow);

    addChatMsg = function(sender, text, color) {
      chatMessages.push({ sender, text, color });
      if (chatMessages.length > MAX_CHAT) chatMessages.shift();
      chatLog.innerHTML = chatMessages.map(m =>
        '<div style="color:' + (m.color||'#ccc') + ';margin:1px 0;">' +
        '<span style="color:#ff88ff">' + m.sender + ':</span> ' +
        m.text.replace(/</g,'&lt;') + '</div>'
      ).join('');
      chatLog.scrollTop = chatLog.scrollHeight;
    }

    chatInput.addEventListener('keydown', e => {
      if (e.code === 'Space') e.stopPropagation(); // don't jump while typing
    });
    chatInput.addEventListener('focus', () => { canvas.removeEventListener('click', ()=>{}); });

    chatInput.addEventListener('keyup', e => {
      if (e.key === 'Enter') {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';
        if (text === '/no-meow') {
          window._meowEnabled = false;
          addChatMsg('System', '🔇 Cat sounds muted. /meow to unmute.', '#888'); return;
        }
        if (text === '/meow') {
          window._meowEnabled = true;
          addChatMsg('System', '🔊 Cat sounds on!', '#888'); return;
        }
        if (text === '/fly') {
          camera.applyGravity = false;
          camera._flying = true;
          addChatMsg('System', '🕊 Fly mode ON — WASD to move, mouse to aim up/down. /land to return.', '#00ccff'); return;
        }
        if (text === '/land') {
          camera._flying = false;
          camera.applyGravity = true;
          camera.position.y = Math.max(camera.position.y, 1.82);
          addChatMsg('System', '🦶 Landed. Gravity restored.', '#00ccff'); return;
        }
        if (text === '/help') {
          addChatMsg('System', 'Commands: /fly  /land  /meow  /no-meow  /help', '#888'); return;
        }
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'chat', id: myId,
            char: chosenCharacter, text,
            token: WS_TOKEN,
          }));
        }
      }
    });

    // Press T to focus chat
    window.addEventListener('keydown', e => {
      if (e.key === 't' || e.key === 'T') {
        if (document.activeElement !== chatInput) {
          chatInput.focus();
          e.preventDefault();
        }
      }
      if (e.key === 'Escape') chatInput.blur();
    });

    addChatMsg('System', 'Press T to chat. WASD+mouse to move. SPACE to jump.', '#888');

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



    // ════════════════════════════════════════════════════════════════════════
    // CAT CAFÉ — replaces Room C south chamber with full café + outdoor patio
    // ════════════════════════════════════════════════════════════════════════
    function buildCatCafe(scene) {

      // ── Materials ──────────────────────────────────────────────────────────
      const mk = (n, diff, emis) => {
        const m = new BABYLON.StandardMaterial(n, scene);
        m.diffuseColor = new BABYLON.Color3(...diff);
        if (emis) m.emissiveColor = new BABYLON.Color3(...emis);
        return m;
      };
      const woodMat    = mk('cafeWood',   [0.55, 0.30, 0.12]);
      const darkWoodMat= mk('cafeDkWood', [0.28, 0.13, 0.05]);
      const creamMat   = mk('cafeCream',  [0.97, 0.94, 0.87]);
      const tileMat    = mk('cafeTile',   [0.92, 0.88, 0.82]);
      const glassMat   = mk('cafeGlass',  [0.75, 0.92, 0.95], [0.05, 0.1, 0.12]);
      glassMat.alpha   = 0.35;
      const neonPinkMat= mk('cafeNeonPink',[0.6,0.0,0.3],[1.0,0.08,0.55]);
      const neonYellMat= mk('cafeNeonYell',[0.6,0.55,0],[1.0,0.95,0.1]);
      const wallCafeMat= mk('cafeWall',   [0.95, 0.88, 0.80]);
      const skyMat     = mk('cafeSky',    [0.42, 0.72, 0.95],[0.12,0.35,0.7]);
      const grassMat   = mk('cafeGrass',  [0.25, 0.62, 0.20],[0.02,0.06,0.01]);
      const brickMat   = mk('cafeBrick',  [0.72, 0.38, 0.24]);
      const cushionMat = mk('cafeCushion',[0.85, 0.30, 0.40],[0.05,0,0.02]);
      const cakeRedMat = mk('cakeRed',    [0.90, 0.12, 0.18],[0.12,0,0.01]);
      const cakeBluMat = mk('cakeBlu',    [0.20, 0.42, 0.90],[0,0.02,0.1]);
      const icingMat   = mk('icing',      [0.99, 0.96, 0.93]);
      const chocMat    = mk('choc',       [0.28, 0.14, 0.04]);
      const berryMat   = mk('berry',      [0.80, 0.10, 0.25],[0.08,0,0.01]);
      const lemonMat   = mk('lemon',      [0.98, 0.90, 0.15],[0.08,0.06,0]);
      const greenPlantMat = mk('plant',   [0.15, 0.65, 0.22],[0.01,0.06,0.01]);
      const potMatC    = mk('potC',       [0.52, 0.28, 0.15]);
      const marbleMat  = mk('marble',     [0.96, 0.94, 0.90]);

      const attach = (mesh, mat) => { if (mat) mesh.material = mat; return mesh; };
      const box  = (n,w,h,d,x,y,z,mat) => { const b=BABYLON.MeshBuilder.CreateBox(n,{width:w,height:h,depth:d},scene); b.position.set(x,y,z); return attach(b,mat); };
      const cyl  = (n,h,dt,db,t,x,y,z,mat) => { const c=BABYLON.MeshBuilder.CreateCylinder(n,{height:h,diameterTop:dt,diameterBottom:db,tessellation:t||12},scene); c.position.set(x,y,z); return attach(c,mat); };
      const sph  = (n,d,x,y,z,mat) => { const s=BABYLON.MeshBuilder.CreateSphere(n,{diameter:d,segments:8},scene); s.position.set(x,y,z); return attach(s,mat); };

      // ── Café room: larger than standard rooms ──────────────────────────────
      const CX=0, CZ=-50; // centre of café
      const CW=28, CD=28; // width/depth

      // Floor — warm tile
      const cafeFloor = BABYLON.MeshBuilder.CreateGround('cafeFloor',{width:CW,height:CD},scene);
      cafeFloor.position.set(CX, 0.005, CZ); cafeFloor.material = tileMat;

      // Ceiling — warm cream with exposed beams
      const cafeCeil = BABYLON.MeshBuilder.CreateGround('cafeCeil',{width:CW,height:CD},scene);
      cafeCeil.position.set(CX, 4.5, CZ); cafeCeil.rotation.x=Math.PI; cafeCeil.material=creamMat;
      // ceiling beams removed

      // Walls
      box('cafeW_N', CW, 4.5, 0.3, CX, 2.25, CZ-CD/2, wallCafeMat);


      // South wall has opening to outdoor patio (leave 8-unit gap)
  
  
  

      // Connection to hub — north wall with corridor gap
  
  
  

      // ── CAT CAFE neon sign ──────────────────────────────────────────────────
      const signTex = new BABYLON.DynamicTexture('catcafeSign',{width:1024,height:256},scene,true);
      const sCtx = signTex.getContext();
      sCtx.fillStyle='#0a0005'; sCtx.fillRect(0,0,1024,256);
      // Glow layers
      for (let g=0;g<5;g++) {
        sCtx.shadowColor='#ff00aa'; sCtx.shadowBlur=20+g*8;
        sCtx.fillStyle='#ff00aa';
        sCtx.font='bold 88px Arial'; sCtx.textAlign='center';
        sCtx.fillText('🐱 CAT CAFE 🐱', 512, 100);
        sCtx.font='bold 40px Arial';
        sCtx.fillStyle='#ffcc00';
        sCtx.shadowColor='#ffcc00';
        sCtx.fillText('☕  Fresh Baked Daily  ☕', 512, 168);
      }
      // Bright core
      sCtx.shadowBlur=0;
      sCtx.fillStyle='#ffffff'; sCtx.font='bold 88px Arial';
      sCtx.fillText('🐱 CAT CAFE 🐱', 512, 100);
      sCtx.fillStyle='#ffe066'; sCtx.font='bold 40px Arial';
      sCtx.fillText('☕  Fresh Baked Daily  ☕', 512, 168);
      signTex.update();
      const signMat2 = new BABYLON.StandardMaterial('ccSignMat',scene);
      signMat2.diffuseTexture=signTex; signMat2.emissiveTexture=signTex;
      signMat2.emissiveColor=new BABYLON.Color3(1,1,1); signMat2.backFaceCulling=false;
      const signPlane=BABYLON.MeshBuilder.CreatePlane('ccSign',{width:9,height:2.2},scene);
      signPlane.position.set(CX, 2.6, CZ-CD/2+0.4);
      signPlane.rotation.y = Math.PI;
      signPlane.material=signMat2;
      // Pink glow light under sign
      const signLight=new BABYLON.PointLight('ccSignLight',new BABYLON.Vector3(CX,3,CZ-CD/2+1),scene);
      signLight.diffuse=new BABYLON.Color3(1,0.1,0.6); signLight.intensity=1.2; signLight.range=10;

      // ── Bakery display counter ──────────────────────────────────────────────
      const BX=CX, BZ=CZ-CD/2+2.0; // against north wall

      // Counter base
      box('bakBase', 12, 1.1, 1.2, BX, 0.55, BZ, darkWoodMat);
      // Marble countertop
      box('bakTop', 12.2, 0.08, 1.4, BX, 1.14, BZ, marbleMat);
      // Glass display case (front)
      box('bakGlass', 10, 0.85, 0.06, BX, 0.68, BZ+0.63, glassMat);
      box('bakGlassSide1', 0.06, 0.85, 1.2, BX-5, 0.68, BZ, glassMat);
      box('bakGlassSide2', 0.06, 0.85, 1.2, BX+5, 0.68, BZ, glassMat);
      // Display shelves inside case
      box('bakShelf1', 9.8, 0.04, 1.1, BX, 0.55, BZ-0.1, woodMat);
      box('bakShelf2', 9.8, 0.04, 1.1, BX, 0.85, BZ-0.1, woodMat);

      // ── SNACKS in the display ───────────────────────────────────────────────
      // Row 1 (bottom shelf): croissants, muffins
      for (let i=0;i<5;i++) {
        const cx2=BX-4.5+i*2.2;
        // Croissant body (torus)
        const cr=BABYLON.MeshBuilder.CreateTorus('croissant'+i,{diameter:0.22,thickness:0.1,tessellation:10},scene);
        cr.position.set(cx2, 0.62, BZ-0.08); cr.rotation.x=Math.PI/2; cr.rotation.z=0.3;
        cr.material=mk('crMat'+i,[0.82,0.58,0.18]);
        // Muffin next to it
        const mufBase=cyl('mufBase'+i,0.18,0.26,0.28,12,cx2+0.9,0.62,BZ-0.08,cakeBluMat);
        const mufTop=sph('mufTop'+i,0.28,cx2+0.9,0.80,BZ-0.08,mk('mufTopMat'+i,[0.35,0.20,0.55]));
      }
      // Row 2 (top shelf): cakes, donuts
      // Big 3-layer cake left side
      cyl('cake1bot',0.18,0.7,0.7,16,BX-3.5,0.92,BZ-0.08,cakeRedMat);
      cyl('cake1mid',0.18,0.55,0.55,16,BX-3.5,1.10,BZ-0.08,icingMat);
      cyl('cake1top',0.18,0.40,0.40,16,BX-3.5,1.28,BZ-0.08,cakeRedMat);
      sph('cake1cher',0.1,BX-3.5,1.40,BZ-0.08,berryMat);
      // Chocolate cake right
      cyl('cake2bot',0.22,0.65,0.65,16,BX+3.5,0.92,BZ-0.08,chocMat);
      cyl('cake2top',0.22,0.50,0.50,16,BX+3.5,1.14,BZ-0.08,icingMat);
      sph('cake2cher',0.1,BX+3.5,1.28,BZ-0.08,berryMat);
      // Donuts in middle
      for (let d=0;d<3;d++) {
        const dx=BX-1.2+d*1.2;
        const dn=BABYLON.MeshBuilder.CreateTorus('donut'+d,{diameter:0.24,thickness:0.1,tessellation:14},scene);
        dn.position.set(dx,0.95,BZ-0.08); dn.rotation.x=Math.PI/2;
        dn.material=mk('dnMat'+d,d===0?[0.95,0.6,0.1]:d===1?[0.8,0.15,0.35]:[0.2,0.5,0.9],null);
        // Sprinkles
        for (let s=0;s<5;s++) {
          const sp=box('spr'+d+'_'+s,0.04,0.02,0.04,dx+(Math.random()-0.5)*0.2,1.01,(BZ-0.08)+(Math.random()-0.5)*0.1,mk('sprM'+d+s,[Math.random(),Math.random(),Math.random()]));
        }
      }
      // Lemon tart far right
      cyl('tart1',0.06,0.32,0.35,12,BX+4.5,0.95,BZ-0.08,mk('tartCrust',[0.85,0.65,0.22]));
      cyl('tartFill',0.04,0.28,0.30,12,BX+4.5,1.00,BZ-0.08,lemonMat);

      // ── Coffee machine on counter ───────────────────────────────────────────
      box('cofMachine',0.5,0.7,0.35,BX-5.2,1.5,BZ-0.1,mk('cofMach',[0.2,0.2,0.22],[0.02,0.02,0.03]));
      cyl('cofGroup',0.15,0.12,0.12,8,BX-5.2,1.85,BZ,mk('cofGrp',[0.18,0.15,0.12]));
      // Steam wisps (thin cylinders)
      for(let s=0;s<3;s++){
        const sw=cyl('steam'+s,0.25,0.03,0.05,6,BX-5.1+s*0.08,2.05+s*0.1,BZ,mk('stm'+s,[0.95,0.95,0.98],[0.3,0.3,0.35]));
        sw.material.alpha=0.4;
      }

      // ── Coffee cups on counter ──────────────────────────────────────────────
      [-4, -2, 0, 2, 4].forEach((ox,ci) => {
        cyl('cup'+ci, 0.14, 0.14, 0.11, 10, BX+ox, 1.22, BZ-0.2, mk('cupM'+ci,[0.97,0.94,0.88]));
        cyl('coffee'+ci, 0.04, 0.11, 0.11, 10, BX+ox, 1.30, BZ-0.2, mk('coffeeM'+ci,[0.22,0.12,0.06]));
        // Saucer
        cyl('saucer'+ci, 0.025, 0.2, 0.2, 12, BX+ox, 1.16, BZ-0.2, creamMat);
      });

      // ── Café tables ─────────────────────────────────────────────────────────
      const tablePositions = [
        [-9,CZ+4], [-9,CZ-4], [-9,CZ-12],
        [0, CZ+4], [0, CZ-4], [0, CZ-12],
        [9, CZ+4], [9, CZ-4], [9, CZ-12],
      ];
      tablePositions.forEach(([tx,tz],ti) => {
        // Table top
        cyl('tabTop'+ti, 0.07, 1.0, 1.0, 16, tx, 0.83, tz, marbleMat);
        // Table leg
        cyl('tabLeg'+ti, 0.8, 0.06, 0.06, 8, tx, 0.4, tz, darkWoodMat);
        // Base
        cyl('tabBase'+ti, 0.04, 0.5, 0.5, 8, tx, 0.02, tz, darkWoodMat);
        // Coffee cup on table
        cyl('tCup'+ti, 0.1, 0.09, 0.07, 10, tx+0.2, 0.9, tz+0.1, creamMat);
        cyl('tCoffee'+ti, 0.03, 0.07, 0.07, 10, tx+0.2, 0.95, tz+0.1, chocMat);
        // 2 chairs per table
        [-1,1].forEach((side,si) => {
          const cx3 = tx + side*0.82;
          // Seat
          box('seat'+ti+'_'+si, 0.55, 0.06, 0.5, cx3, 0.52, tz, woodMat);
          // Back
          box('back'+ti+'_'+si, 0.55, 0.52, 0.06, cx3, 0.8, tz+side*0.22, woodMat);
          // 4 legs
          [[-0.22,-0.2],[0.22,-0.2],[-0.22,0.2],[0.22,0.2]].forEach(([lx,lz2],li)=>{
            cyl('cleg'+ti+'_'+si+'_'+li, 0.52, 0.04, 0.04, 6, cx3+lx, 0.26, tz+lz2, darkWoodMat);
          });
          // Cushion on seat
          box('cushion'+ti+'_'+si, 0.50, 0.04, 0.45, cx3, 0.56, tz, cushionMat);
        });
      });

      // ── Plants / window boxes ───────────────────────────────────────────────
      [[-12, CZ+8],[12, CZ+8],[-12, CZ-8],[12, CZ-8]].forEach(([px,pz],pi)=>{
        cyl('plantPot'+pi, 0.45, 0.34, 0.28, 12, px, 0.23, pz, potMatC);
        // Leafy top
        for(let l=0;l<6;l++){
          const ang=l/6*Math.PI*2;
          sph('leaf'+pi+'_'+l, 0.25+Math.random()*0.1, px+Math.cos(ang)*0.15, 0.6+Math.random()*0.12, pz+Math.sin(ang)*0.15, greenPlantMat);
        }
      });

      // ── Chalk menu board on east wall ───────────────────────────────────────
      const menuTex = new BABYLON.DynamicTexture('menuTex',{width:512,height:512},scene,true);
      const mCtx = menuTex.getContext();
      mCtx.fillStyle='#1a1a2e'; mCtx.fillRect(0,0,512,512);
      mCtx.fillStyle='#e8dcc8';
      mCtx.font='bold 32px Arial'; mCtx.textAlign='center';
      mCtx.fillText('MENU', 256, 50);
      mCtx.fillStyle='#c8c8c8'; mCtx.font='22px Arial';
      const items=['☕ Espresso ... $3','☕ Latte ... $4.5','🍰 Cake Slice ... $5',
        '🥐 Croissant ... $3.5','🍩 Donut ... $2.5','🧁 Muffin ... $3',
        '🍋 Lemon Tart ... $4','🍵 Cat Matcha ... $5'];
      items.forEach((item,i)=>mCtx.fillText(item, 256, 100+i*48));
      menuTex.update();
      const menuMat2=new BABYLON.StandardMaterial('menuMat',scene);
      menuMat2.diffuseTexture=menuTex; menuMat2.emissiveTexture=menuTex;
      menuMat2.emissiveColor=new BABYLON.Color3(0.7,0.7,0.7); menuMat2.backFaceCulling=false;
      const menuBoard=BABYLON.MeshBuilder.CreatePlane('menuBoard',{width:2.8,height:2.8},scene);
      menuBoard.position.set(CX+CW/2-0.18, 2.5, CZ-4);
      menuBoard.rotation.y=Math.PI/2;
      menuBoard.scaling.set(0.65,0.65,0.65);
      menuBoard.material=menuMat2;

      // ── String lights across ceiling ────────────────────────────────────────
      // String light bulbs (visual only — fewer actual lights for perf)
      for(let lx=-11;lx<=11;lx+=2.2){
        sph('bulb'+lx, 0.12, CX+lx, 4.2, CZ, mk('bulbM'+lx,[1,0.92,0.5],[1,0.85,0.2]));
      }
      // 3 actual point lights spread across ceiling (not one per bulb)
      [-8,0,8].forEach((lx,li)=>{
        const bl=new BABYLON.PointLight('cLight'+li,new BABYLON.Vector3(CX+lx,4.0,CZ),scene);
        bl.diffuse=new BABYLON.Color3(1,0.88,0.4); bl.intensity=0.8; bl.range=12;
      });

      // ═══════════════════════════════════════════════════════════════════════
      // OUTDOOR PATIO beyond south wall
      // ═══════════════════════════════════════════════════════════════════════
      const OZ = CZ+CD/2+12; // patio centre

      // ── Sky dome ─────────────────────────────────────────────────────────────
      const sky = BABYLON.MeshBuilder.CreateSphere('skyDome',{diameter:110,segments:6},scene);
      sky.position.set(CX, -5, OZ);
      const skyMatFull = new BABYLON.StandardMaterial('skyFull',scene);
      skyMatFull.diffuseColor  = new BABYLON.Color3(0.42,0.72,0.95);
      skyMatFull.emissiveColor = new BABYLON.Color3(0.12,0.35,0.72);
      skyMatFull.backFaceCulling = false;
      skyMatFull.sideOrientation = BABYLON.Mesh.BACKSIDE;
      skyMatFull.disableLighting = true; // sky ignores scene lights
      sky.material = skyMatFull;
      sky.isPickable = false;

      // Sun
      const sun=sph('sun',3.5, CX+30,35,OZ-20, mk('sunMat',[1,0.97,0.5],[1,0.95,0.2]));
      const sunLight=new BABYLON.PointLight('sunLight',new BABYLON.Vector3(CX+30,35,OZ-20),scene);
      sunLight.diffuse=new BABYLON.Color3(1,0.95,0.7); sunLight.intensity=1.5; sunLight.range=200;

      // Clouds (groups of spheres)
      // Simplified clouds (2 spheres each instead of 4)
      [[CX-15,22,OZ-15],[CX+18,24,OZ-10],[CX-3,27,OZ-22]].forEach(([cx2,cy,cz2],ci)=>{
        [[0,0,0],[0.8,0.15,0.3]].forEach(([dx,dy,dz],di)=>{
          const cs=sph('cloud'+ci+'_'+di,2.8,cx2+dx*2.5,cy+dy*1.5,cz2+dz*2,mk('cloudM'+ci+di,[0.97,0.97,0.99],[0.35,0.38,0.42]));
          cs.isPickable=false;
        });
      });

      // Patio floor (stone)
      const stoneMat=mk('stone',[0.75,0.72,0.68]);
      const patioFloor=BABYLON.MeshBuilder.CreateGround('patio',{width:CW,height:24},scene);
      patioFloor.position.set(CX,0.005,OZ); patioFloor.material=stoneMat;
      patioFloor.checkCollisions = true;

      // Grass beyond patio
      const grassField=BABYLON.MeshBuilder.CreateGround('grass',{width:60,height:30},scene);
      grassField.position.set(CX,0.006,OZ+20); grassField.material=grassMat;

      // Patio low walls
      box('patioW_E',0.3,0.9,24,CX+CW/2,0.45,OZ,brickMat);
      box('patioW_W',0.3,0.9,24,CX-CW/2,0.45,OZ,brickMat);
      box('patioW_S',CW,0.9,0.3,CX,0.45,OZ+12,brickMat);

      // Patio tables (outdoor, round with umbrella)
      [[-8,OZ+4],[0,OZ+4],[8,OZ+4],[-8,OZ-4],[8,OZ-4]].forEach(([px,pz2],oi)=>{
        // Table
        cyl('pTab'+oi,0.06,0.9,0.9,16,px,0.78,pz2,stoneMat);
        cyl('pTabLeg'+oi,0.76,0.05,0.05,8,px,0.38,pz2,mk('pLeg'+oi,[0.6,0.6,0.62]));
        // Umbrella pole
        cyl('umbPole'+oi,1.8,0.04,0.04,6,px,1.6,pz2,mk('ump'+oi,[0.5,0.5,0.52]));
        // Umbrella canopy
        cyl('umbTop'+oi,0.12,1.4,0.0,16,px,2.5,pz2,mk('umbt'+oi,oi%2===0?[0.95,0.25,0.3]:[0.2,0.5,0.9],null));
        // 2 patio chairs
        [-1,1].forEach((side2,psi)=>{
          box('pSeat'+oi+'_'+psi,0.45,0.05,0.4,px+side2*0.72,0.48,pz2,stoneMat);
          box('pBack'+oi+'_'+psi,0.45,0.4,0.05,px+side2*0.72,0.7,pz2+side2*0.19,stoneMat);
        });
      });

      // Flower planters along patio walls
      [-10,-5,0,5,10].forEach((ox,fi)=>{
        cyl('flPot'+fi,0.4,0.35,0.28,10,CX+ox,0.2,OZ+11.5,mk('flPotM'+fi,[0.6,0.3,0.15]));
        // Flowers
        for(let f=0;f<5;f++){
          const ang2=f/5*Math.PI*2;
          sph('flower'+fi+'_'+f,0.22,CX+ox+Math.cos(ang2)*0.18,0.55,OZ+11.5+Math.sin(ang2)*0.18,
            mk('flM'+fi+f,[[1,0.2,0.4],[1,0.8,0.1],[0.3,0.6,1],[0.8,0.2,0.8],[1,0.5,0]][f%5]));
        }
      });

      // Trees
      [[CX-12,OZ+8],[CX+12,OZ+8],[CX-12,OZ-2],[CX+12,OZ-2]].forEach(([tx2,tz2],ti2)=>{
        // Trunk
        cyl('trunk'+ti2,2.5,0.2,0.28,8,tx2,1.25,tz2,mk('trunkM'+ti2,[0.38,0.22,0.08]));
        // Canopy (layered spheres)
        [[0,2.8,0],[0.4,2.4,0.3],[-0.3,2.5,-0.4],[0,3.2,0]].forEach(([dx,dy,dz],li2)=>{
          sph('leaves'+ti2+'_'+li2,1.2+Math.random()*0.3,tx2+dx,dy+tz2*0,tz2+dz,greenPlantMat);
        });
      });

      // String lights on patio (zigzag across posts)
      // Patio string lights (visual bulbs, 2 real lights)
      for(let lx2=-11;lx2<=11;lx2+=2.5){
        const zig=(Math.floor((lx2+11)/2.5))%2===0?OZ-3:OZ+3;
        sph('patBulb'+lx2,0.1,CX+lx2,3.2,zig,mk('patBM'+lx2,[1,0.92,0.5],[1,0.88,0.2]));
      }
      [-6,6].forEach((lx2,li2)=>{
        const pl2=new BABYLON.PointLight('patL'+li2,new BABYLON.Vector3(CX+lx2,3.0,OZ),scene);
        pl2.diffuse=new BABYLON.Color3(1,0.88,0.4); pl2.intensity=0.6; pl2.range=14;
      });

      // Ambient fill light for outdoor
      const outdoorLight=new BABYLON.HemisphericLight('outdoorAmb',new BABYLON.Vector3(0,1,0),scene);
      outdoorLight.diffuse=new BABYLON.Color3(0.7,0.85,1.0);
      outdoorLight.groundColor=new BABYLON.Color3(0.3,0.5,0.2);
      outdoorLight.intensity=0.7;

      console.log('[doom2] Cat Cafe built!');
    }

    buildCatCafe(scene);

    // ── Scene ready: set collisions then freeze decorations (order matters!) ────
    // Collisions set at mesh-creation. onReady just defers gravity 2 frames.
    scene.onReadyObservable.addOnce(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        camera.position.y = Math.max(camera.position.y, 1.85);
        camera.applyGravity = true;
        const colFloors = scene.meshes.filter(m => m.checkCollisions && !m.name.startsWith('npc'));
        console.log('[doom2] Gravity ON. Collision floors:', colFloors.length, colFloors.map(m=>m.name).slice(0,5).join(','));
      }));
    });
    scene.fogEnd = 75;

    // ── Roaming NPC Meow Cats ────────────────────────────────────────────────
    function spawnRoamingCats(scene) {
      // Preload real cat meow MP3
      const meowAudio = new Audio('sprites/meow.mp3');
      const meowAudio2 = new Audio('sprites/meow2.mp3');
      meowAudio2.preload = 'auto';
      meowAudio.preload = 'auto';
      let meowUnlocked = false;
      const unlockMeow = () => {
        if (meowUnlocked) return;
        meowUnlocked = true;
        meowAudio.play().then(() => meowAudio.pause()).catch(() => {});
        meowAudio2.play().then(() => meowAudio2.pause()).catch(() => {});
        document.removeEventListener('click', unlockMeow);
        document.removeEventListener('keydown', unlockMeow);
        document.removeEventListener('touchstart', unlockMeow);
      };
      document.addEventListener('click', unlockMeow);
      document.addEventListener('keydown', unlockMeow);
      document.addEventListener('touchstart', unlockMeow);

      function playMeow() {
        if (!meowUnlocked) return;
        const src2 = Math.random() < 0.5 ? meowAudio : meowAudio2;
        const m = src2.cloneNode();
        m.volume = 0.55 + Math.random() * 0.3;
        m.playbackRate = 0.88 + Math.random() * 0.24;
        m.play().catch(() => {});
      }

      const catStartPositions = [
        [5, 0, 5], [-5, 0, -5], [0, 0, -50]
      ];

      // 3 different cat color combos
      const catColors = [
        [[0.88, 0.52, 0.15], [0.42, 0.18, 0.02], true],  // orange tabby
        [[0.85, 0.85, 0.85], [0.5, 0.5, 0.5],   false],  // grey
        [[0.9, 0.85, 0.7],   [0.6, 0.45, 0.25], false],  // cream
      ];

      catStartPositions.forEach((startPos, i) => {
        const [fur, accent, tabbyMode] = catColors[i % catColors.length];
        const cat = buildCartoonCat(scene, 'npc_cat_' + i, fur, accent, tabbyMode);
        cat.position.set(...startPos);
        cat._baseY = startPos[1];

        let targetX = startPos[0], targetZ = startPos[2];
        let pausing = false, pauseTimer = 0;
        const speed = 0.02 + Math.random() * 0.015;

        function newWaypoint() {
          targetX = startPos[0] + (Math.random() - 0.5) * 14;
          targetZ = startPos[2] + (Math.random() - 0.5) * 14;
          targetX = Math.max(-9, Math.min(9, targetX));
          targetZ = Math.max(-9, Math.min(9, targetZ));
        }
        newWaypoint();

        let meowTimer = 8 + Math.random() * 8 + i * 3;

        scene.onBeforeRenderObservable.add(() => {
          const dt = engine.getDeltaTime() / 1000;
          meowTimer -= dt;
          if (meowTimer <= 0) {
            if (window._meowEnabled !== false) playMeow();
            meowTimer = 10 + Math.random() * 12;
          }
          if (pausing) {
            pauseTimer -= dt;
            if (pauseTimer <= 0) { pausing = false; newWaypoint(); }
            return;
          }
          const dx = targetX - cat.position.x;
          const dz = targetZ - cat.position.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          if (dist < 0.3) { pausing = true; pauseTimer = 1 + Math.random() * 3; return; }
          cat.position.x += (dx / dist) * speed;
          cat.position.z += (dz / dist) * speed;
          cat.rotation.y = Math.atan2(dx, dz);
        });
      });
    }

    // Spawn cats after a short delay (so audio context can activate on user gesture)
    setTimeout(() => spawnRoamingCats(scene), 2000);


    // ── Touch / iPad Controls ─────────────────────────────────────────────────
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {

      // ── Left joystick (movement) ────────────────────────────────────────────
      // Scale UI for phone vs tablet
      const isPhone = window.innerWidth < 768 || window.innerHeight < 768;
      const joySize   = isPhone ? 100 : 130;
      const knobSize  = isPhone ?  40 :  52;
      const joyBottom = isPhone ?  90 : 110;
      const btnSize   = isPhone ?  58 :  72;

      const joystickWrap = document.createElement('div');
      joystickWrap.style.cssText = `
        position:fixed; left:24px; bottom:${joyBottom}px;
        width:${joySize}px; height:${joySize}px;
        border-radius:50%; border:2px solid rgba(255,0,204,0.4);
        background:rgba(0,0,0,0.35); touch-action:none; z-index:30;
        display:flex; align-items:center; justify-content:center;
      `;
      const joystickKnob = document.createElement('div');
      joystickKnob.style.cssText = `
        width:${knobSize}px; height:${knobSize}px; border-radius:50%;
        background:rgba(255,0,204,0.55); border:2px solid rgba(255,0,204,0.8);
        position:absolute; left:50%; top:50%;
        transform:translate(-50%,-50%); transition:background 0.1s;
        pointer-events:none;
      `;
      joystickWrap.appendChild(joystickKnob);
      document.body.appendChild(joystickWrap);

      let joyActive = false, joyTouchId = null;
      let joyBaseX = 0, joyBaseY = 0;
      let moveX = 0, moveZ = 0;
      const JOY_MAX = isPhone ? 36 : 48;

      joystickWrap.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.changedTouches[0];
        joyActive = true; joyTouchId = t.identifier;
        const r = joystickWrap.getBoundingClientRect();
        joyBaseX = r.left + r.width/2;
        joyBaseY = r.top  + r.height/2;
      }, { passive: false });

      document.addEventListener('touchmove', e => {
        if (!joyActive) return;
        for (const t of e.changedTouches) {
          if (t.identifier !== joyTouchId) continue;
          let dx = t.clientX - joyBaseX;
          let dy = t.clientY - joyBaseY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > JOY_MAX) { dx = dx/dist*JOY_MAX; dy = dy/dist*JOY_MAX; }
          joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
          moveX = dx / JOY_MAX;
          moveZ = dy / JOY_MAX;
        }
      }, { passive: true });

      const endJoy = e => {
        for (const t of e.changedTouches) {
          if (t.identifier === joyTouchId) {
            joyActive = false; joyTouchId = null;
            moveX = 0; moveZ = 0;
            joystickKnob.style.transform = 'translate(-50%,-50%)';
          }
        }
      };
      document.addEventListener('touchend', endJoy);
      document.addEventListener('touchcancel', endJoy);

      // Apply joystick to camera each frame
      scene.onBeforeRenderObservable.add(() => {
        if (!joyActive) return;
        const speed = 0.18;
        const fwd = camera.getDirection(BABYLON.Vector3.Forward());
        const right = camera.getDirection(BABYLON.Vector3.Right());
        fwd.y = 0; fwd.normalize();
        right.y = 0; right.normalize();
        camera.position.addInPlace(fwd.scale(-moveZ * speed));
        camera.position.addInPlace(right.scale(moveX * speed));
      });

      // ── Right-side look (touch drag) ────────────────────────────────────────
      let lookTouchId = null, lastLookX = 0, lastLookY = 0;

      document.addEventListener('touchstart', e => {
        for (const t of e.changedTouches) {
          if (t.clientX > window.innerWidth * 0.45 && t.identifier !== joyTouchId) {
            lookTouchId = t.identifier;
            lastLookX = t.clientX;
            lastLookY = t.clientY;
          }
        }
      }, { passive: true });

      document.addEventListener('touchmove', e => {
        for (const t of e.changedTouches) {
          if (t.identifier !== lookTouchId) continue;
          const dx = t.clientX - lastLookX;
          const dy = t.clientY - lastLookY;
          lastLookX = t.clientX;
          lastLookY = t.clientY;
          camera.rotation.y += dx * 0.004;
          camera.rotation.x += dy * 0.003;
          camera.rotation.x = Math.max(-1.2, Math.min(1.2, camera.rotation.x));
        }
      }, { passive: true });

      document.addEventListener('touchend', e => {
        for (const t of e.changedTouches) {
          if (t.identifier === lookTouchId) lookTouchId = null;
        }
      });

      // ── Jump button ─────────────────────────────────────────────────────────
      const jumpBtn = document.createElement('div');
      jumpBtn.textContent = '⬆';
      jumpBtn.style.cssText = `
        position:fixed; right:24px; bottom:${isPhone ? 140 : 170}px;
        width:${btnSize}px; height:${btnSize}px; border-radius:50%;
        background:rgba(0,0,0,0.45); border:2px solid rgba(255,0,204,0.5);
        color:#ff00cc; font-size:${isPhone ? '1.5' : '2'}rem; display:flex;
        align-items:center; justify-content:center;
        touch-action:none; z-index:30; user-select:none;
      `;
      document.body.appendChild(jumpBtn);
      jumpBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (!jumping) { jumping = true; jumpVel = 7; }
      }, { passive: false });

      // ── Chat button (opens/closes keyboard on touch) ─────────────────────────
      const chatBtn = document.createElement('div');
      chatBtn.textContent = '💬';
      chatBtn.style.cssText = `
        position:fixed; right:24px; bottom:${isPhone ? 68 : 82}px;
        width:${isPhone ? 48 : 60}px; height:${isPhone ? 48 : 60}px; border-radius:50%;
        background:rgba(0,0,0,0.45); border:2px solid rgba(255,0,204,0.4);
        font-size:1.6rem; display:flex; align-items:center; justify-content:center;
        touch-action:none; z-index:30;
      `;
      document.body.appendChild(chatBtn);
      chatBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        chatInput.focus();
      }, { passive: false });

      // ── D-pad label hints ───────────────────────────────────────────────────
      const padLabel = document.createElement('div');
      padLabel.style.cssText = `
        position:fixed; left:24px; bottom:${isPhone ? 68 : 82}px;
        font-family:'Courier New',monospace; font-size:0.65rem;
        color:rgba(255,0,204,0.5); z-index:30; pointer-events:none;
        text-align:center; width:130px;
      `;
      padLabel.textContent = 'MOVE';
      document.body.appendChild(padLabel);

      const lookLabel = document.createElement('div');
      lookLabel.style.cssText = `
        position:fixed; right:120px; bottom:220px;
        font-family:'Courier New',monospace; font-size:0.65rem;
        color:rgba(255,0,204,0.4); z-index:30; pointer-events:none;
      `;
      lookLabel.textContent = 'drag to look';
      document.body.appendChild(lookLabel);

    } // end isTouchDevice

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
