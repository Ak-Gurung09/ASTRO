// Self-check for js/surface/collision.js — run: node tools/test-collision.mjs
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../js/surface/collision.js', import.meta.url), 'utf8');
const C = await import('data:text/javascript,' + encodeURIComponent(src));
const ok = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
const near = (a, b, e = 1e-3) => Math.abs(a - b) < e;

// fit recovers an offset ellipsoid (semi-axes 2, 1, 1.5, centre y = 0.3)
const pts = [];
for (let i = 0; i < 400; i++) { const u = Math.random() * 2 - 1, t = Math.random() * 6.283, r = Math.sqrt(1 - u * u); pts.push(2 * r * Math.cos(t), 0.3 + u, 1.5 * r * Math.sin(t)); }
const f = C.fitEllipsoid(pts);
ok(near(f.a, 2, 0.02) && near(f.b, 1, 0.02) && near(f.c, 1.5, 0.02) && near(f.cy, 0.3, 0.02), 'fit ' + JSON.stringify(f));

const unit = { a: 1, b: 1, c: 1, cy: 0 }, I = [0, 0, 0, 1];
// non-uniform scale: top of a 2×0.5×1 rock sitting at y=10
const r1 = C.rockCollider(0, 10, 0, I, 2, 0.5, 1, unit);
ok(near(C.rockTopAt(r1, 0, 0), 10.5), 'top centre'); ok(C.rockTopAt(r1, 2.1, 0) === -Infinity, 'outside footprint');
ok(near(C.rockTopAt(r1, 1, 0), 10 + 0.5 * Math.sqrt(0.75)), 'top off-centre');
// tilt 90° about z: the long x axis now points up
const s = Math.SQRT1_2, r2 = C.rockCollider(0, 0, 0, [0, 0, s, s], 2, 0.5, 1, unit);
ok(near(C.rockTopAt(r2, 0, 0), 2), 'tilted top ' + C.rockTopAt(r2, 0, 0)); ok(near(r2.ey, 2) && near(r2.ex, 0.5), 'tilted extents');
// sphere push: player sphere touching the side of the rock gets pushed sideways, not when clear
const o = {};
ok(C.sphereHit(r1, 2.2, 10, 0, 0.3, o) > 0 && o.x > 0.9, 'side hit'); ok(C.sphereHit(r1, 2.4, 10, 0, 0.3, o) === 0, 'clear');
ok(C.sphereHit(r1, 0, 10.7, 0, 0.3, o) > 0 && o.y > 0.9, 'top hit has up normal');
// segments
ok(near(C.segRock(r1, -5, 10, 0, 10, 0, 0), 0.3), 'seg rock'); ok(C.segRock(r1, -5, 12, 0, 10, 0, 0) === Infinity, 'seg miss');
const b = { x0: -1, y0: 0, z0: -1, x1: 1, y1: 2, z1: 1 };
ok(near(C.segBox(b, -5, 1, 0, 10, 0, 0), 0.4), 'seg box'); ok(C.segBox(b, -5, 3, 0, 10, 0, 0) === Infinity, 'seg box miss');
const p = C.circleBox(b, 1.1, 0, 0.3); ok(p && near(p[0], 0.2), 'circle box'); ok(C.circleBox(b, 1.5, 0, 0.3) === null, 'circle clear');
const pin = C.circleBox(b, 0.9, 0, 0.3); ok(pin && near(pin[0], 0.4), 'circle inside exits nearest side');
console.log('collision.js: all checks passed');
