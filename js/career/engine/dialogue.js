// ASTRO LAB Career — dialogue with typewriter text, speaker names and player choices.
// Script: [{ id?, who, text, choices?: [{ text, goto?, set? }], goto?, do?() }]. Returns the list of choices picked.
// Skip (button, X / Backspace, gamepad B, tap): stops the typewriter and the voice blips at once and fast-forwards
// through the conversation, still running every line's do() so objectives, triggers and rewards are never lost.
// It stops at the next line with choices (those are gameplay decisions), or ends the conversation.
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
      const finish = () => { this.skip = null; this.active = false; this.el.hidden = true; this.el.innerHTML = ''; cleanupKeys(); resolve(picked); };
      const keyH = e => this._key?.(e);
      window.addEventListener('keydown', keyH, true);
      const cleanupKeys = () => window.removeEventListener('keydown', keyH, true);
      const show = (ranDo = false) => {
        if (i < 0 || i >= script.length) return finish();
        const n = script[i]; if (!ranDo) n.do?.(ctx);
        const full = name(n.text);
        this.el.innerHTML = '';
        const who = h('div', { class: 'cx-who' }, name(n.who) || '');
        const txt = h('p', { class: 'cx-line' });
        const ch = h('div', { class: 'cx-choices' });
        const more = h('button', { class: 'cx-next', 'aria-label': 'Continue' }, n.choices ? '' : 'Continue ▸');
        const nextIdx = j => { const nd = script[j]; return nd.goto != null ? (nd.goto === 'end' ? -1 : byId[nd.goto]) : j + 1; };
        const hasMore = !n.choices && (() => { const j = nextIdx(i); return j >= 0 && j < script.length; })();
        const skipBtn = h('button', { class: 'cx-skip', 'aria-label': 'Skip conversation (X)', title: 'Skip conversation (X / gamepad B)' }, 'Skip ⏭');
        this.el.append(who, txt, ch); if (!n.choices) this.el.append(more); this.el.append(skipBtn);
        void hasMore;
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
          skipBtn.remove(); // a decision can't be skipped: pick an answer
          n.choices.forEach((c, k) => ch.append(h('button', { class: 'btn sm cx-choice', onclick: () => choose(k) }, h('kbd', {}, String(k + 1)), name(c.text))));
          ch.querySelector('button')?.focus({ preventScroll: true });
        };
        const choose = k => { const c = n.choices[k]; if (!c) return; sfx.ui(); picked.push(c.id ?? c.text); c.set?.(ctx); next(c.goto); };
        // Skip: everything up to the next decision (or the end), running each line's actions on the way
        const skipAll = () => {
          if (n.choices) { if (!done) { done = true; txt.textContent = full; showChoices(); } return; }
          done = true; txt.textContent = full;
          let j = nextIdx(i);
          while (j >= 0 && j < script.length) { const nd = script[j]; nd.do?.(ctx); if (nd.choices) { i = j; sfx.ui(); return show(true); } j = nextIdx(j); }
          sfx.ui(); i = -1; finish();
        };
        skipBtn.onclick = e => { e.stopPropagation(); skipAll(); };
        more.onclick = () => { if (!complete()) next(); };
        this.el.onclick = e => { if (e.target === this.el || e.target === txt) { if (!complete() && !n.choices) next(); } };
        this._key = e => {
          if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (!complete() && !n.choices) next(); }
          if (['KeyX', 'Backspace'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); skipAll(); return; }
          const d = /^Digit([1-4])$/.exec(e.code); if (d && n.choices && done) { e.preventDefault(); e.stopPropagation(); choose(+d[1] - 1); }
        };
        this.padNext = () => { if (!complete() && !n.choices) next(); };
        this.skip = skipAll;
        this.padChoose = k => { if (n.choices && done) choose(k); };
        requestAnimationFrame(tick);
      };
      show();
    });
  }
}
