// ASTRO LAB — low-poly models for surface expeditions (built from primitives, no external assets)
import * as THREE from '../../vendor/three.module.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.8, metalness: o.m ?? 0, emissive: o.e || 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side || THREE.FrontSide });
const shadowAll = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
function mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }

// ---------- Astronaut (≈1.85 m tall in suit, origin at the feet) ----------
export function makeAstronaut() {
  const suit = std(0xeeeeea, { r: 0.85 }), grey = std(0x8a8d93, { r: 0.7 }), dark = std(0x2b2d33, { r: 0.6 });
  const visor = std(0xc8902c, { r: 0.18, m: 1 });
  const g = new THREE.Group();
  const body = new THREE.Group(); body.position.y = 0.95; g.add(body);
  body.add(mesh(new THREE.CapsuleGeometry(0.26, 0.42, 4, 10), suit, 0, 0.18, 0));
  body.add(mesh(new THREE.BoxGeometry(0.5, 0.62, 0.28), grey, 0, 0.26, 0.3)); // life-support backpack
  body.add(mesh(new THREE.BoxGeometry(0.3, 0.16, 0.12), grey, 0, 0.02, -0.26)); // chest control unit
  const helmet = mesh(new THREE.SphereGeometry(0.2, 16, 12), suit, 0, 0.72, 0); body.add(helmet);
  const v = mesh(new THREE.SphereGeometry(0.185, 16, 10, -Math.PI * 0.85, Math.PI * 0.7, Math.PI * 0.22, Math.PI * 0.42), visor, 0, 0.72, -0.02); v.rotation.y = Math.PI; body.add(v);
  const limb = (len, r, mat) => { const p = new THREE.Group(); const m = mesh(new THREE.CapsuleGeometry(r, len, 3, 8), mat, 0, -len / 2 - r * 0.5, 0); p.add(m); return p; };
  const armL = limb(0.5, 0.075, suit), armR = limb(0.5, 0.075, suit); armL.position.set(-0.33, 0.4, 0); armR.position.set(0.33, 0.4, 0);
  const legL = limb(0.62, 0.095, suit), legR = limb(0.62, 0.095, suit); legL.position.set(-0.13, -0.12, 0); legR.position.set(0.13, -0.12, 0);
  for (const l of [legL, legR]) l.add(mesh(new THREE.BoxGeometry(0.16, 0.1, 0.3), dark, 0, -0.82, -0.04));
  for (const a of [armL, armR]) a.add(mesh(new THREE.SphereGeometry(0.08, 8, 6), dark, 0, -0.66, 0));
  body.add(armL, armR, legL, legR);
  shadowAll(g);
  g.userData = { body, armL, armR, legL, legR };
  return g;
}
// gait: phase (radians), amount 0..1, lope (bounding) true for low-gravity running
export function poseAstronaut(a, { phase = 0, amt = 0, lope = false, air = false, crouch = 0, seated = false }) {
  const u = a.userData;
  if (seated) { u.legL.rotation.x = u.legR.rotation.x = -1.45; u.armL.rotation.x = u.armR.rotation.x = -0.9; u.body.position.y = 0.55; return; }
  const s = Math.sin(phase);
  if (air) { u.legL.rotation.x = -0.35; u.legR.rotation.x = 0.1; u.armL.rotation.x = u.armR.rotation.x = -0.5; u.armL.rotation.z = 0.35; u.armR.rotation.z = -0.35; }
  else if (lope) { const k = 0.5 * amt; u.legL.rotation.x = -k * (0.6 + s * 0.5); u.legR.rotation.x = -k * (0.6 + Math.sin(phase + 0.6) * 0.5); u.armL.rotation.x = u.armR.rotation.x = -0.35 * amt; u.armL.rotation.z = 0.25; u.armR.rotation.z = -0.25; }
  else { const k = 0.55 * amt; u.legL.rotation.x = s * k; u.legR.rotation.x = -s * k; u.armL.rotation.x = -s * k * 0.6; u.armR.rotation.x = s * k * 0.6; u.armL.rotation.z = 0.12; u.armR.rotation.z = -0.12; }
  u.body.position.y = 0.95 - crouch * 0.25;
}

// ---------- Lunar Roving Vehicle style rover (3.1 m long, 81.8 cm wheels) ----------
export function makeRover() {
  const g = new THREE.Group();
  const frame = std(0xb9bcc2, { r: 0.4, m: 0.6 }), dark = std(0x2a2b2f, { r: 0.9 }), seat = std(0x5d6470, { r: 0.8 }), gold = std(0xc89a3a, { r: 0.3, m: 0.9 });
  const chassis = new THREE.Group(); chassis.position.y = 0.55; g.add(chassis);
  chassis.add(mesh(new THREE.BoxGeometry(1.9, 0.12, 3.1), frame));
  chassis.add(mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), seat, 0, 0.3, 0.1));
  chassis.add(mesh(new THREE.BoxGeometry(1.6, 0.6, 0.06), seat, 0, 0.55, 0.55));
  chassis.add(mesh(new THREE.BoxGeometry(0.5, 0.35, 0.25), frame, 0, 0.3, -0.75)); // control console
  const dish = mesh(new THREE.SphereGeometry(0.5, 16, 6, 0, Math.PI * 2, 0, 0.5), std(0xe8e8e8, { r: 0.5, side: THREE.DoubleSide }), 0.6, 1.9, -1.2); dish.rotation.x = -1.0; chassis.add(dish);
  chassis.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5), frame, 0.6, 1.1, -1.2));
  chassis.add(mesh(new THREE.BoxGeometry(1.2, 0.35, 0.5), gold, 0, 0.12, 1.45)); // stowage
  const wheels = [];
  for (const [x, z] of [[-1.05, -1.15], [1.05, -1.15], [-1.05, 1.15], [1.05, 1.15]]) {
    const w = new THREE.Group(); w.position.set(x, 0.41, z);
    const tire = mesh(new THREE.TorusGeometry(0.33, 0.08, 6, 16), dark); tire.rotation.y = Math.PI / 2; w.add(tire);
    const hub = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.2, 14, 1, true), std(0x707378, { r: 0.6, m: 0.4, side: THREE.DoubleSide })); hub.rotation.z = Math.PI / 2; w.add(hub);
    const fender = mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.26, 12, 1, true, 0, Math.PI), std(0x8f6a2c, { r: 0.6, side: THREE.DoubleSide })); fender.rotation.z = Math.PI / 2; fender.rotation.y = Math.PI / 2; fender.position.y = 0.0; w.add(fender);
    g.add(w); wheels.push(w);
  }
  shadowAll(g); g.userData = { wheels, chassis };
  return g;
}

// ---------- Apollo Lunar Module descent stage (ascent stage has left) ----------
export function makeLM() {
  const g = new THREE.Group();
  const foil = std(0xc8962e, { r: 0.35, m: 0.85 }), black = std(0x262626, { r: 0.6 }), silver = std(0xb8b8b8, { r: 0.35, m: 0.8 });
  const stage = mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.65, 8), foil, 0, 2.1, 0); stage.rotation.y = Math.PI / 8; g.add(stage);
  g.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 8), black, 0, 2.98, 0)); // top deck
  g.add(mesh(new THREE.ConeGeometry(0.75, 0.9, 14, 1, true), black, 0, 0.95, 0)); // descent engine bell
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, cx = Math.cos(a), cz = Math.sin(a);
    const leg = mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.1), silver); leg.position.set(cx * 3.3, 1.05, cz * 3.3); leg.lookAt(cx * 1.9, 2.3, cz * 1.9); leg.rotateX(Math.PI / 2); g.add(leg);
    g.add(mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.15, 14), silver, cx * 4.4, 0.07, cz * 4.4));
    const strut = mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.4), silver); strut.position.set(cx * 3.1, 0.8, cz * 3.1); strut.lookAt(cx * 2.1, 1.5, cz * 2.1); strut.rotateX(Math.PI / 2); g.add(strut);
  }
  // ladder on the forward (+x) leg
  for (let i = 0; i < 9; i++) g.add(mesh(new THREE.BoxGeometry(0.06, 0.04, 0.5), silver, 2.55 + i * 0.12, 0.45 + i * 0.25, 0));
  g.add(mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), silver, 2.5, 2.6, 0)); // porch
  shadowAll(g); return g;
}

// ---------- Generic crew lander (original Astro Lab design) ----------
export function makeLander() {
  const g = new THREE.Group();
  const white = std(0xe6e6e6, { r: 0.55 }), grey = std(0x6d7178, { r: 0.6, m: 0.3 }), accent = std(0x4f8cff, { r: 0.5, e: 0x112244, ei: 0.4 }), black = std(0x1b1b1d, { r: 0.5 });
  g.add(mesh(new THREE.CylinderGeometry(2.2, 2.4, 5.5, 16), white, 0, 4.4, 0));
  g.add(mesh(new THREE.ConeGeometry(2.2, 1.6, 16), white, 0, 7.95, 0));
  g.add(mesh(new THREE.CylinderGeometry(2.42, 2.42, 0.25, 16), accent, 0, 3.0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.1, 14, 1, true), black, 0, 1.2, 0));
  g.add(mesh(new THREE.BoxGeometry(0.9, 1.9, 0.12), grey, 0, 3.9, -2.32)); // hatch
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, cx = Math.cos(a), cz = Math.sin(a);
    const leg = mesh(new THREE.CylinderGeometry(0.11, 0.11, 3.8), grey); leg.position.set(cx * 3.2, 1.6, cz * 3.2); leg.lookAt(cx * 2.0, 3.4, cz * 2.0); leg.rotateX(Math.PI / 2); g.add(leg);
    g.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 12), grey, cx * 4.3, 0.09, cz * 4.3));
  }
  for (let i = 0; i < 10; i++) g.add(mesh(new THREE.BoxGeometry(0.6, 0.05, 0.08), grey, 0, 0.4 + i * 0.3, -2.55));
  shadowAll(g); return g;
}

export function makeFlag() {
  const g = new THREE.Group(); const pole = std(0xdadada, { r: 0.3, m: 0.6 });
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2), pole, 0, 1.1, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0), pole, 0.5, 2.1, 0)).rotation.z = Math.PI / 2;
  const cv = document.createElement('canvas'); cv.width = 190; cv.height = 100; const c = cv.getContext('2d');
  for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#f4f4f4' : '#b22234'; c.fillRect(0, i * 100 / 13, 190, 100 / 13 + 0.5); }
  c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, 76, 54); c.fillStyle = '#fff'; for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) c.fillRect(5 + x * 12, 5 + y * 10, 3, 3);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const f = mesh(new THREE.PlaneGeometry(0.95, 0.5, 8, 2), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }), 0.5, 1.84, 0);
  const p = f.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 7) * 0.03); // the famous "wrinkle" from the bent rod
  g.add(f); shadowAll(g); return g;
}
export function makeRetroreflector() {
  const g = new THREE.Group(); const al = std(0xc8c8c8, { r: 0.35, m: 0.8 });
  const panel = mesh(new THREE.BoxGeometry(0.46, 0.05, 0.46), std(0x30343a, { r: 0.15, m: 0.9 }), 0, 0.42, 0); panel.rotation.x = -0.35; g.add(panel);
  for (const [x, z] of [[-0.2, -0.15], [0.2, -0.15], [0, 0.18]]) g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), al, x, 0.2, z));
  shadowAll(g); return g;
}
export function makeSeismometer() {
  const g = new THREE.Group(); const foil = std(0xd8b25a, { r: 0.4, m: 0.7 }), solar = std(0x1e2a4a, { r: 0.25, m: 0.6 });
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.45, 10), foil, 0, 0.23, 0));
  const a = mesh(new THREE.BoxGeometry(0.7, 0.02, 0.5), solar, -0.55, 0.38, 0); a.rotation.z = 0.25; g.add(a);
  const b = mesh(new THREE.BoxGeometry(0.7, 0.02, 0.5), solar, 0.55, 0.38, 0); b.rotation.z = -0.25; g.add(b);
  shadowAll(g); return g;
}
export function makePlaque() {
  const g = new THREE.Group(); const al = std(0xd0d0d0, { r: 0.3, m: 0.8 });
  g.add(mesh(new THREE.BoxGeometry(0.16, 0.02, 0.09), al, 0, 0.012, 0));
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.085, 0.015), al, 0.12, 0.045, 0));
  shadowAll(g); return g;
}
export function makeHuygens() {
  const g = new THREE.Group(); const m = std(0xb7b2a8, { r: 0.5, m: 0.5 }), foil = std(0xc8a25a, { r: 0.4, m: 0.7 });
  g.add(mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.35, 18), m, 0, 0.18, 0));
  g.add(mesh(new THREE.ConeGeometry(0.65, 0.3, 18), foil, 0, 0.5, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 10), m, 0.3, 0.68, 0.1));
  g.rotation.z = 0.1; shadowAll(g); return g;
}

// ---------- Rocks ----------
export function rockGeometry(seed = 1, round = false) {
  const g = new THREE.IcosahedronGeometry(1, round ? 2 : 1);
  const p = g.attributes.position; let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const amp = round ? 0.12 : 0.32;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!seen.has(k)) seen.set(k, 1 - amp / 2 + rnd() * amp);
    const f = seen.get(k); p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * (round ? 0.75 : 0.7), p.getZ(i) * f);
  }
  g.computeVertexNormals(); return g;
}

export function makeModel(kind) {
  return ({ lm: makeLM, lander: makeLander, flag: makeFlag, lrrr: makeRetroreflector, psep: makeSeismometer, plaque: makePlaque, huygens: makeHuygens })[kind]?.() || null;
}
