// Habitability Simulator — habitable zone, equilibrium temperature, greenhouse effect, water and stars
import { h } from '../ui/dom.js';
import { simCanvas, slider, segmented } from '../ui/lab.js';

const STARS = {
  M: { name: 'M — red dwarf', L: 0.02, T: 3200, color: '#ff7a4a', life: 'trillions of years', note: 'Frequent flares and tidal locking make life harder, though stable for aeons.', pen: 12 },
  K: { name: 'K — orange dwarf', L: 0.3, T: 4500, color: '#ffb46a', life: '15–45 billion years', note: 'Long-lived and calmer than red dwarfs — often called "Goldilocks stars".', pen: 0 },
  G: { name: 'G — yellow dwarf (like the Sun)', L: 1, T: 5800, color: '#fff1b0', life: '≈10 billion years', note: 'Our Sun is a G2 star.', pen: 0 },
  F: { name: 'F — yellow-white', L: 3, T: 6800, color: '#f4f6ff', life: '≈2–4 billion years', note: 'More ultraviolet light and shorter lives.', pen: 8 },
  A: { name: 'A — white', L: 15, T: 8600, color: '#cfe0ff', life: '≈1 billion years or less', note: 'Probably too short-lived for complex life to evolve.', pen: 30 }
};
export default {
  id: 'habitability', icon: '🌱', title: 'Habitability', reward: 150,
  summary: 'Change star type, distance, atmosphere, water and planet mass to explore the conditions for life.',
  instructions: [
    'Pick a star type. The green ring shows its habitable zone, where liquid water could exist.',
    'Slide the planet\'s distance in and out of the zone.',
    'Choose atmosphere, water and planet mass, and watch the surface temperature and score.',
    'A score of 80+ means "potentially habitable".'
  ],
  goals: [
    { id: 'hab1', text: 'Design a potentially habitable world (score ≥ 80)' },
    { id: 'hab2', text: 'Do it again around a different star type' },
    { id: 'venus', text: 'Create a runaway greenhouse world hotter than 400 °C' }
  ],
  science: `<p>The <b>habitable zone</b> is the range of distances where a planet with an atmosphere could keep liquid water on its surface. Brighter stars push it outward: its distance scales roughly as <b>√L</b>.</p>
    <p>A planet's <b>equilibrium temperature</b> depends on starlight and reflectivity; Earth\'s would be about −18 °C. The <b>greenhouse effect</b> of its atmosphere adds ≈33 °C, giving an average of ≈15 °C. Venus shows what too much CO₂ can do: about 464 °C.</p>
    <p>Small planets can\'t hold on to atmospheres (Mars lost most of its air), and very massive ones become gas giants without a solid surface.</p>
    <p class="muted">Simplified model (albedo 0.3; conservative zone limits after Kopparapu et al. 2013). "Habitable" means liquid water is possible, not that life exists.</p>`,
  mount(stage, api) {
    let st = 'G', d = 3, atm = 'thin', water = 'some', mass = 'earth';
    const metGoal = new Set();
    const c = api.controls;
    segmented(c, 'Star type', Object.keys(STARS).map(k => [k, k]), st, v => { st = v; upd(); });
    const dist = slider(c, { label: 'Orbital distance', min: 0, max: 1000, step: 1, value: toS(3), fmt: v => `${fromS(v).toFixed(fromS(v) < 0.1 ? 3 : 2)} AU`, oninput: v => { d = fromS(v); upd(); } });
    segmented(c, 'Atmosphere', [['none', 'None'], ['thin', 'Thin (Mars-like)'], ['earth', 'Earth-like'], ['thick', 'Thick CO₂']], atm, v => { atm = v; upd(); });
    segmented(c, 'Water', [['none', 'None'], ['some', 'Some ice/water'], ['ocean', 'Oceans']], water, v => { water = v; upd(); });
    segmented(c, 'Planet mass', [['small', '0.1 × Earth'], ['earth', '1 × Earth'], ['super', '5 × Earth'], ['giant', 'Gas giant']], mass, v => { mass = v; upd(); });
    const out = h('div', { role: 'status' }); c.append(out);
    function toS(au) { return (Math.log10(au) + 2) / 3 * 1000; }   // 0.01 .. 10 AU
    function fromS(s) { return Math.pow(10, s / 1000 * 3 - 2); }

    function model() {
      const S = STARS[st]; const L = S.L;
      const inner = Math.sqrt(L / 1.1), outer = Math.sqrt(L / 0.36);
      const Teq = 278.6 * Math.pow(L, 0.25) / Math.sqrt(d) * Math.pow(0.7, 0.25);
      const gh = { none: 0, thin: 8, earth: 33, thick: 90 + Math.max(0, Teq - 220) * 3 }[atm];
      const Ts = Teq + gh; const C = Ts - 273.15;
      let score = 100, reasons = [];
      if (mass === 'giant') { score = 5; reasons.push('Gas giants have no solid surface or liquid-water oceans (their moons might, though!).'); }
      if (mass === 'small' && atm !== 'none') { score -= 35; reasons.push('A 0.1-Earth-mass planet has weak gravity and slowly loses its atmosphere, like Mars.'); }
      if (atm === 'none') { score -= 60; reasons.push('Without an atmosphere, water boils or freezes away into space — no liquid surface water.'); }
      if (atm === 'thin') { score -= 25; reasons.push('A thin atmosphere gives low pressure: water boils at low temperatures.'); }
      if (water === 'none') { score -= 55; reasons.push('No water means no liquid-water habitat as we know it.'); }
      if (water === 'some') { score -= 10; }
      if (C < 0) { score -= Math.min(60, 20 + -C * 0.6); reasons.push(`Average surface temperature ${C.toFixed(0)} °C: water freezes.`); }
      else if (C > 100) { score -= Math.min(80, 30 + (C - 100) * 0.4); reasons.push(`Average surface temperature ${C.toFixed(0)} °C: oceans boil away.`); }
      else if (C > 50) { score -= 15; reasons.push('Very hot — a "moist greenhouse" may slowly lose its water.'); }
      if (S.pen) { score -= S.pen; reasons.push(S.note); }
      const inHZ = d >= inner && d <= outer; if (!inHZ && atm !== 'thick') score -= 10;
      score = Math.max(0, Math.min(100, Math.round(score)));
      return { S, inner, outer, Teq, Ts, C, score, reasons, inHZ };
    }
    function upd() {
      const m = model();
      const verdict = m.score >= 80 ? ['ok', '🌍 Potentially habitable'] : m.score >= 50 ? ['info', '🌗 Marginal'] : ['fail', '☠ Hostile'];
      out.innerHTML = '';
      out.append(h('div', { class: 'readout', style: 'line-height:1.6' }, h('div', {}, `Star: ${m.S.name} · luminosity ${m.S.L} L☉ · lifetime ${m.S.life}`), h('div', {}, `Habitable zone: ${m.inner.toFixed(2)} – ${m.outer.toFixed(2)} AU ${m.inHZ ? '✓ inside' : '✗ outside'}`),
        h('div', {}, `Equilibrium temp: ${(m.Teq - 273.15).toFixed(0)} °C · Surface temp: ${m.C.toFixed(0)} °C`)),
        h('div', { class: 'meter' }, h('i', { style: `width:${m.score}%` })),
        h('div', { class: `result ${verdict[0]}` }, h('b', {}, `${verdict[1]} — score ${m.score}/100`), m.reasons.length ? h('ul', { style: 'margin:6px 0 0;padding-left:18px' }, m.reasons.map(r => h('li', {}, r))) : h('p', { style: 'margin:4px 0 0' }, 'Liquid water oceans, a protective atmosphere and a stable star — a promising world!')));
      if (m.score >= 80) { metGoal.add(st); api.complete('hab1'); if (metGoal.size >= 2) api.complete('hab2'); }
      if (m.C > 400 && mass !== 'giant') api.complete('venus');
    }
    upd();
    const view = simCanvas(stage, (ctx, W, H) => {
      const m = model();
      ctx.fillStyle = '#02030b'; ctx.fillRect(0, 0, W, H);
      const wide = W > H * 1.2; const sysW = wide ? W * 0.6 : W, sysH = wide ? H : H * 0.6;
      const cx = sysW * 0.08 + 30, cy = sysH / 2; const maxR = sysW - cx - 20;
      const rOf = au => (Math.log10(au) + 2) / 3 * maxR; // log scale 0.01..10 AU
      ctx.fillStyle = 'rgba(63,224,160,0.18)'; ctx.beginPath(); ctx.arc(cx, cy, rOf(m.outer), -1.2, 1.2); ctx.arc(cx, cy, rOf(m.inner), 1.2, -1.2, true); ctx.fill();
      ctx.strokeStyle = 'rgba(63,224,160,.6)'; ctx.beginPath(); ctx.arc(cx, cy, rOf(m.inner), -1.2, 1.2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, rOf(m.outer), -1.2, 1.2); ctx.stroke();
      ctx.fillStyle = 'rgba(160,180,255,.6)'; ctx.font = '11px system-ui';
      for (const au of [0.01, 0.1, 1, 10]) { const x = cx + rOf(au); ctx.fillRect(x, sysH - 24, 1, 6); ctx.fillText(`${au} AU`, x - 14, sysH - 8); }
      ctx.fillText('log distance scale', 10, sysH - 8);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40); g.addColorStop(0, '#fff'); g.addColorStop(0.35, m.S.color); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(120,150,255,.4)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(cx, cy, rOf(d), -1.25, 1.25); ctx.stroke(); ctx.setLineDash([]);
      const px = cx + rOf(d), py = cy;
      ctx.fillStyle = planetColor(m); ctx.beginPath(); ctx.arc(px, py, 8, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(230,235,255,.9)'; ctx.font = '12px system-ui'; ctx.fillText('Habitable zone', cx + rOf(m.inner) + 4, cy - rOf(m.inner) * 0.95 > 20 ? 20 : 20);
      // planet portrait
      const R = Math.min(wide ? W * 0.16 : W * 0.18, (wide ? H : H * 0.4) * 0.32);
      const qx = wide ? W * 0.8 : W / 2, qy = wide ? H / 2 : H * 0.8;
      if (atm !== 'none' && mass !== 'giant') { const a = ctx.createRadialGradient(qx, qy, R, qx, qy, R * 1.25); a.addColorStop(0, atm === 'thick' ? 'rgba(255,210,140,.7)' : 'rgba(110,180,255,.6)'); a.addColorStop(1, 'transparent'); ctx.fillStyle = a; ctx.beginPath(); ctx.arc(qx, qy, R * 1.25, 0, 7); ctx.fill(); }
      const pg = ctx.createRadialGradient(qx - R * 0.4, qy - R * 0.4, R * 0.1, qx, qy, R); pg.addColorStop(0, '#ffffff55'); pg.addColorStop(0.15, planetColor(m)); pg.addColorStop(1, '#000');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(qx, qy, R, 0, 7); ctx.fill();
      if (mass === 'giant') { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = R * 0.12; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(qx, qy + i * R * 0.3, R * Math.sqrt(1 - (i * 0.3) ** 2), R * 0.05, 0, 0, 7); ctx.stroke(); } ctx.lineWidth = 1; }
      else if (water === 'ocean' && m.C > 0 && m.C < 100) { ctx.fillStyle = 'rgba(80,160,90,.85)'; for (const [ox, oy, rr] of [[-0.3, -0.2, 0.3], [0.25, 0.2, 0.25], [0.1, -0.45, 0.15]]) { ctx.beginPath(); ctx.arc(qx + ox * R, qy + oy * R, rr * R, 0, 7); ctx.fill(); } }
      if (atm === 'thick') { ctx.fillStyle = 'rgba(240,200,130,.55)'; ctx.beginPath(); ctx.arc(qx, qy, R, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(230,235,255,.9)'; ctx.textAlign = 'center'; ctx.font = '13px system-ui'; ctx.fillText(`${m.C.toFixed(0)} °C average`, qx, qy + R + 22); ctx.textAlign = 'left';
    });
    function planetColor(m) {
      if (mass === 'giant') return '#d8b48a';
      if (water === 'none') return m.C > 300 ? '#c87a3a' : '#a0806a';
      if (m.C < -20) return '#e6eef6';
      if (m.C > 100) return atm === 'thick' ? '#e8c98c' : '#b0704a';
      return water === 'ocean' ? '#2f6fbf' : '#8a9a6a';
    }
    return () => view.stop();
  }
};
