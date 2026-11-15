// ASTRO LAB Career — Eye test (tumbling-E visual acuity chart).
// One letter E at a time, getting smaller line by line. The player says which way its three bars point (the open side):
// arrow keys / WASD, the on-screen arrow buttons (mouse or touch), or "Can't see" to skip. Each letter has a time limit.
// A line is passed with 2 of its 3 letters right; the test stops at the first line that is not passed.
// Resolves { done: true, passed, acuity, line } when the player finishes, or { done: false } if they close it without finishing.
import { h, openModal } from '../../ui/dom.js';
import { sfx } from '../engine/audio.js';

// Snellen lines for a 6 m test (letter heights in CSS px for this on-screen version)
export const LINES = [
  { name: '6/60', px: 120 }, { name: '6/36', px: 80 }, { name: '6/24', px: 56 }, { name: '6/18', px: 42 },
  { name: '6/12', px: 30 }, { name: '6/9', px: 22 }, { name: '6/6', px: 16 }
];
export const PASS_LINE = 4; // 6/12 or better is a normal baseline for this training
const DIRS = ['up', 'right', 'down', 'left'];
const ARROW = { up: '↑', right: '→', down: '↓', left: '←' };
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left' };

// Draw a tumbling E: a 5x5 grid letter whose bars point to `dir` (the open side faces that way)
function drawE(cv, px, dir) {
  const S = Math.max(5, Math.round(px)), dpr = Math.min(2, devicePixelRatio || 1), box = 140;
  cv.width = box * dpr; cv.height = box * dpr; cv.style.width = cv.style.height = box + 'px';
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#fff'; x.fillRect(0, 0, box, box);
  x.translate(box / 2, box / 2); x.rotate({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir]);
  const u = S / 5; x.fillStyle = '#111';
  x.fillRect(-2.5 * u, -2.5 * u, u, 5 * u); // spine on the left, bars point right
  for (const row of [0, 2, 4]) x.fillRect(-2.5 * u, (-2.5 + row) * u, 5 * u, u);
}

export function runEyeTest({ perLetter = 10 } = {}) {
  return new Promise(resolve => {
    let line = 0, k = 0, rightInLine = 0, results = [], cur = null, left = perLetter, timerId = null, finished = false, passedLine = -1;
    const body = h('div', { class: 'cx-eyetest' });
    const m = openModal({ title: '👁 Eye test', label: 'Eye test', wide: true, closable: true, body, onClose: () => { stop(); if (!finished) resolve({ done: false }); } });
    const stop = () => { clearInterval(timerId); timerId = null; document.removeEventListener('keydown', onKey, true); };
    const onKey = e => { const d = KEYS[e.code]; if (d && cur) { e.preventDefault(); e.stopPropagation(); answer(d); } else if (e.code === 'Space' && cur) { e.preventDefault(); answer(null); } };

    function intro() {
      body.innerHTML = '';
      body.append(
        h('p', {}, 'Stand on the blue line, cover your left eye with your palm, and look at the chart.'),
        h('p', {}, 'Each card shows one letter E. Say which way its three bars point: ', h('b', {}, 'up, right, down or left'), '. The letters get smaller line by line.'),
        h('p', { class: 'muted' }, 'Answer with the arrow keys or W A S D, or click / tap the arrow buttons. If you really can\'t see it, choose "Can\'t see" (Space). You have ' + perLetter + ' seconds per letter.'),
        h('button', { class: 'btn primary', onclick: () => begin() }, 'Start the test ▸'));
    }
    function begin() { line = 0; k = 0; rightInLine = 0; results = []; passedLine = -1; document.addEventListener('keydown', onKey, true); show(); }
    function show() {
      body.innerHTML = '';
      const L = LINES[line]; cur = DIRS[Math.floor(Math.random() * 4)];
      const cv = h('canvas', { role: 'img', 'aria-label': `Letter E, line ${L.name}` }); drawE(cv, L.px, cur);
      const prog = h('div', { class: 'prog', 'aria-label': `Line ${line + 1} of ${LINES.length}, letter ${k + 1} of 3` }, LINES.map((_, i) => h('i', { class: i < line ? (results[i] ? 'ok' : 'no') : i === line ? 'cur' : '' })));
      const fb = h('div', { class: 'fb', 'aria-live': 'assertive' });
      const tm = h('small', { class: 'muted' }, `${perLetter} s`);
      const opts = h('div', { class: 'opts' }, DIRS.map(d => h('button', { class: 'btn', 'aria-label': d, onclick: () => answer(d) }, ARROW[d])));
      body.append(h('small', { class: 'muted' }, `Line ${L.name}  ·  letter ${k + 1} of 3`), prog, h('div', { class: 'chart' }, cv), opts,
        h('button', { class: 'btn ghost', onclick: () => answer(null) }, 'Can\'t see it'), fb, tm);
      body._fb = fb; left = perLetter; clearInterval(timerId);
      timerId = setInterval(() => { left -= 1; tm.textContent = `${Math.max(0, left)} s`; if (left <= 0) answer(null, true); }, 1000);
      opts.querySelector('button').focus({ preventScroll: true });
    }
    function answer(d, timeout = false) {
      if (!cur) return; clearInterval(timerId); timerId = null;
      const ok = d === cur, fb = body._fb; const was = cur; cur = null;
      if (ok) { rightInLine++; sfx.good(); } else sfx.wrong();
      fb.className = 'fb ' + (ok ? 'good' : 'bad');
      fb.textContent = ok ? '✓ Correct' : timeout ? `⏱ Time's up: it pointed ${was}.` : d ? `✗ It pointed ${was}.` : `Skipped: it pointed ${was}.`;
      body.querySelectorAll('.opts .btn').forEach(b => { b.disabled = true; if (b.getAttribute('aria-label') === was) b.classList.add('ok'); });
      setTimeout(next, 650);
    }
    function next() {
      if (finished || !m) return;
      k++;
      const failedNow = k - rightInLine >= 2; // 2 misses: this line can't reach 2 of 3 any more
      if (k < 3 && !failedNow) return show();
      const passed = rightInLine >= 2; results[line] = passed;
      if (passed) passedLine = line;
      if (passed && line < LINES.length - 1) { line++; k = 0; rightInLine = 0; return show(); }
      result();
    }
    function result() {
      stop(); body.innerHTML = '';
      const acuity = passedLine >= 0 ? LINES[passedLine].name : 'worse than 6/60', pass = passedLine >= PASS_LINE;
      body.append(h('h3', {}, pass ? '✅ Test complete' : '🔁 Retest needed'),
        h('p', { class: 'cx-vitals' }, `Smallest line read: ${acuity}`),
        h('p', {}, pass ? `That is ${passedLine === LINES.length - 1 ? 'normal (6/6) vision' : 'good enough for your baseline'}. It is saved in your medical file.` : `To record a baseline you need to read the ${LINES[PASS_LINE].name} line. Make sure you are on the blue line, take your time and try again.`));
      const foot = h('div', { class: 'opts', style: 'grid-template-columns: repeat(2, minmax(0, 1fr))' });
      if (!pass) foot.append(h('button', { class: 'btn primary', onclick: () => begin() }, 'Retry ↻'), h('button', { class: 'btn', onclick: () => { finished = true; m.close(); resolve({ done: true, passed: false, acuity, line: passedLine }); } }, 'Close'));
      else foot.append(h('button', { class: 'btn primary', onclick: () => { finished = true; m.close(); resolve({ done: true, passed: true, acuity, line: passedLine }); } }, 'Save result ▸'));
      body.append(foot); foot.querySelector('button').focus({ preventScroll: true });
    }
    intro();
  });
}
