// Telescope & Light Simulator — multiwavelength astronomy (stylised, explanatory renderings)
import { h } from '../ui/dom.js';
import { simCanvas, segmented } from '../ui/lab.js';

const BANDS = {
  radio: { name: 'Radio', range: '> 1 mm', ground: 'Yes — radio passes through the atmosphere', scopes: 'VLA, ALMA, FAST, MeerKAT', hue: '#c49aff' },
  infrared: { name: 'Infrared', range: '≈0.7 µm – 1 mm', ground: 'Mostly blocked by water vapour — best from space or high mountains', scopes: 'JWST, Spitzer, Herschel', hue: '#ff8a5a' },
  visible: { name: 'Visible', range: '≈380 – 700 nm', ground: 'Yes — the light our eyes see', scopes: 'Hubble, VLT, Keck, Gaia', hue: '#ffffff' },
  ultraviolet: { name: 'Ultraviolet', range: '≈10 – 380 nm', ground: 'Blocked by the ozone layer — needs space telescopes', scopes: 'Hubble, GALEX, SDO, Solar Orbiter', hue: '#8ab4ff' },
  xray: { name: 'X-ray', range: '≈0.01 – 10 nm', ground: 'Completely blocked — space only', scopes: 'Chandra, XMM-Newton, NuSTAR', hue: '#7affea' }
};
const TARGETS = { nebula: 'Star-forming nebula', crab: 'Crab Nebula (supernova remnant)', galaxy: 'Spiral galaxy', sun: 'The Sun', center: 'Milky Way centre' };
const CAPTIONS = {
  nebula: { visible: 'Glowing hydrogen gas, with opaque pillars of dust hiding what is inside.', infrared: 'Infrared light passes through dust — dozens of newborn stars (protostars) appear inside the pillars!', radio: 'Radio maps the cold molecular gas — the raw fuel for future stars.', ultraviolet: 'UV highlights the hottest young massive stars that are sculpting the cloud.', xray: 'Only a few X-ray sources: young stars with violent magnetic flares.' },
  crab: { visible: 'Tangled filaments of gas thrown out by the supernova seen in 1054 CE.', infrared: 'Warm dust and glowing gas trace the expanding shell.', radio: 'Electrons spiralling in magnetic fields fill the whole nebula with radio light.', ultraviolet: 'High-energy electrons near the centre glow in ultraviolet.', xray: 'A bright ring and jets around the central pulsar, spinning 30 times per second!' },
  galaxy: { visible: 'Billions of stars in spiral arms, crossed by dark dust lanes.', infrared: 'Old stars in the bulge and warm dust in the arms; dust lanes now glow instead of block.', radio: 'Cold neutral hydrogen (21 cm line) stretches far beyond the visible disk — and its rotation reveals dark matter.', ultraviolet: 'Clumps of hot, young star formation light up the arms.', xray: 'X-ray binaries and hot gas around a central supermassive black hole.' },
  sun: { visible: 'The photosphere, with darker sunspots and limb darkening.', infrared: 'A smooth disk: infrared comes from slightly deeper, cooler layers.', radio: 'The radio Sun is larger — we see emission from the upper atmosphere.', ultraviolet: 'Million-degree plasma traces magnetic loops above active regions in the corona.', xray: 'The corona blazes in X-rays; the cooler surface looks dark.' },
  center: { visible: 'Almost nothing — about 30 magnitudes of dust block visible light toward the centre.', infrared: 'Infrared pierces the dust, revealing a dense cluster of stars orbiting Sagittarius A*.', radio: 'Sagittarius A* shines as a compact radio source, with arcs of magnetised gas.', ultraviolet: 'Ultraviolet is completely absorbed by the dust in the galactic plane.', xray: 'Hot gas and flaring X-ray emission near the supermassive black hole.' }
};
const REQUESTS = [
  { id: 'ir', text: 'Reveal the newborn stars hidden inside the dusty nebula', ok: (t, b) => t === 'nebula' && b === 'infrared' },
  { id: 'xray', text: 'Detect the pulsar\'s high-energy glow in the Crab Nebula', ok: (t, b) => t === 'crab' && b === 'xray' },
  { id: 'radio', text: 'Map cold hydrogen gas far beyond a galaxy\'s visible disk', ok: (t, b) => t === 'galaxy' && b === 'radio' },
  { id: 'corona', text: 'Image the Sun\'s million-degree corona', ok: (t, b) => t === 'sun' && (b === 'ultraviolet' || b === 'xray') },
  { id: 'center', text: 'See the stars orbiting the Milky Way\'s central black hole', ok: (t, b) => t === 'center' && b === 'infrared' }
];

export default {
  id: 'telescope', icon: '🔭', title: 'Telescope & Light', reward: 150,
  summary: 'Observe the same objects in radio, infrared, visible, ultraviolet and X-ray light.',
  instructions: ['Choose a target and a wavelength band.', 'Read what each kind of light reveals and which telescopes can see it.', 'When the view matches an observation request, press Capture.'],
  goals: REQUESTS.map(r => ({ id: r.id, text: r.text })),
  science: `<p>Light is an electromagnetic wave. Our eyes see a tiny slice of the <b>electromagnetic spectrum</b>; different wavelengths come from different physical processes.</p>
    <p><b>Radio</b>: cold gas and fast electrons. <b>Infrared</b>: warm dust and cool or hidden stars, and light from very distant redshifted galaxies. <b>Visible</b>: stars and glowing gas. <b>Ultraviolet</b>: hot young stars. <b>X-rays</b>: gas at millions of degrees near black holes, neutron stars and in the solar corona.</p>
    <p>Earth\'s atmosphere blocks most UV, X-ray and much infrared light, which is why telescopes like JWST, Hubble and Chandra observe from space.</p>
    <p class="muted">Images here are stylised illustrations designed to show what each band reveals.</p>`,
  mount(stage, api) {
    let tgt = 'nebula', band = 'visible', flash = 0;
    const c = api.controls;
    segmented(c, 'Target', Object.entries(TARGETS), tgt, v => { tgt = v; upd(); });
    segmented(c, 'Wavelength band', Object.entries(BANDS).map(([k, v]) => [k, v.name]), band, v => { band = v; upd(); });
    const info = h('div', { class: 'readout', style: 'line-height:1.55;font-family:inherit' });
    const msg = h('div');
    c.append(info, h('button', { class: 'btn primary', style: 'width:100%', onclick: capture }, '📸 Capture observation'), msg);
    function upd() {
      const B = BANDS[band];
      info.innerHTML = `<b>${B.name}</b> · wavelength ${B.range}<br><small>Reaches the ground? ${B.ground}</small><br><small>Telescopes: ${B.scopes}</small><hr style="border-color:rgba(255,255,255,.1)">${CAPTIONS[tgt][band]}`;
    }
    upd();
    function capture() {
      flash = 1;
      const r = REQUESTS.find(r => r.ok(tgt, band) && !api.isDone(r.id));
      msg.innerHTML = '';
      if (r) { api.complete(r.id); msg.append(h('div', { class: 'result ok' }, `✓ Request fulfilled: ${r.text}`)); }
      else if (REQUESTS.some(r => r.ok(tgt, band))) msg.append(h('div', { class: 'result info' }, 'Already captured. Try another request!'));
      else msg.append(h('div', { class: 'result fail' }, 'Image saved, but it doesn\'t match an open request. Think about which light can reveal what you need.'));
    }
    // seeded scene elements
    let s = 12345; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const stars = Array.from({ length: 220 }, () => ({ x: rnd(), y: rnd(), b: rnd(), hidden: rnd() < 0.45 }));
    const proto = Array.from({ length: 18 }, () => ({ x: 0.35 + rnd() * 0.3, y: 0.45 + rnd() * 0.4 }));
    const clouds = Array.from({ length: 34 }, () => ({ x: rnd(), y: rnd(), r: 0.08 + rnd() * 0.2, k: rnd() }));
    const fil = Array.from({ length: 60 }, () => ({ a: rnd() * 6.28, l: 0.15 + rnd() * 0.2, w: rnd() }));
    const arms = Array.from({ length: 1600 }, () => ({ r: Math.pow(rnd(), 1.4), arm: rnd() < 0.5 ? 0 : Math.PI, j: (rnd() - 0.5) * 0.5, k: rnd() }));
    const spots = Array.from({ length: 6 }, () => ({ a: rnd() * 6.28, r: rnd() * 0.7, s: 0.02 + rnd() * 0.04 }));
    const cluster = Array.from({ length: 160 }, () => { const a = rnd() * 6.28, r = Math.pow(rnd(), 2) * 0.35; return { x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r * 0.8, b: rnd() }; });
    const glow = (ctx, x, y, r, col, a = 1) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'transparent'); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; };

    const view = simCanvas(stage, (ctx, W, H, dt) => {
      const S = Math.min(W, H), ox = (W - S) / 2, oy = (H - S) / 2; const t = performance.now() / 1000;
      ctx.fillStyle = '#010208'; ctx.fillRect(0, 0, W, H);
      const P = (x, y) => [ox + x * S, oy + y * S];
      ctx.globalCompositeOperation = 'lighter';
      const bg = band === 'visible' || band === 'infrared' ? 1 : 0.25;
      for (const st of stars) { if (tgt === 'center' && band === 'visible') continue; if (tgt === 'sun') continue; const [x, y] = P(st.x, st.y); ctx.fillStyle = `rgba(255,255,255,${st.b * 0.6 * bg})`; ctx.fillRect(x, y, 1.3, 1.3); }
      if (tgt === 'nebula') {
        const col = { visible: ['rgba(255,90,150,0.18)', 'rgba(90,200,255,0.12)'], infrared: ['rgba(255,140,80,0.14)', 'rgba(255,90,60,0.08)'], radio: ['rgba(160,110,255,0.22)', 'rgba(90,60,200,0.12)'], ultraviolet: ['rgba(110,150,255,0.10)', 'rgba(110,150,255,0.05)'], xray: ['rgba(80,255,230,0.03)', 'rgba(0,0,0,0)'] }[band];
        for (const cl of clouds) { const [x, y] = P(cl.x, cl.y); glow(ctx, x, y, cl.r * S, col[cl.k > 0.5 ? 0 : 1]); }
        ctx.globalCompositeOperation = 'source-over';
        if (band === 'visible') { ctx.fillStyle = 'rgba(30,18,12,0.95)'; for (const [x0, w] of [[0.38, 0.08], [0.52, 0.06], [0.63, 0.05]]) { ctx.beginPath(); const [a, b] = P(x0, 1); const [c2, d] = P(x0 + 0.01, 0.38); ctx.moveTo(a - w * S, b); ctx.quadraticCurveTo(a - w * S * 0.6, (b + d) / 2, c2, d); ctx.quadraticCurveTo(a + w * S * 0.6, (b + d) / 2, a + w * S, b); ctx.fill(); } }
        if (band === 'infrared') { ctx.globalCompositeOperation = 'lighter'; for (const [x0, w] of [[0.38, 0.08], [0.52, 0.06], [0.63, 0.05]]) { const [a, b] = P(x0, 0.7); glow(ctx, a, b, w * S * 2.2, 'rgba(255,120,60,0.25)'); } for (const p of proto) { const [x, y] = P(p.x, p.y); glow(ctx, x, y, 9 + Math.sin(t * 2 + p.x * 30) * 2, 'rgba(255,220,180,0.95)'); } }
        if (band === 'ultraviolet') { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const [x, y] = P(0.25 + i * 0.1, 0.2 + (i % 2) * 0.06); glow(ctx, x, y, 16, 'rgba(160,190,255,1)'); } }
        if (band === 'xray') { ctx.globalCompositeOperation = 'lighter'; for (const p of proto.slice(0, 6)) { const [x, y] = P(p.x, p.y - 0.2); glow(ctx, x, y, 6, 'rgba(120,255,235,0.9)'); } }
      } else if (tgt === 'crab') {
        const [cx, cy] = P(0.5, 0.5);
        if (band === 'visible') { glow(ctx, cx, cy, S * 0.3, 'rgba(120,160,255,0.25)'); for (const f of fil) { ctx.strokeStyle = f.w > 0.5 ? 'rgba(255,120,70,0.6)' : 'rgba(120,255,140,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx + Math.cos(f.a) * S * 0.12, cy + Math.sin(f.a) * S * 0.09); ctx.lineTo(cx + Math.cos(f.a + 0.2) * S * (0.12 + f.l), cy + Math.sin(f.a + 0.2) * S * (0.09 + f.l * 0.75)); ctx.stroke(); } }
        if (band === 'infrared') { glow(ctx, cx, cy, S * 0.34, 'rgba(255,110,60,0.45)'); for (const f of fil) glow(ctx, cx + Math.cos(f.a) * S * 0.22, cy + Math.sin(f.a) * S * 0.17, 14, 'rgba(255,160,90,0.3)'); }
        if (band === 'radio') { glow(ctx, cx, cy, S * 0.42, 'rgba(170,120,255,0.55)'); glow(ctx, cx, cy, S * 0.22, 'rgba(220,160,255,0.4)'); }
        if (band === 'ultraviolet') { glow(ctx, cx, cy, S * 0.22, 'rgba(130,170,255,0.6)'); }
        if (band === 'xray') { ctx.strokeStyle = 'rgba(120,255,235,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, S * 0.09, S * 0.04, -0.4, 0, 7); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + S * 0.05, cy - S * 0.14); ctx.stroke(); glow(ctx, cx, cy, S * 0.16, 'rgba(120,255,235,0.4)'); glow(ctx, cx, cy, 10 * (0.6 + 0.4 * Math.abs(Math.sin(t * Math.PI * 4))), 'rgba(255,255,255,1)'); }
      } else if (tgt === 'galaxy') {
        const [cx, cy] = P(0.5, 0.5);
        if (band === 'radio') { for (let i = 0; i < 6; i++) glow(ctx, cx, cy, S * (0.48 - i * 0.06), `rgba(${120 + i * 15},${80 + i * 10},255,0.12)`); }
        for (const a of arms) {
          const ang = a.arm + a.r * 5 + a.j + t * 0.02, rr = a.r * S * 0.33; const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr * 0.55;
          let col = null;
          if (band === 'visible') col = a.r < 0.15 ? 'rgba(255,240,200,.5)' : 'rgba(200,215,255,.35)';
          if (band === 'infrared') col = a.r < 0.25 ? 'rgba(255,200,150,.5)' : (a.k > 0.6 ? 'rgba(255,120,70,.35)' : null);
          if (band === 'ultraviolet') col = a.r > 0.2 && a.k > 0.82 ? 'rgba(150,190,255,.9)' : null;
          if (band === 'radio') col = a.k > 0.7 ? 'rgba(200,170,255,.3)' : null;
          if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, band === 'ultraviolet' ? 2.5 : 1.6, band === 'ultraviolet' ? 2.5 : 1.6); }
        }
        if (band === 'visible' || band === 'infrared') glow(ctx, cx, cy, S * 0.07, band === 'visible' ? 'rgba(255,240,210,.9)' : 'rgba(255,190,140,.9)');
        if (band === 'xray') { glow(ctx, cx, cy, 14, 'rgba(120,255,235,1)'); glow(ctx, cx, cy, S * 0.12, 'rgba(120,255,235,.15)'); for (const a of arms.slice(0, 14)) glow(ctx, cx + Math.cos(a.arm + a.r * 5) * a.r * S * 0.33, cy + Math.sin(a.arm + a.r * 5) * a.r * S * 0.18, 5, 'rgba(160,255,240,.9)'); }
      } else if (tgt === 'sun') {
        const [cx, cy] = P(0.5, 0.5); const R = S * 0.3;
        if (band === 'visible' || band === 'infrared') { ctx.globalCompositeOperation = 'source-over'; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, band === 'visible' ? '#fff7d6' : '#ffb07a'); g.addColorStop(0.85, band === 'visible' ? '#ffb93a' : '#e8784a'); g.addColorStop(1, band === 'visible' ? '#d06a10' : '#b04a2a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); if (band === 'visible') { ctx.fillStyle = 'rgba(60,20,0,.7)'; for (const sp of spots) { ctx.beginPath(); ctx.arc(cx + Math.cos(sp.a) * sp.r * R, cy + Math.sin(sp.a) * sp.r * R, sp.s * S * 0.4, 0, 7); ctx.fill(); } } }
        if (band === 'radio') { glow(ctx, cx, cy, R * 1.6, 'rgba(190,140,255,0.8)'); }
        if (band === 'ultraviolet' || band === 'xray') { const col = band === 'ultraviolet' ? 'rgba(255,190,90,' : 'rgba(120,255,235,'; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = band === 'xray' ? '#05070a' : '#3a1a05'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, cx, cy, R * 1.5, col + '0.35)'); for (const sp of spots) { const x = cx + Math.cos(sp.a) * sp.r * R, y = cy + Math.sin(sp.a) * sp.r * R; glow(ctx, x, y, R * 0.25, col + '0.8)'); ctx.strokeStyle = col + '0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 6, 14 + Math.sin(t + sp.a) * 2, Math.PI, 0); ctx.stroke(); } }
      } else if (tgt === 'center') {
        if (band === 'visible') { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(40,25,20,.9)'; ctx.fillRect(ox, oy + S * 0.3, S, S * 0.4); }
        if (band === 'infrared') { for (const st of cluster) { const [x, y] = P(st.x, st.y); glow(ctx, x, y, 2 + st.b * 4, 'rgba(255,220,190,0.9)'); } const [cx, cy] = P(0.5, 0.5); ctx.strokeStyle = 'rgba(255,200,87,.6)'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.ellipse(cx, cy, S * 0.05, S * 0.025, 0.5, 0, 7); ctx.stroke(); ctx.setLineDash([]); const a = t * 0.6; glow(ctx, cx + Math.cos(a) * S * 0.05 * Math.cos(0.5) - Math.sin(a) * S * 0.025 * Math.sin(0.5), cy + Math.cos(a) * S * 0.05 * Math.sin(0.5) + Math.sin(a) * S * 0.025 * Math.cos(0.5), 6, 'rgba(255,255,255,1)'); }
        if (band === 'radio') { const [cx, cy] = P(0.5, 0.5); glow(ctx, cx, cy, 12, 'rgba(255,255,255,1)'); glow(ctx, cx, cy, S * 0.25, 'rgba(170,120,255,.4)'); ctx.strokeStyle = 'rgba(200,160,255,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx + S * (0.08 + i * 0.012), cy - S * 0.3); ctx.quadraticCurveTo(cx + S * (0.14 + i * 0.01), cy, cx + S * (0.08 + i * 0.012), cy + S * 0.3); ctx.stroke(); } }
        if (band === 'xray') { const [cx, cy] = P(0.5, 0.5); glow(ctx, cx, cy, S * 0.3, 'rgba(120,255,235,.25)'); glow(ctx, cx, cy, 8 + Math.max(0, Math.sin(t * 1.3)) * 10, 'rgba(200,255,250,1)'); for (const st of cluster.slice(0, 20)) { const [x, y] = P(st.x, st.y); glow(ctx, x, y, 4, 'rgba(120,255,235,.9)'); } }
      }
      ctx.globalCompositeOperation = 'source-over';
      // false-colour tint label + flash
      ctx.fillStyle = 'rgba(5,8,25,.75)'; ctx.fillRect(10, 10, 260, 46); ctx.fillStyle = BANDS[band].hue; ctx.font = '600 14px system-ui'; ctx.fillText(`${BANDS[band].name} view`, 20, 30); ctx.fillStyle = 'rgba(230,235,255,.8)'; ctx.font = '12px system-ui'; ctx.fillText(TARGETS[tgt], 20, 48);
      // spectrum bar
      const bw = Math.min(W - 20, 420), bx = W - bw - 10, by = H - 30; const keys = Object.keys(BANDS);
      keys.forEach((k, i) => { ctx.fillStyle = k === band ? BANDS[k].hue : 'rgba(255,255,255,.12)'; ctx.fillRect(bx + i * bw / 5, by, bw / 5 - 3, 8); ctx.fillStyle = 'rgba(230,235,255,.7)'; ctx.font = '11px system-ui'; ctx.fillText(BANDS[k].name, bx + i * bw / 5, by + 22); });
      ctx.fillStyle = 'rgba(230,235,255,.5)'; ctx.fillText('long wavelength → short wavelength (higher energy)', bx, by - 6);
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - dt * 3); }
    });
    return () => view.stop();
  }
};
