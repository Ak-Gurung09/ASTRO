// ASTRO LAB — subtle drifting particles and shooting stars over the main menu (2D canvas; respects Reduce motion).
import { settings } from '../../systems/core.js';

export function startMenuParticles(cv, isActive) {
  if (!cv) return;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, parts = [], shoot = null, last = performance.now();
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const seed = () => { parts = Array.from({ length: Math.round(Math.min(140, W * H / 9000)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 8 - 2, a: Math.random() * 0.6 + 0.2, tw: Math.random() * 6 })); };
  resize(); seed(); addEventListener('resize', () => { resize(); seed(); });
  const step = now => {
    requestAnimationFrame(step);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!isActive()) return;
    ctx.clearRect(0, 0, W, H);
    const still = settings.reducedMotion;
    for (const p of parts) {
      if (!still) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5; }
      const a = p.a * (0.6 + 0.4 * Math.sin(now / 700 + p.tw));
      ctx.fillStyle = `rgba(180,205,255,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    if (!still) {
      if (!shoot && Math.random() < dt * 0.15) shoot = { x: Math.random() * W * 0.8, y: Math.random() * H * 0.4, vx: 520 + Math.random() * 300, vy: 160 + Math.random() * 120, life: 0.9 };
      if (shoot) {
        shoot.life -= dt; const tx = shoot.x - shoot.vx * 0.12, ty = shoot.y - shoot.vy * 0.12;
        const g = ctx.createLinearGradient(shoot.x, shoot.y, tx, ty); g.addColorStop(0, `rgba(220,235,255,${Math.max(0, shoot.life)})`); g.addColorStop(1, 'rgba(220,235,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(tx, ty); ctx.stroke();
        shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; if (shoot.life <= 0) shoot = null;
      }
    }
  };
  requestAnimationFrame(step);
}
