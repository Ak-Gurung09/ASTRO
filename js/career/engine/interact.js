// ASTRO LAB Career — what the player is looking at, the "E / tap to use" prompt, and objective markers.
import * as THREE from '../../../vendor/three.module.js';

// Any Object3D becomes usable with makeUsable(obj, { label, verb, use, enabled?, range? }).
export function makeUsable(obj, it) { obj.userData.it = Object.assign({ verb: 'Use', range: 2.4, enabled: () => true }, it); obj.userData.it.obj = obj; return obj; }

export class Interactor {
  constructor(world, player) {
    this.world = world; this.player = player; this.ray = new THREE.Raycaster(); this.ray.far = 3.2;
    this.targets = []; this.focus = null; this.blockers = [];
    // A floating chevron over the current objective target
    const g = new THREE.ConeGeometry(0.09, 0.2, 4); g.rotateX(Math.PI);
    this.marker = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.9, depthTest: false }));
    this.marker.renderOrder = 10; this.marker.visible = false; world.scene.add(this.marker); this.markerFor = null; this.t = 0;
  }
  add(obj) { if (!this.targets.includes(obj)) this.targets.push(obj); return obj; }
  remove(obj) { this.targets = this.targets.filter(o => o !== obj); if (this.focus?.obj === obj) this.focus = null; }
  mark(obj) { this.markerFor = obj; }
  // Find the nearest usable object under the crosshair (or under a tap point)
  pick(ndc = new THREE.Vector2(0, 0)) {
    this.ray.setFromCamera(ndc, this.world.camera);
    const list = this.targets.filter(o => o.visible !== false && o.parent);
    const hits = this.ray.intersectObjects([...list, ...this.blockers], true);
    for (const hgt of hits) {
      let o = hgt.object; while (o && !o.userData.it && !o.userData.blocker) o = o.parent;
      if (!o) continue; if (o.userData.blocker) return null;
      const it = o.userData.it; if (hgt.distance > it.range || !it.enabled()) continue;
      return it;
    }
    return null;
  }
  update(dt) {
    this.focus = this.pick();
    this.t += dt;
    const m = this.markerFor;
    if (m && m.parent && m.visible !== false) {
      const b = new THREE.Box3().setFromObject(m); const c = b.getCenter(new THREE.Vector3());
      this.marker.position.set(c.x, b.max.y + 0.28 + Math.sin(this.t * 3) * 0.06, c.z); this.marker.rotation.y += dt * 2; this.marker.visible = true;
    } else this.marker.visible = false;
    return this.focus;
  }
}
