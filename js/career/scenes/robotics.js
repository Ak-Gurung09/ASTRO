// ASTRO LAB Career — Phase 7b: Robotic Arm. From the robotics workstation, drive a 6-joint station arm one joint at a time
// to capture a drifting cargo ship by its grapple fixture and berth it to the station port. Precision mode, camera views,
// a gripper and an emergency stop. Simplified, but it follows how real station arms are flown.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { std, box, cyl } from '../models/house.js';
import { timer, finishExercise } from './kit.js';
import { spaceBackdrop } from './space.js';
import { h } from '../../ui/dom.js';

const JOINTS = [['Base yaw', 'y', -2.6, 2.6], ['Shoulder', 'x', -2.2, 2.2], ['Elbow', 'x', -2.6, 2.6], ['Wrist pitch', 'x', -2, 2], ['Wrist yaw', 'z', -2, 2], ['Wrist roll', 'y', -3.1, 3.1]];
const START = [0.35, -0.5, 1.4, 0.4, 0, 0];

export default {
  id: 'robotics', title: 'Robotic Arm', music: 'centre', ambience: 'vent',
  steps: [
    { id: 'brief', text: 'Listen to Robotics Instructor Chen' },
    { id: 'approach', text: 'Fly the arm\'s hand to within 1 m of the cargo ship\'s grapple pin' },
    { id: 'capture', text: 'Line up (under 1 m and well aligned) and close the gripper to capture' },
    { id: 'estop', text: 'React to the emergency: press E-STOP' },
    { id: 'berth', text: 'Move the cargo ship to the station port (yellow ring) and release it' }
  ],
  initialState: { steps: {}, mistakes: [], q: null },

  async build(ctx) {
    const { scene, world, player, hud, sfx, state, input } = ctx;
    scene.background = new THREE.Color(0x000000);
    const sky = spaceBackdrop(scene, { earthPos: [10, -70, -40], earthR: 52 });
    scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x202430, 0.7));
    const tol = ctx.diff.tolerance;
    // workstation (inside the cupola-like window)
    const ws = new THREE.Group(); scene.add(ws);
    box(1.6, 0.06, 0.6, std(0x2a2d33), 0, 1.0, -0.55, ws); const frame = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.06, 8, 6), MAT.metal(0x9aa3b2)); frame.position.set(0, 1.7, -1.1); ws.add(frame);
    const inLight = new THREE.PointLight(0xfff0e0, 3, 3, 1.4); inLight.position.set(0, 1.9, 0.2); ws.add(inLight);
    // station: truss along x, a module with a berthing port, and the arm base
    const white = std(0xe8ebf0, { roughness: 0.6 }), grey = MAT.metal(0x9aa3b2);
    const truss = new THREE.Group(); for (let x = -12; x <= 12; x += 2) { box(0.08, 0.08, 1.2, grey, x, 0, 0, truss); box(0.08, 1.2, 0.08, grey, x, 0, 0.6, truss); box(0.08, 1.2, 0.08, grey, x, 0, -0.6, truss); } box(24, 0.1, 0.1, grey, 0, 0.6, 0.6, truss); box(24, 0.1, 0.1, grey, 0, -0.6, 0.6, truss); box(24, 0.1, 0.1, grey, 0, 0.6, -0.6, truss); box(24, 0.1, 0.1, grey, 0, -0.6, -0.6, truss);
    truss.position.set(0, -2.6, -7); scene.add(truss);
    const mod = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 6, 24), white); mod.rotation.z = Math.PI / 2; mod.position.set(-4, -1.0, -9); scene.add(mod);
    const PORT = new THREE.Vector3(-4, 0.62, -9); // top of the module
    const portRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 32), MAT.glow(0xffc857, 0.8)); portRing.rotation.x = Math.PI / 2; portRing.position.copy(PORT); scene.add(portRing);
    const solar = (x) => { const g = new THREE.Group(); box(3, 0.04, 9, std(0x1a2a5a, { metalness: 0.5, roughness: 0.3 }), 0, 0, 0, g); g.position.set(x, -2.6, -7); scene.add(g); }; solar(-14); solar(14);
    // the arm
    const base = new THREE.Group(); base.position.set(0, -1.9, -7); scene.add(base); cyl(0.35, 0.4, 0.4, white, 0, -0.2, 0, base, 16);
    const J = []; let parent = base; const lens = [0.5, 3.4, 3.4, 0.35, 0.35, 0.4];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group(); g.position.y = i === 0 ? 0 : lens[i - 1]; parent.add(g);
      if (i === 0) cyl(0.22, 0.22, 0.5, white, 0, 0.25, 0, g, 16);
      if (i === 1 || i === 2) { cyl(0.16, 0.16, lens[i], white, 0, lens[i] / 2, 0, g, 14); cyl(0.24, 0.24, 0.3, grey, 0, 0, 0, g, 16).rotation.z = Math.PI / 2; }
      if (i >= 3) { cyl(0.14, 0.14, lens[i], grey, 0, lens[i] / 2, 0, g, 12); }
      J.push(g); parent = g;
    }
    const ee = new THREE.Group(); ee.position.y = lens[5]; J[5].add(ee); cyl(0.2, 0.2, 0.35, std(0x3a3f4a), 0, 0.17, 0, ee, 16); const tip = new THREE.Object3D(); tip.position.y = 0.4; ee.add(tip);
    const eeCam = new THREE.Object3D(); eeCam.position.set(0.25, 0.2, 0); eeCam.rotation.x = -Math.PI / 2; ee.add(eeCam);
    if (!state.q) state.q = [...START];
    const applyQ = () => J.forEach((g, i) => { g.rotation.set(0, 0, 0); g.rotation[JOINTS[i][1]] = state.q[i]; });
    applyQ();
    // the cargo ship with its grapple pin, drifting slowly
    const cargo = new THREE.Group(); const cb = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 3.2, 20), std(0xd9dce2, { roughness: 0.5 })); cargo.add(cb);
    for (const s of [-1, 1]) box(2.4, 0.04, 1.0, std(0x1a2a5a, { metalness: 0.5 }), s * 2.3, 0, 0, cargo);
    const pin = new THREE.Group(); cyl(0.05, 0.05, 0.4, std(0xffc857), 0, 0.2, 0, pin, 8); cyl(0.25, 0.25, 0.04, std(0x2a2d33), 0, 0, 0, pin, 16); pin.position.y = 1.6; cargo.add(pin);
    const pinTip = new THREE.Object3D(); pinTip.position.y = 0.4; pin.add(pinTip);
    const cargoPort = new THREE.Object3D(); cargoPort.position.y = -1.6; cargo.add(cargoPort);
    cargo.position.set(3, 1.6, -9.5); cargo.rotation.set(0.35, 0, -0.3); scene.add(cargo);
    const drift = new THREE.Vector3(-0.004, 0.0015, 0.002).multiplyScalar(ctx.diff.drift);
    let held = false, released = false, estop = false, drill = null, sel = 1, precise = false, view = 0, collided = 0;
    // HUD controls (touch + mouse); keyboard: 1–6 joint, W/S or ↑/↓ move, P precision, V camera, C capture/release, Space E-STOP
    const hold = { v: 0 };
    const jb = JOINTS.map(([n], i) => h('button', { class: 'btn sm', onclick: () => { sel = i; draw(); } }, `${i + 1} ${n}`));
    const pm = (d, t) => h('button', { class: 'btn', onpointerdown: e => { e.preventDefault(); hold.v = d; }, onpointerup: () => { hold.v = 0; }, onpointerleave: () => { hold.v = 0; } }, t);
    const bPrec = h('button', { class: 'btn sm', onclick: () => { precise = !precise; draw(); } }, 'Precision');
    const bCam = h('button', { class: 'btn sm', onclick: () => { view = (view + 1) % 3; draw(); } }, 'Camera');
    const bGrip = h('button', { class: 'btn sm primary', onclick: () => grip() }, 'Capture');
    const bStop = h('button', { class: 'btn sm cx-estop', onclick: () => doStop() }, 'E-STOP');
    const ui = h('div', { class: 'cx-arm glass' }, h('div', { class: 'cx-arm-j' }, jb), h('div', { class: 'cx-arm-row' }, pm(-1, '−'), pm(1, '+'), bPrec, bCam, bGrip, bStop));
    document.querySelector('#screen-career').append(ui);
    const VIEWS = ['Window', 'Hand camera', 'Overview'];
    function draw() { jb.forEach((b, i) => b.classList.toggle('primary', i === sel)); bPrec.classList.toggle('primary', precise); bCam.textContent = `📷 ${VIEWS[view]}`; bGrip.textContent = held ? 'Release' : 'Capture'; bStop.classList.toggle('on', estop); }
    draw();
    const T = timer(ctx, 420);
    const wp = new THREE.Vector3(), wq = new THREE.Vector3(), up = new THREE.Vector3();
    const tipPos = () => tip.getWorldPosition(new THREE.Vector3());
    const eeAxis = () => new THREE.Vector3(0, 1, 0).applyQuaternion(ee.getWorldQuaternion(new THREE.Quaternion()));
    const pinAxis = () => new THREE.Vector3(0, 1, 0).applyQuaternion(pin.getWorldQuaternion(new THREE.Quaternion()));
    const align = () => THREE.MathUtils.radToDeg(eeAxis().angleTo(pinAxis().negate()));
    function grip() {
      if (!ctx.isDone('brief') || estop) return;
      if (!held) {
        const d = tipPos().distanceTo(pinTip.getWorldPosition(wp)), a = align();
        if (d > 1.0 * tol || a > 30 * tol) { sfx.wrong(); hud.flash(`Missed: ${d.toFixed(2)} m away, ${a.toFixed(0)}° off. Get under ${(1.0 * tol).toFixed(1)} m and ${Math.round(30 * tol)}°.`, 'bad', 3500); ctx.mistake(`Closed the gripper too early (${d.toFixed(1)} m, ${a.toFixed(0)}°).`); return; }
        held = true; ee.attach(cargo); sfx.place(); hud.cap('[Clunk: snares close around the pin]', 2000); ctx.done('capture'); hud.flash('Captured! Now bring it to the yellow port ring on the module.', 'good', 3500);
        setTimeout(() => { if (!ctx.isDone('estop')) { drill = 0; sfx.alarm(); hud.flash('⚠ An astronaut on a spacewalk is in the arm\'s path! E-STOP now!', 'bad', 4000); } }, 6000 + Math.random() * 4000);
      } else {
        const d = cargoPort.getWorldPosition(wp).distanceTo(PORT), a = THREE.MathUtils.radToDeg(new THREE.Vector3(0, -1, 0).applyQuaternion(cargo.getWorldQuaternion(new THREE.Quaternion())).angleTo(new THREE.Vector3(0, -1, 0)));
        if (d > 0.8 * tol || a > 25 * tol) { sfx.wrong(); hud.flash(`Not lined up: ${d.toFixed(2)} m from the port, ${a.toFixed(0)}° tilted.`, 'bad', 3500); ctx.mistake('Released the cargo ship before it was lined up with the port.'); return; }
        held = false; released = true; scene.attach(cargo); cargo.position.add(PORT.clone().sub(cargoPort.getWorldPosition(wp))); sfx.place(); hud.cap('[Bolts drive in: berthed]', 2000); ctx.done('berth'); finish();
      }
      draw();
    }
    function doStop() {
      estop = !estop; sfx.ui(); hud.cap(estop ? '[E-STOP: all joints braked]' : '[E-STOP released]', 1500); draw();
      if (estop && drill != null) { const t = drill; drill = null; if (t > 5) ctx.mistake(`Took ${t.toFixed(1)} s to hit E-STOP.`); ctx.done('estop'); hud.flash(`Stopped in ${t.toFixed(1)} s. The astronaut is safe. Release E-STOP to continue.`, 'good', 4000); }
    }
    // view: the seat camera, or the hand / overview cameras
    player.seat = { pos: new THREE.Vector3(0, 1.6, 0.2), yaw: 0, yawRange: 1.3, pitchMin: -0.9, pitchMax: 0.9, roll: 0 };
    const keys = {}; const edge = k => { const d = input.keys.has(k); const r = d && !keys[k]; keys[k] = d; return r; };
    const brief = () => ctx.talk([
      { who: 'Robotics Instructor Chen', text: 'Welcome to the robotics workstation, {name}. Out there is a 17-metre arm and a cargo ship that has just parked itself next to the station.' },
      { who: 'Robotics Instructor Chen', text: 'You fly the arm one joint at a time: pick a joint (keys 1 to 6 or the buttons), then move it with W/S, the arrow keys or the − / + buttons. Precision mode slows everything down for the last metre.' },
      { who: 'Robotics Instructor Chen', text: 'Use the camera button: the hand camera shows the grapple pin. Get close and lined up, then Capture (C). Then fly the ship to the yellow port ring and Release. And if anything goes wrong, Space is E-STOP.', do: () => { if (ctx.done('brief')) T.start(); } }]);
    return {
      spawn: [0, 0.2, 0, -0.1],
      markerFor: id => ({ approach: pin, capture: pin, berth: portRing }[id] || null),
      onEnter: () => { if (!ctx.isDone('brief')) brief(); else T.start(); },
      dispose: () => ui.remove(), test: { cargo, pin, pinTip, tip, ee, grip, doStop, PORT, cargoPort },
      update(dt, blocked) {
        sky.update(dt); T.update(dt, blocked);
        if (!released) { if (!held) { cargo.position.addScaledVector(drift, dt); cargo.rotation.y += dt * 0.01 * ctx.diff.drift; } }
        if (drill != null && !blocked) drill += dt;
        if (!blocked && ctx.isDone('brief')) {
          for (let i = 0; i < 6; i++) if (edge('Digit' + (i + 1))) { sel = i; draw(); }
          if (edge('KeyP')) { precise = !precise; draw(); } if (edge('KeyV')) { view = (view + 1) % 3; draw(); } if (edge('KeyC')) grip(); if (edge('Space')) doStop();
          const v = hold.v || (input.keys.has('KeyW') || input.keys.has('ArrowUp') ? 1 : input.keys.has('KeyS') || input.keys.has('ArrowDown') ? -1 : 0) || (Math.abs(input.move.y) > 0.3 && input.touch ? -Math.sign(input.move.y) : 0);
          if (v && !estop) {
            const [, , lo, hi] = JOINTS[sel], old = state.q[sel];
            state.q[sel] = Math.max(lo, Math.min(hi, old + v * dt * (precise ? 0.06 : 0.22))); applyQ();
            // keep clear of the station: hand, elbow and payload must stay above the truss and away from the module
            const p1 = tipPos(), p2 = J[2].getWorldPosition(wq), pc = held ? cargo.getWorldPosition(new THREE.Vector3()) : null;
            const hit = [p1, p2, pc].filter(Boolean).some(p => (p.y < -2.0 && Math.abs(p.z + 7) < 1.2 && Math.abs(p.x) < 12.5) || (p !== pc && Math.hypot(p.y + 1, p.z + 9) < 1.75 && Math.abs(p.x + 4) < 3.2));
            if (hit) { state.q[sel] = old; applyQ(); if (collided <= 0) { collided = 2; sfx.wrong(); hud.flash('Collision warning! The arm stopped itself before hitting the station.', 'bad'); ctx.mistake('Drove the arm into a collision warning.'); } }
          }
          collided -= dt;
        }
        const d = tipPos().distanceTo(pinTip.getWorldPosition(wp));
        if (!held && !ctx.isDone('approach') && d < 1.0) { ctx.done('approach'); hud.flash('Close! Switch on precision mode and line up the gripper with the pin.', 'good', 3500); }
        if (!blocked) hud.setReadout('Arm', [['Joint', `${sel + 1} ${JOINTS[sel][0]}: ${THREE.MathUtils.radToDeg(state.q[sel]).toFixed(0)}°`, ''], held ? ['Port distance', `${cargoPort.getWorldPosition(wq).distanceTo(PORT).toFixed(2)} m`, ''] : ['Pin distance', `${d.toFixed(2)} m`, d < tol ? 'good' : ''], held ? ['Mode', 'carrying', 'good'] : ['Alignment', `${align().toFixed(0)}°`, align() < 30 * tol ? 'good' : 'warn'], ['Speed', precise ? 'precision' : 'normal', ''], ['Brakes', estop ? 'E-STOP' : 'off', estop ? 'bad' : '']]);
        // cameras
        if (view === 1) { eeCam.getWorldPosition(world.camera.position); world.camera.quaternion.copy(eeCam.getWorldQuaternion(new THREE.Quaternion())); }
        else if (view === 2) { world.camera.position.set(8, 6, -2); world.camera.lookAt(-1, -1, -9); }
      }
    };
    function finish() {
      ui.remove();
      finishExercise(ctx, { id: 'robotics', title: 'Robotic Arm', timer: T, xp: 220, badge: 'robotic-arm-operator',
        science: 'Canadarm2 on the space station is 17.6 m long with 7 joints. Astronauts use it to catch visiting cargo ships, move equipment and carry spacewalkers. A grapple fixture is a pin on the spacecraft that the arm\'s hand closes around with wire snares. Operators fly slowly, watch several camera views and always keep a hand near the brakes. This simulator is simplified: real operators usually move the hand in straight lines while a computer works out each joint.' });
    }
  }
};
