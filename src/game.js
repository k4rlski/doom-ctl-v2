/**
 * doom-ctl v2 — Babylon.js WebGL Engine
 * Full 3D, 60fps, GLTF model support, iPad/mobile ready
 * Multiplayer via same WebSocket server (port 3667)
 *
 * Status: SCAFFOLD — engine boots, scene renders, model loads
 * TODO: level geometry, tool terminals, full multiplayer
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

  async function init() {
    setProgress(10, 'Creating Babylon engine...');

    // ── Engine & Scene ────────────────────────────────────────────────────────
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.04, 0.04, 0.08, 1);

    // Enable VR/XR-compatible resize
    window.addEventListener('resize', () => engine.resize());

    setProgress(20, 'Setting up camera...');

    // ── Camera (FPS style) ────────────────────────────────────────────────────
    const camera = new BABYLON.UniversalCamera(
      'cam', new BABYLON.Vector3(0, 1.8, -5), scene
    );
    camera.setTarget(new BABYLON.Vector3(0, 1.8, 0));
    camera.attachControl(canvas, true);
    camera.speed        = 0.15;
    camera.angularSpeed = 0.005;
    camera.minZ         = 0.1;
    camera.keysUp    = [87, 38]; // W / ↑
    camera.keysDown  = [83, 40]; // S / ↓
    camera.keysLeft  = [65, 37]; // A / ←
    camera.keysRight = [68, 39]; // D / →

    setProgress(30, 'Lighting the scene...');

    // ── Lighting ──────────────────────────────────────────────────────────────
    const ambient = new BABYLON.HemisphericLight(
      'ambient', new BABYLON.Vector3(0, 1, 0), scene
    );
    ambient.intensity    = 0.3;
    ambient.diffuse      = new BABYLON.Color3(0.1, 0.4, 0.3);
    ambient.groundColor  = new BABYLON.Color3(0.05, 0.1, 0.1);

    const point = new BABYLON.PointLight(
      'point', new BABYLON.Vector3(0, 3, 0), scene
    );
    point.diffuse    = new BABYLON.Color3(0, 1, 0.5);
    point.intensity  = 0.8;
    point.range      = 20;

    setProgress(40, 'Building arena...');

    // ── Placeholder level geometry ────────────────────────────────────────────
    // Simple dark room to prove the engine works — real level geometry comes in v2.1
    const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 40, height: 40 }, scene);
    const floorMat = new BABYLON.StandardMaterial('floorMat', scene);
    floorMat.diffuseColor  = new BABYLON.Color3(0.08, 0.08, 0.1);
    floorMat.specularColor = new BABYLON.Color3(0.02, 0.05, 0.03);
    floor.material = floorMat;

    // Walls (temp)
    const wallMat = new BABYLON.StandardMaterial('wallMat', scene);
    wallMat.diffuseColor  = new BABYLON.Color3(0.1, 0.12, 0.1);
    wallMat.emissiveColor = new BABYLON.Color3(0.01, 0.03, 0.02);
    const wallH = 4, wallW = 40;
    [
      [0, wallH/2, -20, wallW, wallH, 0.3, 0],
      [0, wallH/2,  20, wallW, wallH, 0.3, 0],
      [-20, wallH/2, 0, 0.3, wallH, wallW, 0],
      [ 20, wallH/2, 0, 0.3, wallH, wallW, 0],
    ].forEach(([x, y, z, w, h, d], i) => {
      const wall = BABYLON.MeshBuilder.CreateBox(`wall${i}`, { width: w, height: h, depth: d }, scene);
      wall.position.set(x, y, z);
      wall.material = wallMat;
    });

    // Ceiling
    const ceil = BABYLON.MeshBuilder.CreateGround('ceil', { width: 40, height: 40 }, scene);
    ceil.position.y = 4;
    ceil.rotation.x = Math.PI;
    ceil.material   = wallMat;

    setProgress(60, 'Loading Silie...');

    // ── Load Silie's 3D model ─────────────────────────────────────────────────
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        '', 'sprites/', 'silie.glb', scene
      );
      console.log('[doom2] Silie loaded:', result.meshes.length, 'meshes');

      // Position her in the scene
      result.meshes.forEach(m => {
        if (m.name === '__root__' || !m.parent) {
          m.position.set(0, 0, 2);
          m.scaling.setAll(0.01); // FBX units are usually cm; scale down
        }
      });

      // Play first animation if any
      if (result.animationGroups?.length > 0) {
        result.animationGroups[0].start(true); // loop
        console.log('[doom2] Animation:', result.animationGroups[0].name);
      }
    } catch (e) {
      console.warn('[doom2] Could not load silie.glb:', e.message);
      // Fallback: cyan placeholder box
      const box = BABYLON.MeshBuilder.CreateBox('player_placeholder', { height: 1.8, width: 0.6, depth: 0.4 }, scene);
      box.position.set(0, 0.9, 2);
      const boxMat = new BABYLON.StandardMaterial('playerMat', scene);
      boxMat.diffuseColor  = new BABYLON.Color3(0, 0.85, 1);
      boxMat.emissiveColor = new BABYLON.Color3(0, 0.2, 0.3);
      box.material = boxMat;
    }

    setProgress(80, 'Connecting multiplayer...');

    // ── Multiplayer stub (WebSocket port 3667) ────────────────────────────────
    // Same protocol as v1 — to be fully wired in v2.1
    let ws = null;
    const myId = 'p2_' + Math.random().toString(36).slice(2, 6);
    const remotePlayers = {};

    function connectWS() {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${proto}://${location.host}/ws?token=b571e78fd651706ada84b3d017bab50ba50aa1046d69c44e`);
      ws.onopen  = () => console.log('[doom2] WS connected');
      ws.onclose = () => { console.log('[doom2] WS closed, reconnecting...'); setTimeout(connectWS, 3000); };
      ws.onerror = e  => console.warn('[doom2] WS error', e);
      ws.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'player') {
            // TODO: render remote players as Silie clones
            remotePlayers[msg.id] = { x: msg.x, y: msg.y, z: msg.z || 0 };
          }
        } catch {}
      };
    }
    connectWS();

    // Send position at 20Hz
    setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        const p = camera.position;
        ws.send(JSON.stringify({ type: 'player', id: myId, x: p.x, y: p.y, z: p.z, token: 'b571e78fd651706ada84b3d017bab50ba50aa1046d69c44e' }));
      }
    }, 50);

    setProgress(95, 'Starting render loop...');

    // ── HUD overlay ───────────────────────────────────────────────────────────
    const advTex = BABYLON.GUI.AdvancedDynamicTexture?.CreateFullscreenUI('hud', true, scene);
    if (advTex) {
      // Online counter — load babylon GUI if available
    }

    // ── Render loop ───────────────────────────────────────────────────────────
    engine.runRenderLoop(() => scene.render());

    // ── Hide loading screen ───────────────────────────────────────────────────
    setProgress(100, 'Ready.');
    await new Promise(r => setTimeout(r, 400));
    loading.style.transition = 'opacity 0.5s';
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 520);

    console.log('[doom2] Engine running. FPS target: 60. Silie is in the building.');
  }

  // Boot
  window.addEventListener('load', () => {
    init().catch(e => {
      console.error('[doom2] Boot failed:', e);
      status.textContent = 'Error: ' + e.message;
      fill.style.background = '#ff4444';
    });
  });

})();
