// ASTRO LAB Career — Training 1: Spacesuit Preparation. Inspect every part, reject the damaged one, assemble the suit in order, lock the seals, run a leak check.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { makeSign } from '../models/props.js';
import { makePart, PARTS, PART_ORDER, makeSuitStand, makeLabTable, makeBin, makeCabinet } from '../models/suit.js';
import { makeScreen, infoScreen } from '../models/centre.js';
import { LOOKS } from '../data/people.js';
import { makeUsable } from '../engine/interact.js';
import { trainingRoom, instructor, timer, finishExercise, invisibleMark } from './kit.js';
import { h, openModal } from '../../ui/dom.js';

const NEED = { cooling: [], lower: ['cooling'], boots: ['lower'], upper: ['boots'], plss: ['upper'], gloveL: ['plss'], gloveR: ['plss'], helmet: ['gloveL', 'gloveR'] };
const WHY = { lower: 'The lower torso goes on over the cooling garment.', boots: 'Boots attach to the lower torso legs.', upper: 'The upper torso connects to the lower torso at the waist ring once the legs and boots are on.', plss: 'The life-support pack mounts on the back of the upper torso.', gloveL: 'Gloves lock onto the wrist rings of the upper torso arms.', gloveR: 'Gloves lock onto the wrist rings of the upper torso arms.', helmet: 'The helmet goes on last, after both gloves, so your hands are protected before the suit is sealed.' };
const CHECK = {
  cooling: ['Water tubes: no kinks or leaks', 'Fabric: no tears', 'Connector: clean'],
  lower: ['Fabric layers: no tears', 'Waist ring: clean, no dents', 'Knee joints: move freely'],
  boots: ['Soles: intact', 'Ankle bearings: move freely', 'Thermal layer: no gaps'],
  upper: ['Hard shell: no cracks', 'Display and controls: power on', 'Wrist and neck rings: clean'],
  plss: ['Oxygen bottles: full (green)', 'Fan and pump: run test passed', 'Battery: 100%'],
  gloveL: ['Fingertips: no wear', 'Seal ring: smooth, no cracks', 'Palm bladder: holds pressure'],
  gloveR: ['Fingertips: no wear', 'Seal ring: smooth, no cracks', 'Palm bladder: holds pressure'],
  helmet: ['Bubble: no scratches in view', 'Gold visor: slides smoothly', 'Neck ring: clean']
};

export default {
  id: 'suit', title: 'Spacesuit Preparation', music: 'centre', ambience: 'vent',
  steps: [
    { id: 'brief', text: 'Talk to Suit Technician Rivera' },
    { id: 'inspect', text: 'Inspect every suit part on the inspection tray (8 parts)' },
    { id: 'reject', text: 'Put the damaged part in the red reject bin and take the spare' },
    { id: 'assemble', text: 'Put the suit together on the stand, in the right order' },
    { id: 'seal', text: 'Lock the waist, wrist and neck rings' },
    { id: 'test', text: 'Run the leak check on the wall panel' }
  ],
  initialState: { steps: {}, mistakes: [], damaged: null, inspected: {}, installed: [], locks: {} },

  async build(ctx) {
    const { scene, player, carry, ix, hud, sfx, state } = ctx;
    trainingRoom(ctx, { w: 12, d: 9, title: 'SUIT LAB', sub: 'Inspect · assemble · seal · test' });
    if (!state.damaged) state.damaged = Math.random() < 0.5 ? 'gloveL' : 'gloveR';
    const T = timer(ctx, 420);
    // furniture
    const parts = makeLabTable(5.6, 0.8); parts.position.set(-5.3, 0, 0); parts.rotation.y = Math.PI / 2; scene.add(parts); player.addBox(-5.75, -4.85, -2.85, 2.85, 0, 1);
    const ptSign = makeSign('SUIT PARTS', 'Inspect before you install', 1.6); ptSign.position.set(-5.98, 2.0, 0); ptSign.rotation.y = Math.PI / 2; scene.add(ptSign);
    const itable = makeLabTable(1.4, 0.8, 0xdfe8f2); itable.position.set(-1.6, 0, -3.7); scene.add(itable); player.addBox(-2.35, -0.85, -4.15, -3.25, 0, 1);
    const tray = invisibleMark(scene, -1.6, 1.05, -3.7); tray.scale.set(4, 0.6, 2.4);
    const iSign = makeSign('INSPECTION', 'Place a part on the tray', 1.4); iSign.position.set(-1.6, 2.2, -4.48); scene.add(iSign);
    const bin = makeBin(); bin.position.set(0.4, 0, -3.9); scene.add(bin); player.addBox(0.1, 0.7, -4.15, -3.65, 0, 0.7);
    const binSign = makeSign('REJECT', 'Damaged parts', 0.9, '#8a1f24'); binSign.position.set(0.4, 1.3, -4.48); scene.add(binSign);
    const binSock = invisibleMark(scene, 0.4, 0.65, -3.9); binSock.scale.set(2, 1, 1.6);
    const cab = makeCabinet(); cab.position.set(5.4, 0, -3.6); scene.add(cab); player.addBox(4.95, 5.85, -3.85, -3.35, 0, 1.7);
    const cabSign = makeSign('SPARES', 'Gloves · seals', 0.9); cabSign.position.set(5.4, 2.1, -4.48); scene.add(cabSign);
    const stand = makeSuitStand(); stand.position.set(1.6, 0, 0.2); scene.add(stand); player.addBox(1.15, 2.05, -0.3, 0.6, 0, 1.9);
    const standSock = invisibleMark(scene, 1.6, 1.0, 0.2); standSock.scale.set(3, 6, 3);
    const panel = makeScreen(0.9, 0.6, infoScreen('LEAK CHECK', ['Suit pressure: —', 'Leak rate: —', ['Seal the suit first', '#ffc857']], { w: 384, hgt: 256 }), [384, 256]);
    panel.position.set(5.95, 1.5, 0.2); panel.rotation.y = -Math.PI / 2; scene.add(panel);
    const tech = instructor(ctx, LOOKS.tech, 'Suit Technician Rivera', [3.6, 2.4, -2.4], () => ctx.isDone('brief') ? [{ who: 'Suit Technician Rivera', text: hint() }] : briefing());
    function briefing() {
      return [
        { who: 'Suit Technician Rivera', text: 'Hi {name}, I\'m Rivera. A spacesuit is a tiny spacecraft shaped like a person: it gives you oxygen, pressure, cooling and protection.' },
        { who: 'Suit Technician Rivera', text: 'Your job: inspect every part on the tray first. Exactly one part today is damaged, so look carefully. Reject it and take the spare from the cabinet.' },
        { who: 'Suit Technician Rivera', text: 'Then build the suit on the stand from the inside out: cooling garment, lower torso, boots, upper torso, life-support pack, gloves, and the helmet last.', choices: [
          { text: 'Why does the cooling garment go first?', goto: 'cool' }, { text: 'Why is the helmet last?', goto: 'helm' }, { text: 'Got it. Let\'s go.', goto: 'go' }] },
        { id: 'cool', who: 'Suit Technician Rivera', text: 'It sits against your skin. Water flows through thin tubes to carry away body heat, because a sealed suit can\'t cool itself by letting air out.', goto: 'go' },
        { id: 'helm', who: 'Suit Technician Rivera', text: 'The helmet seals the suit. Your gloves have to be locked on first, otherwise you\'d have a sealed helmet and open wrists.', goto: 'go' },
        { id: 'go', who: 'Suit Technician Rivera', text: 'Finish by locking the rings and running the leak check. The clock starts now.', do: () => { if (!ctx.isDone('brief')) { ctx.done('brief'); T.start(); } } }
      ];
    }
    const hint = () => !ctx.isDone('inspect') ? 'Put each part on the inspection tray one at a time. Read the checklist carefully: one part has a problem.' : !ctx.isDone('reject') ? 'Damaged parts go in the red reject bin. The spare is in the cabinet.' : !ctx.isDone('assemble') ? 'Inside out: cooling garment, lower torso, boots, upper torso, pack, gloves, helmet.' : !ctx.isDone('seal') ? 'Lock the three rings on the suit: waist, wrists and neck.' : 'Run the leak check on the wall panel.';

    // parts on the table
    const objs = {};
    PART_ORDER.forEach((id, i) => {
      const o = makePart(id); objs[id] = o; o.userData.home = new THREE.Vector3(-5.3, 0.93 + (id === 'helmet' ? 0.19 : id === 'upper' ? 0.2 : id === 'lower' ? 0.42 : id === 'plss' ? 0.31 : id === 'cooling' ? 0.28 : id.startsWith('glove') ? 0.14 : 0.09), -2.45 + i * 0.7);
      o.position.copy(o.userData.home); o.rotation.y = Math.PI / 2; scene.add(o);
      carry.makeCarriable(o, { id, name: PARTS[id].name + (state.inspected[id] ? (state.inspected[id] === 'pass' ? ' ✓' : ' ✗') : '') });
    });
    const label = id => PARTS[id].name + (state.inspected[id] === 'pass' ? ' (passed)' : state.inspected[id] === 'fail' ? ' (rejected)' : '');
    const relabel = id => { objs[id].userData.it.label = label(id); };
    let spare = null;
    function makeSpare(at) {
      const id = state.damaged; spare = makePart(id); spare.userData.spare = true; spare.position.copy(at); scene.add(spare);
      carry.makeCarriable(spare, { id: id, name: 'Spare ' + PARTS[id].name.toLowerCase() + ' (passed)' }); spare.userData.isSpare = true; return spare;
    }
    const isDamaged = o => o.userData.partId === state.damaged && !o.userData.isSpare;
    const inspectedOK = o => o.userData.isSpare || state.inspected[o.userData.partId] === 'pass';

    // inspection tray
    carry.makeSocket(tray, { accepts: () => true, label: 'Inspection tray', offset: new THREE.Vector3(0, -0.08, 0),
      check: o => o.userData.isSpare ? { ok: false, msg: 'Spares from the cabinet are already inspected and tagged. Install it on the stand.' } : (o.userData.partId in state.inspected) ? { ok: false, msg: 'You already inspected that part.' } : { ok: true },
      onPlace: o => { tray.userData.filled = null; o.userData.locked = false; inspect(o); } });
    function inspect(o) {
      const id = o.userData.partId, bad = isDamaged(o);
      const lines = CHECK[id].map((t, i) => { const [k, v] = t.split(': '); const broken = bad && i === 1; return h('li', { class: broken ? 'bad' : '' }, h('b', {}, k + ': '), broken ? 'hairline crack across the ring, it catches your fingernail' : v); });
      ctx.input.releaseLock();
      const decide = verdict => {
        m.close(); state.inspected[id] = verdict; relabel(id); sfx.ui();
        if (verdict === 'pass' && bad) ctx.mistake(`Passed the ${PARTS[id].name.toLowerCase()} even though its seal ring was cracked.`);
        if (verdict === 'fail' && !bad) ctx.mistake(`Rejected a good ${PARTS[id].name.toLowerCase()}.`);
        if (verdict === 'fail' && !bad) state.inspected[id] = 'pass'; // the tech overrules it so the exercise can continue
        if (verdict === 'fail' && !bad) hud.flash(`Rivera checks it: "That one is fine, {name}." It is tagged as passed.`.replace('{name}', ctx.name), 'bad', 4000);
        if (PART_ORDER.every(p => p in state.inspected)) { if (ctx.done('inspect')) hud.flash('All parts inspected. Damaged parts go in the red reject bin.', '', 3500); }
      };
      const m = openModal({ title: `🔍 Inspect: ${PARTS[id].name}`, label: 'Inspection', closable: false, body: h('div', {}, h('p', {}, 'Work down the checklist. Does this part pass?'), h('ul', { class: 'cx-checklist' }, lines)),
        foot: [h('button', { class: 'btn', onclick: () => decide('fail') }, '✗ Fail: reject it'), h('button', { class: 'btn primary', onclick: () => decide('pass') }, '✓ Pass')] });
    }
    // reject bin
    carry.makeSocket(binSock, { accepts: () => true, label: 'Reject bin', offset: new THREE.Vector3(0, -0.4, 0),
      check: o => isDamaged(o) && state.inspected[o.userData.partId] ? { ok: true } : isDamaged(o) ? { ok: false, msg: 'Inspect it on the tray first, so the fault is written down.' } : { ok: false, msg: 'That part is fine. Only damaged parts go in the reject bin.' },
      onMistake: () => ctx.mistake('Tried to put a good part in the reject bin.'),
      onPlace: o => { o.visible = false; o.userData.locked = true; state.rejected = true; makeSpare(new THREE.Vector3(5.4, 1.75, -3.55)); sfx.good(); hud.flash('Rejected. A spare is waiting on top of the spares cabinet.', '', 3500); ctx.done('reject'); } });
    // suit stand
    carry.makeSocket(standSock, { accepts: () => true, label: 'Suit stand',
      check: o => {
        const id = o.userData.partId;
        if (!o.userData.isSpare && !(id in state.inspected)) return { ok: false, msg: 'Inspect every part before you install it.' };
        if (isDamaged(o)) return { ok: false, msg: 'The leak test light flashes red: this part is damaged. Reject it and use the spare.' };
        const miss = NEED[id].filter(p => !state.installed.includes(p));
        if (miss.length) return { ok: false, msg: `Not yet. ${WHY[id] || ''} Still needed first: ${miss.map(p => PARTS[p].name.toLowerCase()).join(', ')}.` };
        return { ok: true };
      },
      onMistake: msg => ctx.mistake(/damaged/.test(msg) ? 'Tried to install a damaged part.' : /Inspect/.test(msg) ? 'Tried to install a part before inspecting it.' : 'Tried to install a part in the wrong order.'),
      onPlace: o => { standSock.userData.filled = null; mount(o); state.installed.push(o.userData.partId); if (PART_ORDER.every(p => state.installed.includes(p))) { ctx.done('assemble'); showRings(); hud.flash('Suit assembled! Lock the three rings.', 'good'); } } });
    function mount(o) { const m = PARTS[o.userData.partId].mount; o.position.set(1.6 + m[0], m[1], 0.2 + m[2]); o.rotation.set(0, 0, 0); o.userData.locked = true; o.userData.it.enabled = () => false; }

    // rings to lock
    const ringDefs = [['waist', 'Waist ring', [0, 0.95, 0.2], 0.25], ['wrists', 'Wrist rings', [0.42, 0.79, 0.22], 0.08], ['neck', 'Neck ring', [0, 1.36, 0.2], 0.16]];
    const rings = ringDefs.map(([id, name, p, r]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 32), MAT.glow(state.locks[id] ? 0x3fe0a0 : 0xffc857, 0.8)); ring.rotation.x = Math.PI / 2; ring.position.set(1.6 + p[0], p[1], p[2]); ring.visible = false; scene.add(ring);
      makeUsable(ring, { label: name, verb: 'Lock', range: 2.4, enabled: () => ctx.isDone('assemble') && !state.locks[id], use: () => { state.locks[id] = true; ring.material.color.set(0x3fe0a0); ring.material.emissive.set(0x3fe0a0); sfx.place(); hud.cap('[Click: ring locked]'); if (ringDefs.every(([k]) => state.locks[k])) { ctx.done('seal'); panel.userData.screen.redraw(infoScreen('LEAK CHECK', ['Suit pressure: 0.0 psi', 'Leak rate: —', ['Ready: press to test', '#3fe0a0']], { w: 384, hgt: 256 })); } } });
      ix.add(ring); return ring;
    });
    function showRings() { rings.forEach(r => { r.visible = true; }); }
    let testing = 0;
    makeUsable(panel, { label: 'Leak check panel', verb: 'Run', range: 2.6, enabled: () => !testing && !ctx.isDone('test'), use: () => {
      if (!ctx.isDone('seal')) { sfx.wrong(); hud.flash('Lock all three rings before the leak check.', 'bad'); ctx.mistake('Started a leak check before sealing the suit.'); return; }
      testing = 0.001; sfx.ui(); hud.cap('[Hiss: suit pressurising]');
    } }); ix.add(panel);

    // restore on resume
    for (const id of state.installed) { const o = (id === state.damaged && state.rejected) ? null : objs[id]; if (o) mount(o); }
    if (state.rejected) { objs[state.damaged].visible = false; objs[state.damaged].userData.locked = true; const s2 = makeSpare(new THREE.Vector3(5.4, 1.75, -3.55)); if (state.installed.includes(state.damaged)) mount(s2); }
    if (ctx.isDone('assemble')) showRings();
    if (ctx.isDone('brief') && !ctx.isDone('test')) T.start();

    const markFor = id => ({ brief: tech.rig.root, inspect: tray, reject: binSock, assemble: standSock, seal: rings.find((r, i) => !state.locks[ringDefs[i][0]]) || rings[0], test: panel }[id]);
    return {
      spawn: [0, 3.2, 0, 0],
      markerFor: id => markFor(id) || null,
      onEnter: () => { if (!ctx.isDone('brief')) hud.flash('Talk to Suit Technician Rivera to begin.', '', 3500); },
      update(dt, blocked) {
        tech.update(dt); T.update(dt, blocked);
        if (testing && !ctx.isDone('test')) {
          testing += dt / 4; const p = Math.min(4.3, testing * 6);
          panel.userData.screen.redraw(infoScreen('LEAK CHECK', [`Suit pressure: ${p.toFixed(1)} psi`, `Leak rate: ${testing > 0.75 ? '0.00 psi/min' : 'measuring…'}`, testing > 1 ? ['PASS: suit holds pressure', '#3fe0a0'] : ['Testing…', '#ffc857']], { w: 384, hgt: 256 }));
          hud.setReadout('Leak check', [['Pressure', `${p.toFixed(1)} psi`, p >= 4.3 ? 'good' : ''], ['Leak rate', testing > 0.75 ? '0.00' : '…', testing > 0.75 ? 'good' : '']]);
          if (testing > 1.05) { ctx.done('test'); finish(); }
        }
      }
    };
    function finish() {
      finishExercise(ctx, { id: 'suit', title: 'Spacesuit Preparation', timer: T, xp: 150, badge: 'suit-specialist',
        science: 'NASA\'s spacewalk suit (the EMU) is pressurised to about 4.3 psi of pure oxygen, roughly 30% of sea-level air pressure, so the joints still bend. Underneath, a liquid cooling and ventilation garment carries away body heat through about 90 metres of thin tubing. Suit technicians inspect every glove before every spacewalk: astronauts\' fingertips and glove seals are among the parts that wear out fastest.' });
    }
  }
};
