// ASTRO LAB — Simulation Laboratory shell: sim picker, sim view, goals and rewards
import { $, h, toast } from './dom.js';
import { bus, progress, save, log, addXP, gameEvent, checkBadges, missionState, startMission } from '../systems/core.js';
import gravity from '../sims/gravity.js';
import orbit from '../sims/orbit.js';
import rocket from '../sims/rocket.js';
import habitability from '../sims/habitability.js';
import telescope from '../sims/telescope.js';
import blackhole from '../sims/blackhole.js';
import { confetti } from './modals.js';

export const SIMS = [gravity, orbit, rocket, habitability, telescope, blackhole];
let app, cleanup = null;
export function initLab(a) { app = a; }

export function renderLab(onBack, simId) {
  stopSim();
  const s = $('#screen-lab'); s.innerHTML = '';
  gameEvent('lab:open');
  if (simId) return openSim(SIMS.find(x => x.id === simId), onBack);
  s.append(h('div', { class: 'ps-head' }, h('button', { class: 'btn sm', onclick: onBack }, '← Back'), h('h2', {}, '🧪 Simulation Laboratory'),
    h('span', { class: 'chip violet' }, `${SIMS.filter(x => progress.sims[x.id]).length}/${SIMS.length} challenges complete`)));
  const grid = h('div', { class: 'lab-grid' });
  for (const sim of SIMS) {
    grid.append(h('button', { class: 'sim-card', onclick: () => openSim(sim, onBack) },
      h('span', { class: 'ic', 'aria-hidden': 'true' }, sim.icon), h('b', {}, sim.title), h('span', { class: 'muted tiny' }, sim.summary),
      h('span', { class: `chip ${progress.sims[sim.id] ? 'good' : 'warn'}` }, progress.sims[sim.id] ? '✓ Challenge complete' : `Challenge · ${sim.reward} XP`)));
  }
  s.append(grid);
}

function openSim(sim, onBack) {
  const s = $('#screen-lab'); s.innerHTML = '';
  // Simulation missions start automatically (without changing the tracked mission)
  const mid = sim.id === 'gravity' ? null : `sim-${sim.id}`;
  if (mid && missionState(mid) === 'available') startMission(mid, { track: false });
  gameEvent('sim:open', { id: sim.id });
  gameEvent('lab:open');
  const done = new Set(progress.sims[`${sim.id}:goals`] || []);
  s.append(h('div', { class: 'ps-head' }, h('button', { class: 'btn sm', onclick: () => renderLab(onBack) }, '← All simulations'), h('h2', {}, `${sim.icon} ${sim.title}`),
    h('button', { class: 'btn sm ghost', onclick: () => { stopSim(); onBack(); } }, 'Exit Lab')));
  const stage = h('div', { class: 'sim-stage' }); const side = h('div', { class: 'sim-side' });
  s.append(h('div', { class: 'sim-view' }, stage, side));
  const goalsEl = h('ul'); const controls = h('div');
  side.append(h('h3', {}, 'How to play'), h('ol', { class: 'tiny', style: 'padding-left:18px;line-height:1.5' }, sim.instructions.map(t => h('li', {}, t))),
    h('div', { class: 'goal' }, h('h4', {}, `🎯 Challenge · reward ${sim.reward} XP + badge`), goalsEl), controls,
    h('div', { class: 'science' }, h('h4', { style: 'color:var(--cyan);margin:0 0 6px' }, '🔬 The science'), h('div', { html: sim.science })));
  const drawGoals = () => { goalsEl.innerHTML = ''; sim.goals.forEach(g => goalsEl.append(h('li', { class: done.has(g.id) ? 'done' : '' }, g.text))); };
  drawGoals();
  const api = {
    controls,
    complete(goalId) {
      if (done.has(goalId)) return; done.add(goalId);
      progress.sims[`${sim.id}:goals`] = [...done]; save(); drawGoals();
      bus.emit('sfx', 'correct'); toast({ icon: '🎯', title: 'Goal reached', text: sim.goals.find(g => g.id === goalId)?.text || '' });
      if (sim.goals.every(g => done.has(g.id)) && !progress.sims[sim.id]) {
        progress.sims[sim.id] = true; save(); log(`Simulation challenge complete: ${sim.title}`, sim.icon);
        confetti(); addXP(sim.reward, `${sim.title} challenge`);
        gameEvent('sim:complete', { id: sim.id }); checkBadges();
      }
    },
    isDone: id => done.has(id)
  };
  // Make sure the stage has size before mounting
  requestAnimationFrame(() => { try { cleanup = sim.mount(stage, api); } catch (e) { console.error(e); stage.append(h('p', { class: 'empty' }, 'This simulation could not start on this device.')); } });
}

export function stopSim() { if (cleanup) { try { cleanup(); } catch {} cleanup = null; } }

// Shared helper for sims: a resizing HiDPI canvas with a frame loop
export function simCanvas(stage, draw) {
  const cv = h('canvas'); stage.append(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, raf = 0, last = performance.now(), alive = true;
  const fit = () => { const r = stage.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); W = Math.max(200, r.width); H = Math.max(200, r.height); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit(); const ro = new ResizeObserver(fit); ro.observe(stage);
  const loop = (t) => { if (!alive) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; if (!document.hidden) draw(ctx, W, H, dt); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return { cv, ctx, size: () => [W, H], stop() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); } };
}

// Range-slider helper
export function slider(parent, { label, min, max, step, value, fmt = v => v, oninput }) {
  const out = h('b', {}, fmt(value));
  const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
  inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); oninput(+inp.value); });
  parent.append(h('label', { class: 'field' }, h('span', {}, label, out), inp));
  return { input: inp, set(v) { inp.value = v; out.textContent = fmt(+v); } };
}
export function segmented(parent, label, options, value, onChange) {
  const wrap = h('div', { class: 'seg', role: 'group', 'aria-label': label });
  options.forEach(([v, l]) => wrap.append(h('button', { 'aria-pressed': String(v === value), onclick: e => { [...wrap.children].forEach(c => c.setAttribute('aria-pressed', String(c === e.currentTarget))); onChange(v); } }, l)));
  parent.append(h('div', { class: 'field' }, h('span', { class: 'muted tiny' }, label), wrap));
  return wrap;
}
