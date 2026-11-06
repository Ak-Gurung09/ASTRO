// ASTRO LAB Career — procedural interior textures and shared materials (no image files).
import * as THREE from '../../../vendor/three.module.js';

const cache = new Map();
function canvasTex(key, w, hgt, draw, { repeat = [1, 1], srgb = true } = {}) {
  const k = key + repeat.join(',');
  if (cache.has(k)) return cache.get(k);
  const c = document.createElement('canvas'); c.width = w; c.height = hgt; draw(c.getContext('2d'), w, hgt);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; cache.set(k, t); return t;
}
function speckle(ctx, w, hgt, n, a, col = '0,0,0') { for (let i = 0; i < n; i++) { ctx.fillStyle = `rgba(${col},${Math.random() * a})`; ctx.fillRect(Math.random() * w, Math.random() * hgt, 1 + Math.random() * 2, 1 + Math.random() * 2); } }

export const TEX = {

  planks: (rep, tone = '#b88a5a') => canvasTex('planks' + tone, 512, 512, (c, w, hh) => {
    c.fillStyle = tone; c.fillRect(0, 0, w, hh);
    const rows = 8, rh = hh / rows;
    for (let r = 0; r < rows; r++) {
      let x = -Math.random() * 200;
      while (x < w) { const L = 160 + Math.random() * 200; const sh = Math.random() * 30 - 15;
        c.fillStyle = `rgb(${184 + sh},${138 + sh * 0.8},${90 + sh * 0.6})`; c.fillRect(x, r * rh, L, rh);
        for (let i = 0; i < 6; i++) { c.strokeStyle = `rgba(90,55,25,${0.08 + Math.random() * 0.1})`; c.beginPath(); const yy = r * rh + Math.random() * rh; c.moveTo(x, yy); c.bezierCurveTo(x + L * 0.3, yy + 3, x + L * 0.6, yy - 3, x + L, yy + 1); c.stroke(); }
        c.fillStyle = 'rgba(60,35,15,.45)'; c.fillRect(x, r * rh, 2, rh); x += L; }
      c.fillStyle = 'rgba(60,35,15,.5)'; c.fillRect(0, r * rh, w, 2);
    }
  }, { repeat: rep }),
  carpet: (rep, col = '#7b8fb8') => canvasTex('carpet' + col, 128, 128, (c, w, hh) => { c.fillStyle = col; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 4000, 0.12); speckle(c, w, hh, 1500, 0.12, '255,255,255'); }, { repeat: rep }),
  wallpaper: (rep, base = '#efe4d0', line = 'rgba(160,120,80,.18)') => canvasTex('wp' + base, 256, 256, (c, w, hh) => {
    c.fillStyle = base; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 1200, 0.04);
    c.strokeStyle = line; c.lineWidth = 6; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x + 8, 0); c.lineTo(x + 8, hh); c.stroke(); }
    c.fillStyle = line; for (let y = 16; y < hh; y += 64) for (let x = 24; x < w; x += 64) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
  }, { repeat: rep }),
  rug: (col1 = '#8b3a3a', col2 = '#e8d5b0') => canvasTex('rug' + col1, 256, 256, (c, w, hh) => {
    c.fillStyle = col1; c.fillRect(0, 0, w, hh); c.strokeStyle = col2; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, hh - 28); c.lineWidth = 3; c.strokeRect(30, 30, w - 60, hh - 60);
    c.fillStyle = col2; for (let i = 0; i < 5; i++) { c.save(); c.translate(w / 2, hh / 2); c.rotate(i * Math.PI / 5); c.fillRect(-60, -4, 120, 8); c.restore(); }
    speckle(c, w, hh, 3000, 0.15);
  }),
  tiles: (rep) => canvasTex('tiles', 128, 128, (c, w, hh) => { c.fillStyle = '#e9ecef'; c.fillRect(0, 0, w, hh); c.strokeStyle = '#b8bec6'; c.lineWidth = 3; for (let i = 0; i <= w; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, hh); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } }, { repeat: rep }),
  view: (kind = 'garden') => canvasTex('view' + kind, 512, 384, (c, w, hh) => {
    const g = c.createLinearGradient(0, 0, 0, hh * 0.65); g.addColorStop(0, '#6fa6e8'); g.addColorStop(1, '#cfe3f6'); c.fillStyle = g; c.fillRect(0, 0, w, hh);
    c.fillStyle = 'rgba(255,255,255,.85)'; for (const [x, y, r] of [[90, 60, 26], [120, 55, 34], [150, 64, 24], [360, 90, 22], [385, 84, 30]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    c.fillStyle = '#7fa0b8'; c.beginPath(); c.moveTo(0, hh * 0.62); for (let x = 0; x <= w; x += 32) c.lineTo(x, hh * 0.58 - Math.sin(x * 0.02) * 18 - Math.random() * 6); c.lineTo(w, hh); c.lineTo(0, hh); c.fill();
    c.fillStyle = '#5e9a4a'; c.fillRect(0, hh * 0.66, w, hh);
    for (let i = 0; i < 9; i++) { const x = Math.random() * w, y = hh * 0.62 + Math.random() * 30, r = 22 + Math.random() * 26; c.fillStyle = '#5b4632'; c.fillRect(x - 3, y, 6, 30); c.fillStyle = ['#3f7d3a', '#4c8f40', '#356b31'][i % 3]; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    if (kind === 'street') { c.fillStyle = '#c9b9a0'; c.fillRect(0, hh * 0.8, w, 26); c.fillStyle = '#d98a6a'; c.fillRect(300, hh * 0.5, 120, 80); c.fillStyle = '#8a4a3a'; c.beginPath(); c.moveTo(290, hh * 0.5); c.lineTo(360, hh * 0.38); c.lineTo(430, hh * 0.5); c.fill(); }
  }),
  poster: (kind = 'moon') => canvasTex('poster' + kind, 256, 352, (c, w, hh) => {
    c.fillStyle = '#05070f'; c.fillRect(0, 0, w, hh); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${Math.random()})`; c.fillRect(Math.random() * w, Math.random() * hh, 1.5, 1.5); }
    if (kind === 'moon') { const g = c.createRadialGradient(110, 140, 10, 128, 150, 90); g.addColorStop(0, '#f0eee8'); g.addColorStop(1, '#8d8a84'); c.fillStyle = g; c.beginPath(); c.arc(128, 150, 90, 0, 7); c.fill(); c.fillStyle = 'rgba(70,70,70,.35)'; for (const [x, y, r] of [[100, 120, 18], [150, 170, 26], [120, 200, 12], [165, 120, 10], [90, 170, 14]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } c.fillStyle = '#fff'; c.font = 'bold 26px system-ui'; c.textAlign = 'center'; c.fillText('THE MOON', w / 2, 300); c.font = '14px system-ui'; c.fillText('384,400 km away', w / 2, 324); }
    else { c.fillStyle = '#e7c98f'; c.beginPath(); c.arc(128, 160, 52, 0, 7); c.fill(); c.strokeStyle = '#d9c7a0'; c.lineWidth = 9; c.beginPath(); c.ellipse(128, 160, 104, 26, -0.25, 0, 7); c.stroke(); c.fillStyle = '#fff'; c.font = 'bold 26px system-ui'; c.textAlign = 'center'; c.fillText('SATURN', w / 2, 300); c.font = '14px system-ui'; c.fillText('146 known moons', w / 2, 324); }
  }),
  photo: (seed = 1) => canvasTex('photo' + seed, 128, 160, (c, w, hh) => {
    const hues = [['#9cc9f0', '#6fae5a'], ['#f2c7a5', '#7a9fc9'], ['#c8d8b0', '#e3a36a']][seed % 3];
    c.fillStyle = hues[0]; c.fillRect(0, 0, w, hh); c.fillStyle = hues[1]; c.fillRect(0, hh * 0.65, w, hh);
    const fig = (x, sc, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, hh * 0.42 - 18 * sc, 10 * sc, 0, 7); c.fill(); c.fillRect(x - 10 * sc, hh * 0.42 - 6 * sc, 20 * sc, 46 * sc); };
    fig(40, 1.1, '#6b4b34'); fig(70, 1.0, '#7a4a6e'); if (seed % 2) fig(98, 0.75, '#3d5a99');
  }),
  paving: (rep) => canvasTex('paving', 256, 256, (c, w, hh) => { c.fillStyle = '#b9b6ae'; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 3000, 0.12); c.strokeStyle = 'rgba(80,80,80,.35)'; c.lineWidth = 2; for (let i = 0; i <= w; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, hh); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } }, { repeat: rep }),
  grass: (rep) => canvasTex('grass', 256, 256, (c, w, hh) => { c.fillStyle = '#5c8f3e'; c.fillRect(0, 0, w, hh); for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(${30 + Math.random() * 60},${90 + Math.random() * 80},${20 + Math.random() * 40},.6)`; c.fillRect(Math.random() * w, Math.random() * hh, 1, 3); } }, { repeat: rep }),
  road: (rep) => canvasTex('road', 256, 512, (c, w, hh) => { c.fillStyle = '#3b3d42'; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 6000, 0.25); speckle(c, w, hh, 2000, 0.12, '255,255,255'); c.fillStyle = '#f2f2ee'; c.fillRect(8, 0, 6, hh); c.fillRect(w - 14, 0, 6, hh); c.fillStyle = '#f2c94c'; for (let y = 0; y < hh; y += 128) c.fillRect(w / 2 - 3, y, 6, 70); }, { repeat: rep }),
  vinyl: (rep) => canvasTex('vinyl', 256, 256, (c, w, hh) => {
    c.fillStyle = '#c9ccd2'; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 2500, 0.12); speckle(c, w, hh, 600, 0.25, '255,255,255');
    c.strokeStyle = 'rgba(60,64,72,.35)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, hh - 2);
  }, { repeat: rep }),
  wallPanel: (rep) => canvasTex('wallpanel', 256, 256, (c, w, hh) => {
    const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#e6e9ee'); g.addColorStop(1, '#d6dae1'); c.fillStyle = g; c.fillRect(0, 0, w, hh);
    speckle(c, w, hh, 800, 0.05); c.fillStyle = 'rgba(70,80,95,.35)'; c.fillRect(0, 0, 2, hh); c.fillRect(0, hh - 2, w, 2);
    c.fillStyle = 'rgba(60,70,90,.22)'; for (const [x, y] of [[10, 10], [w - 14, 10], [10, hh - 14], [w - 14, hh - 14]]) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
  }, { repeat: rep }),
  ceiling: (rep) => canvasTex('ceiling', 128, 128, (c, w, hh) => { c.fillStyle = '#eceef2'; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 1200, 0.08); c.strokeStyle = 'rgba(90,95,110,.4)'; c.strokeRect(0.5, 0.5, w - 1, hh - 1); }, { repeat: rep }),
  wood: (rep) => canvasTex('wood', 256, 256, (c, w, hh) => {
    c.fillStyle = '#8a5a34'; c.fillRect(0, 0, w, hh);
    for (let y = 0; y < hh; y += 2) { c.fillStyle = `rgba(${60 + Math.random() * 40},${35 + Math.random() * 20},15,${0.15 + Math.random() * 0.2})`; c.fillRect(0, y + Math.sin(y * 0.15) * 2, w, 1.5); }
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < w; x += 64) c.fillRect(x, 0, 2, hh);
  }, { repeat: rep }),
  crate: () => canvasTex('crate', 256, 256, (c, w, hh) => {
    c.fillStyle = '#d7dbe2'; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 900, 0.1);
    c.strokeStyle = '#7f8796'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, hh - 10);
    for (let i = -hh; i < w; i += 28) { c.fillStyle = '#f2b632'; c.beginPath(); c.moveTo(i, hh - 36); c.lineTo(i + 14, hh - 36); c.lineTo(i + 30, hh - 12); c.lineTo(i + 16, hh - 12); c.fill(); }
    c.fillStyle = '#1b2440'; c.font = 'bold 38px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('SUPPLY', w / 2, 96); c.font = 'bold 22px system-ui'; c.fillText('THIS SIDE OUT', w / 2, 130); c.fillText('▲ ▲ ▲', w / 2, 168);
  }),
  crateSide: () => canvasTex('crateside', 128, 128, (c, w, hh) => { c.fillStyle = '#cfd4dc'; c.fillRect(0, 0, w, hh); speckle(c, w, hh, 400, 0.12); c.strokeStyle = '#7f8796'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, hh - 6); }),
  sign: (text, sub = '', col = '#1e2a52') => canvasTex('sign:' + text + sub, 512, 192, (c, w, hh) => {
    c.fillStyle = col; c.fillRect(0, 0, w, hh); c.fillStyle = '#ffc857'; c.fillRect(0, hh - 10, w, 10);
    const fit = (str, px, weight) => { let s = px; do { c.font = `${weight} ${s}px system-ui, sans-serif`; s -= 2; } while (c.measureText(str).width > w - 36 && s > 10); };
    c.fillStyle = '#fff'; c.textAlign = 'center'; fit(text, 54, 'bold'); c.fillText(text, w / 2, sub ? 92 : 112);
    if (sub) { fit(sub, 30, ''); c.fillStyle = '#c9d6ff'; c.fillText(sub, w / 2, 146); }
  }),
  hazard: (rep) => canvasTex('hazard', 128, 32, (c, w, hh) => { c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, w, hh); c.fillStyle = '#f2b632'; for (let i = -hh; i < w; i += 24) { c.beginPath(); c.moveTo(i, hh); c.lineTo(i + 12, hh); c.lineTo(i + 12 + hh, 0); c.lineTo(i + hh, 0); c.fill(); } }, { repeat: rep })
};

export const MAT = {
  std: (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.7, metalness: 0 }, o)),
  metal: (color = 0x9aa3b2, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.38, metalness: 0.75 }, o)),
  glow: (color = 0xffffff, intensity = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 1 })
};

// Simple room shell: floor, ceiling, 4 walls with optional door gaps. Returns meshes + collider list to add.
export function roomShell({ w, d, hgt = 3, x = 0, z = 0, floor = TEX.vinyl, wall = TEX.wallPanel, gaps = [] }) {
  const g = new THREE.Group(); const cols = [];
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.std({ map: floor([w / 1.2, d / 1.2]), roughness: 0.55 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.position.set(x, 0, z); g.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.std({ map: TEX.ceiling([w / 1.2, d / 1.2]) })); ce.rotation.x = Math.PI / 2; ce.position.set(x, hgt, z); g.add(ce);
  const wallMat = MAT.std({ map: wall([1, 1]), roughness: 0.8 });
  const sides = [['n', x, z - d / 2, w, 0], ['s', x, z + d / 2, w, Math.PI], ['w', x - w / 2, z, d, Math.PI / 2], ['e', x + w / 2, z, d, -Math.PI / 2]];
  for (const [side, cx, cz, len, rot] of sides) {
    const gs = gaps.filter(gp => gp.side === side).sort((a, b) => a.at - b.at);
    let start = -len / 2; const segs = [];
    for (const gp of gs) { segs.push([start, gp.at - gp.w / 2]); start = gp.at + gp.w / 2; }
    segs.push([start, len / 2]);
    for (const [a, b] of segs) {
      if (b - a < 0.01) continue; const L = b - a, mid = (a + b) / 2;
      const m = wallMat.clone(); m.map = wall([L / 1.4, hgt / 1.4]);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(L, hgt), m); pl.receiveShadow = true;
      const along = side === 'n' || side === 's' ? [mid * (side === 'n' ? 1 : -1), 0] : [0, mid * (side === 'w' ? 1 : -1)];
      pl.position.set(cx + (side === 'n' ? mid : side === 's' ? -mid : 0), hgt / 2, cz + (side === 'w' ? -mid : side === 'e' ? mid : 0));
      pl.rotation.y = rot; g.add(pl); void along;
      // collider (0.2 m thick wall)
      if (side === 'n' || side === 's') { const xx = side === 'n' ? cx + mid : cx - mid; cols.push([xx - L / 2, xx + L / 2, cz - 0.1, cz + 0.1]); }
      else { const zz = side === 'w' ? cz - mid : cz + mid; cols.push([cx - 0.1, cx + 0.1, zz - L / 2, zz + L / 2]); }
    }
    // lintel above gaps
    for (const gp of gs) {
      const lh = hgt - (gp.h || 2.2); if (lh <= 0) continue;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(gp.w, lh), wallMat);
      pl.position.set(cx + (side === 'n' ? gp.at : side === 's' ? -gp.at : 0), (gp.h || 2.2) + lh / 2, cz + (side === 'w' ? -gp.at : side === 'e' ? gp.at : 0)); pl.rotation.y = rot; g.add(pl);
    }
  }
  // skirting
  const sk = MAT.std({ color: 0x5a6274, roughness: 0.6 });
  for (const [side, cx, cz, len, rot] of sides) { const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.02), sk); m.position.set(cx, 0.05, cz); m.rotation.y = rot; m.translateZ(0.011); g.add(m); }
  return { group: g, colliders: cols };
}
