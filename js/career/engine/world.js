// ASTRO LAB Career — renderer, quality tiers and the frame loop for first-person scenes.
import * as THREE from '../../../vendor/three.module.js';
import { settings, bus } from '../../systems/core.js';

export const QUALITY = {
  low: { pr: 1, shadows: false, shadowSize: 0, aa: false },
  medium: { pr: 1.25, shadows: true, shadowSize: 1024, aa: false },
  high: { pr: 1.75, shadows: true, shadowSize: 2048, aa: true },
  ultra: { pr: 2.5, shadows: true, shadowSize: 4096, aa: true }
};
export function qualityTier() {
  const q = settings.quality;
  if (QUALITY[q]) return q;
  const mobile = matchMedia('(max-width: 720px)').matches || document.body.classList.contains('touch');
  return mobile ? 'medium' : 'high';
}

export class World {
  constructor(root) {
    this.root = root; this.tier = qualityTier(); const Q = QUALITY[this.tier];
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: Q.aa, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, Q.pr));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = Q.shadows; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.className = 'cx-canvas'; r.domElement.tabIndex = 0; r.domElement.setAttribute('aria-label', '3D view. Click to look around with the mouse.');
    root.prepend(r.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400); this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    // First-person layer (hands and the held item): drawn after the world with a cleared depth buffer,
    // so it can never clip into walls or props (see engine/layers.js and docs/RENDER-LAYERS.md).
    this.fpScene = new THREE.Scene(); this.fpRoot = new THREE.Group(); this.fpScene.add(this.fpRoot);
    this.fpScene.add(new THREE.HemisphereLight(0xf4f6ff, 0x50545e, 1.6));
    const fpKey = new THREE.DirectionalLight(0xffffff, 1.6); fpKey.position.set(0.4, 1, 0.6); this.fpRoot.add(fpKey); this.fpRoot.add(fpKey.target); fpKey.target.position.set(0, 0, -1);
    r.autoClear = false;
    this.resize(); this._onResize = () => this.resize(); addEventListener('resize', this._onResize);
    this.updaters = new Set(); this.running = false; this.fpsT = 0; this.fpsN = 0; this.autoDropped = false;
    this._onQ = s => { if (s.quality !== this._lastQ) { this._lastQ = s.quality; this.applyQuality(); } }; this._lastQ = settings.quality;
    this._offQ = bus.on('settings', this._onQ);
    r.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); if (this.disposed) return; bus.emit('toast', { icon: '⚠️', title: 'Graphics paused', text: 'The 3D view lost its graphics context. Reload if it does not come back.' }); });
  }
  applyQuality() {
    this.tier = qualityTier(); const Q = QUALITY[this.tier];
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.pr));
    this.renderer.shadowMap.enabled = Q.shadows;
    this.scene.traverse(o => { if (o.isLight && o.shadow && o.userData.shadowLight) { o.castShadow = Q.shadows; o.shadow.mapSize.set(Q.shadowSize || 512, Q.shadowSize || 512); o.shadow.map?.dispose(); o.shadow.map = null; } if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
    this.resize();
  }
  shadowLight(light) { const Q = QUALITY[this.tier]; light.userData.shadowLight = true; light.castShadow = Q.shadows; light.shadow.mapSize.set(Q.shadowSize || 512, Q.shadowSize || 512); light.shadow.bias = -0.0005; light.shadow.normalBias = 0.02; return light; }
  resize() {
    const w = this.root.clientWidth || innerWidth, hh = this.root.clientHeight || innerHeight;
    this.renderer.setSize(w, hh, false); this.camera.aspect = w / hh;
    this.camera.fov = w < hh ? 80 : 70; this.camera.updateProjectionMatrix();
  }
  start() {
    if (this.running) return; this.running = true; this.last = performance.now();
    const loop = now => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      for (const fn of this.updaters) { try { fn(dt); } catch (e) { console.error('[career]', e); } }
      this.render();
      this.watchFps(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }
  render() {
    const r = this.renderer; r.clear();
    r.render(this.scene, this.camera);
    if (this.fpVisible()) { this.syncFP(); r.clearDepth(); r.render(this.fpScene, this.camera); }
  }
  // The first-person root follows the camera exactly
  syncFP() { this.camera.updateMatrixWorld(); this.fpRoot.matrixAutoUpdate = false; this.fpRoot.matrix.copy(this.camera.matrixWorld); this.fpRoot.updateMatrixWorld(true); }
  fpVisible() { let v = false; this.fpRoot.traverseVisible(o => { if (o.isMesh) v = true; }); return v; }
  // Auto quality: if the frame rate stays under 40 fps for 4 s, drop one tier (only when quality is Auto)
  watchFps(dt) {
    if (settings.quality !== 'auto' || this.autoDropped) return;
    this.fpsT += dt; this.fpsN++;
    if (this.fpsT > 4) { const fps = this.fpsN / this.fpsT; this.fpsT = 0; this.fpsN = 0; if (fps < 40 && this.tier !== 'low') { this.autoDropped = true; const pr = Math.max(1, this.renderer.getPixelRatio() * 0.75); this.renderer.setPixelRatio(pr); this.resize(); } }
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  dispose() {
    this.disposed = true; this.stop(); this._offQ?.(); removeEventListener('resize', this._onResize);
    [this.scene, this.fpScene].forEach(sc => sc.traverse(o => { o.geometry?.dispose?.(); [].concat(o.material || []).forEach(m => { for (const k in m) if (m[k]?.isTexture) m[k].dispose(); m.dispose?.(); }); }));
    this.renderer.dispose(); this.renderer.forceContextLoss?.(); this.renderer.domElement.remove();
  }
}
