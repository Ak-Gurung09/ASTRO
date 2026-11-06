// ASTRO LAB Career — shared modal panels: knowledge checks (quizzes), read-and-confirm documents, choice lists.
import { h, openModal } from '../../ui/dom.js';
import { difficulty } from '../state/difficulty.js';
import { sfx } from '../engine/audio.js';

// Quiz: questions [{ q, options: [correct, ...wrong], explain, hard? }]. Options are shuffled; on Easy only 3 are shown.
// Resolves { correct, total, wrong: [question text] }. Each answer shows right/wrong with the explanation before moving on.
export function runQuiz({ title, intro = '', questions }) {
  const D = difficulty();
  const pool = questions.filter(q => D.quizPool === 'basic' ? !q.hard : true);
  return new Promise(resolve => {
    let i = 0, correct = 0; const wrong = [];
    const body = h('div', { class: 'cx-quiz' }); const foot = h('button', { class: 'btn primary', disabled: true }, 'Next ▸');
    const m = openModal({ title, label: title, closable: false, body, foot: [foot] });
    const show = () => {
      const Q = pool[i]; body.innerHTML = '';
      let opts = Q.options.map((t, k) => ({ t, ok: k === 0 }));
      const right = opts[0]; let rest = opts.slice(1).sort(() => Math.random() - 0.5).slice(0, D.quizOptions - 1);
      opts = [right, ...rest].sort(() => Math.random() - 0.5);
      if (i === 0 && intro) body.append(h('p', { class: 'muted' }, intro));
      body.append(h('small', { class: 'cx-qn' }, `Question ${i + 1} of ${pool.length}`), h('h3', {}, Q.q));
      const list = h('div', { class: 'cx-qopts', role: 'radiogroup' }); const fb = h('p', { class: 'cx-qfb', 'aria-live': 'polite' });
      opts.forEach((o, k) => list.append(h('button', { class: 'btn cx-qopt', onclick: e => {
        if (list.dataset.done) return; list.dataset.done = '1';
        e.currentTarget.classList.add(o.ok ? 'ok' : 'bad'); if (!o.ok) list.querySelectorAll('button')[opts.indexOf(right)].classList.add('ok');
        if (o.ok) { correct++; sfx.good(); } else { wrong.push(Q.q); sfx.wrong(); }
        fb.textContent = (o.ok ? '✓ Correct. ' : '✗ Not quite. ') + (D.hints || o.ok ? (Q.explain || '') : 'The right answer is highlighted.');
        fb.className = 'cx-qfb ' + (o.ok ? 'good' : 'bad');
        foot.disabled = false; foot.focus();
      } }, h('kbd', {}, String(k + 1)), o.t)));
      body.append(list, fb); foot.disabled = true; foot.textContent = i === pool.length - 1 ? 'Finish ▸' : 'Next ▸';
      body.onkeydown = e => { const d = /^Digit([1-4])$/.exec(e.code); if (d) list.querySelectorAll('button')[+d[1] - 1]?.click(); };
      list.querySelector('button')?.focus();
    };
    foot.onclick = () => { i++; if (i >= pool.length) { m.close(); resolve({ correct, total: pool.length, wrong }); } else show(); };
    show();
  });
}

// A document you must read to the end (scroll), optionally tick boxes, then confirm.
export function readDoc({ title, body, ticks = [], confirm = 'Done ▸', wide = true }) {
  return new Promise(resolve => {
    const boxes = ticks.map(t => h('label', { class: 'cx-tick' }, h('input', { type: 'checkbox' }), ' ', t));
    const ok = h('button', { class: 'btn primary', disabled: ticks.length > 0 }, confirm);
    const upd = () => { ok.disabled = !boxes.every(b => b.querySelector('input').checked); };
    boxes.forEach(b => b.querySelector('input').addEventListener('change', upd));
    const m = openModal({ title, label: title, wide, closable: false, body: h('div', { class: 'cx-doc' }, body, boxes.length ? h('div', { class: 'cx-ticks' }, boxes) : null), foot: [ok] });
    ok.onclick = () => { m.close(); resolve(true); };
  });
}

// Pick one option from cards. Resolves the chosen id, or null when cancelled.
export function pickOne({ title, intro = '', options, cancel = true }) {
  return new Promise(resolve => {
    let done = false;
    const m = openModal({ title, label: title, wide: true, closable: cancel, onClose: () => { if (!done) resolve(null); }, body: h('div', {}, intro ? h('p', {}, intro) : null,
      h('div', { class: 'cx-modules' }, options.map(o => h('button', { class: 'cx-module as-btn', disabled: !!o.disabled, onclick: () => { done = true; m.close(); resolve(o.id); } },
        h('span', { class: 'cx-mi' }, o.icon || '•'), h('div', {}, h('b', {}, o.name), o.desc ? h('small', {}, o.desc) : null, o.note ? h('small', { class: o.noteCls || 'muted' }, o.note) : null))))) });
  });
}
