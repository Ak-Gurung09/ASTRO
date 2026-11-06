// ASTRO LAB Career — outdoor models: the family car (with a full interior), roadside scenery, the training centre and a display rocket.
import * as THREE from '../../../vendor/three.module.js';
import { TEX, MAT } from './materials.js';
import { std, box, cyl } from './house.js';
import { drawEmblem } from '../ui/letter.js';
import { makeSign } from './props.js';

const shadowAll = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

// Car: faces -z, centre at the origin on the ground. Built from thin panels so the cabin looks right from inside.
export function makeCar(color = 0x3a6ea5, { interior = true } = {}) {
  const g = new THREE.Group();
  const paint = std(color, { roughness: 0.3, metalness: 0.45 }), dark = std(0x1c1f25, { roughness: 0.8 }), trim = std(0x2a2d33, { roughness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fc4e0, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const seatM = std(0x767c88, { roughness: 0.95 }), chrome = MAT.metal(0xd0d4da);
  // nose (engine bay) and tail (boot)
  box(1.8, 0.62, 1.1, paint, 0, 0.61, -1.65, g); box(1.82, 0.22, 0.12, trim, 0, 0.42, -2.21, g);
  box(1.8, 0.62, 0.8, paint, 0, 0.61, 1.8, g); box(1.82, 0.22, 0.12, trim, 0, 0.42, 2.21, g);
  for (const sx of [-1, 1]) {
    box(0.34, 0.12, 0.04, MAT.glow(0xfff6d8, 1.4), sx * 0.6, 0.78, -2.21, g);   // headlights
    box(0.34, 0.1, 0.04, MAT.glow(0xd8202a, 0.8), sx * 0.6, 0.78, 2.21, g);     // tail lights
    // doors (thin), sills
    box(0.06, 0.7, 2.5, paint, sx * 0.88, 0.65, 0.15, g); box(0.07, 0.04, 2.5, chrome, sx * 0.885, 1.0, 0.15, g);
    for (const z of [-0.45, 0.75]) box(0.02, 0.03, 0.18, chrome, sx * 0.92, 0.88, z, g);       // door handles
    // pillars
    const a = box(0.06, 0.06, 0.75, paint, sx * 0.84, 1.22, -0.8, g); a.rotation.x = Math.atan2(0.45, 0.6);
    box(0.06, 0.45, 0.08, paint, sx * 0.85, 1.22, 0.15, g);
    const c = box(0.06, 0.06, 0.6, paint, sx * 0.84, 1.22, 1.2, g); c.rotation.x = -Math.atan2(0.45, 0.4);
    // wheels
    for (const z of [-1.35, 1.35]) { const w = cyl(0.33, 0.33, 0.24, dark, sx * 0.84, 0.33, z, g, 24); w.rotation.z = Math.PI / 2; const hub = cyl(0.18, 0.18, 0.25, chrome, sx * 0.84, 0.33, z, g, 16); hub.rotation.z = Math.PI / 2; (g.userData.wheels ||= []).push(w, hub); }
    // mirrors
    box(0.16, 0.1, 0.08, paint, sx * 1.0, 1.05, -0.95, g);
  }
  box(1.6, 0.05, 1.55, paint, 0, 1.46, 0.22, g);                                          // roof
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.76), glass); ws.position.set(0, 1.22, -0.8); ws.rotation.x = -Math.atan2(0.6, 0.45); g.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.62), glass); rw.position.set(0, 1.22, 1.2); rw.rotation.x = Math.atan2(0.4, 0.45); g.add(rw);
  for (const sx of [-1, 1]) { const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.44), glass); sw.position.set(sx * 0.87, 1.22, 0.2); sw.rotation.y = Math.PI / 2; g.add(sw); }
  if (interior) {
    box(1.7, 0.05, 2.5, std(0x30333a, { roughness: 1 }), 0, 0.36, 0.15, g);               // floor
    box(1.7, 0.32, 0.45, std(0x3a3e46, { roughness: 0.7 }), 0, 0.9, -1.0, g);                                             // dashboard
    box(0.5, 0.1, 0.02, MAT.glow(0x7ad8ff, 0.6), -0.4, 0.98, -0.77, g);                       // instrument cluster glow
    box(0.25, 0.14, 0.02, std(0x0b0d12, { roughness: 0.2 }), 0, 0.98, -0.77, g);              // radio screen
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 10, 28), dark); wheel.position.set(-0.4, 1.0, -0.62); wheel.rotation.x = -0.35; g.add(wheel); g.userData.steer = wheel;
    cyl(0.02, 0.02, 0.25, dark, -0.4, 0.95, -0.72, g).rotation.x = Math.PI / 2 - 0.35;
    for (const sx of [-1, 1]) { // front seats
      box(0.55, 0.12, 0.5, seatM, sx * 0.4, 0.55, -0.15, g);
      const bk = box(0.5, 0.52, 0.1, seatM, sx * 0.4, 0.86, 0.12, g); bk.rotation.x = -0.12;
      box(0.22, 0.15, 0.08, seatM, sx * 0.4, 1.22, 0.15, g);                                  // headrest
      box(0.04, 0.5, 2.3, std(0x5a5f6a, { roughness: 0.9 }), sx * 0.84, 0.75, 0.15, g);       // inner door trim
      box(0.08, 0.04, 0.5, trim, sx * 0.82, 0.86, 0.75, g);                                   // armrest
    }
    box(1.5, 0.14, 0.55, seatM, 0, 0.55, 0.78, g);                                           // rear bench
    const rb = box(1.5, 0.62, 0.12, seatM, 0, 0.88, 1.08, g); rb.rotation.x = -0.15;
    box(1.6, 0.04, 0.35, trim, 0, 1.0, 1.32, g);                                              // parcel shelf
    box(1.55, 0.02, 1.5, std(0xd9d6cf, { roughness: 1, emissive: 0x3a3832 }), 0, 1.43, 0.22, g);
    const cabin = new THREE.PointLight(0xfff3e0, 1.6, 3.2, 1.5); cabin.position.set(0, 1.3, 0.2); g.add(cabin);                  // headliner
    const mirror = box(0.22, 0.06, 0.02, trim, 0, 1.36, -0.55, g); void mirror;
  }
  return shadowAll(g);
}

// Roadside: a simple house, a tree, a lamppost, a power pole, a sign, a fence panel
const ROOF = [0x7a3a2e, 0x4a4f5a, 0x5c4436, 0x3d5566];
const WALLS = [0xe9e2d0, 0xd8c8a8, 0xc9d6e0, 0xe6d3c3, 0xd0dcc4];
export function makeRoadHouse(seed = 0) {
  const g = new THREE.Group(), r = n => ((Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  const w = 7 + r(1) * 3, d = 6 + r(2) * 2, hh = 3 + (r(3) < 0.4 ? 2.6 : 0);
  box(w, hh, d, std(WALLS[(r(4) * WALLS.length) | 0], { roughness: 0.9 }), 0, hh / 2, 0, g);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, d * 0.72, w + 0.6, 4, 1), std(ROOF[(r(5) * ROOF.length) | 0], { roughness: 0.85 }));
  roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 4; roof.scale.set(1, 1, 0.55); roof.position.y = hh + 0.9; g.add(roof);
  const winM = std(0x8fb3d0, { roughness: 0.1, metalness: 0.3, emissive: 0x223344, emissiveIntensity: 0.3 });
  for (const x of [-w / 3, w / 3]) box(1.2, 1.1, 0.05, winM, x, 1.6, d / 2 + 0.02, g);
  box(1.0, 2.0, 0.06, std(0x6a4030), 0, 1.0, d / 2 + 0.03, g);
  if (hh > 4) for (const x of [-w / 3, 0, w / 3]) box(1.0, 1.0, 0.05, winM, x, 4.2, d / 2 + 0.02, g);
  return shadowAll(g);
}
export function makeTree(seed = 0, sc = 1) {
  const g = new THREE.Group(); cyl(0.14 * sc, 0.2 * sc, 2.2 * sc, std(0x5a3e2a), 0, 1.1 * sc, 0, g, 8);
  const leaf = std([0x4f8a3c, 0x3f7a35, 0x5d9445][seed % 3], { roughness: 0.95 });
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry((1.0 + (i % 2) * 0.3) * sc, 0), leaf); b.position.set(Math.cos(i * 2.1 + seed) * 0.6 * sc, (2.6 + (i % 3) * 0.5) * sc, Math.sin(i * 2.1 + seed) * 0.6 * sc); b.castShadow = true; g.add(b); }
  return g;
}
export function makeLamppost() { const g = new THREE.Group(), m = MAT.metal(0x4a4f5a); cyl(0.06, 0.08, 5, m, 0, 2.5, 0, g, 8); box(0.9, 0.06, 0.08, m, -0.45, 4.95, 0, g); box(0.35, 0.1, 0.2, MAT.glow(0xfff3d0, 0.4), -0.85, 4.88, 0, g); return g; }
export function makePowerPole() { const g = new THREE.Group(), m = std(0x6a5038); cyl(0.12, 0.15, 8, m, 0, 4, 0, g, 8); box(1.8, 0.12, 0.12, m, 0, 7.4, 0, g); return g; }
export function makeRoadSign(text, sub, col = '#1f6b3a') { const g = new THREE.Group(); const s = makeSign(text, sub, 3.2, col); s.position.y = 3.2; g.add(s); for (const x of [-1.2, 1.2]) cyl(0.05, 0.05, 3.2, MAT.metal(0x8a8f99), x, 1.6, -0.03, g, 8); return g; }
export function makeFence(len = 10) { const g = new THREE.Group(), m = MAT.metal(0x9aa0aa); for (let x = -len / 2; x <= len / 2 + 0.01; x += 2.5) cyl(0.04, 0.04, 1.8, m, x, 0.9, 0, g, 6); for (const y of [0.3, 1.7]) box(len, 0.04, 0.04, m, 0, y, 0, g); const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.4), new THREE.MeshStandardMaterial({ color: 0x9aa0aa, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })); mesh.position.y = 1.0; g.add(mesh); return g; }

// The programme's flag: emblem on deep blue (original design)
function flagTex(kind) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
  if (kind === 'emblem') { x.fillStyle = '#0d2f6e'; x.fillRect(0, 0, 256, 160); drawEmblem(x, 128, 80, 60); }
  else if (kind === 'stripes') { for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#f4f6ff' : '#e8423a'; x.fillRect(0, i * 32, 256, 32); } x.fillStyle = '#0d2f6e'; x.fillRect(0, 0, 100, 96); x.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(16 + (i % 3) * 34, 18 + Math.floor(i / 3) * 30, 6, 0, 7); x.fill(); } }
  else { x.fillStyle = '#123f8f'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#fff'; x.font = 'bold 34px system-ui'; x.textAlign = 'center'; x.fillText('CLASS OF', 128, 70); x.font = 'bold 48px system-ui'; x.fillText(String(new Date().getFullYear()), 128, 122); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function makeFlag(kind = 'emblem', poleH = 9) {
  const g = new THREE.Group(); cyl(0.06, 0.08, poleH, MAT.metal(0xc8ccd2), 0, poleH / 2, 0, g, 10);
  const geo = new THREE.PlaneGeometry(2.4, 1.5, 16, 4); geo.translate(1.2, 0, 0);
  const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: flagTex(kind), side: THREE.DoubleSide, roughness: 0.9 })); flag.position.y = poleH - 0.85; flag.castShadow = true; g.add(flag);
  g.userData.flag = flag; g.userData.base = Float32Array.from(geo.attributes.position.array); g.userData.ph = Math.random() * 6;
  return g;
}
export function waveFlag(f, t) {
  const pos = f.userData.flag.geometry.attributes.position, b = f.userData.base;
  for (let i = 0; i < pos.count; i++) { const x = b[i * 3]; pos.setZ(i, Math.sin(x * 2.2 - t * 4 + f.userData.ph) * 0.12 * (x / 2.4)); }
  pos.needsUpdate = true;
}

// Generic display rocket (not a real vehicle): core stage, two boosters, upper stage, capsule and escape tower
export function makeDisplayRocket(sc = 1) {
  const g = new THREE.Group(), white = std(0xf2f3f5, { roughness: 0.45 }), grey = std(0x6a707c, { roughness: 0.5 }), orange = std(0xd9773a, { roughness: 0.6 }), black = std(0x1c1f25);
  cyl(1.0, 1.0, 14, white, 0, 9, 0, g, 28); for (const y of [4, 8, 12]) cyl(1.02, 1.02, 0.25, black, 0, y, 0, g, 28);
  for (const sx of [-1, 1]) { cyl(0.45, 0.45, 11, white, sx * 1.5, 7.5, 0, g, 18); const n = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.4, 18), white); n.position.set(sx * 1.5, 13.7, 0); g.add(n); cyl(0.5, 0.35, 0.8, grey, sx * 1.5, 1.6, 0, g, 16); }
  cyl(0.8, 1.0, 1.2, grey, 0, 16.6, 0, g, 24); cyl(0.8, 0.8, 3, white, 0, 18.7, 0, g, 24);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.6, 24), std(0xdfe2e8, { roughness: 0.35, metalness: 0.2 })); cap.position.y = 21; g.add(cap);
  cyl(0.05, 0.05, 1.8, orange, 0, 22.6, 0, g, 8);
  for (let i = 0; i < 4; i++) { const f = box(0.08, 2.2, 1.4, grey, 0, 3, 0, g); f.rotation.y = i * Math.PI / 2; f.translateZ(1.6); }
  cyl(0.7, 1.1, 1.2, black, 0, 1.4, 0, g, 20);
  // launch stand
  box(5, 0.8, 5, std(0x8a8f99, { roughness: 0.8 }), 0, 0.4, 0, g);
  const c2 = document.createElement('canvas'); c2.width = 128; c2.height = 512; const x = c2.getContext('2d'); x.fillStyle = '#f2f3f5'; x.fillRect(0, 0, 128, 512); x.fillStyle = '#0d2f6e'; x.font = 'bold 54px system-ui'; x.textAlign = 'center'; [...'JATP'].forEach((ch, i) => x.fillText(ch, 64, 90 + i * 100));
  const t = new THREE.CanvasTexture(c2); t.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.6), std(0xffffff, { map: t, transparent: true })); label.position.set(0, 9.5, 1.01); g.add(label);
  g.scale.setScalar(sc);
  return shadowAll(g);
}

// The Astronaut Training Centre facade (front faces +z). Width 36 m, two glass sliding doors at x=0.
export function makeTrainingCentre() {
  const g = new THREE.Group();
  const wallM = std(0xe8eaee, { roughness: 0.8 }), glassM = std(0x2a4766, { roughness: 0.08, metalness: 0.6, emissive: 0x0a1a2c, emissiveIntensity: 0.4 }), frameM = MAT.metal(0x8a8f99);
  box(36, 11, 14, wallM, 0, 5.5, -7, g);
  for (let row = 0; row < 3; row++) for (let i = -8; i <= 8; i++) { if (row === 0 && Math.abs(i) < 3) continue; box(1.6, 1.8, 0.06, glassM, i * 2, 2.0 + row * 3.2, 0.03, g); }
  // entrance: glass block, canopy, doors
  box(10, 4.4, 0.08, glassM, 0, 2.2, 0.05, g);
  box(12, 0.35, 4.5, std(0xd9dce2, { roughness: 0.5 }), 0, 4.6, 2.2, g); for (const x of [-5.6, 5.6]) cyl(0.15, 0.15, 4.5, frameM, x, 2.25, 4.1, g, 12);
  const lobby = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.7), new THREE.MeshStandardMaterial({ color: 0xe8eef6, emissive: 0xc8d4e4, emissiveIntensity: 0.7, roughness: 0.6 })); lobby.position.set(0, 1.35, 0.095); g.add(lobby);
  const doors = new THREE.Group(); doors.position.set(0, 0, 0.12); g.add(doors);
  const leaves = [-1, 1].map(sx => { const l = box(1.2, 2.6, 0.06, std(0x9fc4e0, { transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.4 }), sx * 0.6, 1.3, 0, doors); box(1.2, 0.08, 0.08, frameM, 0, 1.3, 0.02, l); return l; });
  box(2.6, 0.12, 0.12, frameM, 0, 2.66, 0.1, doors);
  g.userData.doors = leaves;
  const sign = makeSign('ASTRONAUT TRAINING CENTRE', 'Junior Astronaut Training Program', 14, '#0d2f6e'); sign.position.set(0, 8.8, 0.06); g.add(sign);
  // banners with the emblem either side
  for (const x of [-11, 11]) {
    const c = document.createElement('canvas'); c.width = 160; c.height = 400; const x2 = c.getContext('2d'); x2.fillStyle = '#0d2f6e'; x2.fillRect(0, 0, 160, 400); drawEmblem(x2, 80, 110, 62); x2.fillStyle = '#fff'; x2.font = 'bold 26px system-ui'; x2.textAlign = 'center'; x2.fillText('WELCOME', 80, 240); x2.fillText('CADETS', 80, 276); x2.font = '16px system-ui'; x2.fillText('Train · Explore · Return', 80, 330);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 6), std(0xffffff, { map: t, roughness: 0.9 })); b.position.set(x, 6.5, 0.1); g.add(b);
  }
  return shadowAll(g);
}
