// ASTRO LAB Career — spacesuit parts (simplified spacewalk suit), the suit stand and lab furniture.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from './materials.js';
import { std, box, cyl } from './house.js';

const white = () => std(0xf2f3f5, { roughness: 0.7 }), shade = () => std(0xd9dce2, { roughness: 0.75 });
const shadowAll = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const cap = (r, l, m, x = 0, y = 0, z = 0, parent) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), m); c.position.set(x, y, z); parent?.add(c); return c; };

// Each part: a model centred on its own origin. `mount` = where it sits on the stand (relative to the stand base).
// All parts are built to meet exactly when mounted: boots -> legs (y 0.15), legs -> waist ring (0.95),
// torso -> neck ring (1.38), arms -> wrist rings (0.76, x ±0.4), backpack flush against the torso back.
const fabric = () => std(0xf3f2ee, { roughness: 0.9 }), seamM = () => std(0xc9c7c0, { roughness: 0.95 });
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const ringAt = (r, t, m, x, y, z, parent, rx = Math.PI / 2) => { const o = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 28), m); o.position.set(x, y, z); o.rotation.x = rx; parent.add(o); return o; };
// A tube between two points (arm and leg segments), with a soft cap at each end
function limb(a, b, r0, r1, m, parent) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const g = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 18, 1), m); g.position.copy(A).add(B).multiplyScalar(0.5);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); parent.add(g);
  for (const [P, r] of [[A, r0], [B, r1]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); s.position.copy(P); parent.add(s); }
  return g;
}
function flagPatch(parent, x, y, z, ry) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 64; const x2 = c.getContext('2d');
  x2.fillStyle = '#1d3f8f'; x2.fillRect(0, 0, 96, 64); x2.fillStyle = '#fff'; x2.font = 'bold 22px system-ui'; x2.textAlign = 'center'; x2.fillText('ASTRO', 48, 30); x2.font = 'bold 18px system-ui'; x2.fillStyle = '#ffc857'; x2.fillText('LAB', 48, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.05), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
  m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}
export const PARTS = {
  // Liquid cooling garment: a thin long-sleeved suit with blue water tubes (worn under everything)
  cooling: { name: 'Cooling garment', mount: [0, 1.0, 0], build() {
    const g = new THREE.Group(), m = std(0xdfe8f2, { roughness: 0.95 }), tube = std(0x4a7ad8, { roughness: 0.5 });
    const torso = new THREE.Mesh(lathe([[0.001, -0.16], [0.16, -0.15], [0.17, 0.05], [0.19, 0.24], [0.12, 0.34], [0.06, 0.37], [0.001, 0.37]]), m); torso.scale.z = 0.72; g.add(torso);
    for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.172 + (i > 4 ? 0.01 : 0), 0.006, 6, 30), tube); t.position.y = -0.12 + i * 0.065; t.rotation.x = Math.PI / 2; t.scale.y = 0.72; g.add(t); }
    for (const sx of [-1, 1]) { limb([sx * 0.2, 0.25, 0], [sx * 0.3, -0.02, 0], 0.05, 0.045, m, g); limb([sx * 0.3, -0.02, 0], [sx * 0.36, -0.22, 0.02], 0.045, 0.038, m, g); }
    box(0.08, 0.05, 0.03, std(0x3a3f4a), 0.06, 0.02, 0.13, g); // connector
    return g; } },
  // Lower torso assembly: waist bearing, hip brief, legs with knee joints (mount: waist ring at 0.95)
  lower: { name: 'Lower torso', mount: [0, 0.62, 0], build() {
    const g = new THREE.Group(), m = fabric(), metal = MAT.metal(0x9aa3b2);
    ringAt(0.225, 0.025, metal, 0, 0.33, 0, g); // waist bearing (locks to the upper torso)
    const brief = new THREE.Mesh(lathe([[0.001, 0.08], [0.17, 0.09], [0.215, 0.18], [0.22, 0.32], [0.001, 0.32]]), m); brief.scale.z = 0.78; g.add(brief);
    for (const sx of [-1, 1]) {
      const x = sx * 0.105;
      limb([x, 0.13, 0], [x, -0.13, 0.01], 0.1, 0.088, m, g);               // thigh
      ringAt(0.095, 0.012, metal, x, 0.08, 0, g);                            // thigh bearing
      ringAt(0.092, 0.01, seamM(), x, -0.13, 0.01, g);                       // knee convolute
      ringAt(0.09, 0.01, seamM(), x, -0.16, 0.012, g);
      limb([x, -0.15, 0.012], [x, -0.46, 0], 0.088, 0.075, m, g);           // lower leg
      ringAt(0.078, 0.012, metal, x, -0.47, 0, g);                           // boot ring (world 0.15)
      box(0.03, 0.42, 0.012, std(0xc8202a, { roughness: 0.8 }), x + sx * 0.06, -0.15, 0.06, g).rotation.z = -sx * 0.06; // commander stripe
    }
    return g; } },
  // Boots: rounded shells with treaded soles, the ankle ring meets the leg ring at y 0.15
  boots: { name: 'Boots', mount: [0, 0.08, 0.04], build() {
    const g = new THREE.Group(), m = fabric(), sole = std(0x3a3f4a, { roughness: 0.9 });
    for (const sx of [-1, 1]) {
      const x = sx * 0.105;
      cyl(0.075, 0.08, 0.1, m, x, 0.03, -0.04, g, 18);                                         // ankle
      const toe = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.16, 6, 14), m); toe.rotation.x = Math.PI / 2; toe.scale.set(1.05, 1, 0.72); toe.position.set(x, -0.02, 0.0); g.add(toe);
      const sl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.33), sole); sl.position.set(x, -0.068, 0.0); g.add(sl);
      for (let i = 0; i < 5; i++) box(0.152, 0.008, 0.012, std(0x22262e), x, -0.085, -0.13 + i * 0.065, g);
    }
    return g; } },
  // Hard upper torso: shell, shoulder bearings, arms with elbows, wrist rings, chest display and control module
  upper: { name: 'Upper torso', mount: [0, 1.12, 0], build() {
    const g = new THREE.Group(), m = white(), soft = fabric(), metal = MAT.metal(0x9aa3b2);
    const shell = new THREE.Mesh(lathe([[0.001, -0.2], [0.215, -0.19], [0.23, -0.05], [0.25, 0.1], [0.24, 0.2], [0.17, 0.26], [0.12, 0.27], [0.001, 0.27]], 32), m); shell.scale.z = 0.76; g.add(shell);
    ringAt(0.135, 0.022, metal, 0, 0.265, 0, g);                           // neck ring (world 1.385)
    ringAt(0.226, 0.02, metal, 0, -0.18, 0, g);                            // waist ring (world 0.94)
    for (const sx of [-1, 1]) {
      const sh = [sx * 0.25, 0.16, 0], el = [sx * 0.33, -0.12, 0.02], wr = [sx * 0.4, -0.355, 0.02];
      const bear = ringAt(0.07, 0.014, metal, sh[0], sh[1], 0, g); bear.rotation.set(0, Math.PI / 2, 0);
      limb(sh, el, 0.072, 0.064, soft, g);                                 // upper arm
      ringAt(0.066, 0.01, seamM(), el[0], el[1], el[2], g, 0).rotation.z = sx * 0.25;
      limb(el, wr, 0.064, 0.054, soft, g);                                 // forearm
      ringAt(0.058, 0.016, std(0x2b4f8f, { roughness: 0.4, metalness: 0.5 }), wr[0], wr[1] - 0.01, wr[2], g); // wrist disconnect
      flagPatch(g, sx * 0.285, 0.02, 0.07, sx * 0.9);
    }
    // display and control module on the chest
    box(0.25, 0.14, 0.07, std(0xe6e8ec, { roughness: 0.6 }), 0, -0.04, 0.205, g);
    box(0.11, 0.05, 0.005, std(0x111216, { roughness: 0.2 }), -0.05, -0.02, 0.243, g);
    box(0.03, 0.02, 0.006, MAT.glow(0x3fe0a0, 1.2), -0.06, -0.02, 0.247, g);
    for (let i = 0; i < 3; i++) cyl(0.012, 0.012, 0.02, std([0xc8202a, 0xffc857, 0x2b6ad8][i]), 0.05 + i * 0.03, -0.07, 0.245, g, 10).rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) cyl(0.01, 0.01, 0.2, std(0x3a3f4a), sx * 0.07, 0.06, 0.17, g, 8).rotation.x = 0.4; // hoses to the DCM
    return g; } },
  // Primary life-support system: flush against the torso back, with an oxygen bottle cover and antenna
  plss: { name: 'Life-support pack', mount: [0, 1.12, -0.3], build() {
    const g = new THREE.Group(), m = white();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.6, 0.2, 2, 2, 2), m); g.add(body);
    for (const sx of [-1, 1]) cyl(0.03, 0.03, 0.6, m, sx * 0.23, 0, 0, g, 12);                  // rounded side edges
    box(0.4, 0.12, 0.04, shade(), 0, 0.2, -0.11, g); box(0.4, 0.06, 0.03, shade(), 0, -0.22, -0.11, g);
    box(0.36, 0.3, 0.02, std(0xe0e2e6, { roughness: 0.6 }), 0, -0.02, -0.105, g);
    cyl(0.008, 0.006, 0.28, MAT.metal(0x8a8f99), 0.19, 0.42, -0.04, g, 6);                      // antenna
    box(0.05, 0.04, 0.03, std(0x3a3f4a), 0.19, 0.29, -0.04, g);
    box(0.44, 0.05, 0.1, std(0xb8bec8), 0, 0.275, 0.07, g);                                       // top attach bracket
    return g; } },
  gloveL: { name: 'Left glove', mount: [-0.42, 0.66, 0.02], build: () => glove(-1) },
  gloveR: { name: 'Right glove', mount: [0.42, 0.66, 0.02], build: () => glove(1) },
  // Helmet: clear bubble, hard visor assembly with the gold sun visor raised, helmet lights and camera
  helmet: { name: 'Helmet', mount: [0, 1.5, 0.02], build() {
    const g = new THREE.Group();
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.74), new THREE.MeshStandardMaterial({ color: 0xdcecff, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }));
    bubble.renderOrder = 5; g.add(bubble);
    // hard shell over the back and top (leaves the face open)
    const shellM = std(0xf2f3f5, { roughness: 0.55, side: THREE.DoubleSide });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.185, 28, 18, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.7), shellM); g.add(shell);
    // gold sun visor, raised: covers the top of the face opening only (does not block the view)
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.19, 28, 14, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.1, Math.PI * 0.2), new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.12, metalness: 0.95, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    visor.renderOrder = 5; g.add(visor);
    const ringM = MAT.metal(0x9aa3b2); const neck = new THREE.Mesh(new THREE.TorusGeometry(0.137, 0.02, 8, 28), ringM); neck.rotation.x = Math.PI / 2; neck.position.y = -0.115; g.add(neck);
    for (const sx of [-1, 1]) { // helmet lights + camera
      box(0.04, 0.05, 0.07, std(0xe6e8ec), sx * 0.18, 0.05, 0.04, g);
      box(0.004, 0.03, 0.04, MAT.glow(0xfff6d8, 1.2), sx * 0.2, 0.05, 0.05, g);
    }
    cyl(0.012, 0.012, 0.03, std(0x111216), 0.18, 0.1, 0.07, g, 10).rotation.x = Math.PI / 2;
    return g; } }
};
// Glove: cuff ring on top (meets the wrist ring at y 0.76), gauntlet, palm, four fingers and a thumb, with grip pads
function glove(side) {
  const g = new THREE.Group(), m = white(), pad = std(0x8a8f99, { roughness: 0.9 });
  ringAt(0.058, 0.016, std(0x2b4f8f, { roughness: 0.4, metalness: 0.5 }), 0, 0.1, 0, g);
  cyl(0.058, 0.05, 0.12, m, 0, 0.04, 0, g, 16);
  const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.05, 4, 12), m); palm.position.set(0, -0.055, 0); palm.scale.set(1.15, 1, 0.65); g.add(palm);
  box(0.06, 0.05, 0.006, pad, 0, -0.06, 0.028, g);
  for (let i = 0; i < 4; i++) { const f = cap(0.0125, 0.045 - Math.abs(i - 1.5) * 0.006, m, -0.033 + i * 0.022, -0.125, 0.004, g); f.rotation.x = 0.15; cap(0.008, 0.006, pad, -0.033 + i * 0.022, -0.15, 0.014, g); }
  cap(0.014, 0.035, m, side * 0.05, -0.05, 0.016, g).rotation.z = side * 0.55;
  return g;
}
export const PART_ORDER = ['cooling', 'lower', 'boots', 'upper', 'plss', 'gloveL', 'gloveR', 'helmet'];
export function makePart(id) { const g = shadowAll(PARTS[id].build()); g.userData.partId = id; return g; }

// Suit stand: base plate and a post with a cross bar
export function makeSuitStand() {
  const g = new THREE.Group(), metal = MAT.metal(0x6a707c);
  cyl(0.45, 0.5, 0.05, metal, 0, 0.025, 0, g, 24); cyl(0.03, 0.03, 1.32, metal, 0, 0.7, -0.46, g, 10);
  box(0.08, 0.08, 0.06, metal, 0, 1.3, -0.43, g); box(0.3, 0.04, 0.05, metal, 0, 1.3, -0.43, g); // bracket that holds the backpack from behind
  return shadowAll(g);
}
export function makeLabTable(w = 2.4, d = 0.8, col = 0xe8ebf0) { const g = new THREE.Group(); box(w, 0.06, d, std(col, { roughness: 0.4 }), 0, 0.9, 0, g); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.05, 0.88, 0.05, MAT.metal(0x8a8f99), x * (w / 2 - 0.06), 0.44, z * (d / 2 - 0.06), g); return shadowAll(g); }
export function makeBin(col = 0xc8202a, label = 'REJECT') { const g = new THREE.Group(); box(0.6, 0.6, 0.5, std(col, { roughness: 0.6 }), 0, 0.3, 0, g); box(0.5, 0.02, 0.4, std(0x1a1d24), 0, 0.605, 0, g); g.userData.label = label; return shadowAll(g); }
export function makeCabinet() { const g = new THREE.Group(); box(0.9, 1.6, 0.5, std(0x3e5c8a, { roughness: 0.5 }), 0, 0.8, 0, g); box(0.86, 0.02, 0.46, std(0x2e4a70), 0, 1.0, 0.02, g); return shadowAll(g); }
export function makePanel(w = 0.8, hgt = 0.6) { const g = new THREE.Group(); box(w, hgt, 0.08, std(0x2a2d33, { roughness: 0.5 }), 0, 0, 0, g); return g; }
