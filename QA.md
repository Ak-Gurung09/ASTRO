# ASTRO LAB — QA checklist (Phases 1 to 4)

I tested in headless Chromium (Playwright) at desktop 1366×820 and on an iPhone 13 profile (390×844, touch). The scripted runs used real mouse, keyboard and tap input wherever possible.

| # | Requirement | Result | How it was checked |
|---|---|---|---|
| 1 | Game loads without errors | ✅ Pass | No page errors or console errors in any run. The only console output was "GPU stall due to ReadPixels" warnings, which come from the test tool taking screenshots |
| 2 | Mission Briefing appears before gameplay | ✅ Pass | Start Mission → Briefing with role, story, objective, 5-item checklist, controls, BEGIN MISSION and Skip Tutorial |
| 3 | BEGIN MISSION starts the game | ✅ Pass | Warp transition → 3D view → Cadet Orientation tutorial starts with the coach card |
| 4 | Buttons, menus and navigation work | ✅ Pass | All 9 toolbar buttons, main menu items, Esc chain (modal → deselect → pause menu), Back from all panels |
| 5 | Camera rotate, zoom, pan, select, pause, move | ✅ Pass | Cadet Orientation completed from real drag, wheel, right-drag, W key, click and Space ×2 (+100 XP, Flight Certified badge) |
| 6 | Planet selection opens correct info | ✅ Pass | Earth, Mars, Saturn, Jupiter info panels with Overview / Data / Science / Missions tabs |
| 7 | Missions start, track, complete, reward | ✅ Pass | Home World, Lunar Recon, Red Planet Survey and Gravity Trials played through the UI. Mission Commander, the daily challenge and Archive Scholar were verified through the mission engine |
| 8 | Quizzes award XP and cards | ✅ Pass | Earth, Moon and Mars knowledge checks (+90 XP each, card), Voyager 1 archive quiz unlocked its mission file |
| 9 | Simulation Lab is interactive | ✅ Pass | Gravity challenge completed by real drag-launches (150 XP + badge). The other 5 sims opened, ran at about 50–60 fps and responded to their controls |
| 10 | Desktop / tablet / mobile layouts | ✅ Pass | Phone layout: bottom-sheet info panel, joystick, single-row toolbar, list/detail with back button, no horizontal overflow |
| 11 | No placeholder buttons or dead links | ✅ Pass | Continue is disabled with an explanation until a save exists, and it is the only disabled menu item |
| 12 | Playable if assets fail | ✅ Pass | There are no external assets: textures are generated in code. Each texture is wrapped in try/catch with a grey fallback. Without WebGL, the Archive, Explorer and Lab still work and show a clear message |
| — | Single-file build | ✅ Pass | `astro-lab-standalone.html` opened from `file://` reaches the 3D game with no errors |

## Phase 2: Surface Expeditions

| # | Check | Result | How it was checked |
|---|---|---|---|
| S1 | All 11 landing sites build and render | ✅ Pass | Each site was loaded on desktop, walked with W, then lifted off. No page or console errors. Build time in the headless test browser: 4–10 s |
| S2 | Land from the 3D game | ✅ Pass | Travel to the Moon → **🧑‍🚀 Land** in the info panel → site picker → Tranquility Base. Lift off returns to orbit with the Moon selected |
| S3 | Land from the main menu | ✅ Pass | **Surface Expeditions** → picker of all 10 bodies → Land. Lift off returns to the menu |
| S4 | Real gravity physics | ✅ Pass | Moon: loping top speed 2.23 m/s, full jump 1.01 m with 2.2 s hang time (the same push on Earth gives 0.17 m). Phobos: a gentle hop rose 24 m and took 3.1 min to land. The jetpack reached escape velocity (11.4 m/s), which triggered the rescue |
| S5 | Traction and stopping | ✅ Pass | At 1/6 g, stopping from a lope takes a little over 2 s (grip is 0.7 × g) |
| S6 | Hammer–feather drop | ✅ Pass | Moon: both fell 1.6 m in 1.35 s, landing together. Titan: hammer 1.55 s, feather 18.1 s because of the dense air |
| S7 | Rover | ✅ Pass | Board with E, accelerate to 3.6 m/s top speed, drive 205 m in 60 s, catch 0.97 s of air over bumps. Getting off is blocked above 0.6 m/s |
| S8 | Story mission **One Small Step** | ✅ Pass | All 6 Tranquility objectives done → mission complete modal, +300 XP, **Moonwalker** badge |
| S9 | Shackleton ice hunt | ✅ Pass | Crest → descend into shadow (100+ m below the rim, Sun blocked by the terrain) → scan shows the hydrogen/ice signal → icy core (refused in sunlight) → back to the crest |
| S10 | Phone layout | ✅ Pass | iPhone 13 profile: joystick, action buttons, collapsible objectives, no horizontal overflow. The joystick moved the astronaut |
| S11 | Single-file build | ✅ Pass | `astro-lab-standalone.html` opened from `file://` lands on the Moon with no errors |

## Phase 3: graphics and animation

| # | Check | Result | How it was checked |
|---|---|---|---|
| G1 | All 11 landing sites build, walk, jump and lift off with the new astronaut and effects | ✅ Pass | Each site loaded, walked and loped for 4 s of simulated time, then jumped. No page or console errors, no NaN in any joint |
| G2 | Walk, lope, jump, crouch and driving poses | ✅ Pass | Posed the rig directly and checked screenshots from the side and back. Feet stay on the ground, knees and elbows bend the right way |
| G3 | Footprints and rover tracks | ✅ Pass | 8 s of walking left ribbed prints on the slope; 20 s of driving left 600+ track marks. Pools recycle the oldest marks |
| G4 | Rover suspension and wheel spin | ✅ Pass | Wheel heights moved by about ±4 cm over bumps (limit ±15 cm); wheels spin in the driving direction |
| G5 | Smooth turning and camera follow | ✅ Pass | Turning right while walking turned the astronaut gradually (about 7 rad/s maximum); the camera swung behind within a few seconds |
| G6 | Solar system look | ✅ Pass | Screenshots of the Sun, Earth (day and night side), Moon, Mars and Jupiter |
| G7 | Phone layout and single-file build | ✅ Pass | iPhone 13 profile, no horizontal overflow, joystick moves the astronaut. The bundled `index.html` opens from `file://` and lands on the Moon |

## Phase 4: real moon maps

| # | Check | Result | How it was checked |
|---|---|---|---|
| M1 | All 10 moons load a real map | ✅ Pass | Boot reports the 10 ids as upgraded. Close-up screenshots of every moon in the 3D view, lit side towards the camera |
| M2 | Fallback to generated textures | ✅ Pass | With `moonMaps.js` blocked (404) the game boots and every moon keeps its generated texture. With one corrupted image only that moon (Io) falls back. A console warning is logged |
| M3 | Quality tiers | ✅ Pass | Low quality caps maps at 512 px wide; High uses 2048 for the Moon and the native size for the rest |
| M4 | Credits | ✅ Pass | Help → Image credits lists all 10 maps with source and licence, marking any that fell back to generated |

## Known limits
* The headless test browser renders WebGL in software (about 7 fps for the 3D view), so I could not measure real-GPU frame rate here. The 2D simulations ran at about 60 fps. Auto quality lowers the resolution if the frame rate drops below 40 fps.
* I didn't test on a physical phone or tablet. Touch was checked with Playwright's touch emulation.
* Orbits are circular and drawn in one plane.
* Surface rendering in the headless test browser runs at only 2–3 fps (software WebGL), so I tested surface physics by stepping the simulation directly. Frame rate on real devices is unmeasured. **Settings → Quality → Low** halves the terrain detail and turns off shadows for slow devices.
* Surface sites cover 1.4–6.6 km squares. Named features are sized from mission data, but their positions relative to each other are approximate.
