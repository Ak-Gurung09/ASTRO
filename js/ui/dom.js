// ASTRO LAB — tiny DOM helpers, modal manager, toasts and sound
import { bus, settings } from '../systems/core.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}

// ---------- Modals (stacked, Esc closes the top one) ----------
const stack = [];
export function openModal({ title, body, foot, wide, onClose, cls = '', closable = true, label }) {
  const root = $('#modal-root');
  const prevFocus = document.activeElement;
  const box = h('div', { class: `modal glass ${wide ? 'wide' : ''} ${cls}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || 'Dialog' });
  const head = h('div', { class: 'modal-head' }, h('h2', {}, title || ''), closable ? h('button', { class: 'x', 'aria-label': 'Close', onclick: () => close() }, '✕') : null);
  const bodyEl = h('div', { class: 'modal-body' });
  if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.append(body);
  box.append(head, bodyEl);
  let footEl = null;
  if (foot) { footEl = h('div', { class: 'modal-foot' }); footEl.append(...[].concat(foot)); box.append(footEl); }
  const back = h('div', { class: 'modal-back' }, box);
  back.addEventListener('pointerdown', e => { if (e.target === back && closable) close(); });
  root.append(back);
  const entry = { back, close, closable };
  stack.push(entry);
  setTimeout(() => { const f = box.querySelector('button:not(.x), [tabindex], input, select'); (f || box.querySelector('.x'))?.focus({ preventScroll: true }); }, 30);
  bus.emit('sfx', 'open');
  function close() {
    const i = stack.indexOf(entry); if (i < 0) return;
    stack.splice(i, 1); back.remove();
    try { prevFocus?.focus?.({ preventScroll: true }); } catch {}
    onClose && onClose();
    bus.emit('modal:closed');
  }
  // Focus trap
  box.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', box).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  return { close, body: bodyEl, foot: footEl, box };
}
export function closeTopModal() { const t = stack[stack.length - 1]; if (t && t.closable) { t.close(); return true; } return !!t; }
export function modalOpen() { return stack.length > 0; }
export function closeAllModals() { while (stack.length) stack[stack.length - 1].close(); }

// ---------- Toasts ----------
export function toast({ icon = '📡', title = '', text = '', big = false, ms = 3200 }) {
  const t = h('div', { class: `toast ${big ? 'big' : ''}` }, h('span', { class: 'ti' }, icon), h('div', {}, h('b', {}, title), text ? h('small', {}, text) : null));
  const root = $('#toasts'); root.append(t);
  while (root.children.length > 4) root.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, ms);
}
bus.on('toast', toast);

// ---------- Sound (tiny WebAudio synth; no audio files) ----------
let ac = null;
function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; } } return ac; }
const SFX = {
  select: [[660, 0.06, 'sine', 0.05], [990, 0.08, 'sine', 0.04]],
  open: [[440, 0.05, 'triangle', 0.03]],
  arrive: [[392, 0.12, 'sine', 0.05], [587, 0.18, 'sine', 0.04]],
  correct: [[660, 0.08, 'triangle', 0.06], [880, 0.14, 'triangle', 0.06]],
  wrong: [[220, 0.18, 'sawtooth', 0.04]],
  badge: [[523, 0.1, 'triangle', 0.06], [659, 0.1, 'triangle', 0.06], [784, 0.25, 'triangle', 0.06]],
  complete: [[392, 0.12, 'triangle', 0.06], [523, 0.12, 'triangle', 0.06], [659, 0.12, 'triangle', 0.06], [784, 0.35, 'triangle', 0.07]],
  levelup: [[523, 0.1, 'square', 0.03], [784, 0.1, 'square', 0.03], [1047, 0.3, 'square', 0.03]],
  scan: [[300, 0.4, 'sine', 0.03]]
};
bus.on('sfx', name => {
  if (!settings.sound) return; const a = ctx(); if (!a) return;
  try {
    if (a.state === 'suspended') a.resume();
    let t = a.currentTime;
    for (const [f, d, type, vol] of SFX[name] || []) {
      const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.8;
    }
  } catch {}
});

export function fmtDate(d) { try { return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d.toISOString().slice(0, 10); } }
