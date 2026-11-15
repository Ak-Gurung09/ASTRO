// ASTRO LAB Career — what the player is looking at, the "E / tap to use" prompt, the focus outline and objective markers.
// Line of sight: a usable object is only picked when nothing solid is in front of it (no using things through walls).
import * as THREE from '../../../vendor/three.module.js';
import { RO, onTop, bracketGeometry } from './layers.js';

// Any Object3D becomes usable with makeUsable(obj, { label, verb, use, enabled?, range? }).
export function makeUsable(obj, it) { obj.userData.it = Object.assign({ verb: 'Use', range: 2.4, enabled: () => true }, it); obj.userData.it.obj = obj; return obj; }
// Mark an object as never blocking line of sight (glass, thin decorations, effects)
export const seeThrough = obj => { obj.traverse(o => { o.userData.noBlock = true; }); return obj; };

const _box = new THREE.Box3(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
// Does this mesh count as solid for line of sight? Visible, opaque, reasonably big.
function solid(o) {
  if (!o.isMesh || o.userData.noBlock) return false;
  for (let p = o; p; p = p.parent) if (p.visible === false) return false;
  const mats = [].concat(o.material);
  if (mats.some(m => m.visible === false || (m.transparent && m.opacity < 0.9) || m.depthTest === false)) return false;
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  o.getWorldScale(_s); return o.geometry.boundingSphere.radius * Math.max(_s.x, _s.y, _s.z) > 0.3;
}

export class Interactor {
  constructor(world, player) {
    this.world = world; this.player = player; this.ray = new THREE.Raycaster(); this.ray.far = 8; // each item's own range limits it
    this.targets = []; this.focus = null; this.blockers = []; this.exclude = new Set(); this.losCheck = true;
    // A floating chevron over the current objective target (drawn on top)
    const g = new THREE.ConeGeometry(0.09, 0.2, 4); g.rotateX(Math.PI);
    this.marker = onTop(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.9 })), RO.MARKER);
    this.marker.visible = false; this.marker.userData.noBlock = true; world.scene.add(this.marker); this.markerFor = null; this.t = 0;
    // Focus outline: corner brackets around whatever the crosshair is on
    this.outline = onTop(new THREE.LineSegments(bracketGeometry(new THREE.Vector3(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95 })));
    this.outline.visible = false; this.outline.userData.noBlock = true; world.scene.add(this.outline); this._outlineFor = null;
  }
  add(obj) { if (!this.targets.includes(obj)) this.targets.push(obj); return obj; }
  remove(obj) { this.targets = this.targets.filter(o => o !== obj); if (this.focus?.obj === obj) this.focus = null; }
  mark(obj) { this.markerFor = obj; }
  usableOf(o) { while (o && !o.userData.it && !o.userData.blocker) o = o.parent; return o; }
  // Find the nearest usable object under the crosshair (or under a tap point)
  pick(ndc = new THREE.Vector2(0, 0)) {
    this.ray.setFromCamera(ndc, this.world.camera);
    const list = this.targets.filter(o => o.visible !== false && o.parent && !this.exclude.has(o) && !this.isFP(o));
    const hits = this.ray.intersectObjects([...list, ...this.blockers], true);
    for (const hgt of hits) {
      const o = this.usableOf(hgt.object);
      if (!o) continue; if (o.userData.blocker) return null;
      const it = o.userData.it; if (hgt.distance > it.range || !it.enabled()) continue;
      if (this.losCheck && this.occluded(hgt.distance, o)) return null;
      return it;
    }
    return null;
  }
  // Is a solid mesh (not part of the target) closer than the target along the current ray?
  occluded(dist, target) {
    const hits = this.ray.intersectObject(this.world.scene, true);
    for (const hgt of hits) {
      if (hgt.distance >= dist - 0.08) return false;
      let mine = false; for (let p = hgt.object; p; p = p.parent) if (p === target) { mine = true; break; }
      if (mine || !solid(hgt.object)) continue;
      return true;
    }
    return false;
  }
  update(dt) {
    this.focus = this.pick();
    this.t += dt;
    const m = this.markerFor;
    if (m && m.parent && m.visible !== false && !this.isFP(m)) {
      const b = _box.setFromObject(m); const c = b.getCenter(_v);
      this.marker.position.set(c.x, b.max.y + 0.28 + Math.sin(this.t * 3) * 0.06, c.z); this.marker.rotation.y += dt * 2; this.marker.visible = true;
    } else this.marker.visible = false;
    // outline the focused object (only things in the world, not the item in your hand)
    const f = this.focus?.obj;
    if (f && f.parent && !this.isFP(f) && !this.hideOutline) {
      if (this._outlineFor !== f || (this.t % 0.25) < dt) { // refresh a few times a second (things move)
        const b = _box.setFromObject(f);
        if (!b.isEmpty()) { const size = b.getSize(new THREE.Vector3()).max(new THREE.Vector3(0.08, 0.08, 0.08)).multiplyScalar(1.06); this.outline.geometry.dispose(); this.outline.geometry = bracketGeometry(size); b.getCenter(this.outline.position); }
        this._outlineFor = f;
      }
      this.outline.visible = true; this.outline.material.opacity = 0.65 + Math.sin(this.t * 6) * 0.25;
    } else { this.outline.visible = false; this._outlineFor = null; }
    return this.focus;
  }
  isFP(o) { const fp = this.world.fpRoot; for (let p = o; p; p = p.parent) if (p === fp) return true; return false; }
}
