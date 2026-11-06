// ASTRO LAB Career — Phase 6: Health and Neuroscience. In the medical room: record your baseline health (heart, blood pressure,
// vision, balance), explore a rotatable 3D brain and nervous system, help a crewmate with headache and dizziness in a simulated
// lunar habitat, then pass a knowledge check. Every space-health topic is labelled "confirmed risk" or "still being researched".
// For learning only: not medical advice.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { makeSign } from '../models/props.js';
import { std, box, cyl } from '../models/house.js';
import { makeScreen, infoScreen, makeTerminal } from '../models/centre.js';
import { makePerson, animatePerson } from '../models/humans.js';
import { LOOKS } from '../data/people.js';
import { makeUsable } from '../engine/interact.js';
import { trainingRoom, instructor, timer, finishExercise } from './kit.js';
import { runQuiz } from '../ui/panels.js';
import { openBrainViewer, PARTS } from '../ui/brainViewer.js';
import { h, openModal } from '../../ui/dom.js';

const QUIZ = [
  { q: 'Why do many astronauts feel sick in their first days in space?', options: ['Their eyes and inner ear send the brain mixed signals about movement', 'Space food is too salty', 'The air is too thin', 'Radiation hits the stomach'], explain: 'Space motion sickness comes from a mismatch between vision and the vestibular system. Confirmed, and usually gone in a few days.' },
  { q: 'Which change to astronauts\' eyes is a confirmed risk on long missions?', options: ['Swelling at the back of the eye and changes in vision (SANS)', 'Eyes changing colour', 'Losing all colour vision', 'Eyes getting bigger'], explain: 'SANS is well documented. Its exact cause is still being studied.', hard: false },
  { q: 'Which of these is still being researched rather than confirmed?', options: ['Long-term effects of space radiation on memory', 'Space motion sickness', 'Astronauts getting taller in space', 'Balance problems after landing'], explain: 'Radiation effects on the brain are mostly known from animal studies, so they are still being researched.' },
  { q: 'A crewmate has a headache after a long EVA. What should you check early?', options: ['CO₂ levels: high carbon dioxide can cause headaches', 'Their favourite food', 'The colour of their suit', 'How many photos they took'], explain: 'High CO₂ is a known cause of headaches on spacecraft. It is checked early, along with other causes.' },
  { q: 'Why do body fluids move towards the head in space?', options: ['Gravity no longer pulls them down towards the feet', 'The heart beats faster', 'Astronauts drink more water', 'Spacesuits squeeze the legs'], explain: 'Without gravity, fluid redistributes towards the upper body and head: a confirmed effect.' },
  { q: 'What does the cerebellum mainly do?', options: ['Balance and coordination', 'Vision', 'Hearing', 'Breathing'], explain: 'The cerebellum coordinates movement and balance, working with the inner ear.' },
  { q: 'Why does advice from Mission Control reach the Moon a little late?', options: ['Radio signals take about 1.3 seconds to travel each way', 'Doctors are busy', 'The Moon has no radio', 'Signals go via Mars'], explain: 'Light and radio need about 1.3 s to cross the Earth–Moon distance. For Mars, up to about 20 minutes.' }
];
const SCEN = 'Lunar habitat (simulation)';

export default {
  id: 'medical', title: 'Health & Neuroscience', music: 'centre', ambience: 'vent',
  steps: [
    { id: 'brief', text: 'Talk to Flight Surgeon Dr. Hart' },
    { id: 'baseline', text: 'Record your baseline: heart and blood pressure, vision, balance' },
    { id: 'brain', text: 'Explore the 3D brain: examine at least 6 parts' },
    { id: 'scenario', text: 'Lunar scenario: help Commander Arden (headache and dizziness)' },
    { id: 'quiz', text: 'Pass the knowledge check' }
  ],
  initialState: { steps: {}, mistakes: [], base: {}, seen: [], scen: {} },

  async build(ctx) {
    const { scene, player, ix, hud, sfx, state, world } = ctx;
    trainingRoom(ctx, { w: 14, d: 11, hgt: 3.4, title: 'MEDICAL CENTRE', sub: 'Flight medicine · neuroscience', light: 1.05 });
    const T = timer(ctx, 480);
    const white = std(0xf2f4f6, { roughness: 0.5 });
    // exam bed, BP station, eye chart, balance board
    const bed = new THREE.Group(); box(0.9, 0.08, 2, white, 0, 0.75, 0, bed); box(0.9, 0.7, 0.1, std(0x8a90a0), 0, 0.37, -0.9, bed); box(0.9, 0.7, 0.1, std(0x8a90a0), 0, 0.37, 0.9, bed); bed.position.set(-5.4, 0, -3.4); scene.add(bed); player.addBox(-5.9, -4.9, -4.4, -2.4, 0, 0.9);
    const bp = new THREE.Group(); box(0.4, 1.1, 0.3, white, 0, 0.55, 0, bp); box(0.3, 0.22, 0.04, std(0x1a1d24), 0, 1.25, 0.12, bp); const cuff = cyl(0.06, 0.06, 0.18, std(0x2b4f8f), 0.25, 1.0, 0.1, bp, 12); cuff.rotation.z = Math.PI / 2; bp.position.set(-3.6, 0, -4.9); scene.add(bp); player.addBox(-3.85, -3.35, -5.1, -4.7, 0, 1.4);
    const chart = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 384); x.fillStyle = '#111'; x.textAlign = 'center'; ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P'].forEach((t, i) => { x.font = `bold ${80 - i * 12}px monospace`; x.fillText(t, 128, 80 + i * 55); }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), std(0xffffff, { map: chart })); eye.position.set(6.95, 1.6, -2); eye.rotation.y = -Math.PI / 2; scene.add(eye);
    const tape = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.08), std(0x2b6ad8)); tape.rotation.x = -Math.PI / 2; tape.position.set(3.0, 0.006, -2); scene.add(tape);
    const board = new THREE.Group(); box(0.7, 0.08, 0.5, std(0x3a3f4a), 0, 0.04, 0, board); box(0.6, 0.02, 0.4, std(0x2e8a4a), 0, 0.09, 0, board); board.position.set(2, 0, 2.6); scene.add(board);
    for (const [o, t, s, x, z, r] of [[bp, 'HEART & BP', '', -3.6, -5.48, 0], [eye, 'VISION', 'Stand on the blue line', 6.98, -0.9, -Math.PI / 2], [board, 'BALANCE', 'Stand on the board', 2, 5.48, Math.PI]]) { const sg = makeSign(t, s, 1.0); sg.position.set(x, 2.3, z); sg.rotation.y = r; scene.add(sg); }
    // records terminal and the holo table
    const rec = makeTerminal(infoScreen('HEALTH RECORDS', ['Astronaut medical file', ['Baseline: not recorded', '#ffc857']], { w: 512, hgt: 320 })); rec.position.set(-6.4, 0, 1.2); rec.rotation.y = Math.PI / 2; scene.add(rec); player.addBox(-6.7, -6.1, 0.9, 1.5, 0, 1.3);
    const holo = new THREE.Group(); cyl(0.6, 0.7, 0.9, std(0x2a2d33, { roughness: 0.4 }), 0, 0.45, 0, holo, 28); cyl(0.55, 0.55, 0.02, MAT.glow(0x5ad8ff, 1.2), 0, 0.91, 0, holo, 28);
    const mini = new THREE.Group(); for (const [x, y, z, s, c] of [[-0.12, 0.1, 0.05, 0.18, 0x6aa8ff], [0.12, 0.1, 0.05, 0.18, 0x6aa8ff], [-0.12, 0.13, -0.12, 0.16, 0x7ad8a0], [0.12, 0.13, -0.12, 0.16, 0x7ad8a0], [0, -0.04, -0.2, 0.12, 0xd08aff]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 10), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 })); m.position.set(x, y, z); mini.add(m); }
    mini.position.y = 1.35; holo.add(mini); holo.position.set(0, 0, -2.6); scene.add(holo); player.addBox(-0.7, 0.7, -3.3, -1.9, 0, 1);
    const hs = makeSign('NEURO LAB', '3D brain model', 1.2); hs.position.set(0, 2.5, -5.48); scene.add(hs);
    // the lunar habitat simulator corner (east): a curtained bay with a crewmate
    const bay = new THREE.Group(); box(0.05, 2.4, 3.6, std(0x9aa3b2), 0, 1.2, 0, bay); bay.position.set(3.6, 0, 3.4); scene.add(bay);
    const bs = makeSign('LUNAR HABITAT SIM', 'Medical scenario', 1.4, '#1e2a52'); bs.position.set(5.3, 2.6, 5.48); bs.rotation.y = Math.PI; scene.add(bs);
    const cot = new THREE.Group(); box(0.8, 0.4, 1.9, std(0x5a6e8c), 0, 0.2, 0, cot); cot.position.set(5.6, 0, 3.6); scene.add(cot); player.addBox(5.2, 6.0, 2.65, 4.55, 0, 0.5);
    const arden = makePerson(LOOKS.commander); arden.root.position.set(5.6, 0.12, 2.5); arden.root.rotation.y = Math.PI * 0.95; scene.add(arden.root);
    const mon = makeScreen(0.6, 0.4, infoScreen('HABITAT', ['CO₂: —', 'Pressure: —'], { w: 384, hgt: 256 }), [384, 256]); mon.position.set(6.95, 1.6, 4.2); mon.rotation.y = -Math.PI / 2; scene.add(mon);
    const doc = instructor(ctx, LOOKS.medic, 'Dr. Hart', [-2.6, -0.6, Math.PI * 0.6], () => talkHart());
    function talkHart() {
      if (!ctx.isDone('brief')) return [
        { who: 'Dr. Hart', text: 'Hello {name}, I\'m Dr. Hart, a flight surgeon: a doctor for astronauts. Space changes the human body, and your brain most of all.' },
        { who: 'Dr. Hart', text: 'First we record your baseline: your normal numbers on Earth. Then you\'ll explore a 3D brain, help a crewmate in our lunar habitat simulator and do a short check.' },
        { who: 'Dr. Hart', text: 'One rule in here: we always say what is a confirmed risk and what is still being researched. And this is training, not medical advice.', do: () => { if (ctx.done('brief')) T.start(); } }];
      const tip = { baseline: 'Three stations: heart and blood pressure, the eye chart and the balance board. Then the record saves itself.', brain: 'The neuro lab table opens the 3D model. Turn it and tap each part.', scenario: 'Commander Arden is in the lunar habitat simulator in the corner. Treat it like the real thing.', quiz: 'The knowledge check is on the records terminal.' }[ctx.current()?.id];
      return [{ who: 'Dr. Hart', text: tip || 'Well done.' }];
    }
    // baseline stations
    const hr = 58 + Math.floor(Math.random() * 18), sys = 108 + Math.floor(Math.random() * 14), dia = 68 + Math.floor(Math.random() * 10);
    const baseDone = () => { if (['bp', 'vision', 'balance'].every(k => state.base[k]) && ctx.done('baseline')) { rec.userData.screen?.redraw?.(infoScreen('HEALTH RECORDS', [`Heart rate ${state.base.bp.hr} bpm · BP ${state.base.bp.sys}/${state.base.bp.dia}`, `Vision ${state.base.vision} · Balance ${state.base.balance}`, ['Baseline recorded ✓', '#3fe0a0']], { w: 512, hgt: 320 })); hud.flash('Baseline recorded. Next: the 3D brain in the neuro lab.', 'good'); } };
    makeUsable(bp, { label: 'Blood pressure monitor', verb: 'Measure', range: 2.2, enabled: () => ctx.isDone('brief') && !state.base.bp, use: async () => {
      ctx.input.releaseLock(); sfx.ui(); hud.cap('[Cuff inflates: pssshhh... beep]', 2200);
      await new Promise(r => setTimeout(r, 1500));
      state.base.bp = { hr, sys, dia };
      openModal({ title: '❤ Heart and blood pressure', body: h('div', {}, h('p', { class: 'cx-vitals' }, `Heart rate: ${hr} beats per minute`, h('br'), `Blood pressure: ${sys}/${dia} mmHg`), h('p', {}, 'In space, fluid shifts towards the head and the heart doesn\'t have to work against gravity. Over months it can shrink a little, a bit like an unused muscle.'), h('span', { class: 'cx-tag good' }, '✅ Confirmed effect'), h('p', { class: 'muted tiny' }, 'For learning only. Not medical advice.')) });
      baseDone();
    } }); ix.add(bp);
    makeUsable(eye, { label: 'Eye chart', verb: 'Read', range: 5, enabled: () => ctx.isDone('brief') && !state.base.vision, use: async () => {
      if (Math.hypot(player.pos.x - 3.0, player.pos.z + 2) > 0.8) { hud.flash('Stand on the blue line first, so the test is fair.', 'bad'); return; }
      ctx.input.releaseLock();
      const r = await runQuiz({ title: '👁 Vision test', intro: 'Read the smallest line you can on the chart. Which letters are on the third line?', questions: [{ q: 'Third line from the top:', options: ['T O Z', 'F P', 'L P E D', 'T C Z'] }] });
      state.base.vision = r.correct ? '6/6 (normal)' : 'retest needed'; if (!r.correct) hud.flash('Recorded as "retest needed". Look again carefully next time.', '', 3000);
      openModal({ title: '👁 Vision in space', body: h('div', {}, h('p', {}, 'Your result is saved as your baseline. Astronauts\' eyes are checked before, during and after long missions, because many develop swelling at the back of the eye and need stronger glasses in space (SANS).'), h('span', { class: 'cx-tag good' }, '✅ Confirmed risk'), h('p', {}, 'Why it happens is ', h('b', {}, 'still being researched'), ': fluid shifts are the leading idea.'), h('span', { class: 'cx-tag warn' }, '🔬 Still being researched'), h('p', { class: 'muted tiny' }, 'For learning only. Not medical advice.')) });
      baseDone();
    } }); ix.add(eye);
    let balT = 0, balOn = false;
    makeUsable(board, { label: 'Balance board', verb: 'Step on', range: 2.2, enabled: () => ctx.isDone('brief') && !state.base.balance && !balOn, use: () => { player.pos.set(2, 0.08, 2.6); balOn = true; balT = 0; player.frozenByScene = true; hud.flash('Stand still for 5 seconds with your eyes closed (don\'t touch the controls).', '', 4000); } }); ix.add(board);
    // brain viewer
    makeUsable(holo, { label: '3D brain model', verb: 'Explore', range: 2.6, enabled: () => ctx.isDone('baseline'), use: async () => {
      ctx.input.releaseLock();
      await openBrainViewer({ onSeen: id => { if (!state.seen.includes(id)) state.seen.push(id); if (state.seen.length >= 6 && ctx.done('brain')) hud.flash('Great exploring! Next: the lunar habitat scenario.', 'good'); } });
      if (!ctx.isDone('brain')) hud.flash(`${state.seen.length} of 6 parts examined so far.`, '', 2500);
    } }); ix.add(holo);
    // lunar scenario
    const co2 = 4800 + Math.floor(Math.random() * 1200);
    makeUsable(arden.root, { label: 'Commander Arden', verb: 'Help', range: 2.6, enabled: () => ctx.isDone('brain') && !ctx.isDone('scenario'), use: () => scenario() }); ix.add(arden.root);
    makeUsable(mon, { label: 'Habitat monitor', verb: 'Check', range: 2.6, enabled: () => ctx.isDone('brain') && !state.scen.co2, use: () => { state.scen.co2 = true; sfx.ui(); mon.userData.screen.redraw(infoScreen('HABITAT', [[`CO₂: ${co2} ppm  ⚠ HIGH`, '#ff6a6a'], 'Pressure: 10.2 psi', 'O₂: 21.1%', 'Scrubber: fan fault'], { w: 384, hgt: 256 })); hud.flash(`CO₂ is ${co2} ppm, far above the normal ~2,500 limit. That could explain the headache!`, 'bad', 5000); } }); ix.add(mon);
    async function scenario() {
      const S = state.scen;
      if (!S.asked) await ctx.talk([
        { who: `Commander Arden (${SCEN})`, text: 'Hey, {name}. I\'ve had a pounding headache since I came in from the spacewalk, and the room spins when I turn my head. Maybe it\'s nothing.' },
        { who: ctx.name, text: '(What do you do first?)', choices: [{ text: 'Ask her to sit down and rest while you ask some questions', goto: 'rest' }, { text: 'Give her painkillers straight away', goto: 'pill' }, { text: 'Tell her to walk it off', goto: 'walk' }] },
        { id: 'pill', who: 'Dr. Hart (radio)', text: 'Hold on. Medicine comes after you understand what\'s happening, and on a mission only on the flight surgeon\'s advice. Make her safe and ask questions first.', do: () => ctx.mistake('Gave medicine before assessing the crewmate.'), goto: 'rest' },
        { id: 'walk', who: 'Dr. Hart (radio)', text: 'With dizziness she could fall. Sit her down first.', do: () => ctx.mistake('Told a dizzy crewmate to keep moving.'), goto: 'rest' },
        { id: 'rest', who: 'Commander Arden', text: 'Okay, sitting. What do you want to know?', choices: [{ text: 'Did you hit your head? Any nausea, blurry vision?', goto: 'q1' }, { text: 'What did you eat for breakfast?', goto: 'q0' }] },
        { id: 'q0', who: 'Commander Arden', text: 'Porridge... is that important? (Ask about injury and symptoms instead.)', do: () => ctx.mistake('Asked an unhelpful question during the assessment.'), goto: 'q1' },
        { id: 'q1', who: 'Commander Arden', text: 'No bump. A bit sick, no blurry vision. The headache got worse in here. Ivan felt a headache this morning too.' },
        { who: ctx.name, text: '(Two people with headaches in the same room. What might you check?)', choices: [{ text: 'Check the habitat CO₂ level on the monitor', goto: 'c1' }, { text: 'Nothing: headaches are normal in space', goto: 'c0' }] },
        { id: 'c0', who: 'Dr. Hart (radio)', text: 'Headaches are common up there, but two crew at once points to the air. Check the habitat readings.', do: () => ctx.mistake('Did not suspect the habitat air.'), goto: 'c1' },
        { id: 'c1', who: 'Dr. Hart (radio)', text: 'Go and check the monitor, then talk to her again.', do: () => { S.asked = true; }, goto: 'end' }
      ]);
      if (!S.asked) return;
      if (!S.co2) { hud.flash('Check the habitat monitor on the wall.', '', 3000); return; }
      await ctx.talk([
        { who: ctx.name, text: '(CO₂ is high. What now?)', choices: [{ text: 'Move her to fresh air in the next module, report to Mission Control, fix the scrubber', goto: 'ok' }, { text: 'Open the outer hatch for fresh air', goto: 'bad' }] },
        { id: 'bad', who: 'Dr. Hart (radio)', text: 'On the Moon that would empty the habitat into a vacuum! Fresh air means another module with working life support.', do: () => ctx.mistake('Suggested opening the outer hatch on the Moon.'), goto: 'ok' },
        { id: 'ok', who: 'Mission Control (1.3 s delay)', text: '...Copy, habitat. Move crew to the Node, swap the scrubber fan. Flight surgeon wants her vitals every 15 minutes and a balance check later.' },
        { who: 'Commander Arden', text: 'Already feeling better in here. Thanks, {name}. Good catch on the CO₂.' },
        { who: 'Dr. Hart', text: 'Excellent. High CO₂ causing headaches is a confirmed problem on spacecraft. The dizziness when turning her head could also be the inner ear readapting, which we\'d keep watching.', do: () => ctx.done('scenario') }]);
      hud.flash('Scenario complete. Take the knowledge check on the records terminal.', 'good');
    }
    makeUsable(rec, { label: 'Records terminal', verb: 'Use', range: 2.4, enabled: () => ctx.isDone('scenario') && !ctx.isDone('quiz'), use: async () => {
      ctx.input.releaseLock();
      const qs = [...QUIZ].sort(() => Math.random() - 0.5).slice(0, 5);
      const r = await runQuiz({ title: '🧠 Knowledge check', intro: 'Five questions. You need 3 or more to pass.', questions: qs });
      for (const w of r.wrong || []) ctx.mistake(`Quiz: ${w}`);
      if (r.correct < 3) { hud.flash(`${r.correct} of 5. Review the brain model and try again.`, 'bad', 4000); return; }
      ctx.done('quiz'); finish();
    } }); ix.add(rec);
    // restore
    if (ctx.isDone('brief')) T.start();
    if (state.scen.co2) mon.userData.screen.redraw(infoScreen('HABITAT', [[`CO₂: ${co2} ppm  ⚠ HIGH`, '#ff6a6a'], 'Pressure: 10.2 psi'], { w: 384, hgt: 256 }));
    return {
      spawn: [-1.5, 3.5, Math.PI * 0.2, 0],
      markerFor: id => ({ brief: doc.rig.root, baseline: !state.base.bp ? bp : !state.base.vision ? (Math.hypot(player.pos.x - 3, player.pos.z + 2) > 0.8 ? tape : eye) : board, brain: holo, scenario: state.scen.asked && !state.scen.co2 ? mon : arden.root, quiz: rec }[id] || null),
      onEnter: () => { if (!ctx.isDone('brief')) hud.flash('Talk to Dr. Hart to begin.', '', 3500); },
      test: { bal: () => [balOn, balT] },
      update(dt, blocked) {
        doc.update(dt); T.update(dt, blocked); mini.rotation.y += dt * 0.6;
        animatePerson(arden, dt, { lookAt: world.camera.position.distanceTo(arden.root.position) < 6 ? world.camera.position : null, talking: ctx.dlg.active && /Arden/.test(ctx.dlg.el.querySelector('.cx-who')?.textContent || '') });
        if (balOn && !blocked) {
          balT += dt; const sway = Math.sin(balT * 2.3) * 0.02; world.camera.rotation.z = sway; hud.setReadout('Balance', [['Time', `${balT.toFixed(1)} / 5 s`, ''], ['Sway', `${Math.round(Math.abs(sway) * 900)} mm`, 'good']]);
          if (balT >= 5) { balOn = false; player.frozenByScene = false; world.camera.rotation.z = 0; hud.setReadout(null); state.base.balance = 'steady'; sfx.good();
            openModal({ title: '⚖ Balance', body: h('div', {}, h('p', {}, 'Baseline saved: steady. After landing, astronauts are re-tested here. For days, many sway and stumble while the inner ear and cerebellum re-learn gravity.'), h('span', { class: 'cx-tag good' }, '✅ Confirmed effect'), h('p', { class: 'muted tiny' }, 'For learning only. Not medical advice.')) });
            baseDone(); }
        }
      }
    };
    function finish() {
      finishExercise(ctx, { id: 'medical', title: 'Health & Neuroscience', timer: T, xp: 220, badge: 'medical-observer',
        science: 'Confirmed: space motion sickness, fluid shifting to the head, vision changes (SANS), bone and muscle loss, and balance problems after landing. Still being researched: the long-term effects of space radiation on the brain, what the upward shift of the brain means over years, and how Mars-length missions affect thinking. Flight surgeons track every astronaut before, during and after flight to learn more. This training is for learning only and is not medical advice.' });
    }
  }
};
