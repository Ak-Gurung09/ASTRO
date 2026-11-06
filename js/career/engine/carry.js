// ASTRO LAB Career — pick up, carry, rotate, place (into sockets) and drop objects.
import * as THREE from '../../../vendor/three.module.js';
import { makeUsable } from './interact.js';
import { sfx } from './audio.js';

// Carriable: makeCarriable(obj, { id, name, weight?, onPick?, onDrop? })
// Socket:    makeSocket(obj, { accepts: id | (item)=>bool, label, check?(item, rotSteps) -> { ok, msg }, onPlace(item) })
export class Carry {
  constructor(world, player, interactor, hud) {
    this.world = world; this.player = player; this.ix = interactor; this.hud = hud;
    this.held = null; this.rot = 0; this.rotSteps = 0; this.sockets = [];
    this.hold = new THREE.Group(); this.hold.position.set(0.28, -0.46, -0.95); world.camera.add(this.hold);
    this.ghost = null;
  }
  makeCarriable(obj, opts) {
    obj.userData.carry = opts;
    makeUsable(obj, { label: opts.name, verb: 'Pick up', use: () => this.pick(obj), enabled: () => !this.held && !obj.userData.locked, range: 2.2 });
    this.ix.add(obj);
    return obj;
  }
  makeSocket(obj, opts) {
    obj.userData.socket = opts; this.sockets.push(obj);
    makeUsable(obj, { label: opts.label, verb: 'Place here', use: () => this.place(obj), enabled: () => !!this.held && !obj.userData.filled && this.accepts(obj, this.held), range: 2.6 });
    this.ix.add(obj);
    return obj;
  }
  accepts(sock, item) { const a = sock.userData.socket.accepts; return typeof a === 'function' ? a(item) : a === item.userData.carry.id; }
  pick(obj) {
    if (this.held) return;
    // Keep the object's facing relative to the player, snapped to quarter turns
    const q = new THREE.Quaternion(); obj.getWorldQuaternion(q); const objYaw = new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
    const steps = Math.round((objYaw - this.player.yaw) / (Math.PI / 2));
    this.held = obj; this.rotSteps = ((steps % 4) + 4) % 4; this.rot = this.rotSteps * Math.PI / 2;
    obj.userData.homeRot = obj.rotation.y;
    if (obj.userData.collider) obj.userData.collider.on = false;
    if (obj.userData.inSocket) { obj.userData.inSocket.userData.filled = null; obj.userData.inSocket = null; }
    this.hold.add(obj); obj.position.set(0, 0, 0); obj.rotation.set(0, this.rot, 0);
    obj.traverse(o => { if (o.isMesh) o.castShadow = false; });
    sfx.pickup(); obj.userData.carry.onPick?.(obj);
  }
  rotate(dir = 1) { if (!this.held) return; this.rotSteps = (this.rotSteps + dir + 4) % 4; sfx.ui(); }
  place(sock) {
    const item = this.held; if (!item) return;
    const S = sock.userData.socket;
    const res = S.check ? S.check(item, this.rotSteps) : { ok: true };
    if (!res.ok) { sfx.wrong(); this.hud.flash(res.msg || 'That doesn\'t fit there.', 'bad'); S.onMistake?.(res.msg); return; }
    this.held = null; this.world.scene.attach(item);
    const p = new THREE.Vector3(); sock.getWorldPosition(p);
    item.position.copy(p).add(S.offset || new THREE.Vector3());
    item.rotation.set(0, sock.rotation.y + this.rotSteps * Math.PI / 2, 0);
    item.traverse(o => { if (o.isMesh) o.castShadow = true; });
    sock.userData.filled = item; item.userData.inSocket = sock;
    if (S.lock) item.userData.locked = true;
    if (sock.userData.ghost) sock.userData.ghost.visible = false;
    sfx.place(); S.onPlace?.(item, this.rotSteps);
  }
  drop() {
    const item = this.held; if (!item) return;
    const f = this.player.forward(); const x = this.player.pos.x + f.x * 0.75, z = this.player.pos.z + f.z * 0.75;
    this.held = null; this.world.scene.attach(item);
    item.position.set(x, this.player.floorAt(x, z, this.player.pos.y) + (item.userData.carry.restY || 0), z);
    item.rotation.set(0, this.player.yaw + this.rotSteps * Math.PI / 2, 0);
    item.traverse(o => { if (o.isMesh) o.castShadow = true; });
    if (item.userData.collider) { const c = item.userData.collider, hw = (c.x1 - c.x0) / 2, hd = (c.z1 - c.z0) / 2; Object.assign(c, { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, on: true }); }
    sfx.place(); item.userData.carry.onDrop?.(item);
  }
  update(dt) {
    if (!this.held) return;
    const target = this.rotSteps * Math.PI / 2;
    let d = target - this.rot; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    this.rot += d * Math.min(1, dt * 12); this.held.rotation.y = this.rot;
  }
}
