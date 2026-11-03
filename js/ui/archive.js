// ASTRO LAB — Space Mission Archive and Celestial Explorer screens
import { $, h } from './dom.js';
import { bus, progress, addXP, awardFile, awardCard, gameEvent, save, log, refreshComputed } from '../systems/core.js';
import { ARCHIVE, ARCHIVE_STATUS_NOTE } from '../data/archive.js';
import { DEEP_OBJECTS, CATEGORIES } from '../data/objects.js';
import { BODIES, AU_KM } from '../data/solarSystem.js';
import { openQuiz } from './modals.js';

let app;
export function initPanels(a) { app = a; }

function shell(screen, title, onBack) {
  screen.innerHTML = '';
  const head = h('div', { class: 'ps-head' }, h('button', { class: 'btn sm', onclick: onBack }, '← Back'), h('h2', {}, title));
  screen.append(head);
  return head;
}

// ======================= Mission Archive =======================
const archState = { q: '', agency: 'All', status: 'All', sel: null };
export function renderArchive(onBack) {
  const s = $('#screen-archive');
  const head = shell(s, '📁 Space Mission Archive', onBack);
  head.append(h('span', { class: 'chip violet' }, `${progress.files.length}/${ARCHIVE.length} files unlocked`));
  const agencies = ['All', 'NASA', 'ESA', 'JAXA', 'ISRO', 'CNSA', 'SpaceX'];
  const search = h('input', { type: 'search', placeholder: 'Search missions, targets, discoveries…', 'aria-label': 'Search missions', value: archState.q });
  const ag = h('div', { class: 'chips' }, agencies.map(a => h('button', { class: 'chipbtn', 'aria-pressed': String(archState.agency === a), onclick: () => { archState.agency = a; renderArchive(onBack); } }, a)));
  const st = h('select', { 'aria-label': 'Filter by status' }, ['All', 'Active', 'In cruise', 'Completed'].map(o => h('option', { value: o, selected: archState.status === o }, `Status: ${o}`)));
  st.addEventListener('change', () => { archState.status = st.value; drawList(); });
  s.append(h('div', { class: 'ps-filters' }, h('div', { class: 'row' }, search, st), ag));
  const body = h('div', { class: 'ps-body' }); const list = h('div', { class: 'ps-list', role: 'list' }); const detail = h('div', { class: 'ps-detail' });
  body.append(list, detail); s.append(body);
  search.addEventListener('input', () => { archState.q = search.value; drawList(); });
  function filtered() {
    const q = archState.q.toLowerCase();
    return ARCHIVE.filter(m => (archState.agency === 'All' || m.agency.includes(archState.agency))
      && (archState.status === 'All' || ({ Active: 'active', 'In cruise': 'cruise', Completed: 'complete' })[archState.status] === m.statusKind)
      && (!q || [m.name, m.agency, m.target, m.objective, ...m.discoveries].join(' ').toLowerCase().includes(q)));
  }
  function drawList() {
    list.innerHTML = '';
    const f = filtered();
    if (!f.length) list.append(h('p', { class: 'empty' }, 'No missions match your search.'));
    for (const m of f) list.append(h('button', { class: 'list-item', role: 'listitem', 'aria-current': String(archState.sel === m.id), onclick: () => { archState.sel = m.id; drawList(); drawDetail(); body.classList.add('show-detail'); } },
      h('span', { class: 'li-badge' }, progress.files.includes(m.id) ? '📁' : '🔒'), h('div', { class: 'li-main' }, h('b', {}, m.name), h('small', {}, `${m.agency} · ${m.target}`))));
  }
  function drawDetail() {
    detail.innerHTML = '';
    const m = ARCHIVE.find(x => x.id === archState.sel);
    if (!m) { detail.append(h('div', { class: 'empty' }, h('p', { style: 'font-size:2.5rem' }, '🛰️'), h('p', {}, 'Select a mission file to read its briefing.'), h('p', { class: 'tiny' }, 'Pass a mission\'s quiz to unlock its file and earn XP. Unlocking 3 files completes the Archive Scholar mission.'), h('p', { class: 'tiny' }, ARCHIVE_STATUS_NOTE))); return; }
    const have = progress.files.includes(m.id);
    detail.append(
      h('button', { class: 'btn sm back-mobile', onclick: () => body.classList.remove('show-detail') }, '← All missions'),
      h('div', { class: 'detail-hero' }, h('div', {}, h('span', { class: `chip ${m.statusKind === 'active' ? 'good' : m.statusKind === 'cruise' ? 'warn' : ''}` }, m.status), h('h3', {}, m.name), h('p', { class: 'muted' }, `${m.agency} · ${m.country}`))),
      h('div', { class: 'grid2' }, info('Launch', m.launch), info('Target', m.target), info('Objective', m.objective), info('Spacecraft', m.spacecraft)),
      h('h2', {}, 'Major discoveries'), h('ul', { class: 'funfacts' }, m.discoveries.map(d => h('li', {}, d))),
      h('h2', {}, 'Timeline'), h('ul', { class: 'timeline' }, m.timeline.map(([d, e]) => h('li', {}, h('b', {}, d), e))),
      h('h2', {}, 'Fun facts'), h('ul', { class: 'funfacts' }, m.facts.map(d => h('li', {}, d))),
      h('h2', {}, 'Mission file reward'),
      h('p', {}, have ? '✅ File unlocked and stored in your Space Logbook.' : 'Pass the quiz to unlock this mission file (+XP).'),
      h('div', { class: 'btnrow' }, h('button', { class: 'btn primary', onclick: () => openQuiz({ key: `archive:${m.id}`, title: m.name, questions: m.quiz, onPass: () => { awardFile(m.id, m.name); gameEvent('archive:quiz', { id: m.id }); drawList(); drawDetail(); head.querySelector('.chip').textContent = `${progress.files.length}/${ARCHIVE.length} files unlocked`; } }) }, have ? '🧠 Retake quiz' : '🧠 Take quiz & unlock file')),
      h('p', { class: 'muted tiny' }, ARCHIVE_STATUS_NOTE));
  }
  drawList(); drawDetail();
  search.focus({ preventScroll: true });
}
const info = (k, v) => h('div', { class: 'readout', style: 'font-family:inherit' }, h('small', { class: 'muted', style: 'display:block;text-transform:uppercase;letter-spacing:.1em;font-size:.7rem' }, k), v);

// ======================= Celestial Explorer =======================
function explorerItems() {
  const ss = BODIES.map(b => ({
    id: b.id, name: b.name, category: b.type === 'planet' ? 'planet' : b.type === 'dwarf' ? 'dwarf' : b.type === 'moon' ? 'moon' : 'star',
    classification: b.classification, distance: b.distanceFromEarth, distLy: b.id === 'earth' ? 0 : (b.orbit?.au ? Math.abs(b.orbit.au - 1) + 0.0001 : (b.type === 'moon' ? (b.parent === 'earth' ? 0.0026 : Math.abs((BODIES.find(x => x.id === b.parent).orbit.au) - 1)) : 1)) * AU_KM / 9.461e12,
    size: b.data.diameter, discovery: b.discovery, physical: `Mass ${b.data.mass}. Temperature: ${b.data.temperature}. Atmosphere: ${b.data.atmosphere}.`,
    significance: b.data.significance, facts: b.data.facts, missions: b.data.missions, quiz: b.quiz, solar: true
  }));
  return [...ss, ...DEEP_OBJECTS];
}
const expState = { q: '', cat: 'all', sort: 'name', sel: null };
export function renderExplorer(onBack) {
  const s = $('#screen-explorer');
  const items = explorerItems();
  const head = shell(s, '🌌 Celestial Explorer', onBack);
  head.append(h('span', { class: 'chip violet' }, `${progress.discovered.length} discovered`));
  const search = h('input', { type: 'search', placeholder: 'Search 60+ objects…', 'aria-label': 'Search objects', value: expState.q });
  const sort = h('select', { 'aria-label': 'Sort objects' }, [['name', 'Sort: Name A–Z'], ['near', 'Sort: Nearest first'], ['far', 'Sort: Farthest first'], ['cat', 'Sort: Category']].map(([v, l]) => h('option', { value: v, selected: expState.sort === v }, l)));
  const cats = h('div', { class: 'chips', role: 'toolbar', 'aria-label': 'Categories' }, [{ id: 'all', label: 'All' }, ...CATEGORIES].map(c => h('button', { class: 'chipbtn', 'aria-pressed': String(expState.cat === c.id), onclick: (e) => { expState.cat = c.id; [...cats.children].forEach(x => x.setAttribute('aria-pressed', String(x === e.currentTarget))); drawList(); } }, `${c.label} (${c.id === 'all' ? items.length : items.filter(i => i.category === c.id).length})`)));
  s.append(h('div', { class: 'ps-filters' }, h('div', { class: 'row' }, search, sort), cats));
  const body = h('div', { class: 'ps-body' }); const list = h('div', { class: 'ps-list', role: 'list' }); const detail = h('div', { class: 'ps-detail' });
  body.append(list, detail); s.append(body);
  search.addEventListener('input', () => { expState.q = search.value; drawList(); });
  sort.addEventListener('change', () => { expState.sort = sort.value; drawList(); });
  function filtered() {
    const q = expState.q.toLowerCase();
    let f = items.filter(i => (expState.cat === 'all' || i.category === expState.cat) && (!q || [i.name, i.classification, i.significance, i.discovery].join(' ').toLowerCase().includes(q)));
    const cmp = { name: (a, b) => a.name.localeCompare(b.name), near: (a, b) => a.distLy - b.distLy, far: (a, b) => b.distLy - a.distLy, cat: (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name) }[expState.sort];
    return f.sort(cmp);
  }
  function drawList() {
    list.innerHTML = '';
    const f = filtered();
    if (!f.length) list.append(h('p', { class: 'empty' }, 'No objects match. Try another search or category.'));
    for (const it of f) {
      const cv = h('canvas', { width: 80, height: 80, 'aria-hidden': 'true' }); vizInto(cv, it);
      list.append(h('button', { class: 'list-item', role: 'listitem', 'aria-current': String(expState.sel === it.id), onclick: () => { expState.sel = it.id; drawList(); drawDetail(); body.classList.add('show-detail'); } },
        cv, h('div', { class: 'li-main' }, h('b', {}, `${progress.discovered.includes(it.id) ? '✦ ' : ''}${it.name}`), h('small', {}, CATEGORIES.find(c => c.id === it.category)?.label))));
    }
  }
  function drawDetail() {
    detail.innerHTML = '';
    const it = items.find(x => x.id === expState.sel);
    if (!it) { detail.append(h('div', { class: 'empty' }, h('p', { style: 'font-size:2.5rem' }, '🔭'), h('p', {}, 'Choose an object to study it.'), h('p', { class: 'tiny' }, 'Press "Discover" to log it (+XP and a knowledge card), then take its challenge.'))); return; }
    const disc = progress.discovered.includes(it.id);
    const cv = h('canvas', { width: 320, height: 320, role: 'img', 'aria-label': `Visualization of ${it.name}` }); vizInto(cv, it);
    detail.append(
      h('button', { class: 'btn sm back-mobile', onclick: () => body.classList.remove('show-detail') }, '← All objects'),
      h('div', { class: 'detail-hero' }, cv, h('div', {}, h('span', { class: 'chip' }, CATEGORIES.find(c => c.id === it.category)?.label), h('h3', {}, it.name), h('p', { class: 'muted' }, it.classification),
        h('p', { class: 'muted tiny' }, it.solar ? 'Visualization: procedural artistic rendering.' : 'Visualization: stylised illustration, not a photograph.'))),
      h('div', { class: 'grid2' }, info('Distance from Earth', it.distance), info('Size', it.size), info('Discovery', it.discovery), info('Physical characteristics', it.physical)),
      h('h2', {}, 'Scientific significance'), h('p', {}, it.significance),
      h('h2', {}, 'Interesting facts'), h('ul', { class: 'funfacts' }, it.facts.map(f => h('li', {}, f))),
      h('h2', {}, 'Related space missions'), h('p', {}, it.missions),
      h('div', { class: 'btnrow' },
        h('button', { class: `btn ${disc ? '' : 'good'}`, disabled: disc, onclick: () => discover(it) }, disc ? '✦ Discovered' : '✦ Discover (+20 XP, card)'),
        h('button', { class: 'btn primary', onclick: () => openQuiz({ key: `obj:${it.id}`, title: it.name, questions: it.quiz, onPass: ({ first }) => { if (it.solar) gameEvent('quiz:pass', { id: it.id }); if (first) awardCard(it.id, it.name); } }) }, '🧠 Challenge'),
        it.solar && app.scene ? h('button', { class: 'btn', onclick: () => { app.toGame(); app.scene.select(it.id); app.scene.focus(it.id); } }, '🚀 Fly there in 3D') : null));
  }
  function discover(it) {
    progress.discovered.push(it.id); save();
    log(`Discovered ${it.name}`, '✦'); addXP(20, `Discovered ${it.name}`); awardCard(it.id, it.name);
    gameEvent('explorer:discover', { id: it.id }); refreshComputed();
    head.querySelector('.chip').textContent = `${progress.discovered.length} discovered`;
    drawList(); drawDetail();
  }
  drawList(); drawDetail();
}

// Procedural visualizations for deep-sky objects
export function vizInto(cv, it) {
  const c = cv.getContext('2d'), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2;
  c.fillStyle = '#03040f'; c.fillRect(0, 0, W, H);
  let seed = [...it.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < W / 4; i++) { c.fillStyle = `rgba(255,255,255,${rnd() * 0.6})`; c.fillRect(rnd() * W, rnd() * H, 1, 1); }
  if (app?.previews?.[it.id]) { const s = W * 0.8; c.drawImage(app.previews[it.id], cx - s / 2, cy - s / 2, s, s); return; }
  const v = it.viz || { kind: 'star', color: '#fff' };
  if (v.kind === 'star') {
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, W * 0.45); g.addColorStop(0, '#fff'); g.addColorStop(0.12, v.color); g.addColorStop(0.35, v.color + '44'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = v.color + '88'; c.lineWidth = Math.max(1, W / 160); c.beginPath(); c.moveTo(cx - W * 0.4, cy); c.lineTo(cx + W * 0.4, cy); c.moveTo(cx, cy - H * 0.4); c.lineTo(cx, cy + H * 0.4); c.stroke();
  } else if (v.kind === 'constellation') {
    c.strokeStyle = 'rgba(120,160,255,.6)'; c.lineWidth = Math.max(1, W / 200);
    for (const [a, b] of v.lines) { c.beginPath(); c.moveTo(v.pts[a][0] * W, v.pts[a][1] * H); c.lineTo(v.pts[b][0] * W, v.pts[b][1] * H); c.stroke(); }
    for (const [x, y] of v.pts) { const g = c.createRadialGradient(x * W, y * H, 0, x * W, y * H, W * 0.05); g.addColorStop(0, '#fff'); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.fillRect(x * W - W * 0.05, y * H - W * 0.05, W * 0.1, W * 0.1); }
  } else if (v.kind === 'galaxy') {
    const n = W * 6;
    for (let i = 0; i < n; i++) {
      let r = Math.pow(rnd(), 1.6) * W * 0.45, a;
      if (v.arms) { const arm = (rnd() * v.arms) | 0; a = arm * Math.PI * 2 / v.arms + r / (W * 0.1) + (rnd() - 0.5) * 0.6; } else { a = rnd() * 7; r *= 0.7; }
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * (v.arms ? 0.55 : 0.7);
      c.fillStyle = r < W * 0.06 ? 'rgba(255,240,210,.5)' : v.color + '66'; c.fillRect(x, y, 1.2, 1.2);
    }
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, W * 0.12); g.addColorStop(0, 'rgba(255,245,220,.95)'); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  } else if (v.kind === 'nebula') {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) { const col = v.colors[i % v.colors.length]; const x = cx + (rnd() - 0.5) * W * 0.6, y = cy + (rnd() - 0.5) * H * 0.6, r = W * (0.08 + rnd() * 0.2); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col + '40'); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 12; i++) { c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + (rnd() - .5) * W * .5, cy + (rnd() - .5) * H * .5, rnd() * 1.5 + .5, 0, 7); c.fill(); }
  } else if (v.kind === 'blackhole') {
    c.save(); c.translate(cx, cy); c.scale(1, 0.35);
    const g = c.createRadialGradient(0, 0, W * 0.12, 0, 0, W * 0.42); g.addColorStop(0, 'rgba(255,230,160,1)'); g.addColorStop(0.4, 'rgba(255,140,40,.8)'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, W * 0.42, 0, 7); c.fill(); c.restore();
    const g2 = c.createRadialGradient(cx, cy, W * 0.1, cx, cy, W * 0.17); g2.addColorStop(0, 'rgba(255,200,120,0)'); g2.addColorStop(0.6, 'rgba(255,200,120,.8)'); g2.addColorStop(1, 'transparent');
    c.fillStyle = g2; c.beginPath(); c.arc(cx, cy, W * 0.17, 0, 7); c.fill();
    c.fillStyle = '#000'; c.beginPath(); c.arc(cx, cy, W * 0.105, 0, 7); c.fill();
  } else if (v.kind === 'rock') {
    c.fillStyle = v.color; c.beginPath();
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = W * (0.26 + rnd() * 0.08); c.lineTo(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 0.85); }
    c.closePath(); c.fill();
    for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(cx + (rnd() - .5) * W * .4, cy + (rnd() - .5) * H * .3, W * (0.02 + rnd() * 0.04), 0, 7); c.fill(); }
    const g = c.createLinearGradient(cx - W * .3, cy - H * .3, cx + W * .3, cy + H * .3); g.addColorStop(0, 'rgba(255,255,255,.15)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g; c.fill();
  } else if (v.kind === 'comet') {
    const g = c.createLinearGradient(cx, cy, W * 0.95, H * 0.1); g.addColorStop(0, v.color + 'cc'); g.addColorStop(1, 'transparent');
    c.fillStyle = g; c.beginPath(); c.moveTo(cx - W * .02, cy + H * .03); c.lineTo(W, H * .02); c.lineTo(W, H * .3); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,180,255,.35)'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(W, H * .32); c.lineTo(W, H * .4); c.closePath(); c.fill();
    const g2 = c.createRadialGradient(cx, cy, 0, cx, cy, W * .1); g2.addColorStop(0, '#fff'); g2.addColorStop(1, 'transparent'); c.fillStyle = g2; c.fillRect(0, 0, W, H);
  } else if (v.kind === 'planet') {
    const g = c.createRadialGradient(cx - W * .1, cy - H * .1, W * .02, cx, cy, W * .3); g.addColorStop(0, '#fff8'); g.addColorStop(0.2, v.color); g.addColorStop(1, '#000');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, W * 0.3, 0, 7); c.fill();
  }
}
