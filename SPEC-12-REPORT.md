# ASTRO LAB: 12-area spec, implementation report

The spec was written for Unity; ASTRO LAB is a three.js web game, so colliders are ray and box checks, Canvas sorting is CSS `z-index` plus `renderOrder`, prefabs are model builder functions. Backups: `backups/astro-lab-before-spec12-20261114-1434.tar.gz` (before item 1) and `backups/astro-lab-before-spec7-12-20261114-1646.tar.gz` (before items 7 to 12). Nothing was pushed to GitHub.

Testing: every Career scene was loaded in the browser and run without errors; the missions touched by items 6 to 12 were played start to finish through the real interaction code with `tools/career-harness.js` (open `dev.html`, then `const H = await import('/tools/career-harness.js')`). `index.html` and `astro-lab-standalone.html` were rebuilt with `tools/build/build.py`.

## Items 1 to 6 (previous thread)

1. **Hand pickup**: first-person hands (`engine/hands.js`) with idle, reach, grab, hold, release, drop and grip; focus outline on the target; prompts; pickable vs fixed categories; hold offsets per item.
2. **Skip**: Skip button and X / Backspace / gamepad B on every conversation and cinematic ride (`engine/dialogue.js`, `ui/hud.js`), progression kept.
3. **Render order**: `engine/layers.js` bands and `auditScene`, separate first-person pass, CSS z-index bands. Convention: `docs/RENDER-LAYERS.md`.
4. **Space suit, car, building**: rebuilt suit parts, car body/wheels/doors/interior, training-centre building (`models/suit.js`, `models/outdoor.js`).
5. **Pickup/drop glitches**: safe drop spot search, throw with landing, backpack, line-of-sight pickup, socket checks, recovery of lost mission items (`engine/carry.js`, `engine/interact.js`).
6. **Weightless training**: third handrail anchored, every rail mounted, grab feedback; whole course flown in a test (`engine/float.js`, `scenes/lowg.js`).

## 7. Emergency drill (`scenes/emergency.js`, `models/humans.js`, `engine/audio.js`, `engine/carry.js`)
Crew are complete rigs in flight suits that walk, wear masks and evacuate without clipping. The extinguisher is never used automatically: pick it up from its bracket (E), aim, hold F / left mouse / RT to spray; it has limited fuel, a spare, spray particles and sound, and only the fire responds. **Tested**: full fire drill to "crew safe"; waiting without spraying does not put the fire out.

## 8. Survival and teamwork (`scenes/survival.js`, `models/outdoor.js`, `models/props.js`)
The floating sign is now a board on two posts set in the sand, with a collider. Tent poles are 2.2 m with easy-to-aim hit boxes; the shelter is a full lean-to tent (canopy, closed sides, ridge rope, guy ropes, stakes, ground sheet) with side and back collision. Tomas sits on the sand instead of being sunk 45 cm into it. The rescue helicopter is a complete model (fuselage, glazed cockpit, tail boom, fins, main and tail rotors, skids, sliding door) that flies in, lands on its skids, spins down, opens its door, gets a collider, and you board it with your crew. Rocks are kept out of the play area. **Tested**: whole mission start to finish.

## 9. Eye test (`ui/eyeTest.js`, `scenes/medical.js`)
Cause: it was a single multiple-choice question about an unreadable chart, recorded even when wrong. Now a tumbling-E test from the blue line: instructions, one letter at a time getting smaller (6/60 to 6/6), answer with arrows / WASD / buttons / touch, "Can't see" to skip, a time limit per letter, right/wrong feedback, 2 of 3 to pass a line, retry, and the result saved only when 6/12 or better is read. **Tested**: wrong answers, skip, keyboard, clicks, timeout, close without finishing, retry, pass.

## 10. Health and neuroscience (`scenes/medical.js`, `css/career.css`, `engine/audio.js`; `ui/brainViewer.js` deleted)
* **10A** Migraine Trigger Lab: six stations (flickering tube, loudspeaker, solvent, 3-hour-sleep bunk, basil plant, warm lamp). Each one shows its effect (light, sound, haze, heavy eyes) and Ivan reacts; you decide trigger or harmless with feedback; three triggers needed.
* **10B** Light Sensitivity Sim: a desk area with a flickering tube, direct sunlight, a full-brightness screen and a glossy whiteboard. Discomfort meter, soft glare and blur; fix each source (steady LED, close blind, dim screen, matte cover); a decoy lamp gives feedback. Warning first, "Effects off" mode, no strobing (slow pulse under 1 Hz).
* **10C** Hydration Challenge: meter from 40% to 100%; bottle to fill at the dispenser and drink (F); coffee, salty crisps and an exercise bike lower it with warnings; dehydration warning state; saved with the scene.
* **10D** CO2 lady (Commander Arden): was standing 12 cm in the air; now sits on the cot edge, holds her head while CO2 is high, and recovers as CO2 falls after you swap the scrubber fan yourself.
**Tested**: whole module start to finish including the quiz fail and retry.

## 11. Greenhouse and life support (`scenes/greenhouse.js`, `scenes/assembly.js`)
* **11A** Greenhouse: plant the seedling trays in the beds and water both beds (fill the can at the tank; overwatering and empty-can feedback). Life support: service the air unit: fans off at the breaker, remove the saturated CO2 cartridge, bin it, fit the new one, fans on; failures for opening a running unit, restarting with no cartridge and refitting the old one.
* **11B** Hands-on assembly of the grow-light rack (2 LED panels, driver, light sensor) and the air unit (fan, heater, CO2 cartridge, O2 sensor): parts on a workbench, ghost outline in each slot, wrong parts rejected with a reason, snap with sound, progress panel, decoy parts, saved progress.
* **11C** Colliders for the dome walls, a walk-through airlock with an auto-opening door, tanks, beds, benches, bins; the glass dome blocks using things through it; small parts have enlarged hit boxes.
**Tested**: build, both assemblies, service, planting, growth, harvest and report.

## 12. Robotic arm (`scenes/robotics.js`)
* **12A** Six views (workstation, gripper close-up, arm camera, top-down, side, overview) with buttons, V / B keys, a label showing the current view and smooth 0.5 s transitions.
* **12B** Hit volumes along every boom, the wrist and the hand, checked against the truss, module, solar arrays, the cargo ship and the arm itself; the payload is checked too; the snares may touch only the grapple fixture; the arm never gets stuck when contact starts from drift.
* **12C** Wider joint ranges (base yaw ±270°, wrists ±170°), longer booms (the port could not be reached with the hand pointing down), speed that ramps up while held, limit message, angle bars on every joint button and a dashed guide line that turns green when lined up.
**Tested**: approach, capture, E-STOP drill and berth through the real controls (the capture used base yaw −250°, outside the old ±149° range).

## What is left
* Items 1 to 5 were tested by the previous thread scene by scene; this pass only load-tested those scenes.
* The emergency drill's depressurisation variant was not replayed after the latest changes (the fire variant was).
* Collisions in the robot arm count as mistakes; a careful player gets few, a careless one many. Tune `collided` if it feels harsh.
