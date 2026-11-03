// ASTRO LAB — in-game HUD: profile, mission tracker, info panel, labels, guidance arrow, time bar, joystick, tutorial coach
import { sitesFor } from '../data/surfaces.js';
import { $, $$, h, esc, fmtDate, toast } from './dom.js';
import { bus, progress, settings, gameEvent, activeMission, taskStatus, currentTaskIndex, missionState, startMission, trackMission, rankFor, addXP, save, log } from '../systems/core.js';
import { BODIES, BODY_MAP } from '../data/solarSystem.js';
import { MISSIONS, BADGE_MAP, CATEGORY_LABELS } from '../data/missions.js';
import { bodyQuiz, openJournal } from './modals.js';

let app;
export function initHUD(a) {
  app = a;
  bus.on('progress', updateProfile);
  bus.on('progress', renderTracker);
  bus.on('mission:active', renderTracker);
  bus.on('selected', b => renderInfo(b));
  bus.on('arrived', id => { if (app.scene.selected === id) renderInfo(BODY_MAP[id], currentTab); });
  bus.on('time', renderTime);
  bus.on('frame', onFrame);
  bus.on('settings', () => { $('#labels').style.display = settings.showLabels ? '' : 'none'; });
  makeLabels();
  initTimebar();
  initJoystick();
  updateProfile(); renderTracker(); renderTime(app.scene.timeInfo());
  $('#hud-profile').addEventListener('click', () => app.open('logbook'));
  $('#hud-profile').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); app.open('logbook'); } });
}

// ---------------- Profile ----------------
function updateProfile() {
  const r = rankFor(progress.xp);
  $('#hud-level').textContent = r.level; $('#hud-rank').textContent = r.name;
  $('#hud-xp').style.width = `${Math.round(r.pct * 100)}%`;
  $('#hud-xptext').textContent = r.next ? `${progress.xp} / ${r.next} XP` : `${progress.xp} XP · max rank`;
}

// ---------------- Mission tracker ----------------
let collapsed = false;
function currentTarget(m) {
  if (!m) return null;
  const i = currentTaskIndex(m); const t = i >= 0 ? m.tasks[i] : null;
  return (t && t.target && BODY_MAP[t.target] ? t.target : null) || (m.target && BODY_MAP[m.target] ? m.target : null);
}
export function renderTracker() {
  const el = $('#tracker'); if (!el) return;
  const m = activeMission();
  el.classList.toggle('collapsed', collapsed);
  if (!m) {
    el.innerHTML = '';
    el.append(h('div', { class: 't-cat' }, 'No mission tracked'), h('h3', {}, 'Choose your next mission'), h('p', { class: 'obj' }, 'Open the Mission Journal to start a mission. Each one shows its reward.'),
      h('div', { class: 'row' }, h('button', { class: 'btn sm primary', onclick: () => openJournal() }, '📓 Open Journal')));
    highlightToolbar(null); updateCoach(null); return;
  }
  const ci = currentTaskIndex(m);
  const reward = [m.reward.xp && `${m.reward.xp} XP`, m.reward.badge && `${BADGE_MAP[m.reward.badge]?.icon} ${BADGE_MAP[m.reward.badge]?.name} badge`, m.reward.card && `🃏 ${BODY_MAP[m.reward.card]?.name} card`].filter(Boolean).join(' + ');
  el.innerHTML = '';
  el.append(
    h('button', { class: 'toggle', 'aria-label': collapsed ? 'Expand tracker' : 'Collapse tracker', 'aria-expanded': String(!collapsed), onclick: () => { collapsed = !collapsed; renderTracker(); } }, collapsed ? '▾' : '▴'),
    h('div', { class: 't-cat' }, `${CATEGORY_LABELS[m.category] || 'Mission'} · current objective`),
    h('h3', {}, m.name),
    h('div', { class: 'collapsible' },
      h('p', { class: 'obj' }, m.objective),
      h('ul', { class: 'tasks' }, m.tasks.map((t, i) => { const s = taskStatus(m, i); return h('li', { class: s.done ? 'done' : i === ci ? 'current' : '' }, `${t.text}${s.total > 1 ? ` (${s.n}/${s.total})` : ''}`); })),
      h('div', { class: 'reward-line' }, `🎁 Reward: ${reward}`),
      h('div', { class: 'row' },
        currentTarget(m) ? h('button', { class: 'btn sm', onclick: () => { const id = currentTarget(m); app.scene.select(id); app.scene.focus(id); } }, '🧭 Take me there') : null,
        h('button', { class: 'btn sm ghost', onclick: () => openJournal(m.category) }, 'All missions'))));
  highlightToolbar(m, ci);
  updateCoach(m, ci);
  $$('.label').forEach(l => l.classList.toggle('target', l.dataset.id === currentTarget(m)));
}
function highlightToolbar(m, ci) {
  $$('.tbtn').forEach(b => b.classList.remove('attn'));
  if (!m || ci < 0) return;
  const ev = m.tasks[ci].event;
  const map = { 'lab:open': 'lab', 'sim:open': 'lab', 'compare:open': 'compare', 'map:open': 'map' };
  if (map[ev]) $(`.toolbar [data-act="${map[ev]}"]`)?.classList.add('attn');
  if (ev === 'sim:pause') $('#t-pause')?.classList.add('attn');
  if (ev === 'speed:change') $('#t-faster')?.classList.add('attn');
  if (ev === 'arrive') $('#t-focus')?.classList.add('attn');
}

// ---------------- Tutorial coach ----------------
const COACH = {
  drag: ['🖱️', 'Drag with the left mouse button to rotate the view', 'Touch: drag with one finger'],
  wheel: ['🔍', 'Scroll the mouse wheel to zoom', 'Touch: pinch with two fingers'],
  pan: ['✋', 'Right-click and drag (or Shift + drag) to pan', 'Touch: drag with two fingers'],
  move: ['⌨️', 'Press W A S D or the arrow keys to fly', 'Touch: use the joystick in the bottom-left corner'],
  select: ['👆', 'Click any planet or its name label to select it', 'Touch: tap a planet or label'],
  pause: ['⏳', 'Press Space (or the ❚❚ button) to pause, then again to resume', 'Touch: tap ❚❚ in the time bar twice']
};
function updateCoach(m, ci) {
  const c = $('#coach');
  const on = !!(m && m.tutorial && ci >= 0 && app.inGame());
  document.body.classList.toggle('coach-on', on);
  if (!on) { c.hidden = true; return; }
  const t = m.tasks[ci]; let [icon, a, b] = COACH[t.hint] || ['🎯', t.text, ''];
  if (document.body.classList.contains('touch') && b) { [a, b] = [b.replace(/^Touch: /, ''), 'Mouse/keyboard: ' + a]; a = a[0].toUpperCase() + a.slice(1); }
  const s = taskStatus(m, ci);
  c.hidden = false; c.innerHTML = '';
  c.append(h('div', { class: 'step' }, `Flight training · step ${ci + 1} of ${m.tasks.length}`), h('span', { class: 'icon', 'aria-hidden': 'true' }, icon), h('div', { class: 'instr' }, a + (s.total > 1 ? ` (${s.n}/${s.total})` : '')), h('div', { class: 'alt' }, b),
    h('div', { class: 'btnrow', style: 'justify-content:center' }, h('button', { class: 'btn sm ghost', onclick: () => app.skipTutorial() }, 'Skip tutorial')));
}
bus.on('task:done', ({ mission }) => { bus.emit('sfx', 'correct'); if (mission.tutorial) toast({ icon: '✅', title: 'Nice!', text: 'Training step complete', ms: 1400 }); });

// ---------------- Info panel ----------------
let currentTab = 'overview', scanTimer = null;
export function renderInfo(b, tab = 'overview') {
  const el = $('#info-panel');
  clearInterval(scanTimer); scanTimer = null;
  document.body.classList.toggle('ip-open', !!b);
  if (!b) { el.hidden = true; return; }
  currentTab = tab;
  el.hidden = false; el.innerHTML = '';
  const cv = h('canvas', { width: 144, height: 144, 'aria-hidden': 'true' });
  if (app.previews[b.id]) cv.getContext('2d').drawImage(app.previews[b.id], 0, 0, 144, 144);
  el.append(h('div', { class: 'ip-head' }, cv, h('div', {}, h('h3', {}, b.name), h('div', { class: 'cls' }, b.classification), progress.cards.includes(b.id) ? h('span', { class: 'chip good' }, '🃏 Card collected') : null),
    h('button', { class: 'x ip-close', 'aria-label': 'Close info panel', onclick: () => app.scene.deselect() }, '✕')));
  const tabs = h('div', { class: 'tabs', role: 'tablist' });
  const body = h('div', { class: 'ip-body', role: 'tabpanel' });
  const T = [['overview', 'Overview'], ['data', 'Data'], ['science', 'Science'], ['missions', 'Missions']];
  T.forEach(([k, l]) => tabs.append(h('button', { class: 'tab', role: 'tab', 'aria-selected': String(k === tab), onclick: () => renderInfo(b, k) }, l)));
  el.append(tabs, body);
  const d = b.data; const scanned = progress.scanned.includes(b.id);
  const fact = (k, v) => h('div', {}, h('dt', {}, k), h('dd', {}, v));
  if (tab === 'overview') {
    body.append(h('p', {}, d.significance), h('dl', { class: 'facts' }, fact('Distance from the Sun', d.distance), fact('Diameter', d.diameter), fact('Known moons', d.moons), fact('Distance from Earth', b.distanceFromEarth)));
  } else if (tab === 'data') {
    if (!scanned) body.append(h('p', { class: 'result info' }, '🔬 Run a sensor scan to log this data to your mission file. All values are real measurements.'));
    body.append(h('dl', { class: 'facts' }, fact('Distance from Sun', d.distance), fact('Orbital period', d.orbitalPeriod), fact('Rotation period', d.rotationPeriod), fact('Diameter', d.diameter), fact('Mass', d.mass), fact('Temperature', d.temperature), fact('Atmosphere', d.atmosphere), fact('Known moons', d.moons), fact('Discovery', b.discovery)));
  } else if (tab === 'science') {
    body.append(h('h2', {}, 'Scientific significance'), h('p', {}, d.significance), h('h2', {}, 'Fun facts'), h('ul', { class: 'funfacts' }, d.facts.map(f => h('li', {}, f))));
  } else {
    body.append(h('h2', {}, 'Real space missions'), h('p', {}, d.missions));
    const gm = MISSIONS.filter(m => m.target === b.id || m.tasks.some(t => t.target === b.id));
    body.append(h('h2', {}, 'Astro Lab missions'));
    if (!gm.length) body.append(h('p', { class: 'muted' }, 'No dedicated mission — but its knowledge check still earns XP and a card.'));
    gm.forEach(m => { const st = missionState(m.id); body.append(h('div', { class: `mission-row ${st}` }, h('div', { class: 'mr-main' }, h('b', {}, m.name), h('small', {}, m.objective)), st === 'complete' ? h('span', { class: 'chip good' }, 'Complete') : h('button', { class: 'btn sm primary', onclick: () => { trackMission(m.id); renderInfo(b, tab); } }, st === 'active' ? 'Track' : 'Start'))); });
  }
  // Actions
  const near = app.scene.cam.follow === b.id;
  const acts = h('div', { class: 'ip-actions' });
  acts.append(h('button', { class: 'btn primary', onclick: () => app.scene.focus(b.id) }, near ? '🎯 Re-centre' : '🚀 Travel (F)'));
  const scanBtn = h('button', { class: 'btn', disabled: !near, title: near ? 'Run a sensor scan' : 'Travel to this object first', onclick: () => runScan(b, scanBtn, body) }, scanned ? '🔬 Rescan' : '🔬 Scan');
  acts.append(scanBtn, h('button', { class: 'btn', onclick: () => bodyQuiz(b.id) }, progress.quizzesPassed.includes(`body:${b.id}`) ? '🧠 Quiz ✓' : '🧠 Quiz'));
  if (sitesFor(b.id).length) acts.append(h('button', { class: 'btn good', disabled: !near, title: near ? 'Choose a landing site' : 'Travel to this moon first', onclick: () => app.openSurface(b.id) }, '🧑‍🚀 Land'));
  el.append(acts);
  if (!near) acts.append(h('small', { class: 'muted tiny', style: 'width:100%' }, sitesFor(b.id).length ? 'Travel here to unlock the sensor scan and landing.' : 'Travel to this object to unlock the sensor scan.'));
}
function runScan(b, btn, body) {
  btn.disabled = true; bus.emit('sfx', 'scan');
  const bar = h('div', { class: 'scanbar', role: 'progressbar', 'aria-label': 'Scan progress' }, h('i'));
  body.prepend(h('p', { class: 'muted tiny' }, `Scanning ${b.name}: spectrometer, magnetometer, thermal imager…`), bar);
  let p = 0; const dur = settings.reducedMotion ? 300 : 2200, t0 = performance.now();
  scanTimer = setInterval(() => {
    p = Math.min(1, (performance.now() - t0) / dur); bar.firstChild.style.width = `${p * 100}%`;
    if (p >= 1) {
      clearInterval(scanTimer); scanTimer = null;
      const first = !progress.scanned.includes(b.id);
      gameEvent('scan', { id: b.id });
      if (first) { addXP(25, `${b.name} scan`); log(`Scanned ${b.name}`, '🔬'); }
      toast({ icon: '🔬', title: 'Scan complete', text: `${b.name} data logged. Check the Data tab.` });
      renderInfo(b, 'data');
    }
  }, 50);
}

// ---------------- Labels + guidance arrow ----------------
const labels = new Map();
function makeLabels() {
  const root = $('#labels');
  for (const b of BODIES) {
    const l = h('div', { class: `label ${b.type === 'moon' ? 'moon' : ''}`, 'data-id': b.id }, b.name);
    l.addEventListener('click', () => app.scene.select(b.id));
    root.append(l); labels.set(b.id, l);
  }
  $('#labels').style.display = settings.showLabels ? '' : 'none';
}
const arrowCv = $('#guide-arrow'); const actx = arrowCv.getContext('2d');
function onFrame() {
  if (!app.inGame()) return;
  const sc = app.scene;
  // labels
  if (settings.showLabels) {
    for (const [id, l] of labels) {
      const e = sc.bodies.get(id);
      const visible = sc._isPickable(e);
      const p = sc.project(id);
      if (!visible || !p || p.behind || p.x < -50 || p.x > p.w + 50 || p.y < -20 || p.y > p.h + 20) { if (l.style.display !== 'none') l.style.display = 'none'; continue; }
      const dist = sc.worldPos(id).distanceTo(sc.camera.position);
      const pr = e.radius / (dist * Math.tan(25 * Math.PI / 180)) * p.h / 2;
      l.style.display = '';
      l.style.transform = `translate(${p.x}px, ${p.y + Math.max(8, pr) + 4}px) translate(-50%, 0)`;
      l.classList.toggle('sel', id === sc.selected);
    }
  }
  // arrow
  const W = innerWidth, H = innerHeight;
  if (arrowCv.width !== W) arrowCv.width = W; if (arrowCv.height !== H) arrowCv.height = H;
  actx.clearRect(0, 0, W, H);
  const m = activeMission(); const tid = currentTarget(m);
  if (!tid || sc.cam.follow === tid && sc.cam.radius < 40) return;
  const p = sc.project(tid); if (!p) return;
  const t = performance.now() / 1000;
  let { x, y } = p; const pad = 46;
  const onScreen = !p.behind && x > pad && x < W - pad && y > pad + 60 && y < H - pad - 40;
  actx.strokeStyle = '#ffc857'; actx.fillStyle = '#ffc857'; actx.lineWidth = 2;
  if (onScreen) {
    const r = 16 + Math.sin(t * 4) * 3;
    actx.beginPath(); actx.moveTo(x, y - r); actx.lineTo(x + r, y); actx.lineTo(x, y + r); actx.lineTo(x - r, y); actx.closePath(); actx.stroke();
    actx.font = '600 12px system-ui'; actx.textAlign = 'center'; actx.fillText('TARGET', x, y - r - 6);
  } else {
    let dx = x - W / 2, dy = y - H / 2; if (p.behind) { dx = -dx; dy = -dy; }
    const ang = Math.atan2(dy, dx);
    const ex = W / 2 + Math.cos(ang) * (W / 2 - pad), ey = H / 2 + Math.sin(ang) * (H / 2 - pad - 30);
    const cx = Math.max(pad, Math.min(W - pad, ex)), cy = Math.max(pad + 60, Math.min(H - pad - 40, ey));
    actx.save(); actx.translate(cx, cy); actx.rotate(ang);
    actx.beginPath(); actx.moveTo(18 + Math.sin(t * 5) * 3, 0); actx.lineTo(-8, -11); actx.lineTo(-3, 0); actx.lineTo(-8, 11); actx.closePath(); actx.fill(); actx.restore();
    actx.font = '600 12px system-ui'; actx.textAlign = 'center'; actx.fillText(BODY_MAP[tid].name, cx - Math.cos(ang) * 26, cy - Math.sin(ang) * 26 + 4);
  }
}

// ---------------- Time bar ----------------
function initTimebar() {
  $('#t-pause').addEventListener('click', () => app.scene.togglePause());
  $('#t-slower').addEventListener('click', () => app.scene.changeSpeed(-1));
  $('#t-faster').addEventListener('click', () => app.scene.changeSpeed(1));
  $('#t-focus').addEventListener('click', () => { if (app.scene.selected) app.scene.focus(); else toast({ icon: '🎯', title: 'Nothing selected', text: 'Select a planet first, then focus.' }); });
  setInterval(() => app.inGame() && renderTime(app.scene.timeInfo()), 250);
}
function renderTime(ti) {
  $('#t-pause').textContent = ti.paused ? '▶' : '❚❚';
  $('#t-pause').setAttribute('aria-label', ti.paused ? 'Resume (Space)' : 'Pause (Space)');
  $('#t-date').textContent = fmtDate(ti.date);
  const d = ti.daysPerSec;
  $('#t-speed').textContent = ti.paused ? 'Paused' : `Time-lapse: 1 s = ${d < 1 ? (d * 24).toFixed(d * 24 < 10 ? 1 : 0) + ' h' : d + (d === 1 ? ' day' : ' days')}`;
}

// ---------------- Joystick ----------------
function initJoystick() {
  const j = $('#joystick'), stick = j.firstElementChild; let id = null, cx = 0, cy = 0;
  const R = 40;
  j.addEventListener('pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); e.preventDefault(); });
  j.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; app.scene.joy.x = 0; app.scene.joy.y = 0; stick.style.transform = ''; };
  j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
  function move(e) {
    let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
    stick.style.transform = `translate(${dx}px, ${dy}px)`;
    app.scene.joy.x = Math.abs(dx) > 6 ? dx / R : 0; app.scene.joy.y = Math.abs(dy) > 6 ? dy / R : 0;
  }
}
