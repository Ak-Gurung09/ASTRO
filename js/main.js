// ASTRO LAB — boot, screen routing, keyboard controls and game flow
import { $, $$, h, openModal, closeTopModal, modalOpen, closeAllModals, toast } from './ui/dom.js';
import { bus, settings, progress, loadSave, hasSave, save, saveHealthy, startMission, missionState, awardCard, activeMission, log, gameEvent } from './systems/core.js';
import { generateTexture, TEXTURE_IDS, spherePreview } from './scene/textures.js';
import { upgradeMoonTextures } from './scene/realMaps.js';
import { BODIES } from './data/solarSystem.js';
import { initModals, openJournal, openLogbook, openHelp, openSettings, openMap, openCompare, DESKTOP_KEYS } from './ui/modals.js';
import { initHUD, renderTracker, renderInfo } from './ui/hud.js';
import { initPanels, renderArchive, renderExplorer } from './ui/archive.js';
import { initLab, renderLab, stopSim } from './ui/lab.js';
import { initSurface, openSitePicker, surfaceEsc } from './ui/surface.js';
import { STORY_ORDER } from './data/missions.js';
import { initCareer, startCareerScene, careerEsc, careerDebug } from './career/career.js';
import { initCareerMenus, openNewGame, resumeGame, openTrainingModules, openAchievements, openCredits, quitGame, openFreeExplore } from './career/ui/menus.js';
import { careerStarted } from './career/state/careerSave.js';
import { playMusic } from './career/engine/audio.js';
import { startMenuParticles } from './career/ui/menuFx.js';
import { preloadModels } from './assets/models.js';

const app = {
  scene: null, textures: {}, previews: {}, mode: 'loading', returnTo: 'menu',
  inGame: () => app.mode === 'game' && !!app.scene,
  open, toMenu, toGame, skipTutorial, applyJoystick, show: id => show(id),
  openSurface: bodyId => (app.scene ? openSitePicker(bodyId) : no3D()),
  menuAction: a => menuAction(a),
  hasExploreSave: () => !!(progress.tutorialSeen || Object.keys(progress.missions || {}).length)
};
window.__astrolab = app; // handy for debugging in the console
app.careerRun = () => careerDebug();
preloadModels(); // imported GLB models load in the background; scenes use the built-in models until (or unless) they arrive

// ---------------- Error handling ----------------
let errShown = 0;
window.addEventListener('error', e => { console.error(e.error || e.message); if (errShown++ < 2 && app.mode !== 'loading') toast({ icon: '⚠️', title: 'Something went wrong', text: 'The game recovered. If anything looks odd, reload the page.' }); });
window.addEventListener('unhandledrejection', e => console.error(e.reason));

function fatal(msg) { const f = $('#fatal'); f.hidden = false; f.innerHTML = `<div class="glass" style="padding:24px;max-width:520px"><h2>ASTRO LAB couldn't start</h2><p>${msg}</p><button class="btn primary" onclick="location.reload()">Reload</button></div>`; }

// ---------------- Screens ----------------
function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${id}`));
  $(`#screen-${id}`)?.classList.add('fade-in');
  app.mode = id;
  const scVisible = ['menu', 'game', 'briefing'].includes(id);
  $('#scene-root').style.visibility = scVisible ? 'visible' : 'hidden';
  $('#labels').style.visibility = id === 'game' ? 'visible' : 'hidden';
  $('#guide-arrow').style.visibility = id === 'game' ? 'visible' : 'hidden';
  app.scene?.setActive(scVisible);
  if (id !== 'lab') stopSim();
  if (id === 'game') { renderTracker(); }
}
function toMenu() {
  cancelBegin(); closeAllModals(); show('menu');
  $('#btn-resume').hidden = !careerStarted();
  $('#menu-note').textContent = !app.scene ? '3D view unavailable on this device. Archive, Explorer and Simulations still work.' : careerStarted() ? '' : 'New here? Press New Game to start your astronaut story.';
  app.scene?.deselect(); app.scene?.overview();
  if (musicPrimed) playMusic('menu');
}
function toGame() {
  if (!app.scene) return no3D();
  closeAllModals(); show('game');
}
function no3D() { openModal({ title: '3D view unavailable', body: '<p>Your browser or device could not start WebGL, which the 3D solar system needs. Try updating your browser or enabling hardware acceleration.</p><p>You can still play the Mission Archive, Celestial Explorer and Simulation Laboratory.</p>' }); }
function open(what) {
  if (what === 'archive' || what === 'explorer' || what === 'lab') {
    const from = app.mode === 'game' ? 'game' : 'menu'; app.returnTo = from;
    const back = () => (from === 'game' ? toGame() : toMenu());
    closeAllModals(); show(what);
    if (what === 'archive') renderArchive(back); else if (what === 'explorer') renderExplorer(back); else renderLab(back);
    return;
  }
  ({ journal: () => openJournal(activeMission()?.category || 'story'), logbook: () => openLogbook(), help: openHelp, settings: openSettings, map: () => app.scene ? openMap() : no3D(), compare: openCompare, menu: () => toMenu() })[what]?.();
}

// ---------------- Boot ----------------
async function boot() {
  document.documentElement.style.setProperty('--ts', settings.textScale);
  if (!['auto', 'low', 'medium', 'high', 'ultra'].includes(settings.quality)) settings.quality = 'auto';
  document.body.classList.toggle('reduced-motion', !!settings.reducedMotion);
  if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');
  applyJoystick();
  loadSave();
  const fill = $('#load-fill'), txt = $('#load-text'), bar = $('.load-bar');
  const steps = ['Calibrating telescopes…', 'Mapping planetary surfaces…', 'Charting orbits…', 'Fuelling the observatory…', 'Synchronising mission files…'];
  const q = settings.quality === 'low' ? 'low' : (matchMedia('(max-width: 720px)').matches ? 'medium' : 'high');
  for (let i = 0; i < TEXTURE_IDS.length; i++) {
    const id = TEXTURE_IDS[i];
    const small = BODIES.some(b => b.vis.tex === id && b.vis.radius < 0.5 && b.id !== 'mercury');
    try { app.textures[id] = generateTexture(id, q, small); } catch (e) { console.warn('Texture failed', id, e); app.textures[id] = null; }
    const p = Math.round((i + 1) / (TEXTURE_IDS.length + 2) * 100);
    fill.style.width = `${p}%`; bar.setAttribute('aria-valuenow', p); txt.textContent = steps[Math.floor(i / TEXTURE_IDS.length * steps.length)];
    await new Promise(r => setTimeout(r, 0));
  }
  // Swap in real maps of the moons (NASA / LRO / Cassini / Galileo-based). Any failure keeps the generated texture.
  txt.textContent = 'Loading real moon maps…';
  try { app.realMaps = await upgradeMoonTextures(app.textures, q); } catch (e) { console.warn(e); app.realMaps = []; }
  for (const b of BODIES) { try { app.previews[b.id] = spherePreview(app.textures[b.vis.tex], 144, { emissive: b.id === 'sun' }); } catch { app.previews[b.id] = null; } }
  initModals(app); initPanels(app); initLab(app); initSurface(app); initCareer(app); initCareerMenus(app, startCareerScene);
  document.body.classList.toggle('cb', !!settings.colorblind);
  startMenuParticles($('#menu-particles'), () => app.mode === 'menu');
  const prime = () => { musicPrimed = true; if (app.mode === 'menu' || app.mode === 'quit') playMusic('menu'); removeEventListener('pointerdown', prime, true); removeEventListener('keydown', prime, true); };
  addEventListener('pointerdown', prime, true); addEventListener('keydown', prime, true);
  // 3D
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('WebGL not supported');
    const { SolarScene } = await import('./scene/solarScene.js');
    app.scene = new SolarScene($('#scene-root'), app.textures);
    app.scene.cam.radius = 260; app.scene.cam.phi = 0.9;
    initHUD(app);
  } catch (e) { console.error(e); app.scene = null; }
  fill.style.width = '100%'; txt.textContent = 'Ready.';
  initMenu(); initBriefing(); initKeys(); initToolbar();
  bus.on('card:award', ({ id, name }) => awardCard(id, name));
  bus.on('frame', dt => { if (app.mode === 'menu' || app.mode === 'briefing') app.scene.cam.theta += dt * 0.04; });
  await new Promise(r => setTimeout(r, settings.reducedMotion ? 0 : 450));
  toMenu();
}

// ---------------- Menu ----------------
function initMenu() {
  $('#screen-menu').addEventListener('click', e => {
    const a = e.target.closest('[data-action]')?.dataset.action; if (a) menuAction(a);
  });
  $('#btn-unquit').addEventListener('click', () => toMenu());
}
function menuAction(a) {
  {
    if (a === 'newgame') openNewGame();
    if (a === 'resume') resumeGame();
    if (a === 'training') openTrainingModules();
    if (a === 'explore') openFreeExplore();
    if (a === 'logbook') openLogbook();
    if (a === 'achievements') openAchievements();
    if (a === 'credits') openCredits();
    if (a === 'quit') quitGame();
    if (a === 'start') { if (!app.scene) return no3D(); show('briefing'); renderBriefing(); setTimeout(() => $('#btn-begin').focus(), 50); }
    if (a === 'continue') { if (!app.scene) return no3D(); toGame(); app.scene.cinematicIntro(activeTargetOr('earth')); if (!activeMission()) startNextStory(); toast({ icon: '👋', title: 'Welcome back, Cadet', text: activeMission() ? `Current mission: ${activeMission().name}` : '' }); }
    if (a === 'archive' || a === 'lab' || a === 'explorer') open(a);
    if (a === 'settings') openSettings();
    if (a === 'surface') app.openSurface(null);
  }
}
function activeTargetOr(d) { const m = activeMission(); return (m && m.target) || d; }
function startNextStory() { for (const id of STORY_ORDER) if (missionState(id) !== 'complete' && !(id === 'orientation' && progress.tutorialSkipped)) { startMission(id); return; } }

// ---------------- Briefing ----------------
const EARLY = [['Complete basic flight and camera training', ['orientation']], ['Explore Earth and the Moon', ['homeworld', 'lunar']], ['Visit Mars', ['redplanet']], ['Complete the Gravity Simulator challenge', ['gravity']], ['Unlock the first Mission Commander badge', ['commander']]];
function renderBriefing() {
  const ol = $('#brief-checklist'); ol.innerHTML = '';
  for (const [t, ids] of EARLY) ol.append(h('li', { class: ids.every(id => missionState(id) === 'complete') ? 'done' : '' }, t));
  const ctr = $('#brief-controls'); ctr.innerHTML = '';
  const rows = [['Drag', 'Rotate camera'], ['Wheel / pinch', 'Zoom'], ['Right-drag / 2 fingers', 'Pan'], ['Click / tap', 'Select a world'], ['W A S D / joystick', 'Move'], ['Space', 'Pause orbits'], ['F', 'Travel to selection'], ['J · M · H', 'Journal · Map · Help']];
  for (const [k, v] of rows) ctr.append(h('span', { class: 'k' }, h('kbd', {}, k)), h('span', {}, v));
  $('#btn-skip').hidden = missionState('orientation') === 'complete';
  $('#btn-begin').textContent = missionState('orientation') === 'complete' ? 'RESUME MISSION' : 'BEGIN MISSION';
}
function initBriefing() {
  $('#btn-begin').addEventListener('click', () => begin(false));
  $('#btn-skip').addEventListener('click', () => begin(true));
  $('#btn-brief-back').addEventListener('click', () => toMenu());
}
// Begin / Skip start the game after a 650 ms warp. Only one start can be pending, and leaving the briefing
// (← Main menu or Esc) cancels it, so a double-click can't start the mission twice.
let beginTimer = null;
function begin(skip) {
  if (beginTimer) return;
  warp();
  progress.tutorialSeen = true; save();
  beginTimer = setTimeout(() => {
    beginTimer = null;
    if (app.mode !== 'briefing') return;
    toGame();
    app.scene.cinematicIntro('earth');
    if (skip) { progress.tutorialSkipped = true; save(); log('Tutorial skipped — orientation remains available in the Journal.', '⏭'); if (missionState('homeworld') !== 'complete') startMission('homeworld'); else startNextStory(); }
    else if (missionState('orientation') !== 'complete') { startMission('orientation'); log('Reported for duty as Astro Lab Cadet.', '🧑‍🚀'); }
    else startNextStory();
    renderTracker();
  }, settings.reducedMotion ? 0 : 650);
}
function cancelBegin() {
  if (!beginTimer) return;
  clearTimeout(beginTimer); beginTimer = null;
  $$('.warp, .warp-lines').forEach(w => w.remove());
}
function skipTutorial() {
  if (progress.tutorialSkipped && activeMission()?.id !== 'orientation') return; // already skipped (e.g. a double-click)
  progress.tutorialSkipped = true;
  if (activeMission()?.id === 'orientation') { progress.activeMission = null; save(); }
  startMission(missionState('homeworld') === 'complete' ? 'lunar' : 'homeworld');
  toast({ icon: '⏭', title: 'Tutorial skipped', text: 'Replay Cadet Orientation any time from the Journal.' });
}
function warp() {
  if (settings.reducedMotion) return;
  const cv = h('canvas', { class: 'warp-lines' }); document.body.append(cv, h('div', { class: 'warp' }));
  const ctx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight; const cx = cv.width / 2, cy = cv.height / 2;
  const L = Array.from({ length: 220 }, () => ({ a: Math.random() * 6.28, r: Math.random() * 40, v: 4 + Math.random() * 16 }));
  const t0 = performance.now(), veil = $$('.warp').pop(); (function step() { if (!cv.isConnected) { veil?.remove(); return; } ctx.fillStyle = 'rgba(3,4,14,0.35)'; ctx.fillRect(0, 0, cv.width, cv.height); for (const l of L) { const r2 = l.r + l.v * 3; ctx.strokeStyle = `rgba(${150 + Math.random() * 100},${180 + Math.random() * 60},255,0.8)`; ctx.beginPath(); ctx.moveTo(cx + Math.cos(l.a) * l.r, cy + Math.sin(l.a) * l.r); ctx.lineTo(cx + Math.cos(l.a) * r2, cy + Math.sin(l.a) * r2); ctx.stroke(); l.r = r2; l.v *= 1.08; } if (performance.now() - t0 < 1100) requestAnimationFrame(step); else { cv.remove(); veil?.remove(); } })();
}

// ---------------- Toolbar ----------------
function initToolbar() {
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.closest('#screen-menu')) open(b.dataset.act); });
}
let musicPrimed = false;
function applyJoystick() {
  document.body.classList.toggle('joy-on', settings.joystick === 'on');
  document.body.classList.toggle('joy-off', settings.joystick === 'off');
  const b = document.body;
  if (settings.controls === 'touch') b.classList.add('touch');
  else if (settings.controls === 'kbm' || settings.controls === 'gamepad') b.classList.remove('touch');
  else if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) b.classList.add('touch');
  b.classList.toggle('force-kbm', settings.controls === 'kbm' || settings.controls === 'gamepad');
}

// ---------------- Keyboard ----------------
function initKeys() {
  const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE']);
  let modTap = null;
  window.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'range';
    if (e.key === 'Escape') { e.preventDefault(); handleEsc(); return; }
    if (typing) return;
    if (app.mode === 'career') return; // the career scene handles its own keys
    // H opens the help for the screen you're on: the surface controls during an expedition, the main help elsewhere
    if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey && !e.altKey) { if (!modalOpen()) { if (app.mode !== 'surface') openHelp(); else if (app.surface?.running) app.surface.help(); } return; }
    if (!app.inGame() || modalOpen()) return;
    const sc = app.scene;
    if (MOVE.has(e.code)) { sc.keys.add(e.code); if (modTap) modTap.moved = true; if (e.code.startsWith('Arrow')) e.preventDefault(); return; }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ControlLeft' || e.code === 'ControlRight') { sc.keys.add(e.code); if (!e.repeat) modTap = { code: e.code, t: performance.now(), moved: false }; return; }
    if (e.ctrlKey || e.metaKey || e.altKey) { if (modTap) modTap.moved = true; return; }
    switch (e.code) {
      case 'Space': e.preventDefault(); if (!e.repeat) sc.togglePause(); break;
      case 'KeyF': if (sc.selected) sc.focus(); else toast({ icon: '🎯', title: 'Nothing selected', text: 'Click or tap a planet first.' }); break;
      case 'KeyM': openMap(); break;
      case 'KeyJ': openJournal(activeMission()?.category || 'story'); break;
      case 'KeyL': openLogbook(); break;
    }
  });
  window.addEventListener('keyup', e => {
    app.scene?.keys.delete(e.code);
    if (modTap && modTap.code === e.code) {
      if (!modTap.moved && performance.now() - modTap.t < 450 && app.inGame() && !modalOpen()) app.scene.changeSpeed(e.code.startsWith('Shift') ? 1 : -1);
      modTap = null;
    }
  });
  window.addEventListener('blur', () => app.scene?.keys.clear());
  window.addEventListener('pointerdown', () => { if (modTap) modTap.moved = true; }, true);
  window.addEventListener('wheel', () => { if (modTap) modTap.moved = true; }, { capture: true, passive: true });
}
function handleEsc() {
  if (closeTopModal()) return;
  if (app.mode === 'surface') { surfaceEsc(); return; }
  if (app.mode === 'career') { careerEsc(); return; }
  if (app.mode === 'quit') { toMenu(); return; }
  if (['archive', 'explorer', 'lab'].includes(app.mode)) { app.returnTo === 'game' ? toGame() : toMenu(); return; }
  if (app.mode === 'briefing') { toMenu(); return; }
  if (app.mode === 'game') {
    if (app.scene.selected) { app.scene.deselect(); return; }
    const m = openModal({ title: '❚❚ Paused', label: 'Pause menu', body: saveHealthy() ? '<p>Your progress is saved automatically.</p>' : '<p>⚠️ Progress can\'t be saved right now: this browser is blocking or out of storage.</p>', foot: [
      h('button', { class: 'btn', onclick: () => { m.close(); toMenu(); } }, '☰ Main menu'),
      h('button', { class: 'btn', onclick: () => { m.close(); openHelp(); } }, '❔ Controls'),
      h('button', { class: 'btn primary', onclick: () => m.close() }, '▶ Resume')] });
  }
}

boot().catch(e => { console.error(e); fatal('An unexpected error occurred while loading. Please reload the page.'); });
