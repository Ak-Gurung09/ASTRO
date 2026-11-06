// ASTRO LAB — Surface collision helpers (pure math, no Three.js, so they can be unit-tested in Node).
// Rocks: each instance gets an oriented ellipsoid fitted to its real noisy mesh, then transformed by that
// instance's own tilt, non-uniform scale and sunken position. Models (lander, flags, ALSEP…): world AABBs.

// Least-squares ellipsoid A·x² + B·(y−cy)² + C·z² = 1 through a rock geometry's vertices.
// The flattened base (buried in the regolith) is left out of the fit.
export function fitEllipsoid(pos) {
  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < pos.length; i += 3) { minY = Math.min(minY, pos[i]); maxY = Math.max(maxY, pos[i]); }
  const cut = minY + 0.05 * (maxY - minY), N = Array.from({ length: 4 }, () => [0, 0, 0, 0, 0]);
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1], z = pos[i + 2]; if (y < cut) continue;
    const r = [x * x, y * y, z * z, y];
    for (let a = 0; a < 4; a++) { for (let b = 0; b < 4; b++) N[a][b] += r[a] * r[b]; N[a][4] += r[a]; }
  }
  const [A, B, C, D] = solve(N), cy = -D / (2 * B), k = 1 + B * cy * cy;
  return { a: Math.sqrt(k / A), b: Math.sqrt(k / B), c: Math.sqrt(k / C), cy };
}
function solve(m) { // Gauss–Jordan on an n×(n+1) augmented matrix
  const n = m.length;
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(m[r][i]) > Math.abs(m[p][i])) p = r;
    [m[i], m[p]] = [m[p], m[i]];
    for (let r = 0; r < n; r++) { if (r === i) continue; const f = m[r][i] / m[i][i]; for (let c = i; c <= n; c++) m[r][c] -= f * m[i][c]; }
  }
  return m.map((row, i) => row[n] / row[i]);
}

// Collider for one rock instance. q = rotation quaternion [x,y,z,w]; (sx,sy,sz) = instance scale.
export function rockCollider(px, py, pz, q, sx, sy, sz, fit) {
  const [x, y, z, w] = q;
  const R = [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
             2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
             2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
  const s = [fit.a * sx, fit.b * sy, fit.c * sz], off = fit.cy * sy;
  const c = { x: px + R[1] * off, y: py + R[4] * off, z: pz + R[7] * off, R, s, M: [0, 0, 0, 0, 0, 0] };
  const iv = s.map(v => 1 / (v * v));
  // M = R·diag(1/s²)·Rᵀ, stored as [xx, yy, zz, xy, xz, yz]
  const m = (i, j) => R[i * 3] * R[j * 3] * iv[0] + R[i * 3 + 1] * R[j * 3 + 1] * iv[1] + R[i * 3 + 2] * R[j * 3 + 2] * iv[2];
  c.M = [m(0, 0), m(1, 1), m(2, 2), m(0, 1), m(0, 2), m(1, 2)];
  const ext = i => Math.sqrt((R[i * 3] * s[0]) ** 2 + (R[i * 3 + 1] * s[1]) ** 2 + (R[i * 3 + 2] * s[2]) ** 2);
  c.ex = ext(0); c.ey = ext(1); c.ez = ext(2); c.top = c.y + c.ey; c.rMax = Math.max(...s);
  return c;
}

// Height of the rock's upper surface above the point (x, z), or −Infinity if the rock is not there.
export function rockTopAt(c, x, z) {
  const dx = x - c.x, dz = z - c.z; if (Math.abs(dx) > c.ex || Math.abs(dz) > c.ez) return -Infinity;
  const [xx, yy, zz, xy, xz, yz] = c.M;
  const b = xy * dx + yz * dz, cc = xx * dx * dx + 2 * xz * dx * dz + zz * dz * dz - 1, disc = b * b - yy * cc;
  return disc < 0 ? -Infinity : c.y + (-b + Math.sqrt(disc)) / yy;
}

// Sphere (p, r) against the ellipsoid. Returns penetration depth (>0 = overlapping) and writes the outward
// surface normal to `out`. Uses the radial projection onto the surface, accurate for these blob-shaped rocks.
export function sphereHit(c, px, py, pz, r, out) {
  const dx = px - c.x, dy = py - c.y, dz = pz - c.z;
  if (dx * dx + dy * dy + dz * dz > (c.rMax + r) ** 2) return 0;
  const R = c.R, s = c.s;
  const l0 = (R[0] * dx + R[3] * dy + R[6] * dz) / s[0], l1 = (R[1] * dx + R[4] * dy + R[7] * dz) / s[1], l2 = (R[2] * dx + R[5] * dy + R[8] * dz) / s[2];
  const L = Math.hypot(l0, l1, l2);
  if (L < 1e-6) { out.x = 0; out.y = 1; out.z = 0; return r + c.ey; }
  const u0 = l0 / L, u1 = l1 / L, u2 = l2 / L;
  const qx = c.x + R[0] * s[0] * u0 + R[1] * s[1] * u1 + R[2] * s[2] * u2;
  const qy = c.y + R[3] * s[0] * u0 + R[4] * s[1] * u1 + R[5] * s[2] * u2;
  const qz = c.z + R[6] * s[0] * u0 + R[7] * s[1] * u1 + R[8] * s[2] * u2;
  let nx = R[0] * u0 / s[0] + R[1] * u1 / s[1] + R[2] * u2 / s[2], ny = R[3] * u0 / s[0] + R[4] * u1 / s[1] + R[5] * u2 / s[2], nz = R[6] * u0 / s[0] + R[7] * u1 / s[1] + R[8] * u2 / s[2];
  const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
  const pen = r - ((px - qx) * nx + (py - qy) * ny + (pz - qz) * nz);
  if (pen <= 0) return 0;
  out.x = nx; out.y = ny; out.z = nz; return pen;
}

// First hit of the segment o → o + d (t in [0, 1]) with the ellipsoid; Infinity if none.
export function segRock(c, ox, oy, oz, dx, dy, dz) {
  const R = c.R, s = c.s, ax = ox - c.x, ay = oy - c.y, az = oz - c.z;
  const o = [0, 1, 2].map(k => (R[k] * ax + R[3 + k] * ay + R[6 + k] * az) / s[k]);
  const d = [0, 1, 2].map(k => (R[k] * dx + R[3 + k] * dy + R[6 + k] * dz) / s[k]);
  const A = d[0] ** 2 + d[1] ** 2 + d[2] ** 2, B = 2 * (o[0] * d[0] + o[1] * d[1] + o[2] * d[2]), C = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - 1;
  if (C < 0) return 0;
  const disc = B * B - 4 * A * C; if (disc < 0 || A < 1e-12) return Infinity;
  const t = (-B - Math.sqrt(disc)) / (2 * A);
  return t >= 0 && t <= 1 ? t : Infinity;
}

// ---- Axis-aligned boxes {x0,y0,z0,x1,y1,z1} ----
// Horizontal push that moves a circle (x, z, r) out of the box footprint; null if not overlapping.
export function circleBox(b, x, z, r) {
  const cx = Math.max(b.x0, Math.min(b.x1, x)), cz = Math.max(b.z0, Math.min(b.z1, z));
  const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
  if (d >= r) return null;
  if (d > 1e-6) return [dx / d * (r - d), dz / d * (r - d)];
  // centre inside the box: leave by the nearest side
  const opts = [[b.x0 - r - x, 0], [b.x1 + r - x, 0], [0, b.z0 - r - z], [0, b.z1 + r - z]];
  return opts.reduce((a, o) => (Math.abs(o[0] + o[1]) < Math.abs(a[0] + a[1]) ? o : a));
}
// Slab test: first hit of segment o → o + d with the box, t in [0, 1]; Infinity if none.
export function segBox(b, ox, oy, oz, dx, dy, dz) {
  let t0 = 0, t1 = 1;
  for (const [o, d, lo, hi] of [[ox, dx, b.x0, b.x1], [oy, dy, b.y0, b.y1], [oz, dz, b.z0, b.z1]]) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return Infinity; continue; }
    let a = (lo - o) / d, c = (hi - o) / d; if (a > c) [a, c] = [c, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return Infinity;
  }
  return t0;
}
