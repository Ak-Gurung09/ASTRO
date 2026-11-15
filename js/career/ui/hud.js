// ASTRO LAB Career — in-scene HUD: objectives, crosshair, use prompt, captions, flash messages, top buttons.
import { h, esc } from '../../ui/dom.js';
import { settings } from '../../systems/core.js';

const KEY_LABEL = { kbm: { use: 'E', drop: 'G', rotate: 'R', crouch: 'C', throw: 'T', inventory: 'I', skip: 'X', spray: 'F / left mouse' }, pad: { use: 'Ⓐ', drop: 'Ⓨ', rotate: 'Ⓧ', crouch: 'L3', throw: 'RB', inventory: 'LB', skip: 'Ⓑ', spray: 'RT' }, touch: { use: '✋', drop: '⤓', rotate: '⟳', crouch: '⤵', throw: '↗', inventory: '🎒', skip: '⏭', spray: '💨' } };
export function keyFor(action, device) { return (KEY_LABEL[device] || KEY_LABEL.kbm)[action] || action; }

export class CareerHUD {
  constructor(root, { onPause, onHelp }) {
    this.root = root;
    this.obj = h('aside', { class: 'cx-obj glass', 'aria-live': 'polite' });
    this.cross = h('div', { class: 'cx-cross', 'aria-hidden': 'true' });
    this.prompt = h('div', { class: 'cx-prompt', hidden: true, 'aria-live': 'polite' });
    this.caption = h('div', { class: 'cx-caption', hidden: true, 'aria-live': 'polite' });
    this.flashEl = h('div', { class: 'cx-flash', hidden: true, role: 'status' });
    this.lockHint = h('div', { class: 'cx-lockhint', hidden: true }, 'Click the view to look around with the mouse');
    this.top = h('div', { class: 'cx-top' },
      h('button', { class: 'tbtn', 'aria-label': 'Controls help (H)', title: 'Controls (H)', onclick: () => onHelp() }, '❔', h('span', {}, 'Controls')),
      h('button', { class: 'tbtn', 'aria-label': 'Pause menu (Esc)', title: 'Pause (Esc)', onclick: () => onPause() }, '❚❚', h('span', {}, 'Pause')));
    root.append(this.obj, this.cross, this.prompt, this.caption, this.flashEl, this.lockHint, this.top);
    this.steps = []; this.title = '';
  }
  setObjectives(title, steps, current) {
    this.title = title; this.steps = steps; this.current = current;
    this.obj.innerHTML = '';
    this.obj.append(h('div', { class: 'cx-objhead' }, h('small', {}, 'OBJECTIVE'), h('button', { class: 'linkbtn tiny', 'aria-label': 'Show more or fewer objectives', onclick: () => this.obj.classList.toggle('alt') }, '▾')),
      h('b', {}, title),
      h('ol', {}, steps.map((s, i) => h('li', { class: s.done ? 'done' : i === current ? 'cur' : '' }, s.done ? '✓ ' : i === current ? '▶ ' : '', (this.touch && s.touch) || s.text))));
  }
  showPrompt(it, device, holding = false) {
    if (!it && holding) { // carrying something and not aiming at a socket: show what you can do with it
      this.cross.classList.remove('on'); const k = a => esc(keyFor(a, device));
      const html = `<kbd>${k('drop')}</kbd> Put down <kbd>${k('throw')}</kbd> Throw <kbd>${k('rotate')}</kbd> Turn <kbd>${k('inventory')}</kbd> Backpack`;
      if (this.prompt.innerHTML !== html) this.prompt.innerHTML = html; this.prompt.hidden = false; this.prompt.classList.add('hold'); return;
    }
    this.prompt.classList.remove('hold');
    if (!it) { this.prompt.hidden = true; this.cross.classList.remove('on'); return; }
    this.cross.classList.add('on');
    const key = it.key ? (typeof it.key === 'string' ? it.key : keyFor(it.key.action, device)) : keyFor('use', device);
    const html = `<kbd>${esc(key)}</kbd> ${esc(it.verb)} <b>${esc(it.label || '')}</b>`;
    if (this.prompt.innerHTML !== html) this.prompt.innerHTML = html;
    this.prompt.hidden = false;
  }
  // Sound captions (only shown when subtitles are on)
  cap(text, ms = 3000) {
    if (settings.subtitles === false) return;
    this.caption.textContent = text; this.caption.hidden = false;
    clearTimeout(this._capT); this._capT = setTimeout(() => this.caption.hidden = true, ms);
  }
  flash(text, kind = '', ms = 3200) {
    this.flashEl.textContent = text; this.flashEl.className = `cx-flash ${kind}`; this.flashEl.hidden = false;
    clearTimeout(this._flT); this._flT = setTimeout(() => this.flashEl.hidden = true, ms);
  }
  // Countdown / stopwatch chip under the objectives (null hides it). warn turns it orange.
  setTimer(text, warn = false) {
    if (!this.timerEl) { this.timerEl = h('div', { class: 'cx-timer glass', role: 'timer', 'aria-live': 'off' }); this.root.append(this.timerEl); }
    this.timerEl.hidden = text == null; if (text != null) { this.timerEl.textContent = text; this.timerEl.classList.toggle('warn', warn); }
  }
  // A small live readout panel (right side), e.g. buoyancy, oxygen, mass. rows: [[label, value, cls?]]
  setReadout(title, rows) {
    if (!this.readEl) { this.readEl = h('div', { class: 'cx-readout glass', 'aria-live': 'off' }); this.root.append(this.readEl); }
    if (!title) { this.readEl.hidden = true; return; }
    this.readEl.hidden = false; const html = `<b>${esc(title)}</b>` + rows.map(([l, v, c]) => `<div class="${c || ''}"><span>${esc(l)}</span><em>${esc(String(v))}</em></div>`).join('');
    if (this.readEl.innerHTML !== html) this.readEl.innerHTML = html;
  }
  // A "Skip ⏭" button for cinematic moments (rides, intros). fn = null hides it.
  setSkip(fn) {
    if (!this.skipEl) { this.skipEl = h('button', { class: 'cx-skipcine tbtn', hidden: true, 'aria-label': 'Skip (X)', title: 'Skip (X / gamepad B)', onclick: () => this._skipFn?.() }, 'Skip ⏭'); this.root.append(this.skipEl); }
    this._skipFn = fn; const show = !!fn; if (this.skipEl.hidden === show) this.skipEl.hidden = !show;
  }
  setLockHint(show) { this.lockHint.hidden = !show; }
  hideAll(hidden) { this.root.classList.toggle('cx-cinema', hidden); }
}
