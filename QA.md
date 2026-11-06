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

## Career Mode, Phase 1: foundation (2026-11-05)

Tested in headless Chromium (Playwright) at desktop 1366×820 and iPhone 13 (390×844, touch), on both `dev.html` and the single-file `index.html` opened from `file://`. Movement, looking, crouching, picking up, rotating, placing, talking and door use were all done with real keyboard, mouse, touch and (simulated) gamepad input.

| # | Check | Result | How it was checked |
|---|---|---|---|
| C1 | New main menu: New Game, Resume (only with a career save), Training Modules, Free Explore, Mission Archive, Space Logbook, Achievements, Settings, Credits, Quit | ✅ Pass | Every item opened; Resume hidden on a fresh save and shown after New Game; Quit shows the "safe to close" screen and returns to the menu |
| C2 | New Game → difficulty → Controls Practice | ✅ Pass | Picked Hard; difficulty saved to settings; scene loads with objectives |
| C3 | Controls Practice play-through | ✅ Pass | Look, walk to ring, blocked when standing at the tunnel (x stayed at 0.65), crouch through, pick up crate, wrong-way placement refused with a message and logged as a mistake, rotate, place, talk to Instructor Okafor with a dialogue choice, open door → results card 92/100 with mistake, science and +50 XP |
| C4 | Save and resume | ✅ Pass | Reload mid-scene → Resume puts the player back at the same spot (0.00 m difference) with the same objectives; finishing the tutorial records the score and moves the career to Chapter 1 |
| C5 | Practice runs don't touch the story | ✅ Pass | Replay from Training Modules starts fresh; the story save's scene and position are unchanged |
| C6 | Settings | ✅ Pass | Invert Y flips pitch (+0.11 rad for the same drag); colourblind mode switches palette; music/SFX volume sliders, text speed, subtitles, sensitivity, control scheme and Ultra quality all save |
| C7 | Phone layout and touch | ✅ Pass | Joystick moved the player 6.6 m in 3 s; dragging the view turned 0.42 rad; touch buttons visible; no horizontal overflow on menu or game |
| C8 | Gamepad | ✅ Pass | Left stick moved, right stick turned, Start opened the pause menu |
| C9 | Existing features unchanged | ✅ Pass | Solar System Missions (briefing → game), Surface Expeditions (land at Tranquility Base, lift off), Simulation Lab and Mission Archive all work from Free Explore |
| C10 | No errors | ✅ Pass | No page or console errors in any run |

Known limits: the instructor model is simple; people get a detail pass in Phase 2 with Bug and Cat. Real-GPU frame rate and physical phones are still unmeasured.

## Career Mode, Phase 2: Chapter 1, Home (2026-11-05)

| # | Check | Result | Notes |
|---|---|---|---|
| C11 | New Game starts Chapter 1 in the bedroom | ✅ Pass | Wake lying in bed looking at the ceiling stars; alarm beeps with a caption |
| C12 | Name screen | ✅ Pass | "Nova 7!" refused ("letters and numbers only"), button disabled; "Nova7" accepted; over 9 characters refused; the name appears in dialogue and the letter |
| C13 | Bedroom → stairs → living room | ✅ Pass | Switch off alarm, get-up animation, open bedroom door, walk down the stairs (floor height follows the steps), "Go downstairs" ticks at the bottom |
| C14 | Bug and Cat, envelope, letter | ✅ Pass | Dialogue with choices; Cat turns and holds out the envelope; take it, open it (flap, letter slides out), letter "Dear Nova7"; letter re-opens with L and the ✉ button |
| C15 | Resume mid-chapter | ✅ Pass | Reload after reading the letter → Resume returns to the living room with the same steps done and the letter still in the inventory |
| C16 | Car ride | ✅ Pass | Seated in the back, limited head turn, suburb → highway → campus scenery, oncoming cars, three conversations, car stops at the centre; pausing stops the car |
| C17 | Arrival and chapter end | ✅ Pass | Doors stay shut until you say goodbye; doors slide open; "Chapter complete" card with +100 XP and the Accepted! badge; Resume then explains Chapter 2 is next |
| C18 | No errors | ✅ Pass | No page or console errors in the runs |

## Career Mode, Phases 3 to 8: training centre to launch (2026-11-05)

Each scene was played start to finish in headless Chromium with a scripted player (`FAST` mode: the script calls the same "use" action that pressing E does, instead of walking there, so the slow software renderer doesn't time out). Results card, score, mistakes and save were checked at the end of every run, and the player was returned to the training centre hub. Scores below are from those runs; mistakes listed are ones the script made on purpose or by picking answers blindly.

| # | Check | Result | Notes |
|---|---|---|---|
| C19 | Phase 3: security, check-in, astronaut ID, safety rules, agreement, hub | ✅ Pass | ID creator (face, hair, eyes, glasses), ID card shown with 🪪 button; Resume now returns to the hub for every later chapter |
| C20 | Spacesuit Preparation | ✅ 92–100 | Inspection tray finds the damaged part, reject bin gives a spare, the stand refuses parts out of order, rings lock, leak check at 4.3 psi. Badge: Suit Specialist |
| C21 | Equipment Inspection | ✅ 100 | Six items, faulty ones tagged Unserviceable, log signed. Badge: Equipment Inspector |
| C22 | Mobility Course | ✅ 92 | Gates, crouch tunnel (blocked unless crouched), steps and ramp, sample carry and drop |
| C23 | Reduced-Gravity Handrails | ✅ 100 | Grab rail, push off, four rings, stop at the hatch; arriving too fast is a mistake |
| C24 | Neutral Buoyancy Pool | ✅ 100 | Weight trim modal, handrails, four bolts, box swap, OK sign. Badge: Zero-G Trainee |
| C25 | Emergency Response | ✅ 100 | Tested fire, rapid depress and ammonia cards; hatch must be closed from the Node side; oxygen-mask view |
| C26 | Equipment Management | ✅ 68 | Lockers, inventory quiz, EVA bag under the mass limit (the script deliberately overpacked and mis-stowed) |
| C27 | Survival & Teamwork | ✅ 100 | Plan, first aid, shelter, signal panel and beacon, water sharing, helicopter pickup |
| C28 | Greenhouse (GREENHOUSE-01) | ✅ 82 | Store with budget, 11-step build, regolith processing, two crops, live control panel, faults with a full and a cheaper fix, water recycler filter, 6 crop stages, harvest, report quiz. Badges: Greenhouse Engineer, Life-Support Tech |
| C29 | Health & Neuroscience | ✅ 100 | Blood pressure, eye chart (must stand on the line), 5-second balance board, rotatable 3D brain (6 of 9 parts), Commander Arden scenario with the CO₂ clue, 5-question check. "Confirmed" vs "still being researched" labels and "not medical advice" note on every panel. Badge: Medical Observer |
| C30 | Spacecraft Systems | ✅ 100 | Power-up order enforced, 3–5 drills (master alarm, caution & warning panel, correct fix switch), comms check |
| C31 | Robotic Arm | ✅ 92 | Per-joint control, precision mode, three cameras, capture by grapple pin, E-STOP drill, berth at the port. Badge: Robotic Arm Operator |
| C32 | EVA / Spacewalk | ✅ 97 | Suit check, 5-step airlock depress, tether anchors, momentum, antenna swap, repress. Badge: EVA Ready |
| C33 | Launch Day | ✅ 92 | Crew room, medical, weather, suit-up, van to the pad, five buckles, comms check, countdown with GO/NO-GO poll (and random hold), liftoff, ascent callouts, circularisation burn, orbit operations (system alerts for power, O₂, pressure, temperature, comms, navigation and a roll-stability manoeuvre). Labelled "simplified". Badges: Launch Candidate, Junior Astronaut, then hands over to the solar-system game |
| C34 | No errors | ✅ Pass | No page or console errors in any of the 15 runs after the fixes below |


Fixes made while testing:
* Greenhouse: the crop picker opened on top of Dr. Osei's last line, which paused the mission until the line was closed. It now waits for the conversation to end.
* Training centre: after registration, the dashboard screen on the wall threw an error and the "Open the dashboard" button did nothing. Fixed.
* Emergency drill: the oxygen mask now darkens the edge of the view, as intended.

## Career Mode, Phase 9: the spec's 20-item QA checklist (2026-11-05)

| # | Spec item | Result | Evidence |
|---|---|---|---|
| 1 | The game loads without errors | ✅ Pass | `dev.html` and the single-file `index.html` from `file://`, desktop and phone; no page or console errors |
| 2 | Main menu appears and every option works | ✅ Pass | C1 (New Game, Resume, Training Modules, Free Explore, Archive, Logbook, Achievements, Settings, Credits, Quit) |
| 3 | New Game starts the story | ✅ Pass | C2, C11 |
| 4 | Resume loads a previous save | ✅ Pass | C4, C15, and resume after registration (C19) |
| 5 | Settings changes apply | ✅ Pass | C6 |
| 6 | Valid name of up to 9 characters | ✅ Pass | C12: symbols and 10+ characters refused |
| 7 | Walk from bedroom to living room | ✅ Pass | C13 |
| 8 | Bug and Cat speak naturally and congratulate the player | ✅ Pass | C14 |
| 9 | Pick up, open and read the NASA envelope | ✅ Pass | C14 |
| 10 | Car journey and arrival | ✅ Pass | C16, C17 |
| 11 | Registration, ID creation and briefing | ✅ Pass | C19 |
| 12 | Every training exercise is interactive and completable | ✅ Pass | C20–C27 |
| 13 | Greenhouse build, planting, environment control, water recycling, harvest | ✅ Pass | C28 |
| 14 | Health scenario, brain model, medical records, knowledge test | ✅ Pass | C29 |
| 15 | Spacecraft systems, robotics and EVA are player-controlled | ✅ Pass | C30–C32 |
| 16 | Launch sequence with the player doing the checks | ✅ Pass | C33 (suit, harness, comms, GO/NO-GO, ascent callouts) |
| 17 | Post-launch spacecraft monitoring and controls | ✅ Pass | C33: circularisation burn, six-system alerts, roll stabilisation |
| 18 | Progress, inventory, badges and greenhouse state save | ✅ Pass | Every run checked the saved training record and badges; letter and ID stay in the inventory after resume; the greenhouse keeps crops, day, systems and faults in its saved scene state and rebuilds the plants on resume (code path checked; a mid-greenhouse reload was not run) |
| 19 | Desktop, tablet and mobile | ✅ Pass (emulated) | Desktop 1366×820 and 960×600; Pixel 7 touch emulation on the single-file build: no horizontal overflow on the greenhouse store, robotic-arm panel, 3D brain or orbit operations. Not tried on physical devices |
| 20 | No placeholder buttons, dead ends, broken controls or unfinished features | ✅ Pass | Every module in Training Modules now has a scene; the old "next build" note is gone; the launch ends by handing over to the solar-system game |

Known limits: frame rate on real GPUs and physical phones is still unmeasured (the test browser renders 3D in software at 5–8 fps). Gamepad was checked in Phase 1 only; the new panels (arm, orbit operations) are mouse, keyboard and touch.
