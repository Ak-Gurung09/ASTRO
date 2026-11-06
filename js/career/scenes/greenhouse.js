// ASTRO LAB Career — Phase 5: Space Greenhouse and Life Support. In the lunar surface analogue dome:
// buy parts on a limited budget, build a greenhouse in 11 steps, plant two crops and run Mission GREENHOUSE-01:
// keep temperature, humidity, water, nutrients, light, air, CO2/O2 and power in range, fix faults, recycle water, harvest, report.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { makeSign } from '../models/props.js';
import { std, box, cyl } from '../models/house.js';
import { makeTerminal, makeScreen, infoScreen } from '../models/centre.js';
import { LOOKS } from '../data/people.js';
import { makeUsable } from '../engine/interact.js';
import { trainingRoom, instructor, timer, finishExercise } from './kit.js';
import { runQuiz, readDoc, pickOne } from '../ui/panels.js';
import { h, openModal } from '../../ui/dom.js';
import { CATALOG, CAT_MAP, CROPS, STAGES, BUILD, FAULTS, REGOLITH_FACTS, newSystems, stepSystems, cropHealth } from '../data/greenhouse.js';

const REPORT_Q = [
  { q: 'Why does a space greenhouse recycle its water?', options: ['Shipping water from Earth is very expensive, so every litre is reused', 'Recycled water makes plants grow twice as fast', 'Plants can only drink recycled water', 'To make the greenhouse lighter at launch'], explain: 'Launching anything costs a lot, so water is cleaned and reused again and again.' },
  { q: 'Why can\'t raw lunar regolith be used as soil straight away?', options: ['It has no organic matter or nitrogen and its grains are sharp', 'It is radioactive and glows', 'It is too wet', 'It is made of sugar'], explain: 'Regolith is crushed rock and glass: it must be sieved, washed and mixed with compost and nutrients.' },
  { q: 'Why do many space greenhouses use red and blue LEDs?', options: ['Plants use red and blue light most for photosynthesis, so less power is wasted', 'Green light is banned in space', 'Red and blue LEDs are the only ones that work in a vacuum', 'They keep insects away'], explain: 'Chlorophyll absorbs mostly red and blue light. Efficient lights save power and make less heat.' },
  { q: 'What should you switch off first if power drops?', options: ['Non-essential loads like extra lighting hours, so life support keeps running', 'The heater', 'The air fans', 'The control panel'], explain: 'Protect life support first; plants can survive a few dimmer days.' },
  { q: 'Plants in the greenhouse give out...', options: ['Oxygen, and they take in carbon dioxide', 'Carbon dioxide only', 'Nitrogen', 'Nothing at all'], explain: 'Photosynthesis uses CO₂ and light to make sugar and releases O₂: a living part of life support.' }
];

export default {
  id: 'greenhouse', title: 'Space Greenhouse & Life Support', music: 'centre', ambience: 'vent',
  steps: [
    { id: 'brief', text: 'Talk to Dr. Osei, the mission botanist' },
    { id: 'store', text: 'Buy the parts you need at the supply terminal' },
    { id: 'build', text: 'Build the greenhouse: 11 steps' },
    { id: 'plant', text: 'Choose and plant two crops' },
    { id: 'grow', text: 'Mission GREENHOUSE-01: keep both crops healthy until harvest' },
    { id: 'harvest', text: 'Harvest both crops' },
    { id: 'report', text: 'File the mission report' }
  ],
  initialState: { steps: {}, mistakes: [], bought: [], spent: 0, built: [], regolithOK: false, crops: [], prog: {}, sys: null, plan: null, faultAt: {}, warned: {}, yield: {}, day: 0 },

  async build(ctx) {
    const { scene, player, ix, hud, sfx, state } = ctx;
    trainingRoom(ctx, { w: 26, d: 22, hgt: 9, title: 'LUNAR SURFACE ANALOGUE', sub: 'Greenhouse build site', bg: 0x05060a, light: 0.8 });
    // grey regolith floor over the hangar floor, and a painted Earth on the far wall
    const rg = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#8a8a88'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 9000; i++) { const g = 100 + Math.random() * 80; x.fillStyle = `rgba(${g},${g},${g - 4},.5)`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 9); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const reg = new THREE.Mesh(new THREE.PlaneGeometry(25.6, 21.6), std(0xffffff, { map: rg, roughness: 1 })); reg.rotation.x = -Math.PI / 2; reg.position.y = 0.004; reg.receiveShadow = true; scene.add(reg);
    const earth = new THREE.Mesh(new THREE.CircleGeometry(1.4, 40), std(0x3a6ad8, { emissive: 0x2a4a9a, emissiveIntensity: 0.6 })); earth.position.set(7, 6.4, -10.95); scene.add(earth);
    const budget = Math.round(1220 + (ctx.diff.budget - 0.65) * 800), refunds = ctx.diff.id !== 'realistic';
    const has = id => state.bought.includes(id);
    const T = timer(ctx, 600);
    // ---- the supply terminal
    const term = makeTerminal(infoScreen('SUPPLY DEPOT', [`Budget: ${budget} credits`, ['Order parts here', '#ffc857']], { w: 512, hgt: 320 })); term.position.set(-10.5, 0, -7); term.rotation.y = Math.PI / 2; scene.add(term); player.addBox(-10.8, -10.2, -7.3, -6.7, 0, 1.3);
    const pallets = new THREE.Group(); scene.add(pallets); pallets.position.set(-10, 0, -3);
    const drawPallets = () => { pallets.clear(); state.bought.filter(id => !usedBy(id)).forEach((id, i) => { box(0.7, 0.5, 0.6, std(0xd9a441, { roughness: 0.8 }), (i % 3) * 0.8, 0.25 + Math.floor(i / 9) * 0.52, Math.floor(i / 3) % 3 * 0.75, pallets); }); };
    const usedBy = id => BUILD.some(b => state.built.includes(b.id) && b.needs.flat().includes(id));
    function store() {
      ctx.input.releaseLock();
      const sel = new Set(state.bought), cats = [...new Set(CATALOG.map(c => c.cat))];
      const total = h('p', { class: 'cx-total' });
      const cost = () => [...sel].reduce((a, id) => a + CAT_MAP[id].cost, 0);
      const upd = () => { const c = cost(); total.innerHTML = `Spent: <b>${c}</b> of ${budget} credits${refunds ? '' : ' · Realistic: no refunds'}`; total.style.color = c > budget ? '#ff8a8a' : ''; };
      const body = h('div', {}, h('p', {}, 'Everything must be shipped to the Moon, so every credit counts. Required parts are marked ★. For lights and growing beds, pick one option.'),
        ...cats.map(cat => h('div', {}, h('h4', {}, cat), h('div', { class: 'cx-ticks' }, CATALOG.filter(c => c.cat === cat).map(c => {
          const locked = state.bought.includes(c.id) && (usedBy(c.id) || !refunds);
          return h('label', { class: 'cx-tick' }, h('input', { type: 'checkbox', checked: sel.has(c.id), disabled: locked, onchange: e => { e.target.checked ? sel.add(c.id) : sel.delete(c.id); upd(); } }), ' ', h('b', {}, `${c.need ? '★ ' : ''}${c.name}`), ` · ${c.cost} cr`, h('small', { class: 'muted', style: 'display:block;margin-left:24px' }, c.desc));
        })))), total);
      upd();
      const m = openModal({ title: '🛒 Supply depot', label: 'Supply depot', wide: true, body, foot: [h('button', { class: 'btn primary', onclick: () => {
        const c = cost(); if (c > budget) { sfx.wrong(); hud.flash(`Over budget by ${c - budget} credits.`, 'bad'); return; }
        const miss = CATALOG.filter(x => x.need && !sel.has(x.id)), noLight = !sel.has('ledBasic') && !sel.has('ledEff'), noBed = !sel.has('hydro') && !sel.has('regolith');
        if (miss.length || noLight || noBed) { sfx.wrong(); hud.flash(`Still missing: ${[...miss.map(x => x.name), noLight ? 'grow lights' : null, noBed ? 'growing beds' : null].filter(Boolean).join(', ')}.`, 'bad', 4500); if (!ctx.isDone('store')) ctx.mistake('Tried to order an incomplete greenhouse kit.'); return; }
        state.bought = [...sel]; state.spent = c; m.close(); sfx.good(); hud.cap('[Order confirmed: crates delivered to the pallets]', 2500); drawPallets();
        if (ctx.done('store')) hud.flash(`Order placed: ${budget - c} credits left. Start building at the glowing marker.`, 'good', 4000);
        ctx.refreshObjectives();
      } }, 'Place order ✓')] });
    }
    makeUsable(term, { label: 'Supply terminal', verb: 'Order parts at', range: 2.6, enabled: () => ctx.isDone('brief'), use: store }); ix.add(term);

    // ---- the greenhouse parts that appear as you build
    const G = new THREE.Group(); scene.add(G);
    const glass = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.18, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const piece = {
      site: () => { const g = new THREE.Group(); box(11, 0.08, 10, std(0xb8bec8, { roughness: 0.7 }), 0, 0.04, 1, g); for (let x = -5; x <= 5; x += 2.2) box(0.03, 0.09, 10, std(0x8a90a0), x, 0.045, 1, g); return g; },
      frame: () => { const g = new THREE.Group(); for (let z = -3.8; z <= 5.8; z += 1.6) { const r = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.06, 6, 32, Math.PI), MAT.metal(0xb8bec8)); r.position.set(0, 0, z); r.scale.y = 0.62; g.add(r); } return g; },
      shell: () => { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 9.8, 40, 1, true, -Math.PI / 2, Math.PI), glass); s.rotation.x = -Math.PI / 2; s.scale.set(1, 1, 0.62); s.position.z = 1; g.add(s); const w = new THREE.Mesh(new THREE.CircleGeometry(5.5, 40, 0, Math.PI), glass); w.scale.y = 0.62; w.position.z = -3.9; g.add(w); return g; },
      airlock: () => { const g = new THREE.Group(); box(2, 2.4, 1.6, std(0xe8ebf0, { roughness: 0.5 }), 0, 1.2, 6.7, g); box(1, 2, 0.05, std(0x3a3f4a), 0, 1, 7.52, g); return g; },
      power: () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const p = new THREE.Group(); box(1.6, 0.04, 1, std(0x1a2a5a, { metalness: 0.4, roughness: 0.3 }), 0, 0, 0, p); p.rotation.x = -0.5; p.position.set(-8.6 + i * 1.8, 1.1, 5.4); g.add(p); cyl(0.04, 0.04, 1, MAT.metal(), -8.6 + i * 1.8, 0.5, 5.4, g, 6); } box(0.8, 0.6, 0.5, std(0x3a3f4a), -6.6, 0.3, 4.4, g); return g; },
      lights: () => { const g = new THREE.Group(), eff = has('ledEff'); for (const x of [-1.3, 1.3]) for (const z of [-1.5, 0, 1.5]) box(1.0, 0.05, 0.3, MAT.glow(eff ? 0xd04aff : 0xfff4e0, 1.4), x, 2.4, z, g); const l = new THREE.PointLight(eff ? 0xd06aff : 0xfff2e0, 6, 8, 1.4); l.position.set(0, 2.2, 0); g.add(l); return g; },
      air: () => { const g = new THREE.Group(); box(0.8, 1.2, 0.6, std(0xd9dce2), -4.6, 0.6, -2.6, g); cyl(0.25, 0.25, 0.1, std(0x3a3f4a), -4.6, 0.9, -2.28, g).rotation.x = Math.PI / 2; box(0.5, 0.7, 0.4, std(0xc8502a), -3.6, 0.35, -2.8, g); return g; },
      water: () => { const g = new THREE.Group(); cyl(0.55, 0.55, 1.5, std(0x5a9ad8, { roughness: 0.3 }), 4.2, 0.75, -2.8, g); box(0.4, 0.3, 0.3, std(0x3a3f4a), 3.4, 0.15, -2.4, g); box(0.4, 0.3, 0.3, std(0x3a3f4a), 3.4, 0.15, -3.1, g); return g; },
      recycler: () => { const g = new THREE.Group(); box(0.9, 1.3, 0.7, std(0xe8ebf0), 4.2, 0.65, 2.4, g); box(0.3, 0.3, 0.05, std(0x2b6ad8), 4.2, 0.9, 2.02, g); return g; },
      beds: () => { const g = new THREE.Group(), soil = has('hydro') ? std(0xf2f2f2) : std(0x6a5a48, { roughness: 1 }); for (const x of [-1.3, 1.3]) { box(1.1, 0.5, 4.2, std(0xd9dce2), x, 0.25, 0, g); box(1.0, 0.04, 4.1, has('hydro') ? std(0x7ab8d8, { roughness: 0.2 }) : soil, x, 0.51, 0, g); } return g; },
      control: () => { const g = new THREE.Group(); return g; }
    };
    const markers = {}, built = {};
    function showPiece(id) { const p = piece[id](); p.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = true; } }); G.add(p); built[id] = p; }
    BUILD.forEach((b, i) => {
      const m = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 32), MAT.glow(0xffc857, 0.8)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.06; m.add(ring);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), new THREE.MeshBasicMaterial({ visible: false })); post.position.y = 0.7; m.add(post);
      m.position.set(b.at[0], 0, b.at[1]); scene.add(m); markers[b.id] = m;
      makeUsable(m, { label: `Step ${i + 1}: ${b.name}`, verb: 'Build', range: 2.8, enabled: () => ctx.isDone('store') && nextBuild() === b && !busy, use: () => doBuild(b) }); ix.add(m);
    });
    const nextBuild = () => BUILD.find(b => !state.built.includes(b.id));
    let busy = false;
    async function doBuild(b) {
      const miss = b.needs.filter(n => Array.isArray(n) ? !n.some(has) : !has(n));
      if (miss.length) { sfx.wrong(); hud.flash(`You need: ${miss.map(n => Array.isArray(n) ? n.map(x => CAT_MAP[x].name).join(' or ') : CAT_MAP[n].name).join(', ')}. Order it at the supply terminal.`, 'bad', 4500); return; }
      if (b.id === 'beds' && has('regolith') && !has('hydro') && !state.regolithOK) {
        ctx.input.releaseLock();
        if (!has('processor')) {
          if (!state.warned.regolith) { state.warned.regolith = true; ctx.mistake('Planned to grow crops in raw regolith with no way to process it.'); }
          await readDoc({ title: '🪨 Raw regolith won\'t work', body: h('div', {}, h('p', {}, 'You tip a bag of raw regolith into the bed. Dr. Osei shakes her head.'), h('ul', {}, REGOLITH_FACTS.map(f => h('li', {}, f))), h('p', {}, h('b', {}, 'Order the regolith processor or hydroponic trays at the supply terminal.'))), confirm: 'Understood' });
          return;
        }
        await readDoc({ title: '🪨 Process the regolith', body: h('div', {}, h('ul', {}, REGOLITH_FACTS.map(f => h('li', {}, f))), h('p', {}, 'Run each stage of the processor:')), ticks: ['Sieve out sharp rocks and fine dust', 'Wash out harmful salts', 'Mix in compost, nitrogen and nutrients'], confirm: 'Fill the beds ▸' });
        state.regolithOK = true;
      }
      busy = true; ctx.input.releaseLock(); sfx.ui(); hud.cap(`[Clank, whirr: ${b.name.toLowerCase()}]`, 1600);
      const r = markers[b.id].children[0]; r.material.color.set(0x5ad8ff); r.material.emissive.set(0x5ad8ff);
      await new Promise(res => setTimeout(res, 1200));
      busy = false; state.built.push(b.id); showPiece(b.id); markers[b.id].visible = false; drawPallets(); sfx.place();
      if (b.id === 'beds' && has('hydro')) state.regolithOK = true;
      const n = state.built.length; hud.flash(`Step ${n} of 11 done: ${b.name}.`, 'good', 2500);
      ctx.steps.find(s => s.id === 'build').text = `Build the greenhouse: ${n} of 11 steps`; ctx.refreshObjectives();
      if (n === BUILD.length) { ctx.done('build'); controlScreen.visible = true; hud.flash('Greenhouse complete and pressurised! Talk to Dr. Osei to plant your crops.', 'good', 4500); }
    }
    // control panel (appears with step 11)
    const controlScreen = makeScreen(1.0, 0.65, infoScreen('GREENHOUSE CONTROL', ['Systems offline'], { w: 512, hgt: 320 }), [512, 320]);
    controlScreen.position.set(-4.6, 1.5, 2.2); controlScreen.rotation.y = Math.PI / 2; controlScreen.visible = false; scene.add(controlScreen);
    box(0.1, 1.2, 0.1, MAT.metal(), 0, -0.6, -0.05, controlScreen);
    // plants
    const plantG = new THREE.Group(); scene.add(plantG); let plantMeshes = [];
    function makePlants() {
      plantG.clear(); plantMeshes = [];
      state.crops.forEach((c, bi) => { const x = bi ? 1.3 : -1.3; for (let k = 0; k < 10; k++) { const p = new THREE.Group(); const stem = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), std(0x4a9a3a)); stem.position.y = 0.15; p.add(stem); const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), std(CROPS[c].col)); fruit.position.set(0.05, 0.22, 0.04); fruit.visible = false; p.add(fruit); p.position.set(x + (k % 2 ? 0.25 : -0.25), 0.53, -1.8 + Math.floor(k / 2) * 0.9); plantG.add(p); plantMeshes.push({ p, c, stem, fruit }); } });
    }
    // ---- instructor
    const osei = instructor(ctx, LOOKS.botanist, 'Dr. Osei', [-6.5, -5.5, 0.6], () => talkOsei());
    function talkOsei() {
      if (!ctx.isDone('brief')) return [
        { who: 'Dr. Osei', text: 'Welcome to the lunar surface analogue, {name}. I\'m Dr. Amara Osei, mission botanist. Out here we pretend we\'re on the Moon: no shops, no rain, and every kilogram shipped from Earth.' },
        { who: 'Dr. Osei', text: 'Long missions can\'t carry all their food. A greenhouse grows fresh food, recycles water and even helps make oxygen. Your job: buy the parts, build one, and keep two crops alive until harvest.' },
        { who: 'Dr. Osei', text: `You have ${budget} credits. Choose carefully: cheaper isn't always better. The supply terminal is by the west wall.`, choices: [{ text: 'Can I use Moon dirt as soil?', goto: 'soil' }, { text: 'What will go wrong?', goto: 'faults' }, { text: 'Let\'s build.', goto: 'go' }] },
        { id: 'soil', who: 'Dr. Osei', text: 'Good question. Lunar regolith is cheap because it\'s already here, but raw, it\'s crushed rock and glass with no nutrients. It needs processing first.', goto: 'go' },
        { id: 'faults', who: 'Dr. Osei', text: 'Something always does. Pumps fail, filters clog, and dust can cut your solar power. The control panel shows every reading. Watch it.', goto: 'go' },
        { id: 'go', who: 'Dr. Osei', text: 'Order your parts, then build step by step at the glowing markers.', do: () => { if (ctx.done('brief')) T.start(); } }];
      if (ctx.isDone('build') && !ctx.isDone('plant')) return [{ who: 'Dr. Osei', text: 'Beautiful work. Now choose two crops. Each one likes different conditions, so you\'ll need settings that suit both.', do: () => setTimeout(plant, 50) }];
      const cur = ctx.current()?.id;
      const tip = { store: 'Every ★ part is required. Pick one kind of light and one kind of growing bed.', build: `Next: ${nextBuild()?.name}.`, grow: 'Keep checking the control panel. Each crop shows its ideal range and what is bothering it.', harvest: 'Harvest from the beds when they say Ready.', report: 'File your report on the control panel.' }[cur];
      return [{ who: 'Dr. Osei', text: tip || 'Good work.' }];
    }
    async function plant() {
      while (ctx.dlg.active) await new Promise(r => setTimeout(r, 100)); // let Dr. Osei finish talking first
      if (ctx.isDone('plant')) return;
      ctx.input.releaseLock(); const chosen = [];
      for (let k = 0; k < 2; k++) {
        const id = await pickOne({ title: `🌱 Choose crop ${k + 1} of 2`, cancel: false, intro: k ? 'Pick a second crop. A crop with similar needs is easier to keep happy.' : 'Pick your first crop.', options: Object.entries(CROPS).filter(([i]) => !chosen.includes(i)).map(([i, c]) => ({ id: i, icon: c.icon, name: c.name, desc: `${c.days} days · ${c.temp[0]}–${c.temp[1]} °C · humidity ${c.hum[0]}–${c.hum[1]}% · light ${c.light[0]}–${c.light[1]} h`, note: c.fact })) });
        chosen.push(id);
      }
      state.crops = chosen; state.prog = Object.fromEntries(chosen.map(c => [c, 0])); state.sys = newSystems(); state.day = 0;
      const n = ctx.diff.faults === 'single' ? 2 : ctx.diff.faults === 'linked' ? 3 : 4;
      const pool = ['pump', 'led', 'heater', 'filter', 'co2'].sort(() => Math.random() - 0.5).slice(0, n - (ctx.diff.randomEvents ? 1 : 0)); if (ctx.diff.randomEvents) pool.push('dust');
      const maxD = Math.max(...chosen.map(c => CROPS[c].days));
      state.plan = pool.map((f, i) => [f, Math.round(maxD * (0.15 + i * 0.6 / pool.length))]);
      if (ctx.diff.faults === 'linked' && pool.includes('pump') && !pool.includes('filter')) state.plan.push(['filter', state.plan.find(p => p[0] === 'pump')[1] + 2]);
      makePlants(); ctx.done('plant'); sfx.good();
      hud.flash('Planted! Mission GREENHOUSE-01 has started. Open the control panel and set it up for both crops.', 'good', 5000);
    }
    // ---- mission simulation
    const maxDays = () => Math.max(...state.crops.map(c => CROPS[c].days));
    const rate = () => maxDays() / 240; // sim days per real second
    let link = { powerOK: true, pumpOK: true, regolithOK: true }, panelOpen = null, screenT = 0;
    const stageOf = c => Math.min(5, Math.floor(state.prog[c] / CROPS[c].days * 6));
    const stageAvg = () => state.crops.length ? state.crops.map(stageOf).reduce((a, b) => a + b) / state.crops.length : 0;
    function sim(dt) {
      const S = state.sys; if (!S) return;
      const d = dt * rate(); state.day += d;
      link = stepSystems(S, d, { ledEff: has('ledEff'), regolithOK: state.regolithOK, crops: state.crops.length });
      for (const [f, at] of state.plan) if (state.day >= at && !S.faults[f]) { S.faults[f] = state.day; sfx.alarm(); hud.flash(`⚠ ${FAULTS[f].name}! Check the control panel.`, 'bad', 5000); hud.cap('[Alarm: greenhouse fault]', 2000); }
      for (const f of Object.keys(S.faults)) if (!S.fixed[f] && state.day - S.faults[f] > 6 && !state.warned['f' + f]) { state.warned['f' + f] = true; ctx.mistake(`Left "${FAULTS[f].name}" unfixed for more than 6 days.`); }
      for (const c of state.crops) {
        const { health } = cropHealth(c, S, link); const k = Math.min(1, d * 0.08); state.yield[c] = (state.yield[c] ?? 1) * (1 - k) + health * k;
        state.prog[c] = Math.min(CROPS[c].days, state.prog[c] + d * Math.max(0.15, health));
        if (health < 0.3 && !state.warned['h' + c]) { state.warned['h' + c] = true; ctx.mistake(`${CROPS[c].name} got badly stressed.`); hud.flash(`${CROPS[c].name} is wilting! Check the control panel.`, 'bad'); }
      }
      if (S.water <= 0 && !state.warned.water) { state.warned.water = true; ctx.mistake('The water tank ran dry.'); }
      if (state.crops.every(c => state.prog[c] >= CROPS[c].days) && !ctx.isDone('grow')) { ctx.done('grow'); hud.flash('Both crops are ready! Harvest them from the beds.', 'good', 4000); }
    }
    function drawPlants() {
      for (const m of plantMeshes) { const st = stageOf(m.c), hl = cropHealth(m.c, state.sys, link).health; const s = 0.2 + st * 0.35 + state.prog[m.c] / CROPS[m.c].days * 0.3; m.p.scale.setScalar(m.p.userData.harvested ? 0.001 : s); m.stem.material.color.setHSL(hl > 0.5 ? 0.3 : 0.12, 0.55, 0.32 + hl * 0.08); m.fruit.visible = st >= 4; }
    }
    // control panel UI (live while open)
    function openPanel() {
      ctx.input.releaseLock();
      const S = state.sys; const out = h('div', { class: 'cx-gh' });
      const slider = (k, label, min, max, step, unit) => h('label', { class: 'cx-slider' }, h('span', {}, label), h('input', { type: 'range', min, max, step, value: S.set[k], oninput: e => { S.set[k] = +e.target.value; e.target.nextSibling.textContent = `${S.set[k]}${unit}`; } }), h('em', {}, `${S.set[k]}${unit}`));
      const controls = h('div', { class: 'cx-gh-ctrl' }, slider('temp', 'Temperature setpoint', 10, 30, 1, ' °C'), slider('hum', 'Humidity setpoint', 30, 90, 5, ' %'), slider('lightH', 'Light hours per day', 8, 24, 1, ' h'), slider('dose', 'Nutrient dosing', 0, 2, 0.5, '×'),
        h('label', { class: 'cx-tick' }, h('input', { type: 'checkbox', checked: !!S.set.fan, onchange: e => { S.set.fan = e.target.checked ? 1 : 0; } }), ' Air fans on'));
      const faults = h('div', { class: 'cx-gh-faults' });
      const read = h('div', { class: 'cx-gh-read' }), crops = h('div', { class: 'cx-gh-crops' });
      const draw = () => {
        const r = (l, v, ok) => `<div class="${ok ? 'good' : 'bad'}"><span>${l}</span><em>${v}</em></div>`;
        read.innerHTML = `<b>Day ${Math.floor(state.day)}</b>` + r('Temperature', `${S.temp.toFixed(1)} °C`, S.temp > 12 && S.temp < 29) + r('Humidity', `${S.hum.toFixed(0)} %`, S.hum > 40 && S.hum < 85) + r('Water tank', `${S.water.toFixed(0)} L`, S.water > 40) + r('Nutrients (EC)', S.ec.toFixed(1), S.ec >= 1.2 && S.ec <= 2.5) + r('Light', `${S.lightH.toFixed(0)} h/day`, true) + r('Airflow', S.air ? 'on' : 'off', !!S.air) + r('CO₂', `${Math.round(S.co2)} ppm`, S.co2 < 2000) + r('O₂', `${S.o2.toFixed(1)} %`, S.o2 < 23.5) + r('Power margin', `${S.power} kW`, S.power >= 0);
        crops.innerHTML = state.crops.map(c => { const C = CROPS[c], { health, issues } = cropHealth(c, S, link); return `<div class="cx-gh-crop"><b>${C.icon} ${C.name}</b> · ${STAGES[stageOf(c)]} (${Math.round(state.prog[c] / C.days * 100)}%)<br><small>Likes ${C.temp[0]}–${C.temp[1]} °C, ${C.hum[0]}–${C.hum[1]}% humidity, ${C.light[0]}–${C.light[1]} h light</small><div class="cx-bar"><i style="width:${Math.round(health * 100)}%;background:${health > 0.7 ? '#3fe0a0' : health > 0.4 ? '#ffb347' : '#ff6a6a'}"></i></div>${issues.length ? `<small class="bad">Problem: ${issues.join(', ')}</small>` : '<small class="good">Happy</small>'}</div>`; }).join('');
        const open = Object.keys(S.faults).filter(f => !S.fixed[f]);
        faults.replaceChildren(...(open.length ? open.map(f => { const F = FAULTS[f], spare = f === 'filter' ? 'filter' : f === 'led' ? 'spareLed' : null, canMain = !spare || has(spare);
          return h('div', { class: 'cx-gh-fault' }, h('b', {}, `⚠ ${F.name}`), h('small', {}, F.why), h('div', {}, h('button', { class: 'btn sm primary', disabled: !canMain, title: canMain ? '' : 'You did not buy a spare', onclick: () => { S.fixed[f] = true; sfx.good(); hud.cap(`[${F.fix}]`); draw(); } }, F.fix + (canMain ? '' : ' (no spare)')),
            F.alt ? h('button', { class: 'btn sm', onclick: () => { S.fixed[f] = true; S.fixed[f + 'Alt'] = true; sfx.ui(); hud.cap(`[${F.alt}]`); if (f === 'led') S.set.lightH = Math.min(24, S.set.lightH + 4); draw(); } }, F.alt) : null)); }) : [h('small', { class: 'good' }, 'No faults.')]));
      };
      draw();
      const iv = setInterval(draw, 500);
      panelOpen = openModal({ title: '🎛 Greenhouse control', label: 'Greenhouse control', wide: true, onClose: () => { clearInterval(iv); panelOpen = null; }, body: h('div', { class: 'cx-gh-grid' }, h('div', {}, h('h4', {}, 'Readings'), read, h('h4', {}, 'Faults'), faults), h('div', {}, h('h4', {}, 'Crops'), crops, h('h4', {}, 'Settings'), controls)),
        foot: [ctx.isDone('harvest') && !ctx.isDone('report') ? h('button', { class: 'btn primary', onclick: () => { panelOpen.close(); report(); } }, '📝 File mission report') : null, h('button', { class: 'btn', onclick: () => panelOpen.close() }, 'Close')].filter(Boolean) });
    }
    makeUsable(controlScreen, { label: 'Greenhouse control panel', verb: 'Use', range: 2.6, enabled: () => controlScreen.visible && ctx.isDone('plant'), use: openPanel }); ix.add(controlScreen);
    // harvest from the beds
    const bedHit = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.8, 4.2), new THREE.MeshBasicMaterial({ visible: false })); bedHit.position.set(0, 0.6, 0); scene.add(bedHit);
    makeUsable(bedHit, { label: 'Growing beds', verb: 'Harvest', range: 3, enabled: () => ctx.isDone('plant') && !ctx.isDone('harvest') && (ctx.isDone('grow') || (T.over && stageAvg() >= 3)), use: () => {
      for (const m of plantMeshes) m.p.userData.harvested = true;
      const y = state.crops.map(c => `${CROPS[c].icon} ${CROPS[c].name}: ${Math.round((state.yield[c] ?? 0) * 100)}% of a perfect harvest`).join(' · ');
      sfx.good(); ctx.done('harvest'); hud.flash(`Harvested! ${y}. File your report on the control panel.`, 'good', 6000);
    } }); ix.add(bedHit);
    async function report() {
      const qs = [...REPORT_Q].sort(() => Math.random() - 0.5).slice(0, 3);
      const r = await runQuiz({ title: '📝 Mission GREENHOUSE-01 report', intro: `Day ${Math.floor(state.day)}. Crops: ${state.crops.map(c => CROPS[c].name).join(' and ')}. Credits left: ${budget - state.spent}. Answer three questions for the science team.`, questions: qs });
      for (const w of r.wrong || []) ctx.mistake(`Report question missed: ${w}`);
      ctx.done('report'); finish();
    }
    // restore
    state.built.forEach(id => { showPiece(id); markers[id].visible = false; });
    if (state.built.length) ctx.steps.find(s => s.id === 'build').text = `Build the greenhouse: ${state.built.length} of 11 steps`;
    if (ctx.isDone('build')) controlScreen.visible = true;
    if (state.crops.length) makePlants();
    if (ctx.isDone('brief')) T.start();
    drawPallets();

    return {
      spawn: [-8, -4, -Math.PI * 0.75, 0],
      markerFor: id => ({ brief: osei.rig.root, store: term, build: markers[nextBuild()?.id] || null, plant: osei.rig.root, grow: controlScreen, harvest: bedHit, report: controlScreen }[id] || null),
      onEnter: () => { if (!ctx.isDone('brief')) hud.flash('Talk to Dr. Osei to begin.', '', 3500); },
      update(dt, blocked) {
        osei.update(dt); T.update(dt, blocked && !panelOpen);
        if (ctx.isDone('plant') && !ctx.isDone('harvest') && (!blocked || panelOpen)) sim(dt);
        if (state.sys) { drawPlants(); screenT -= dt; if (screenT < 0) { screenT = 0.6; const S = state.sys, open = Object.keys(S.faults).filter(f => !S.fixed[f]); controlScreen.userData.screen.redraw(infoScreen('GREENHOUSE CONTROL', [`Day ${Math.floor(state.day)} · ${state.crops.map(c => CROPS[c].icon + ' ' + STAGES[stageOf(c)]).join('  ')}`, `${S.temp.toFixed(0)} °C · ${S.hum.toFixed(0)}% · water ${S.water.toFixed(0)} L`, open.length ? [`⚠ ${FAULTS[open[0]].name}`, '#ff6a6a'] : ['All systems normal', '#3fe0a0']], { w: 512, hgt: 320 })); }
          if (!blocked && ctx.isDone('plant') && !ctx.isDone('harvest')) hud.setReadout('GREENHOUSE-01', [['Day', Math.floor(state.day), ''], ...state.crops.map(c => [CROPS[c].name, STAGES[stageOf(c)], cropHealth(c, state.sys, link).health > 0.7 ? 'good' : 'warn']), ['Faults', Object.keys(state.sys.faults).filter(f => !state.sys.fixed[f]).length || 'none', Object.keys(state.sys.faults).some(f => !state.sys.fixed[f]) ? 'bad' : 'good']]);
          else if (!blocked) hud.setReadout(null);
        }
      }
    };
    function finish() {
      const avg = state.crops.reduce((a, c) => a + (state.yield[c] ?? 0), 0) / Math.max(1, state.crops.length);
      finishExercise(ctx, { id: 'greenhouse', title: 'Space Greenhouse & Life Support', timer: T, xp: 300, badge: ['greenhouse-engineer', 'life-support-tech'], bonus: Math.round((avg - 0.85) * 40),
        science: `Your harvest reached ${Math.round(avg * 100)}% of a perfect crop. Space agencies are testing greenhouses like this for the Moon and Mars: NASA's Veggie and Advanced Plant Habitat on the space station, and the EDEN ISS greenhouse in Antarctica, which grew hundreds of kilograms of vegetables with LED light, hydroponics and recycled water. Plants also take in carbon dioxide and give out oxygen, so they can become part of a crew's life-support system.` });
    }
  }
};
