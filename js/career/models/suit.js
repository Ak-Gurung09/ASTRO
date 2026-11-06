// ASTRO LAB Career — spacesuit parts (simplified spacewalk suit), the suit stand and lab furniture.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from './materials.js';
import { std, box, cyl } from './house.js';

const white = () => std(0xf2f3f5, { roughness: 0.7 }), shade = () => std(0xd9dce2, { roughness: 0.75 });
const shadowAll = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const cap = (r, l, m, x = 0, y = 0, z = 0, parent) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), m); c.position.set(x, y, z); parent?.add(c); return c; };

// Each part: a model centred on its own origin. `mount` = where it sits on the stand (relative to the stand base).
export const PARTS = {
  cooling: { name: 'Cooling garment', mount: [0, 1.0, 0], build() { const g = new THREE.Group(), m = std(0xdfe8f2, { roughness: 0.95 }); box(0.42, 0.55, 0.16, m, 0, 0, 0, g); for (let i = 0; i < 6; i++) box(0.4, 0.01, 0.17, std(0x5a8ad8), 0, -0.24 + i * 0.09, 0, g); for (const sx of [-1, 1]) cap(0.05, 0.3, m, sx * 0.27, 0.05, 0, g).rotation.z = sx * 0.4; return g; } },
  lower: { name: 'Lower torso', mount: [0, 0.62, 0], build() { const g = new THREE.Group(), m = white(); box(0.42, 0.22, 0.26, m, 0, 0.2, 0, g); for (const sx of [-1, 1]) { cap(0.1, 0.42, m, sx * 0.11, -0.2, 0, g); cyl(0.105, 0.105, 0.04, shade(), sx * 0.11, -0.05, 0, g); } cyl(0.24, 0.24, 0.05, MAT.metal(0x9aa3b2), 0, 0.33, 0, g, 24); return g; } },
  boots: { name: 'Boots', mount: [0, 0.08, 0.04], build() { const g = new THREE.Group(), m = white(); for (const sx of [-1, 1]) { box(0.13, 0.14, 0.28, m, sx * 0.11, 0, 0.04, g); box(0.14, 0.03, 0.3, std(0x3a3f4a), sx * 0.11, -0.075, 0.04, g); } return g; } },
  upper: { name: 'Upper torso', mount: [0, 1.12, 0], build() { const g = new THREE.Group(), m = white(); const t = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 14), m); t.scale.set(1.05, 1.05, 0.72); g.add(t); for (const sx of [-1, 1]) { const a = cap(0.075, 0.42, m, sx * 0.36, -0.12, 0, g); a.rotation.z = sx * 0.18; cyl(0.08, 0.08, 0.03, shade(), sx * 0.4, -0.38, 0, g); } box(0.24, 0.14, 0.06, std(0x2a2d33), 0, -0.05, 0.2, g); box(0.05, 0.05, 0.01, MAT.glow(0x3fe0a0, 1.2), -0.05, -0.03, 0.235, g); cyl(0.13, 0.13, 0.04, MAT.metal(0x9aa3b2), 0, 0.27, 0, g, 24); return g; } },
  plss: { name: 'Life-support pack', mount: [0, 1.12, -0.3], build() { const g = new THREE.Group(), m = white(); box(0.5, 0.62, 0.22, m, 0, 0, 0, g); box(0.42, 0.12, 0.05, shade(), 0, 0.2, -0.12, g); cyl(0.04, 0.04, 0.5, std(0x8a8f99), 0.18, 0, -0.13, g); return g; } },
  gloveL: { name: 'Left glove', mount: [-0.42, 0.66, 0.02], build: () => glove(-1) },
  gloveR: { name: 'Right glove', mount: [0.42, 0.66, 0.02], build: () => glove(1) },
  helmet: { name: 'Helmet', mount: [0, 1.5, 0.02], build() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), new THREE.MeshStandardMaterial({ color: 0xcfe3ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.3 })); g.add(b); const v = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12, -1.2, 2.4, 0.5, 1.3), std(0xd9a441, { roughness: 0.15, metalness: 0.9, side: THREE.DoubleSide })); v.rotation.y = 0; g.add(v); cyl(0.15, 0.15, 0.05, MAT.metal(0x9aa3b2), 0, -0.17, 0, g, 24); return g; } }
};
function glove(side) { const g = new THREE.Group(), m = white(); cyl(0.06, 0.055, 0.14, m, 0, 0.06, 0, g); box(0.09, 0.1, 0.04, m, 0, -0.05, 0, g); for (let i = 0; i < 4; i++) cap(0.011, 0.04, m, -0.03 + i * 0.02, -0.12, 0, g); cap(0.012, 0.03, m, side * 0.055, -0.04, 0.01, g).rotation.z = side * 0.6; cyl(0.065, 0.065, 0.025, std(0x2b4f8f), 0, 0.13, 0, g); return g; }
export const PART_ORDER = ['cooling', 'lower', 'boots', 'upper', 'plss', 'gloveL', 'gloveR', 'helmet'];
export function makePart(id) { const g = shadowAll(PARTS[id].build()); g.userData.partId = id; return g; }

// Suit stand: base plate and a post with a cross bar
export function makeSuitStand() {
  const g = new THREE.Group(), metal = MAT.metal(0x6a707c);
  cyl(0.45, 0.5, 0.05, metal, 0, 0.025, 0, g, 24); cyl(0.03, 0.03, 1.6, metal, 0, 0.8, -0.18, g, 10); box(0.6, 0.04, 0.04, metal, 0, 1.4, -0.18, g);
  return shadowAll(g);
}
export function makeLabTable(w = 2.4, d = 0.8, col = 0xe8ebf0) { const g = new THREE.Group(); box(w, 0.06, d, std(col, { roughness: 0.4 }), 0, 0.9, 0, g); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.05, 0.88, 0.05, MAT.metal(0x8a8f99), x * (w / 2 - 0.06), 0.44, z * (d / 2 - 0.06), g); return shadowAll(g); }
export function makeBin(col = 0xc8202a, label = 'REJECT') { const g = new THREE.Group(); box(0.6, 0.6, 0.5, std(col, { roughness: 0.6 }), 0, 0.3, 0, g); box(0.5, 0.02, 0.4, std(0x1a1d24), 0, 0.605, 0, g); g.userData.label = label; return shadowAll(g); }
export function makeCabinet() { const g = new THREE.Group(); box(0.9, 1.6, 0.5, std(0x3e5c8a, { roughness: 0.5 }), 0, 0.8, 0, g); box(0.86, 0.02, 0.46, std(0x2e4a70), 0, 1.0, 0.02, g); return shadowAll(g); }
export function makePanel(w = 0.8, hgt = 0.6) { const g = new THREE.Group(); box(w, hgt, 0.08, std(0x2a2d33, { roughness: 0.5 }), 0, 0, 0, g); return g; }
