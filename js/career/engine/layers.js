// ASTRO LAB Career — render order and layering convention for every 3D scene (see docs/RENDER-LAYERS.md).
// three.js draws opaque objects first (front to back), then transparent objects (back to front), each group sorted by renderOrder.
// The bands below keep boards, screens, glass, held items, effects and highlights in a stable order in every scene.
import * as THREE from '../../../vendor/three.module.js';

export const RO = {
  ENV: 0,          // background environment: rooms, terrain, sky, buildings
  PROP: 0,         // interactive props and furniture (opaque, depth-sorted normally)
  CHAR: 0,         // characters (opaque, depth-sorted normally)
  DECAL: 1,        // floor marks, rugs, posters and signs lying on another surface (polygon offset, see decal())
  WORLD_UI: 2,     // world-space boards, monitors, mission boards, signs
  GLASS: 5,        // transparent glass, visors, windows, water, holograms (no depth write)
  HELD: 8,         // the object in the player's hand and the first-person hands
  FX: 9,           // particles: smoke, spray, mist, sparks (no depth write)
  HIGHLIGHT: 20,   // focus outline around the object under the crosshair (drawn on top)
  MARKER: 21       // objective chevron (drawn on top)
};

// A flat thing lying on (or fixed to) another surface: pull it towards the camera in depth so it never z-fights.
export function decal(obj, level = 1) {
  obj.traverse(o => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) { m.polygonOffset = true; m.polygonOffsetFactor = -1 * level; m.polygonOffsetUnits = -4 * level; }
    if (o.renderOrder < RO.DECAL) o.renderOrder = RO.DECAL;
  });
  return obj;
}
// A world-space board, screen or sign: offset like a decal and drawn after the environment
export function worldUI(obj) { decal(obj, 2); obj.traverse(o => { if (o.isMesh && o.renderOrder < RO.WORLD_UI) o.renderOrder = RO.WORLD_UI; }); return obj; }
// Transparent glass-like surfaces: no depth write (so things behind still show) and drawn after opaque objects
export function glassy(obj) {
  obj.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m.transparent) continue; m.depthWrite = false; } if (o.renderOrder < RO.GLASS) o.renderOrder = RO.GLASS; });
  return obj;
}
// Particles and effects
export function fx(obj) { obj.traverse(o => { if (!o.isMesh && !o.isPoints && !o.isInstancedMesh) return; for (const m of [].concat(o.material)) { m.depthWrite = false; } o.renderOrder = RO.FX; }); return obj; }
// Overlays that must always be visible (outline, objective marker)
export function onTop(obj, order = RO.HIGHLIGHT) { obj.traverse(o => { if (!o.material) return; for (const m of [].concat(o.material)) { m.depthTest = false; m.depthWrite = false; m.transparent = true; } o.renderOrder = order; }); return obj; }

// Applied to every scene after it is built: fixes the common mistakes automatically.
//  - transparent materials that still write depth (they hide what is behind them, or flicker) -> no depth write, glass band
//  - invisible hit boxes (material.visible = false) are never drawn and never cast shadows
//  - big flat planes placed on top of other surfaces (floor marks, posters, screen faces) get a polygon offset
export function auditScene(scene) {
  let fixed = 0;
  scene.traverse(o => {
    if (!o.isMesh) return;
    const mats = [].concat(o.material);
    if (mats.every(m => m.visible === false)) { o.castShadow = false; o.receiveShadow = false; return; }
    for (const m of mats) {
      if (m.transparent && m.opacity < 0.98 && m.depthWrite && !o.userData.keepDepth) { m.depthWrite = false; if (o.renderOrder === 0) o.renderOrder = RO.GLASS; fixed++; }
    }
    const gp = o.geometry?.parameters || {};
    const small = Math.max(gp.width || 0, gp.height || 0, (gp.radius || gp.outerRadius || 0) * 2) * Math.max(o.scale.x, o.scale.y, o.scale.z) <= 6;
    if (small && (o.geometry?.type === 'PlaneGeometry' || o.geometry?.type === 'CircleGeometry' || o.geometry?.type === 'RingGeometry')) {
      if (!mats.some(m => m.polygonOffset)) { for (const m of mats) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -4; } if (o.renderOrder === 0) o.renderOrder = RO.DECAL; fixed++; }
    }
  });
  return fixed;
}

// Small helper used by the highlight outline: corner brackets around a box
export function bracketGeometry(size) {
  const [x, y, z] = [size.x / 2, size.y / 2, size.z / 2], k = 0.28, pts = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const c = new THREE.Vector3(sx * x, sy * y, sz * z);
    pts.push(c, c.clone().add(new THREE.Vector3(-sx * x * 2 * k, 0, 0)));
    pts.push(c, c.clone().add(new THREE.Vector3(0, -sy * y * 2 * k, 0)));
    pts.push(c, c.clone().add(new THREE.Vector3(0, 0, -sz * z * 2 * k)));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}
