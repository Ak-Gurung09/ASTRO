import { CAREER_BADGES } from '../career/data/badges.js';
// ASTRO LAB — Missions, badges and ranks (pure data + small predicate functions)
import { BODY_MAP } from './solarSystem.js';
import { SITES, SITE_MAP, SURFACE_BODIES } from './surfaces.js';

// Task kinds:
//  { event, target?, count? }       -> completed when the event (optionally for target id) fires `count` times
//  { computed: (progress) => [n, total] } -> derived from saved progress (e.g. "complete 3 planet missions")

const survey = (id, opts = {}) => {
  const b = BODY_MAP[id];
  return {
    id: `survey-${id}`, name: opts.name || `${b.name} Survey`, category: opts.category || (b.type === 'moon' ? 'moon' : 'planet'),
    planetMission: b.type === 'planet', target: id,
    briefing: opts.briefing || `Mission Control wants fresh data on ${b.name}. Fly there, run a full sensor scan and prove your knowledge.`,
    objective: `Travel to ${b.name}, scan it and pass its knowledge check.`,
    tasks: [
      { text: `Select ${b.name} (click/tap it, or use the Map)`, event: 'select', target: id },
      { text: `Travel to ${b.name} (press F or "Travel")`, event: 'arrive', target: id },
      { text: `Run a sensor scan of ${b.name}`, event: 'scan', target: id },
      { text: `Pass the ${b.name} knowledge check`, event: 'quiz:pass', target: id }
    ],
    reward: { xp: opts.xp || 120, card: id, badge: opts.badge }
  };
};

export const STORY_ORDER = ['orientation', 'homeworld', 'lunar', 'moonwalk', 'redplanet', 'gravity', 'commander'];

export const MISSIONS = [
  {
    id: 'orientation', name: 'Cadet Orientation', category: 'story', tutorial: true,
    briefing: 'Welcome aboard, Cadet. Before you fly solo, learn to steer your observation craft and control the simulation.',
    objective: 'Practise every basic control once.',
    tasks: [
      { text: 'Rotate the camera — drag with the left mouse button or one finger', event: 'cam:rotate', hint: 'drag' },
      { text: 'Zoom — use the mouse wheel or pinch', event: 'cam:zoom', hint: 'wheel' },
      { text: 'Pan — right-drag, or drag with two fingers', event: 'cam:pan', hint: 'pan' },
      { text: 'Move — press W A S D / arrow keys, or use the joystick', event: 'cam:move', hint: 'move' },
      { text: 'Select any planet — click or tap it', event: 'select', hint: 'select' },
      { text: 'Pause and resume orbits — press Space or the ❚❚ button (twice)', event: 'sim:pause', count: 2, hint: 'pause' }
    ],
    reward: { xp: 100, badge: 'flight-certified' }
  },
  { ...survey('earth', { name: 'Home World', category: 'story', xp: 150, badge: 'home-world',
    briefing: 'Every great explorer starts at home. Study Earth, the only world known to harbour life.' }) , id: 'homeworld' },
  { ...survey('moon', { name: 'Lunar Recon', category: 'story', xp: 150, badge: 'lunar-recon',
    briefing: 'Our Moon is humanity\'s first stepping stone. Travel there and inspect its cratered surface data.' }), id: 'lunar' },
  {
    id: 'moonwalk', name: 'One Small Step', category: 'story', target: 'moon',
    briefing: 'Orbit is only the start. Land at Tranquility Base, where Apollo 11 touched down in 1969, and explore it on foot in real lunar gravity.',
    objective: 'Land on the Moon at Tranquility Base and complete every surface objective.',
    tasks: [
      { text: 'Travel to the Moon and press 🧑‍🚀 Land in its info panel', event: 'surface:land', target: 'tranquility' },
      { text: 'Complete every objective at Tranquility Base', event: 'surface:complete', target: 'tranquility' }
    ],
    reward: { xp: 300, badge: 'moonwalker' }
  },
  { ...survey('mars', { name: 'Red Planet Survey', category: 'story', xp: 200, badge: 'red-planet',
    briefing: 'Rovers have found ancient lake beds on Mars. Complete a full survey of the Red Planet.' }), id: 'redplanet' },
  {
    id: 'gravity', name: 'Gravity Trials', category: 'story',
    briefing: 'Gravity shapes every orbit in the cosmos. Prove you can tame it in the Simulation Laboratory.',
    objective: 'Put a planet into a stable orbit in the Gravity Simulator.',
    tasks: [
      { text: 'Open the Simulation Laboratory (🧪 Lab button)', event: 'lab:open' },
      { text: 'Open the Gravity Simulator', event: 'sim:open', target: 'gravity' },
      { text: 'Complete the Gravity Simulator challenge', event: 'sim:complete', target: 'gravity' }
    ],
    reward: { xp: 200, badge: 'gravity-master' }
  },
  {
    id: 'commander', name: 'Mission Commander', category: 'story',
    briefing: 'Command is earned in the field. Complete three planet missions to earn your first command badge.',
    objective: 'Complete any three planet missions (Home World and Red Planet Survey count!).',
    tasks: [
      { text: 'Complete 3 planet missions', computed: p => [Math.min(3, planetMissionsDone(p)), 3] }
    ],
    reward: { xp: 300, badge: 'mission-commander' }
  },

  // Planet exploration
  survey('mercury'), survey('venus'), survey('jupiter', { xp: 150 }), survey('saturn', { xp: 150 }),
  survey('uranus', { xp: 160 }), survey('neptune', { xp: 160 }),
  survey('sun', { name: 'Solar Observer', category: 'planet', xp: 150, badge: 'solar-observer',
    briefing: 'Approach our star (safely, from a simulated distance) and analyse its output.' }),
  survey('ceres', { category: 'planet', xp: 120 }), survey('pluto', { category: 'planet', xp: 160 }),

  // Moon missions
  survey('io'), survey('europa', { xp: 150 }), survey('ganymede'), survey('callisto'),
  survey('titan', { xp: 150 }), survey('enceladus', { xp: 150 }), survey('triton'), survey('phobos'), survey('charon'),

  // Surface expeditions (one per landing site, Tranquility is the story mission)
  ...SITES.filter(s => s.id !== 'tranquility').map(s => ({
    id: `exp-${s.id}`, name: `Expedition: ${s.name}`, category: 'surface', target: s.body,
    briefing: s.blurb, objective: `Land at ${s.name} on ${SURFACE_BODIES[s.body].name} and complete every surface objective.`,
    tasks: [
      { text: `Land at ${s.name} (travel to ${SURFACE_BODIES[s.body].name}, then 🧑‍🚀 Land)`, event: 'surface:land', target: s.id },
      { text: `Complete every objective at ${s.name}`, event: 'surface:complete', target: s.id }
    ],
    reward: { xp: s.reward.xp, badge: s.badge || undefined }
  })),

  // Simulation challenges
  ...[
    ['orbit', 'Orbit Architect', 'Create both a circular and an elliptical orbit in the Orbital Mechanics Simulator.', 'orbit-architect'],
    ['rocket', 'Launch Director', 'Successfully launch a mission to the Moon, Mars or Venus in the Rocket Launch Simulator.', 'rocket-scientist'],
    ['habitability', 'World Builder', 'Design potentially habitable worlds around two different star types.', 'life-finder'],
    ['telescope', 'Light Seeker', 'Complete every observation request in the Telescope & Light Simulator.', 'light-seeker'],
    ['blackhole', 'Event Horizon', 'Complete the three light-bending challenges in the Black Hole Simulator.', 'horizon-walker']
  ].map(([sim, name, objective, badge]) => ({
    id: `sim-${sim}`, name, category: 'sim', briefing: 'Laboratory time, Cadet. Theory becomes intuition when you experiment.', objective,
    tasks: [{ text: 'Open the simulator from the Lab', event: 'sim:open', target: sim }, { text: 'Complete its challenge', event: 'sim:complete', target: sim }],
    reward: { xp: 180, badge }
  })),

  // Quiz / knowledge missions
  {
    id: 'scholar', name: 'Archive Scholar', category: 'quiz', briefing: 'History is mission data too. Study the Space Mission Archive.',
    objective: 'Pass the quizzes of 3 missions in the Space Mission Archive.',
    tasks: [{ text: 'Earn 3 mission files from Archive quizzes', computed: p => [Math.min(3, p.files.length), 3] }],
    reward: { xp: 150, badge: 'archivist' }
  },
  {
    id: 'deepsky', name: 'Deep Sky Surveyor', category: 'quiz', briefing: 'Look beyond the solar system with the Celestial Explorer.',
    objective: 'Discover 5 objects in the Celestial Explorer.',
    tasks: [{ text: 'Discover 5 Explorer objects', computed: p => [Math.min(5, p.discovered.length), 5] }],
    reward: { xp: 150, badge: 'deep-sky' }
  },
  {
    id: 'scale', name: 'Sense of Scale', category: 'quiz', briefing: 'The game view enlarges planets and squeezes distances. Learn what the real solar system looks like.',
    objective: 'Open the true-scale Compare tool and the System Map.',
    tasks: [{ text: 'Open the Compare (true scale) tool', event: 'compare:open' }, { text: 'Open the System Map (M)', event: 'map:open' }, { text: 'Change the simulation speed (Shift / Ctrl or + / −)', event: 'speed:change' }],
    reward: { xp: 100 }
  }
];

export const MISSION_MAP = Object.fromEntries(MISSIONS.map(m => [m.id, m]));

export const CATEGORY_LABELS = {
  story: 'Main Story', planet: 'Planet Exploration', moon: 'Moon Missions', surface: 'Surface Expeditions', sim: 'Simulation Challenges', quiz: 'Knowledge Missions', daily: 'Daily Challenge'
};

export function planetMissionsDone(p) {
  return MISSIONS.filter(m => m.planetMission && p.missions[m.id] === 'complete').length;
}

// ---------- Daily challenge (deterministic per calendar day) ----------
const DAILY_POOL = ['mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'io', 'europa', 'ganymede', 'titan', 'enceladus', 'triton', 'pluto', 'ceres', 'callisto', 'phobos', 'charon', 'sun'];
export function dailyMission(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const id = DAILY_POOL[h % DAILY_POOL.length];
  const b = BODY_MAP[id];
  return {
    id: `daily-${key}`, dailyKey: key, name: `Daily: ${b.name} Check-in`, category: 'daily', target: id,
    briefing: `Today's observatory request: confirm the latest readings from ${b.name}.`,
    objective: `Travel to ${b.name} and pass its knowledge check today.`,
    tasks: [
      { text: `Travel to ${b.name}`, event: 'arrive', target: id },
      { text: `Pass the ${b.name} knowledge check`, event: 'quiz:pass', target: id }
    ],
    reward: { xp: 90 }
  };
}

// ---------- Badges ----------
const done = (p, id) => p.missions[id] === 'complete';
export const BADGES = [
  { id: 'flight-certified', name: 'Flight Certified', icon: '🛰️', desc: 'Completed Cadet Orientation.' },
  { id: 'home-world', name: 'Home World', icon: '🌍', desc: 'Surveyed Earth.' },
  { id: 'lunar-recon', name: 'Lunar Recon', icon: '🌕', desc: 'Surveyed the Moon.' },
  { id: 'red-planet', name: 'Red Planet', icon: '🔴', desc: 'Surveyed Mars.' },
  { id: 'gravity-master', name: 'Gravity Master', icon: '🌀', desc: 'Completed the Gravity Trials.' },
  { id: 'mission-commander', name: 'Mission Commander', icon: '🎖️', desc: 'Completed three planet missions.' },
  { id: 'solar-observer', name: 'Solar Observer', icon: '☀️', desc: 'Surveyed the Sun.' },
  { id: 'gas-giant-guru', name: 'Gas Giant Guru', icon: '🪐', desc: 'Surveyed Jupiter and Saturn.', check: p => done(p, 'survey-jupiter') && done(p, 'survey-saturn') },
  { id: 'ice-giant', name: 'Ice Giant Explorer', icon: '🧊', desc: 'Surveyed Uranus and Neptune.', check: p => done(p, 'survey-uranus') && done(p, 'survey-neptune') },
  { id: 'ocean-worlds', name: 'Ocean Worlds', icon: '🌊', desc: 'Surveyed Europa, Enceladus and Titan.', check: p => ['europa', 'enceladus', 'titan'].every(x => done(p, `survey-${x}`)) },
  { id: 'grand-tour', name: 'Grand Tour', icon: '🧭', desc: 'Completed all eight planet missions.', check: p => ['survey-mercury', 'survey-venus', 'homeworld', 'redplanet', 'survey-jupiter', 'survey-saturn', 'survey-uranus', 'survey-neptune'].every(x => done(p, x)) },
  { id: 'orbit-architect', name: 'Orbit Architect', icon: '⭕', desc: 'Mastered the Orbital Mechanics Simulator.' },
  { id: 'rocket-scientist', name: 'Rocket Scientist', icon: '🚀', desc: 'Completed a successful launch.' },
  { id: 'life-finder', name: 'Life Finder', icon: '🌱', desc: 'Designed habitable worlds.' },
  { id: 'light-seeker', name: 'Light Seeker', icon: '🔭', desc: 'Completed all telescope observations.' },
  { id: 'horizon-walker', name: 'Horizon Walker', icon: '🕳️', desc: 'Completed the Black Hole challenges.' },
  { id: 'lab-director', name: 'Lab Director', icon: '🧪', desc: 'Completed all six simulations.', check: p => ['gravity', 'orbit', 'rocket', 'habitability', 'telescope', 'blackhole'].every(s => p.sims[s]) },
  { id: 'archivist', name: 'Archivist', icon: '📁', desc: 'Earned 3 mission files.' },
  { id: 'historian', name: 'Space Historian', icon: '📜', desc: 'Earned 12 mission files.', check: p => p.files.length >= 12 },
  { id: 'deep-sky', name: 'Deep Sky Surveyor', icon: '🌌', desc: 'Discovered 5 Explorer objects.' },
  { id: 'card-collector', name: 'Card Collector', icon: '🃏', desc: 'Collected 20 knowledge cards.', check: p => p.cards.length >= 20 },
  { id: 'quiz-ace', name: 'Quiz Ace', icon: '🧠', desc: 'Scored 100% on 10 quizzes.', check: p => p.stats.perfectQuizzes >= 10 },
  { id: 'moonwalker', name: 'Moonwalker', icon: '👣', desc: 'Completed the Tranquility Base expedition.' },
  { id: 'lunar-driver', name: 'Lunar Driver', icon: '🚙', desc: 'Completed the Hadley–Apennine rover expedition.' },
  { id: 'ice-hunter', name: 'Ice Hunter', icon: '🧊', desc: 'Found water ice at the lunar south pole.' },
  { id: 'lunar-explorer', name: 'Lunar Explorer', icon: '🌕', desc: 'Completed all three Moon expeditions.', check: p => ['tranquility', 'hadley', 'shackleton'].every(id => p.surface?.sites?.[id]?.complete) },
  { id: 'moon-hopper', name: 'Moon Hopper', icon: '🦘', desc: 'Completed expeditions on 5 different moons.', check: p => new Set(SITES.filter(s => p.surface?.sites?.[s.id]?.complete).map(s => s.body)).size >= 5 },
  { id: 'far-walker', name: 'Far Walker', icon: '🧑‍🚀', desc: 'Completed every surface expedition.', check: p => SITES.every(s => p.surface?.sites?.[s.id]?.complete) },
  { id: 'daily-devotee', name: 'Daily Devotee', icon: '📅', desc: 'Completed 3 daily challenges.', check: p => p.stats.dailies >= 3 },
  ...CAREER_BADGES
];
export const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.id, b]));

// ---------- Ranks ----------
export const RANKS = [
  { xp: 0, name: 'Cadet' }, { xp: 300, name: 'Ensign' }, { xp: 800, name: 'Lieutenant' }, { xp: 1500, name: 'Lt. Commander' },
  { xp: 2500, name: 'Commander' }, { xp: 4000, name: 'Captain' }, { xp: 6000, name: 'Commodore' }, { xp: 9000, name: 'Admiral' }
];
export function rankFor(xp) {
  let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1];
  return { level: i + 1, name: cur.name, floor: cur.xp, next: next ? next.xp : null, pct: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}
