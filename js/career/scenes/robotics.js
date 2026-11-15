// ASTRO LAB Career — Phase 7b: Robotic Arm. From the robotics workstation, drive a 6-joint station arm one joint at a time
// to capture a drifting cargo ship by its grapple fixture and berth it to the station port. Precision mode, camera views,
// a gripper and an emergency stop. Simplified, but it follows how real station arms are flown.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { std, box, cyl } from '../models/house.js';
import { timer, finishExercise } from './kit.js';
import { spaceBackdrop } from './space.js';
import { h } from '../../ui/dom.js';
import { onTop, RO } from '../engine/layers.js';

// [name, axis, min, max] in radians. Ranges were widened (spec 12C): base yaw ±270°, shoulder ±150°, elbow ±165°, wrists ±170°, roll ±270°.
const D2R = Math.PI / 180;
const JOINTS = [['Base yaw', 'y', -270 * D2R, 270 * D2R], ['Shoulder', 'x', -150 * D2R, 150 * D2R], ['Elbow', 'x', -165 * D2R, 165 * D2R], ['Wrist pitch', 'x', -170 * D2R, 170 * D2R], ['Wrist yaw', 'z', -170 * D2R, 170 * D2R], ['Wrist roll', 'y', -270 * D2R, 270 * D2R]];
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
    const J = []; let parent = base; const lens = [0.5, 4.0, 4.0, 0.35, 0.35, 0.4]; // booms lengthened from 3.4 m: with the hand pointing down over the port, 3.4 m booms could not reach it (12C)
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
    let held = false, released = false, estop = false, drill = null, sel = 1, precise = false, view = 0, collided = 0, holdT = 0, limT = 0;
    // HUD controls (touch + mouse); keyboard: 1–6 joint, W/S or ↑/↓ move, P precision, V camera, C capture/release, Space E-STOP
    const hold = { v: 0 };
    const jb = JOINTS.map(([n], i) => h('button', { class: 'btn sm', onclick: () => { sel = i; draw(); } }, `${i + 1} ${n}`));
    const pm = (d, t) => h('button', { class: 'btn', onpointerdown: e => { e.preventDefault(); hold.v = d; }, onpointerup: () => { hold.v = 0; }, onpointerleave: () => { hold.v = 0; } }, t);
    const bPrec = h('button', { class: 'btn sm', onclick: () => { precise = !precise; draw(); } }, 'Precision');
    const VIEWS = [['Workstation', 'your own view from the window'], ['Gripper close-up', 'hand camera: line up the pin'], ['Arm camera', 'elbow camera looking at the hand'], ['Top-down', 'from above: left/right and in/out'], ['Side', 'from the side: height'], ['Overview', 'the whole work area']];
    const setView = v => { view = (v + VIEWS.length) % VIEWS.length; blendT = 0; camFrom.p.copy(world.camera.position); camFrom.q.copy(world.camera.quaternion); sfx.ui(); draw(); };
    const vb = VIEWS.map(([n], i) => h('button', { class: 'btn sm', title: VIEWS[i][1], onclick: () => setView(i) }, n));
    const bCam = h('div', { class: 'cx-arm-views', role: 'group', 'aria-label': 'Camera views (V / B)' }, vb);
    const viewTag = h('div', { class: 'cx-viewtag', 'aria-live': 'polite' }); document.querySelector('#screen-career').append(viewTag);
    const jbars = JOINTS.map(() => h('i')); jb.forEach((b, i) => b.append(h('div', { class: 'cx-jbar' }, jbars[i])));
    const bGrip = h('button', { class: 'btn sm primary', onclick: () => grip() }, 'Capture');
    const bStop = h('button', { class: 'btn sm cx-estop', onclick: () => doStop() }, 'E-STOP');
    const ui = h('div', { class: 'cx-arm glass' }, bCam, h('div', { class: 'cx-arm-j' }, jb), h('div', { class: 'cx-arm-row' }, pm(-1, '−'), pm(1, '+'), bPrec, bGrip, bStop));
    document.querySelector('#screen-career').append(ui);
    const camFrom = { p: new THREE.Vector3(), q: new THREE.Quaternion() }; let blendT = 1;
    function drawBars() { jbars.forEach((b, i) => { const [, , lo, hi] = JOINTS[i]; b.style.left = `calc(${((state.q[i] - lo) / (hi - lo) * 100).toFixed(1)}% - 2px)`; }); }
    function draw() { jb.forEach((b, i) => b.classList.toggle('primary', i === sel)); vb.forEach((b, i) => b.classList.toggle('primary', i === view)); bPrec.classList.toggle('primary', precise); bGrip.textContent = held ? 'Release' : 'Capture'; bStop.classList.toggle('on', estop);
      viewTag.textContent = `📷 ${VIEWS[view][0]}: ${VIEWS[view][1]}  ·  V / B to switch`; drawBars(); }
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
    // ---- hit volumes (12B): spheres along every arm segment and the hand, checked against the truss, the module, the solar arrays,
    // the cargo ship (unless it is in the gripper) and the arm itself. Returns the name of what would be hit, or null.
    const OB = [{ name: 'station truss', box: new THREE.Box3(new THREE.Vector3(-12.6, -3.3, -7.7), new THREE.Vector3(12.6, -1.95, -6.3)) },
      { name: 'solar array', box: new THREE.Box3(new THREE.Vector3(-15.6, -2.75, -11.6), new THREE.Vector3(-12.4, -2.45, -2.4)) }, { name: 'solar array', box: new THREE.Box3(new THREE.Vector3(12.4, -2.75, -11.6), new THREE.Vector3(15.6, -2.45, -2.4)) }];
    const segPts = (a, b, n, from = 0) => { const out = []; for (let i = 0; i <= n; i++) { const t = from + (1 - from) * i / n; out.push(a.clone().lerp(b, t)); } return out; };
    const _c = new THREE.Vector3(), _q = new THREE.Quaternion(), _l = new THREE.Vector3();
    function inCargo(p, r) { cargo.updateMatrixWorld(true); _l.copy(p); cargo.worldToLocal(_l); const radial = Math.hypot(_l.x, _l.z); return (radial < 1.1 + r && Math.abs(_l.y) < 1.6 + r) || (Math.abs(_l.x) > 1.0 && Math.abs(_l.x) < 3.6 + r && Math.abs(_l.y) < 0.1 + r && Math.abs(_l.z) < 0.6 + r); }
    function collision() {
      const P = J.map(g => g.getWorldPosition(new THREE.Vector3())), hand = ee.getWorldPosition(new THREE.Vector3()), t = tipPos();
      const arm = [...segPts(P[1], P[2], 6, 0.35), ...segPts(P[2], P[3], 6), ...segPts(P[3], hand, 3)], r = 0.2;
      const handPts = [hand, t], grabZone = pinTip.getWorldPosition(_c).distanceTo(t) < 0.8; // the snares close over the pin: the hand may touch the fixture
      for (const p of [...arm, ...handPts]) {
        for (const o of OB) if (o.box.distanceToPoint(p) < r) return o.name;
        if (Math.hypot(p.y + 1, p.z + 9) < 1.6 + r && p.x > -7.1 && p.x < -0.9) return 'station module';
        if (!held && inCargo(p, r) && !(handPts.includes(p) && grabZone)) return 'cargo ship';
      }
      // the hand must not fold back into the upper arm or the base
      const L = new THREE.Line3(P[0], P[2]);
      for (const p of handPts) if (L.closestPointToPoint(p, true, _c).distanceTo(p) < 0.45) return 'arm itself';
      if (held) { // the payload: its body must clear the truss and the module, except its berthing end at the port
        const cpos = cargo.getWorldPosition(new THREE.Vector3()), ax = new THREE.Vector3(0, 1, 0).applyQuaternion(cargo.getWorldQuaternion(_q));
        const nearPort = cargoPort.getWorldPosition(_c).distanceTo(PORT) < 1.4;
        // spheres along the ship's body (smaller at the flat ends, so the ends are not over-sized)
        for (const [k, rr] of [[-1.45, 0.8], [-0.8, 1.1], [0, 1.1], [0.8, 1.1], [1.45, 0.8]]) { const p = cpos.clone().addScaledVector(ax, k);
          for (const o of OB) if (o.box.distanceToPoint(p) < rr) return o.name;
          if (!nearPort && Math.hypot(p.y + 1, p.z + 9) < 1.6 + rr && p.x > -7.1 - rr && p.x < -0.9 + rr) return 'station module'; }
      }
      return null;
    }
    // alignment guide (12C): a line from the hand to its target, green when close and lined up
    const guideLine = onTop(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: 0xffc857, dashSize: 0.15, gapSize: 0.1 })), RO.MARKER); scene.add(guideLine);
    function guide() {
      if (released) { guideLine.visible = false; return; }
      const a = held ? cargoPort.getWorldPosition(new THREE.Vector3()) : tipPos(), b = held ? PORT.clone() : pinTip.getWorldPosition(new THREE.Vector3());
      guideLine.geometry.setFromPoints([a, b]); guideLine.computeLineDistances(); guideLine.visible = true;
      const ok = held ? a.distanceTo(b) < 0.8 * tol : a.distanceTo(b) < tol && align() < 30 * tol; guideLine.material.color.set(ok ? 0x3fe0a0 : 0xffc857);
    }
    const keys = {}; const edge = k => { const d = input.keys.has(k); const r = d && !keys[k]; keys[k] = d; return r; };
    const brief = () => ctx.talk([
      { who: 'Robotics Instructor Chen', text: 'Welcome to the robotics workstation, {name}. Out there is a 17-metre arm and a cargo ship that has just parked itself next to the station.' },
      { who: 'Robotics Instructor Chen', text: 'You fly the arm one joint at a time: pick a joint (keys 1 to 6 or the buttons), then move it with W/S, the arrow keys or the − / + buttons. Precision mode slows everything down for the last metre.' },
      { who: 'Robotics Instructor Chen', text: 'Switch camera views with V and B or the view buttons: workstation, gripper close-up, arm camera, top-down, side and overview. The dashed line shows where the hand needs to go. Get close and lined up, then Capture (C). Then fly the ship to the yellow port ring and Release. And if anything goes wrong, Space is E-STOP.', do: () => { if (ctx.done('brief')) T.start(); } }]);
    return {
      spawn: [0, 0.2, 0, -0.1],
      markerFor: id => ({ approach: pin, capture: pin, berth: portRing }[id] || null),
      onEnter: () => { if (!ctx.isDone('brief')) brief(); else T.start(); },
      dispose: () => { ui.remove(); viewTag.remove(); }, test: { cargo, pin, pinTip, tip, ee, grip, doStop, PORT, cargoPort, J, JOINTS, applyQ, collision, align, setView, get view() { return view; }, get held() { return held; } },
      update(dt, blocked) {
        sky.update(dt); T.update(dt, blocked);
        if (!released) { if (!held) { cargo.position.addScaledVector(drift, dt); cargo.rotation.y += dt * 0.01 * ctx.diff.drift; } }
        if (drill != null && !blocked) drill += dt;
        if (!blocked && ctx.isDone('brief')) {
          for (let i = 0; i < 6; i++) if (edge('Digit' + (i + 1))) { sel = i; draw(); }
          if (edge('KeyP')) { precise = !precise; draw(); } if (edge('KeyV')) setView(view + 1); if (edge('KeyB')) setView(view - 1); if (edge('KeyC')) grip(); if (edge('Space')) doStop();
          const v = hold.v || (input.keys.has('KeyW') || input.keys.has('ArrowUp') ? 1 : input.keys.has('KeyS') || input.keys.has('ArrowDown') ? -1 : 0) || (Math.abs(input.move.y) > 0.3 && input.touch ? -Math.sign(input.move.y) : 0);
          // smooth speed: starts slow and ramps up while held (precision mode stays slow); stops at the joint limit with a message
          holdT = v ? holdT + dt : 0;
          if (v && !estop) {
            const [, , lo, hi] = JOINTS[sel], old = state.q[sel], wasHit = collision(), sp = precise ? 0.06 : 0.15 + Math.min(1, holdT) * 0.3;
            state.q[sel] = Math.max(lo, Math.min(hi, old + v * dt * sp)); applyQ();
            if (state.q[sel] === old && (limT -= dt) < 0) { limT = 2; hud.flash(`${JOINTS[sel][0]} is at its limit (${Math.round(THREE.MathUtils.radToDeg(old))}°). Try another joint.`, '', 2200); }
            // keep clear of the station: hand, elbow and payload must stay above the truss and away from the module
            const hit = collision();
            // never block a move that starts from contact (e.g. the drifting ship touched the arm): only new contacts are stopped
            if (hit && !wasHit) { state.q[sel] = old; applyQ(); if (collided <= 0) { collided = 2; sfx.wrong(); hud.flash(`Collision warning: the ${hit} is in the way. The arm stopped itself.`, 'bad'); ctx.mistake(`Drove the arm into a collision warning (${hit}).`); } }
            drawBars();
          }
          collided -= dt;
        }
        const d = tipPos().distanceTo(pinTip.getWorldPosition(wp));
        if (!held && !ctx.isDone('approach') && d < 1.0) { ctx.done('approach'); hud.flash('Close! Switch on precision mode and line up the gripper with the pin.', 'good', 3500); }
        if (!blocked) hud.setReadout('Arm', [['Joint', `${sel + 1} ${JOINTS[sel][0]}: ${THREE.MathUtils.radToDeg(state.q[sel]).toFixed(0)}°`, ''], held ? ['Port distance', `${cargoPort.getWorldPosition(wq).distanceTo(PORT).toFixed(2)} m`, ''] : ['Pin distance', `${d.toFixed(2)} m`, d < tol ? 'good' : ''], held ? ['Mode', 'carrying', 'good'] : ['Alignment', `${align().toFixed(0)}°`, align() < 30 * tol ? 'good' : 'warn'], ['Speed', precise ? 'precision' : 'normal', ''], ['Brakes', estop ? 'E-STOP' : 'off', estop ? 'bad' : '']]);
        // cameras: each view has a target pose; switching blends smoothly from the old pose for 0.5 s
        guide();
        const tp = new THREE.Vector3(), tq = new THREE.Quaternion(), look = (p, at) => { tp.copy(p); const m = new THREE.Matrix4().lookAt(p, at, view === 3 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0)); tq.setFromRotationMatrix(m); };
        const focus = held ? cargo.getWorldPosition(new THREE.Vector3()) : pin.getWorldPosition(new THREE.Vector3()), mid = tipPos().add(focus).multiplyScalar(0.5);
        if (view === 0) { tp.copy(world.camera.position); tq.copy(world.camera.quaternion); }
        else if (view === 1) { // gripper close-up: just behind and beside the hand, looking past the snares towards the target
          const tp0 = tipPos(), goal = held ? PORT.clone() : pinTip.getWorldPosition(new THREE.Vector3()), dir = goal.clone().sub(tp0); const far = dir.length(); dir.normalize();
          const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)); if (side.lengthSq() < 0.01) side.set(1, 0, 0); side.normalize();
          look(tp0.clone().addScaledVector(dir, -0.9).addScaledVector(side, 0.5).add(new THREE.Vector3(0, 0.35, 0)), tp0.clone().addScaledVector(dir, Math.min(far, 2.5))); }
        else if (view === 2) { // arm camera: on a short mast at the elbow, offset sideways so the boom never fills the picture
          const e = J[2].getWorldPosition(new THREE.Vector3()), side = new THREE.Vector3(1, 0, 0).applyQuaternion(J[2].getWorldQuaternion(new THREE.Quaternion()));
          look(e.addScaledVector(side, 1.4).add(new THREE.Vector3(0, 0.8, 0)), tipPos()); }
        else if (view === 3) look(new THREE.Vector3(mid.x, 15, mid.z + 0.01), new THREE.Vector3(mid.x, -1, mid.z));
        else if (view === 4) look(new THREE.Vector3(mid.x + 9, mid.y + 0.8, mid.z), mid);
        else look(new THREE.Vector3(8, 6, -2), new THREE.Vector3(-1, -1, -9));
        if (view !== 0) { player.frozenByScene = true; } else player.frozenByScene = false;
        if (blendT < 0.5) { blendT += dt; const k = Math.min(1, blendT / 0.5), e = k * k * (3 - 2 * k); world.camera.position.lerpVectors(camFrom.p, tp, e); world.camera.quaternion.slerpQuaternions(camFrom.q, tq, e); }
        else { world.camera.position.copy(tp); world.camera.quaternion.copy(tq); }
      }
    };
    function finish() {
      ui.remove(); viewTag.remove(); player.frozenByScene = false;
      finishExercise(ctx, { id: 'robotics', title: 'Robotic Arm', timer: T, xp: 220, badge: 'robotic-arm-operator',
        science: 'Canadarm2 on the space station is 17.6 m long with 7 joints. Astronauts use it to catch visiting cargo ships, move equipment and carry spacewalkers. A grapple fixture is a pin on the spacecraft that the arm\'s hand closes around with wire snares. Operators fly slowly, watch several camera views and always keep a hand near the brakes. This simulator is simplified: real operators usually move the hand in straight lines while a computer works out each joint.' });
    }
  }
};
