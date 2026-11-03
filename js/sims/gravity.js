// Gravity Simulator — N-body Newtonian gravity sandbox (leapfrog integrator)
import { h } from '../ui/dom.js';
import { simCanvas, slider } from '../ui/lab.js';

export default {
  id: 'gravity', icon: '🌀', title: 'Gravity Simulator', reward: 150,
  summary: 'Place bodies, set their mass and velocity, and watch gravity shape their paths.',
  instructions: [
    'Press on empty space and drag to set a new body\'s launch velocity, then release to place it. A dotted line previews its path.',
    'Use the sliders to change the star\'s mass and the new body\'s mass.',
    'Try a sideways launch: too slow and it falls in, too fast and it escapes.',
    'Use presets to explore binary stars and moons.'
  ],
  goals: [
    { id: 'place', text: 'Launch your first body' },
    { id: 'orbit', text: 'Keep one planet in a stable orbit for 3 full revolutions' },
    { id: 'multi', text: 'Have 3 bodies orbiting at the same time' }
  ],
  science: `<p>Every mass attracts every other mass with a force <b>F = G·m₁·m₂ / r²</b> (Newton, 1687). Double the distance and the pull drops to a quarter.</p>
    <p>An orbit is really "falling sideways": the body falls toward the star but moves sideways fast enough to keep missing it. For a circular orbit the speed must be <b>v = √(GM/r)</b>; at <b>√2</b> times that speed it escapes.</p>
    <p class="muted">This sandbox uses scaled units (G = 1) and a softened force so close encounters stay stable. Collisions merge bodies while conserving momentum.</p>`,
  mount(stage, api) {
    const G = 1;
    let M = 2000, newMass = 5, paused = false, simSpeed = 1;
    let bodies = [];
    const colors = ['#5ad8ff', '#ff9a6a', '#8bff9a', '#ffd36a', '#c49aff', '#ff7aa8', '#9ab8ff'];
    let ci = 0;
    const star = () => ({ x: 0, y: 0, vx: 0, vy: 0, m: M, r: 14, color: '#ffcc55', star: true, trail: [], ang: 0, prevA: 0, bornT: 0 });
    const reset = () => { bodies = [star()]; };
    reset();
    let simT = 0, drag = null, revs = 0;

    const c = api.controls;
    slider(c, { label: 'Star mass', min: 300, max: 5000, step: 50, value: M, fmt: v => `${v} units`, oninput: v => { M = v; const s = bodies.find(b => b.star); if (s) s.m = v; } });
    slider(c, { label: 'New body mass', min: 1, max: 600, step: 1, value: newMass, fmt: v => `${v} units`, oninput: v => newMass = v });
    slider(c, { label: 'Simulation speed', min: 0.25, max: 3, step: 0.25, value: 1, fmt: v => `${v}×`, oninput: v => simSpeed = v });
    const pauseBtn = h('button', { class: 'btn sm', onclick: () => { paused = !paused; pauseBtn.textContent = paused ? '▶ Resume' : '❚❚ Pause'; } }, '❚❚ Pause');
    c.append(h('div', { class: 'btnrow' }, pauseBtn,
      h('button', { class: 'btn sm', onclick: () => { reset(); } }, '🧹 Clear'),
      h('button', { class: 'btn sm', onclick: () => preset('planet') }, 'Planet + moon'),
      h('button', { class: 'btn sm', onclick: () => preset('binary') }, 'Binary stars'),
      h('button', { class: 'btn sm', onclick: () => preset('system') }, 'Mini system')));
    const status = h('div', { class: 'result info', role: 'status' }, 'Drag from empty space to launch a planet.');
    c.append(status);

    function addBody(x, y, vx, vy, m, extra = {}) {
      const b = { x, y, vx, vy, m, r: Math.max(3, Math.cbrt(m) * 2.2), color: colors[ci++ % colors.length], trail: [], ang: Math.atan2(y, x), revs: 0, bornT: simT, ...extra };
      bodies.push(b); api.complete('place'); return b;
    }
    function vc(r, m = M) { return Math.sqrt(G * m / r); }
    function preset(kind) {
      reset();
      if (kind === 'planet') { const p = addBody(170, 0, 0, -vc(170), 60); addBody(170 + 22, 0, 0, -vc(170) - Math.sqrt(G * 60 / 22), 1); }
      if (kind === 'binary') { bodies = []; const m = 1000, d = 70, v = Math.sqrt(G * m / (4 * d)); bodies.push({ ...star(), x: -d, m, vy: v }, { ...star(), x: d, m, vy: -v, color: '#9ab8ff' }); addBody(260, 0, 0, -vc(260, 2000), 3); }
      if (kind === 'system') { [90, 150, 220, 300].forEach((r, i) => addBody(Math.cos(i * 2) * r, Math.sin(i * 2) * r, -Math.sin(i * 2) * vc(r), Math.cos(i * 2) * vc(r), 2 + i * 3)); }
    }

    function accel(list) {
      for (const a of list) { a.ax = 0; a.ay = 0; }
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j]; const dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy + 25; const inv = G / (d2 * Math.sqrt(d2));
        a.ax += dx * inv * b.m; a.ay += dy * inv * b.m; b.ax -= dx * inv * a.m; b.ay -= dy * inv * a.m;
      }
    }
    function step(hh) {
      accel(bodies);
      for (const b of bodies) { b.vx += b.ax * hh / 2; b.vy += b.ay * hh / 2; b.x += b.vx * hh; b.y += b.vy * hh; }
      accel(bodies);
      for (const b of bodies) { b.vx += b.ax * hh / 2; b.vy += b.ay * hh / 2; }
      // collisions → merge
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j]; if (Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 0.8) {
          const big = a.m >= b.m ? a : b, small = big === a ? b : a; const m = a.m + b.m;
          big.vx = (a.vx * a.m + b.vx * b.m) / m; big.vy = (a.vy * a.m + b.vy * b.m) / m; big.x = (a.x * a.m + b.x * b.m) / m; big.y = (a.y * a.m + b.y * b.m) / m;
          big.m = m; if (!big.star) big.r = Math.max(3, Math.cbrt(m) * 2.2);
          bodies.splice(bodies.indexOf(small), 1); status.textContent = '💥 Collision! The bodies merged — momentum is conserved.'; status.className = 'result fail'; statusT = 0;
          return;
        }
      }
    }
    const heaviest = () => bodies.reduce((a, b) => (b.m > a.m ? b : a), bodies[0]);
    function bound(b, host) { const dx = b.x - host.x, dy = b.y - host.y, dvx = b.vx - host.vx, dvy = b.vy - host.vy; return 0.5 * (dvx * dvx + dvy * dvy) - G * host.m / Math.hypot(dx, dy) < 0; }

    let multiT = 0, statusT = 0;
    const view = simCanvas(stage, (ctx, W, H, dt) => {
      const sc = Math.min(W, H) / 700;
      if (!paused) {
        const n = Math.ceil(dt * 40 * simSpeed / 0.2);
        for (let i = 0; i < n; i++) { step(dt * 40 * simSpeed / n); simT += dt * 40 * simSpeed / n; }
        const host = heaviest();
        bodies = bodies.filter(b => b === host || Math.hypot(b.x - host.x, b.y - host.y) < 2500);
        let orbiting = 0;
        for (const b of bodies) {
          if (b === host) continue;
          b.trail.push([b.x, b.y]); if (b.trail.length > 400) b.trail.shift();
          const a = Math.atan2(b.y - host.y, b.x - host.x); let d = a - b.ang; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; b.ang = a;
          if (bound(b, host)) { b.revs += Math.abs(d) / (2 * Math.PI); orbiting++; if (b.revs >= 3) api.complete('orbit'); } else b.revs = 0;
        }
        multiT = orbiting >= 3 ? multiT + dt : 0; if (multiT > 3) api.complete('multi');
        const best = Math.max(0, ...bodies.filter(b => b !== host).map(b => b.revs));
        statusT += dt;
        if (statusT > 0.25 && (!status.textContent.startsWith('💥') || statusT > 3)) {
          statusT = 0;
          const txt = bodies.length > 1 ? `Bodies: ${bodies.length} · bound orbits: ${orbiting} · best: ${best.toFixed(1)} revolutions` : 'Drag from empty space to launch a planet.';
          if (status.textContent !== txt) { status.className = 'result info'; status.textContent = txt; }
        }
      }
      // draw
      ctx.fillStyle = '#02030b'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc);
      ctx.strokeStyle = 'rgba(80,110,220,0.12)'; for (let r = 100; r < 600; r += 100) { ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); }
      for (const b of bodies) {
        if (b.trail.length > 1) { ctx.strokeStyle = b.color + '88'; ctx.lineWidth = 1.5 / sc; ctx.beginPath(); b.trail.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
      }
      for (const b of bodies) {
        if (b.star) { const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3); g.addColorStop(0, '#fff'); g.addColorStop(0.3, b.color); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 3, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); }
      }
      if (drag) {
        const vx = (drag.x - drag.cx) * 0.03, vy = (drag.y - drag.cy) * 0.03;
        ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 2 / sc; ctx.beginPath(); ctx.moveTo(drag.sx, drag.sy); ctx.lineTo(drag.sx + (drag.x - drag.cx) * 1, drag.sy + (drag.y - drag.cy) * 1); ctx.stroke();
        // predicted path against current bodies (frozen)
        let px = drag.sx, py = drag.sy, pvx = vx, pvy = vy; ctx.setLineDash([4 / sc, 6 / sc]); ctx.strokeStyle = 'rgba(255,200,87,.6)'; ctx.beginPath(); ctx.moveTo(px, py);
        for (let i = 0; i < 900; i++) { let ax = 0, ay = 0; for (const b of bodies) { const dx = b.x - px, dy = b.y - py, d2 = dx * dx + dy * dy + 25, inv = G * b.m / (d2 * Math.sqrt(d2)); ax += dx * inv; ay += dy * inv; } pvx += ax * 0.4; pvy += ay * 0.4; px += pvx * 0.4; py += pvy * 0.4; ctx.lineTo(px, py); if (Math.abs(px) > 3000) break; }
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(drag.sx, drag.sy, Math.max(3, Math.cbrt(newMass) * 2.2), 0, 7); ctx.fill();
        const host = heaviest(); const r = Math.hypot(drag.sx - host.x, drag.sy - host.y), v = Math.hypot(vx, vy);
        ctx.restore();
        ctx.fillStyle = '#ffc857'; ctx.font = '13px ui-monospace, monospace';
        ctx.fillText(`speed ${v.toFixed(2)} · circular ${vc(r, host.m).toFixed(2)} · escape ${(vc(r, host.m) * Math.SQRT2).toFixed(2)}`, 12, H - 14);
        return;
      }
      ctx.restore();
    });
    const toWorld = e => { const r = view.cv.getBoundingClientRect(); const [W, H] = view.size(); const sc = Math.min(W, H) / 700; return [(e.clientX - r.left - W / 2) / sc, (e.clientY - r.top - H / 2) / sc]; };
    view.cv.addEventListener('pointerdown', e => { view.cv.setPointerCapture(e.pointerId); const [x, y] = toWorld(e); drag = { sx: x, sy: y, cx: x, cy: y, x, y }; });
    view.cv.addEventListener('pointermove', e => { if (!drag) return; const [x, y] = toWorld(e); drag.x = x; drag.y = y; });
    view.cv.addEventListener('pointerup', () => {
      if (!drag) return; const d = drag; drag = null;
      const host = heaviest();
      if (Math.hypot(d.sx - host.x, d.sy - host.y) < host.r + 4) { status.textContent = 'Too close to the star — place it farther out.'; status.className = 'result fail'; return; }
      addBody(d.sx, d.sy, (d.x - d.cx) * 0.03 + host.vx, (d.y - d.cy) * 0.03 + host.vy, newMass);
    });
    return () => view.stop();
  }
};
