// Surface-game test harness. Serve the folder over http, open dev.html, then in the browser console:
//   const { setupH } = await import('/tools/surface-harness.js'); const H = await setupH('hadley');
//   H.walkInto(H.sets.big[0])   H.ram(H.sets.big[0], 1)   H.run(2, ['KeyW'])
// It stops the render loop and steps the physics at a fixed 1/120 s, so results don't depend on frame rate.
export async function setupH(site) {
  const S = await import('/js/ui/surface.js'); await S.startSurface(site);
  const g = window.__astrolab.surface; g.running = false; cancelAnimationFrame(g.raf); g.intro = 0;
  const C = await import('/js/surface/collision.js');
  const t = g.terrain, P = g.p, above = r => r.top - t.h(r.x, r.z);
  const H = { g, C, t, P, above,
    place(x, z, y) { P.pos.set(x, y ?? t.h(x, z), z); P.vel.set(0, 0, 0); P.ground = y === undefined; P.on = 0; P.airT = 0; g.refreshNear(true); },
    run(secs, keys = []) { g.keys = new Set(keys); for (let i = 0; i < secs * 120; i++) { g.step(1 / 120); g.animStep(1 / 120); } g.keys = new Set(); },
    // deepest overlap between the player's body spheres and a rock's wall (0 = not inside)
    pen(r) { const o = {}; let m = 0; for (const hs of [0.35, 0.95, 1.45]) { const p = C.sphereHit(r, P.pos.x, P.pos.y + hs, P.pos.z, 0.3, o); if (p && o.y <= 0.8) m = Math.max(m, p); } return m; },
    walkInto(r, secs = 8, ang = 0.7) {
      this.place(r.x + Math.sin(ang) * (r.ex + 5), r.z + Math.cos(ang) * (r.ez + 5));
      g.camYaw = Math.atan2(P.pos.x - r.x, P.pos.z - r.z);
      g.keys = new Set(['KeyW']); let maxPen = 0, onTop = 0;
      for (let i = 0; i < secs * 120; i++) { g.step(1 / 120); maxPen = Math.max(maxPen, this.pen(r)); if (P.on) onTop++; }
      g.keys = new Set();
      return { rockH: +above(r).toFixed(2), size: +Math.max(r.ex, r.ez).toFixed(2), maxPen: +maxPen.toFixed(3), dist: +Math.hypot(P.pos.x - r.x, P.pos.z - r.z).toFixed(2), feetUp: +(P.pos.y - t.h(P.pos.x, P.pos.z)).toFixed(2), onTopSteps: onTop };
    },
    ram(rk, ang, secs = 9) {
      const R = g.rv; g.driving = true; const sx = rk.x + Math.sin(ang) * 14, sz = rk.z + Math.cos(ang) * 14;
      R.pos.set(sx, t.h(sx, sz), sz); R.u = 0; R.vy = 0; R.ground = true; R.yaw = Math.atan2(sx - rk.x, sz - rk.z); g.refreshNear(true);
      const o = {}; let worst = 0, minD = 1e9; g.keys = new Set(['KeyW']);
      for (let i = 0; i < secs * 120; i++) {
        g.step(1 / 120); minD = Math.min(minD, Math.hypot(R.pos.x - rk.x, R.pos.z - rk.z));
        const c = Math.cos(R.yaw), s = Math.sin(R.yaw);
        if (R.pos.y + 0.3 < rk.top) for (const [lx, lz] of [[-0.95, -1.2], [0.95, -1.2], [0, -1.5]]) { const p = C.sphereHit(rk, R.pos.x + lx * c + lz * s, R.pos.y + 0.75, R.pos.z - lx * s + lz * c, 0.5, o); if (o.y <= 0.6) worst = Math.max(worst, p); }
      }
      g.keys = new Set(); g.driving = false;
      return { rockH: +above(rk).toFixed(2), minD: +minD.toFixed(2), worstPen: +worst.toFixed(3) };
    }
  };
  H.sets = {
    big: g.rocks.filter(r => above(r) > 1.2 && Math.max(r.ex, r.ez) > 1.2).sort((a, b) => above(b) - above(a)),
    med: g.rocks.filter(r => above(r) > 0.5 && above(r) < 0.9),
    small: g.rocks.filter(r => above(r) > 0.12 && above(r) < 0.25),
    tilted: g.rocks.filter(r => Math.abs(r.R[4]) < 0.85 && above(r) > 0.6)
  };
  window.H = H; return H;
}
