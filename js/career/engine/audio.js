// ASTRO LAB Career — procedural music, ambience and world sound effects (WebAudio, no audio files).
import { settings, bus } from '../../systems/core.js';
import { audioCtx } from '../../ui/dom.js';

let musicBus = null, sfxBus = null, ambBus = null, musicOn = false, chordTimer = null, voices = [], ambNodes = [];
function buses() {
  const a = audioCtx(); if (!a) return null;
  if (!musicBus) {
    musicBus = a.createGain(); musicBus.connect(a.destination);
    sfxBus = a.createGain(); sfxBus.connect(a.destination);
    ambBus = a.createGain(); ambBus.connect(a.destination);
    applyVolumes();
  }
  if (a.state === 'suspended') a.resume().catch(() => {});
  return a;
}
export function applyVolumes() {
  if (!musicBus) return;
  const a = audioCtx(), t = a.currentTime;
  musicBus.gain.setTargetAtTime((settings.musicVol ?? 0.5) * 0.22, t, 0.2);
  sfxBus.gain.setTargetAtTime(settings.sound === false ? 0 : (settings.sfxVol ?? 0.8), t, 0.05);
  ambBus.gain.setTargetAtTime(settings.sound === false ? 0 : (settings.sfxVol ?? 0.8) * 0.5, t, 0.2);
}
bus.on('settings', applyVolumes);

// ---- Music: a slow, warm generative pad (four chords, soft attack, gentle filter) ----
const MOODS = {
  menu: [[48, 55, 62, 67], [45, 52, 60, 64], [41, 48, 57, 64], [43, 50, 59, 62]],
  home: [[53, 60, 64, 69], [50, 57, 62, 65], [46, 53, 58, 65], [48, 55, 60, 64]],
  centre: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 62], [45, 52, 57, 61]]
};
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
export function playMusic(mood = 'menu') {
  const a = buses(); if (!a) return;
  if (musicOn === mood) return;
  stopMusic(); musicOn = mood;
  const chords = MOODS[mood] || MOODS.menu; let i = 0;
  const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 0.4; filt.connect(musicBus);
  const play = () => {
    const t = a.currentTime, ch = chords[i++ % chords.length];
    for (const v of voices) { try { v.g.gain.setTargetAtTime(0, t, 1.2); v.o.stop(t + 5); } catch {} }
    voices = ch.map((m, k) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = k === 0 ? 'sine' : 'triangle'; o.frequency.value = hz(m); o.detune.value = (k - 1.5) * 4;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(k === 0 ? 0.32 : 0.16, t + 2.5);
      o.connect(g).connect(filt); o.start(t); return { o, g };
    });
    // a sparse bell note on top
    if (Math.random() < 0.7) {
      const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = hz(ch[1 + (i % 3)] + 12);
      const t2 = t + 1 + Math.random() * 3; g.gain.setValueAtTime(0, t2); g.gain.linearRampToValueAtTime(0.08, t2 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t2 + 3);
      o.connect(g).connect(filt); o.start(t2); o.stop(t2 + 3.1);
    }
  };
  play(); chordTimer = setInterval(play, 7000);
  voices.filter = filt;
}
export function stopMusic() {
  clearInterval(chordTimer); chordTimer = null; musicOn = false;
  const a = audioCtx(); if (!a) return;
  for (const v of voices) { try { v.g.gain.setTargetAtTime(0, a.currentTime, 0.5); v.o.stop(a.currentTime + 3); } catch {} }
  voices = [];
}

// ---- Ambience: filtered noise (air handling / room tone) ----
let noiseBuf = null;
function noise(a) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
let ambTimers = [];
export function playAmbience(kind = 'room') {
  const a = buses(); if (!a) return;
  stopAmbience();
  const src = a.createBufferSource(); src.buffer = noise(a); src.loop = true;
  const f = a.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.value = { vent: 600, car: 180, outdoor: 900, home: 220 }[kind] || 260;
  const g = a.createGain(); g.gain.value = { vent: 0.12, car: 0.22, outdoor: 0.05, home: 0.04 }[kind] || 0.06;
  src.connect(f).connect(g).connect(ambBus); src.start();
  ambNodes = [src];
  if (kind === 'room' || kind === 'vent') { const hum = a.createOscillator(), hg = a.createGain(); hum.frequency.value = 60; hg.gain.value = 0.012; hum.connect(hg).connect(ambBus); hum.start(); ambNodes.push(hum); }
  if (kind === 'car') { // engine: a low hum that wavers a little
    const o = a.createOscillator(), og = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = 'sawtooth'; o.frequency.value = 42; og.gain.value = 0.018; lfo.frequency.value = 0.3; lg.gain.value = 3;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
    lfo.connect(lg).connect(o.frequency); o.connect(lp).connect(og).connect(ambBus); o.start(); lfo.start(); ambNodes.push(o, lfo);
    // gentle wind over the car body
    const w = a.createBufferSource(); w.buffer = noise(a); w.loop = true; const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.6; const wg = a.createGain(); wg.gain.value = 0.02; w.connect(bp).connect(wg).connect(ambBus); w.start(0, 0.7); ambNodes.push(w);
  }
  if (kind === 'outdoor' || kind === 'home') { // birdsong now and then
    const chirp = () => { const t = a.currentTime; const n = 2 + (Math.random() * 4 | 0), base = 2400 + Math.random() * 1600; for (let i = 0; i < n; i++) blip(a, base, 0.07, 'sine', kind === 'home' ? 0.006 : 0.012, t + i * 0.11, base * 1.3); };
    ambTimers.push(setInterval(() => { if (Math.random() < 0.55) chirp(); }, kind === 'home' ? 3800 : 2200));
  }
}
export function setAmbienceRate(r) { for (const n of ambNodes) if (n.frequency && n.type === 'sawtooth') n.frequency.value = 36 + r * 14; }
export function stopAmbience() { for (const n of ambNodes) { try { n.stop(); } catch {} } ambNodes = []; ambTimers.forEach(clearInterval); ambTimers = []; }

// ---- World sound effects ----
function blip(a, f, d, type, vol, t = a.currentTime, f2 = null, bus = null) {
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(sfxBus); o.start(t); o.stop(t + d + 0.02);
}
function thud(a, vol = 0.25, cutoff = 300, d = 0.12) {
  const src = a.createBufferSource(); src.buffer = noise(a);
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
  const g = a.createGain(), t = a.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(f).connect(g).connect(sfxBus); src.start(t, Math.random()); src.stop(t + d + 0.02);
}
export const sfx = {
  step(surface = 'hard') { const a = buses(); if (a) thud(a, surface === 'carpet' ? 0.08 : 0.14, surface === 'carpet' ? 180 : 420, 0.09); },
  pickup() { const a = buses(); if (a) { thud(a, 0.2, 500, 0.08); blip(a, 520, 0.08, 'triangle', 0.05); } },
  place() { const a = buses(); if (a) { thud(a, 0.35, 260, 0.16); blip(a, 330, 0.12, 'triangle', 0.05, a.currentTime + 0.04); } },
  wrong() { const a = buses(); if (a) blip(a, 200, 0.22, 'sawtooth', 0.05); },
  good() { const a = buses(); if (a) { blip(a, 660, 0.09, 'triangle', 0.06); blip(a, 990, 0.16, 'triangle', 0.06, a.currentTime + 0.08); } },
  door() { const a = buses(); if (a) { thud(a, 0.3, 200, 0.4); blip(a, 120, 0.5, 'sine', 0.04, a.currentTime, 80); } },
  talk() { const a = buses(); if (a) blip(a, 380 + Math.random() * 120, 0.03, 'square', 0.012); },
  ui() { const a = buses(); if (a) blip(a, 880, 0.05, 'sine', 0.04); },
  paper() { const a = buses(); if (a) thud(a, 0.18, 2400, 0.18); },
  horn() { const a = buses(); if (a) { blip(a, 392, 0.35, 'sawtooth', 0.03); blip(a, 494, 0.35, 'sawtooth', 0.025); } },
  carDoor() { const a = buses(); if (a) { thud(a, 0.4, 220, 0.2); blip(a, 90, 0.15, 'sine', 0.05); } },
  knock() { const a = buses(); if (a) for (let i = 0; i < 3; i++) setTimeout(() => thud(a, 0.4, 500, 0.08), i * 180); },
  // Short burst of high hiss (extinguisher spray, steam, air). Call repeatedly while it lasts.
  spray() { const a = buses(); if (a) { const src = a.createBufferSource(); src.buffer = noise(a); const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800; const g = a.createGain(), t = a.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.03); g.gain.linearRampToValueAtTime(0.0001, t + 0.2); src.connect(f).connect(g).connect(sfxBus); src.start(t, Math.random()); src.stop(t + 0.22); } },
  pour() { const a = buses(); if (a) for (let i = 0; i < 6; i++) blip(a, 300 + Math.random() * 500, 0.06, 'sine', 0.025, a.currentTime + i * 0.07, 200 + Math.random() * 300); },
  gulp() { const a = buses(); if (a) for (let i = 0; i < 3; i++) { thud(a, 0.25, 260, 0.1); blip(a, 180, 0.08, 'sine', 0.05, a.currentTime + i * 0.28, 120); } },
  click() { const a = buses(); if (a) { thud(a, 0.2, 2000, 0.03); blip(a, 1400, 0.03, 'square', 0.02); } },
  hum(on = true) { const a = buses(); if (a) blip(a, on ? 110 : 220, 0.4, 'sawtooth', 0.025, a.currentTime, on ? 220 : 90); },
  // Loud, harsh noise (migraine-trigger demo): band-passed noise plus a grinding tone, capped well below the master volume.
  loud(d = 2.5) { const a = buses(); if (!a) return; const t = a.currentTime, src = a.createBufferSource(); src.buffer = noise(a); src.loop = true; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.7; const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.25); g.gain.setValueAtTime(0.16, t + d - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + d); src.connect(f).connect(g).connect(sfxBus); src.start(t); src.stop(t + d + 0.05); blip(a, 140, d, 'sawtooth', 0.05, t, 180); },
  cough() { const a = buses(); if (a) for (let i = 0; i < 2; i++) setTimeout(() => thud(a, 0.3, 900, 0.14), i * 260); },
  alarm() { const a = buses(); if (a) for (let i = 0; i < 3; i++) blip(a, 880, 0.18, 'square', 0.04, a.currentTime + i * 0.3, 660); }
};
