// Saved NPC cat functions — restore to src/game.js to use procedural cats
// See docs/doom-ctl-v2-rag.md for restoration instructions

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
