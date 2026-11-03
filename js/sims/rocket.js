// Rocket Launch Simulator — Tsiolkovsky rocket equation + delta-v budget + launch windows (simplified)
import { h } from '../ui/dom.js';
import { simCanvas, slider, segmented } from '../ui/lab.js';

const G0 = 9.80665;
// Approximate delta-v from Earth's surface (km/s), including typical ascent losses (~1.5–2 km/s):
// LEO ≈ 9.4; trans-lunar injection +3.1; trans-Mars +3.6; trans-Venus +3.5 (Hohmann-style, best window).
const TARGETS = {
  moon: { name: 'Moon', dv: 9.4 + 3.1, window: 'Daily (lunar orbit geometry)', synodic: 29.5, color: '#c9c6c0', travel: '≈3 days' },
  venus: { name: 'Venus', dv: 9.4 + 3.5, window: 'Every ≈584 days (Venus synodic period)', synodic: 584, color: '#e8c98c', travel: '≈4–5 months' },
  mars: { name: 'Mars', dv: 9.4 + 3.6, window: 'Every ≈780 days (Mars synodic period)', synodic: 780, color: '#d0603a', travel: '≈7 months' }
};
export default {
  id: 'rocket', icon: '🚀', title: 'Rocket Launch', reward: 150,
  summary: 'Balance thrust, fuel, staging, trajectory and timing to reach the Moon, Venus or Mars.',
  instructions: [
    'Choose a destination. Each needs a different total Δv (change in velocity).',
    'Adjust propellant, number of stages and engine thrust. Watch the Δv budget meter.',
    'Pick a pitch program (how quickly the rocket tilts over) and a launch date offset from the ideal window.',
    'Press LAUNCH. You succeed if your available Δv covers the required Δv plus losses.'
  ],
  goals: [
    { id: 'any', text: 'Complete a successful launch to any destination' },
    { id: 'planet', text: 'Reach Mars or Venus' },
    { id: 'all', text: 'Reach all three destinations' }
  ],
  science: `<p>The <b>Tsiolkovsky rocket equation</b> sets the limit: <b>Δv = I<sub>sp</sub> · g₀ · ln(m<sub>full</sub> / m<sub>empty</sub>)</b>. More propellant helps, but with diminishing returns — which is why rockets drop empty <b>stages</b>.</p>
    <p>Reaching low Earth orbit takes ≈9.4 km/s once gravity and drag losses are included. Thrust must exceed weight (<b>thrust-to-weight &gt; 1</b>) or the rocket never leaves the pad; too much and it hits dangerous g-forces and aerodynamic stress (max-Q).</p>
    <p>Planets line up for efficient <b>Hohmann transfers</b> only at <b>launch windows</b> — every ≈26 months for Mars. Launching off-window costs extra Δv.</p>
    <p class="muted">Simplified teaching model: real missions use detailed trajectory optimisation.</p>`,
  mount(stage, api) {
    let saved = []; try { saved = JSON.parse(sessionStorage.getItem('astrolab.rocket') || '[]'); } catch {}
    const reached = new Set(saved);
    let tgt = 'moon', fuel = 400, stages = 2, thrust = 7000, pitch = 5, offset = 0, anim = null;
    const c = api.controls;
    segmented(c, 'Destination', [['moon', '🌕 Moon'], ['venus', '🟡 Venus'], ['mars', '🔴 Mars']], tgt, v => { tgt = v; calc(); });
    slider(c, { label: 'Propellant mass', min: 50, max: 900, step: 10, value: fuel, fmt: v => `${v} t`, oninput: v => { fuel = v; calc(); } });
    segmented(c, 'Stages', [[1, '1 stage'], [2, '2 stages'], [3, '3 stages']], stages, v => { stages = v; calc(); });
    slider(c, { label: 'Liftoff thrust', min: 2000, max: 40000, step: 250, value: thrust, fmt: v => `${(v / 1000).toFixed(2)} MN`, oninput: v => { thrust = v; calc(); } });
    slider(c, { label: 'Pitch program (gentle → aggressive)', min: 1, max: 10, step: 1, value: pitch, fmt: v => `${v}`, oninput: v => { pitch = v; calc(); } });
    slider(c, { label: 'Launch date vs. ideal window', min: -90, max: 90, step: 5, value: offset, fmt: v => `${v > 0 ? '+' : ''}${v} days`, oninput: v => { offset = v; calc(); } });
    const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('i'), h('span', { class: 'mark' }));
    const budget = h('div', { class: 'readout', role: 'status', style: 'line-height:1.6' });
    const result = h('div');
    const go = h('button', { class: 'btn primary big', style: 'width:100%', onclick: launch }, '🚀 LAUNCH');
    c.append(h('div', { class: 'tiny muted' }, 'Δv budget (available vs. required)'), meter, budget, go, result);

    const DRY = 28, PAYLOAD = 12, ISP = 360; // tonnes, seconds (average across stages)
    function model() {
      const T = TARGETS[tgt];
      const m0 = DRY + PAYLOAD + fuel;
      const twr = (thrust * 1000) / (m0 * 1000 * G0);
      // staging: dropping empty tanks raises effective mass ratio (simplified multiplier)
      const stageK = [1, 1.28, 1.42][stages - 1];
      const dvAvail = ISP * G0 * Math.log(m0 / (DRY + PAYLOAD)) / 1000 * stageK;
      const lossGravity = twr < 1.0 ? Infinity : Math.max(0, (1.6 - twr)) * 1.4;
      const lossPitch = Math.abs(pitch - 6) * 0.12 + (pitch > 8 ? (pitch - 8) * 0.25 : 0);
      const lossWindow = tgt === 'moon' ? Math.abs(offset) * 0.002 : Math.pow(Math.abs(offset) / 30, 2) * 0.55;
      const need = T.dv + lossGravity + lossPitch + lossWindow;
      const maxG = (thrust * 1000) / ((DRY + PAYLOAD) * 1000 * G0) / stages; // crude end-of-burn acceleration
      return { T, twr, dvAvail, need, lossGravity, lossPitch, lossWindow, maxG };
    }
    function calc() {
      const m = model();
      const pct = Math.min(1, m.dvAvail / Math.max(1, m.need === Infinity ? 99 : m.need) * 0.8);
      meter.firstChild.style.width = `${pct * 100}%`; meter.lastChild.style.left = '80%';
      budget.innerHTML = `Δv available: <b>${m.dvAvail.toFixed(2)} km/s</b><br>Δv required: <b>${m.need === Infinity ? '∞ (rocket can\'t lift off)' : m.need.toFixed(2) + ' km/s'}</b><br>
        <small>Base ${m.T.dv.toFixed(1)} · gravity loss ${m.lossGravity === Infinity ? '∞' : m.lossGravity.toFixed(2)} · steering ${m.lossPitch.toFixed(2)} · window ${m.lossWindow.toFixed(2)}</small><br>
        Thrust-to-weight: <b style="color:${m.twr < 1 ? 'var(--bad)' : m.twr > 3.2 ? 'var(--warn)' : 'var(--good)'}">${m.twr.toFixed(2)}</b> · Launch windows: ${m.T.window}`;
    }
    calc();
    function launch() {
      if (anim) return;
      const m = model();
      let outcome, ok = false;
      if (m.twr < 1) outcome = `The engines can't lift the rocket — thrust-to-weight is ${m.twr.toFixed(2)}. Thrust must exceed weight (TWR > 1). Add thrust or reduce propellant.`;
      else if (m.twr > 3.2) outcome = `Structural failure! Thrust-to-weight ${m.twr.toFixed(2)} pushes the vehicle through max-Q too hard. Reduce thrust (aim for TWR 1.3–2.5).`;
      else if (pitch > 9) outcome = 'Pitching over too early sent the rocket sideways into thick air — aerodynamic forces broke it apart. Try a gentler pitch program.';
      else if (m.dvAvail < 9.4 + m.lossGravity + m.lossPitch) outcome = `Orbit not reached: only ${m.dvAvail.toFixed(2)} km/s available, but low Earth orbit needs about ${(9.4 + m.lossGravity + m.lossPitch).toFixed(2)} km/s. Add propellant or stages.`;
      else if (m.dvAvail < m.need) outcome = `You reached orbit, but the transfer burn to ${m.T.name} fell short by ${(m.need - m.dvAvail).toFixed(2)} km/s.${m.lossWindow > 0.3 ? ' Launching closer to the window would save Δv.' : ''}`;
      else { ok = true; outcome = `Success! Your spacecraft is on its way to ${m.T.name} (travel time ${m.T.travel}) with ${(m.dvAvail - m.need).toFixed(2)} km/s to spare for course corrections.`; }
      anim = { t: 0, ok, m, failAt: ok ? 99 : m.twr < 1 ? 0.3 : m.twr > 3.2 || pitch > 9 ? 1.4 : m.dvAvail < 9.4 ? 2.6 : 4.2 };
      result.innerHTML = ''; go.disabled = true;
      setTimeout(() => {
        go.disabled = false; result.append(h('div', { class: `result ${ok ? 'ok' : 'fail'}` }, outcome));
        if (ok) { reached.add(tgt); try { sessionStorage.setItem('astrolab.rocket', JSON.stringify([...reached])); } catch {} api.complete('any'); if (tgt !== 'moon') api.complete('planet'); if (reached.size >= 3) api.complete('all'); }
      }, ok ? 5200 : Math.min(4400, anim.failAt * 1000 + 600));
    }
    const stars = Array.from({ length: 120 }, () => [Math.random(), Math.random(), Math.random()]);
    const view = simCanvas(stage, (ctx, W, H, dt) => {
      const sky = anim ? Math.min(1, anim.t / 3) : 0;
      const grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, `rgb(${10 - sky * 8},${20 - sky * 15},${60 - sky * 50})`); grd.addColorStop(1, `rgb(${40 - sky * 35},${70 - sky * 60},${140 - sky * 125})`);
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      for (const [x, y, b] of stars) { ctx.fillStyle = `rgba(255,255,255,${b * (0.2 + sky * 0.8)})`; ctx.fillRect(x * W, y * H * 0.8, 1.5, 1.5); }
      const T = TARGETS[tgt];
      if (!anim || anim.t < 4.2) {
        // ascent view
        const t = anim ? anim.t : 0; const alt = Math.pow(t, 2) * 0.12 * H;
        ctx.fillStyle = '#1b2a1a'; ctx.fillRect(0, H * 0.85 + alt, W, H);
        ctx.fillStyle = '#556'; ctx.fillRect(W / 2 - 30, H * 0.85 - 70 + alt, 8, 70);
        const fail = anim && !anim.ok && t > anim.failAt;
        const tilt = anim ? Math.min(1.2, Math.max(0, t - 1) * pitch * 0.06) : 0;
        const rx = W / 2 + (anim ? Math.pow(Math.max(0, t - 1), 2) * pitch * 6 : 0), ry = H * 0.85 - 60 - (anim ? Math.min(alt, H * 0.3) * 0.2 : 0);
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(tilt);
        if (fail) { for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,${120 + Math.random() * 100},40,${Math.random()})`; ctx.beginPath(); ctx.arc((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, Math.random() * 14, 0, 7); ctx.fill(); } }
        else {
          if (anim && anim.ok !== undefined && t < anim.failAt) { const fl = 30 + Math.random() * 20; const g = ctx.createLinearGradient(0, 30, 0, 30 + fl); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.4, '#ff9a3a'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, 30); ctx.lineTo(0, 30 + fl); ctx.lineTo(8, 30); ctx.fill(); }
          ctx.fillStyle = '#e8ecff'; ctx.fillRect(-9, -40, 18, 70); ctx.fillStyle = '#8b5cf6'; ctx.beginPath(); ctx.moveTo(-9, -40); ctx.lineTo(0, -60); ctx.lineTo(9, -40); ctx.fill();
          ctx.fillStyle = '#4f8cff'; ctx.fillRect(-9, -10, 18, 4); if (stages > 1) ctx.fillRect(-9, 8, 18, 3);
          ctx.fillStyle = '#5a6'; ctx.beginPath(); ctx.moveTo(-9, 30); ctx.lineTo(-16, 36); ctx.lineTo(-9, 18); ctx.fill(); ctx.beginPath(); ctx.moveTo(9, 30); ctx.lineTo(16, 36); ctx.lineTo(9, 18); ctx.fill();
        }
        ctx.restore();
        ctx.fillStyle = 'rgba(230,235,255,.9)'; ctx.font = '13px ui-monospace, monospace';
        if (anim) ctx.fillText(`T+${(t * 30).toFixed(0)} s · altitude ${Math.min(400, Math.pow(t, 2.2) * 20).toFixed(0)} km`, 12, 22);
        else ctx.fillText(`Ready on the pad · destination: ${T.name}`, 12, 22);
      } else {
        // transfer view
        const t = anim.t - 4.2; const ox = W / 2, oy = H / 2;
        ctx.fillStyle = '#4f9fff'; ctx.beginPath(); ctx.arc(ox - W * 0.3, oy, 10, 0, 7); ctx.fill();
        ctx.fillStyle = T.color; const tx = ox + W * 0.3; ctx.beginPath(); ctx.arc(tx, oy, tgt === 'moon' ? 6 : 9, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,87,.6)'; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.ellipse(ox, oy, W * 0.3, H * 0.22, 0, Math.PI, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        const a = Math.PI + Math.min(1, t / 0.9) * Math.PI; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox + Math.cos(a) * W * 0.3, oy + Math.sin(a) * H * 0.22, 4, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(230,235,255,.9)'; ctx.font = '13px system-ui';
        ctx.fillText(`Transfer orbit to ${T.name} (schematic, not to scale)`, 12, 22); ctx.fillText('Earth', ox - W * 0.3 - 16, oy + 26); ctx.fillText(T.name, tx - 14, oy + 26);
      }
      if (anim) { anim.t += dt; const end = anim.ok ? 5.2 : anim.failAt + 0.8; if (anim.t > end) anim = null; }
    });
    return () => view.stop();
  }
};
