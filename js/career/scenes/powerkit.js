// ASTRO LAB Career — shared power-system gameplay for the Power Lab (training) and the Lunar Outpost Power mission:
// plugging cables socket to socket (with the wiring rules explaining every refused connection), the training refresher,
// and the shadow test that both scenes end with.
import * as THREE from '../../../vendor/three.module.js';
import { h } from '../../ui/dom.js';
import { makeUsable } from '../engine/interact.js';
import { makeCable } from '../models/power.js';
import { readDoc } from '../ui/panels.js';

// sockets: [{ id, kind, owner?, obj (socket group), label }]. Saved cables (pairs of ids) are restored.
// opts: { enabled(), onConnect(status, cable), onRefuse(why), saved: [[a, b], …] }
export function cablePlugs(ctx, wiring, sockets, { enabled = () => true, onConnect, onRefuse, saved = [] } = {}) {
  const { scene, ix, hud, sfx } = ctx;
  let pending = null; const meshes = [];
  const byId = Object.fromEntries(sockets.map(s => [s.id, s]));
  const wp = s => s.obj.getWorldPosition(new THREE.Vector3());
  const glow = (s, on) => { const r = s.obj.userData.ring; r.scale.setScalar(on ? 1.6 : 1); r.material.emissiveIntensity = on ? 2.2 : 0.8; };
  const draw = cable => { const m = makeCable(wp(byId[cable.a]), wp(byId[cable.b])); scene.add(m); meshes.push(m); };
  for (const s of sockets) {
    makeUsable(s.obj, { label: s.label, range: 2.6, enabled, verb: () => pending ? (pending === s ? 'Cancel the cable at' : 'Plug the cable into') : 'Start a cable at',
      use: () => {
        if (!pending) { pending = s; glow(s, true); sfx.click?.(); hud.flash(`Cable from ${s.label}. Now plug the other end into the right socket.`, '', 3500); return; }
        if (pending === s) { glow(s, false); pending = null; hud.flash('Cable put away.', '', 1500); return; }
        const a = pending; glow(a, false); pending = null;
        const r = wiring.connect(a.id, s.id);
        if (!r.ok) { sfx.wrong(); hud.flash(r.why, 'bad', 6000); onRefuse?.(r.why, a, s); return; }
        draw(r.cable); sfx.good(); onConnect?.(wiring.status(), r.cable);
      } });
    ix.add(s.obj);
  }
  // verb may be a function: interact.js shows it as text, so give it a getter
  for (const s of sockets) { const it = s.obj.userData.it; const v = it.verb; Object.defineProperty(it, 'verb', { get: () => (typeof v === 'function' ? v() : v), configurable: true }); }
  scene.updateMatrixWorld(true);
  for (const [a, b] of saved) { const r = wiring.connect(a, b); if (r.ok) draw(r.cable); }
  return { get pending() { return pending; }, cables: () => wiring.cables.map(c => [c.a, c.b]), meshes };
}

// The 60-second recap of the Power Lab, available from the mission's panel ("Review training")
export function powerRefresher() {
  return readDoc({ title: '📘 Power Lab: what you learned', confirm: 'Back to the panel ▸', wide: true, body: h('div', {},
    h('ol', {},
      h('li', {}, 'Panels go into the charge controller\'s PV input, never straight to the battery or the machines.'),
      h('li', {}, 'The controller charges the battery (BATT) and feeds the machines (LOAD out to the bus).'),
      h('li', {}, 'kW is how fast power is used right now; kWh is how much energy is stored. A 20 kWh battery runs 4 kW of machines for about 5 hours.'),
      h('li', {}, 'In shadow, only the battery powers the habitat. Switch off what you don\'t need: science, rover charging, greenhouse lights, extra cabin lights.'),
      h('li', {}, 'Keep the battery above 20%. Below that it ages fast and you have no margin left.'),
      h('li', {}, 'Life support comes first: CO2 scrubber, O2 generator, heaters, then the water recycler.'),
      h('li', {}, 'Before replacing a fuse, switch that circuit off.')),
    h('p', { class: 'muted' }, 'This is the same panel you used on the test stand.')) });
}

// Shadow test: sun fades out, the sim runs `hours` of game time over `seconds` of real time, then judges the result.
// Returns a controller: start(), update(dt, blocked) -> 'running' | 'pass' | 'fail' | null, result
export function shadowTest(sim, { hours = 3, seconds = 45, onSun } = {}) {
  const T = { running: false, t: 0, result: null,
    start() { this.running = true; this.t = 0; this.result = null; sim.min.socPct = sim.socPct; sim.lifeOutH = 0; },
    update(dt, blocked) {
      if (!this.running || blocked) return this.running ? 'running' : null;
      this.t += dt; const k = this.t / seconds;
      const sun = k < 0.06 ? 1 - k / 0.06 : k > 0.96 ? (k - 0.96) / 0.04 : 0; sim.sun = Math.max(0, Math.min(1, sun)); onSun?.(sim.sun);
      sim.tick(dt * hours / seconds);
      if (k >= 1) {
        this.running = false; sim.sun = 1; onSun?.(1);
        const pass = sim.min.socPct >= 20 && sim.lifeOutH < 0.02;
        this.result = { pass, minSoc: sim.min.socPct, lifeOutH: sim.lifeOutH };
        return pass ? 'pass' : 'fail';
      }
      return 'running';
    } };
  return T;
}
