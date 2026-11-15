// ASTRO LAB Career — step-by-step assembly (spec 11B). Parts lie on a workbench; each one is picked up by hand and installed in
// its own slot on a chassis. Every slot shows a see-through "ghost" of the part it needs, rejects the wrong part with a message,
// snaps the right part into place with a confirmation pulse and sound, and the HUD shows the progress. Installed parts are locked
// (no duplicates, no floating, no losing them) and restored after a reload from state[key].
//
// makeAssembly(ctx, {
//   key, title, chassis: Group (already positioned in the scene), bench: [x, z, rotY],
//   parts: [{ id, name, make: () => Group, slot: [x, y, z] in chassis space }], decoys?: [{ id, name, make, why }],
//   active: () => bool, onPart?(part, n, total), onDone?()
// }) -> { update(dt), done(), parts, sockets, bench, reset() }
import * as THREE from '../../../vendor/three.module.js';
import { std, box, cyl } from '../models/house.js';
import { MAT } from '../models/materials.js';
import { RO } from '../engine/layers.js';
import { boxOf } from '../engine/carry.js';

const ghostMat = () => new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0.22, depthWrite: false });
export function workbench(w = 1.8, d = 0.7) {
  const g = new THREE.Group(), top = std(0x8a6a48, { roughness: 0.8 }), leg = MAT.metal(0x6a707a);
  box(w, 0.05, d, top, 0, 0.88, 0, g); box(w - 0.1, 0.03, d - 0.1, std(0x5a5f6a), 0, 0.3, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.03, 0.03, 0.88, leg, sx * (w / 2 - 0.06), 0.44, sz * (d / 2 - 0.06), g, 8);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function makeAssembly(ctx, opt) {
  const { scene, carry, hud, sfx, state, player } = ctx;
  const S = state[opt.key] || (state[opt.key] = []);
  const ch = opt.chassis; ch.updateMatrixWorld(true);
  const all = [...opt.parts, ...(opt.decoys || [])];
  const prefix = `asm-${opt.key}-`;
  // workbench with the parts laid out in a row
  const [bx, bz, br = 0] = opt.bench;
  const bench = workbench(Math.max(1.4, all.length * 0.42 + 0.3)); bench.position.set(bx, 0, bz); bench.rotation.y = br; scene.add(bench);
  const bw = Math.max(1.4, all.length * 0.42 + 0.3) / 2, cb = Math.cos(br), sb = Math.sin(br), bd = 0.35;
  const bbox = [[-bw, -bd], [bw, -bd], [bw, bd], [-bw, bd]].map(([x, z]) => [bx + x * cb + z * sb, bz - x * sb + z * cb]);
  const xs = bbox.map(p => p[0]), zs = bbox.map(p => p[1]);
  const benchCol = player.addBox(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), 0, 0.95);
  const items = {}, sockets = {};
  const benchSpot = i => { const lx = -bw + 0.3 + i * 0.42; return new THREE.Vector3(bx + lx * cb, 0.905, bz - lx * sb); };
  all.forEach((p, i) => {
    const o = p.make(); o.position.copy(benchSpot(i)); o.rotation.y = br; scene.add(o);
    o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    carry.makeCarriable(o, { id: prefix + p.id, name: p.name, stow: false, critical: true });
    o.userData.asmPart = p; items[p.id] = o;
  });
  // one socket per real part, with a ghost of that part showing where it goes
  for (const p of opt.parts) {
    const at = ch.localToWorld(new THREE.Vector3(...p.slot));
    const ghost = p.make(); ghost.traverse(m => { if (m.isMesh) { m.material = ghostMat(); m.renderOrder = RO.GLASS; m.castShadow = false; m.userData.noBlock = true; } });
    ghost.position.copy(at); ghost.rotation.y = ch.rotation.y; scene.add(ghost);
    const gb = boxOf(ghost, new THREE.Box3()), size = gb.getSize(new THREE.Vector3()), c = gb.getCenter(new THREE.Vector3());
    const sock = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.25, size.x + 0.1), Math.max(0.25, size.y + 0.1), Math.max(0.25, size.z + 0.1)), new THREE.MeshBasicMaterial({ visible: false }));
    sock.position.copy(c); sock.rotation.y = ch.rotation.y; sock.userData.hitbox = true; scene.add(sock); sock.userData.ghost = ghost;
    sock.userData.slotAt = at;
    carry.makeSocket(sock, {
      label: `${opt.title}: ${p.name} slot`, lock: true,
      accepts: item => (item.userData.carry?.id || '').startsWith(prefix),
      check: item => {
        if (!opt.active()) return { ok: false, msg: 'Not yet: finish the earlier steps first.' };
        const q = item.userData.asmPart;
        if (q.id === p.id) return { ok: true };
        const why = q.why ? ` ${q.why}` : '';
        return { ok: false, msg: `✗ Wrong part: that is the ${q.name}. This slot needs the ${p.name} (see the blue outline).${why}` };
      },
      onMistake: () => { if (!S.includes('!' + p.id)) { S.push('!' + p.id); ctx.mistake(`${opt.title}: tried to fit the wrong part in the ${p.name} slot.`); } },
      onPlace: item => { item.position.copy(at); item.rotation.set(0, ch.rotation.y, 0); fill(p.id); }
    });
    sockets[p.id] = sock;
  }
  const installed = () => opt.parts.filter(p => S.includes(p.id)).length;
  function fill(id, quiet = false) {
    if (!S.includes(id)) S.push(id);
    const n = installed(), total = opt.parts.length, p = opt.parts.find(x => x.id === id);
    if (!quiet) { hud.flash(`✓ ${p.name} installed (${n} of ${total}).`, 'good', 2200); opt.onPart?.(p, n, total); }
    if (n === total && !quiet) { sfx.good(); opt.onDone?.(); }
    readout();
  }
  function readout() { if (!opt.active() || installed() === opt.parts.length) return; hud.setReadout(opt.title, [['Installed', `${installed()} / ${opt.parts.length}`, ''], ...opt.parts.map(p => [p.name, S.includes(p.id) ? '✓' : '—', S.includes(p.id) ? 'good' : ''])]); }
  // restore installed parts after a reload
  for (const p of opt.parts) if (S.includes(p.id)) { const o = items[p.id], s = sockets[p.id]; o.position.copy(s.userData.slotAt); o.rotation.set(0, ch.rotation.y, 0); o.userData.locked = true; o.userData.inSocket = s; s.userData.filled = o; s.userData.ghost.visible = false; }
  let wasActive = null, rT = 0;
  return {
    items, sockets, bench, done: () => installed() === opt.parts.length, installed,
    // show the bench, parts and ghosts only while the assembly is the current job (or finished)
    update(dt) {
      const act = !!opt.active(), fin = installed() === opt.parts.length;
      if (act !== wasActive) {
        wasActive = act;
        for (const p of all) { const o = items[p.id]; if (!S.includes(p.id) && carry.held !== o) { o.visible = act; o.userData.locked = !act; } }
        for (const p of opt.parts) sockets[p.id].userData.ghost.visible = act && !S.includes(p.id);
        bench.visible = act || fin; benchCol.on = bench.visible;
        if (act) readout();
      }
      if (act && (rT -= dt) < 0) { rT = 0.5; if (player.pos.distanceTo(ch.position) < 7) readout(); }
    }
  };
}
