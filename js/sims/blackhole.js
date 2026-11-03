// Black Hole Simulator — light bending around a non-rotating (Schwarzschild) black hole
import { h } from '../ui/dom.js';
import { simCanvas, slider } from '../ui/lab.js';

const BC = 1.5 * Math.sqrt(3); // critical impact parameter in Schwarzschild radii (= 3√3/2 ≈ 2.598)
export default {
  id: 'blackhole', icon: '🕳️', title: 'Black Hole', reward: 150,
  summary: 'Fire light rays past a black hole and see gravity bend, trap and loop them.',
  instructions: [
    'Set the impact parameter b — how far from the centre the light ray would pass if space were flat.',
    'Press "Fire light ray", or tap/click the left half of the view to fire a ray at that height.',
    'Lower b and the ray bends more; below the critical value it falls in.',
    'Drag the probe slider to see how time slows near the event horizon.'
  ],
  goals: [
    { id: 'capture', text: 'Send a light ray across the event horizon' },
    { id: 'deflect', text: 'Bend an escaping ray by more than 90°' },
    { id: 'critical', text: 'Find the critical impact parameter (within 1.5%) so light circles the photon sphere' }
  ],
  science: `<p>A black hole is a region where gravity is so strong that nothing — not even light — can escape once it crosses the <b>event horizon</b>, at the <b>Schwarzschild radius r<sub>s</sub> = 2GM/c²</b> (≈2.95 km per solar mass).</p>
    <p>At <b>1.5 r<sub>s</sub></b> lies the <b>photon sphere</b>, where light can orbit (unstably). Light passing with impact parameter below <b>b = (3√3/2) r<sub>s</sub> ≈ 2.6 r<sub>s</sub></b> is captured — this sets the size of the dark "shadow" imaged by the Event Horizon Telescope for M87* and Sagittarius A*.</p>
    <p>Gas spirals in through an <b>accretion disk</b>; for a non-rotating black hole, the innermost stable circular orbit is at <b>3 r<sub>s</sub></b>. Near the horizon, clocks tick slower as seen from far away (<b>gravitational time dilation</b>).</p>
    <p class="muted">Ray paths are computed from the Schwarzschild null-geodesic equation d²u/dφ² = −u + 1.5 r<sub>s</sub>u². Disk colours are stylised. Real black holes usually spin, which changes the details.</p>`,
  mount(stage, api) {
    let b = 4, M = 10, probeR = 6;
    const rays = [];
    const c = api.controls;
    slider(c, { label: 'Black hole mass', min: 0, max: 10, step: 0.1, value: 1, fmt: v => { M = Math.pow(10, v); return M < 1e3 ? `${M.toFixed(0)} M☉` : `${M.toExponential(1)} M☉`; }, oninput: () => upd() });
    const bs = slider(c, { label: 'Impact parameter b', min: 0.5, max: 10, step: 0.005, value: b, fmt: v => `${v.toFixed(3)} rₛ`, oninput: v => { b = v; } });
    c.append(h('div', { class: 'btnrow' }, h('button', { class: 'btn primary', onclick: () => fire(b) }, '🔦 Fire light ray'), h('button', { class: 'btn sm', onclick: () => { rays.length = 0; } }, 'Clear rays')));
    slider(c, { label: 'Probe distance', min: 1.02, max: 20, step: 0.01, value: probeR, fmt: v => `${v.toFixed(2)} rₛ`, oninput: v => { probeR = v; upd(); } });
    const out = h('div', { class: 'readout', role: 'status', style: 'line-height:1.6' }); const msg = h('div');
    c.append(out, msg);
    function upd() {
      const rsKm = 2.953 * M; const f = Math.sqrt(1 - 1 / probeR);
      out.innerHTML = `Schwarzschild radius: <b>${rsKm < 1e6 ? rsKm.toLocaleString(undefined, { maximumFractionDigits: 1 }) + ' km' : (rsKm / 1.496e8).toFixed(2) + ' AU'}</b><br>Photon sphere: 1.5 rₛ · ISCO: 3 rₛ · critical b ≈ 2.598 rₛ<br>Probe at ${probeR.toFixed(2)} rₛ: its clock runs at <b>${(f * 100).toFixed(1)}%</b> of a distant clock (1 hour there = ${(60 / f).toFixed(1)} min far away)`;
    }
    upd();
    function trace(bb) {
      const sign = Math.sign(bb) || 1; bb = Math.abs(bb);
      const r0 = 30, u0 = 1 / r0; let u = u0, s = 0; let du = Math.sqrt(Math.max(0, 1 / (bb * bb) - u0 * u0 * (1 - u0)));
      const phi0 = Math.atan2(bb, -Math.sqrt(r0 * r0 - bb * bb)); const pts = []; let fate = 'escape';
      const hh = 0.004; const f = (uu) => -uu + 1.5 * uu * uu;
      for (let i = 0; i < 40000; i++) {
        const phi = phi0 - s; pts.push([Math.cos(phi) / u, sign * Math.sin(phi) / u]);
        // RK4 on (u, du)
        const k1u = du, k1v = f(u); const k2u = du + k1v * hh / 2, k2v = f(u + k1u * hh / 2); const k3u = du + k2v * hh / 2, k3v = f(u + k2u * hh / 2); const k4u = du + k3v * hh, k4v = f(u + k3u * hh);
        u += hh / 6 * (k1u + 2 * k2u + 2 * k3u + k4u); du += hh / 6 * (k1v + 2 * k2v + 2 * k3v + k4v); s += hh;
        if (u >= 1) { fate = 'capture'; const p2 = phi0 - s; pts.push([Math.cos(p2), sign * Math.sin(p2)]); break; }
        if (u <= u0 && du < 0) break;
        if (u <= 0) break;
      }
      const deflect = (s - (Math.PI - 2 * Math.asin(bb * u0))) * 180 / Math.PI;
      return { pts, fate, deflect, loops: s / (2 * Math.PI), b: bb };
    }
    function fire(bb) {
      const r = trace(bb); r.shown = 0; r.hue = 40 + Math.random() * 40; rays.push(r); if (rays.length > 10) rays.shift();
      msg.innerHTML = '';
      const near = Math.abs(r.b - BC) / BC;
      let text;
      if (r.fate === 'capture') { api.complete('capture'); text = `Captured! With b = ${r.b.toFixed(3)} rₛ (below ≈2.598 rₛ) the light crossed the event horizon.`; }
      else { text = `Escaped, bent by ${r.deflect.toFixed(1)}°${r.loops > 1 ? ` after circling ${(r.loops - 0.5).toFixed(1)} times` : ''}.`; if (r.deflect > 90) api.complete('deflect'); }
      if (near < 0.015) { api.complete('critical'); text += ' 🎯 Right at the critical impact parameter — the light skimmed the photon sphere!'; }
      msg.append(h('div', { class: `result ${r.fate === 'capture' ? 'fail' : 'ok'}` }, text));
    }
    let scale = 1, cx = 0, cy = 0;
    const view = simCanvas(stage, (ctx, W, H, dt) => {
      scale = Math.min(W, H) / 26; cx = W / 2; cy = H / 2; const t = performance.now() / 1000;
      ctx.fillStyle = '#010106'; ctx.fillRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = 'rgba(80,100,200,.08)'; for (let x = -15; x <= 15; x += 1) { ctx.beginPath(); ctx.moveTo(cx + x * scale, 0); ctx.lineTo(cx + x * scale, H); ctx.stroke(); }
      // accretion disk (face-on, stylised)
      for (let r = 3; r < 9; r += 0.05) { const a = (1 - (r - 3) / 6); ctx.strokeStyle = `rgba(255,${150 + a * 90},${60 + a * 120},${0.05 + a * 0.12})`; ctx.lineWidth = scale * 0.06; ctx.beginPath(); ctx.arc(cx, cy, r * scale, 0, 7); ctx.stroke(); }
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,200,87,.6)'; ctx.beginPath(); ctx.arc(cx, cy, 1.5 * scale, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(90,216,255,.4)'; ctx.beginPath(); ctx.arc(cx, cy, 3 * scale, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, scale, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
      ctx.fillStyle = 'rgba(230,235,255,.75)'; ctx.font = '11px system-ui';
      ctx.fillText('event horizon', cx + scale * 0.7, cy - scale * 1.05); ctx.fillText('photon sphere 1.5 rₛ', cx + scale * 1.2, cy - scale * 1.6); ctx.fillText('ISCO 3 rₛ', cx + scale * 2.2, cy - scale * 2.4);
      // aim guide
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(0, cy - b * scale); ctx.lineTo(cx, cy - b * scale); ctx.stroke(); ctx.setLineDash([]);
      // rays
      for (const r of rays) {
        r.shown = Math.min(r.pts.length, r.shown + Math.max(40, r.pts.length * dt * 0.6));
        ctx.strokeStyle = `hsla(${r.hue},100%,70%,.9)`; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < r.shown; i += 3) { const [x, y] = r.pts[i]; if (i) ctx.lineTo(cx + x * scale, cy - y * scale); else ctx.moveTo(cx + x * scale, cy - y * scale); }
        ctx.stroke();
        const [hx, hy] = r.pts[Math.max(0, Math.floor(r.shown) - 1)]; if (r.shown < r.pts.length) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + hx * scale, cy - hy * scale, 3, 0, 7); ctx.fill(); }
      }
      ctx.lineWidth = 1;
      // probe with clock
      const px = cx + probeR * scale * 0.707, py = cy + probeR * scale * 0.707; const f = Math.sqrt(1 - 1 / probeR);
      ctx.fillStyle = '#5ad8ff'; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = '#5ad8ff'; ctx.beginPath(); ctx.arc(px + 18, py, 10, 0, 7); ctx.stroke(); const ang = t * f * 2; ctx.beginPath(); ctx.moveTo(px + 18, py); ctx.lineTo(px + 18 + Math.sin(ang) * 8, py - Math.cos(ang) * 8); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W - 30, 30, 12, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(W - 30, 30); ctx.lineTo(W - 30 + Math.sin(t * 2) * 10, 30 - Math.cos(t * 2) * 10); ctx.stroke();
      ctx.fillStyle = 'rgba(230,235,255,.75)'; ctx.fillText('distant clock', W - 66, 56); ctx.fillText(`probe clock ×${f.toFixed(2)}`, px + 4, py + 24);
      ctx.fillText('Units: Schwarzschild radii (rₛ). Distances are true to scale in rₛ.', 10, H - 10);
    });
    view.cv.addEventListener('pointerdown', e => {
      const r = view.cv.getBoundingClientRect(); const y = (cy - (e.clientY - r.top)) / scale;
      if (Math.abs(y) < 0.2 || Math.abs(y) > 12) return; b = Math.abs(y); bs.set(b.toFixed(3)); fire(y);
    });
    return () => view.stop();
  }
};
