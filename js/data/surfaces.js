// ASTRO LAB — Surface Expeditions data: real gravity, sky geometry and geography for each moon.
//
// Coordinates: metres. +x = east, −z = north, y = up. The lander/landing point is near (0, 0).
// Sizes of named features come from mission data (Apollo surface maps, LRO, Galileo, Cassini,
// Voyager 2, New Horizons, Huygens). Positions of features relative to each other are approximate,
// and small features (boulders, small craters, pebbles) are generated, not mapped.

const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const mix = (a, b, t) => { t = Math.max(0, Math.min(1, t)); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
const C = Object.fromEntries(Object.entries({
  mare: '#5c5a57', mareLight: '#77736d', highland: '#9c9890', highlandLight: '#b9b4ab', ejecta: '#a8a49c', shadowGrey: '#3d3c3a',
  ioYellow: '#d9c45a', ioWhite: '#e8e3c6', ioRed: '#a8452a', ioBlack: '#1d1915', ioOrange: '#c88a3a',
  euIce: '#d9dde0', euBrown: '#8a6a4f', euTan: '#b39a7c',
  gaIce: '#c9c6bf', gaDark: '#6f675d', caDark: '#4a433b', caIce: '#d8d4cc',
  tiSand: '#6e5434', tiPebble: '#b29268', tiDark: '#3f3020',
  enSnow: '#f2f6f8', enBlue: '#b8d0dc', trPink: '#d8c3b8', trDark: '#3a3330', trWhite: '#ece6e0',
  chGrey: '#a5a29e', chDark: '#6f6c69', chRed: '#8a5a48', phDark: '#4f463e', phLight: '#6e6156'
}).map(([k, v]) => [k, hex(v)]));
export const COLORS = C;

// ---------- Bodies (all values real) ----------
export const SURFACE_BODIES = {
  moon: {
    name: 'Moon', g: 1.62, radiusKm: 1737.4, escape: 2380,
    atm: { rho: 0, label: 'None (exosphere ~10⁻¹⁵ bar)' },
    temp: { sun: 'up to +120 °C', shade: 'down to −170 °C' },
    dose: 1.58e-5, doseNote: 'Chang\'e 4 measured ~1.4 mSv per day on the lunar surface (about 200× Earth\'s surface rate).',
    sunAU: 1, sky: 'black', starOpacity: 0.18,
    facts: ['No air means no sound, no wind and no weather — dust kicked up flies in perfect parabolas and falls straight back.', 'You weigh about 1/6 of your Earth weight here (1.62 m/s² vs 9.81 m/s²).', 'Stars are hard to see in daylight: the bright ground and Sun overwhelm your eyes and cameras, which is why Apollo photos show a black, starless sky.']
  },
  io: {
    name: 'Io', g: 1.796, radiusKm: 1821.6, escape: 2558,
    atm: { rho: 0, label: 'Patchy SO₂, ~1 nanobar' },
    temp: { sun: 'about −130 °C (lava up to ~1,600 °C)', shade: 'about −170 °C' },
    dose: 0.4167, doseNote: 'Io sits inside Jupiter\'s radiation belts: about 36 Sv per day — a lethal dose in minutes to hours.',
    sunAU: 5.2, sky: 'black', starOpacity: 0.35,
    facts: ['Io is the most volcanically active world known, with over 400 active volcanoes, heated by tidal squeezing from Jupiter.', 'Its yellows, reds and blacks are different forms of sulfur and sulfur dioxide frost.']
  },
  europa: {
    name: 'Europa', g: 1.315, radiusKm: 1560.8, escape: 2025,
    atm: { rho: 0, label: 'Tenuous oxygen, ~10⁻¹² bar' },
    temp: { sun: 'about −160 °C', shade: 'about −190 °C' },
    dose: 0.0625, doseNote: 'About 5.4 Sv per day at the surface from Jupiter\'s radiation belts.',
    sunAU: 5.2, sky: 'black', starOpacity: 0.35,
    facts: ['Beneath an ice shell probably 15–25 km thick lies a global salty ocean with about twice the water of Earth\'s oceans.', 'NASA\'s Europa Clipper (launched 2024) will fly past about 50 times from 2030.']
  },
  ganymede: {
    name: 'Ganymede', g: 1.428, radiusKm: 2634.1, escape: 2741,
    atm: { rho: 0, label: 'Tenuous oxygen' },
    temp: { sun: 'about −120 °C', shade: 'about −190 °C' },
    dose: 0.00093, doseNote: 'About 80 mSv per day — Ganymede\'s own magnetic field shields part of its surface.',
    sunAU: 5.2, sky: 'black', starOpacity: 0.35,
    facts: ['Ganymede is the largest moon in the solar system — bigger than Mercury.', 'It is the only moon with its own magnetic field, discovered by the Galileo spacecraft in 1996.']
  },
  callisto: {
    name: 'Callisto', g: 1.235, radiusKm: 2410.3, escape: 2440,
    atm: { rho: 0, label: 'Tenuous CO₂ and O₂' },
    temp: { sun: 'about −110 °C', shade: 'about −190 °C' },
    dose: 1.2e-6, doseNote: 'Only ~0.1 mSv per day — Callisto orbits outside Jupiter\'s main radiation belts, so NASA\'s HOPE study (2003) picked it for a future crewed base.',
    sunAU: 5.2, sky: 'black', starOpacity: 0.35,
    facts: ['Callisto has one of the oldest, most heavily cratered surfaces in the solar system.', 'Oddly, it has few small craters: sublimation and slumping seem to erase them, leaving bright icy knobs and dark dust.']
  },
  titan: {
    name: 'Titan', g: 1.352, radiusKm: 2574.7, escape: 2639,
    atm: { rho: 5.4, label: 'Nitrogen + ~5% methane, 1.47 bar (thicker than Earth\'s)' },
    temp: { sun: '−179 °C', shade: '−179 °C' },
    dose: null, sunAU: 9.54, sky: 'titan', starOpacity: 0,
    facts: ['Titan\'s air is 1.5× Earth\'s pressure and 4× as dense — with the low gravity, a person could fly with strapped-on wings.', 'Methane plays the role water does on Earth: it forms clouds, rain, rivers and seas.']
  },
  enceladus: {
    name: 'Enceladus', g: 0.113, radiusKm: 252.1, escape: 239,
    atm: { rho: 0, label: 'Water-vapour plume over the south pole' },
    temp: { sun: 'about −200 °C (up to about −90 °C along the tiger stripes)', shade: 'about −210 °C' },
    dose: null, sunAU: 9.54, sky: 'black', starOpacity: 0.4, jetpack: true,
    facts: ['Over 100 jets along the "tiger stripes" spray water from an underground ocean into space, feeding Saturn\'s E ring.', 'Enceladus reflects about 99% of the sunlight hitting it — the brightest large surface in the solar system.']
  },
  triton: {
    name: 'Triton', g: 0.779, radiusKm: 1353.4, escape: 1455,
    atm: { rho: 0.0001, label: 'Nitrogen, ~14 microbar' },
    temp: { sun: '−235 °C', shade: '−235 °C' },
    dose: null, sunAU: 30.07, sky: 'black', starOpacity: 0.5,
    facts: ['Triton orbits Neptune backwards (retrograde) — it is probably a captured Kuiper Belt object.', 'At −235 °C it is one of the coldest surfaces ever measured, yet Voyager 2 saw geysers erupting in 1989.']
  },
  charon: {
    name: 'Charon', g: 0.288, radiusKm: 606, escape: 590,
    atm: { rho: 0, label: 'None' },
    temp: { sun: 'about −220 °C', shade: 'about −230 °C' },
    dose: null, sunAU: 39.5, sky: 'black', starOpacity: 0.55, jetpack: true,
    facts: ['Charon is half Pluto\'s width; the two are tidally locked to each other, so Pluto never moves in Charon\'s sky.', 'Its reddish north pole, Mordor Macula, is stained by methane that escaped from Pluto and was cooked by sunlight.']
  },
  phobos: {
    name: 'Phobos', g: 0.0057, radiusKm: 11.1, escape: 11.4,
    atm: { rho: 0, label: 'None' },
    temp: { sun: 'about −4 °C', shade: 'about −112 °C' },
    dose: null, sunAU: 1.52, sky: 'black', starOpacity: 0.2, jetpack: true,
    facts: ['Escape velocity is only about 11 m/s (40 km/h) — a hard enough push could send you off into space.', 'Phobos is spiralling inward and will break up or crash into Mars in roughly 30–50 million years.']
  }
};

// ---------- Landing sites ----------
// sun / parent: azimuth (degrees clockwise from north) and elevation (degrees above horizon); ang = angular diameter (degrees).
export const SITES = [
  // ===================== EARTH'S MOON =====================
  {
    id: 'tranquility', body: 'moon', name: 'Tranquility Base', badge: 'moonwalker',
    subtitle: 'Apollo 11 · Mare Tranquillitatis · 0.67°N 23.47°E',
    blurb: 'Where Neil Armstrong and Buzz Aldrin landed on 20 July 1969. A flat, dark basalt plain with Little West and West craters nearby.',
    extent: 700, res: 340, seed: 11,
    sun: { az: 90, el: 14 }, parent: { tex: 'earth', name: 'Earth', ang: 1.9, az: 270, el: 66 },
    spawn: { x: 7, z: 9, yaw: 90 },
    terrain: [
      { t: 'noise', amp: 1.4, scale: 90, oct: 4 },
      { t: 'noise', amp: 0.18, scale: 6, oct: 2 },
      { t: 'crater', x: 60, z: 2, d: 33, depth: 0.16, fresh: 0.6, name: 'Little West crater' },
      { t: 'crater', x: 400, z: 20, d: 185, depth: 0.17, fresh: 1, name: 'West crater' },
      { t: 'crater', x: -150, z: -210, d: 70, depth: 0.08, fresh: 0.1 },
      { t: 'crater', x: -320, z: 160, d: 110, depth: 0.07, fresh: 0.05 },
      { t: 'craterField', n: 220, dMin: 1.5, dMax: 22, seed: 3 },
      { t: 'craterField', n: 25, dMin: 25, dMax: 70, seed: 4, worn: true }
    ],
    paint: { base: 'mare', alt: 'mareLight', ejecta: 'ejecta' },
    rocks: { n: 900, min: 0.08, max: 0.6, bias: [{ x: 400, z: 20, r: 220, n: 350, max: 3.5 }, { x: 60, z: 2, r: 30, n: 60, max: 0.9 }], color: 'mareLight' },
    lander: { x: 0, z: 0, model: 'lm', name: 'Eagle descent stage' },
    rover: null,
    pois: [
      { id: 'eagle', name: 'Eagle (LM descent stage)', x: 0, z: 0, icon: '🛸', r: 8, fact: 'The descent stage stayed behind as the launch pad for the ascent stage. Its plaque reads: "We came in peace for all mankind."' },
      { id: 'flag', name: 'US flag', x: -5, z: -9, icon: '🏳️', r: 4, model: 'flag', fact: 'The flag was blown over by the ascent engine exhaust at liftoff, as Aldrin saw.' },
      { id: 'lrrr', name: 'Laser Ranging Retroreflector', x: -10, z: 19, icon: '🔦', r: 4, model: 'lrrr', fact: 'Still in use: observatories bounce lasers off it to measure the Earth–Moon distance to millimetres. The Moon recedes about 3.8 cm per year.' },
      { id: 'psep', name: 'Passive Seismic Experiment', x: -3, z: 17, icon: '📈', r: 4, model: 'psep', fact: 'The first seismometer on another world. It recorded moonquakes and the astronauts\' footsteps during its three weeks of operation.' },
      { id: 'littlewest', name: 'Little West crater rim', x: 46, z: 0, icon: '🕳️', r: 6, fact: 'About 33 m across and 60 m east of the LM. Armstrong ran here alone for the farthest walk of Apollo 11 — about 60 metres.' },
      { id: 'westcrater', name: 'West crater rim', x: 310, z: 20, icon: '🕳️', r: 12, fact: 'About 185 m across and strewn with boulders. Armstrong steered Eagle past it by hand, landing with about 25 seconds of fuel margin.' }
    ],
    samples: [
      { id: '10003', name: 'Sample 10003 — low-potassium basalt', x: 16, z: 10, fact: 'A volcanic rock that crystallised about 3.8 billion years ago from lava that flooded Mare Tranquillitatis.' },
      { id: '10017', name: 'Sample 10017 — high-potassium basalt', x: -14, z: -22, fact: 'A fine-grained basalt about 3.6 billion years old. The mare lavas are much younger than the bright highlands.' },
      { id: '10046', name: 'Sample 10046 — regolith breccia', x: 54, z: -16, fact: 'Soil and rock fragments welded together by meteorite impacts. Apollo 11 brought back 21.5 kg of samples in total.' },
      { id: '10084', name: 'Sample 10084 — lunar soil', x: -24, z: 8, fact: 'Fine regolith with tiny glass beads made by impacts. It smells like spent gunpowder, according to the astronauts.' }
    ],
    zones: [],
    objectives: [
      { id: 'walk', text: 'Take your first steps — walk 15 m', type: 'walk', n: 15 },
      { id: 'look', text: 'Find Earth in the sky and look at it', type: 'look', target: 'parent' },
      { id: 'jump', text: 'Jump higher than 0.5 m (hold Space)', type: 'jump', n: 0.5 },
      { id: 'samples', text: 'Collect 3 rock samples', type: 'samples', n: 3 },
      { id: 'lrrr', text: 'Visit the laser retroreflector', type: 'reach', poi: 'lrrr' },
      { id: 'littlewest', text: 'Walk to Little West crater (60 m east)', type: 'reach', poi: 'littlewest' }
    ],
    reward: { xp: 250 }
  },
  {
    id: 'hadley', body: 'moon', name: 'Hadley–Apennine', badge: 'lunar-driver',
    subtitle: 'Apollo 15 · Hadley Rille · 26.13°N 3.63°E',
    blurb: 'Apollo 15 landed beside a 1.2 km-wide lava channel at the foot of the Apennine Mountains and drove the first Lunar Roving Vehicle.',
    extent: 3300, res: 420, seed: 15,
    sun: { az: 95, el: 20 }, parent: { tex: 'earth', name: 'Earth', ang: 1.9, az: 188, el: 64 },
    spawn: { x: 8, z: 11, yaw: 100 },
    terrain: [
      { t: 'noise', amp: 5, scale: 300, oct: 4 },
      { t: 'noise', amp: 0.25, scale: 8, oct: 2 },
      { t: 'rille', x: -2150, angle: 0, width: 1200, depth: 300, meander: 160, wl: 1500, name: 'Hadley Rille' },
      { t: 'rise', x: 0, z: 4200, r: 2800, h: 650, name: 'Hadley Delta foothills' },
      { t: 'crater', x: 420, z: 2700, d: 100, depth: 0.12, fresh: 0.4, name: 'Spur crater' },
      { t: 'crater', x: -1250, z: 2200, d: 400, depth: 0.1, fresh: 0.2, name: 'Elbow crater' },
      { t: 'crater', x: 650, z: -900, d: 260, depth: 0.12, fresh: 0.3 },
      { t: 'craterField', n: 600, dMin: 4, dMax: 60, seed: 6 },
      { t: 'craterField', n: 40, dMin: 60, dMax: 220, seed: 7, worn: true }
    ],
    paint: { base: 'mare', alt: 'mareLight', ejecta: 'ejecta', slopeLight: 'highland' },
    rocks: { n: 1600, min: 0.1, max: 0.9, bias: [{ x: -1800, z: 300, r: 260, n: 400, max: 4 }, { x: 420, z: 2700, r: 120, n: 80, max: 1.5 }], color: 'mareLight' },
    lander: { x: 0, z: 0, model: 'lm', name: 'Falcon descent stage' },
    rover: { x: 12, z: 5, yaw: 110, name: 'Lunar Roving Vehicle', max: 3.6 },
    backdrop: [
      { name: 'Mons Hadley', az: 40, dist: 20000, h: 4500, w: 16000 },
      { name: 'Hadley Delta', az: 175, dist: 8500, h: 3500, w: 14000 },
      { name: 'Apennine front', az: 120, dist: 26000, h: 3000, w: 20000 },
      { name: 'Apennine front', az: 80, dist: 30000, h: 2600, w: 14000 }
    ],
    pois: [
      { id: 'falcon', name: 'Falcon (LM descent stage)', x: 0, z: 0, icon: '🛸', r: 9, fact: 'Apollo 15 was the first "J-mission": three days on the surface and 18 hours of moonwalks.' },
      { id: 'flag', name: 'US flag', x: 6, z: -14, icon: '🏳️', r: 4, model: 'flag', fact: 'Dave Scott and Jim Irwin raised it on the first moonwalk, 31 July 1971.' },
      { id: 'alsep', name: 'ALSEP science station', x: -110, z: -20, icon: '📡', r: 8, model: 'psep', fact: 'A nuclear-powered science station, set up about 110 m from the LM. It measured moonquakes and heat flow and sent data to Earth until 1977.' },
      { id: 'memorial', name: 'Fallen Astronaut memorial', x: 90, z: 14, icon: '🕯️', r: 4, model: 'plaque', fact: 'A small aluminium figure and a plaque listing 14 astronauts and cosmonauts who died, left by the crew beside the rover.' },
      { id: 'st9a', name: 'Station 9A — rille edge', x: -1730, z: 300, icon: '🏞️', r: 25, fact: 'Hadley Rille is about 1.2 km wide and 300 m deep — a channel carved by flowing lava more than 3.3 billion years ago. Layered lava flows show in its far wall.' },
      { id: 'spur', name: 'Spur crater (Station 7)', x: 420, z: 2640, icon: '🕳️', r: 20, fact: 'On the slope of Hadley Delta, Scott and Irwin found a white anorthosite rock perched on top of a boulder: the "Genesis Rock".' },
      { id: 'elbow', name: 'Elbow crater (Station 1)', x: -1140, z: 2080, icon: '🕳️', r: 25, fact: 'A 400 m crater near a bend in the rille, the first stop of the first rover traverse.' }
    ],
    samples: [
      { id: '15415', name: 'Sample 15415 — the Genesis Rock', x: 445, z: 2620, fact: 'Anorthosite about 4.1 billion years old — a piece of the Moon\'s early crust that crystallised from a global magma ocean.' },
      { id: '15555', name: 'Sample 15555 — "Great Scott" basalt', x: -1712, z: 282, fact: 'Collected near the rille edge. This 9.6 kg olivine basalt is about 3.3 billion years old and one of the most studied Apollo rocks.' },
      { id: '15016', name: 'Sample 15016 — vesicular basalt', x: 70, z: -60, fact: 'Full of gas bubbles (vesicles) left by volcanic gases as the lava cooled.' }
    ],
    zones: [],
    objectives: [
      { id: 'board', text: 'Board the Lunar Roving Vehicle (E)', type: 'board' },
      { id: 'drive', text: 'Drive 400 m in the rover', type: 'drive', n: 400 },
      { id: 'air', text: 'Get the rover airborne (drive fast over bumps and rims)', type: 'air', n: 0.3 },
      { id: 'drop', text: 'Do the hammer–feather drop test (G)', type: 'drop' },
      { id: 'st9a', text: 'Reach the edge of Hadley Rille (Station 9A)', type: 'reach', poi: 'st9a' },
      { id: 'genesis', text: 'Collect the Genesis Rock at Spur crater', type: 'sample', sample: '15415' }
    ],
    reward: { xp: 300 }
  },
  {
    id: 'shackleton', body: 'moon', name: 'Shackleton Rim', badge: 'ice-hunter',
    subtitle: 'Lunar south pole · Shackleton crater · 89.7°S',
    blurb: 'A 21 km-wide, 4 km-deep crater at the south pole. The Sun skims the horizon and the crater floor has not seen sunlight for billions of years.',
    extent: 1600, res: 360, seed: 21,
    sun: { az: 90, el: 1.5 }, parent: { tex: 'earth', name: 'Earth', ang: 1.9, az: 15, el: 4 },
    temp: { sun: 'about −50 °C on the sunlit rim', shade: 'below −200 °C' },
    spawn: { x: 215, z: 40, yaw: 270 },
    terrain: [
      { t: 'noise', amp: 6, scale: 260, oct: 4 },
      { t: 'noise', amp: 0.25, scale: 8, oct: 2 },
      { t: 'wall', x: -40, angle: 0, slope: 27, rim: 18, rimW: 140, outer: -2.5, name: 'Shackleton inner wall' },
      { t: 'craterField', n: 340, dMin: 3, dMax: 45, seed: 8 },
      { t: 'craterField', n: 20, dMin: 50, dMax: 150, seed: 9, worn: true }
    ],
    paint: { base: 'highland', alt: 'highlandLight', ejecta: 'highlandLight' },
    rocks: { n: 1100, min: 0.1, max: 1.0, color: 'highland' },
    lander: { x: 250, z: 0, model: 'lander', name: 'Crew lander' },
    rover: { x: 232, z: 70, yaw: 270, name: 'Polar rover', max: 3.6 },
    pois: [
      { id: 'lander', name: 'Crew lander', x: 250, z: 0, icon: '🛸', r: 12, fact: 'NASA\'s Artemis programme has picked the south polar region for crewed landings, partly for water ice and near-constant sunlight on the rims.' },
      { id: 'crest', name: 'Rim crest — a "peak of near-eternal light"', x: -30, z: -20, icon: '☀️', r: 18, fact: 'Because the Moon\'s axis tilts only 1.5°, some rim points here are sunlit over 80% of the time — ideal for solar power.' },
      { id: 'psr', name: 'Permanently shadowed region', x: -260, z: 30, icon: '🧊', r: 40, fact: 'Below the rim the Sun never rises. LRO\'s Diviner instrument measured some polar shadows below −240 °C, cold enough to trap water ice for billions of years.' }
    ],
    samples: [
      { id: 'icecore', name: 'Icy regolith core', x: -260, z: 30, needsShadow: true, fact: 'A predicted sample: neutron and laser data suggest polar shadows hold water ice mixed into the soil. In 2009 the LCROSS impact at nearby Cabeus crater found about 5.6% water by mass.' },
      { id: 'anorth', name: 'Highland anorthosite chip', x: 150, z: -70, fact: 'The south pole sits in bright highland crust — feldspar-rich rock very different from the dark mare basalts.' }
    ],
    zones: [
      { id: 'ice', x: -260, z: 30, r: 140, needsShadow: true, result: 'Neutron spectrometer: strong drop in fast neutrons — hydrogen-rich soil. Likely water ice, a few % by mass. Surface temperature here: about −200 °C.' }
    ],
    objectives: [
      { id: 'crest', text: 'Walk to the sunlit rim crest', type: 'reach', poi: 'crest' },
      { id: 'look', text: 'Find Earth low on the horizon', type: 'look', target: 'parent' },
      { id: 'shadow', text: 'Descend into permanent shadow', type: 'shadow' },
      { id: 'scan', text: 'Scan for water ice in the shadow (R)', type: 'scan', zone: 'ice' },
      { id: 'core', text: 'Collect an icy regolith core', type: 'sample', sample: 'icecore' },
      { id: 'return', text: 'Climb back to the rim crest', type: 'reach', poi: 'crest', after: 'core' }
    ],
    reward: { xp: 300 }
  },

  // ===================== OTHER MOONS =====================
  {
    id: 'loki', body: 'io', name: 'Loki Patera shore', badge: null,
    subtitle: 'Io · edge of Loki Patera · 13°N 309°W',
    blurb: 'The shore of Loki Patera, a 200 km-wide volcanic depression holding a lava lake that overturns roughly every 1.5 years.',
    extent: 900, res: 300, seed: 31,
    sun: { az: 120, el: 35 }, parent: { tex: 'jupiter', name: 'Jupiter', ang: 19.4, az: 255, el: 38 },
    spawn: { x: 190, z: 30, yaw: 270 },
    terrain: [
      { t: 'noise', amp: 3, scale: 160, oct: 4 },
      { t: 'noise', amp: 0.2, scale: 7, oct: 2 },
      { t: 'wall', x: -300, angle: 0, slope: 14, rim: 3, rimW: 30, depth: 25, outer: 0, name: 'Patera scarp' },
      { t: 'craterField', n: 25, dMin: 2, dMax: 12, seed: 5, worn: true }
    ],
    paint: { base: 'ioYellow', alt: 'ioWhite', special: 'io' },
    rocks: { n: 260, min: 0.1, max: 0.6, color: 'ioOrange' },
    lava: { x: -300, glow: [1, 0.35, 0.08] },
    lander: { x: 200, z: 0, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'shore', name: 'Patera shore', x: -270, z: 0, icon: '🌋', r: 20, fact: 'Loki is Io\'s most powerful volcano, producing about 10% of Io\'s total heat output.' }
    ],
    samples: [
      { id: 'so2', name: 'Sulfur dioxide frost', x: 60, z: -120, fact: 'White SO₂ frost condenses from volcanic gas. Io\'s thin atmosphere freezes onto the ground during each eclipse by Jupiter.' },
      { id: 'redS', name: 'Red short-chain sulfur', x: -160, z: 130, fact: 'Red deposits are short-chain sulfur (S₃, S₄) from fresh eruptions; they turn yellow as they change to ordinary S₈ sulfur.' },
      { id: 'glass', name: 'Dark silicate lava crust', x: -235, z: -150, fact: 'Io\'s hottest lavas are silicate rock (like basalt) — some measured above 1,200 °C by Galileo.' }
    ],
    zones: [{ id: 'hot', x: -290, z: 0, r: 70, result: 'Thermal imager: lava crust at ~330 °C with glowing cracks above 1,000 °C. Loki\'s lake overturns in waves that cross it at about 1 km per day.' }],
    objectives: [
      { id: 'shore', text: 'Walk to the patera shore', type: 'reach', poi: 'shore' },
      { id: 'scan', text: 'Take a thermal scan of the lava (R)', type: 'scan', zone: 'hot' },
      { id: 'samples', text: 'Collect 2 sulfur samples', type: 'samples', n: 2 },
      { id: 'look', text: 'Look up at Jupiter', type: 'look', target: 'parent' },
      { id: 'jump', text: 'Jump higher than 0.5 m', type: 'jump', n: 0.5 }
    ],
    reward: { xp: 200 }
  },
  {
    id: 'conamara', body: 'europa', name: 'Conamara Chaos', badge: null,
    subtitle: 'Europa · chaos terrain · 9°N 273°W',
    blurb: 'Rafts of ice crust broke apart, drifted and refroze here — evidence of warm ice or water just below. Jupiter sits huge on the horizon.',
    extent: 1300, res: 320, seed: 41,
    sun: { az: 100, el: 25 }, parent: { tex: 'jupiter', name: 'Jupiter', ang: 12.2, az: 271, el: 3 },
    spawn: { x: 10, z: 160, yaw: 0 },
    terrain: [
      { t: 'noise', amp: 6, scale: 120, oct: 4 },
      { t: 'noise', amp: 0.25, scale: 6, oct: 2 },
      { t: 'ridge', x: 0, z: -800, angle: 90, width: 800, height: 120, double: 700, name: 'Double ridge' },
      { t: 'blocks', n: 18, seed: 4, minS: 60, maxS: 220, minH: 15, maxH: 70, area: [-1100, 1100, -350, 1100], tilt: true, fixed: [{ x: 260, z: 40, s: 150, h: 40 }] }
    ],
    paint: { base: 'euIce', alt: 'euTan', special: 'europa' },
    rocks: { n: 500, min: 0.2, max: 2, color: 'euIce' },
    lander: { x: 0, z: 200, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'ridge', name: 'Double ridge crest', x: 0, z: -450, icon: '⛰️', r: 30, fact: 'Double ridges like this, ~1 km wide and 100–300 m high, may form when water squeezes up through cracks and refreezes.' },
      { id: 'raft', name: 'Tilted ice raft', x: 260, z: 40, icon: '🧊', r: 60, fact: 'Galileo images show blocks like this that drifted and rotated in a slushy matrix before freezing in place.' }
    ],
    samples: [
      { id: 'matrix', name: 'Brown matrix ice (salts)', x: -150, z: 60, fact: 'Reddish-brown material in chaos terrain contains salts. Hubble found sodium chloride — table salt — on Europa in 2019.' },
      { id: 'frost', name: 'Bright fresh frost', x: 300, z: 250, fact: 'Europa\'s surface is young — perhaps 40–90 million years — because it keeps being resurfaced.' },
      { id: 'flank', name: 'Ridge flank ice', x: 80, z: -380, fact: 'Ice near ridges may preserve material brought up from the ocean below.' }
    ],
    zones: [{ id: 'radar', x: 0, z: 0, r: 9999, result: 'Ice-penetrating radar: brine pockets in the top few km; models put the ice shell at about 15–25 km thick. Europa Clipper\'s REASON radar will measure this.' }],
    objectives: [
      { id: 'ridge', text: 'Climb to the double ridge crest', type: 'reach', poi: 'ridge' },
      { id: 'samples', text: 'Collect 2 ice samples', type: 'samples', n: 2 },
      { id: 'scan', text: 'Run a radar sounding (R)', type: 'scan', zone: 'radar' },
      { id: 'look', text: 'Look at Jupiter on the horizon', type: 'look', target: 'parent' },
      { id: 'jump', text: 'Jump higher than 0.6 m', type: 'jump', n: 0.6 }
    ],
    reward: { xp: 200 }
  },
  {
    id: 'harpagia', body: 'ganymede', name: 'Harpagia Sulcus', badge: null,
    subtitle: 'Ganymede · grooved terrain · 15°S 320°W',
    blurb: 'Bright, grooved terrain where Ganymede\'s crust was pulled apart. Galileo photographed this region at high resolution.',
    extent: 1200, res: 300, seed: 51,
    sun: { az: 110, el: 30 }, parent: { tex: 'jupiter', name: 'Jupiter', ang: 7.6, az: 255, el: 48 },
    spawn: { x: 0, z: 40, yaw: 0 },
    terrain: [
      { t: 'noise', amp: 4, scale: 150, oct: 4 },
      { t: 'noise', amp: 0.2, scale: 6, oct: 2 },
      { t: 'grooves', angle: 90, wl: 520, amp: 30, sharp: 2, phase: 260 },
      { t: 'crater', x: 380, z: 220, d: 120, depth: 0.18, fresh: 1, name: 'Fresh crater' },
      { t: 'craterField', n: 160, dMin: 3, dMax: 40, seed: 3 }
    ],
    paint: { base: 'gaIce', alt: 'gaDark', ejecta: 'caIce', special: 'ganymede' },
    rocks: { n: 500, min: 0.1, max: 1, color: 'gaIce', bias: [{ x: 380, z: 220, r: 140, n: 150, max: 1.6 }] },
    lander: { x: 0, z: 0, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'crest', name: 'Groove ridge crest', x: 0, z: -260, icon: '⛰️', r: 30, fact: 'Grooved terrain formed as the crust stretched and broke into parallel faults, probably more than 2 billion years ago.' },
      { id: 'fresh', name: 'Fresh impact crater', x: 380, z: 220, icon: '🕳️', r: 70, fact: 'Young craters dig up clean, bright ice. Older surfaces are darkened by dust and radiation.' }
    ],
    samples: [
      { id: 'bright', name: 'Clean crater ice', x: 330, z: 170, fact: 'Ganymede is roughly half rock and half water ice, with a salty ocean sandwiched between ice layers.' },
      { id: 'dark', name: 'Dark lag deposit', x: -300, z: 200, fact: 'Dark material is left behind when ice sublimates, plus dust from impacts.' },
      { id: 'groove', name: 'Groove wall ice', x: 90, z: -240, fact: 'ESA\'s JUICE spacecraft will orbit Ganymede from 2034 — the first spacecraft to orbit a moon other than ours.' }
    ],
    zones: [{ id: 'mag', x: 0, z: 0, r: 9999, result: 'Magnetometer: ~720 nT internal field plus a signal that changes with Jupiter\'s field — evidence of a salty, conducting ocean (confirmed with Hubble aurora observations in 2015).' }],
    objectives: [
      { id: 'crest', text: 'Reach the groove ridge crest', type: 'reach', poi: 'crest' },
      { id: 'fresh', text: 'Visit the fresh crater', type: 'reach', poi: 'fresh' },
      { id: 'samples', text: 'Collect 2 samples', type: 'samples', n: 2 },
      { id: 'scan', text: 'Measure the magnetic field (R)', type: 'scan', zone: 'mag' },
      { id: 'look', text: 'Look at Jupiter', type: 'look', target: 'parent' }
    ],
    reward: { xp: 200 }
  },
  {
    id: 'valhalla', body: 'callisto', name: 'Valhalla Knobs', badge: null,
    subtitle: 'Callisto · Valhalla basin · 14°N 56°W',
    blurb: 'Inside Valhalla, a 3,800 km impact basin. Bright knobs of ice rise from dark dust left behind as the ice sublimates.',
    extent: 1100, res: 300, seed: 61,
    sun: { az: 220, el: 28 }, parent: { tex: 'jupiter', name: 'Jupiter', ang: 4.3, az: 80, el: 33 },
    spawn: { x: 0, z: 40, yaw: 300 },
    terrain: [
      { t: 'noise', amp: 2.5, scale: 140, oct: 4 },
      { t: 'noise', amp: 0.15, scale: 6, oct: 2 },
      { t: 'blocks', n: 14, seed: 7, minS: 70, maxS: 160, minH: 25, maxH: 70, area: [-900, 900, -900, 900], round: true, fixed: [{ x: 230, z: -150, s: 200, h: 45 }] },
      { t: 'craterField', n: 40, dMin: 20, dMax: 160, seed: 2, worn: true }
    ],
    paint: { base: 'caDark', alt: 'gaDark', special: 'callisto' },
    rocks: { n: 200, min: 0.1, max: 0.5, color: 'caIce' },
    lander: { x: 0, z: 0, model: 'lander', name: 'Expedition lander' },
    pois: [{ id: 'knob0', name: 'Ice knob summit', x: 230, z: -150, icon: '🗻', r: 22, fact: 'Galileo\'s close-up images showed knobs like this, tens of metres high, made of ice and slowly wasting away.' }],
    samples: [
      { id: 'dust', name: 'Dark lag dust', x: -80, z: 60, fact: 'When ice sublimates in sunlight, the dust it contained stays behind as a dark blanket.' },
      { id: 'knob', name: 'Knob ice', x: 215, z: -135, fact: 'Knobs may be remnants of crater rims, slowly wasting away as their ice turns to vapour.' }
    ],
    zones: [{ id: 'rad', x: 0, z: 0, r: 9999, result: 'Dosimeter: ~0.1 mSv per day — lower than on the Moon. That is why NASA\'s HOPE study (2003) chose Callisto for a future crewed base in the Jupiter system.' }],
    objectives: [
      { id: 'knob', text: 'Climb the nearest ice knob', type: 'reach', poi: 'knob0' },
      { id: 'scan', text: 'Measure the radiation level (R)', type: 'scan', zone: 'rad' },
      { id: 'samples', text: 'Collect 2 samples', type: 'samples', n: 2 },
      { id: 'look', text: 'Find Jupiter in the sky', type: 'look', target: 'parent' }
    ],
    reward: { xp: 200 }
  },
  {
    id: 'huygens', body: 'titan', name: 'Huygens Landing Site', badge: null,
    subtitle: 'Titan · Adiri plains · 10.3°S 192.3°W',
    blurb: 'ESA\'s Huygens probe landed here on 14 January 2005: a damp plain of rounded ice pebbles under an orange sky, with river-cut hills to the north.',
    extent: 1100, res: 300, seed: 71,
    sun: { az: 140, el: 40 }, parent: null,
    spawn: { x: 0, z: 30, yaw: 340 },
    terrain: [
      { t: 'noise', amp: 2, scale: 180, oct: 4 },
      { t: 'noise', amp: 0.08, scale: 4, oct: 2 },
      { t: 'rise', x: 0, z: -1500, r: 1100, h: 150, name: 'Bright highlands' },
      { t: 'rille', x: -40, angle: 15, width: 30, depth: 8, meander: 30, wl: 160, zMax: -450, name: 'Methane river channel' }
    ],
    paint: { base: 'tiSand', alt: 'tiPebble', special: 'titan' },
    rocks: { n: 2400, min: 0.03, max: 0.15, color: 'tiPebble', round: true },
    lander: { x: 0, z: 70, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'huygens', name: 'Huygens probe', x: 30, z: -20, icon: '🛰️', r: 6, model: 'huygens', fact: 'Huygens took 2.5 hours to parachute down through the thick air and kept transmitting for 72 minutes after landing — the most distant landing ever made.' },
      { id: 'channel', name: 'Channel in the highlands', x: -150, z: -560, icon: '🏞️', r: 30, fact: 'Huygens photographed branching channels cut by methane rain running off the bright hills.' }
    ],
    samples: [
      { id: 'pebble', name: 'Rounded ice pebble', x: 40, z: -12, fact: 'The "rocks" are water ice, hard as rock at −179 °C, rounded by flowing liquid like river stones on Earth.' },
      { id: 'sand', name: 'Damp organic "sand"', x: -60, z: 70, fact: 'The ground felt like damp sand or crème brûlée to Huygens: a crust over soft material wet with liquid methane.' },
      { id: 'sediment', name: 'Channel sediment', x: -130, z: -540, fact: 'Titan\'s dunes and sediments are made of organic molecules that drizzle down from the haze.' }
    ],
    zones: [{ id: 'gc', x: 30, z: -20, r: 9999, result: 'Gas chromatograph: methane ~5% at ground level, ~45% humidity. When Huygens\' warm base touched the ground, methane evaporated out of the soil — proof it was damp.' }],
    objectives: [
      { id: 'huygens', text: 'Find the Huygens probe', type: 'reach', poi: 'huygens' },
      { id: 'drop', text: 'Drop the hammer and feather (G) — watch the air', type: 'drop' },
      { id: 'scan', text: 'Analyse the air (R)', type: 'scan', zone: 'gc' },
      { id: 'samples', text: 'Collect 2 samples', type: 'samples', n: 2 },
      { id: 'channel', text: 'Hike to the highland channel', type: 'reach', poi: 'channel' }
    ],
    reward: { xp: 220 }
  },
  {
    id: 'tigerstripes', body: 'enceladus', name: 'Tiger Stripe Rim', badge: null,
    subtitle: 'Enceladus · Damascus Sulcus · south polar terrain',
    blurb: 'At the edge of a "tiger stripe" fracture, 500 m deep, where jets of ocean water blast into space. Gravity is so weak that walking barely works.',
    extent: 1200, res: 300, seed: 81,
    sun: { az: 20, el: 12 }, parent: { tex: 'saturn', name: 'Saturn', ang: 27.5, az: 330, el: 6, rings: true },
    spawn: { x: 0, z: -260, yaw: 180 },
    terrain: [
      { t: 'noise', amp: 4, scale: 150, oct: 4 },
      { t: 'noise', amp: 0.15, scale: 5, oct: 2 },
      { t: 'ridge', x: 0, z: 40, angle: 90, width: 600, height: 100, name: 'Flanking ridge' },
      { t: 'trench', x: 0, z: 1050, angle: 90, width: 1700, depth: 500 }
    ],
    paint: { base: 'enSnow', alt: 'enBlue', special: 'enceladus' },
    rocks: { n: 300, min: 0.2, max: 1.4, color: 'enSnow' },
    vents: [{ x: -320, z: 1000 }, { x: 140, z: 1080 }, { x: 520, z: 980 }],
    lander: { x: 0, z: -300, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'ridge', name: 'Flanking ridge crest', x: 0, z: 40, icon: '⛰️', r: 40, fact: 'Ridges about 100 m high line each tiger stripe, built from erupted material.' },
      { id: 'overlook', name: 'Stripe overlook', x: 0, z: 230, icon: '⛲', r: 40, fact: 'The four tiger stripes are ~130 km long, about 35 km apart, and warmer than the surrounding ice.' }
    ],
    samples: [
      { id: 'snow', name: 'Fresh plume snow', x: 100, z: -100, fact: 'Plume fallout covers the south pole in fine snow, metres to perhaps 100 m deep in places.' },
      { id: 'ridgeice', name: 'Ridge ice', x: -50, z: 50, fact: 'The ridge ice is among the youngest surface in the Saturn system.' }
    ],
    zones: [{ id: 'plume', x: 0, z: 230, r: 220, result: 'Plume particle analysis (as Cassini did): water, salt (NaCl), silica nanograins from hot-water reactions, organic molecules, hydrogen gas and phosphates — all the chemical ingredients for life.' }],
    objectives: [
      { id: 'hop', text: 'Make a 5 m high hop (hold Space)', type: 'jump', n: 5 },
      { id: 'jet', text: 'Fly with the jetpack (hold Space in the air)', type: 'jet', n: 3 },
      { id: 'overlook', text: 'Reach the stripe overlook', type: 'reach', poi: 'overlook' },
      { id: 'scan', text: 'Sample the plume (R)', type: 'scan', zone: 'plume' },
      { id: 'samples', text: 'Collect 2 samples', type: 'samples', n: 2 },
      { id: 'look', text: 'Look at Saturn on the horizon', type: 'look', target: 'parent' }
    ],
    reward: { xp: 220 }
  },
  {
    id: 'geysers', body: 'triton', name: 'Southern Geyser Field', badge: null,
    subtitle: 'Triton · south polar cap · ~50°S',
    blurb: 'On the nitrogen-ice polar cap, where Voyager 2 saw dark plumes rising 8 km in 1989 and leaving streaks downwind.',
    extent: 1100, res: 300, seed: 91,
    sun: { az: 20, el: 72 }, parent: { tex: 'neptune', name: 'Neptune', ang: 7.9, az: 200, el: 40 },
    spawn: { x: 0, z: 120, yaw: 330 },
    terrain: [
      { t: 'noise', amp: 3, scale: 160, oct: 4 },
      { t: 'noise', amp: 0.12, scale: 5, oct: 2 },
      { t: 'craterField', n: 25, dMin: 4, dMax: 40, seed: 4, worn: true }
    ],
    paint: { base: 'trPink', alt: 'trWhite', special: 'triton' },
    rocks: { n: 160, min: 0.1, max: 0.5, color: 'trWhite' },
    vents: [{ x: -250, z: -150, dark: true }, { x: 360, z: 300, dark: true }],
    streaks: [{ x: -250, z: -150, angle: 45, len: 500 }, { x: 360, z: 300, angle: 45, len: 450 }],
    lander: { x: 0, z: 150, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'vent', name: 'Geyser vent', x: -250, z: -150, icon: '⛲', r: 30, fact: 'Plumes rise about 8 km, then are blown sideways by winds in the thin nitrogen air, depositing dark streaks up to 150 km long.' }
    ],
    samples: [
      { id: 'n2', name: 'Nitrogen ice', x: 50, z: 40, fact: 'The polar cap is frozen nitrogen with traces of methane and carbon monoxide.' },
      { id: 'streak', name: 'Dark streak dust', x: -150, z: -250, fact: 'Dark plume dust may be organic material darkened by radiation.' }
    ],
    zones: [{ id: 'gey', x: -250, z: -150, r: 90, result: 'Spectrometer: nitrogen gas carrying dark dust. Leading idea: sunlight passes through clear nitrogen ice, heats dark material beneath (a solid-state greenhouse) and builds pressure until it vents.' }],
    objectives: [
      { id: 'vent', text: 'Walk to the geyser vent', type: 'reach', poi: 'vent' },
      { id: 'scan', text: 'Analyse the plume (R)', type: 'scan', zone: 'gey' },
      { id: 'samples', text: 'Collect 2 samples', type: 'samples', n: 2 },
      { id: 'look', text: 'Look at Neptune', type: 'look', target: 'parent' },
      { id: 'jump', text: 'Jump higher than 1 m', type: 'jump', n: 1 }
    ],
    reward: { xp: 220 }
  },
  {
    id: 'serenity', body: 'charon', name: 'Serenity Chasma Rim', badge: null,
    subtitle: 'Charon · canyon belt · representative site facing Pluto',
    blurb: 'Charon\'s crust split open as an inner ocean froze and expanded, creating canyons several km deep. Pluto hangs fixed in the sky.',
    extent: 1100, res: 300, seed: 101,
    sun: { az: 150, el: 20 }, parent: { tex: 'pluto', name: 'Pluto', ang: 6.9, az: 300, el: 25 },
    spawn: { x: 300, z: 30, yaw: 270 },
    terrain: [
      { t: 'noise', amp: 4, scale: 160, oct: 4 },
      { t: 'noise', amp: 0.15, scale: 5, oct: 2 },
      { t: 'wall', x: -150, angle: 0, slope: 55, rim: 6, rimW: 60, depth: 900, outer: 0, name: 'Chasma wall' },
      { t: 'trench', x: 140, z: 0, angle: 0, width: 24, depth: 14, name: 'Graben' },
      { t: 'craterField', n: 60, dMin: 4, dMax: 50, seed: 3 }
    ],
    paint: { base: 'chGrey', alt: 'chDark', special: 'charon' },
    rocks: { n: 300, min: 0.1, max: 0.8, color: 'chGrey' },
    lander: { x: 320, z: 0, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'over', name: 'Chasma overlook', x: -120, z: 0, icon: '🏔️', r: 25, fact: 'Charon\'s canyon belt runs over 1,600 km; parts of it are up to about 7–9 km deep.' },
      { id: 'graben', name: 'Far side of the graben', x: 110, z: 0, icon: '↔️', r: 10, fact: 'A graben is a block of crust that dropped between two faults as the crust stretched.' }
    ],
    samples: [
      { id: 'nh3', name: 'Ammonia-bearing ice', x: 150, z: -200, fact: 'New Horizons found ammonia ice in spots on Charon — ammonia acts as antifreeze, so it hints at a past liquid ocean.' },
      { id: 'ice', name: 'Water ice', x: -40, z: 60, fact: 'Charon\'s surface is mostly water ice, grey rather than Pluto\'s nitrogen- and methane-rich colours.' }
    ],
    zones: [{ id: 'spec', x: 0, z: 0, r: 9999, result: 'Spectrometer: crystalline water ice with ammonia hydrates. Crystalline ice should be destroyed by radiation over time, so some may be relatively fresh.' }],
    objectives: [
      { id: 'graben', text: 'Cross the graben (jump or jetpack)', type: 'reach', poi: 'graben' },
      { id: 'over', text: 'Reach the chasma overlook', type: 'reach', poi: 'over' },
      { id: 'scan', text: 'Take a spectrum of the ice (R)', type: 'scan', zone: 'spec' },
      { id: 'samples', text: 'Collect 2 samples', type: 'samples', n: 2 },
      { id: 'look', text: 'Look at Pluto', type: 'look', target: 'parent' }
    ],
    reward: { xp: 220 }
  },
  {
    id: 'stickney', body: 'phobos', name: 'Stickney Rim', badge: null,
    subtitle: 'Phobos · rim of Stickney crater (9 km)',
    blurb: 'On the rim of a 9 km crater that nearly shattered Phobos. Mars fills a fifth of the sky. Gravity is about 1/1,700 of Earth\'s.',
    extent: 900, res: 280, seed: 111, timeWarp: true,
    sun: { az: 120, el: 40 }, parent: { tex: 'mars', name: 'Mars', ang: 42, az: 270, el: 30 },
    spawn: { x: 150, z: 30, yaw: 270 },
    terrain: [
      { t: 'noise', amp: 3, scale: 140, oct: 4 },
      { t: 'noise', amp: 0.12, scale: 5, oct: 2 },
      { t: 'wall', x: -200, angle: 0, slope: 20, rim: 25, rimW: 120, depth: 300, outer: -3, name: 'Stickney inner wall' },
      { t: 'grooves', angle: 30, wl: 260, amp: -9, sharp: 6 },
      { t: 'craterField', n: 50, dMin: 4, dMax: 40, seed: 2, worn: true }
    ],
    paint: { base: 'phDark', alt: 'phLight', special: 'phobos' },
    rocks: { n: 200, min: 0.1, max: 1.2, color: 'phLight' },
    lander: { x: 160, z: 0, model: 'lander', name: 'Expedition lander' },
    pois: [
      { id: 'rim', name: 'Stickney rim crest', x: -200, z: 0, icon: '🕳️', r: 30, fact: 'Stickney is 9 km wide on a moon only 22 km across. Its impact may have created Phobos\'s long grooves.' }
    ],
    samples: [{ id: 'reg', name: 'Phobos regolith', x: 100, z: 80, fact: 'Phobos is dark and carbon-rich. Whether it is a captured asteroid or debris from an impact on Mars is still debated; JAXA\'s MMX mission plans to bring samples home.' }],
    zones: [{ id: 'comp', x: 0, z: 0, r: 9999, result: 'Spectrometer: dark, low-reflectance regolith similar to some carbon-rich asteroids, with hints of Mars-like minerals.' }],
    objectives: [
      { id: 'hop', text: 'Push off gently and hop (tap Space)', type: 'jump', n: 0.5 },
      { id: 'jet', text: 'Use the jetpack (hold Space in the air)', type: 'jet', n: 2 },
      { id: 'rim', text: 'Reach the Stickney rim', type: 'reach', poi: 'rim' },
      { id: 'sample', text: 'Collect a regolith sample', type: 'samples', n: 1 },
      { id: 'look', text: 'Look at Mars', type: 'look', target: 'parent' }
    ],
    reward: { xp: 200 }
  }
];
export const SITE_MAP = Object.fromEntries(SITES.map(s => [s.id, s]));
export const sitesFor = bodyId => SITES.filter(s => s.body === bodyId);
export const SURFACE_BODY_IDS = Object.keys(SURFACE_BODIES);
