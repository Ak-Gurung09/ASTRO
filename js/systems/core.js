// ASTRO LAB — event bus, persistence, progression and mission engine
import { MISSIONS, MISSION_MAP, STORY_ORDER, BADGES, BADGE_MAP, rankFor, dailyMission } from '../data/missions.js';

// ---------------- Event bus ----------------
const listeners = new Map();
export const bus = {
  on(evt, fn) { if (!listeners.has(evt)) listeners.set(evt, new Set()); listeners.get(evt).add(fn); return () => listeners.get(evt).delete(fn); },
  emit(evt, data) {
    const set = listeners.get(evt);
    if (set) for (const fn of [...set]) { try { fn(data); } catch (e) { console.error('[bus]', evt, e); } }
    const any = listeners.get('*');
    if (any) for (const fn of [...any]) { try { fn(evt, data); } catch (e) { console.error('[bus*]', e); } }
  }
};

// ---------------- Safe storage ----------------
const SAVE_KEY = 'astrolab.save.v1';
const SETTINGS_KEY = 'astrolab.settings.v1';
function readJSON(key) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; } }
function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; } }

export const defaultSettings = () => ({ quality: 'auto', sound: true, reducedMotion: matchMedia?.('(prefers-reduced-motion: reduce)').matches || false, showOrbits: true, showLabels: true, textScale: 1, joystick: 'auto',
  difficulty: 'normal', musicVol: 0.5, sfxVol: 0.8, textSpeed: 'normal', sensitivity: 1, invertY: false, subtitles: true, colorblind: false, language: 'en', controls: 'auto' });
export const settings = Object.assign(defaultSettings(), readJSON(SETTINGS_KEY) || {});
export function saveSettings() { writeJSON(SETTINGS_KEY, settings); bus.emit('settings', settings); }

const freshProgress = () => ({
  version: 1, created: Date.now(), xp: 0, badges: [], cards: [], files: [], discovered: [], scanned: [], quizzesPassed: [],
  missions: {}, taskProgress: {}, activeMission: null, sims: {}, log: [], dailyDone: {},
  stats: { perfectQuizzes: 0, quizzesTaken: 0, dailies: 0 }, tutorialSeen: false, surface: { sites: {}, jumps: {} }, career: null
});

export const progress = freshProgress();
export function hasSave() { return !!readJSON(SAVE_KEY); }
export function loadSave() { const s = readJSON(SAVE_KEY); if (s) { Object.assign(progress, freshProgress(), s); progress.stats = Object.assign(freshProgress().stats, s.stats || {}); } return !!s; }
export function resetProgress() { try { localStorage.removeItem(SAVE_KEY); } catch {} Object.keys(progress).forEach(k => delete progress[k]); Object.assign(progress, freshProgress()); bus.emit('progress'); }
let saveTimer = null;
export function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => writeJSON(SAVE_KEY, progress), 150); }
export function saveNow() { clearTimeout(saveTimer); writeJSON(SAVE_KEY, progress); }

export function log(text, icon = '📡') {
  progress.log.unshift({ t: Date.now(), text, icon });
  if (progress.log.length > 200) progress.log.length = 200;
  save();
}

// ---------------- Rewards ----------------
export function addXP(n, reason) {
  const before = rankFor(progress.xp);
  progress.xp += n;
  const after = rankFor(progress.xp);
  bus.emit('toast', { icon: '✨', title: `+${n} XP`, text: reason || '' });
  if (after.level > before.level) {
    log(`Promoted to ${after.name}!`, '⭐');
    bus.emit('toast', { icon: '⭐', title: 'Promotion!', text: `You are now ${after.name}.`, big: true });
    bus.emit('sfx', 'levelup');
  }
  bus.emit('progress'); save();
}
export function awardBadge(id) {
  if (!id || progress.badges.includes(id) || !BADGE_MAP[id]) return false;
  progress.badges.push(id);
  const b = BADGE_MAP[id];
  log(`Badge earned: ${b.name}`, b.icon);
  bus.emit('toast', { icon: b.icon, title: 'Badge earned', text: b.name, big: true });
  bus.emit('sfx', 'badge'); bus.emit('progress'); save();
  return true;
}
export function awardCard(id, name) {
  if (!id || progress.cards.includes(id)) return false;
  progress.cards.push(id);
  log(`Knowledge card collected: ${name || id}`, '🃏');
  bus.emit('toast', { icon: '🃏', title: 'Knowledge card', text: name || id });
  bus.emit('progress'); save(); checkBadges();
  return true;
}
export function awardFile(id, name) {
  if (!id || progress.files.includes(id)) return false;
  progress.files.push(id);
  log(`Mission file unlocked: ${name}`, '📁');
  bus.emit('toast', { icon: '📁', title: 'Mission file unlocked', text: name });
  bus.emit('progress'); save(); refreshComputed(); checkBadges();
  return true;
}
export function checkBadges() {
  for (const b of BADGES) if (b.check && !progress.badges.includes(b.id) && b.check(progress)) awardBadge(b.id);
}

// ---------------- Mission engine ----------------
let daily = dailyMission();
export function getDaily() { const d = dailyMission(); if (d.id !== daily.id) daily = d; return daily; }
export function getMission(id) { return MISSION_MAP[id] || (id === getDaily().id ? getDaily() : null); }
export function allMissions() { return [...MISSIONS, getDaily()]; }
export function missionState(id) { return progress.missions[id] || 'available'; }

export function taskStatus(mission, i) {
  const t = mission.tasks[i];
  if (t.computed) { const [n, total] = t.computed(progress); return { n, total, done: n >= total }; }
  const n = (progress.taskProgress[mission.id] || [])[i] || 0;
  const total = t.count || 1;
  return { n: Math.min(n, total), total, done: n >= total };
}
export function missionPct(m) {
  let d = 0; m.tasks.forEach((_, i) => { if (taskStatus(m, i).done) d++; });
  return d / m.tasks.length;
}
export function currentTaskIndex(m) {
  for (let i = 0; i < m.tasks.length; i++) if (!taskStatus(m, i).done) return i;
  return -1;
}

export function startMission(id, { track = true } = {}) {
  const m = getMission(id); if (!m) return;
  if (missionState(id) === 'complete') return;
  if (track || !progress.activeMission) progress.activeMission = id;
  if (missionState(id) !== 'active') { progress.missions[id] = 'active'; log(`Mission started: ${m.name}`, '🚀'); }
  if (!progress.taskProgress[id]) progress.taskProgress[id] = m.tasks.map(() => 0);
  save(); bus.emit('mission:active', m); bus.emit('progress');
  tryComplete(m);
}

function tryComplete(m) {
  if (missionState(m.id) === 'complete') return;
  if (m.tasks.every((_, i) => taskStatus(m, i).done)) completeMission(m);
}

export function completeMission(m) {
  progress.missions[m.id] = 'complete';
  if (m.category === 'daily') { progress.dailyDone[m.dailyKey] = true; progress.stats.dailies++; }
  log(`Mission complete: ${m.name}`, '🏁');
  const r = m.reward || {};
  const result = { mission: m, xp: r.xp || 0, badge: null, card: null };
  if (r.xp) { progress.xp += r.xp; }
  if (r.badge && !progress.badges.includes(r.badge)) { progress.badges.push(r.badge); result.badge = BADGE_MAP[r.badge]; log(`Badge earned: ${result.badge.name}`, result.badge.icon); }
  if (r.card && !progress.cards.includes(r.card)) { progress.cards.push(r.card); result.card = r.card; }
  if (progress.activeMission === m.id) progress.activeMission = null;
  save();
  bus.emit('mission:complete', result);
  bus.emit('progress');
  // Chain to next story mission automatically
  if (!progress.activeMission) {
    const next = STORY_ORDER.find(x => missionState(x) !== 'complete' && !(x === 'orientation' && progress.tutorialSkipped)) || allMissions().find(x => missionState(x.id) === 'active')?.id;
    if (next) setTimeout(() => { if (!progress.activeMission) startMission(next); }, 50);
  }
  refreshComputed();
  checkBadges();
}

// Re-evaluate computed tasks (e.g. Mission Commander) for every started mission
export function refreshComputed() {
  for (const m of MISSIONS) {
    if (!m.tasks.some(t => t.computed)) continue;
    const st = missionState(m.id);
    if (st === 'active') tryComplete(m);
    else if (st === 'available' && m.category !== 'story' && m.tasks.every((_, i) => taskStatus(m, i).done)) { startMission(m.id, { track: false }); }
  }
  bus.emit('progress');
}

// Feed gameplay events to all active missions (tracked one first)
export function gameEvent(evt, data = {}) {
  const target = data.id;
  // Record exploration facts used by other systems
  if (evt === 'scan' && target && !progress.scanned.includes(target)) progress.scanned.push(target);
  let changed = false;
  const candidates = allMissions().filter(m => {
    const st = missionState(m.id);
    if (st === 'active') return true;
    // Free exploration counts too: an untouched mission about this exact target starts automatically.
    return st === 'available' && target && m.tasks.some(t => t.event === evt && t.target === target);
  });
  for (const m of candidates) {
    if (missionState(m.id) === 'available') { progress.missions[m.id] = 'active'; log(`Mission started: ${m.name}`, '🚀'); if (!progress.activeMission) progress.activeMission = m.id; bus.emit('toast', { icon: '🚀', title: 'Mission started', text: m.name }); }
    const tp = progress.taskProgress[m.id] || (progress.taskProgress[m.id] = m.tasks.map(() => 0));
    m.tasks.forEach((t, i) => {
      if (t.computed || t.event !== evt) return;
      if (t.target && t.target !== target) return;
      // Sequential-ish: allow out of order, but each task only counts up to its total
      if ((tp[i] || 0) < (t.count || 1)) { tp[i] = (tp[i] || 0) + 1; changed = true; if (tp[i] >= (t.count || 1)) bus.emit('task:done', { mission: m, index: i }); }
    });
    if (changed) tryComplete(m);
  }
  if (changed) { save(); bus.emit('progress'); }
  bus.emit('game:' + evt, data);
}

export function activeMission() { return progress.activeMission ? getMission(progress.activeMission) : null; }
export function trackMission(id) { if (missionState(id) === 'active') { progress.activeMission = id; save(); bus.emit('mission:active', getMission(id)); bus.emit('progress'); } else startMission(id); }

export { rankFor };
