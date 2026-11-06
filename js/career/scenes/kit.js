// ASTRO LAB Career — shared pieces for training exercises: a room, an instructor, a timer, and the finish/score/return-to-hub flow.
import * as THREE from '../../../vendor/three.module.js';
import { roomShell, TEX, MAT } from '../models/materials.js';
import { makeSign, makeCeilingLight } from '../models/props.js';
import { makePerson, animatePerson } from '../models/humans.js';
import { makeUsable } from '../engine/interact.js';
import { nextModule } from '../data/modules.js';

// Room with walls, ceiling lights and a title sign on the north wall. Returns the shell group.
export function trainingRoom(ctx, { w = 14, d = 10, hgt = 3.6, title, sub = '', floor, wall, bg = 0x0d1018, light = 1 } = {}) {
  const { scene, world, player } = ctx;
  scene.background = new THREE.Color(bg);
  const shell = roomShell({ w, d, hgt, floor: floor || TEX.vinyl, wall: wall || TEX.wallPanel }); scene.add(shell.group);
  for (const [x0, x1, z0, z1] of shell.colliders) player.addBox(x0, x1, z0, z1, 0, hgt + 2);
  scene.add(new THREE.HemisphereLight(0xf2f5ff, 0x4a4e58, 0.75 * light));
  const key = world.shadowLight(new THREE.SpotLight(0xfff3e2, 55 * light, Math.max(w, d) * 1.6, 1.1, 0.6, 1.3)); key.position.set(0, hgt - 0.1, 0); key.target.position.set(0, 0, 0); scene.add(key, key.target);
  for (const x of [-w / 3, w / 3]) for (const z of [-d / 4, d / 4]) { const p = new THREE.PointLight(0xfff1dc, 6 * light, Math.max(w, d), 1.4); p.position.set(x, hgt - 0.8, z); scene.add(p); }
  for (let x = -w / 2 + 2; x <= w / 2 - 2; x += 3.5) for (const z of [-d / 4, d / 4]) { const l = makeCeilingLight(1.2, 0.3); l.position.set(x, hgt - 0.02, z); scene.add(l); }
  if (title) { const s = makeSign(title, sub, Math.min(4, w * 0.3)); s.position.set(0, hgt - 0.75, -d / 2 + 0.02); scene.add(s); }
  return shell;
}

// Instructor NPC that can be talked to. talkFn() returns a dialogue script for the current situation.
export function instructor(ctx, look, name, [x, z, rot = 0], talkFn) {
  const rig = makePerson(look); rig.root.position.set(x, 0, z); rig.root.rotation.y = rot; ctx.scene.add(rig.root);
  ctx.player.addBox(x - 0.25, x + 0.25, z - 0.25, z + 0.25, 0, 1.8);
  let busy = false;
  const talk = async (script) => { busy = true; await ctx.talk(script); busy = false; };
  makeUsable(rig.root, { label: name, verb: 'Talk to', range: 3, enabled: () => !busy, use: () => talk(talkFn()) }); ctx.ix.add(rig.root);
  const cam = new THREE.Vector3();
  const update = dt => { ctx.world.camera.getWorldPosition(cam); const w = ctx.dlg.active ? (ctx.dlg.el.querySelector('.cx-who')?.textContent || '') : ''; animatePerson(rig, dt, { lookAt: cam.distanceTo(rig.root.position) < 8 ? cam : null, talking: w === name }); };
  return { rig, talk, update, get busy() { return busy; } };
}

// Countdown sized by difficulty (Easy: stopwatch only). Shows on the HUD. over = ran past the limit.
export function timer(ctx, baseSeconds) {
  const lim = ctx.diff.timeLimit ? Math.round(baseSeconds * ctx.diff.timeLimit) : null;
  const T = { t: 0, lim, running: false, over: false,
    start() { this.running = true; }, stop() { this.running = false; },
    update(dt, blocked) {
      if (!this.running) return; if (!blocked) this.t += dt;
      const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
      if (lim) { const left = lim - this.t; if (left < 0 && !this.over) { this.over = true; ctx.hud.flash('Time is up! Finish the task: going over the limit costs points.', 'bad'); ctx.sfx.wrong(); } ctx.hud.setTimer(left >= 0 ? `⏱ ${fmt(left)}` : `⏱ +${fmt(-left)}`, left < 20); }
      else ctx.hud.setTimer(`⏱ ${fmt(this.t)}`);
    },
    hide() { ctx.hud.setTimer(null); }
  };
  return T;
}

// Score, rewards and the results card. In the story, Continue returns to the training centre hub.
export function finishExercise(ctx, { id, title, science, xp = 120, badge, card, timer: T, bonus = 0, minScore = 30, continueLabel, next, onContinue }) {
  T?.stop(); T?.hide(); ctx.hud.setReadout(null);
  const pen = ctx.diff.mistakePenalty, mistakes = [...ctx.state.mistakes];
  if (T?.over) mistakes.push(`Went ${Math.round(T.t - T.lim)} s over the time limit.`);
  const score = Math.max(minScore, Math.min(100, Math.round(100 - mistakes.length * pen + bonus)));
  const story = ctx.mode === 'story';
  ctx.finish({ id, title, score, mistakes, science, xp: Math.round(xp * ctx.diff.scoreMult), badge, card,
    continueLabel: continueLabel || (story ? 'Back to the training centre' : 'Main menu'),
    next: next || (story ? (() => { const n = nextModule(); return n ? `Next module: ${n.name}. Start it from the training dashboard.` : 'Open the training dashboard to see what is next.'; })() : 'Return to the main menu.'),
    onContinue: onContinue || (rt => { if (story) { rt.finished = false; ctx.goto('centre'); } else rt.exit(); }) });
  ctx.state.mistakes = [];
}

// Small helpers
export const glowMat = (col, i = 1.5) => MAT.glow(col, i);
export function floorMark(scene, x, z, w, d, col = 0xf2b632) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.006, z); scene.add(m); return m; }
export function invisibleMark(scene, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(x, y, z); scene.add(m); return m; }
