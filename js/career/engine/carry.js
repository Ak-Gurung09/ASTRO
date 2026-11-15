// ASTRO LAB Career — pick up, carry, rotate, place (on surfaces or into sockets), drop, throw, stow in the backpack, and recover lost items.
//
// Pickup categories (see docs/RENDER-LAYERS.md, "Interaction"):
//   Pickable  - tools, small equipment, food, medical items, documents, small parts, containers: makeCarriable(), or tag a model
//               with userData.portable = 'Name' and the runtime makes it carriable automatically.
//   Fixed     - walls, floors, furniture, machinery, vehicles, terminals: never carriable (they may still be usable).
//
// Carriable: makeCarriable(obj, { id, name, weight?, hold?: { rot:[x,y,z], dist }, critical?, stow?, onPick?, onDrop? })
// Socket:    makeSocket(obj, { accepts: id | (item)=>bool, label, check?(item, rotSteps) -> { ok, msg }, onPlace(item), offset?, lock? })
import * as THREE from '../../../vendor/three.module.js';
import { makeUsable } from './interact.js';
import { sfx } from './audio.js';
import { RO } from './layers.js';

const _b = new THREE.Box3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), DOWN = new THREE.Vector3(0, -1, 0);
const STOW_MAX = 4, _t = new THREE.Box3();
// World bounding box of the visible parts of an object (ignores invisible hit boxes)
export function boxOf(obj, out = new THREE.Box3()) {
  out.makeEmpty(); obj.updateWorldMatrix(true, true);
  obj.traverse(o => {
    if (!o.isMesh || o.userData.hitbox) return; if ([].concat(o.material).every(m => m.visible === false)) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _t.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); out.union(_t);
  });
  return out;
}

export class Carry {
  constructor(world, player, interactor, hud) {
    this.world = world; this.player = player; this.ix = interactor; this.hud = hud;
    this._held = null; this.rot = 0; this.rotSteps = 0; this.sockets = []; this.items = []; this.stowed = []; this.flying = [];
    this.hold = new THREE.Group(); this.hold.position.set(0.2, -0.3, -0.62); world.fpRoot.add(this.hold);
    this.spin = new THREE.Group(); this.hold.add(this.spin);
    this.ray = new THREE.Raycaster(); this.hands = null; this.recT = 0; this.gravity = 9.8;
  }
  get held() { return this._held; }
  set held(v) { // scenes may set held = null after consuming the item (e.g. handing a kit to a crewmate)
    if (!v && this._held) { const o = this._held; this._held = null; if (o.parent === this.spin) { this.world.scene.attach(o); o.visible = false; } this.restore(o); }
    else this._held = v;
  }
  makeCarriable(obj, opts) {
    obj.userData.carry = Object.assign({ critical: true, stow: true }, opts);
    makeUsable(obj, { label: opts.name, verb: 'Pick up', use: () => this.pick(obj), enabled: () => !this._held && !obj.userData.locked, range: 2.3 });
    this.ix.add(obj);
    // remember where it started, so a lost item can always be brought back
    obj.updateMatrixWorld(true);
    obj.userData.home = { parent: obj.parent, pos: obj.position.clone(), rot: obj.rotation.clone() };
    this.items.push(obj);
    // tiny items get a slightly larger invisible hit box so they are easy to aim at
    boxOf(obj, _b); const sz = _b.getSize(_v);
    if (!_b.isEmpty() && Math.max(sz.x, sz.y, sz.z) < 0.18) {
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), new THREE.MeshBasicMaterial({ visible: false })); hb.userData.hitbox = true;
      obj.add(hb); hb.position.copy(obj.worldToLocal(_b.getCenter(new THREE.Vector3())));
    }
    return obj;
  }
  makeSocket(obj, opts) {
    obj.userData.socket = opts; this.sockets.push(obj);
    makeUsable(obj, { label: opts.label, verb: 'Place here', use: () => this.place(obj), enabled: () => !!this._held && !obj.userData.filled && this.accepts(obj, this._held), range: 2.6 });
    this.ix.add(obj);
    return obj;
  }
  accepts(sock, item) { const a = sock.userData.socket.accepts; return typeof a === 'function' ? a(item) : a === item.userData.carry.id; }
  size(obj) { return boxOf(obj, _b).getSize(new THREE.Vector3()); }

  pick(obj) {
    if (this._held || obj.userData.locked) return;
    const C = obj.userData.carry;
    const startW = obj.parent && obj.visible ? boxOf(obj, _b).getCenter(new THREE.Vector3()) : null;
    // keep the object's facing relative to the player, snapped to quarter turns
    obj.getWorldQuaternion(_q); const objYaw = new THREE.Euler().setFromQuaternion(_q, 'YXZ').y;
    const steps = Math.round((objYaw - this.player.yaw) / (Math.PI / 2));
    this._held = obj; this.rotSteps = ((steps % 4) + 4) % 4; this.rot = this.rotSteps * Math.PI / 2;
    obj.userData.homeRot = obj.rotation.y;
    if (obj.userData.collider) obj.userData.collider.on = false;
    if (obj.userData.inSocket) { const so = obj.userData.inSocket; so.userData.filled = null; if (so.userData.ghost) so.userData.ghost.visible = true; obj.userData.inSocket = null; }
    this.flying = this.flying.filter(f => f.obj !== obj);
    // hold pose: centre the item in front of the hand, at the chosen tilt; big items sit further away and lower
    const hr = C.hold?.rot || [0, 0, 0];
    const tmp = new THREE.Group(); tmp.add(obj); obj.position.set(0, 0, 0); obj.rotation.set(hr[0], hr[1], hr[2]); obj.scale.copy(obj.userData.baseScale || obj.scale); obj.userData.baseScale = obj.scale.clone();
    const bb = boxOf(obj, new THREE.Box3()), s = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3()); tmp.remove(obj);
    const big = C.hold?.big ?? (Math.max(s.x, s.z) > 0.42 || s.y > 0.6);
    const dist = C.hold?.dist ?? Math.min(0.4, Math.max(0, Math.max(s.x, s.z) * 0.5 - 0.1));
    this.hold.position.set(big ? 0 : 0.16, big ? -0.2 - Math.min(0.08, s.y * 0.1) : -0.24 - Math.min(0.1, s.y * 0.15), -0.58 - dist);
    if (C.hold?.pos) this.hold.position.set(...C.hold.pos);
    obj.position.copy(c).negate();
    this.spin.add(obj); this.spin.rotation.set(0, this.rot, 0); this.heldBig = big; this.heldHalf = Math.max(s.x, s.z) / 2; this.heldH = s.y;
    // smooth attach: start the carry pivot where the object was and slide it into the hand
    this.world.syncFP(); this.hold.updateMatrixWorld(true);
    if (startW) this.spin.position.copy(this.hold.worldToLocal(startW)).clampLength(0, 1.5); else this.spin.position.set(0, 0, 0);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = false; if (o.userData._ro == null) o.userData._ro = o.renderOrder; o.renderOrder = RO.HELD; } });
    this.hands?.grab();
    sfx.pickup(); C.onPick?.(obj);
  }
  restore(obj) { obj.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.userData._ro != null) { o.renderOrder = o.userData._ro; delete o.userData._ro; } } }); }
  rotate(dir = 1) { if (!this._held) return; this.rotSteps = (this.rotSteps + dir + 4) % 4; sfx.ui(); }

  // Put the held item into a socket: checked, snapped and confirmed
  place(sock) {
    const item = this._held; if (!item) return;
    const S = sock.userData.socket;
    const res = S.check ? S.check(item, this.rotSteps) : { ok: true };
    if (!res.ok) { sfx.wrong(); this.hud.flash(res.msg || 'That doesn\'t fit there.', 'bad'); S.onMistake?.(res.msg); return; }
    this.release(item);
    const p = new THREE.Vector3(); sock.getWorldPosition(p);
    item.position.copy(p).add(S.offset || new THREE.Vector3());
    item.rotation.set(0, sock.rotation.y + this.rotSteps * Math.PI / 2, 0);
    sock.userData.filled = item; item.userData.inSocket = sock;
    if (S.lock) item.userData.locked = true;
    if (sock.userData.ghost) sock.userData.ghost.visible = false;
    this.snapFx(item);
    sfx.place(); S.onPlace?.(item, this.rotSteps);
  }
  // Take the item out of the hand into the world scene (no position yet)
  release(item) {
    this.world.syncFP(); this._held = null; this.world.scene.attach(item); this.restore(item); this.hands?.release();
  }
  // Short scale pulse = visual confirmation that something snapped into place
  snapFx(item) { const s0 = item.scale.clone(); let t = 0; const fn = dt => { t += dt; const k = 1 + Math.sin(Math.min(1, t / 0.25) * Math.PI) * 0.08; item.scale.copy(s0).multiplyScalar(k); if (t >= 0.25) { item.scale.copy(s0); this.world.updaters.delete(fn); } }; this.world.updaters.add(fn); }

  // Solid meshes (for "what surface is under this point")
  surfaces(exclude) {
    const out = []; this.world.scene.traverse(o => {
      if (!o.isMesh || o.userData.noBlock || o.userData.hitbox) return;
      for (let p = o; p; p = p.parent) { if (p.visible === false || p === exclude) return; }
      const ms = [].concat(o.material); if (ms.some(m => m.visible === false || m.depthTest === false || (m.transparent && m.opacity < 0.5))) return;
      out.push(o);
    }); return out;
  }
  // Highest supporting surface under (x, z), below `maxY`, or the walkable floor
  supportY(x, z, maxY, exclude, list) {
    this.ray.set(new THREE.Vector3(x, maxY, z), DOWN); this.ray.far = maxY + 5;
    const hits = this.ray.intersectObjects(list || this.surfaces(exclude), false);
    const floor = this.player.floorAt(x, z, this.player.pos.y);
    for (const h of hits) { const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : null; if (n && n.y > 0.6) return Math.max(h.point.y, floor); }
    return floor;
  }
  blockedAt(x, z, r, y0, y1) {
    for (const c of this.player.colliders) { if (!c.on || c.y1 <= y0 || c.y0 >= y1) continue; if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return true; }
    return false;
  }
  // Does the straight line from the player to (x, z) cross a collider?
  pathBlocked(x, z, y) {
    const p = this.player.pos, n = 8;
    for (let i = 1; i <= n; i++) { const t = i / n, px = p.x + (x - p.x) * t, pz = p.z + (z - p.z) * t; if (this.blockedAt(px, pz, 0.02, y, y + 0.1)) return true; }
    return false;
  }
  // Rest the item so its lowest point touches the surface
  settle(item, x, z, sy) {
    item.position.set(x, sy, z); item.updateMatrixWorld(true);
    const s = this.size(item); boxOf(item, _b); item.position.y += sy - _b.min.y + 0.002;
    // keep it inside its own footprint centre
    const cx = (_b.min.x + _b.max.x) / 2, cz = (_b.min.z + _b.max.z) / 2; item.position.x += x - cx; item.position.z += z - cz;
    if (item.userData.collider) { const c = item.userData.collider, hw = Math.max(0.05, s.x / 2), hd = Math.max(0.05, s.z / 2); Object.assign(c, { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, on: true }); }
  }
  // Find a valid spot: where you aim (a table or the floor), else in front of you, else beside you, else at your feet
  safeSpot(item) {
    const s = this.size(item), r = Math.min(0.4, Math.max(s.x, s.z) / 2), head = this.player.pos.y + this.player.eye;
    const list = this.surfaces(item);
    // 1. aimed point on a horizontal surface in reach
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.world.camera); this.ray.far = 2.4;
    for (const h of this.ray.intersectObjects(list, false)) {
      const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : null;
      if (!n || n.y < 0.6) break; // first thing hit is a wall: fall back
      const { x, z } = h.point; if (h.point.y > head - 0.2) break;
      if (!this.blockedAt(x, z, r * 0.6, h.point.y + 0.05, h.point.y + s.y + 0.05) && !this.pathBlocked(x, z, Math.min(h.point.y + 0.1, head - 0.3))) return { x, z, y: h.point.y };
      break;
    }
    // 2. in front, then to the sides, then at the feet
    const f = this.player.forward(), rt = new THREE.Vector3(-f.z, 0, f.x), P = this.player.pos;
    const tries = [[0.8, 0], [0.6, 0], [0.45, 0], [0.6, 0.4], [0.6, -0.4], [0.3, 0.45], [0.3, -0.45], [-0.5, 0], [0, 0]];
    for (const [a, b] of tries) {
      const x = P.x + f.x * a + rt.x * b, z = P.z + f.z * a + rt.z * b;
      const y = this.supportY(x, z, Math.min(head, P.y + 1.3), item, list);
      if (y > P.y + 1.3) continue;
      if (this.blockedAt(x, z, r, y + 0.03, y + Math.max(0.1, s.y)) && !(a === 0 && b === 0)) continue;
      if (this.pathBlocked(x, z, Math.max(P.y + 0.3, y + 0.1)) && !(a === 0 && b === 0)) continue;
      return { x, z, y };
    }
    return { x: P.x, z: P.z, y: this.player.floorAt(P.x, P.z, P.y) };
  }
  drop() {
    const item = this._held; if (!item) return;
    const spot = this.safeSpot(item);
    this.release(item); this.hands?.drop();
    item.rotation.set(0, this.player.yaw + this.rotSteps * Math.PI / 2, 0);
    this.settle(item, spot.x, spot.z, spot.y);
    sfx.place(); item.userData.carry.onDrop?.(item);
  }
  // Gentle under-arm throw: flies, bounces off walls, lands on the first surface below it
  throw() {
    const item = this._held; if (!item) return;
    this.world.syncFP(); const start = boxOf(item, _b).getCenter(new THREE.Vector3());
    this.release(item); this.hands?.drop();
    const f = new THREE.Vector3(); this.world.camera.getWorldDirection(f);
    const vel = f.multiplyScalar(4.2).add(new THREE.Vector3(0, 1.4, 0));
    item.position.add(new THREE.Vector3().subVectors(start, boxOf(item, _b).getCenter(_v)));
    item.rotation.set(0, this.player.yaw, 0);
    this.flying.push({ obj: item, vel, t: 0, list: this.surfaces(item) });
    sfx.ui(); this.hud.cap('[Whoosh]', 900);
  }
  // Backpack: I / Tab puts the held item away, or takes the last one back out
  stow() {
    if (this._held) {
      const item = this._held; if (!item.userData.carry.stow) { this.hud.flash(`The ${item.userData.carry.name.toLowerCase()} is too big for your backpack.`, '', 2200); return; }
      if (this.stowed.length >= STOW_MAX) { this.hud.flash('Your backpack is full.', 'bad', 2000); return; }
      this.release(item); item.visible = false; item.position.set(0, -50, 0); this.stowed.push(item); this.hands?.release();
      sfx.pickup(); this.hud.flash(`🎒 ${item.userData.carry.name} put in your backpack (${this.stowed.length}/${STOW_MAX}). Press I to take it out.`, '', 2600);
    } else if (this.stowed.length) {
      const item = this.stowed.pop(); item.visible = true; this.pick(item);
    } else this.hud.flash('Your backpack is empty.', '', 1600);
  }
  // Bring a lost item back to where it started
  recover(item, why = 'was out of reach') {
    const H = item.userData.home; if (!H) return;
    if (this._held === item) return;
    (H.parent || this.world.scene).add(item); item.position.copy(H.pos); item.rotation.copy(H.rot); item.visible = true;
    this.flying = this.flying.filter(f => f.obj !== item);
    if (item.userData.collider) { item.updateMatrixWorld(true); const s = this.size(item); const x = item.position.x, z = item.position.z; Object.assign(item.userData.collider, { x0: x - s.x / 2, x1: x + s.x / 2, z0: z - s.z / 2, z1: z + s.z / 2, on: true }); }
    this.hud.flash(`${item.userData.carry.name} ${why}, so it was returned to its starting place.`, '', 3200);
  }
  update(dt) {
    // held: turn to the chosen quarter-turn, and slide into the hand after pick-up
    if (this._held) {
      const target = this.rotSteps * Math.PI / 2;
      let d = target - this.rot; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this.rot += d * Math.min(1, dt * 12); this.spin.rotation.y = this.rot;
      this.spin.position.multiplyScalar(Math.max(0, 1 - dt * 14));
    }
    // thrown items
    for (const f of [...this.flying]) {
      const o = f.obj; f.t += dt; f.vel.y -= this.gravity * dt;
      const nx = o.position.x + f.vel.x * dt, nz = o.position.z + f.vel.z * dt;
      if (this.blockedAt(nx, nz, 0.12, o.position.y - 0.1, o.position.y + 0.2)) { f.vel.x *= -0.3; f.vel.z *= -0.3; sfx.place(); } else { o.position.x = nx; o.position.z = nz; }
      o.position.y += f.vel.y * dt; o.updateMatrixWorld(true);
      const ground = this.supportY(o.position.x, o.position.z, o.position.y + 0.3, o, f.list);
      if ((boxOf(o, _b).min.y <= ground && f.vel.y < 0) || f.t > 4) { this.flying.splice(this.flying.indexOf(f), 1); this.settle(o, o.position.x, o.position.z, ground); sfx.place(); o.userData.carry.onDrop?.(o); }
    }
    // recovery check, twice a second: fell through the world, stuck inside something, or flew off
    this.recT -= dt; if (this.recT > 0) return; this.recT = 0.5;
    for (const o of this.items) {
      if (o === this._held || o.userData.locked || o.userData.inSocket || !o.parent || this.stowed.includes(o) || this.flying.some(f => f.obj === o) || !o.visible) continue;
      if (o.userData.carry.critical === false) continue;
      const p = o.getWorldPosition(_v), floor = this.player.floorAt(p.x, p.z, p.y);
      if (p.y < floor - 0.6 || p.y < -20 || p.y > 60 || !isFinite(p.x)) this.recover(o, 'fell out of the world');
    }
  }
}
