// Orbital Mechanics Simulator — Kepler orbits in real units (AU, years, solar masses)
import { h } from '../ui/dom.js';
import { simCanvas, slider } from '../ui/lab.js';

const KMS_PER_AUYR = 4.7404; // 1 AU/yr in km/s
export default {
  id: 'orbit', icon: '⭕', title: 'Orbital Mechanics', reward: 150,
  summary: 'Tune central mass, distance and launch speed to build circular, elliptical and escape trajectories.',
  instructions: [
    'Choose the central star\'s mass and the planet\'s starting distance.',
    'Set the sideways launch speed (km/s) and press Launch.',
    'Watch the readouts: eccentricity tells you how stretched the orbit is (0 = circle).',
    'Tip: press "Circular speed" to snap to exactly √(GM/r).'
  ],
  goals: [
    { id: 'circ', text: 'Create a near-circular orbit (eccentricity below 0.05)' },
    { id: 'ellipse', text: 'Create an elliptical orbit (eccentricity 0.4 – 0.8)' },
    { id: 'escape', text: 'Reach escape velocity (an unbound trajectory)' }
  ],
  science: `<p><b>Kepler\'s laws</b>: planets move on ellipses with the star at one focus; they sweep equal areas in equal times (so they speed up near the star); and the period squared is proportional to the semi-major axis cubed (<b>T² ∝ a³/M</b>).</p>
    <p>For a circular orbit <b>v = √(GM/r)</b> — Earth moves at about <b>29.8 km/s</b>. Faster launches stretch the orbit into an ellipse; at <b>√2 × v<sub>circ</sub></b> (≈42.1 km/s at 1 AU from the Sun) the planet escapes.</p>
    <p class="muted">Real units: GM☉ = 4π² AU³/yr². Two-body problem integrated numerically (RK4).</p>`,
  mount(stage, api) {
    let M = 1, r0 = 1, vKms = 29.8, launched = null, simSpeed = 1;
    const c = api.controls;
    const readout = h('div', { class: 'result info', role: 'status' });
    const sm = slider(c, { label: 'Central mass', min: 0.2, max: 3, step: 0.1, value: M, fmt: v => `${v.toFixed(1)} M☉`, oninput: v => { M = v; info(); } });
    slider(c, { label: 'Starting distance', min: 0.3, max: 3, step: 0.05, value: r0, fmt: v => `${v.toFixed(2)} AU`, oninput: v => { r0 = v; info(); } });
    const vs = slider(c, { label: 'Launch speed (sideways)', min: 5, max: 80, step: 0.1, value: vKms, fmt: v => `${v.toFixed(1)} km/s`, oninput: v => { vKms = v; info(); } });
    slider(c, { label: 'Time-lapse speed', min: 0.25, max: 4, step: 0.25, value: 1, fmt: v => `${v}×`, oninput: v => simSpeed = v });
    c.append(h('div', { class: 'btnrow' },
      h('button', { class: 'btn primary', onclick: launch }, '🚀 Launch'),
      h('button', { class: 'btn sm', onclick: () => { vKms = +vc().toFixed(1); vs.set(vKms); info(); } }, 'Circular speed'),
      h('button', { class: 'btn sm', onclick: () => { vKms = +(vc() * Math.SQRT2).toFixed(1); vs.set(vKms); info(); } }, 'Escape speed')), readout);

    const GM = () => 4 * Math.PI * Math.PI * M;
    const vc = () => Math.sqrt(GM() / r0) * KMS_PER_AUYR;
    function elements(r, v) { const eps = v * v / 2 - GM() / r; const hh = r * v; const e = Math.sqrt(Math.max(0, 1 + 2 * eps * hh * hh / (GM() * GM()))); const a = eps < 0 ? -GM() / (2 * eps) : Infinity; return { eps, e, a, T: eps < 0 ? 2 * Math.PI * Math.sqrt(a ** 3 / GM()) : Infinity, peri: eps < 0 ? a * (1 - e) : (hh * hh / GM()) / (1 + e) }; }
    function info() {
      const el = elements(r0, vKms / KMS_PER_AUYR);
      readout.innerHTML = `Circular speed here: <b>${vc().toFixed(1)} km/s</b> · escape: <b>${(vc() * Math.SQRT2).toFixed(1)} km/s</b><br>Predicted eccentricity: <b>${el.e.toFixed(3)}</b> · ${el.eps < 0 ? `period <b>${el.T.toFixed(2)} yr</b> · semi-major axis <b>${el.a.toFixed(2)} AU</b>` : '<b>unbound — will escape</b>'}`;
    }
    info();
    function launch() {
      const v = vKms / KMS_PER_AUYR; const el = elements(r0, v);
      launched = { x: r0, y: 0, vx: 0, vy: v, trail: [], t: 0, el, sweep: [] };
      if (el.peri < 0.02) { readout.innerHTML += '<br>⚠ Periapsis is inside the star — the planet will crash!'; }
      else if (el.e < 0.05) api.complete('circ');
      else if (el.e >= 0.4 && el.e <= 0.8 && el.eps < 0) api.complete('ellipse');
      if (el.eps >= 0) api.complete('escape');
    }
    const deriv = (s) => { const r = Math.hypot(s[0], s[1]); const k = -GM() / (r * r * r); return [s[2], s[3], k * s[0], k * s[1]]; };
    function rk4(p, dt) {
      const s = [p.x, p.y, p.vx, p.vy];
      const k1 = deriv(s), k2 = deriv(s.map((v, i) => v + k1[i] * dt / 2)), k3 = deriv(s.map((v, i) => v + k2[i] * dt / 2)), k4 = deriv(s.map((v, i) => v + k3[i] * dt));
      const n = s.map((v, i) => v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      [p.x, p.y, p.vx, p.vy] = n;
    }
    const view = simCanvas(stage, (ctx, W, H, dt) => {
      ctx.fillStyle = '#02030b'; ctx.fillRect(0, 0, W, H);
      const el = launched ? launched.el : elements(r0, vKms / KMS_PER_AUYR);
      const extent = el.eps < 0 ? Math.max(r0, el.a * (1 + el.e)) : r0 * 4;
      const sc = Math.min(W, H) * 0.42 / Math.max(0.5, Math.min(extent, 12));
      const cx = W / 2 + (el.eps < 0 && el.e > 0.1 ? Math.min(W * 0.2, el.a * el.e * sc * 0.9) : 0), cy = H / 2;
      // grid
      ctx.strokeStyle = 'rgba(80,110,220,0.15)'; ctx.fillStyle = 'rgba(160,180,255,0.5)'; ctx.font = '11px system-ui';
      for (let au = 1; au * sc < Math.max(W, H); au++) { ctx.beginPath(); ctx.arc(cx, cy, au * sc, 0, 7); ctx.stroke(); ctx.fillText(`${au} AU`, cx + au * sc + 3, cy - 3); }
      // star
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22 + M * 6); g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#ffcc55'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 22 + M * 6, 0, 7); ctx.fill();
      // preview path (unlaunched): predicted ellipse
      if (!launched) {
        const p = { x: r0, y: 0, vx: 0, vy: vKms / KMS_PER_AUYR }; ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,200,87,.55)'; ctx.beginPath(); ctx.moveTo(cx + p.x * sc, cy - p.y * sc);
        const T = el.eps < 0 ? el.T : 6; for (let i = 0; i < 500; i++) { rk4(p, T / 500); ctx.lineTo(cx + p.x * sc, cy - p.y * sc); if (Math.hypot(p.x, p.y) < 0.02) break; }
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#5ad8ff'; ctx.beginPath(); ctx.arc(cx + r0 * sc, cy, 6, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(230,235,255,.8)'; ctx.fillText('Press Launch to fly this orbit', 12, H - 14);
        return;
      }
      const p = launched; const step = (el.eps < 0 ? Math.min(el.T, 5) : 2) / 3 * dt * simSpeed; const n = 20;
      for (let i = 0; i < n; i++) { rk4(p, step / n); p.t += step / n; }
      const rr = Math.hypot(p.x, p.y);
      p.trail.push([p.x, p.y]); if (p.trail.length > 1500) p.trail.shift();
      // equal-area wedges (Kepler's 2nd law) every 1/12 period
      if (el.eps < 0) { const k = Math.floor(p.t / (el.T / 12)); if (!p.sweep[k % 12] || p.sweep[k % 12].k !== k) p.sweep[k % 12] = { k, pts: [] }; p.sweep[k % 12].pts.push([p.x, p.y]); }
      for (const [i, s] of p.sweep.entries()) { if (!s || s.pts.length < 2) continue; ctx.fillStyle = i % 2 ? 'rgba(139,92,246,.18)' : 'rgba(79,140,255,.18)'; ctx.beginPath(); ctx.moveTo(cx, cy); s.pts.forEach(([x, y]) => ctx.lineTo(cx + x * sc, cy - y * sc)); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = '#5ad8ff'; ctx.lineWidth = 2; ctx.beginPath(); p.trail.forEach(([x, y], i) => i ? ctx.lineTo(cx + x * sc, cy - y * sc) : ctx.moveTo(cx + x * sc, cy - y * sc)); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = '#9fe6ff'; ctx.beginPath(); ctx.arc(cx + p.x * sc, cy - p.y * sc, 6, 0, 7); ctx.fill();
      const speed = Math.hypot(p.vx, p.vy) * KMS_PER_AUYR;
      ctx.fillStyle = 'rgba(230,235,255,.9)'; ctx.font = '13px ui-monospace, monospace';
      ctx.fillText(`t = ${p.t.toFixed(2)} yr · r = ${rr.toFixed(2)} AU · v = ${speed.toFixed(1)} km/s · e = ${el.e.toFixed(3)}`, 12, H - 14);
      if (el.eps < 0) { ctx.fillStyle = 'rgba(180,170,255,.8)'; ctx.fillText('Shaded wedges: equal areas swept in equal times (Kepler\'s 2nd law)', 12, H - 32); }
      if (rr < 0.02) { ctx.fillStyle = '#ff6b81'; ctx.fillText('💥 Crashed into the star!', 12, 24); launched = null; }
    });
    return () => view.stop();
  }
};
