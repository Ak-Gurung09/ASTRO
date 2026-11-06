// ASTRO LAB Career — dialogue with typewriter text, speaker names and player choices.
// Script: [{ id?, who, text, choices?: [{ text, goto?, set? }], goto?, do?() }]. Returns the list of choices picked.
import { h } from '../../ui/dom.js';
import { settings } from '../../systems/core.js';
import { sfx } from './audio.js';

const CPS = { slow: 22, normal: 45, fast: 90, instant: 1e6 };
export class Dialogue {
  constructor(root) {
    this.root = root; this.active = false;
    this.el = h('div', { class: 'cx-dlg glass', hidden: true, role: 'dialog', 'aria-live': 'polite', 'aria-label': 'Conversation' });
    root.append(this.el);
  }
  run(script, ctx = {}) {
    return new Promise(resolve => {
      this.active = true; this.el.hidden = false; const picked = [];
      const byId = Object.fromEntries(script.map((n, i) => [n.id ?? i, i]));
      const name = s => typeof s === 'function' ? s(ctx) : String(s ?? '').replace(/\{name\}/g, ctx.name || '');
      let i = 0;
      const finish = () => { this.active = false; this.el.hidden = true; this.el.innerHTML = ''; cleanupKeys(); resolve(picked); };
      const keyH = e => this._key?.(e);
      window.addEventListener('keydown', keyH, true);
      const cleanupKeys = () => window.removeEventListener('keydown', keyH, true);
      const show = () => {
        if (i < 0 || i >= script.length) return finish();
        const n = script[i]; n.do?.(ctx);
        const full = name(n.text);
        this.el.innerHTML = '';
        const who = h('div', { class: 'cx-who' }, name(n.who) || '');
        const txt = h('p', { class: 'cx-line' });
        const ch = h('div', { class: 'cx-choices' });
        const more = h('button', { class: 'cx-next', 'aria-label': 'Continue' }, n.choices ? '' : 'Continue ▸');
        this.el.append(who, txt, ch); if (!n.choices) this.el.append(more);
        let shown = 0, done = false; const cps = CPS[settings.textSpeed] || CPS.normal; let last = performance.now();
        const tick = now => {
          if (done) return; shown = Math.min(full.length, shown + (now - last) / 1000 * cps); last = now;
          txt.textContent = full.slice(0, Math.floor(shown)); if (Math.floor(shown) % 3 === 0 && shown < full.length) sfx.talk();
          if (shown >= full.length) { done = true; showChoices(); } else requestAnimationFrame(tick);
        };
        const complete = () => { if (!done) { done = true; txt.textContent = full; showChoices(); return true; } return false; };
        const next = (g) => { const tgt = g ?? n.goto; i = tgt != null ? (tgt === 'end' ? -1 : byId[tgt]) : i + 1; show(); };
        const showChoices = () => {
          if (!n.choices) return;
          n.choices.forEach((c, k) => ch.append(h('button', { class: 'btn sm cx-choice', onclick: () => choose(k) }, h('kbd', {}, String(k + 1)), name(c.text))));
          ch.querySelector('button')?.focus({ preventScroll: true });
        };
        const choose = k => { const c = n.choices[k]; if (!c) return; sfx.ui(); picked.push(c.id ?? c.text); c.set?.(ctx); next(c.goto); };
        more.onclick = () => { if (!complete()) next(); };
        this.el.onclick = e => { if (e.target === this.el || e.target === txt) { if (!complete() && !n.choices) next(); } };
        this._key = e => {
          if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (!complete() && !n.choices) next(); }
          const d = /^Digit([1-4])$/.exec(e.code); if (d && n.choices && done) { e.preventDefault(); e.stopPropagation(); choose(+d[1] - 1); }
        };
        this.padNext = () => { if (!complete() && !n.choices) next(); };
        this.padChoose = k => { if (n.choices && done) choose(k); };
        requestAnimationFrame(tick);
      };
      show();
    });
  }
}
