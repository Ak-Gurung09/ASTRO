// ASTRO LAB Career — a rotatable 3D brain and nervous system in its own small viewer (drag / swipe to turn, tap a part to learn about it).
// Every space-health topic is tagged "Confirmed risk" or "Still being researched". Not medical advice.
import * as THREE from '../../../vendor/three.module.js';
import { h, openModal } from '../../ui/dom.js';
import { settings } from '../../systems/core.js';

export const PARTS = {
  frontal: { name: 'Frontal lobe', col: 0x6aa8ff, does: 'Planning, decisions, attention and controlling movement.', space: 'Astronauts sometimes report "space fog": slower attention in the first weeks. Studies so far show small, mostly temporary changes.', tag: 'research' },
  parietal: { name: 'Parietal lobe', col: 0x7ad8a0, does: 'Touch, body position and knowing where things are around you.', space: 'In weightlessness, the brain re-maps where "down" is and where your limbs are. It adapts in days, and must adapt back on Earth.', tag: 'confirmed' },
  temporal: { name: 'Temporal lobe', col: 0xffc857, does: 'Hearing, memory and language.', space: 'Space radiation could affect memory over long missions. This is mainly known from animal studies.', tag: 'research' },
  occipital: { name: 'Occipital lobe', col: 0xff8a6a, does: 'Vision: turns signals from the eyes into pictures.', space: 'Many astronauts on long missions develop swelling at the back of the eye and changes in vision (SANS, spaceflight associated neuro-ocular syndrome).', tag: 'confirmed' },
  cerebellum: { name: 'Cerebellum', col: 0xd08aff, does: 'Balance, coordination and smooth movement.', space: 'Works with the inner ear. After landing, astronauts can feel dizzy and walk unsteadily for days while balance recovers.', tag: 'confirmed' },
  stem: { name: 'Brainstem', col: 0xc8c8d0, does: 'Breathing, heart rate, swallowing and sleep cycles.', space: 'Without day and night, sleep is often disturbed. Station lighting is tuned to help the body clock.', tag: 'confirmed' },
  ear: { name: 'Inner ear (vestibular system)', col: 0x5ad8ff, does: 'Senses head turning and gravity, so you keep your balance.', space: 'In the first days of weightlessness, mixed signals between eyes and inner ear cause space motion sickness in about half of astronauts.', tag: 'confirmed' },
  fluid: { name: 'Fluid shift and brain position', col: 0x3a8ad8, does: 'On Earth, gravity pulls body fluids towards your feet.', space: 'In space, fluids move towards the head. MRI scans show the brain shifts slightly upward in the skull and fluid spaces grow. What this means long-term is still being studied.', tag: 'research' },
  cord: { name: 'Spinal cord and nerves', col: 0xf2f2f2, does: 'Carries messages between the brain and the body.', space: 'Without gravity squeezing it, the spine lengthens: astronauts grow up to about 3 cm taller in space, and back pain is common.', tag: 'confirmed' }
};
export const TAGS = { confirmed: ['✅ Confirmed risk', 'good'], research: ['🔬 Still being researched', 'warn'] };

function buildModel() {
  const g = new THREE.Group(), mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, emissive: c, emissiveIntensity: 0.12 });
  const lobe = (id, sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), mat(PARTS[id].col)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.userData.part = id; g.add(m); return m; };
  for (const s of [-1, 1]) {
    lobe('frontal', 0.55, 0.62, 0.75, s * 0.42, 0.25, 0.55); lobe('parietal', 0.55, 0.58, 0.6, s * 0.42, 0.45, -0.25);
    lobe('temporal', 0.32, 0.36, 0.7, s * 0.72, -0.2, 0.15); lobe('occipital', 0.48, 0.5, 0.45, s * 0.36, 0.1, -0.85);
    const ear = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 16), mat(PARTS.ear.col)); ear.position.set(s * 1.05, -0.3, -0.05); ear.rotation.y = Math.PI / 2; ear.userData.part = 'ear'; g.add(ear);
  }
  lobe('cerebellum', 0.62, 0.32, 0.38, 0, -0.42, -0.85);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.8, 14), mat(PARTS.stem.col)); stem.position.set(0, -0.75, -0.35); stem.rotation.x = 0.25; stem.userData.part = 'stem'; g.add(stem);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 2.2, 10), mat(PARTS.cord.col)); cord.position.set(0, -2.2, -0.5); cord.userData.part = 'cord'; g.add(cord);
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.9, 6), mat(PARTS.cord.col)); n.position.set(s * 0.4, -1.4 - i * 0.24, -0.5); n.rotation.z = s * 1.1; n.userData.part = 'cord'; g.add(n); }
  const fluid = new THREE.Mesh(new THREE.SphereGeometry(1.3, 24, 16), new THREE.MeshStandardMaterial({ color: PARTS.fluid.col, transparent: true, opacity: 0.12, depthWrite: false })); fluid.scale.set(0.95, 0.85, 1.15); fluid.position.y = 0.05; fluid.userData.part = 'fluid'; fluid.renderOrder = 2; g.add(fluid);
  return g;
}

// Opens the viewer. onSeen(partId) is called the first time each part is examined. Resolves when closed.
export function openBrainViewer({ onSeen } = {}) {
  return new Promise(resolve => {
    const canvas = h('canvas', { class: 'cx-brain-cv', 'aria-label': '3D brain model. Drag to rotate, tap a part to learn about it.' });
    const info = h('div', { class: 'cx-brain-info', 'aria-live': 'polite' }, h('p', {}, 'Drag to turn the model. Tap or click a coloured part to learn about it.'));
    const list = h('div', { class: 'cx-brain-list' }, Object.entries(PARTS).map(([id, p]) => h('button', { class: 'btn sm', onclick: () => show(id) }, p.name)));
    const seen = new Set();
    let alive = true;
    const m = openModal({ title: '🧠 Brain and nervous system in space', label: 'Brain viewer', wide: true, cls: 'cx-brain-modal', onClose: () => { alive = false; R.dispose(); resolve([...seen]); },
      body: h('div', {}, h('div', { class: 'cx-brain' }, canvas, info), list, h('p', { class: 'muted tiny' }, '⚠ For learning only. This is not medical advice.')) });
    const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); R.setPixelRatio(Math.min(2, devicePixelRatio));
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50); cam.position.set(0, 0, 6.5);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 1.4)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(3, 4, 5); scene.add(dl);
    const model = buildModel(); model.position.y = 0.5; scene.add(model);
    let yaw = 0.6, pitch = 0.15, drag = null, auto = !settings.reducedMotion, sel = null;
    const size = () => { const w = canvas.clientWidth || 400, hh = canvas.clientHeight || 300; R.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); };
    function show(id) {
      const p = PARTS[id], [t, cls] = TAGS[p.tag]; if (!seen.has(id)) { seen.add(id); onSeen?.(id); }
      info.innerHTML = `<h4>${p.name}</h4><p><b>What it does:</b> ${p.does}</p><p><b>In space:</b> ${p.space}</p><span class="cx-tag ${cls}">${t}</span><p class="muted tiny">${seen.size} of ${Object.keys(PARTS).length} parts examined</p>`;
      sel = id; model.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = o.userData.part === id ? 0.7 : 0.08; });
    }
    const ray = new THREE.Raycaster();
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; auto = false; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; yaw += dx * 0.01; pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.01)); });
    canvas.addEventListener('pointerup', e => {
      if (drag && drag.moved < 6) { const r = canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam); const hits = ray.intersectObject(model, true).filter(x => x.object.userData.part); const hit = hits.find(x => x.object.userData.part !== 'fluid') || hits[0]; if (hit) show(hit.object.userData.part); }
      drag = null;
    });
    canvas.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') yaw -= 0.2; if (e.key === 'ArrowRight') yaw += 0.2; if (e.key === 'ArrowUp') pitch -= 0.2; if (e.key === 'ArrowDown') pitch += 0.2; }); canvas.tabIndex = 0;
    const loop = () => { if (!alive) return; size(); if (auto) yaw += 0.004; model.rotation.set(pitch, yaw, 0); R.render(scene, cam); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    m.viewer = { show, seen };
  });
}
