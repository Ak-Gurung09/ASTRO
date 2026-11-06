// ASTRO LAB — 3D solar system (Three.js), camera controls and time simulation
import * as THREE from '../../vendor/three.module.js';
import { BODIES, BODY_MAP } from '../data/solarSystem.js';
import { ringTexture, glowTexture, dotTexture, fbm } from './textures.js';
import { bus, settings, gameEvent } from '../systems/core.js';

const J2000 = Date.UTC(2000, 0, 1, 12);
export const SPEEDS = [0.05, 0.25, 1, 2, 5, 10, 30, 90, 365];
const MAX_SPIN = 1.6;    // rad/s cap for planet spin (visual comfort)
const MAX_MOON = 2.2;    // rad/s cap for moon orbits (visual comfort)

export class SolarScene {
  constructor(container, textures) {
    this.container = container;
    this.textures = textures;
    this.bodies = new Map();       // id -> { data, group (orbit pivot), mesh, radius, ... }
    this.simDays = (Date.now() - J2000) / 86400000;
    this.speedIndex = 4;
    this.paused = false;
    this.selected = null; this.hovered = null;
    this.active = true; this.clock = new THREE.Clock();
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.frameTimes = [];
    this._initRenderer();
    this._initScene();
    this._initControls();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  // ---------------- Setup ----------------
  _initRenderer() {
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setClearColor(0x02030a, 1);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    this.canvas = r.domElement; this.canvas.id = 'scene-canvas';
    this.canvas.setAttribute('aria-label', '3D solar system view. Use the Map or object list for keyboard selection.');
    this.canvas.tabIndex = 0;
    this.container.appendChild(this.canvas);
    this.applyQuality();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 6000);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); bus.emit('toast', { icon: '⚠️', title: 'Graphics paused', text: 'The 3D view lost its graphics context. It will recover automatically, or reload the page.' }); });
    this.canvas.addEventListener('webglcontextrestored', () => bus.emit('toast', { icon: '✅', title: 'Graphics restored', text: '' }));
  }
  applyQuality(q = settings.quality) {
    const dpr = window.devicePixelRatio || 1;
    const pr = q === 'low' ? 1 : q === 'medium' ? Math.min(dpr, 1.5) : q === 'ultra' ? Math.min(dpr, 2.5) : Math.min(dpr, 2);
    this.renderer.setPixelRatio(q === 'auto' ? Math.min(dpr, 1.75) : pr);
    if (this.starsLayer2) this.starsLayer2.visible = q !== 'low';
  }
  resize() {
    const w = this.container.clientWidth || window.innerWidth, h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    if (this.camera) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  }

  _texture(id) {
    const c = this.textures[id]; if (!c) return null;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); return t;
  }

  _initScene() {
    const s = this.scene = new THREE.Scene();
    s.add(new THREE.AmbientLight(0x404a6a, 0.35));
    const sunLight = new THREE.PointLight(0xfff1dc, 3.2, 0, 0); s.add(sunLight);

    this._makeStars();
    this._makeBelts();

    const dot = new THREE.CanvasTexture(dotTexture());
    this.dotTex = dot;
    for (const b of BODIES) this._makeBody(b);

    // Selection reticle (billboard ring)
    const rg = new THREE.RingGeometry(1.25, 1.36, 64);
    this.reticle = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0x7aa8ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    this.reticle.visible = false; s.add(this.reticle);
    const hg = new THREE.RingGeometry(1.2, 1.26, 64);
    this.hoverRing = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    this.hoverRing.visible = false; s.add(this.hoverRing);

    // Camera rig
    this.cam = { target: new THREE.Vector3(0, 0, 0), radius: 110, theta: 0.6, phi: 1.05, follow: null, tween: null };
    this.setOrbitsVisible(settings.showOrbits);
  }

  _makeStars() {
    const mk = (count, rMin, rMax, size, band) => {
      const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), sz = new Float32Array(count), ph = new Float32Array(count);
      const palette = [[0.75, 0.82, 1], [1, 1, 1], [1, 0.95, 0.85], [1, 0.82, 0.65], [0.85, 0.75, 1]];
      for (let i = 0; i < count; i++) {
        let x, y, z;
        if (band) { // concentrate along a tilted great circle (Milky Way-like band)
          const a = Math.random() * Math.PI * 2, spread = (Math.random() - 0.5) * (Math.random() * 0.35);
          x = Math.cos(a); y = spread; z = Math.sin(a);
          const tilt = 1.05; const y2 = y * Math.cos(tilt) - z * Math.sin(tilt); z = y * Math.sin(tilt) + z * Math.cos(tilt); y = y2;
        } else { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); x = r * Math.cos(a); y = u; z = r * Math.sin(a); }
        const R = rMin + Math.random() * (rMax - rMin), l = Math.hypot(x, y, z);
        pos.set([x / l * R, y / l * R, z / l * R], i * 3);
        const p = palette[(Math.random() * palette.length) | 0]; const br = band ? 0.35 + Math.random() * 0.4 : 0.5 + Math.random() * 0.5;
        col.set([p[0] * br, p[1] * br, p[2] * br], i * 3);
        sz[i] = size * (0.4 + Math.pow(Math.random(), 3) * 2.2); ph[i] = Math.random() * 6.28;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setAttribute('size', new THREE.BufferAttribute(sz, 1)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPR: { value: this.renderer.getPixelRatio() }, uTw: { value: settings.reducedMotion ? 0 : 1 } },
        vertexShader: `attribute float size; attribute float phase; varying vec3 vC; varying float vT; uniform float uTime; uniform float uPR; uniform float uTw;
          void main(){ vC = color; vT = 0.75 + 0.25 * sin(uTime * (1.0 + phase) + phase * 7.0) * uTw + 0.25 * (1.0 - uTw);
          vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * uPR; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vC; varying float vT; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC * vT, a * vT); }`,
        vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = -1; this.scene.add(p); return p;
    };
    const lowMem = settings.quality === 'low';
    this.starsLayer1 = mk(lowMem ? 2500 : 5000, 2200, 3000, 2.4, false);
    this.starsLayer2 = mk(lowMem ? 2000 : 6000, 2400, 3000, 1.8, true);
    this.starMats = [this.starsLayer1.material, this.starsLayer2.material];

    // Subtle nebula glows for deep-navy / violet ambience
    const neb = (color, pos, scale) => {
      const t = new THREE.CanvasTexture(glowTexture(color, color.replace(/[\d.]+\)$/, '0.12)')));
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 }));
      sp.position.set(...pos); sp.scale.setScalar(scale); this.scene.add(sp);
    };
    neb('rgba(110,70,200,0.5)', [-1500, 500, -1800], 2200);
    neb('rgba(40,90,200,0.45)', [1800, -400, 900], 2000);
    neb('rgba(150,60,170,0.35)', [400, 1400, 1700], 1800);
  }

  _makeBelts() {
    const belt = (n, r0, r1, thick, color, size) => {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = r0 + Math.random() * (r1 - r0); pos.set([Math.cos(a) * r, (Math.random() - 0.5) * thick, Math.sin(a) * r], i * 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: 0.55, depthWrite: false }));
      this.scene.add(p); return p;
    };
    this.asteroidBelt = belt(settings.quality === 'low' ? 900 : 2200, 54, 68, 1.6, 0x9a8f80, 0.16);
    this.kuiperBelt = belt(settings.quality === 'low' ? 700 : 1600, 188, 235, 6, 0x7f8db0, 0.35);
  }

  _makeBody(b) {
    const s = this.scene;
    const pivot = new THREE.Object3D();                 // positioned on its orbit
    const tilt = new THREE.Object3D();                  // axial tilt
    tilt.rotation.z = THREE.MathUtils.degToRad(b.vis.tilt || 0);
    pivot.add(tilt);
    const radius = b.vis.radius;
    const seg = settings.quality === 'low' ? 32 : 64;
    const geo = new THREE.SphereGeometry(radius, seg, seg / 2);
    let mat;
    if (b.id === 'sun') {
      mat = this.sunMat = sunMaterial(this._texture('sun'));
    } else {
      const map = this._texture(b.vis.tex);
      mat = new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0, color: map ? 0xffffff : 0x999999 });
      // surface relief: rocky and icy worlds use their own albedo as a height map (shows up along the terminator)
      const relief = { mercury: 2.2, moon: 2.4, mars: 1.4, phobos: 2, ceres: 2, io: 1.2, europa: 1, ganymede: 1.6, callisto: 2.2, enceladus: 1, triton: 1.2, pluto: 1.2, charon: 1.6 }[b.vis.tex];
      if (relief && map) { mat.bumpMap = map; mat.bumpScale = relief; }
      if (b.id === 'earth') earthMaterial(mat, this.textures.earth);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.id = b.id;
    tilt.add(mesh);

    const entry = { data: b, pivot, tilt, mesh, radius, angle: 0, spin: 0, labelEl: null, extras: [] };

    if (b.id === 'sun') {
      const g1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowTexture()), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      g1.scale.setScalar(radius * 6.5); pivot.add(g1);
      const g2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowTexture('rgba(255,250,230,0.9)', 'rgba(255,200,120,0.25)')), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
      g2.scale.setScalar(radius * 3.1); pivot.add(g2);
      entry.glows = [g1, g2];
    }
    if (b.id === 'earth') {
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.015, seg, seg / 2), new THREE.MeshStandardMaterial({ map: this._texture('earthClouds'), transparent: true, depthWrite: false, roughness: 1 }));
      tilt.add(clouds); entry.clouds = clouds;
    }
    const atmos = { earth: [0x4fa3ff, 1.09, 1.2], venus: [0xffd9a0, 1.08, 0.9], mars: [0xff9a6a, 1.05, 0.45], titan: [0xffb060, 1.12, 1], uranus: [0x9ff0ff, 1.06, 0.6], neptune: [0x5a8cff, 1.06, 0.7], jupiter: [0xffe0b0, 1.03, 0.35], saturn: [0xffe6b0, 1.03, 0.35] }[b.id];
    if (atmos) tilt.add(this._atmosphere(radius * atmos[1], atmos[0], atmos[2]));

    if (b.id === 'saturn') {
      const inner = radius * 1.24, outer = radius * 2.3;
      const rg = new THREE.RingGeometry(inner, outer, 128, 1);
      const uv = rg.attributes.uv, p = rg.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5); }
      const rt = new THREE.CanvasTexture(ringTexture()); rt.colorSpace = THREE.SRGBColorSpace;
      const ring = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1, alphaTest: 0.02 }));
      ring.rotation.x = -Math.PI / 2; tilt.add(ring); entry.ring = ring;
    }
    if (b.id === 'uranus') {
      const rg = new THREE.RingGeometry(radius * 1.6, radius * 2.0, 96);
      const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0x9fb8c8, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; tilt.add(ring);
    }

    // Halo used for hover/selection glow
    const halo = this._atmosphere(radius * 1.25, 0x7aa8ff, 0);
    tilt.add(halo); entry.halo = halo;

    // Orbit line
    let orbitParent = s;
    if (b.type === 'moon') { const par = this.bodies.get(b.parent); orbitParent = par.pivot; }
    if (b.vis.dist > 0) {
      const pts = []; const N = 256;
      for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * b.vis.dist, 0, Math.sin(a) * b.vis.dist)); }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: b.type === 'moon' ? 0x6f7cb8 : 0x4f6ad8, transparent: true, opacity: b.type === 'moon' ? 0.28 : 0.32, depthWrite: false }));
      orbitParent.add(line); entry.orbitLine = line;
    }
    orbitParent.add(pivot);
    this.bodies.set(b.id, entry);
  }

  _atmosphere(r, color, intensity) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: intensity } },
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uColor; uniform float uI; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.6); gl_FragColor = vec4(uColor, f * uI); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide
    });
    return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), m);
  }

  // ---------------- Controls ----------------
  _initControls() {
    const c = this.canvas;
    this.pointers = new Map();
    this.gesture = null;
    c.addEventListener('contextmenu', e => e.preventDefault());
    c.addEventListener('pointerdown', e => this._pDown(e));
    window.addEventListener('pointermove', e => this._pMove(e));
    window.addEventListener('pointerup', e => this._pUp(e));
    window.addEventListener('pointercancel', e => this._pUp(e));
    c.addEventListener('wheel', e => { e.preventDefault(); this.zoomBy(Math.exp(Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120) * 0.0018)); }, { passive: false });
    c.addEventListener('pointerleave', () => this._setHover(null));
  }
  _pDown(e) {
    if (!this.active) return;
    c_focus(this.canvas);
    this.canvas.setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), button: e.button, type: e.pointerType });
    if (this.pointers.size === 1) this.gesture = { moved: 0, mode: (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'rotate' };
    else if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; this.gesture = { moved: 99, mode: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; }
  }
  _pMove(e) {
    if (!this.active) return;
    const p = this.pointers.get(e.pointerId);
    if (!p) { if (e.pointerType === 'mouse' && e.target === this.canvas) this._hoverAt(e.clientX, e.clientY); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    const g = this.gesture; if (!g) return;
    if (g.mode === 'pinch' && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (g.dist > 0 && Math.abs(dist - g.dist) > 0.5) { this.zoomBy(g.dist / dist); }
      const pdx = mx - g.mx, pdy = my - g.my;
      if (Math.abs(pdx) + Math.abs(pdy) > 0.5) this.panBy(pdx, pdy);
      g.dist = dist; g.mx = mx; g.my = my; return;
    }
    g.moved += Math.abs(dx) + Math.abs(dy);
    if (g.moved < 4) return;
    if (g.mode === 'rotate') this.rotateBy(dx, dy); else this.panBy(dx, dy);
  }
  _pUp(e) {
    const p = this.pointers.get(e.pointerId); if (!p) return;
    this.pointers.delete(e.pointerId);
    const g = this.gesture;
    if (g && g.mode !== 'pinch' && g.moved < 6 && performance.now() - p.t < 600 && this.pointers.size === 0) this._clickAt(e.clientX, e.clientY);
    if (this.pointers.size === 0) this.gesture = null;
    else if (this.pointers.size === 1) { this.gesture = { moved: 99, mode: 'rotate' }; }
  }
  rotateBy(dx, dy) {
    const cam = this.cam; cam.theta -= dx * 0.006; cam.phi = THREE.MathUtils.clamp(cam.phi - dy * 0.005, 0.08, Math.PI - 0.08);
    this._emitOnce('cam:rotate');
  }
  panBy(dx, dy) {
    const cam = this.cam; this._breakFollow();
    const f = cam.radius * 0.0016;
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
    cam.target.addScaledVector(right, -dx * f).addScaledVector(up, dy * f);
    this._emitOnce('cam:pan');
  }
  zoomBy(k) {
    const cam = this.cam;
    const min = cam.follow ? this.bodies.get(cam.follow).radius * 1.8 : 0.6;
    cam.radius = THREE.MathUtils.clamp(cam.radius * k, min, 700);
    if (cam.tween) cam.tween.toR = THREE.MathUtils.clamp(cam.tween.toR * k, min, 700);
    this._emitOnce('cam:zoom');
  }
  _emitOnce(evt) {
    const now = performance.now(); this._last = this._last || {};
    if (now - (this._last[evt] || 0) < 400) return; this._last[evt] = now;
    gameEvent(evt);
  }
  _breakFollow() { if (this.cam.follow || this.cam.tween) { this.cam.follow = null; this.cam.tween = null; } }

  // Screen-space picking: generous hit areas so small or distant worlds are easy to tap.
  _pickAt(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    let best = null, bestD = Infinity;
    const tmp = new THREE.Vector3();
    for (const [id, e] of this.bodies) {
      if (!this._isPickable(e)) continue;
      e.mesh.getWorldPosition(tmp);
      const dist = tmp.distanceTo(this.camera.position);
      const p = tmp.clone().project(this.camera); if (p.z > 1) continue;
      const sx = (p.x + 1) / 2 * rect.width + rect.left, sy = (1 - p.y) / 2 * rect.height + rect.top;
      const pr = e.radius / (dist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) * rect.height / 2;
      const hit = Math.max(16, pr * 1.15);
      const d = Math.hypot(sx - x, sy - y);
      if (d < hit && d - pr < bestD) { bestD = d - pr; best = id; }
    }
    return best;
  }
  _isPickable(e) {
    if (e.data.type !== 'moon') return true;
    const par = this.bodies.get(e.data.parent); const tmp = new THREE.Vector3(); par.mesh.getWorldPosition(tmp);
    return tmp.distanceTo(this.camera.position) < 60 || this.selected === e.data.id;
  }
  _clickAt(x, y) { const id = this._pickAt(x, y); if (id) this.select(id); }
  _hoverAt(x, y) {
    const now = performance.now(); if (now - (this._hoverT || 0) < 50) return; this._hoverT = now;
    this._setHover(this._pickAt(x, y));
  }
  _setHover(id) {
    if (this.hovered === id) return; this.hovered = id;
    this.canvas.style.cursor = id ? 'pointer' : 'grab';
    bus.emit('hover', id);
  }

  // ---------------- Public API ----------------
  select(id, { silent } = {}) {
    if (!this.bodies.has(id)) return;
    this.selected = id;
    if (!silent) { gameEvent('select', { id }); bus.emit('sfx', 'select'); }
    bus.emit('selected', BODY_MAP[id]);
  }
  deselect() { this.selected = null; bus.emit('selected', null); }
  focus(id = this.selected, { duration = 1.4, radius } = {}) {
    if (!id || !this.bodies.has(id)) return;
    const e = this.bodies.get(id);
    const toR = radius || Math.max(e.radius * 5.5, e.data.id === 'sun' ? 30 : 2.2);
    // Approach from the sunlit side so the day side faces the camera
    let toTheta = null;
    if (id !== 'sun') {
      const p = this.worldPos(id); const sunTheta = Math.atan2(-p.x, -p.z) + 0.55;
      let d = sunTheta - this.cam.theta; d = Math.atan2(Math.sin(d), Math.cos(d)); toTheta = this.cam.theta + d;
    }
    this.cam.tween = { id, from: this.cam.target.clone(), fromR: this.cam.radius, toR, t: 0, dur: settings.reducedMotion ? 0.01 : duration, fromTheta: this.cam.theta, toTheta, phi: id === 'sun' ? null : 1.2 };
    this.cam.follow = null;
  }
  overview() {
    this.cam.follow = null;
    this.cam.tween = { id: null, to: new THREE.Vector3(), from: this.cam.target.clone(), fromR: this.cam.radius, toR: 300, t: 0, dur: settings.reducedMotion ? 0.01 : 1.4, phi: 0.25 };
  }
  cinematicIntro(id = 'earth') {
    this.cam.radius = 520; this.cam.phi = 0.5; this.cam.theta = -0.4; this.cam.target.set(0, 0, 0);
    this.focus(id, { duration: settings.reducedMotion ? 0.01 : 3.2 });
  }
  togglePause(force) {
    this.paused = typeof force === 'boolean' ? force : !this.paused;
    gameEvent('sim:pause'); bus.emit('time', this.timeInfo());
  }
  changeSpeed(d) {
    const i = THREE.MathUtils.clamp(this.speedIndex + d, 0, SPEEDS.length - 1);
    if (i !== this.speedIndex) { this.speedIndex = i; gameEvent('speed:change'); }
    bus.emit('time', this.timeInfo());
  }
  timeInfo() { return { paused: this.paused, daysPerSec: SPEEDS[this.speedIndex], date: new Date(J2000 + this.simDays * 86400000) }; }
  setOrbitsVisible(v) { for (const e of this.bodies.values()) if (e.orbitLine) e.orbitLine.visible = v; }
  worldPos(id, out = new THREE.Vector3()) { const e = this.bodies.get(id); if (!e) return null; return e.mesh.getWorldPosition(out); }
  project(id) {
    const p = this.worldPos(id); if (!p) return null;
    const v = p.clone().project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    const behind = v.z > 1;
    return { x: (v.x + 1) / 2 * rect.width, y: (1 - v.y) / 2 * rect.height, behind, w: rect.width, h: rect.height };
  }
  orbitalAngle(id) { const e = this.bodies.get(id); return e ? e.angle : 0; }
  setActive(a) { this.active = a; if (a) this.clock.getDelta(); }

  // ---------------- Frame loop ----------------
  _loop() {
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (!this.active || document.hidden) return;
    this._fps(dt);
    if (!this.paused) this.simDays += dt * SPEEDS[this.speedIndex];
    this._updateBodies(dt);
    this._updateMovement(dt);
    this._updateCamera(dt);
    this._updateMarkers();
    const t = performance.now() / 1000;
    for (const m of this.starMats) m.uniforms.uTime.value = t;
    if (this.asteroidBelt && !this.paused) { this.asteroidBelt.rotation.y += dt * 0.004 * SPEEDS[this.speedIndex] / 5; this.kuiperBelt.rotation.y += dt * 0.0006 * SPEEDS[this.speedIndex] / 5; }
    this.renderer.render(this.scene, this.camera);
    bus.emit('frame', dt);
  }
  _fps(dt) {
    if (settings.quality !== 'auto') return;
    this.frameTimes.push(dt); if (this.frameTimes.length < 180) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length; this.frameTimes = [];
    const pr = this.renderer.getPixelRatio();
    if (avg > 1 / 40 && pr > 1) { this.renderer.setPixelRatio(Math.max(1, pr - 0.25)); }
  }
  _updateBodies(dt) {
    const days = this.simDays, spd = this.paused ? 0 : SPEEDS[this.speedIndex];
    for (const [id, e] of this.bodies) {
      const b = e.data;
      if (b.type === 'moon') {
        const realRate = (2 * Math.PI) / b.orbit.periodDays * spd; // rad per second of play
        const capped = Math.sign(realRate) * Math.min(Math.abs(realRate), MAX_MOON);
        e.angle += capped * dt;
        e.pivot.position.set(Math.cos(e.angle) * b.vis.dist, 0, -Math.sin(e.angle) * b.vis.dist);
      } else if (b.orbit) {
        e.angle = THREE.MathUtils.degToRad(b.orbit.L0 + 360 * days / b.orbit.periodDays);
        e.pivot.position.set(Math.cos(e.angle) * b.vis.dist, 0, -Math.sin(e.angle) * b.vis.dist);
      }
      const spin = (2 * Math.PI) / (b.rotationHours / 24) * spd;
      e.mesh.rotation.y += Math.sign(spin) * Math.min(Math.abs(spin), MAX_SPIN) * dt;
      if (e.clouds) e.clouds.rotation.y += Math.sign(spin) * Math.min(Math.abs(spin), MAX_SPIN) * dt * 1.15 + dt * 0.01;
      const hl = (id === this.selected) ? 0.9 : (id === this.hovered ? 0.6 : 0);
      const u = e.halo.material.uniforms.uI; u.value += (hl - u.value) * Math.min(1, dt * 8);
    }
    if (this.sunMat && !settings.reducedMotion) this.sunMat.uniforms.uT.value += dt;
    const sun = this.bodies.get('sun');
    if (sun.glows && !settings.reducedMotion) { const t = performance.now() / 1000; sun.glows[0].scale.setScalar(sun.radius * (6.5 + Math.sin(t * 0.8) * 0.25)); }
  }
  _updateMovement(dt) {
    const k = this.keys; let fx = 0, fz = 0, rot = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) fz += 1; if (k.has('KeyS') || k.has('ArrowDown')) fz -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) fx -= 1; if (k.has('KeyD') || k.has('ArrowRight')) fx += 1;
    if (k.has('KeyQ')) rot += 1; if (k.has('KeyE')) rot -= 1;
    fx += this.joy.x; fz += -this.joy.y;
    if (rot) { this.cam.theta += rot * dt * 1.2; this._emitOnce('cam:rotate'); }
    if (!fx && !fz) return;
    const boost = (k.has('ShiftLeft') || k.has('ShiftRight')) ? 3 : (k.has('ControlLeft') || k.has('ControlRight')) ? 0.3 : 1;
    this._breakFollow();
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd); fwd.y = 0; if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const sp = Math.max(4, this.cam.radius * 0.9) * boost * dt;
    this.cam.target.addScaledVector(fwd, fz * sp).addScaledVector(right, fx * sp);
    if (this.cam.target.length() > 400) this.cam.target.setLength(400);
    this._usedMove = true;
    this._emitOnce('cam:move');
  }
  _updateCamera(dt) {
    const cam = this.cam;
    if (cam.tween) {
      const tw = cam.tween; tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = tw.t < 0.5 ? 4 * tw.t ** 3 : 1 - Math.pow(-2 * tw.t + 2, 3) / 2;
      const to = tw.id ? this.worldPos(tw.id) : tw.to;
      cam.target.lerpVectors(tw.from, to, e);
      cam.radius = tw.fromR + (tw.toR - tw.fromR) * e;
      if (tw.phi != null) cam.phi += (tw.phi - cam.phi) * Math.min(1, dt * 3);
      if (tw.toTheta != null) cam.theta = tw.fromTheta + (tw.toTheta - tw.fromTheta) * e;
      if (tw.t >= 1) {
        cam.tween = null;
        if (tw.id) { cam.follow = tw.id; gameEvent('arrive', { id: tw.id }); bus.emit('arrived', tw.id); bus.emit('sfx', 'arrive'); }
      }
    } else if (cam.follow) {
      cam.target.copy(this.worldPos(cam.follow));
    }
    const sp = Math.sin(cam.phi);
    this.camera.position.set(cam.target.x + cam.radius * sp * Math.sin(cam.theta), cam.target.y + cam.radius * Math.cos(cam.phi), cam.target.z + cam.radius * sp * Math.cos(cam.theta));
    this.camera.lookAt(cam.target);
    this.camera.updateMatrixWorld();
  }
  _updateMarkers() {
    const place = (ring, id, scaleK) => {
      if (!id) { ring.visible = false; return; }
      const e = this.bodies.get(id); const p = this.worldPos(id);
      ring.visible = true; ring.position.copy(p); ring.quaternion.copy(this.camera.quaternion);
      const minScreen = p.distanceTo(this.camera.position) * 0.018;
      ring.scale.setScalar(Math.max(e.radius * scaleK, minScreen));
    };
    place(this.reticle, this.selected, 1.25);
    if (this.selected) this.reticle.rotation.z = 0;
    place(this.hoverRing, this.hovered !== this.selected ? this.hovered : null, 1.2);
    for (const e of this.bodies.values()) if (e.orbitLine) e.orbitLine.material.opacity = (e.data.id === this.selected ? 0.75 : (e.data.type === 'moon' ? 0.28 : 0.32));
  }
}

function c_focus(el) { try { el.focus({ preventScroll: true }); } catch {} }

// ---------------- Special materials ----------------
// The Sun: granulation that boils slowly, brighter active regions and limb darkening (the edge of the disc is redder and dimmer).
function sunMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: map }, uT: { value: 0 } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main(){ vP = position; vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uT; varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      float hs(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hs(i), hs(i + vec3(1,0,0)), f.x), mix(hs(i + vec3(0,1,0)), hs(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hs(i + vec3(0,0,1)), hs(i + vec3(1,0,1)), f.x), mix(hs(i + vec3(0,1,1)), hs(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.07 + vec3(3.1, 1.7, 2.3); a *= 0.5; } return s; }
      void main(){
        vec3 p = normalize(vP);
        float gran = fbm(p * 26.0 + vec3(uT * 0.06, -uT * 0.04, uT * 0.05));
        float cells = fbm(p * 7.0 - vec3(0.0, uT * 0.012, 0.0));
        float act = smoothstep(0.58, 0.75, fbm(p * 2.2 + vec3(5.0, uT * 0.004, 1.0)));
        vec3 base = texture2D(uMap, vUv).rgb;
        float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
        float limb = 0.3 + 0.7 * pow(mu, 0.55);
        vec3 col = base * (0.7 + 0.6 * gran) * (0.85 + 0.3 * cells) * (1.0 + 0.35 * act);
        col *= mix(vec3(1.0, 0.55, 0.25), vec3(1.0), smoothstep(0.0, 0.6, mu)) * limb;
        gl_FragColor = vec4(col * 1.35, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}
// Earth: oceans are glossy (you see the Sun's glint on them) and city lights glow on the night side.
function earthMaterial(mat, src) {
  if (!src) return;
  const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const rough = document.createElement('canvas'), lights = document.createElement('canvas'); rough.width = lights.width = w; rough.height = lights.height = h;
  const ri = rough.getContext('2d').createImageData(w, h), li = lights.getContext('2d').createImageData(w, h);
  let sd = 9; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const ocean = b > r + 25 && b > g, ice = r > 215 && g > 215;
    const v = ocean ? 105 : 255; ri.data.set([v, v, v, 255], i * 4);
    let L = 0;
    if (!ocean && !ice) {
      const lon = (i % w) / w * Math.PI * 2, lat = (0.5 - (i / w | 0) / h) * Math.PI, cl = Math.cos(lat);
      const x = cl * Math.cos(lon), y = Math.sin(lat), z = cl * Math.sin(lon);
      const pop = fbm(x * 5 + 3, y * 5, z * 5, 77, 4) * (Math.abs(lat) < 1.15 ? 1 : 0) * (r > 170 && g > 140 ? 0.4 : 1); // few people in deserts and polar regions
      if (pop > 0.5) { const k = rnd(); L = k > 0.45 ? (60 + (pop - 0.5) * 1500) * (0.5 + rnd() * 0.5) : 0; }
    }
    L = Math.min(255, L);
    li.data.set([L, L * 0.75, L * 0.4, 255], i * 4);
  }
  rough.getContext('2d').putImageData(ri, 0, 0); lights.getContext('2d').putImageData(li, 0, 0);
  mat.roughnessMap = new THREE.CanvasTexture(rough); mat.roughness = 1;
  mat.emissiveMap = new THREE.CanvasTexture(lights); mat.emissiveMap.colorSpace = THREE.SRGBColorSpace; mat.emissive = new THREE.Color(1, 0.85, 0.6); mat.emissiveIntensity = 1.2;
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#ifdef USE_EMISSIVEMAP
      vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
      float night = 1.0;
      #if NUM_POINT_LIGHTS > 0
        night = 1.0 - smoothstep(-0.12, 0.08, dot(normal, normalize(pointLights[0].position + vViewPosition)));
      #endif
      totalEmissiveRadiance *= emissiveColor.rgb * night;
    #endif`);
  };
}
