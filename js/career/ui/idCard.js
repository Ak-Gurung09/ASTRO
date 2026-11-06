// ASTRO LAB Career — astronaut ID: choose how your ID photo looks, get an ID number, and draw the card (2D canvas, also used as a 3D texture).
import { h, openModal } from '../../ui/dom.js';
import { career } from '../state/careerSave.js';
import { save } from '../../systems/core.js';
import { drawEmblem } from './letter.js';
import { sfx } from '../engine/audio.js';

export const SKINS = ['#f3d2b8', '#e4b494', '#c68e6a', '#a86f4c', '#8d5a3b', '#5e3a26'];
export const HAIRS = ['#1a1210', '#4a2e1c', '#8a5a2e', '#d9b46a', '#b8452a', '#c9c4bc'];
export const STYLES = [['short', 'Short'], ['curly', 'Curly'], ['bun', 'Bun'], ['bob', 'Bob'], ['long', 'Long'], ['bald', 'Shaved']];
export const EYES = ['#4a3222', '#2a5a8a', '#3d6a3a', '#6a6a6a'];
export const defaultLook = () => ({ skin: 2, hair: 0, style: 'short', eyes: 0, glasses: false });

export function newIdNo() { return 'JATP-' + String(1000 + Math.floor(Math.random() * 9000)); }

// Portrait drawn into (x, y, w, h) on a 2D context
export function drawPortrait(c, look, x, y, w, hh) {
  const L = Object.assign(defaultLook(), look || {}); const skin = SKINS[L.skin], hair = HAIRS[L.hair];
  c.save(); c.beginPath(); c.rect(x, y, w, hh); c.clip();
  const g = c.createLinearGradient(0, y, 0, y + hh); g.addColorStop(0, '#cfe0f5'); g.addColorStop(1, '#9db8dc'); c.fillStyle = g; c.fillRect(x, y, w, hh);
  const cx = x + w / 2, s = w / 100;
  // shoulders in a blue training jumpsuit with a collar
  c.fillStyle = '#1f3f7a'; c.beginPath(); c.ellipse(cx, y + hh + 6 * s, 46 * s, 34 * s, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#e8eef8'; c.beginPath(); c.moveTo(cx - 12 * s, y + hh - 26 * s); c.lineTo(cx, y + hh - 12 * s); c.lineTo(cx + 12 * s, y + hh - 26 * s); c.fill();
  c.fillStyle = skin; c.fillRect(cx - 9 * s, y + hh - 44 * s, 18 * s, 20 * s);
  // hair behind the head
  c.fillStyle = hair;
  if (L.style === 'long') { c.beginPath(); c.ellipse(cx, y + 54 * s, 30 * s, 40 * s, 0, 0, 7); c.fill(); }
  if (L.style === 'bob') { c.beginPath(); c.ellipse(cx, y + 48 * s, 29 * s, 30 * s, 0, 0, 7); c.fill(); }
  if (L.style === 'bun') { c.beginPath(); c.arc(cx, y + 14 * s, 12 * s, 0, 7); c.fill(); }
  // head, ears
  c.fillStyle = skin; c.beginPath(); c.ellipse(cx, y + 46 * s, 22 * s, 27 * s, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(cx - 22 * s, y + 48 * s, 4 * s, 7 * s, 0, 0, 7); c.ellipse(cx + 22 * s, y + 48 * s, 4 * s, 7 * s, 0, 0, 7); c.fill();
  // hair on top
  c.fillStyle = hair;
  if (L.style !== 'bald') {
    c.beginPath(); c.ellipse(cx, y + 30 * s, 23.5 * s, 15 * s, 0, Math.PI, 0); c.fill();
    if (L.style === 'curly') for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(cx - 22 * s + i * 5.5 * s, y + 24 * s + Math.sin(i) * 2 * s, 6 * s, 0, 7); c.fill(); }
    if (L.style === 'short' || L.style === 'curly') { c.fillRect(cx - 23 * s, y + 28 * s, 46 * s, 6 * s); }
    if (L.style === 'bob' || L.style === 'long') { c.fillRect(cx - 24 * s, y + 28 * s, 6 * s, 30 * s); c.fillRect(cx + 18 * s, y + 28 * s, 6 * s, 30 * s); }
  } else { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(cx, y + 26 * s, 21 * s, 10 * s, 0, Math.PI, 0); c.fill(); }
  // face
  c.fillStyle = '#fff'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(cx + sx * 8.5 * s, y + 46 * s, 4.2 * s, 2.8 * s, 0, 0, 7); c.fill(); }
  c.fillStyle = EYES[L.eyes]; for (const sx of [-1, 1]) { c.beginPath(); c.arc(cx + sx * 8.5 * s, y + 46 * s, 2.2 * s, 0, 7); c.fill(); }
  c.fillStyle = '#111'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(cx + sx * 8.5 * s, y + 46 * s, 1 * s, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.6 * s; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(cx + sx * 4.5 * s, y + 39.5 * s); c.lineTo(cx + sx * 12.5 * s, y + 39 * s); c.stroke(); }
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(cx, y + 48 * s); c.lineTo(cx - 2 * s, y + 56 * s); c.lineTo(cx + 1.5 * s, y + 57 * s); c.stroke();
  c.strokeStyle = '#8a3b36'; c.lineWidth = 1.8 * s; c.beginPath(); c.arc(cx, y + 58 * s, 7 * s, 0.2, Math.PI - 0.2); c.stroke();
  if (L.glasses) { c.strokeStyle = '#222'; c.lineWidth = 1.4 * s; for (const sx of [-1, 1]) { c.beginPath(); c.arc(cx + sx * 8.5 * s, y + 46 * s, 6 * s, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(cx - 2.5 * s, y + 46 * s); c.lineTo(cx + 2.5 * s, y + 46 * s); c.stroke(); }
  c.restore();
}

// The card itself (640 x 400)
export function drawIdCard(c, { name, idNo, look, issued = new Date() }) {
  const W = 640, H = 400;
  c.fillStyle = '#f7f9fd'; c.beginPath(); c.roundRect(0, 0, W, H, 26); c.fill();
  c.fillStyle = '#0d2f6e'; c.beginPath(); c.roundRect(0, 0, W, 92, [26, 26, 0, 0]); c.fill();
  drawEmblem(c, 50, 46, 34);
  c.fillStyle = '#fff'; c.font = 'bold 26px system-ui, sans-serif'; c.fillText('JUNIOR ASTRONAUT TRAINING PROGRAM', 96, 42);
  c.font = '16px system-ui, sans-serif'; c.fillStyle = '#c9d6ff'; c.fillText('Astronaut Training Centre · Candidate identification', 96, 68);
  drawPortrait(c, look, 30, 116, 190, 230);
  c.strokeStyle = '#0d2f6e'; c.lineWidth = 3; c.strokeRect(30, 116, 190, 230);
  const row = (label, val, y) => { c.fillStyle = '#6a7488'; c.font = '15px system-ui, sans-serif'; c.fillText(label, 248, y); c.fillStyle = '#10182a'; c.font = 'bold 30px system-ui, sans-serif'; c.fillText(val, 248, y + 34); };
  row('NAME', name || 'Cadet', 136); row('ID NUMBER', idNo || '—', 216);
  row('ROLE', 'Astronaut Candidate', 296);
  c.fillStyle = '#6a7488'; c.font = '13px system-ui, sans-serif';
  try { c.fillText('Issued ' + issued.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }), 248, 372); } catch { /* old browsers */ }
  // barcode
  for (let i = 0; i < 40; i++) { const wbar = ((idNo || 'x').charCodeAt(i % (idNo || 'x').length) * (i + 3)) % 4 + 1; c.fillStyle = '#10182a'; c.fillRect(470 + i * 3.6, 340, wbar, 38); }
  c.fillStyle = '#e8423a'; c.fillRect(0, H - 8, W, 8);
}

// Create your ID: pick photo appearance, preview the card live, confirm.
export function openIdCreator() {
  return new Promise(resolve => {
    const cr = career(); const look = Object.assign(defaultLook(), cr.player.look || {});
    if (!cr.player.idNo) cr.player.idNo = newIdNo();
    const cv = h('canvas', { width: 640, height: 400, class: 'cx-idcard', 'aria-label': 'ID card preview' });
    const draw = () => drawIdCard(cv.getContext('2d'), { name: cr.player.name, idNo: cr.player.idNo, look });
    const swatches = (label, list, key) => h('div', { class: 'cx-idrow' }, h('small', {}, label), h('div', { class: 'cx-swatches', role: 'radiogroup', 'aria-label': label }, list.map((col, i) => {
      const b = h('button', { class: 'cx-sw', role: 'radio', 'aria-label': `${label} ${i + 1}`, style: `background:${col}`, onclick: () => { look[key] = i; sfx.ui(); upd(); } }); b.dataset.i = i; b.dataset.k = key; return b; })));
    const styles = h('div', { class: 'cx-idrow' }, h('small', {}, 'Hair style'), h('div', { class: 'cx-swatches' }, STYLES.map(([id, nm]) => { const b = h('button', { class: 'btn sm cx-st', onclick: () => { look.style = id; sfx.ui(); upd(); } }, nm); b.dataset.s = id; return b; })));
    const gl = h('label', { class: 'cx-tick' }, h('input', { type: 'checkbox', checked: look.glasses, onchange: e => { look.glasses = e.target.checked; upd(); } }), ' Glasses');
    const panel = h('div', { class: 'cx-idpanel' }, swatches('Skin tone', SKINS, 'skin'), styles, swatches('Hair colour', HAIRS, 'hair'), swatches('Eye colour', EYES, 'eyes'), gl);
    const upd = () => {
      panel.querySelectorAll('.cx-sw').forEach(b => b.setAttribute('aria-checked', String(look[b.dataset.k] === +b.dataset.i)));
      panel.querySelectorAll('.cx-st').forEach(b => b.classList.toggle('primary', b.dataset.s === look.style));
      draw();
    };
    const ok = h('button', { class: 'btn primary' }, 'Print my ID ▸');
    const m = openModal({ title: '🪪 Create your astronaut ID', label: 'Create astronaut ID', wide: true, closable: false, body: h('div', { class: 'cx-idwrap' }, h('div', {}, cv, h('p', { class: 'muted tiny' }, `Your ID number is ${cr.player.idNo}. The photo is taken at the kiosk camera: choose how you look in it.`)), panel), foot: [ok] });
    ok.onclick = () => { cr.player.look = look; save(); sfx.good(); m.close(); resolve(look); };
    upd();
  });
}

// Show your finished card (used from the HUD item button)
export function showIdCard() {
  const cr = career(); const cv = h('canvas', { width: 640, height: 400, class: 'cx-idcard' });
  drawIdCard(cv.getContext('2d'), { name: cr.player.name, idNo: cr.player.idNo, look: cr.player.look });
  openModal({ title: '🪪 Your astronaut ID', label: 'Astronaut ID', body: cv });
}
