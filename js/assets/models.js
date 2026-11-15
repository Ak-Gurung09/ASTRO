// ASTRO LAB — imported 3D models (GLB files in models/).
// Every procedural model stays as the fallback: a scene builds it as before, and when the matching GLB has loaded the
// imported model is swapped in (procedural meshes hidden, gameplay groups such as doors, rotors and joints kept).
// If a file is missing or fails to load (for example index.html opened from disk, where browsers block fetch), nothing
// is swapped and the game looks exactly as it did. astro-lab-standalone.html embeds the files so it works offline too.
import * as THREE from '../../vendor/three.module.js';
import { GLTFLoader } from '../../vendor/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/addons/libs/meshopt_decoder.module.js';
import { clone as skeletonClone } from '../../vendor/addons/utils/SkeletonUtils.js';

// key -> file, and how it is used. Edit this table to change which model replaces what.
export const MODEL_FILES = {
  // people (rigged models follow the game's own animation: sit, walk, wave, give, look, hold head)
  businessman: 'businessman.glb', // Bug (dad)                      rigged
  saree: 'saree.glb',             // Cat (mum)                      rigged
  teenboy: 'teenboy.glb',         // Tomas (survival crew)          rigged
  housewife: 'housewife.glb',     // Registrar Kim                  static statue
  mancasual: 'mancasual.glb',     // Officer Hale (security guard)  static statue
  schoolgirl: 'schoolgirl.glb',   // Priya (survival crew)          static statue
  astronaut: 'astronaut.glb',     // Surface Expeditions astronaut  rigged
  // vehicles, buildings, props
  car: 'car.glb', helicopter: 'helicopter.glb', nasa: 'nasa.glb', greenhouse: 'greenhouse.glb', tent: 'tent.glb',
  alarmclock: 'alarmclock.glb', bulletin: 'bulletin.glb',
  // greenhouse crops
  lettuce: 'lettuce.glb', wheat: 'wheat.glb', tomato: 'tomato.glb', potatoplants: 'potatoplants.glb', potato: 'potato.glb'
};
// Which story character uses which person model (keys of career/data/people.js LOOKS)
export const PERSON_MODELS = { bug: 'businessman', cat: 'saree', crewB: 'teenboy', registrar: 'housewife', guard: 'mancasual', crewA: 'schoolgirl' };

let base = 'models/';
const cache = new Map();      // key -> { status: 'loading'|'ready'|'failed', gltf, promise, waiters: [] }
let loader = null;
const getLoader = () => loader || (loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder));
const embedded = () => (typeof window !== 'undefined' && window.__ASTRO_MODELS) || null;
const b64ToBuf = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
export const modelsDisabled = () => { try { return typeof location !== 'undefined' && /[?&]nomodels\b/.test(location.search); } catch { return false; } };

export function setModelBase(b) { base = b; }

export function loadModel(key) {
  let e = cache.get(key); if (e) return e.promise;
  e = { status: 'loading', gltf: null, waiters: [] }; cache.set(key, e);
  const file = MODEL_FILES[key];
  e.promise = (async () => {
    if (!file || modelsDisabled() || typeof document === 'undefined') throw new Error('model unavailable: ' + key);
    await MeshoptDecoder.ready;
    const emb = embedded()?.[key];
    const gltf = emb ? await getLoader().parseAsync(b64ToBuf(emb), '') : await getLoader().loadAsync(base + file);
    gltf.scene.updateMatrixWorld(true);
    return gltf;
  })().then(g => { e.status = 'ready'; e.gltf = g; for (const w of e.waiters.splice(0)) { try { w(g); } catch (err) { console.warn('[models] swap failed for', key, err); } } return g; },
    err => { e.status = 'failed'; e.waiters.length = 0; console.info('[models] using the built-in model for', key, '(' + (err?.message || err) + ')'); return null; });
  return e.promise;
}
export function preloadModels(keys = Object.keys(MODEL_FILES)) { return Promise.all(keys.map(loadModel)); }
export function modelReady(key) { return cache.get(key)?.status === 'ready'; }

// Run cb(gltf) now if the model is loaded, or later when it finishes loading. Nothing happens if it fails.
export function whenModel(key, cb) {
  const e = cache.get(key) || (loadModel(key), cache.get(key));
  if (e.status === 'ready') { try { cb(e.gltf); } catch (err) { console.warn('[models] swap failed for', key, err); } }
  else if (e.status === 'loading') e.waiters.push(cb);
}

// A fresh copy of a loaded model's scene (skinned meshes get their own skeleton). Materials are shared.
export function instance(gltf) {
  const o = skeletonClone(gltf.scene);
  o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = !m.isSkinnedMesh; } });
  return o;
}

// Fit an object into a holder: rotate it (Y, radians), scale it uniformly so one dimension matches, and sit it on y=0
// centred on x/z. by: 'height' | 'length' (largest of x/z) | 'x' | 'z' | 'max'. Returns the holder group.
const _b = new THREE.Box3(), _s = new THREE.Vector3(), _c = new THREE.Vector3();
export function fit(obj, { size, by = 'height', rotY = 0, center = true, ground = true } = {}) {
  const holder = new THREE.Group(); holder.name = 'imported-model';
  const pivot = new THREE.Group(); pivot.rotation.y = rotY; holder.add(pivot); pivot.add(obj);
  holder.updateMatrixWorld(true); _b.setFromObject(obj, true); _b.getSize(_s);
  const cur = by === 'height' ? _s.y : by === 'x' ? _s.x : by === 'z' ? _s.z : by === 'length' ? Math.max(_s.x, _s.z) : Math.max(_s.x, _s.y, _s.z);
  const k = cur > 1e-6 ? size / cur : 1; pivot.scale.setScalar(k);
  holder.updateMatrixWorld(true); _b.setFromObject(obj, true); _b.getCenter(_c);
  if (center) { pivot.position.x -= _c.x; pivot.position.z -= _c.z; }
  if (ground) pivot.position.y -= _b.min.y;
  else if (center) pivot.position.y -= _c.y;
  return holder;
}

// Hide the procedural meshes of a group (keeping the objects listed in keep, and everything below them, visible).
export function hideProcedural(group, keep = []) {
  const keepSet = new Set(); for (const k of keep) k?.traverse(o => keepSet.add(o));
  const hidden = [];
  group.traverse(o => { if ((o.isMesh || o.isLine || o.isPoints) && !keepSet.has(o) && o.visible && o.name !== 'imported-model' && !o.userData.importedPart) { o.visible = false; hidden.push(o); } });
  return hidden;
}
// Mark every node of an imported holder so later hideProcedural calls leave it alone.
export const markImported = holder => { holder.traverse(o => { o.userData.importedPart = true; }); return holder; };

// Simple swap: when key is loaded, hide group's procedural meshes (except keep) and add the fitted model.
export function swapModel(group, key, fitOpts, { keep = [], after } = {}) {
  whenModel(key, gltf => {
    const holder = markImported(fit(instance(gltf), fitOpts));
    hideProcedural(group, typeof keep === 'function' ? keep() : keep);
    group.add(holder); group.userData.imported = holder;
    after?.(holder, gltf);
  });
  return group;
}

// ---------------------------------------------------------------------------------------------------------------
// Retargeting: drive a skinned model's bones from a procedural rig's joint groups, by direction.
// Each segment pairs a procedural joint (whose limb hangs along local -Y, or points along +Y for torso/neck/head)
// with a bone. Every frame the bone is rotated so its rest direction (towards its child, or "up") and its rest facing
// match the procedural joint's direction and facing. This works whatever axis conventions the model's rig uses.
const norm = n => n.toLowerCase().replace(/^mixamorig[:_]?/, '').replace(/\d+$/, '').replace(/[\s.]/g, '');
const SEG_PATTERNS = {
  hips: [/^(center|hips|hip|pelvis|root_?hips?)$/],
  neck: [/^neck(twist)?$/],
  head: [/^head$/],
  upperArm: [/^(left|right|l_?|r_?)(arm|upperarm)$/],
  foreArm: [/^(left|right|l_?|r_?)(forearm|elbow)$/],
  hand: [/^(left|right|l_?|r_?)(hand|wrist)$/],
  thigh: [/^(left|right|l_?|r_?)(upleg|thigh)$/],
  calf: [/^(left|right|l_?|r_?)(leg|calf|knee|shin)$/],
  finger: [/^(left|right|l_?|r_?)(handmiddle|mid|middle_?)$/],
  foot: [/^(left|right|l_?|r_?)(foot|ankle)$/]
};
const sideOf = n => /^(left|l_?)[a-z]/.test(n) && !/^(leg|lower)/.test(n) ? 'L' : /^(right|r_?)[a-z]/.test(n) ? 'R' : '';
function findBones(root) {
  const out = {}; const depth = new Map();
  root.traverse(o => { let d = 0, p = o; while (p.parent) { d++; p = p.parent; } depth.set(o, d); });
  root.traverse(o => {
    if (!(o.isBone || o.type === 'Object3D' || o.isGroup)) return; if (o.isMesh) return;
    const n = norm(o.name || ''); if (!n) return;
    for (const [seg, pats] of Object.entries(SEG_PATTERNS)) {
      if (!pats.some(p => p.test(n))) continue;
      if (seg === 'calf' && /upleg/.test(n)) continue;
      const key = ['hips', 'neck', 'head'].includes(seg) ? seg : seg + sideOf(n);
      if (key === seg && !['hips', 'neck', 'head'].includes(seg)) continue;
      if (!out[key] || depth.get(o) < depth.get(out[key])) out[key] = o;
    }
  });
  return out;
}

const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4();
const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
// world quaternion that maps local basis (a, b) onto world basis (A, B)
function basisQuat(a, b, A, B, out) {
  const a1 = a.clone().normalize(), b1 = b.clone().sub(a1.clone().multiplyScalar(b.dot(a1))).normalize(), c1 = new THREE.Vector3().crossVectors(a1, b1);
  const A1 = A.clone().normalize(), B1 = B.clone().sub(A1.clone().multiplyScalar(B.dot(A1))); if (B1.lengthSq() < 1e-8) return null; B1.normalize();
  const C1 = new THREE.Vector3().crossVectors(A1, B1);
  tmpM.makeBasis(a1, b1, c1); tmpM2.makeBasis(A1, B1, C1); tmpM2.multiply(tmpM.transpose());
  return out.setFromRotationMatrix(tmpM2);
}

// procSegs: { hips, neck, head, upperArmL, foreArmL, handL, thighL, calfL, ...R } -> procedural Object3D joints
// procFwd: +1 if the procedural rig faces its local +Z, -1 if it faces -Z. modelFwd: the model's facing in its own space.
export function makeRetarget(modelRoot, procRoot, procSegs, { procFwd = 1, modelFwd = new THREE.Vector3(0, 0, 1), hipsFrom = procSegs.hips } = {}) {
  const bones = findBones(modelRoot);
  if (!bones.hips || !(bones.upperArmL || bones.thighL)) return null;
  procRoot.updateMatrixWorld(true); modelRoot.updateMatrixWorld(true);
  // pair model L/R with procedural sides by where they sit relative to the procedural root
  const sideMap = {};
  for (const s of ['L', 'R']) {
    const b = bones['upperArm' + s] || bones['thigh' + s]; if (!b) continue;
    const x = procRoot.worldToLocal(b.getWorldPosition(tmpV)).x;
    for (const ps of ['L', 'R']) { const pj = procSegs['upperArm' + ps] || procSegs['thigh' + ps]; if (!pj) continue; const px = procRoot.worldToLocal(pj.getWorldPosition(tmpV2)).x; if (Math.sign(px) === Math.sign(x)) sideMap[s] = ps; }
  }
  const worldFwd = modelFwd.clone().transformDirection(modelRoot.matrixWorld);
  const worldUp = new THREE.Vector3(0, 1, 0);
  const segs = [];
  const add = (boneKey, procKey, mode, tipBone) => {
    const bone = bones[boneKey], proc = procSegs[procKey]; if (!bone || !proc) return;
    const inv = bone.getWorldQuaternion(new THREE.Quaternion()).invert();
    let restDir;
    if (mode === 'up' || !tipBone) restDir = worldUp.clone().applyQuaternion(inv);
    else restDir = tipBone.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).applyQuaternion(inv);
    if (mode === 'down' && !tipBone) restDir.negate();
    const restFwd = worldFwd.clone().applyQuaternion(inv);
    segs.push({ bone, proc, mode, restDir, restFwd, bind: bone.quaternion.clone() });
  };
  add('hips', 'hips', 'up');
  add('neck', 'neck', 'up');
  add('head', 'head', 'up');
  for (const s of ['L', 'R']) {
    const ps = sideMap[s] || s;
    add('upperArm' + s, 'upperArm' + ps, 'down', bones['foreArm' + s]);
    add('foreArm' + s, 'foreArm' + ps, 'down', bones['hand' + s]);
    add('hand' + s, 'hand' + ps, 'down', bones['finger' + s]);
    add('thigh' + s, 'thigh' + ps, 'down', bones['calf' + s]);
    add('calf' + s, 'calf' + ps, 'down', null);
  }
  // calves point at the foot/ankle bone (or keep the straight-down guess)
  for (const sg of segs) for (const s of ['L', 'R']) if (sg.bone === bones['calf' + s] && bones['foot' + s]) {
    const inv = sg.bone.getWorldQuaternion(new THREE.Quaternion()).invert();
    sg.restDir = bones['foot' + s].getWorldPosition(new THREE.Vector3()).sub(sg.bone.getWorldPosition(new THREE.Vector3())).applyQuaternion(inv);
  }
  const hipsBone = bones.hips, hipsBindPos = hipsBone.position.clone();
  const hipsRestModel = modelRoot.worldToLocal(hipsBone.getWorldPosition(new THREE.Vector3()));
  const procRest = procRoot.worldToLocal(hipsFrom.getWorldPosition(new THREE.Vector3()));
  const target = new THREE.Vector3(), D = new THREE.Vector3(), F = new THREE.Vector3(), q = new THREE.Quaternion(), pq = new THREE.Quaternion();
  return {
    bones,
    update() {
      procRoot.updateMatrixWorld(true);
      // hips follow the procedural pelvis (sitting, crouching, bobbing): same world offset from its rest place
      hipsBone.position.copy(hipsBindPos);
      const delta = hipsFrom.getWorldPosition(tmpV).sub(procRoot.localToWorld(tmpV2.copy(procRest)));
      modelRoot.updateMatrixWorld(true);
      target.copy(hipsRestModel); modelRoot.localToWorld(target).add(delta);
      hipsBone.parent.updateMatrixWorld(true); hipsBone.parent.worldToLocal(target); hipsBone.position.copy(target);
      for (const s of segs) s.bone.quaternion.copy(s.bind);
      for (const s of segs) {
        s.bone.parent.updateMatrixWorld(true);
        const pw = s.proc.matrixWorld.elements;
        X.set(pw[0], pw[1], pw[2]); Y.set(pw[4], pw[5], pw[6]); Z.set(pw[8], pw[9], pw[10]);
        D.copy(Y).normalize(); if (s.mode === 'down') D.negate();
        F.copy(Z).normalize().multiplyScalar(procFwd);
        if (!basisQuat(s.restDir, s.restFwd, D, F, q)) continue;
        s.bone.parent.getWorldQuaternion(pq).invert();
        s.bone.quaternion.copy(pq.multiply(q));
        s.bone.updateMatrixWorld(true);
      }
    }
  };
}
void tmpQ; void tmpQ2;
