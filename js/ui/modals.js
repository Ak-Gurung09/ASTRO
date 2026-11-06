// ASTRO LAB — quizzes, mission journal, logbook, help, settings, map, compare and mission-complete screens
import { h, esc, openModal, toast, fmtDate, closeAllModals } from './dom.js';
import { bus, progress, settings, saveSettings, save, log, addXP, checkBadges, gameEvent, allMissions, missionState, taskStatus, missionPct, startMission, trackMission, activeMission, rankFor, resetProgress, getDaily } from '../systems/core.js';
import { CATEGORY_LABELS, BADGES, BADGE_MAP } from '../data/missions.js';
import { BODIES, BODY_MAP, TRUE_SCALE } from '../data/solarSystem.js';
import { DEEP_OBJECTS } from '../data/objects.js';
import { ARCHIVE } from '../data/archive.js';
import { MOON_CREDITS, MOON_CREDIT_INTRO } from '../data/moonCredits.js';

let app = null;
export function initModals(a) { app = a; }

// ---------------- Quiz ----------------
export function openQuiz({ key, title, questions, onPass, onFinish }) {
  let i = 0, score = 0; const results = [];
  const shuffled = questions.map(q => {
    const order = q.options.map((_, k) => k).sort(() => Math.random() - 0.5);
    return { ...q, options: order.map(k => q.options[k]), answer: order.indexOf(q.answer) };
  });
  const m = openModal({ title: `🧠 ${title}`, body: h('div'), label: `Quiz: ${title}` });
  const passMark = Math.max(1, Math.ceil(shuffled.length * 2 / 3));
  render();
  function render() {
    const b = m.body; b.innerHTML = '';
    const bar = h('div', { class: 'quiz-progress', 'aria-hidden': 'true' }, shuffled.map((_, k) => h('i', { class: k < i ? (results[k] ? 'ok' : 'no') : k === i ? 'cur' : '' })));
    if (i >= shuffled.length) return finish(b, bar);
    const q = shuffled[i];
    b.append(bar, h('p', { class: 'muted tiny' }, `Question ${i + 1} of ${shuffled.length} · pass mark ${passMark}/${shuffled.length}`), h('div', { class: 'quiz-q' }, q.q));
    const opts = h('div', { class: 'quiz-opts', role: 'group', 'aria-label': 'Answer options' });
    q.options.forEach((o, k) => opts.append(h('button', { class: 'quiz-opt', onclick: () => answer(k, opts) }, `${'ABCD'[k]}. ${o}`)));
    b.append(opts);
    opts.querySelector('button')?.focus();
  }
  function answer(k, opts) {
    const q = shuffled[i]; const ok = k === q.answer; results[i] = ok; if (ok) score++;
    bus.emit('sfx', ok ? 'correct' : 'wrong');
    [...opts.children].forEach((btn, j) => { btn.disabled = true; if (j === q.answer) btn.classList.add('right'); else if (j === k) btn.classList.add('wrong'); });
    const next = h('button', { class: 'btn primary', onclick: () => { i++; render(); } }, i + 1 < shuffled.length ? 'Next question →' : 'See results');
    m.body.append(h('div', { class: 'explain', role: 'status' }, h('b', {}, ok ? '✓ Correct! ' : '✗ Not quite. '), q.explain || ''), h('div', { class: 'btnrow' }, next));
    next.focus();
  }
  function finish(b, bar) {
    const passed = score >= passMark;
    progress.stats.quizzesTaken++;
    if (score === shuffled.length) progress.stats.perfectQuizzes++;
    const first = passed && !progress.quizzesPassed.includes(key);
    if (passed && first) progress.quizzesPassed.push(key);
    save();
    b.append(bar, h('div', { class: 'complete-modal' },
      h('div', { class: 'big-ic' }, passed ? '🏆' : '🔁'),
      h('h2', {}, passed ? 'Knowledge check passed!' : 'Keep studying, Cadet'),
      h('p', {}, `You scored ${score} / ${shuffled.length}.`),
      passed ? h('p', { class: 'muted' }, first ? 'Rewards are being added to your logbook.' : 'Already passed before — a small practice bonus applies.') : h('p', { class: 'muted' }, `You need ${passMark} correct to pass. Review the data tabs and try again.`)));
    const row = h('div', { class: 'btnrow' });
    if (!passed) row.append(h('button', { class: 'btn primary', onclick: () => { m.close(); openQuiz({ key, title, questions, onPass, onFinish }); } }, 'Retry quiz'));
    row.append(h('button', { class: 'btn', onclick: () => m.close() }, 'Close'));
    b.append(row);
    if (passed) { addXP(first ? 30 * shuffled.length : 10, `${title} quiz`); onPass && onPass({ score, total: shuffled.length, first }); }
    checkBadges();
    onFinish && onFinish(passed);
  }
}

export function bodyQuiz(id) {
  const b = BODY_MAP[id];
  openQuiz({ key: `body:${id}`, title: `${b.name} knowledge check`, questions: b.quiz, onPass: ({ first }) => {
    gameEvent('quiz:pass', { id });
    if (first) bus.emit('card:award', { id, name: b.name });
  } });
}

// ---------------- Mission complete ----------------
bus.on('mission:complete', ({ mission, xp, badge, card }) => {
  closeAllModals();
  bus.emit('sfx', 'complete');
  confetti();
  const rewards = h('div', { class: 'rewards' });
  if (xp) rewards.append(h('div', { class: 'reward' }, h('b', {}, `+${xp}`), 'XP'));
  if (badge) rewards.append(h('div', { class: 'reward' }, h('b', {}, badge.icon), badge.name));
  if (card) rewards.append(h('div', { class: 'reward' }, h('b', {}, '🃏'), `${(BODY_MAP[card] || {}).name || card} card`));
  const next = activeMission();
  const m = openModal({ title: 'Mission complete', cls: 'complete-modal', label: 'Mission complete', body: h('div', {},
    h('div', { class: 'big-ic' }, '🏁'), h('h2', {}, mission.name.toUpperCase()), h('p', { class: 'muted' }, mission.objective), rewards,
    h('p', { class: 'muted tiny' }, `Rank: ${rankFor(progress.xp).name} · ${progress.xp} XP`)),
    foot: [
      h('button', { class: 'btn', onclick: () => { m.close(); openJournal(); } }, '📓 Mission Journal'),
      h('button', { class: 'btn primary', onclick: () => m.close() }, 'Continue exploring')
    ] });
  setTimeout(() => { const n = activeMission(); if (n && n.id !== mission.id) toast({ icon: '🚀', title: 'Next mission', text: n.name }); }, 400);
});

export function confetti() {
  if (settings.reducedMotion) return;
  const c = h('canvas', { class: 'confetti' }); document.body.append(c);
  const ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#5ad8ff', '#8b5cf6', '#ffc857', '#3fe0a0', '#e05cff', '#ffffff'];
  const P = Array.from({ length: 140 }, () => ({ x: c.width / 2, y: c.height * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 3, r: 3 + Math.random() * 4, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6 }));
  let f = 0; (function step() { ctx.clearRect(0, 0, c.width, c.height); for (const p of P) { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += 0.2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); } if (++f < 120) requestAnimationFrame(step); else c.remove(); })();
}

// ---------------- Mission journal ----------------
export function openJournal(tab = 'story') {
  const m = openModal({ title: '📓 Mission Journal', wide: true, body: h('div'), label: 'Mission journal' });
  let cur = tab;
  const render = () => {
    const b = m.body; b.innerHTML = '';
    const am = activeMission();
    b.append(h('p', { class: 'muted' }, am ? `Tracking: ${am.name}. Pick any mission to start or track it. Several missions can be in progress at once.` : 'Pick a mission to start tracking it.'));
    const tabs = h('div', { class: 'jtabs', role: 'tablist' });
    for (const [k, label] of Object.entries(CATEGORY_LABELS)) {
      const list = allMissions().filter(x => x.category === k);
      const doneN = list.filter(x => missionState(x.id) === 'complete').length;
      tabs.append(h('button', { class: 'chipbtn', role: 'tab', 'aria-pressed': String(cur === k), onclick: () => { cur = k; render(); } }, `${label} (${doneN}/${list.length})`));
    }
    b.append(tabs);
    const list = h('div', { class: 'mission-list' });
    for (const ms of allMissions().filter(x => x.category === cur)) {
      const st = missionState(ms.id); const pct = Math.round(missionPct(ms) * 100);
      const tracking = am && am.id === ms.id;
      const reward = [ms.reward.xp ? `${ms.reward.xp} XP` : null, ms.reward.badge ? `${BADGE_MAP[ms.reward.badge]?.icon} ${BADGE_MAP[ms.reward.badge]?.name}` : null, ms.reward.card ? '🃏 card' : null].filter(Boolean).join(' · ');
      const row = h('div', { class: `mission-row ${tracking ? 'active' : ''} ${st}` },
        h('div', { class: 'mr-main' }, h('b', {}, `${st === 'complete' ? '✅ ' : tracking ? '🎯 ' : ''}${ms.name}`), h('small', {}, ms.objective), h('small', { class: 'reward-line' }, `Reward: ${reward}`), h('div', { class: 'mbar' }, h('i', { style: `width:${pct}%` }))),
        st === 'complete' ? h('span', { class: 'chip good' }, 'Complete') :
          h('button', { class: `btn sm ${tracking ? '' : 'primary'}`, onclick: () => { trackMission(ms.id); m.close(); } }, tracking ? 'Tracking' : st === 'active' ? 'Track' : 'Start'),
        h('button', { class: 'btn sm ghost', onclick: () => missionDetails(ms) }, 'Details'));
      list.append(row);
    }
    b.append(list);
  };
  render();
}
function missionDetails(ms) {
  const tasks = h('ul', { class: 'tasks' }, ms.tasks.map((t, i) => { const s = taskStatus(ms, i); return h('li', { class: s.done ? 'done' : '' }, `${t.text}${s.total > 1 ? ` (${s.n}/${s.total})` : ''}`); }));
  const m = openModal({ title: ms.name, label: ms.name, body: h('div', {}, h('span', { class: 'chip' }, CATEGORY_LABELS[ms.category]), h('h2', {}, 'Briefing'), h('p', {}, ms.briefing), h('h2', {}, 'Objective'), h('p', {}, ms.objective), h('h2', {}, 'Tasks'), tasks,
    h('h2', {}, 'Reward'), h('p', {}, [ms.reward.xp && `${ms.reward.xp} XP`, ms.reward.badge && `Badge: ${BADGE_MAP[ms.reward.badge]?.name}`, ms.reward.card && `Knowledge card: ${BODY_MAP[ms.reward.card]?.name}`].filter(Boolean).join(' · '))),
    foot: missionState(ms.id) === 'complete' ? [h('button', { class: 'btn', onclick: () => m.close() }, 'Close')] : [h('button', { class: 'btn primary', onclick: () => { trackMission(ms.id); m.close(); } }, 'Start / track mission')] });
}

// ---------------- Logbook ----------------
export function openLogbook(tab = 'badges') {
  const m = openModal({ title: '🏅 Space Logbook', wide: true, body: h('div'), label: 'Space Logbook' });
  let cur = tab;
  const render = () => {
    const b = m.body; b.innerHTML = '';
    const r = rankFor(progress.xp);
    const done = Object.values(progress.missions).filter(s => s === 'complete').length;
    b.append(h('div', { class: 'stats' },
      stat(r.name, `Rank (level ${r.level})`), stat(progress.xp, r.next ? `XP · next rank at ${r.next}` : 'XP · max rank'),
      stat(done, 'Missions complete'), stat(`${progress.badges.length}/${BADGES.length}`, 'Badges'),
      stat(progress.cards.length, 'Knowledge cards'), stat(progress.files.length, 'Mission files')));
    const tabs = h('div', { class: 'jtabs' });
    for (const [k, l] of [['badges', 'Badges'], ['cards', 'Knowledge Cards'], ['files', 'Mission Files'], ['log', 'Logbook entries']]) tabs.append(h('button', { class: 'chipbtn', 'aria-pressed': String(cur === k), onclick: () => { cur = k; render(); } }, l));
    b.append(tabs);
    if (cur === 'badges') b.append(h('div', { class: 'badge-grid' }, BADGES.map(bd => h('div', { class: `badge ${progress.badges.includes(bd.id) ? '' : 'locked'}`, title: bd.desc }, h('span', { class: 'bi' }, bd.icon), h('b', {}, bd.name), h('small', {}, bd.desc)))));
    if (cur === 'cards') {
      const all = [...BODIES.map(x => ({ id: x.id, name: x.name, sub: x.classification, preview: app.previews[x.id] })), ...DEEP_OBJECTS.map(x => ({ id: x.id, name: x.name, sub: x.classification, preview: null }))];
      b.append(h('p', { class: 'muted tiny' }, 'Earn cards by passing knowledge checks, completing missions and discovering objects in the Celestial Explorer.'));
      b.append(h('div', { class: 'card-grid' }, all.map(c => {
        const have = progress.cards.includes(c.id);
        const cv = h('canvas', { width: 64, height: 64 });
        if (have && c.preview) cv.getContext('2d').drawImage(c.preview, 0, 0, 64, 64); else { const x = cv.getContext('2d'); x.font = '34px serif'; x.textAlign = 'center'; x.fillText(have ? '✨' : '?', 32, 44); }
        return h('div', { class: `kcard ${have ? '' : 'locked'}` }, cv, h('b', {}, have ? c.name : '???'), h('small', {}, have ? c.sub : 'Not yet collected'));
      })));
    }
    if (cur === 'files') b.append(h('div', { class: 'card-grid' }, ARCHIVE.map(a => { const have = progress.files.includes(a.id); return h('div', { class: `kcard ${have ? '' : 'locked'}` }, h('div', { style: 'font-size:2rem' }, have ? '📁' : '🔒'), h('b', {}, a.name), h('small', {}, a.agency)); })));
    if (cur === 'log') b.append(progress.log.length ? h('div', {}, progress.log.slice(0, 120).map(l => h('div', { class: 'logrow' }, h('time', {}, new Date(l.t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })), h('span', {}, `${l.icon} ${l.text}`)))) : h('p', { class: 'empty' }, 'No entries yet — your adventures will be recorded here.'));
  };
  render();
}
const stat = (v, l) => h('div', { class: 'stat' }, h('b', {}, String(v)), h('small', {}, l));

// ---------------- Help ----------------
export const DESKTOP_KEYS = [
  ['Left-drag', 'Rotate the camera around the selected object'], ['Mouse wheel', 'Zoom in / out'], ['Right-drag (or Shift + drag)', 'Pan the camera'],
  ['Left-click', 'Select a planet, moon or label'], ['W A S D / Arrow keys', 'Move the camera'], ['Q / E', 'Rotate the camera left / right'],
  ['Space', 'Pause / resume orbital motion'], ['Shift (tap)', 'Increase simulation speed · hold while moving to fly faster'],
  ['Ctrl (tap)', 'Decrease simulation speed · hold while moving for fine control'], ['F', 'Focus / travel to the selected object'],
  ['M', 'Open the System Map'], ['J', 'Open the Mission Journal'], ['H', 'Open this Help & Controls menu'], ['L', 'Open the Space Logbook'], ['Esc', 'Close menus or go back']
];
export const TOUCH_KEYS = [
  ['One-finger drag', 'Rotate the camera'], ['Pinch', 'Zoom in / out'], ['Two-finger drag', 'Pan the camera'], ['Tap', 'Select an object or label'],
  ['Joystick (bottom-left)', 'Move the camera'], ['❚❚ / − / +', 'Pause, slower, faster'], ['🎯', 'Focus the selected object'],
  ['📓 🗺️ ❔', 'Journal, Map and Help buttons in the toolbar']
];
export function openHelp() {
  const table = rows => h('table', { class: 'keys' }, h('tbody', {}, rows.map(([k, v]) => h('tr', {}, h('td', {}, h('kbd', {}, k)), h('td', {}, v)))));
  openModal({ title: '❔ Help & Controls', wide: true, label: 'Help and controls', body: h('div', {},
    h('div', { class: 'help-grid' }, h('div', {}, h('h2', {}, '🖱️ Mouse & keyboard'), table(DESKTOP_KEYS)), h('div', {}, h('h2', {}, '👆 Touch (phone & tablet)'), table(TOUCH_KEYS),
      h('h2', {}, '🎯 How to play'), h('ol', {}, h('li', {}, 'Follow the objective in the Mission Tracker (top-right).'), h('li', {}, 'A yellow ◆ marker or edge arrow points to your target.'), h('li', {}, 'Select a world, press Travel (F), then Scan it.'), h('li', {}, 'Pass its knowledge check to earn XP and cards.'), h('li', {}, 'Visit the Lab, Archive and Explorer for more missions.')))),
    h('h2', {}, '📏 About scale & time'),
    h('p', {}, 'Planet sizes in the 3D view are enlarged and distances compressed so that everything fits on screen; this is not physically to scale. Use the 📏 Scale tool for true proportions. Orbital periods are real, and starting positions approximate where planets are today (circular orbits, all drawn in one plane). In time-lapse, very fast moon orbits and planet spins are slowed down for comfortable viewing.'),
    h('p', { class: 'muted tiny' }, 'Note: browsers reserve some shortcuts such as Ctrl + W. Use Ctrl with the arrow keys for fine movement.'),
    h('h2', {}, '🖼️ Image credits'), h('p', { class: 'muted tiny' }, MOON_CREDIT_INTRO),
    h('table', { class: 'keys credits' }, h('tbody', {}, MOON_CREDITS.map(c => h('tr', {}, h('td', {}, h('b', {}, c.name), (app.realMaps || []).includes(c.id) ? '' : h('small', { class: 'muted' }, ' (generated)')), h('td', {}, c.source, h('br'), h('small', { class: 'muted' }, `${c.licence}${c.note ? ' · ' + c.note : ''}`)))))),
    h('p', { class: 'muted tiny' }, 'Full notes on each map: textures/moons/CREDITS.md in the game folder.')) });
}

// ---------------- Settings ----------------
export function openSettings() {
  const seg = (key, opts, onChange) => h('div', { class: 'seg', role: 'group' }, opts.map(([v, l]) => h('button', { 'aria-pressed': String(settings[key] === v), onclick: e => { settings[key] = v; saveSettings(); [...e.currentTarget.parentNode.children].forEach(c => c.setAttribute('aria-pressed', String(c === e.currentTarget))); onChange && onChange(v); } }, l)));
  const toggle = (key, label, onChange) => h('div', { class: 'srow' }, h('span', {}, label), seg(key, [[true, 'On'], [false, 'Off']], onChange));
  const row = (label, ctrl, note) => h('div', { class: 'srow' }, h('span', {}, label, note ? h('small', { class: 'muted block' }, note) : null), ctrl);
  const slider = (key, min, max, step, fmt) => {
    const out = h('output', {}, fmt(settings[key]));
    const inp = h('input', { type: 'range', min, max, step, value: settings[key], 'aria-label': key, oninput: e => { settings[key] = +e.target.value; out.textContent = fmt(settings[key]); saveSettings(); } });
    return h('div', { class: 'srange' }, inp, out);
  };
  const pct = v => `${Math.round(v * 100)}%`;
  const sec = (t) => h('h3', { class: 'ssec' }, t);
  openModal({ title: '⚙ Settings', label: 'Settings', wide: true, body: h('div', { class: 'settings-list two' },
    h('div', {},
      sec('Gameplay'),
      row('Difficulty', seg('difficulty', [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard'], ['realistic', 'Realistic']]), 'Affects supplies, time limits, quizzes, tolerances, faults, greenhouse stability and scoring.'),
      row('Text speed', seg('textSpeed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']])),
      toggle('subtitles', 'Subtitles (sound captions)'),
      row('Language', seg('language', [['en', 'English']]), 'More languages may be added later.'),
      sec('Graphics'),
      row('Graphics quality', seg('quality', [['auto', 'Auto'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['ultra', 'Ultra']], v => app.scene?.applyQuality(v))),
      toggle('reducedMotion', 'Reduce motion', v => document.body.classList.toggle('reduced-motion', v)),
      toggle('showOrbits', 'Show orbit lines', v => app.scene?.setOrbitsVisible(v)),
      toggle('showLabels', 'Show labels'),
      h('p', { class: 'muted tiny' }, 'Low turns off shadows and lowers resolution. Ultra uses full resolution and sharper shadows. Texture detail in the solar system applies after a reload.')),
    h('div', {},
      sec('Audio'),
      toggle('sound', 'Sound'),
      row('Music volume', slider('musicVol', 0, 1, 0.05, pct)),
      row('Sound effects volume', slider('sfxVol', 0, 1, 0.05, pct)),
      sec('Controls'),
      row('Control scheme', seg('controls', [['auto', 'Auto'], ['kbm', 'Keyboard & mouse'], ['gamepad', 'Gamepad'], ['touch', 'Touch']], () => app.applyJoystick()), 'Auto switches to whatever you touch last.'),
      row('Camera sensitivity', slider('sensitivity', 0.3, 2.5, 0.05, v => `${v.toFixed(2)}×`)),
      toggle('invertY', 'Invert Y-axis'),
      row('On-screen joystick', seg('joystick', [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']], () => app.applyJoystick())),
      sec('Accessibility'),
      toggle('colorblind', 'Colourblind-friendly colours', v => document.body.classList.toggle('cb', v)),
      row('Text size', seg('textScale', [[0.9, 'Small'], [1, 'Normal'], [1.15, 'Large'], [1.3, 'X-Large']], v => document.documentElement.style.setProperty('--ts', v))),
      row('Reset all progress', h('button', { class: 'btn sm', onclick: () => confirmReset() }, 'Reset…')))) });
}
function confirmReset() {
  const m = openModal({ title: 'Reset progress?', body: '<p>This permanently erases your career, XP, badges, cards and mission progress on this device.</p>',
    foot: [h('button', { class: 'btn', onclick: () => m.close() }, 'Cancel'), h('button', { class: 'btn primary', onclick: () => { resetProgress(); m.close(); toast({ icon: '🗑️', title: 'Progress reset' }); app.toMenu(); } }, 'Erase progress')] });
}

// ---------------- System map ----------------
export function openMap() {
  gameEvent('map:open');
  const cv = h('canvas', { class: 'map-canvas', width: 700, height: 700, role: 'img', 'aria-label': 'Top-down map of the solar system. Use the buttons below to travel.' });
  const list = h('div', { class: 'chips', style: 'margin-top:10px' });
  const am = activeMission(); const target = am ? (am.tasks.find((t, i) => !taskStatus(am, i).done)?.target || am.target) : null;
  const m = openModal({ title: '🗺️ System Map', label: 'System map', wide: false, body: h('div', {}, h('p', { class: 'muted tiny' }, 'Top-down view in game scale (distances compressed). Tap a world on the map or a button to travel there.'), cv, list),
    foot: [h('button', { class: 'btn', onclick: () => { app.scene.overview(); m.close(); } }, '🔭 3D overview'), h('button', { class: 'btn primary', onclick: () => m.close() }, 'Close')] });
  for (const b of BODIES.filter(b => b.type !== 'moon' || true)) {
    list.append(h('button', { class: 'chipbtn', 'aria-pressed': String(b.id === target), onclick: () => { go(b.id); } }, `${b.id === target ? '◆ ' : ''}${b.name}`));
  }
  function go(id) { app.scene.select(id); app.scene.focus(id); m.close(); }
  const ctx = cv.getContext('2d'); const S = 700, C = S / 2; const k = (C - 20) / 205;
  let raf;
  const pts = {};
  function draw() {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(154,143,128,0.15)'; ctx.beginPath(); ctx.arc(C, C, 68 * k, 0, 7); ctx.arc(C, C, 54 * k, 0, 7, true); ctx.fill();
    for (const b of BODIES) {
      if (b.type === 'moon') continue;
      const d = b.vis.dist * k, a = app.scene.orbitalAngle(b.id);
      if (d) { ctx.strokeStyle = 'rgba(100,130,230,0.3)'; ctx.beginPath(); ctx.arc(C, C, d, 0, 7); ctx.stroke(); }
      const x = C + Math.cos(a) * d, y = C - Math.sin(a) * d; pts[b.id] = [x, y];
      const r = b.id === 'sun' ? 10 : Math.max(3.5, b.vis.radius * 3);
      ctx.fillStyle = { sun: '#ffcc55', mercury: '#aaa', venus: '#e8c98c', earth: '#4f9fff', mars: '#d0603a', jupiter: '#d8b48a', saturn: '#ecdcb4', uranus: '#9fe0e4', neptune: '#4a74e4', pluto: '#d8b890', ceres: '#888' }[b.id] || '#ccc';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      if (b.id === target) { ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 6 + Math.sin(performance.now() / 200) * 2, 0, 7); ctx.stroke(); ctx.lineWidth = 1; }
      ctx.fillStyle = 'rgba(230,235,255,.85)'; ctx.font = '13px system-ui'; ctx.fillText(b.name, x + r + 4, y + 4);
    }
    raf = requestAnimationFrame(draw);
  }
  draw();
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * S, y = (e.clientY - r.top) / r.height * S;
    let best = null, bd = 30; for (const [id, [px, py]] of Object.entries(pts)) { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = id; } }
    if (best) go(best);
  });
  const obs = new MutationObserver(() => { if (!document.body.contains(cv)) { cancelAnimationFrame(raf); obs.disconnect(); } });
  obs.observe(document.getElementById('modal-root'), { childList: true });
}

// ---------------- Compare (true scale) ----------------
export function openCompare() {
  gameEvent('compare:open');
  const sizeCv = h('canvas', { class: 'compare-canvas', width: 1200, height: 360, role: 'img', 'aria-label': 'Planet sizes drawn to true relative scale' });
  const distCv = h('canvas', { class: 'compare-canvas', width: 1200, height: 260, role: 'img', 'aria-label': 'Orbital distances drawn to true linear scale' });
  openModal({ title: '📏 True Scale Comparison', wide: true, label: 'True scale comparison', body: h('div', {},
    h('p', {}, 'The 3D view is a visual game scale. Here are the real proportions, from NASA fact-sheet diameters and average orbital distances.'),
    h('h2', {}, 'Diameters (true relative scale)'), sizeCv,
    h('p', { class: 'muted tiny' }, 'The Sun\'s edge is shown on the left: it is 109 times wider than Earth. Jupiter is 11 times wider than Earth.'),
    h('h2', {}, 'Distances from the Sun (true linear scale, in AU)'), distCv,
    h('p', { class: 'muted tiny' }, '1 AU ≈ 149.6 million km. At this scale every planet would be far smaller than a single pixel — so they are drawn as markers. Neptune is 30 times farther from the Sun than Earth.')) });
  // sizes
  let c = sizeCv.getContext('2d'); const W = 1200, H = 360; c.fillStyle = '#03040e'; c.fillRect(0, 0, W, H);
  const pxPerKm = (H * 0.38) / 142984; // Jupiter radius-based
  const sunR = TRUE_SCALE.sun.diameterKm / 2 * pxPerKm;
  const grd = c.createRadialGradient(-sunR + 80, H / 2, sunR * 0.6, -sunR + 80, H / 2, sunR); grd.addColorStop(0, '#ffd36a'); grd.addColorStop(1, '#f07a14');
  c.fillStyle = grd; c.beginPath(); c.arc(-sunR + 80, H / 2, sunR, 0, 7); c.fill();
  c.fillStyle = '#000'; c.font = 'bold 18px system-ui'; c.fillText('Sun', 14, H / 2 + 6);
  let x = 110; const order = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  for (const id of order) {
    const r = Math.max(1, TRUE_SCALE[id].diameterKm / 2 * pxPerKm);
    x += r + 14;
    const prev = app.previews[id];
    if (prev) c.drawImage(prev, x - r, H / 2 - r, r * 2, r * 2); else { c.fillStyle = '#888'; c.beginPath(); c.arc(x, H / 2, r, 0, 7); c.fill(); }
    c.fillStyle = '#cfd6f5'; c.font = '15px system-ui'; c.textAlign = 'center'; c.fillText(BODY_MAP[id].name, x, H / 2 + Math.max(r, 8) + 22); c.textAlign = 'left';
    x += r + 14;
  }
  // distances
  c = distCv.getContext('2d'); const H2 = 260; c.fillStyle = '#03040e'; c.fillRect(0, 0, W, H2);
  const pxAU = (W - 80) / 40; c.fillStyle = '#ffcc55'; c.beginPath(); c.arc(30, H2 / 2, 8, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.moveTo(30, H2 / 2); c.lineTo(W - 20, H2 / 2); c.stroke();
  for (let au = 0; au <= 40; au += 5) { const xx = 30 + au * pxAU; c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(xx, H2 - 30, 1, 8); c.font = '12px system-ui'; c.fillText(`${au} AU`, xx - 12, H2 - 10); }
  let flip = 0;
  for (const id of ['mercury', 'venus', 'earth', 'mars', 'ceres', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) {
    const xx = 30 + TRUE_SCALE[id].au * pxAU; const up = (flip++ % 2) ? -1 : 1;
    c.strokeStyle = 'rgba(140,170,255,.6)'; c.beginPath(); c.moveTo(xx, H2 / 2); c.lineTo(xx, H2 / 2 - up * (id === 'mercury' || id === 'venus' || id === 'earth' || id === 'mars' ? 30 + (flip % 4) * 16 : 34)); c.stroke();
    c.fillStyle = '#9fc1ff'; c.beginPath(); c.arc(xx, H2 / 2, 3, 0, 7); c.fill();
    c.fillStyle = '#cfd6f5'; c.font = '13px system-ui'; c.fillText(BODY_MAP[id].name, xx - 18, H2 / 2 - up * (id === 'mercury' || id === 'venus' || id === 'earth' || id === 'mars' ? 36 + (flip % 4) * 16 : 40));
  }
}
