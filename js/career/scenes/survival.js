// ASTRO LAB Career — Training 8: Survival and Teamwork. The capsule "lands" off-course in the desert training ground.
// With two crewmates you must look after an injury, build shade, signal for rescue and share the water, listening to each other.
import * as THREE from '../../../vendor/three.module.js';
import { MAT } from '../models/materials.js';
import { makeSign } from '../models/props.js';
import { std, box, cyl } from '../models/house.js';
import { makePerson, animatePerson } from '../models/humans.js';
import { LOOKS } from '../data/people.js';
import { makeUsable } from '../engine/interact.js';
import { timer, finishExercise, floorMark, invisibleMark } from './kit.js';
import { pickOne } from '../ui/panels.js';

export default {
  id: 'survival', title: 'Survival and Teamwork', music: 'centre', ambience: 'outdoor',
  steps: [
    { id: 'brief', text: 'Talk to your crew by the capsule' },
    { id: 'plan', text: 'Agree the first priorities with your crew' },
    { id: 'aid', text: 'Bring the first-aid kit to Tomas and help with his ankle' },
    { id: 'shade', text: 'Build shade: two poles and the parachute at the shelter marks' },
    { id: 'signal', text: 'Lay the signal panel in the open and switch on the rescue beacon' },
    { id: 'water', text: 'Agree how to share the water' },
    { id: 'rescue', text: 'Wait in the shade for the rescue helicopter' }
  ],
  initialState: { steps: {}, mistakes: [], shelter: {}, beacon: false, panel: false },

  async build(ctx) {
    const { scene, world, player, carry, ix, hud, sfx, state } = ctx;
    scene.background = new THREE.Color(0xbfdcf2); scene.fog = new THREE.Fog(0xe8d8b8, 30, 120);
    scene.add(new THREE.HemisphereLight(0xe8f4ff, 0xc8a070, 1.0));
    const sun = world.shadowLight(new THREE.DirectionalLight(0xfff0d0, 2.6)); sun.position.set(12, 30, 8); scene.add(sun, sun.target);
    const sandT = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#d9b77e'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { x.fillStyle = `rgba(${150 + Math.random() * 80},${110 + Math.random() * 60},${60 + Math.random() * 40},.5)`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 1); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), std(0xffffff, { map: sandT, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 40 + Math.random() * 30; const d = new THREE.Mesh(new THREE.SphereGeometry(8 + Math.random() * 10, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xcfa66a, { roughness: 1 })); d.scale.y = 0.35; d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); scene.add(d); }
    for (let i = 0; i < 25; i++) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.25), std(0x8a7a5a)); b.position.set((Math.random() - 0.5) * 30, 0.1, (Math.random() - 0.5) * 30); if (Math.hypot(b.position.x, b.position.z) > 4) scene.add(b); }
    player.bounds = null; player.addBox(-14, -13.8, -14, 14, 0, 3); player.addBox(13.8, 14, -14, 14, 0, 3); player.addBox(-14, 14, -14, -13.8, 0, 3); player.addBox(-14, 14, 13.8, 14, 0, 3);
    // the capsule (training mock-up), lying on its side, and its parachute
    const cap = new THREE.Group(); const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.0, 2.4, 24), std(0xe8ebf0, { roughness: 0.5 })); cone.rotation.z = Math.PI / 2 - 0.25; cap.add(cone);
    const heat = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.02, 0.2, 24), std(0x5a3a28, { roughness: 0.9 })); heat.position.x = -1.2; heat.rotation.z = Math.PI / 2 - 0.25; cap.add(heat);
    const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), std(0x3a3f4a)); hatch.position.set(0.2, 0.6, 1.62); cap.add(hatch);
    cap.position.set(-2, 1.4, -5); scene.add(cap); cap.traverse(o => { if (o.isMesh) o.castShadow = true; }); player.addBox(-3.6, -0.6, -6.8, -3.2, 0, 3);
    const T = timer(ctx, 360);
    // crew
    const priya = makePerson(LOOKS.crewA), tomas = makePerson(LOOKS.crewB);
    priya.root.position.set(0.6, 0, -2.6); priya.root.rotation.y = 2.6; tomas.root.position.set(-3.6, 0, -2.4); tomas.root.rotation.y = 0.8; scene.add(priya.root, tomas.root);
    player.addBox(0.35, 0.85, -2.85, -2.35, 0, 1.8); player.addBox(-3.85, -3.35, -2.65, -2.15, 0, 1.8);
    tomas.root.position.y = -0.45;
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), std(0xffffff)); ankle.position.set(0.1, 0.55, 0.2); ankle.visible = ctx.isDone('aid'); tomas.root.add(ankle);
    // carriables: first-aid kit, two poles, parachute, signal panel
    const kit = new THREE.Group(); box(0.34, 0.22, 0.2, std(0xffffff), 0, 0.11, 0, kit); box(0.12, 0.03, 0.01, std(0xc8202a), 0, 0.12, 0.105, kit); box(0.03, 0.12, 0.01, std(0xc8202a), 0, 0.12, 0.106, kit); kit.position.set(-0.3, 0, -3.6); scene.add(kit);
    carry.makeCarriable(kit, { id: 'aidkit', name: 'First-aid kit' });
    const pole = i => { const g = new THREE.Group(); cyl(0.03, 0.03, 1.8, std(0x9aa3b2), 0, 0.9, 0, g, 8); g.rotation.z = 0; g.position.set(-4.6 + i * 0.4, 0, -4.4); scene.add(g); carry.makeCarriable(g, { id: 'pole', name: 'Tent pole' }); return g; };
    const poles = [pole(0), pole(1)]; poles.forEach(p => { p.rotation.x = Math.PI / 2; p.position.y = 0.05; });
    const chute = new THREE.Group(); const cm = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), std(0xd96a2a, { roughness: 0.9 })); cm.scale.y = 0.45; chute.add(cm); chute.position.set(1.2, 0.15, -6.2); scene.add(chute);
    carry.makeCarriable(chute, { id: 'chute', name: 'Parachute (folded)' });
    const panel = new THREE.Group(); box(0.6, 0.06, 0.4, std(0xff6a1a), 0, 0.03, 0, panel); panel.position.set(-1.0, 0, -6.6); scene.add(panel);
    carry.makeCarriable(panel, { id: 'panel', name: 'Signal panel (bright orange)' });
    const beacon = new THREE.Group(); box(0.24, 0.3, 0.16, std(0xf2b632), 0, 0.15, 0, beacon); cyl(0.01, 0.01, 0.5, MAT.metal(), 0.08, 0.5, 0, beacon, 6); const bl = box(0.05, 0.05, 0.02, MAT.glow(0x444444, 0.2), -0.05, 0.22, 0.09, beacon); beacon.position.set(-3.0, 0, -3.4); scene.add(beacon);
    // shelter site and signal spot
    const SH = new THREE.Vector3(3.5, 0, 0.5);
    const site = floorMark(scene, SH.x, SH.z, 2.6, 2.2, 0xf2b632); site.material.opacity = 0.35;
    const shSign = makeSign('SHELTER', 'Poles + parachute', 1.1); shSign.position.set(SH.x, 1.0, SH.z - 1.3); scene.add(shSign);
    const sockFor = (key, x, z, accepts, label) => { const s = invisibleMark(scene, x, 0.4, z); s.scale.set(2, 2.6, 2); carry.makeSocket(s, { accepts, label, lock: true, onPlace: o => placeShelter(key, o) }); return s; };
    const poleA = sockFor('a', SH.x - 1.1, SH.z - 0.8, 'pole', 'Pole mark A'), poleB = sockFor('b', SH.x + 1.1, SH.z - 0.8, 'pole', 'Pole mark B');
    const roofS = sockFor('roof', SH.x, SH.z, 'chute', 'Shelter roof');
    roofS.userData.socket.check = () => state.shelter.a && state.shelter.b ? { ok: true } : { ok: false, msg: 'Put both poles up first.' };
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.4, 6, 4), std(0xd96a2a, { roughness: 0.9, side: THREE.DoubleSide })); roof.rotation.x = -Math.PI / 2 + 0.25; roof.position.set(SH.x, 1.6, SH.z); roof.visible = false; roof.castShadow = true; scene.add(roof);
    function placeShelter(key, o) {
      state.shelter[key] = true;
      if (key === 'roof') { o.visible = false; roof.visible = true; } else { o.rotation.set(0, 0, 0); o.position.y = 0; }
      if (state.shelter.a && state.shelter.b && state.shelter.roof) { ctx.done('shade'); hud.flash('Shade built! The ground under it is about 15 °C cooler.', 'good'); }
    }
    const sigSpot = floorMark(scene, 7, -7, 1.6, 1.6, 0xffffff); sigSpot.material.opacity = 0.25;
    const sigSock = invisibleMark(scene, 7, 0.15, -7); sigSock.scale.set(4, 1, 4);
    carry.makeSocket(sigSock, { accepts: 'panel', label: 'Open ground', lock: true, onPlace: () => { state.panel = true; checkSignal(); } });
    makeUsable(beacon, { label: 'Rescue beacon', verb: 'Switch on', range: 2.2, enabled: () => !state.beacon, use: () => { state.beacon = true; bl.material.color.set(0xff3030); bl.material.emissive.set(0xff3030); bl.material.emissiveIntensity = 2; sfx.ui(); hud.cap('[Beep: the beacon starts sending your position by satellite]', 2500); checkSignal(); } }); ix.add(beacon);
    function checkSignal() { if (state.panel && state.beacon) { ctx.done('signal'); hud.flash('Signal ready: the beacon sends your position, the panel helps pilots see you.', 'good'); } }
    // restore after a reload
    const lockAt = (o, x, z, y = 0) => { o.position.set(x, y, z); o.rotation.set(0, 0, 0); o.userData.locked = true; };
    if (state.shelter.a) { lockAt(poles[0], SH.x - 1.1, SH.z - 0.8); poleA.userData.filled = poles[0]; }
    if (state.shelter.b) { lockAt(poles[1], SH.x + 1.1, SH.z - 0.8); poleB.userData.filled = poles[1]; }
    if (state.shelter.roof) { chute.visible = false; chute.userData.locked = true; roof.visible = true; }
    if (state.panel) { lockAt(panel, 7, -7, 0.01); sigSock.userData.filled = panel; }
    if (state.beacon) { bl.material.color.set(0xff3030); bl.material.emissive.set(0xff3030); bl.material.emissiveIntensity = 2; }
    if (ctx.isDone('aid')) { kit.visible = false; kit.userData.locked = true; }
    // talking to the crew
    const crewTalk = async (who) => {
      if (!ctx.isDone('brief')) return ctx.talk([
        { who: 'Priya', text: 'Okay, {name}. Training scenario: our capsule came down 200 km off target, in the desert. Rescue is coming, but it could take a few hours.' },
        { who: 'Tomas', text: 'And in the scenario I twisted my ankle getting out. Ow. Very realistic.' },
        { who: 'Priya', text: 'Commander Arden is watching from the tower. She wants to see us work as a team. Let\'s decide what to do first.', do: () => { if (ctx.done('brief')) T.start(); } }]);
      if (!ctx.isDone('plan')) return plan();
      if (!ctx.isDone('aid') && who === 'Tomas' && carry.held === kit) return aid();
      if (ctx.isDone('signal') && ctx.isDone('shade') && !ctx.isDone('water')) return water();
      const tips = { aid: 'Tomas: The first-aid kit is by the capsule hatch. A bandage and some shade and I\'ll be fine.', shade: 'Priya: Two poles first, then the parachute over the top. Shade is the best way to save water out here.', signal: 'Priya: Panel out in the open, where it can be seen from the air, and switch the beacon on.', water: 'Priya: Let\'s talk about the water.', rescue: 'Tomas: Stay in the shade. Listen for the helicopter.' };
      const cur = ctx.current()?.id; return ctx.talk([{ who: (tips[cur] || '').split(':')[0] || who, text: (tips[cur] || 'We\'re doing fine.').split(': ').slice(1).join(': ') || 'We\'re doing fine.' }]);
    };
    async function plan() {
      ctx.input.releaseLock();
      const first = await pickOne({ title: '🧭 What do we do first?', cancel: false, intro: 'Priya: "We have 6 litres of water, a first-aid kit, the parachute and a rescue beacon. It\'s 38 °C. What\'s our first job?"', options: [
        { id: 'aid', icon: '🩹', name: 'Check everyone is okay and treat Tomas\'s ankle' }, { id: 'walk', icon: '🚶', name: 'Walk towards the nearest town for help' }, { id: 'drink', icon: '💧', name: 'Drink as much water as we can now' }, { id: 'wait', icon: '🛰', name: 'Sit in the capsule and wait' }] });
      if (first !== 'aid') {
        const why = { walk: 'Priya: "Walking in this heat with an injured crewmate? Rescuers search for the capsule, not for people wandering off. We stay together and stay put."', drink: 'Tomas: "Drinking it all now won\'t help later. We should drink normally and keep cool so we sweat less."', wait: 'Priya: "The capsule is an oven in the sun. It could get above 50 °C in there."' }[first];
        ctx.mistake('Chose a risky first priority.'); await ctx.talk([{ who: 'Crew', text: why }]);
      }
      await ctx.talk([{ who: 'Priya', text: 'Okay: first aid for Tomas, then shade, then signals so they can find us. Agreed?', choices: [{ text: 'Agreed. Priya, can you check the beacon manual while I get the kit?', goto: 'team' }, { text: 'I\'ll do everything myself, it\'s faster.', goto: 'solo' }] },
        { id: 'solo', who: 'Tomas', text: 'Hey, we\'re a crew. Nobody survives a long mission alone. Give people jobs.', do: () => ctx.mistake('Tried to do everything alone instead of sharing the work.'), goto: 'ok' },
        { id: 'team', who: 'Priya', text: 'On it. Good call: two jobs at once.' },
        { id: 'ok', who: 'Priya', text: 'Let\'s go.', do: () => ctx.done('plan') }]);
    }
    async function aid() {
      carry.held.visible = false; carry.held.userData.locked = true; carry.held = null; ankle.visible = true;
      await ctx.talk([{ who: 'Tomas', text: 'Thanks. Wrap it firmly but not too tight, and I\'ll keep it raised in the shade. Rest, Ice, Compression, Elevation. No ice here though!' }]);
      ctx.done('aid');
    }
    async function water() {
      ctx.input.releaseLock();
      const pick = await pickOne({ title: '💧 Share the water', cancel: false, intro: '6 litres, three people, rescue in a few hours. Tomas is injured. What\'s the plan?', options: [
        { id: 'fair', icon: '⚖', name: 'Everyone drinks small amounts often, Tomas a bit more because he\'s injured' }, { id: 'save', icon: '🚫', name: 'Nobody drinks until rescue arrives' }, { id: 'me', icon: '🙋', name: 'I carry it and decide who drinks' }] });
      if (pick !== 'fair') { ctx.mistake(pick === 'save' ? 'Planned to ration water to zero, which risks heat illness.' : 'Took control of the water without the crew agreeing.'); await ctx.talk([{ who: 'Priya', text: pick === 'save' ? 'Not drinking at all is dangerous: dehydration hits fast in this heat. Small sips, often.' : 'Let\'s decide together. Trust matters as much as water.' }]); }
      await ctx.talk([{ who: 'Tomas', text: 'Deal. Small sips, stay in the shade, don\'t waste energy.', do: () => { ctx.done('water'); heli.start = true; } }]);
    }
    const crewUse = (rig, name) => { makeUsable(rig.root, { label: name, verb: 'Talk to', range: 3, use: () => crewTalk(name) }); ix.add(rig.root); };
    crewUse(priya, 'Priya'); crewUse(tomas, 'Tomas');
    // the rescue helicopter
    const heli = { start: ctx.isDone('water'), t: 0, g: new THREE.Group() };
    box(3, 1.2, 1.2, std(0xd9dce2), 0, 0, 0, heli.g); box(3.6, 0.2, 0.3, std(0xd9dce2), -2.8, 0.2, 0, heli.g); const rotor = box(7, 0.04, 0.2, std(0x2a2d33), 0, 0.8, 0, heli.g);
    heli.g.position.set(-80, 25, -60); heli.g.visible = false; scene.add(heli.g);
    return {
      spawn: [1.6, 0.6, Math.PI * 0.85, 0],
      markerFor: id => ({ brief: priya.root, plan: priya.root, aid: carry.held === kit ? tomas.root : kit, shade: !state.shelter.a || !state.shelter.b ? (carry.held?.userData.carry.id === 'pole' ? (state.shelter.a ? poleB : poleA) : poles.find(p => !p.userData.locked)) : carry.held === chute ? roofS : chute, signal: !state.panel ? (carry.held === panel ? sigSock : panel) : beacon, water: priya.root, rescue: roof }[id] || null),
      onEnter: () => { if (!ctx.isDone('brief')) hud.flash('Talk to your crew by the capsule.', '', 3500); },
      update(dt, blocked) {
        T.update(dt, blocked);
        const cam = world.camera.position;
        animatePerson(priya, dt, { lookAt: cam.distanceTo(priya.root.position) < 8 ? cam : null, talking: ctx.dlg.active && /Priya/.test(ctx.dlg.el.querySelector('.cx-who')?.textContent || '') });
        animatePerson(tomas, dt, { lookAt: cam.distanceTo(tomas.root.position) < 8 ? cam : null, talking: ctx.dlg.active && /Tomas/.test(ctx.dlg.el.querySelector('.cx-who')?.textContent || '') });
        if (heli.start && !ctx.isDone('rescue')) {
          heli.g.visible = true; heli.t += blocked ? 0 : dt; rotor.rotation.y += dt * 30;
          const k = Math.min(1, heli.t / 14); heli.g.position.set(-80 + (SH.x + 8 + 80) * k, 25 - 20 * k * k, -60 + (SH.z - 6 + 60) * k);
          if ((heli.t % 0.5) < dt) hud.cap('[Thwop-thwop-thwop: helicopter approaching]', 600);
          const inShade = Math.hypot(player.pos.x - SH.x, player.pos.z - SH.z) < 1.8;
          if (k >= 1 && !this._landed) { this._landed = true; if (!inShade) hud.flash('The helicopter is here. Get back to your crew in the shade!', '', 3000); }
          if (k >= 1 && inShade) { ctx.done('rescue'); finish(); }
        }
      }
    };
    function finish() {
      finishExercise(ctx, { id: 'survival', title: 'Survival and Teamwork', timer: T, xp: 160,
        science: 'Capsules can land off-target, so astronauts train for survival in deserts, forests, snow and water. The rules are similar everywhere: look after injuries, protect yourselves from heat or cold, make it easy to be found and share resources fairly. Teamwork is trained as seriously as technical skills: space agencies teach "expedition behaviour", which means communicating clearly, sharing jobs and looking after each other.' });
    }
  }
};
