// Career-mode test harness. Serve the folder over http, open dev.html, then in the browser console:
//   const H = await import('/tools/career-harness.js'); await H.scene('emergency'); H.look(0, 2, 0, 1.6, -2); H.step(30);
//   H.use('Comm panel'); H.key('KeyE'); H.held(); await H.until(() => H.ctx().isDone('brief'));
// step() runs the frame loop at a fixed 1/60 s and renders once, so tests work even when the tab is in the background.
// shot(name, url) posts a JPEG of the 3D view to a local receiver (optional; used during development).
let C = null;
export const run = () => C?.careerDebug();
export const ctx = () => run()?.ctx;
export async function scene(id, { mode = 'practice', state } = {}) {
  C = await import('/js/career/career.js');
  run()?.exit(); await wait(300);
  if (state) { const S = await import('/js/career/state/careerSave.js'); const def = (await import(`/js/career/scenes/${id}.js`)).default; const st = S.sceneState(id, {}); for (const k of Object.keys(st)) delete st[k]; Object.assign(st, structuredClone(def.initialState || {}), state); mode = 'story'; }
  await C.startCareerScene(id, { mode }); await wait(900);
  return run();
}
export const wait = ms => new Promise(r => setTimeout(r, ms));
export function step(n = 10, dt = 1 / 60) { const r = run(); for (let i = 0; i < n; i++) for (const fn of r.world.updaters) fn(dt); r.world.render(); }
export function key(code, frames = 1) { const r = run(); r.input.pressed.add(code); r.input.keys.add(code); step(frames); r.input.keys.delete(code); }
export function hold(code, frames) { const r = run(); r.input.pressed.add(code); r.input.keys.add(code); step(frames); r.input.keys.delete(code); }
// Stand at (x, z) on the floor and look at a world point
export function look(x, z, tx, ty, tz) {
  const r = run(); r.player.seat = null; r.player.place(x, z, 0, 0);
  const y = r.player.pos.y + r.player.eye, dx = tx - x, dy = ty - y, dz = tz - z;
  r.player.yaw = Math.atan2(-dx, -dz); r.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); step(2);
}
// Fixed camera (for screenshots)
export function cam(x, y, z, tx, ty, tz) {
  const r = run(); const dx = tx - x, dy = ty - y, dz = tz - z, yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz));
  r.player.seat = { pos: new r.ctx.THREE.Vector3(x, y, z), yaw, yawRange: 0, pitchMin: pitch, pitchMax: pitch, roll: 0 }; r.player.yaw = yaw; r.player.pitch = pitch;
}
export const targets = label => run().ix.targets.filter(o => o.userData.it?.label === label || (label instanceof RegExp && label.test(o.userData.it?.label || '')));
// first matching target, preferring one that can be used right now (e.g. the pole still lying on the sand, not the one already placed)
export const target = label => { const all = targets(label); return all.find(o => o.userData.it.enabled() && o.visible !== false) || all[0]; };
// Use a labelled object directly (as if aimed at and E pressed), skipping any conversation it starts
export async function use(label, pick = null) {
  const o = target(label); if (!o) return `no target "${label}"`;
  if (!o.userData.it.enabled()) return `"${label}" is disabled`;
  o.userData.it.use(); await wait(30); await talkThrough(pick); return 'ok';
}
// Skip through any open conversation; at a choice, click the one matching `pick` (regexp) or the first one
export async function talkThrough(pick = null) {
  const r = run(); let guard = 0;
  while (r.dlg.active && guard++ < 200) {
    const ch = [...document.querySelectorAll('.cx-choice')];
    if (ch.length) (ch.find(b => pick && pick.test(b.textContent)) || ch[0]).click(); else r.dlg.skip?.();
    await wait(30);
  }
}
export const held = () => run().carry.held?.userData.carry?.name || null;
export async function until(fn, ms = 8000) { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > ms) return false; step(6); await wait(5); } return true; }
export async function shot(name, url = 'http://127.0.0.1:8791/') {
  const r = run(); step(3); const c = r.world.renderer.domElement; const W = 640, H = Math.round(640 * c.height / c.width);
  const o = document.createElement('canvas'); o.width = W; o.height = H; o.getContext('2d').drawImage(c, 0, 0, W, H);
  await fetch(url + name, { method: 'POST', body: o.toDataURL('image/jpeg', 0.82) }); return name;
}
// Click the option in an open pickOne() card whose text matches `re` (or the first one)
export async function choose(re = null) {
  for (let i = 0; i < 40; i++) { const b = [...document.querySelectorAll('.modal .cx-module, .modal button.as-btn')]; if (b.length) { (b.find(x => re && re.test(x.textContent)) || b[0]).click(); await wait(80); return true; } await wait(50); }
  return false;
}
// Local screenshot of the 3D view as a data URL (for checks without the receiver)
export function dataShot(w = 800) { const r = run(); step(2); const c = r.world.renderer.domElement; const o = document.createElement('canvas'); o.width = w; o.height = Math.round(w * c.height / c.width); o.getContext('2d').drawImage(c, 0, 0, o.width, o.height); return o.toDataURL('image/jpeg', 0.85); }
