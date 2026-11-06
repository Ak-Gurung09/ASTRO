# ASTRO LAB

An interactive astronomy and space-exploration game for the browser. You play an **Astro Lab Cadet** who flies around a 3D solar system, completes missions, scans planets, passes knowledge checks, runs six physics simulations, studies real space missions and earns XP, ranks, badges and knowledge cards.

Everything runs locally with no build step and no network. Three.js is bundled in `vendor/`, and all planet textures are generated procedurally at load time, so there are no image files to go missing.

---

## 1. Run it locally

**`index.html` is a self-contained build.** Double-click it, or upload the folder to GitHub Pages or any web host, and it plays. No server is needed.

To edit the source, work on `dev.html` and the `js/` and `css/` folders. `dev.html` loads ES modules, so serve it over `http://` (for example `python3 -m http.server 8000`, then open http://localhost:8000/dev.html). To rebuild `index.html`, bundle `js/main.js` with esbuild (`--bundle --format=iife`) and inline the bundle and `css/style.css` into `dev.html`. `astro-lab-standalone.html` is a copy of the same build.

Supported browsers: current Chrome, Edge, Firefox and Safari (desktop, iPad and phones). WebGL is required for the 3D view. If WebGL is missing, the game says so and the Archive, Explorer and Simulation Lab still work.

Progress saves automatically to `localStorage` on the device. You can wipe it with **Settings → Reset progress**.

---

## Graphics and animation (Phases 3 and 4)

* **Astronaut**: a fully jointed suit (hips, spine, shoulders, elbows, knees, ankles) with a gold reflective visor, life-support pack, chest control box, hoses and quilted fabric. The animator blends idle breathing, a walk whose stride is tied to distance (no foot sliding), the low-gravity "lope" hop (cadence follows the world's gravity), crouch, jump, landing squash, sliding and the seated driving pose.
* **Movement**: the astronaut turns smoothly and leans into turns instead of snapping, the camera drifts behind you while you walk or drive, and the field of view widens a little at speed.
* **Footprints and tracks**: ribbed boot prints and rover wheel tracks stay on the ground and follow the slope; when the pool of marks is full the oldest ones are recycled. Boots and wheels kick up soft, fading dust.
* **Models**: rounded, textured rover with wire-mesh tyres, fenders and independent suspension that follows the ground under each wheel; crinkled gold foil on the Lunar Module and lander; fractured, noise-displaced rocks with a grain texture; reflections from a small environment map built from each world's own sky.
* **Ground**: the surface grain is sampled at three scales so the terrain no longer shows a repeating tile.
* **Solar system**: the Sun boils (animated granulation with limb darkening), rocky and icy worlds have surface relief that shows along the terminator, Earth's oceans glint in the Sun and its cities glow on the night side.
* **Real moon maps (Phase 4)**: all ten moons use real global maps instead of generated ones: the Moon (LRO camera data), Phobos, Io, Europa, Ganymede, Callisto, Titan, Enceladus, Triton and Charon. The maps are embedded in the game (about 1 MB), so it still works offline and from a double-clicked `index.html`. If a map fails to decode, that moon keeps its generated texture. Sources, authors and licences are in `textures/moons/CREDITS.md` and in **Help → Image credits**. Two of the maps (Moon and Callisto) are CC BY-SA.

## Career Mode (astronaut training story)

The main menu leads with **New Game**: a first-person story where you train as an astronaut candidate, from your bedroom to your first orbit. Everything from earlier phases is still here under **Free Explore** (Solar System Missions, Surface Expeditions, Simulation Lab, Celestial Explorer).

**Story outline**
1. **Home.** Wake up, choose your name (1–9 letters or numbers), go downstairs to Bug and Cat, open the NASA acceptance letter, ride to the training centre.
2. **Training centre.** Security, check-in, create your astronaut ID, safety rules and the trainee agreement. The hub then unlocks each module in order.
3. **Physical training (8 exercises).** Spacesuit Preparation, Equipment Inspection, Mobility Course, Reduced-Gravity Handrails, Neutral Buoyancy Pool, Emergency Response, Equipment Management, Survival & Teamwork.
4. **Space Greenhouse (Mission GREENHOUSE-01).** Buy parts on a budget, build it in 11 steps, process lunar regolith, plant two crops, run the live control panel, fix faults, recycle water, harvest and report.
5. **Health & Neuroscience.** Baseline checks, a rotatable 3D brain, a lunar medical scenario and a knowledge check. Every fact is labelled "confirmed" or "still being researched". For learning only, not medical advice.
6. **Spacecraft Systems, Robotic Arm, EVA.** Power up a cockpit and handle fault drills; drive a six-joint arm to capture and berth cargo; go outside on a tether to replace an antenna.
7. **Launch Day (simplified).** Final checks, suit-up, ride to the pad, strap in, countdown and GO/NO-GO poll, liftoff, ascent callouts, an orbit burn, then orbit operations (system alerts and a roll-stability manoeuvre). You graduate as a Junior Astronaut and the story hands you over to the solar-system game.

Every exercise ends with a score, your mistakes, the science behind it, XP and badges. **Training Modules** replays any unlocked exercise as practice without touching the story. Difficulty (Easy, Normal, Hard, Realistic) changes budgets, time limits, quiz options, tolerances and how many faults happen at once.

Career code lives in `js/career/` (engine, state, data, models, scenes, ui). Career progress is saved inside the same save as everything else (`progress.career`), so XP and badges are shared. To rebuild `index.html` after editing: `python3 tools/build/build.py .` (needs esbuild).

### Career controls
| Keyboard & mouse | Touch | Gamepad | Action |
|---|---|---|---|
| W A S D / arrows | Joystick | Left stick | Walk |
| Mouse (click the view first) | Drag the view | Right stick | Look |
| Shift (hold) | » Jog | R3 | Jog |
| C / Ctrl (hold) | ⤵ Crouch | L3 | Crouch |
| E / Enter | ✋ Use, or tap the object | A | Use, pick up, place, talk |
| R / Q | ⟳ Rotate | X | Rotate held item |
| G | ⤓ Drop | Y | Put item down |
| L | ✉ button | — | Re-read your acceptance letter |
| 1–4, Space | Tap a choice | D-pad, A | Dialogue |
| H | ❔ | Back | Controls guide |
| Esc | ❚❚ | Start | Pause |

**Special training controls**
| Where | Controls |
|---|---|
| Floating (low-g, pool, EVA) | Look at a handrail and press E to grab it. Hold W (or push the joystick forward) to push off where you look; Shift pushes harder. With nothing in view, E reels in your tether |
| Pool | ⚖ button: trim your weight pockets |
| Robotic arm | 1–6 pick a joint, W/S or ↑/↓ move it, P precision, V camera, C capture/release, Space E-STOP. Touch: the arm panel |
| Cockpit and launch | Point at a switch or button and press E (or tap it) |
| Orbit burn | Hold the 🔥 button at the top of the orbit |
| Orbit roll | Hold Q / E (or ← / →, or the on-screen buttons) to fire thrusters against the roll |

---

## 2. Gameplay summary

| Area | What you do | Rewards |
|---|---|---|
| **3D Solar System** | Fly around the Sun, 8 planets, Ceres, Pluto and 10 major moons. Select a world, **Travel** to it, run a **Scan**, then pass its **Quiz** | XP, knowledge cards, mission progress |
| **Missions** | 6 story missions, 9 planet/dwarf surveys, 9 moon surveys, 5 simulation challenges, 3 knowledge missions and a **daily challenge** that changes each day | XP, 23 badges, cards |
| **Simulation Lab** | Gravity, Orbital Mechanics, Rocket Launch, Habitability, Telescope & Light, Black Hole. Each one has instructions, working controls, a goal list and a science explainer | 150 XP + badge each |
| **Mission Archive** | 23 real missions (NASA, ESA, JAXA, ISRO, CNSA, SpaceX…) with timelines, discoveries and status. Pass a quiz to unlock the mission file | XP, mission files, Archivist/Historian badges |
| **Celestial Explorer** | 54 objects in 11 categories, with search, category filters and sorting. **Discover** an object, then take its challenge | XP, knowledge cards |
| **Surface Expeditions** (Phase 2) | Land on a moon and explore it on foot in 3D: walk, lope, jump, drive a rover, collect real samples, run scans and do the hammer–feather drop. 3 Moon sites plus 8 other moons | XP, 6 new badges, 11 expedition missions |
| **Space Logbook** | Rank, XP, badges, knowledge cards, mission files and a timestamped log | — |

**Ranks:** Cadet → Ensign (300 XP) → Lieutenant (800) → Lt. Commander (1,500) → Commander (2,500) → Captain (4,000) → Commodore (6,000) → Admiral (9,000).

### Scientific accuracy and scale
* Physical data (distance, periods, diameter, mass, temperature, atmosphere, moons) comes from NASA planetary fact sheets and NASA/ESA mission pages. Moon counts are as of 2025.
* **Orbital periods are real.** Starting positions use each planet's J2000 mean longitude, so planets sit roughly where they are today (circular orbits drawn in one plane, so this is an approximation, not an ephemeris).
* **Sizes and distances are not to scale.** A permanent HUD notice says so, and the 📏 **Scale** tool shows true relative diameters and true linear distances.
* Time runs as a labelled time-lapse ("1 s = 5 days"). Very fast moon orbits and planet spins are slowed for comfortable viewing, and the Help screen says so.
* Each simulation states its simplifications (for example, the black-hole sim uses a non-rotating Schwarzschild model).

### Surface Expeditions (Phase 2)
Open a moon's info panel, **Travel** there, then press **🧑‍🚀 Land**. You can also use **Surface Expeditions** on the main menu. Earth's Moon comes first and has the most detail.

| Site | Real location | What's real | Gameplay |
|---|---|---|---|
| **Tranquility Base** | Apollo 11, 0.67°N 23.47°E | Eagle descent stage, flag, laser retroreflector and seismometer near their positions; Little West (33 m, 60 m east) and West crater (185 m); Earth 66° up in the west; Sun 14° up in the east | Story mission **One Small Step**: walk, jump, look at Earth, collect samples 10003/10017/10046/10084 |
| **Hadley–Apennine** | Apollo 15, 26.13°N 3.63°E | Hadley Rille (1.2 km wide, 300 m deep) 1.5 km west, Hadley Delta to the south, Mons Hadley on the horizon, Spur and Elbow craters, ALSEP, Fallen Astronaut memorial | Drive the Lunar Roving Vehicle (top speed 3.6 m/s), catch air, hammer–feather drop, collect the Genesis Rock (15415) and "Great Scott" (15555) |
| **Shackleton Rim** | Lunar south pole | 27° inner wall, Sun 1.5° above the horizon, permanently shadowed ground, Earth low on the horizon | Find the sunlit crest, descend into shadow (your helmet lamp turns on), scan for ice, take an icy core |
| Loki Patera (Io), Conamara Chaos (Europa), Harpagia Sulcus (Ganymede), Valhalla (Callisto), Huygens site (Titan), Tiger Stripes (Enceladus), Geyser field (Triton), Serenity Chasma (Charon), Stickney rim (Phobos) | Mission data from Galileo, Cassini/Huygens, Voyager 2 and New Horizons | Real gravity, escape velocity, temperatures, radiation dose, atmosphere, and the parent planet at its true angular size | Each site has 5–6 objectives |

**Physics:** every body uses its real surface gravity. Your push-off speed is the same on every world (0.5–1.8 m/s in a pressurised suit), so jump height and hang time follow from gravity, and the HUD compares each jump with Earth. Walking speed and grip scale with gravity, so low-g starts and stops are slow and you skid. Loose ground slides above about 33°. Dust moves in exact parabolas in vacuum but drifts in Titan's air. The rover's traction, top speed, airtime and slope limits follow the same rules. Phobos (0.0057 m/s²), Enceladus and Charon add a jetpack (40 m/s Δv) and a time-warp button. Phobos's escape velocity is only 11.4 m/s, so you can fly off it. On Io and Europa a dosimeter counts real radiation rates against NASA's 250 mSv 30-day limit.

**What's approximate:** the sizes of named features come from mission data, but their positions relative to each other are approximate. Small craters, rocks and pebbles are generated, not mapped. The Charon site is a representative location. Samples marked "predicted", such as the icy core, describe what instruments suggest is there.

**Surface controls:** W A S D or the joystick to move · Shift to lope · hold Space (or ⤒) to charge a jump · drag to look · wheel or pinch to zoom · E to collect a sample or board/leave the rover · R to scan · G for the drop test · M for the site map and traverse · V for first person · T for time warp · C or ⤓ for jetpack down · Esc to pause or lift off.

---

## 3. Mission Briefing content

> **CLASSIFIED · MISSION BRIEFING — ASTRO LAB**
> **Role:** Astro Lab Cadet
> **Your story:** You have joined ASTRO LAB, humanity's orbital observatory, to explore the solar system, investigate celestial objects, complete scientific missions and unlock the secrets of the universe.
> **Primary objective:** Explore planets, complete mission files, conduct simulations, answer quizzes and earn badges.
> **Early objectives:**
> 1. Complete basic flight and camera training
> 2. Explore Earth and the Moon
> 3. Visit Mars
> 4. Complete the Gravity Simulator challenge
> 5. Unlock the first Mission Commander badge
>
> Buttons: **BEGIN MISSION** · Skip Tutorial · ← Main menu. A warp transition then sweeps the camera into Earth.

---

## 4. Controls

### Mouse and keyboard
| Input | Action |
|---|---|
| Left-drag | Rotate the camera around the selected object |
| Mouse wheel | Zoom in and out |
| Right-drag (or Shift + drag) | Pan |
| Left-click | Select a planet, moon or label |
| W A S D / arrow keys | Move the camera |
| Q / E | Rotate left / right |
| Space | Pause / resume orbital motion |
| Shift (tap) | Faster simulation. Hold while moving to fly faster |
| Ctrl (tap) | Slower simulation. Hold while moving for fine movement |
| F | Focus / travel to the selected object |
| M | System Map |
| J | Mission Journal |
| H | Help & Controls |
| L | Space Logbook |
| Esc | Close the top menu, deselect, leave a panel, or open the pause menu |

### Touch (phone and tablet)
| Input | Action |
|---|---|
| One-finger drag | Rotate |
| Pinch | Zoom |
| Two-finger drag | Pan |
| Tap | Select an object or its label |
| Joystick (bottom-left) | Move |
| ❚❚ / − / + | Pause, slower, faster |
| 🎯 | Focus the selected object |
| Toolbar | Journal, Map, Scale, Lab, Archive, Explorer, Logbook, Help, Menu |

The **Cadet Orientation** mission is the interactive tutorial. A coach card walks through each control and shows the mouse and touch versions side by side.

---

## 5. Game flow

```
Loading (animated logo, texture generation)
   │
Main Menu ── Start Mission ──► Mission Briefing ── BEGIN MISSION ──► warp ──► 3D Solar System
   │            Continue ───────────────────────────────────────────────┘   (Cadet Orientation tutorial,
   │            Mission Archive ─┐                                              or Skip → Home World)
   │            Simulations ─────┼──► full-screen panel ── Back/Esc ──► where you came from
   │            Explorer ────────┘
   │            Settings (modal)
   │
3D Solar System ─ Select ► Travel (F) ► Scan ► Quiz ─► XP / card / task ✓ ─► Mission Complete screen
   │               Toolbar: Journal · Map · Scale · Lab · Archive · Explorer · Logbook · Help · Menu
   └─ Story: Orientation → Home World → Lunar Recon → Red Planet → Gravity Trials → Mission Commander
```

The HUD always shows the **current objective**, its tasks, the **reward**, a ◆ target marker or edge arrow pointing at the target, a "Take me there" button, and Menu/Esc to get back out.

---

## 6. UI/UX design system

* **Palette:** background `#04050d`, navy `#0a1033`, glass panel `rgba(14,20,52,.62)` with a 14px blur, electric blue `#4f8cff`, cyan `#5ad8ff`, violet `#8b5cf6`, plus status colours good `#3fe0a0`, warn `#ffc857` and bad `#ff6b81`.
* **Type:** system UI font stack for speed and legibility. The wide-tracked gradient "ASTRO LAB" wordmark and uppercase cyan section labels carry the sci-fi tone. There are four text-size options.
* **Components:** glass panels (14px radius), primary gradient buttons, ghost buttons, chips, segmented controls, progress meters, toasts, modals with focus trap, tabbed info panel, list/detail panels.
* **Motion:** short fades, slide-ins, a pulsing primary CTA, a warp transition and mission-complete confetti. All of it respects `prefers-reduced-motion` and the in-game "Reduce motion" setting.
* **Responsive:** at 720px and below, the info panel becomes a bottom sheet, the tracker moves to the bottom, list/detail panels switch to one column with a back button, and the joystick appears on touch devices.
* **Accessibility:** keyboard-reachable controls, visible focus rings, `role="dialog"` modals with focus trap and Esc, ARIA labels on icon buttons, live regions for the tracker and status messages, min 40px touch targets, colour plus icon/text for every state.

---

## 7. Data structures (see `js/data/`)

```js
// solarSystem.js — one entry per body
{ id, name, type: 'star'|'planet'|'dwarf'|'moon', parent?, classification,
  vis: { radius, dist, tex, tilt },            // GAME scale only
  orbit: { au, periodDays, L0 } | { parentKm, periodDays },
  rotationHours, distanceFromEarth, discovery,
  data: { distance, orbitalPeriod, rotationPeriod, diameter, mass, temperature,
          atmosphere, moons, missions, significance, facts[] },
  quiz: [{ q, options[4], answer, explain }] }

// missions.js
{ id, name, category: 'story'|'planet'|'moon'|'sim'|'quiz'|'daily', target?, planetMission?,
  briefing, objective,
  tasks: [{ text, event, target?, count? } | { text, computed: progress => [n, total] }],
  reward: { xp, badge?, card? } }
BADGES: [{ id, name, icon, desc, check?(progress) }]   RANKS: [{ xp, name }]

// archive.js
{ id, name, agency, country, launch, objective, target, spacecraft, discoveries[],
  status, statusKind, timeline: [[date, event]], facts[], quiz[] }

// objects.js (deep sky)
{ id, name, category, classification, distance, distLy, size, discovery, physical,
  significance, facts[], missions, viz: {kind,...}, quiz[] }

// Player progress (localStorage 'astrolab.save.v1')
{ xp, badges[], cards[], files[], discovered[], scanned[], quizzesPassed[],
  missions: { [id]: 'active'|'complete' }, taskProgress: { [id]: number[] }, activeMission,
  sims: { [simId]: true, [simId+':goals']: [] }, log: [{ t, text, icon }], dailyDone: {},
  stats: { perfectQuizzes, quizzesTaken, dailies }, tutorialSeen, tutorialSkipped }
```

Missions are event-driven. Gameplay code calls `gameEvent('scan', { id: 'mars' })` and the mission engine (`js/systems/core.js`) advances every matching task. If you do a task for a mission you haven't started (for example, scanning Mars on your own), that mission starts automatically, so free exploration still counts.

---

## 8. Code structure

```
index.html            screens + HUD markup
css/style.css         design system and responsive layout
vendor/three.module.js   Three.js r169 (MIT)
js/main.js            boot, screen routing, keyboard, briefing, transitions
js/systems/core.js    event bus, safe storage, XP/badges/cards, mission engine
js/data/*.js          solar system, missions/badges/ranks, archive, deep-sky objects
js/scene/textures.js  procedural planet textures (3D noise sampled on the sphere)
js/scene/solarScene.js   Three.js scene, starfield, orbits, camera controller, picking, time
js/ui/dom.js          helpers, modal manager, toasts, WebAudio sound effects
js/ui/hud.js          profile, tracker, info panel, labels, guidance arrow, time bar, joystick, coach
js/ui/modals.js       quiz, journal, logbook, help, settings, map, true-scale compare, mission complete
js/ui/archive.js      Mission Archive + Celestial Explorer
js/ui/lab.js          Simulation Lab shell + shared sim widgets
js/sims/*.js          gravity, orbit, rocket, habitability, telescope, blackhole
js/data/surfaces.js   landing sites: real gravity, sky geometry, features, samples, objectives
js/surface/terrain.js heightfield built from craters/rilles/ridges, mesh, baked sun visibility
js/surface/models.js  astronaut, rover, Apollo LM, lander, flag, experiments
js/surface/surfaceGame.js  surface physics, rover, camera, objectives, HUD
js/ui/surface.js      landing-site picker and screen flow
```

---

## 9. QA checklist

See `QA.md` for the automated run (headless Chromium, desktop 1366×820 and phone 390×844).
