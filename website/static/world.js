// The home page's day in 3D: five small rooms (kitchen, lab, eating out, gym, bedroom) on an arc, with the camera
// flying from one to the next as the section scrolls and the Captain walking the path between them. Three.js is
// self-hosted in static/vendor/three and only loaded when the section comes near. Without WebGL, with reduced motion,
// with data saver or on a low-memory phone, nothing here runs and the section stays a plain list of cards.
const sec = document.querySelector('[data-world]');
if (sec && canRun()) {
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    boot().catch((e) => { console.warn('world', e); sec.classList.remove('w3d-on'); });
  }, { rootMargin: '120% 0px' });
  io.observe(sec);
}

function canRun() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const nav = navigator;
  if (nav.connection && nav.connection.saveData) return false;
  if (nav.deviceMemory && nav.deviceMemory < 3) return false;
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
}

async function boot() {
  const v = new URL('./vendor/three/', import.meta.url).href;
  const [THREE, { RoomEnvironment }, { RoundedBoxGeometry }, { mergeGeometries }] = await Promise.all([
    import(v + 'three.module.min.js'), import(v + 'RoomEnvironment.js'), import(v + 'RoundedBoxGeometry.js'), import(v + 'BufferGeometryUtils.js'),
  ]);
  const canvas = sec.querySelector('canvas');
  const steps = [...sec.querySelectorAll('.w3d-step')];
  const rtl = document.documentElement.dir === 'rtl';
  const small = () => Math.min(innerWidth, innerHeight) < 720;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  let ratio = Math.min(devicePixelRatio, small() ? 1.5 : 2);
  renderer.setPixelRatio(ratio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 26, 70);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 140);

  // ---------- light ----------
  scene.add(new THREE.HemisphereLight(0xf2efe9, 0x050505, 0.35));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
  key.position.set(-8, 22, 18);
  key.target.position.set(0, 0, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(small() ? 1024 : 2048, small() ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -20, right: 20, top: 14, bottom: -14, near: 1, far: 70 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9fb7ff, 0.45); rim.position.set(10, 8, -14); scene.add(rim);

  // ---------- materials ----------
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, ...o });
  const glow = (color, i = 1.6) => std(color, { emissive: color, emissiveIntensity: i, roughness: 0.4 });
  const M = {
    floor: std(0x050505, { roughness: 0.45, metalness: 0.1 }),
    plinth: std(0x161618, { roughness: 0.55, metalness: 0.15 }),
    char: std(0x2a2a2d, { roughness: 0.6 }),
    dark: std(0x111113, { roughness: 0.4, metalness: 0.3 }),
    stone: std(0xe9e6e1, { roughness: 0.28 }),
    white: std(0xf5f5f7, { roughness: 0.35 }),
    ti: std(0xb5afa6, { roughness: 0.28, metalness: 0.85 }),
    tiMatte: std(0x8f8a83, { roughness: 0.9 }),
    chrome: std(0xdedede, { roughness: 0.12, metalness: 1 }),
    rubber: std(0x1b1b1d, { roughness: 0.85 }),
    green: glow(0x19e68c),
    greenSoft: std(0x0f3a27, { emissive: 0x19e68c, emissiveIntensity: 0.25, roughness: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, thickness: 0.2, transparent: true, opacity: 0.35 }),
    wood: std(0x6b5443, { roughness: 0.55 }),
    yolk: std(0xffb21a, { roughness: 0.4 }), egg: std(0xfffaf0, { roughness: 0.45 }),
    leaf: std(0x3f8f4a, { roughness: 0.6 }), tomato: std(0xd8432f, { roughness: 0.35 }),
    bread: std(0xc9935a, { roughness: 0.7 }), coffee: std(0x2b170c, { roughness: 0.2 }), orange: std(0xf08a24, { roughness: 0.5 }),
    meat: std(0x5a2e1c, { roughness: 0.7 }), cheese: std(0xffc93c, { roughness: 0.5 }),
    warm: glow(0xffd9a0, 3), window: std(0xfff1db, { emissive: 0xffe2b8, emissiveIntensity: 1.1 }),
    panel: std(0xf2f4f7, { emissive: 0xe8eef7, emissiveIntensity: 0.55 }),
    screen: std(0x06140d, { emissive: 0x0a3020, emissiveIntensity: 0.9 }),
    blood: std(0x9e1b22, { roughness: 0.2 }), amber: std(0xd99a1f, { roughness: 0.2 }),
    night: std(0x0a1630, { emissive: 0x16305e, emissiveIntensity: 0.7 }), moon: glow(0xf3f0e6, 1.4),
    mirror: std(0x0c0c0e, { roughness: 0.04, metalness: 1 }),
  };

  // Every static part of a room is added through add(); merge() later folds them into one mesh per material, so a
  // room costs a handful of draw calls instead of hundreds.
  const add = (parent, geo, mat, x = 0, y = 0, z = 0, opt = {}) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (opt.r) m.rotation.set(...opt.r);
    if (opt.s) m.scale.set(...opt.s);
    m.castShadow = opt.cast !== false; m.receiveShadow = true;
    parent.add(m); return m;
  };
  const rbox = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2));
  const cyl = (rt, rb, h, s = 36) => new THREE.CylinderGeometry(rt, rb, h, s);
  const sph = (r, s = 28) => new THREE.SphereGeometry(r, s, Math.round(s * 0.7));
  const torus = (r, t, arc = Math.PI * 2, s = 64) => new THREE.TorusGeometry(r, t, 10, s, arc);
  /** A thin bar from (x1, y1) to (x2, y2) on a wall at depth z: used for the chart on the lab's light box. */
  const seg = (g, mat, x1, y1, x2, y2, z, t = 0.035) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    add(g, rbox(len + t, t, t, t / 2), mat, (x1 + x2) / 2, (y1 + y2) / 2, z, { r: [0, 0, Math.atan2(y2 - y1, x2 - x1)], cast: false });
  };

  /** Parts that move (rings, the pin, lights) stay separate meshes. */
  const moving = (o) => { for (let p = o; p; p = p.parent) if (p.userData.dyn) return true; return false; };
  function merge(group) {
    group.updateMatrixWorld(true);
    const buckets = new Map();
    group.traverse((o) => {
      if (!o.isMesh || moving(o)) return;
      const k = o.material.uuid + (o.castShadow ? 'c' : 'n');
      if (!buckets.has(k)) buckets.set(k, { mat: o.material, cast: o.castShadow, geos: [] });
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
      g.applyMatrix4(o.matrixWorld);
      buckets.get(k).geos.push(g);
    });
    const dyn = group.children.filter((o) => o.userData.dyn);
    const out = new THREE.Group();
    for (const b of buckets.values()) {
      const m = new THREE.Mesh(mergeGeometries(b.geos, false), b.mat);
      m.castShadow = b.cast; m.receiveShadow = true; out.add(m);
      b.geos.forEach((g) => g.dispose());
    }
    for (const d of dyn) { const w = new THREE.Vector3(), q = new THREE.Quaternion(); d.getWorldPosition(w); d.getWorldQuaternion(q); d.position.copy(w); d.quaternion.copy(q); out.add(d); }
    return out;
  }

  // ---------- the rooms ----------
  const top = 0.36;
  const lights = !small();
  const spin = [];

  /** A plinth for each room with a thin green line at its foot, plus the room's back wall. */
  function base(g) {
    add(g, rbox(7.4, 0.36, 5.6, 0.16), M.plinth, 0, 0.18, 0);
    add(g, rbox(7.46, 0.03, 5.66, 0.02), M.green, 0, 0.02, 0, { cast: false });
    add(g, rbox(7.2, 3.6, 0.2, 0.05), M.char, 0, top + 1.8, -2.65);
  }
  /** The app's calorie ring floating over a room, drawn in light; it turns slowly. */
  function ring(g, x, y, z, share) {
    const r = new THREE.Group(); r.position.set(x, y, z); r.userData.dyn = true; g.add(r);
    const a = new THREE.Mesh(torus(0.6, 0.025), std(0x222224, { roughness: 0.5 }));
    const b = new THREE.Mesh(torus(0.6, 0.035, Math.PI * 2 * share), M.green); b.rotation.z = Math.PI / 2;
    r.add(a, b); spin.push(r); return r;
  }
  const point = (g, color, i, x, y, z) => { if (!lights) return; const l = new THREE.PointLight(color, i, 6, 2); l.position.set(x, y, z); l.userData.dyn = true; g.add(l); };

  function kitchen(g) {
    base(g);
    add(g, rbox(2.2, 1.5, 0.05, 0.03), M.window, 1.7, top + 2.35, -2.53, { cast: false });
    for (const y of [2.05, 2.75]) add(g, rbox(2.2, 0.07, 0.36, 0.02), M.wood, -1.8, top + y, -2.35);
    for (let i = 0; i < 4; i++) add(g, cyl(0.12, 0.12, 0.34), i % 2 ? M.white : M.stone, -2.6 + i * 0.5, top + 2.28, -2.35);
    for (let i = 0; i < 3; i++) add(g, cyl(0.09, 0.11, 0.42), M.glass, -2.4 + i * 0.6, top + 2.98, -2.35);
    add(g, rbox(5.2, 1.0, 0.75), M.char, -0.8, top + 0.5, -2.1);
    add(g, rbox(5.24, 0.07, 0.8, 0.02), M.stone, -0.8, top + 1.03, -2.1);
    add(g, rbox(0.9, 0.02, 0.55, 0.01), M.dark, 0.4, top + 1.075, -2.1);
    add(g, rbox(1.1, 2.6, 0.85, 0.08), M.ti, 2.75, top + 1.3, -2.05);
    add(g, rbox(0.04, 1.0, 0.04, 0.015), M.chrome, 2.3, top + 1.6, -1.6);
    add(g, rbox(3.4, 1.0, 1.3, 0.08), M.char, -0.4, top + 0.5, 0.25);
    add(g, rbox(3.6, 0.09, 1.45, 0.04), M.stone, -0.4, top + 1.04, 0.25);
    add(g, rbox(3.42, 0.04, 0.02, 0.01), M.green, -0.4, top + 0.12, 0.91, { cast: false });
    for (const x of [-1.5, -0.4, 0.7]) {
      add(g, cyl(0.26, 0.26, 0.07), M.ti, x, top + 0.78, 1.35);
      add(g, cyl(0.035, 0.035, 0.72, 12), M.chrome, x, top + 0.39, 1.35);
      add(g, torus(0.18, 0.015, Math.PI * 2, 32), M.chrome, x, top + 0.3, 1.35, { r: [Math.PI / 2, 0, 0] });
    }
    const plate = (x, z) => { add(g, cyl(0.42, 0.36, 0.04, 40), M.white, x, top + 1.11, z); return top + 1.14; };
    let y = plate(-1.3, 0.2);
    for (const [dx, dz] of [[-0.1, -0.05], [0.14, 0.1]]) {
      add(g, cyl(0.15, 0.17, 0.03, 28), M.egg, -1.3 + dx, y, 0.2 + dz);
      add(g, sph(0.065, 16), M.yolk, -1.3 + dx, y + 0.03, 0.2 + dz, { s: [1, 0.55, 1] });
    }
    add(g, rbox(0.3, 0.06, 0.18, 0.03), M.bread, -1.15, y + 0.02, -0.05, { r: [0, 0.4, 0] });
    y = plate(-0.2, 0.3);
    for (let i = 0; i < 9; i++) { const a = i * 2.4; add(g, sph(0.07, 10), i % 3 ? M.leaf : M.tomato, -0.2 + Math.cos(a) * 0.16, y + 0.04, 0.3 + Math.sin(a) * 0.16, { s: [1, 0.6, 1] }); }
    add(g, cyl(0.1, 0.08, 0.2), M.white, 0.65, top + 1.19, 0.05);
    add(g, cyl(0.085, 0.085, 0.01), M.coffee, 0.65, top + 1.29, 0.05, { cast: false });
    add(g, torus(0.055, 0.016, Math.PI * 2, 20), M.white, 0.76, top + 1.19, 0.05, { r: [0, 0, Math.PI / 2] });
    add(g, new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.ti, 1.0, top + 1.42, 0.5);
    for (const [dx, dz, m] of [[0, 0, M.orange], [0.15, 0.08, M.orange], [-0.12, 0.1, M.tomato], [0.05, -0.15, M.leaf]]) add(g, sph(0.11, 16), m, 1.0 + dx, top + 1.24, 0.5 + dz);
    for (const x of [-1.4, -0.4, 0.6]) {
      add(g, cyl(0.006, 0.006, 1.4, 6), M.dark, x, top + 3.1, 0.25, { cast: false });
      add(g, new THREE.ConeGeometry(0.2, 0.22, 32, 1, true), M.ti, x, top + 2.35, 0.25);
      add(g, sph(0.06, 12), M.warm, x, top + 2.27, 0.25, { cast: false });
    }
    point(g, 0xffd9a0, 6, -0.4, top + 2.1, 0.25);
    ring(g, 2.0, 3.6, 0.4, 0.34);
  }

  function lab(g) {
    base(g);
    // A light box on the wall with a results chart: the line goes down, then levels into the green band.
    add(g, rbox(3.0, 1.7, 0.06, 0.04), M.panel, -0.9, top + 2.15, -2.52, { cast: false });
    add(g, rbox(2.6, 0.32, 0.02, 0.01), M.greenSoft, -0.9, top + 1.85, -2.48, { cast: false });
    const pts = [[-2.2, 2.7], [-1.6, 2.5], [-1.0, 2.25], [-0.4, 2.0], [0.2, 1.88]];
    for (let i = 0; i < pts.length - 1; i++) seg(g, M.green, pts[i][0], top + pts[i][1], pts[i + 1][0], top + pts[i + 1][1], -2.47);
    for (const [x, yy] of pts) add(g, sph(0.05, 12), M.green, x, top + yy, -2.47, { cast: false });
    // Desk, monitor and chair.
    add(g, rbox(2.4, 0.08, 1.0, 0.03), M.stone, -0.6, top + 0.78, -0.9);
    for (const x of [-1.7, 0.5]) add(g, rbox(0.06, 0.76, 0.9, 0.02), M.ti, x, top + 0.38, -0.9);
    add(g, rbox(1.0, 0.62, 0.05, 0.03), M.dark, -0.6, top + 1.3, -1.25);
    add(g, rbox(0.92, 0.54, 0.01, 0.01), M.screen, -0.6, top + 1.3, -1.22, { cast: false });
    add(g, torus(0.15, 0.018, Math.PI * 1.4, 32), M.green, -0.75, top + 1.3, -1.21, { cast: false });
    add(g, rbox(0.3, 0.04, 0.02, 0.01), M.green, -0.35, top + 1.38, -1.21, { cast: false });
    add(g, rbox(0.24, 0.03, 0.02, 0.01), M.white, -0.35, top + 1.3, -1.21, { cast: false });
    add(g, rbox(0.06, 0.24, 0.06, 0.02), M.ti, -0.6, top + 0.94, -1.25);
    add(g, rbox(0.55, 0.1, 0.55, 0.05), M.char, -0.6, top + 0.52, -0.1);
    add(g, rbox(0.55, 0.62, 0.08, 0.04), M.char, -0.6, top + 0.86, 0.16, { r: [0.1, 0, 0] });
    add(g, cyl(0.03, 0.03, 0.42, 10), M.chrome, -0.6, top + 0.25, -0.1);
    for (let i = 0; i < 5; i++) add(g, rbox(0.34, 0.03, 0.05, 0.015), M.chrome, -0.6 + Math.cos(i * 1.256) * 0.17, top + 0.04, -0.1 + Math.sin(i * 1.256) * 0.17, { r: [0, -i * 1.256, 0] });
    // Lab bench with tubes and a centrifuge.
    add(g, rbox(0.8, 0.95, 2.8), M.char, 2.95, top + 0.475, -0.9);
    add(g, rbox(0.86, 0.07, 2.86, 0.02), M.stone, 2.95, top + 0.98, -0.9);
    add(g, rbox(0.3, 0.1, 1.0, 0.02), M.ti, 2.9, top + 1.07, -1.6);
    const liquids = [M.blood, M.blood, M.amber, M.blood, M.amber, M.green];
    for (let i = 0; i < 6; i++) {
      add(g, cyl(0.045, 0.045, 0.34, 14), M.glass, 2.9, top + 1.25, -2.0 + i * 0.16, { cast: false });
      add(g, cyl(0.036, 0.036, 0.18 + (i % 3) * 0.04, 12), liquids[i], 2.9, top + 1.16 + (i % 3) * 0.02, -2.0 + i * 0.16, { cast: false });
    }
    add(g, cyl(0.3, 0.32, 0.34), M.white, 2.95, top + 1.18, -0.4);
    add(g, cyl(0.24, 0.26, 0.04), M.dark, 2.95, top + 1.37, -0.4);
    add(g, rbox(0.3, 0.12, 0.2, 0.03), M.ti, 2.95, top + 1.08, 0.2);
    // Exam couch.
    add(g, rbox(0.8, 0.55, 1.9, 0.06), M.char, -2.7, top + 0.28, 0.6);
    add(g, rbox(0.86, 0.16, 2.0, 0.07), M.white, -2.7, top + 0.63, 0.6);
    add(g, rbox(0.8, 0.14, 0.5, 0.07), M.white, -2.7, top + 0.8, -0.25, { r: [0.4, 0, 0] });
    // Cabinet.
    add(g, rbox(1.0, 2.4, 0.6, 0.05), M.ti, -3.0, top + 1.2, -2.2);
    add(g, rbox(0.84, 1.0, 0.02, 0.01), M.glass, -3.0, top + 1.75, -1.89, { cast: false });
    for (let i = 0; i < 3; i++) add(g, cyl(0.07, 0.07, 0.2, 14), i === 1 ? M.green : M.white, -3.25 + i * 0.25, top + 1.62, -2.05);
    point(g, 0xdfe8ff, 5, 0, top + 2.8, 0.4);
    ring(g, 1.2, 3.5, 0.2, 0.8);
  }

  let pin;
  function out(g) {
    base(g);
    // Menu board: rows of light, one in green for the pick that fits.
    add(g, rbox(2.6, 1.4, 0.06, 0.04), M.dark, -1.2, top + 2.35, -2.5);
    for (let i = 0; i < 4; i++) {
      add(g, rbox(1.5 - (i % 2) * 0.3, 0.06, 0.02, 0.02), i === 2 ? M.green : M.white, -1.45 + (i % 2) * 0.15, top + 2.82 - i * 0.28, -2.46, { cast: false });
      add(g, rbox(0.3, 0.06, 0.02, 0.02), M.ti, -0.3, top + 2.82 - i * 0.28, -2.46, { cast: false });
    }
    // Counter with the coffee machine and a cake under glass.
    add(g, rbox(3.4, 1.0, 0.75), M.wood, -0.9, top + 0.5, -1.95);
    add(g, rbox(3.44, 0.07, 0.8, 0.02), M.stone, -0.9, top + 1.03, -1.95);
    add(g, rbox(0.7, 0.55, 0.5, 0.05), M.chrome, -2.0, top + 1.34, -2.0);
    add(g, rbox(0.72, 0.08, 0.52, 0.03), M.dark, -2.0, top + 1.65, -2.0);
    for (const x of [-2.15, -1.85]) add(g, cyl(0.06, 0.05, 0.1, 16), M.white, x, top + 1.12, -1.82);
    add(g, cyl(0.24, 0.24, 0.16, 32), M.bread, 0.1, top + 1.15, -1.95);
    add(g, cyl(0.25, 0.25, 0.03, 32), M.white, 0.1, top + 1.24, -1.95);
    add(g, new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, 0.1, top + 1.07, -1.95, { cast: false });
    // Pendant lights over the counter.
    for (const x of [-2.0, -0.9, 0.2]) {
      add(g, cyl(0.006, 0.006, 1.1, 6), M.dark, x, top + 3.15, -1.7, { cast: false });
      add(g, sph(0.13, 20), M.warm, x, top + 2.55, -1.7, { cast: false });
    }
    // Two tables, one with lunch: a burger, salad and a drink.
    const table = (x, z) => {
      add(g, cyl(0.6, 0.6, 0.05, 40), M.stone, x, top + 0.78, z);
      add(g, cyl(0.04, 0.04, 0.76, 10), M.chrome, x, top + 0.39, z);
      add(g, cyl(0.28, 0.3, 0.03, 28), M.chrome, x, top + 0.02, z);
      for (const a of [0.6, 2.6]) {
        const cx = x + Math.cos(a) * 0.82, cz = z + Math.sin(a) * 0.82;
        add(g, cyl(0.24, 0.24, 0.06, 28), M.ti, cx, top + 0.5, cz);
        add(g, cyl(0.03, 0.03, 0.48, 8), M.chrome, cx, top + 0.25, cz);
        add(g, rbox(0.46, 0.4, 0.05, 0.03), M.ti, cx + Math.cos(a) * 0.22, top + 0.74, cz + Math.sin(a) * 0.22, { r: [0, -a + Math.PI / 2, 0] });
      }
    };
    table(1.6, 0.4); table(-1.6, 1.0);
    const y = top + 0.81;
    add(g, cyl(0.34, 0.3, 0.03, 36), M.white, 1.45, y, 0.35);
    add(g, sph(0.15, 24), M.bread, 1.45, y + 0.11, 0.35, { s: [1, 0.55, 1] });
    add(g, cyl(0.15, 0.15, 0.05, 24), M.meat, 1.45, y + 0.07, 0.35);
    add(g, rbox(0.27, 0.012, 0.27, 0.005), M.cheese, 1.45, y + 0.1, 0.35, { r: [0, 0.6, 0], cast: false });
    add(g, cyl(0.14, 0.14, 0.03, 24), M.bread, 1.45, y + 0.03, 0.35);
    for (let i = 0; i < 6; i++) add(g, sph(0.05, 10), i % 2 ? M.leaf : M.tomato, 1.62 + Math.cos(i) * 0.08, y + 0.04, 0.5 + Math.sin(i) * 0.08, { s: [1, 0.6, 1] });
    add(g, cyl(0.07, 0.06, 0.26, 20), M.glass, 1.85, y + 0.13, 0.2, { cast: false });
    add(g, cyl(0.055, 0.05, 0.18, 16), M.amber, 1.85, y + 0.09, 0.2, { cast: false });
    add(g, cyl(0.01, 0.01, 0.34, 6), M.green, 1.87, y + 0.22, 0.2, { r: [0, 0, 0.2], cast: false });
    // Plant.
    add(g, cyl(0.25, 0.2, 0.5, 24), M.char, 3.0, top + 0.25, -1.8);
    for (const [dx, dy, dz, r] of [[0, 0.75, 0, 0.32], [0.18, 0.95, 0.1, 0.24], [-0.15, 1.0, -0.05, 0.22], [0.05, 1.2, 0.05, 0.2]]) add(g, sph(r, 14), M.leaf, 3.0 + dx, top + dy, -1.8 + dz);
    // The map pin: this is where "I'm eating out" takes you.
    pin = new THREE.Group(); pin.userData.dyn = true; pin.position.set(0.2, 3.5, 0.2); g.add(pin);
    const head = new THREE.Mesh(sph(0.32, 32), M.green); head.position.y = 0.4;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.62, 32), M.green); tip.rotation.x = Math.PI; tip.position.y = 0.05;
    const hole = new THREE.Mesh(sph(0.12, 16), M.dark); hole.position.set(0, 0.42, 0.24); hole.scale.set(1, 1, 0.4);
    pin.add(head, tip, hole);
    point(g, 0xffcf8a, 6, -0.9, top + 2.3, -0.8);
  }

  function gym(g) {
    base(g);
    add(g, rbox(7.4, 0.04, 5.6, 0.02), M.rubber, 0, top + 0.02, 0, { cast: false });
    add(g, rbox(4.6, 2.4, 0.04, 0.02), M.mirror, 0.6, top + 1.7, -2.52, { cast: false });
    add(g, rbox(7.2, 0.03, 0.02, 0.01), M.green, 0, top + 3.3, -2.53, { cast: false });
    for (const x of [-2.6, -1.2]) for (const z of [-1.9, -1.1]) add(g, rbox(0.1, 2.6, 0.1, 0.02), M.dark, x, top + 1.3, z);
    for (const x of [-2.6, -1.2]) add(g, rbox(0.1, 0.1, 0.9, 0.02), M.dark, x, top + 2.55, -1.5);
    const bx = -1.9, by = top + 1.55, bz = -1.1;
    add(g, cyl(0.03, 0.03, 2.6, 12), M.chrome, bx, by, bz, { r: [0, 0, Math.PI / 2] });
    for (const s of [-1, 1]) {
      add(g, cyl(0.42, 0.42, 0.09), M.dark, bx + s * 0.95, by, bz, { r: [0, 0, Math.PI / 2] });
      add(g, cyl(0.32, 0.32, 0.07), M.dark, bx + s * 1.04, by, bz, { r: [0, 0, Math.PI / 2] });
      add(g, cyl(0.05, 0.05, 0.1, 12), M.green, bx + s * 1.12, by, bz, { r: [0, 0, Math.PI / 2] });
    }
    add(g, rbox(0.5, 0.14, 1.5, 0.06), M.char, 0.6, top + 0.55, 0.3);
    for (const z of [-0.25, 0.85]) { add(g, rbox(0.08, 0.48, 0.08, 0.02), M.chrome, 0.6, top + 0.26, z); add(g, rbox(0.6, 0.05, 0.1, 0.02), M.chrome, 0.6, top + 0.04, z); }
    for (const yy of [0.75, 0.35]) add(g, rbox(2.4, 0.08, 0.6, 0.03), M.dark, 2.2, top + yy, -1.9);
    for (const x of [1.05, 3.35]) add(g, rbox(0.08, 0.8, 0.6, 0.03), M.dark, x, top + 0.4, -1.9);
    const bell = (x, y, z, r) => { add(g, cyl(0.025, 0.025, 0.36, 10), M.chrome, x, y, z, { r: [Math.PI / 2, 0, 0] }); for (const s of [-1, 1]) add(g, cyl(r, r, 0.12, 6), M.ti, x, y, z + s * 0.18, { r: [Math.PI / 2, 0, 0] }); };
    for (let i = 0; i < 5; i++) { bell(1.35 + i * 0.44, top + 0.9, -1.9, 0.07 + i * 0.008); bell(1.35 + i * 0.44, top + 0.5, -1.9, 0.09 + i * 0.01); }
    add(g, rbox(0.9, 0.2, 2.0, 0.06), M.dark, 2.6, top + 0.12, 0.9);
    add(g, rbox(0.7, 0.03, 1.8, 0.01), M.rubber, 2.6, top + 0.23, 0.95, { cast: false });
    for (const s of [-1, 1]) add(g, rbox(0.06, 1.25, 0.06, 0.02), M.ti, 2.6 + s * 0.42, top + 0.75, 0, { r: [-0.18, 0, 0] });
    add(g, rbox(0.9, 0.35, 0.14, 0.05), M.dark, 2.6, top + 1.35, -0.1, { r: [-0.5, 0, 0] });
    add(g, rbox(0.5, 0.2, 0.01, 0.01), M.green, 2.6, top + 1.37, -0.04, { r: [-0.5, 0, 0], cast: false });
    for (const [x, z, s] of [[-2.6, 1.4, 1], [-2.1, 1.6, 0.8], [-1.65, 1.45, 0.9]]) { add(g, sph(0.2 * s, 20), M.dark, x, top + 0.2 * s, z); add(g, torus(0.12 * s, 0.03 * s, Math.PI, 20), M.dark, x, top + 0.36 * s, z); }
    add(g, rbox(0.8, 0.02, 1.9, 0.01), M.greenSoft, -0.6, top + 0.05, 1.3, { r: [0, 0.2, 0], cast: false });
    point(g, 0xdfe8ff, 5, 0, top + 3, 0.4);
    ring(g, -0.6, 3.4, 0.2, 0.62);
  }

  function bedroom(g) {
    base(g);
    add(g, rbox(2.0, 1.8, 0.06, 0.03), M.ti, 1.9, top + 2.2, -2.53);
    add(g, rbox(1.84, 1.64, 0.02, 0.02), M.night, 1.9, top + 2.2, -2.49, { cast: false });
    add(g, sph(0.18, 24), M.moon, 2.35, top + 2.6, -2.45, { cast: false });
    add(g, rbox(3.2, 1.3, 0.16, 0.06), M.char, -0.6, top + 0.95, -2.45);
    add(g, rbox(3.0, 0.35, 3.1, 0.06), M.wood, -0.6, top + 0.2, -0.85);
    add(g, rbox(2.85, 0.32, 2.95, 0.1), M.white, -0.6, top + 0.52, -0.85);
    add(g, rbox(2.9, 0.14, 2.0, 0.07), M.char, -0.6, top + 0.72, -0.35);
    add(g, rbox(2.9, 0.03, 0.12, 0.015), M.green, -0.6, top + 0.79, -1.33, { cast: false });
    for (const x of [-1.3, 0.1]) add(g, rbox(1.0, 0.22, 0.55, 0.1), M.white, x, top + 0.8, -1.9, { r: [-0.25, 0, 0] });
    for (const x of [-2.75, 1.55]) add(g, rbox(0.6, 0.55, 0.5, 0.05), M.wood, x, top + 0.28, -2.05);
    for (const x of [-2.75, 1.55]) { add(g, cyl(0.06, 0.08, 0.3, 16), M.ti, x, top + 0.7, -2.1); add(g, cyl(0.16, 0.2, 0.26, 28), M.warm, x, top + 0.98, -2.1, { cast: false }); }
    add(g, rbox(0.16, 0.02, 0.3, 0.01), M.dark, 1.5, top + 0.57, -1.95, { r: [0, 0.3, 0] });
    add(g, rbox(0.12, 0.005, 0.24, 0.005), M.green, 1.5, top + 0.585, -1.95, { r: [0, 0.3, 0], cast: false });
    add(g, rbox(4.0, 0.03, 2.0, 0.015), M.tiMatte, -0.4, top + 0.02, 1.6, { cast: false });
    add(g, rbox(0.8, 0.9, 0.5, 0.05), M.char, 3.0, top + 0.45, 0.6);
    for (let i = 0; i < 4; i++) add(g, rbox(0.12, 0.5, 0.4, 0.02), i % 2 ? M.ti : M.white, 2.75 + i * 0.16, top + 1.15, 0.6);
    point(g, 0xffc98a, 3.5, -0.6, top + 1.8, -0.6);
    ring(g, -0.6, 3.5, 0.0, 0.9);
  }

  scene.add(new THREE.Mesh(new THREE.CircleGeometry(80, 96), M.floor).rotateX(-Math.PI / 2));
  scene.children[scene.children.length - 1].receiveShadow = true;

  // The rooms sit on an arc around a point in front of them, each one turned to face it.
  const C = new THREE.Vector3(0, 0, 14), R = 16;
  const ANG = [-50, -25, 0, 25, 50].map((d) => THREE.MathUtils.degToRad(d));
  const builders = [kitchen, lab, out, gym, bedroom];
  const rooms = ANG.map((a, i) => {
    const raw = new THREE.Group();
    builders[i](raw);
    const g = merge(raw);
    g.position.set(C.x + R * Math.sin(a), 0, C.z - R * Math.cos(a));
    g.rotation.y = -a;
    scene.add(g);
    raw.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    return g;
  });
  const toWorld = (i, x, y, z) => new THREE.Vector3(x, y, z).applyEuler(new THREE.Euler(0, -ANG[i], 0)).add(rooms[i].position);

  // The path in front of the rooms, as a dotted line on the floor.
  const PR = R - 4.4;
  const onArc = (a) => new THREE.Vector3(C.x + PR * Math.sin(a), 0.015, C.z - PR * Math.cos(a));
  {
    const n = 150, dot = new THREE.CircleGeometry(0.05, 12);
    const dots = new THREE.InstancedMesh(dot, M.green, n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), one = new THREE.Vector3(1, 1, 1);
    const a0 = ANG[0] - 0.12, a1 = ANG[4] + 0.12;
    for (let i = 0; i < n; i++) { m.compose(onArc(a0 + (a1 - a0) * i / (n - 1)), q, one); dots.setMatrixAt(i, m); }
    scene.add(dots);
  }

  // The Captain: the logo's figure in white with a green head and arms up.
  const cap = new THREE.Group(), body = new THREE.Group(); cap.add(body); scene.add(cap);
  const capM = (geo, mat, x, y, z, r) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (r) m.rotation.set(...r); m.castShadow = true; body.add(m); return m; };
  capM(new THREE.CapsuleGeometry(0.13, 0.42, 6, 16), M.white, 0, 0.62, 0);
  for (const s of [-1, 1]) {
    capM(new THREE.CapsuleGeometry(0.06, 0.4, 5, 12), M.white, s * 0.22, 1.0, 0, [0, 0, -s * 0.62]);
    capM(new THREE.CapsuleGeometry(0.065, 0.32, 5, 12), M.white, s * 0.08, 0.24, 0, [0, 0, s * 0.08]);
  }
  capM(sph(0.15, 24), M.green, 0, 1.15, 0);
  const halo = capM(torus(0.24, 0.008, Math.PI * 2, 48), M.green, 0, 1.15, 0, [Math.PI / 2, 0, 0]);
  halo.castShadow = false;
  // The Captain stands on the side away from the card (the card sits on the reading side).
  const spotOf = (i) => (portrait() ? toWorld(i, 1.5, top, 2.1) : toWorld(i, rtl ? -1.2 : 1.2, top, 2.3));
  // Walking from room i to room i + 1: off the plinth, along the arc, up onto the next one.
  let walks = [];
  const buildWalks = () => { walks = ANG.slice(0, -1).map((a, i) => {
    const pts = [spotOf(i)];
    for (let k = 0; k <= 4; k++) pts.push(onArc(a + (ANG[i + 1] - a) * (0.1 + 0.8 * k / 4)).setY(0));
    pts.push(spotOf(i + 1));
    return new THREE.CatmullRomCurve3(pts);
  }); };

  // Fine dust in the air.
  const dust = (() => {
    const n = small() ? 260 : 520, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 40; pos[i * 3 + 1] = Math.random() * 8; pos[i * 3 + 2] = (Math.random() - 0.5) * 24 - 2; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.35, depthWrite: false }));
    scene.add(p); return p;
  })();

  // ---------- camera: one keyframe per step (intro, five rooms, outro) ----------
  let KF = [], curve;
  const portrait = () => innerWidth / innerHeight < 0.85;
  function frames() {
    const tall = portrait();
    const roomCam = (i) => ({
      p: toWorld(i, tall ? 1.0 : (rtl ? 2.6 : -2.6), tall ? 5.4 : 4.3, tall ? 11.2 : 8.4),
      t: toWorld(i, tall ? 0 : 0.2, tall ? 1.2 : 1.35, -0.2),
      o: 1,
    });
    KF = [
      { p: new THREE.Vector3(0, tall ? 26 : 17, tall ? 48 : 34), t: new THREE.Vector3(0, 0.5, 1), o: 0 },
      ...ANG.map((a, i) => roomCam(i)),
      { p: new THREE.Vector3(0, tall ? 20 : 12, tall ? 42 : 30), t: new THREE.Vector3(0, 1, 0), o: 0 },
    ];
    curve = new THREE.CatmullRomCurve3(KF.map((k) => k.p), false, 'centripetal');
    buildWalks();
    camera.fov = tall ? 44 : 34;
  }
  const ease = (t) => t * t * (3 - 2 * t);
  const tgt = new THREE.Vector3();
  let offset = 0;
  function cameraAt(p) {
    const n = KF.length - 1, f = Math.min(p * n, n - 1e-6), i = Math.floor(f), t = ease(f - i);
    camera.position.copy(curve.getPoint((i + t) / n));
    tgt.lerpVectors(KF[i].t, KF[i + 1].t, t);
    offset = KF[i].o + (KF[i + 1].o - KF[i].o) * t;
  }

  // ---------- size: the card sits on one side (or at the bottom on phones), so the room is framed on the other ----------
  let W = 1, H = 1;
  function size() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    frames();
    camera.updateProjectionMatrix();
  }
  function frameOffset() {
    if (portrait()) camera.setViewOffset(W, H, 0, H * (0.06 + 0.16 * offset), W, H);
    else camera.setViewOffset(W, H, (rtl ? 1 : -1) * W * 0.13 * offset, 0, W, H);
  }

  // ---------- scroll: keyframe k is reached when step k sits in the middle of the screen ----------
  let want = 0, now = 0, active = -1;
  function read() {
    const mid = innerHeight / 2;
    const c = steps.map((s) => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
    let k = 0; while (k < c.length - 1 && c[k + 1] <= mid) k++;
    const f = k >= c.length - 1 ? 0 : Math.min(1, Math.max(0, (mid - c[k]) / (c[k + 1] - c[k])));
    want = Math.min(1, Math.max(0, (k + f) / (steps.length - 1)));
  }
  function setActive(k) {
    if (k === active) return;
    active = k;
    steps.forEach((s, i) => s.classList.toggle('on', i === k));
  }

  const clock = new THREE.Clock();
  sec.classList.add('w3d-on');
  size(); read(); now = want;
  addEventListener('scroll', read, { passive: true });
  addEventListener('resize', () => { size(); read(); });
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();

  // Only draw while the section is on screen.
  let visible = true, raf = 0;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); } }).observe(sec);

  // If frames come in slowly, drop the pixel ratio and the shadows rather than stutter.
  let slow = 0, counted = 0, lowered = false;
  const tmp = new THREE.Vector3();
  function frame() {
    raf = 0;
    if (!visible) return;
    const dt = clock.getDelta(), time = clock.elapsedTime;
    if (!lowered && counted < 120) { counted++; if (dt > 0.045) slow++; if (counted === 120 && slow > 50) { lowered = true; ratio = 1; renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); size(); } }
    now += (want - now) * (1 - Math.pow(0.002, Math.min(dt, 0.05)));
    cameraAt(now);
    camera.position.x += Math.sin(time * 0.35) * 0.12;
    camera.position.y += Math.sin(time * 0.5) * 0.06;
    camera.lookAt(tgt);
    frameOffset();
    setActive(Math.round(want * (steps.length - 1)));

    // The Captain stands in a room while the camera is there and walks while it travels.
    const n = KF.length - 1, f = now * n;
    const room = Math.min(4, Math.max(0, f - 1));
    const i = Math.floor(room), t = room - i;
    const walking = i < 4 && t > 0.15 && t < 0.85;
    if (i >= 4 || t <= 0.15) { cap.position.copy(spotOf(Math.min(4, Math.round(room)))); cap.rotation.y = -ANG[Math.min(4, Math.round(room))] + (rtl ? -0.5 : 0.5); }
    else if (t >= 0.85) { cap.position.copy(spotOf(i + 1)); cap.rotation.y = -ANG[i + 1] + (rtl ? -0.5 : 0.5); }
    else {
      const u = ease((t - 0.15) / 0.7);
      cap.position.copy(walks[i].getPoint(u));
      walks[i].getPoint(Math.min(1, u + 0.01), tmp).sub(cap.position);
      cap.rotation.y = Math.atan2(tmp.x, tmp.z);
    }
    body.position.y = walking ? Math.abs(Math.sin(time * 9)) * 0.07 : Math.sin(time * 2) * 0.025;
    body.rotation.z = walking ? Math.sin(time * 9) * 0.06 : 0;
    halo.rotation.z = time * 0.8;
    spin.forEach((r, k) => { r.rotation.y = Math.sin(time * 0.6 + k) * 0.5; r.position.y += Math.sin(time + k) * 0.0012; });
    if (pin) { pin.position.y = 3.5 + Math.sin(time * 1.6) * 0.12; pin.rotation.y = time * 0.9; }
    dust.rotation.y = time * 0.01;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  window.__world = { jump: () => { read(); now = want; } };
}
