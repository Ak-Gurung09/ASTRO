// ASTRO LAB Career — Training 4: Weightless Handrail Course. Inside a station-module mock-up, a harness system takes your weight,
// so you float. Move only by grabbing handrails and pushing off: aim, push gently, glide through the rings, catch the next rail.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { makeSign } from '../models/props.js';
import { std, box, cyl } from '../models/house.js';
import { Floater } from '../engine/float.js';
import { trainingRoom, timer, finishExercise } from './kit.js';

const RAILS = [
  [[-1.55, 1.3, 7.4], [-1.55, 1.3, 6.4]],
  [[1.55, 2.0, 2.9], [1.55, 2.0, 1.9]],
  [[-0.5, 0.3, -1.2], [0.5, 0.3, -1.2]],
  [[-1.55, 2.3, -4.4], [-1.55, 2.3, -5.4]],
  [[-0.55, 1.6, -8.25], [0.55, 1.6, -8.25]]
];
const RINGS = [[0, 1.6, 4.5], [0.5, 1.3, 0.6], [-0.4, 1.4, -3], [-0.2, 1.8, -6.6]];

export default {
  id: 'lowg', title: 'Weightless Handrail Course', music: 'centre', ambience: 'vent',
  steps: [
    { id: 'brief', text: 'Listen to the briefing from Coach Lindqvist' },
    { id: 'rings', text: 'Float through rings 1 to 4 in order' },
    { id: 'dock', text: 'Catch the handrail at the hatch, gently (under 0.5 m/s)' }
  ],
  initialState: { steps: {}, mistakes: [], next: 0 },

  async build(ctx) {
    const { scene, ix, hud, sfx, state, player } = ctx;
    trainingRoom(ctx, { w: 3.4, d: 17, hgt: 3.4, title: 'ZERO-G MODULE', sub: 'Handrails only · push gently', light: 0.9 });
    // module look: ribs, racks, a hatch at each end
    const rib = MAT.metal(0xb8bec8);
    for (let z = -8; z <= 8; z += 2) { box(3.4, 0.08, 0.08, rib, 0, 3.36, z, scene); box(0.08, 3.4, 0.08, rib, -1.66, 1.7, z, scene); box(0.08, 3.4, 0.08, rib, 1.66, 1.7, z, scene); }
    for (let z = -6; z <= 6; z += 4) for (const s of [-1, 1]) { const r = new THREE.Group(); box(0.08, 1.6, 1.8, std(0xe8ebf0, { roughness: 0.6 }), 0, 0, 0, r); for (let i = 0; i < 4; i++) box(0.02, 0.3, 0.4, std([0x2b6ad8, 0x3fe0a0, 0xffc857, 0xc8202a][i]), s * -0.05, -0.5 + i * 0.35, -0.5 + (i % 2) * 0.8, r); r.position.set(s * 1.64, 1.7, z + 1); scene.add(r); }
    const hatch = new THREE.Group(); cyl(0.7, 0.7, 0.08, MAT.metal(0x9aa3b2), 0, 0, 0, hatch, 32).rotation.x = Math.PI / 2; cyl(0.5, 0.5, 0.1, std(0x3a3f4a), 0, 0, 0.02, hatch, 32).rotation.x = Math.PI / 2; hatch.position.set(0, 1.6, -8.46); scene.add(hatch);
    const T = timer(ctx, 240);
    const F = new Floater(ctx, { bounds: [-1.7, 1.7, 0, 3.4, -8.5, 8.5], start: [-1.0, 1.4, 6.9], yaw: 0, bumpLimit: 1.1 * ctx.diff.tolerance,
      onBump: v => ctx.mistake(`Hit the module wall at ${v.toFixed(1)} m/s.`) });
    const rails = RAILS.map(([a, b], i) => F.addRail(a, b, { label: i === RAILS.length - 1 ? 'Hatch handrail' : 'Handrail' }));
    F.grab(F.rails[0]);
    const rings = RINGS.map((p, i) => {
      const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 10, 40), MAT.glow(0xffc857, 0.6)); g.add(t);
      const n = makeSign(String(i + 1), '', 0.4); n.position.y = 0.72; g.add(n); g.position.set(...p); scene.add(g); return g;
    });
    const paint = () => rings.forEach((r, i) => { const c = i < state.next ? 0x3fe0a0 : i === state.next ? 0xffc857 : 0x6a7080; r.children[0].material.color.set(c); r.children[0].material.emissive.set(c); });
    paint();
    let warned = {};
    F.onGrab = (rail, hit) => {
      if (rail !== F.rails[RAILS.length - 1] || !ctx.isDone('brief')) return;
      if (!ctx.isDone('rings')) { hud.flash(`Go back for ring ${state.next + 1} first.`, 'bad'); return; }
      if (hit > 0.5 * ctx.diff.tolerance) { ctx.mistake(`Caught the hatch handrail too fast (${hit.toFixed(1)} m/s).`); hud.flash(`Ouch: ${hit.toFixed(1)} m/s. On a real station that could hurt you or damage the hatch.`, 'bad'); }
      ctx.done('dock'); finish();
    };
    const brief = () => ctx.talk([
      { who: 'Coach Lindqvist (radio)', text: 'Welcome to the zero-g module, {name}. The harness above you takes all your weight, so in here you float just like on the space station.' },
      { who: 'Coach Lindqvist (radio)', text: 'You can\'t walk or swim through air. To move: look where you want to go, then push off the handrail (W, or push the stick forward). Hold Shift for a hard push, but I don\'t recommend it.' },
      { who: 'Coach Lindqvist (radio)', text: 'Once you push, you keep drifting at the same speed until you hit something. Grab the next rail with E before you reach the wall. Float through the four rings in order and catch the hatch rail gently.' },
      { who: 'Coach Lindqvist (radio)', text: 'If you ever stop in mid-air, press E to tug your safety tether. Ready? Push off when you like.', do: () => { if (ctx.done('brief')) T.start(); } }]);
    return {
      spawn: [-1.0, 6.9, 0, 0], floater: F,
      markerFor: id => ({ rings: rings[Math.min(state.next, 3)], dock: rails[RAILS.length - 1] }[id] || null),
      onEnter: () => { if (!ctx.isDone('brief')) brief(); else T.start(); },
      onUse: () => { if (!F.reel() && !F.rail) hud.flash('Grab a handrail: look at it and press E when it is in reach.', '', 2500); },
      update(dt, blocked) {
        F.enabled = ctx.isDone('brief') && !ctx.isDone('dock');
        F.update(dt, blocked); T.update(dt, blocked);
        if (!blocked) hud.setReadout('Body', [['Speed', `${F.speed.toFixed(2)} m/s`, F.speed > F.bumpLimit ? 'bad' : F.speed > 0.5 ? 'warn' : 'good'], ['Holding', F.rail ? 'handrail' : 'nothing', F.rail ? 'good' : ''], F.rail ? ['Push off', 'W / stick ▲', ''] : ['Grab', 'aim + E', '']]);
        if (ctx.isDone('rings')) return;
        RINGS.forEach((p, i) => {
          const d = F.pos.distanceTo(new THREE.Vector3(...p)); if (d > 0.5) return;
          if (i === state.next) { state.next++; sfx.good(); hud.cap(`[Ring ${i + 1} ✓]`, 1500); paint(); if (state.next === RINGS.length) { ctx.done('rings'); hud.flash('All rings done! Catch the hatch handrail, gently.', 'good'); } ctx.refreshObjectives(); }
          else if (i > state.next && !warned[i]) { warned[i] = true; ctx.mistake(`Flew through ring ${i + 1} before ring ${state.next + 1}.`); hud.flash(`Wrong ring: ${state.next + 1} comes first.`, 'bad'); }
        });
      },
    };
    function finish() {
      F.enabled = false;
      finishExercise(ctx, { id: 'lowg', title: 'Weightless Handrail Course', timer: T, xp: 140, bonus: F.bumps ? 0 : 5,
        science: 'In orbit, astronauts and everything around them are falling around the Earth together, so nothing presses down and everything floats. Newton\'s first law takes over: once you push off, you glide at the same speed until something stops you. That is why the space station is covered in handrails and why astronauts learn to push off with a finger, not a leg. On Earth, astronauts practise with parabolic flights, virtual reality and harness systems that take their weight.' });
    }
  }
};
