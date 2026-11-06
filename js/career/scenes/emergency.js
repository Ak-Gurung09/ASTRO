// ASTRO LAB Career — Training 6: Emergency Alarm Drill. Inside a station-module mock-up an alarm goes off:
// fire, rapid pressure loss or a toxic (ammonia) leak. Read the warning panel, report to Mission Control,
// follow the procedure card in the right order, and confirm the crew is safe.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { makeSign } from '../models/props.js';
import { std, box, cyl } from '../models/house.js';
import { makeScreen, infoScreen } from '../models/centre.js';
import { makeUsable } from '../engine/interact.js';
import { trainingRoom, timer, finishExercise } from './kit.js';
import { h, openModal } from '../../ui/dom.js';

const KINDS = {
  fire: { name: 'FIRE', col: '#ff5a3a', where: 'Lab rack 3', steps: ['mask', 'power', 'ext'],
    card: ['Put on your oxygen mask: smoke is poisonous.', 'Switch off power to the burning rack. Without power, most electrical fires go out.', 'Use the fire extinguisher on the rack.'], report: 'Fire alarm in the Lab, smoke at rack 3.' },
  depress: { name: 'RAPID DEPRESS', col: '#ffc857', where: 'Lab module', steps: ['gauge', 'leave', 'hatch'],
    card: ['Read the pressure gauge to see how fast air is leaving: that tells you how long you have.', 'Move to the safe side, through the hatch into the Node.', 'Close the hatch behind you to seal off the leaking module.'], report: 'Rapid depress alarm, pressure falling in the Lab.' },
  ammonia: { name: 'TOXIC ATMOSPHERE', col: '#c07aff', where: 'Lab module', steps: ['mask', 'leave', 'hatch'],
    card: ['Put on your oxygen mask straight away: ammonia burns your eyes and lungs.', 'Move to the safe side, through the hatch into the Node.', 'Close the hatch behind you to keep the ammonia out.'], report: 'Toxic atmosphere alarm, ammonia smell in the Lab.' }
};
const ACT = { mask: 'Put on the oxygen mask', power: 'Switch off rack power', ext: 'Use the fire extinguisher', gauge: 'Read the pressure gauge', leave: 'Move to the Node', hatch: 'Close the hatch' };

export default {
  id: 'emergency', title: 'Emergency Alarm Drill', music: 'centre', ambience: 'vent',
  steps: [
    { id: 'brief', text: 'Check in with Mission Control on the comm panel' },
    { id: 'identify', text: 'Read the caution and warning panel' },
    { id: 'report', text: 'Report the emergency to Mission Control' },
    { id: 'respond', text: 'Follow the emergency procedure card, in order' },
    { id: 'safe', text: 'Tell Mission Control the crew is safe' }
  ],
  initialState: { steps: {}, mistakes: [], kind: null, done: [] },

  async build(ctx) {
    const { scene, player, ix, hud, sfx, state } = ctx;
    if (!state.kind) state.kind = ['fire', 'depress', 'ammonia'][Math.floor(Math.random() * 3)];
    const K = KINDS[state.kind];
    trainingRoom(ctx, { w: 4.4, d: 16, hgt: 3.2, title: 'STATION MOCK-UP', sub: 'Lab module · Node', light: 0.9 });
    const T = timer(ctx, 200);
    // hatch wall between the Lab (z > -4) and the Node (z < -4)
    const wm = std(0xd9dce2, { roughness: 0.6 });
    box(1.4, 3.2, 0.2, wm, -1.5, 1.6, -4, scene); box(1.4, 3.2, 0.2, wm, 1.5, 1.6, -4, scene); box(1.6, 0.9, 0.2, wm, 0, 2.75, -4, scene);
    player.addBox(-2.2, -0.8, -4.1, -3.9, 0, 3.2); player.addBox(0.8, 2.2, -4.1, -3.9, 0, 3.2);
    const hatchFrame = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 8, 32), MAT.metal(0x9aa3b2)); hatchFrame.position.set(0, 1.25, -4.12); scene.add(hatchFrame);
    const door = new THREE.Group(); box(1.5, 2.25, 0.08, std(0xb8bec8, { roughness: 0.5 }), 0.75, 0, 0, door); box(0.3, 0.06, 0.06, MAT.metal(0x3a3f4a), 1.2, 0, 0.06, door);
    door.position.set(-0.75, 1.15, -4.25); door.rotation.y = -Math.PI / 2; scene.add(door);
    const doorCol = player.addBox(-0.8, 0.8, -4.3, -4.2, 0, 3); doorCol.on = false;
    const nodeS = makeSign('NODE', 'Safe haven', 1.2, '#1f6b3a'); nodeS.position.set(0, 2.5, -7.98); scene.add(nodeS);
    const labS = makeSign('LAB', 'Module', 1.2); labS.position.set(0, 2.5, 7.98); labS.rotation.y = Math.PI; scene.add(labS);
    // racks along the Lab walls
    const racks = [];
    for (let z = -2; z <= 6; z += 2) for (const s of [-1, 1]) { const r = new THREE.Group(); box(0.4, 2, 1.7, std(0xe8ebf0, { roughness: 0.6 }), 0, 0, 0, r); for (let i = 0; i < 5; i++) box(0.02, 0.24, 1.4, std([0x2b6ad8, 0x3a3f4a, 0x9aa3b2, 0x3a3f4a, 0x2b4f8f][i]), s * -0.21, -0.7 + i * 0.36, 0, r); r.position.set(s * 2.0, 1.2, z); scene.add(r); racks.push(r); player.addBox(s * 2.0 - 0.2, s * 2.0 + 0.2, z - 0.85, z + 0.85, 0, 2.2); }
    const rack3 = racks[5]; // east wall, z = 2
    // caution & warning panel, comm panel, procedure book, mask, power switch, extinguisher, gauge
    const cw = makeScreen(0.8, 0.5, infoScreen('CAUTION & WARNING', ['All systems normal', ['●  No alarms', '#3fe0a0']], { w: 384, hgt: 240 }), [384, 240]); cw.position.set(-1.78, 1.6, 0.9); cw.rotation.y = Math.PI / 2; scene.add(cw);
    const comm = makeScreen(0.5, 0.36, infoScreen('COMM', ['S-band: locked', 'Space-to-ground 1'], { w: 320, hgt: 230 }), [320, 230]); comm.position.set(-1.78, 1.5, 3.4); comm.rotation.y = Math.PI / 2; scene.add(comm);
    const book = new THREE.Group(); box(0.28, 0.36, 0.04, std(0xc8202a), 0, 0, 0, book); book.position.set(1.78, 1.5, -1.2); book.rotation.y = -Math.PI / 2; scene.add(book);
    const bookS = makeSign('EMERGENCY', 'Procedures', 0.7, '#8a1f24'); bookS.position.set(1.79, 1.95, -1.2); bookS.rotation.y = -Math.PI / 2; scene.add(bookS);
    const mask = new THREE.Group(); const mm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf2b632)); mm.rotation.x = Math.PI / 2; mask.add(mm); cyl(0.04, 0.04, 0.25, std(0x2e8a4a), 0, -0.18, -0.03, mask); mask.position.set(-1.78, 1.3, 5.1); mask.rotation.y = Math.PI / 2; scene.add(mask);
    const powerSw = new THREE.Group(); box(0.18, 0.26, 0.05, std(0x1a1d24), 0, 0, 0, powerSw); const lever = box(0.04, 0.12, 0.04, std(0xc8202a), 0, 0.04, 0.04, powerSw); powerSw.position.set(1.78, 1.6, 1.0); powerSw.rotation.y = -Math.PI / 2; scene.add(powerSw);
    const ext = new THREE.Group(); cyl(0.07, 0.07, 0.4, std(0xc8202a, { roughness: 0.4 }), 0, 0, 0, ext); box(0.06, 0.06, 0.06, std(0x1a1d24), 0, 0.23, 0, ext); ext.position.set(-1.75, 0.5, -2.95); scene.add(ext);
    const gauge = new THREE.Group(); cyl(0.12, 0.12, 0.04, MAT.metal(0x9aa3b2), 0, 0, 0, gauge, 24).rotation.x = Math.PI / 2; cyl(0.1, 0.1, 0.01, std(0xffffff), 0, 0, 0.025, gauge, 24).rotation.x = Math.PI / 2; const needle = box(0.012, 0.08, 0.005, std(0xc8202a), 0, 0.03, 0.035, gauge); gauge.position.set(-1.78, 1.7, -2.4); gauge.rotation.y = Math.PI / 2; scene.add(gauge);
    // effects: red alarm lights, smoke or mist
    const alarmL = new THREE.PointLight(0xff3020, 0, 14, 1.4); alarmL.position.set(0, 2.9, 2); scene.add(alarmL);
    const puffs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: state.kind === 'fire' ? 0x555555 : 0xd8c8ff, transparent: true, opacity: 0.35, depthWrite: false }), 40); puffs.visible = false; scene.add(puffs);
    const P = Array.from({ length: 40 }, () => ({ t: Math.random() * 3, x: 0, z: 0 }));
    let alarm = false, alarmT = 0, extinguished = false;

    const redrawCW = () => cw.userData.screen.redraw(infoScreen('CAUTION & WARNING', alarm ? [[`⚠ ${K.name}`, K.col], `Location: ${K.where}`, ctx.isDone('identify') ? ['Acknowledged', '#c9d6ff'] : ['Press to acknowledge', '#ffc857']] : ['All systems normal', ['●  No alarms', '#3fe0a0']], { w: 384, hgt: 240 }));
    const startAlarm = () => { alarm = true; alarmT = 0; puffs.visible = state.kind !== 'depress'; redrawCW(); hud.flash(`⚠ ALARM: ${K.name}`, 'bad', 4000); };
    // Talking to Mission Control (via the comm panel)
    const MC = 'Mission Control (CAPCOM)';
    makeUsable(comm, { label: 'Comm panel', verb: 'Call Mission Control', range: 2.4, enabled: () => !ctx.isDone('brief') || (ctx.isDone('identify') && !ctx.isDone('report')) || (ctx.isDone('respond') && !ctx.isDone('safe')), use: async () => {
      if (!ctx.isDone('brief')) {
        await ctx.talk([{ who: MC, text: 'Station, Houston. Good morning, {name}. Today you\'re crew on our station mock-up. At some point an alarm will sound. You won\'t know which one.' },
          { who: MC, text: 'When it does: read the caution and warning panel, call us, then follow the red emergency book exactly, step by step. Speed matters, but order matters more.' },
          { who: MC, text: 'Take a look around and find the panel, the book, the masks and the hatch. Houston standing by.', do: () => { if (ctx.done('brief')) { T.start(); setTimeout(startAlarm, 9000 + Math.random() * 6000); } } }]);
      } else if (!ctx.isDone('report')) {
        const opts = Object.entries(KINDS).map(([k, v]) => ({ text: `Houston, Station: ${v.report}`, goto: k === state.kind ? 'right' : 'wrong' }));
        opts.sort(() => Math.random() - 0.5);
        await ctx.talk([{ who: ctx.name, text: '(Choose your report.)', choices: opts }, { id: 'wrong', who: MC, text: 'Station, Houston: our data shows something different. Look at the panel again. Copy?', do: () => ctx.mistake('Reported the wrong emergency to Mission Control.'), goto: 'end' },
          { id: 'right', who: MC, text: 'Station, Houston: copy. We see it too. Follow the emergency book. We\'re with you.', do: () => ctx.done('report') }]);
      } else {
        await ctx.talk([{ who: ctx.name, text: `Houston, Station: emergency procedure complete. Crew is safe${state.kind === 'fire' ? ', fire is out' : ', hatch is closed'}.` }, { who: MC, text: 'Copy, Station. Great work. That\'s the end of the drill. Take a breath.', do: () => { ctx.done('safe'); finish(); } }]);
      }
    } }); ix.add(comm);
    makeUsable(cw, { label: 'Caution & warning panel', verb: 'Read', range: 2.4, enabled: () => alarm && !ctx.isDone('identify'), use: () => { ctx.done('identify'); redrawCW(); hud.flash(`${K.name} in the ${K.where}. Report it to Mission Control.`, '', 4000); } }); ix.add(cw);
    makeUsable(book, { label: 'Emergency procedure book', verb: 'Open', range: 2.4, use: () => {
      ctx.input.releaseLock();
      const body = !alarm ? h('p', {}, 'The book has one card for each emergency: fire, rapid depress and toxic atmosphere. Come back when an alarm sounds.')
        : h('div', {}, h('p', {}, h('b', {}, `${K.name} card`), ' (do these in order):'), h('ol', { class: 'cx-checklist' }, K.card.map((c, i) => h('li', { class: state.done.includes(K.steps[i]) ? 'done' : '' }, c))));
      openModal({ title: '📕 Emergency procedures', label: 'Emergency procedures', body });
    } }); ix.add(book);
    // response actions: checked against the card order
    function act(id) {
      if (!alarm) { hud.flash('No alarm yet. Look around and get ready.', '', 2500); return; }
      if (!ctx.isDone('report')) { sfx.wrong(); hud.flash('Read the panel and report to Mission Control before you act.', 'bad'); ctx.mistake('Acted before reporting the alarm.'); return; }
      const want = K.steps[state.done.length];
      if (!K.steps.includes(id)) { sfx.wrong(); hud.flash(`${ACT[id]} is not on the ${K.name} card.`, 'bad'); ctx.mistake(`${ACT[id]}: not part of the ${K.name.toLowerCase()} procedure.`); return; }
      if (id !== want) { sfx.wrong(); hud.flash(`Not yet: the card says "${ACT[want]}" first.`, 'bad'); ctx.mistake(`Did "${ACT[id]}" before "${ACT[want]}".`); return; }
      state.done.push(id); sfx.good(); hud.cap(`[${ACT[id]} ✓]`, 1800); effects(id);
      if (state.done.length === K.steps.length) { ctx.done('respond'); alarm = false; alarmL.intensity = 0; hud.flash('Procedure complete. Tell Mission Control on the comm panel.', 'good'); }
    }
    function effects(id) {
      if (id === 'mask') { mask.visible = false; document.querySelector('#screen-career').classList.add('cx-masked'); }
      if (id === 'power') lever.rotation.x = Math.PI;
      if (id === 'ext') { extinguished = true; puffs.material.color.set(0xeeeeee); }
      if (id === 'hatch') { door.rotation.y = 0; door.position.set(-0.75, 1.15, -4.25); doorCol.on = true; sfx.door(); }
      if (id === 'gauge') hud.flash('Pressure 14.2 psi and falling 0.4 psi per minute: about 20 minutes before it gets dangerous. Move!', '', 4500);
    }
    makeUsable(mask, { label: 'Oxygen mask', verb: 'Put on', range: 2.2, enabled: () => mask.visible, use: () => act('mask') }); ix.add(mask);
    makeUsable(powerSw, { label: 'Rack 3 power switch', verb: 'Switch off', range: 2.2, enabled: () => !state.done.includes('power'), use: () => act('power') }); ix.add(powerSw);
    makeUsable(ext, { label: 'Fire extinguisher', verb: 'Use', range: 2.2, enabled: () => !state.done.includes('ext'), use: () => act('ext') }); ix.add(ext);
    makeUsable(gauge, { label: 'Pressure gauge', verb: 'Read', range: 2.2, enabled: () => !state.done.includes('gauge'), use: () => act('gauge') }); ix.add(gauge);
    makeUsable(door, { label: 'Hatch', verb: 'Close', range: 2.6, enabled: () => !state.done.includes('hatch'), use: () => {
      if (player.pos.z > -4.2) { sfx.wrong(); hud.flash('Close the hatch from the Node side, so you end up on the safe side.', 'bad'); if (alarm && ctx.isDone('report')) ctx.mistake('Tried to close the hatch from the dangerous side.'); return; }
      act('hatch');
    } }); ix.add(door);
    // restore
    if (ctx.isDone('brief') && !ctx.isDone('respond')) { T.start(); setTimeout(startAlarm, 1500); }
    for (const id of state.done) effects(id);

    return {
      spawn: [0, 6.5, 0, 0],
      markerFor: id => {
        if (id === 'brief' || id === 'report' || id === 'safe') return comm;
        if (id === 'identify') return alarm ? cw : null;
        if (id === 'respond') { const n = K.steps[state.done.length]; return { mask, power: powerSw, ext, gauge, hatch: door, leave: nodeS }[n] || book; }
        return null;
      },
      onEnter: () => { if (!ctx.isDone('brief')) hud.flash('Call Mission Control on the comm panel to begin.', '', 3500); },
      update(dt, blocked) {
        T.update(dt, blocked);
        if (alarm) { alarmT += dt; alarmL.intensity = 8 * (0.5 + 0.5 * Math.sin(alarmT * 6)); if ((alarmT % 1.6) < dt) { sfx.alarm(); hud.cap('[Alarm: beep beep beep]', 1200); } }
        if (puffs.visible) {
          const src = state.kind === 'fire' ? rack3.position : new THREE.Vector3(1.6, 2, 4);
          P.forEach((q, i) => { q.t += dt * (extinguished ? 0.3 : 1); if (q.t > 3) { q.t = 0; q.x = (Math.random() - 0.5) * 0.4; q.z = (Math.random() - 0.5) * 0.8; } const s = 0.4 + q.t; puffs.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(src.x - 0.3 - q.t * 0.25 + q.x, src.y + 0.6 + q.t * 0.5, src.z + q.z * (1 + q.t)), new THREE.Quaternion(), new THREE.Vector3(s, s, s))); });
          puffs.instanceMatrix.needsUpdate = true; if (extinguished) puffs.material.opacity = Math.max(0, puffs.material.opacity - dt * 0.08);
        }
        if (state.kind === 'depress' && alarm) needle.rotation.z = Math.min(1.2, alarmT * 0.02);
        // 'leave' completes by walking through the hatch into the Node
        if (alarm && ctx.isDone('report') && K.steps.includes('leave') && !state.done.includes('leave') && player.pos.z < -4.6) {
          if (K.steps[state.done.length] === 'leave') act('leave');
          else if (!this._warnLeave) { this._warnLeave = true; act('leave'); }
        }
      }
    };
    function finish() {
      document.querySelector('#screen-career').classList.remove('cx-masked');
      finishExercise(ctx, { id: 'emergency', title: 'Emergency Alarm Drill', timer: T, xp: 150,
        science: `The space station has three emergencies that every crew trains for: fire, rapid depressurisation and a toxic atmosphere (such as ammonia from the cooling system). For each one, the crew follows a printed procedure in a fixed order, working closely with Mission Control. Today you had: ${K.name.toLowerCase()}. Crews practise these drills on Earth and again soon after arriving on the station.` });
    }
  }
};
