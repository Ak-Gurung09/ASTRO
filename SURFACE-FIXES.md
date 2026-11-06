# Surface Expeditions: bug-fix report (H1 to C7)

All 32 items in the bug report are fixed. No features were removed, and nothing new was added to the project's dependencies. The backup taken before any change is in `backups/astro-lab-pre-surface-bugfix-20261106-0721/`.

## 1. Files and systems changed

| File | What changed |
|---|---|
| `js/surface/collision.js` (new) | Pure-math collision helpers with no Three.js, so they can be tested in Node. It fits an ellipsoid to each rock mesh, builds each rock's collider from that instance's tilt, scale and burial, and provides rock-top height, sphere push-out, segment hits, and box push-out and hits. |
| `js/surface/surfaceGame.js` | Collision for the player, rover, camera and models; rover parking brake and lava boundary; Traverse accounting; collision refresh and safe spawn spots; jump and jetpack accounting; intro guards; objective ordering; input guards; pointer lock and mouse look; leak fixes; jet and exhaust particles; minimap; audio; help text. |
| `js/ui/surface.js` | Landing flow: Esc or the new "Cancel landing" button stops a landing that is still loading, and you return to wherever you launched from. The pause text reflects whether saving works. |
| `js/main.js` | Begin and Skip debounce, with Main menu and Esc cancelling the pending start. Tutorial-skip guard. H opens the surface controls during an expedition. The pause text reflects whether saving works. |
| `js/systems/core.js` | Saves are flushed when the page closes or is hidden. A failed write shows a warning instead of failing silently. Damaged saves are cleaned up before use. |
| `js/career/career.js` | The pause text reflects whether saving works. |
| `js/ui/dom.js` | New sounds: `step`, `land`, `jet`, `rover`, `bump`. |
| `index.html`, `astro-lab-standalone.html` | Rebuilt with `tools/build/build.py`. |
| `tools/test-collision.mjs` (new) | Node self-check for `collision.js`. Run it with `node tools/test-collision.mjs`. |
| `tools/surface-harness.js` (new) | Browser test harness used for the checks below. It is not part of the game bundle. |

## 2. Checklist

| ID | Status | ID | Status | ID | Status | ID | Status |
|---|---|---|---|---|---|---|---|
| H1 | ✅ fixed | M3 | ✅ fixed | L3 | ✅ fixed | L11 | ✅ fixed |
| H2 | ✅ fixed | M4 | ✅ fixed | L4 | ✅ fixed | L12 | ✅ fixed |
| H3 | ✅ fixed | M5 | ✅ fixed | L5 | ✅ fixed | L13 | ✅ fixed |
| M1 | ✅ fixed | M6 | ✅ fixed | L6 | ✅ fixed | L14 | ✅ fixed |
| M2 | ✅ fixed | M7 | ✅ fixed | L7 | ✅ fixed | C1 to C7 | ✅ all fixed |
| | | M8 | ✅ fixed | L8, L9, L10 | ✅ fixed | | |
| | | | | L1, L2 | ✅ fixed | | |

## 3. Each fix: what changed, and how it was checked

The verification runs drove the real game code in a browser at a fixed 1/120 s physics step (`tools/surface-harness.js`), on the source build. The rebuilt `index.html` was then smoke-tested.

**H1. Boulder hitboxes match the rocks.** In `buildRocks` and `collision.js`, each of the three rock meshes gets a least-squares ellipsoid fitted to its real vertices, leaving out the buried flat base. Each instance's collider then uses that rock's own rotation, non-uniform scale and sunken position. The player is three stacked spheres measured from the feet, so slopes are handled where the player stands. *Check:* 54 walk-ins on Hadley (big, tilted and medium rocks, 3 approach angles each) gave at most 1 mm overlap. A sweep of all 12 sites gave at most 2 mm, and no invisible walls above low rocks.

**H2. Every rock is solid and can be stood on.** The `scale > 0.7` filter is gone, so all 1,000 to 2,000 rocks per site have colliders. `supportAt` lets you stand on rock tops flatter than about 37°. Steeper rock is a wall, which stops you "stair-climbing" a rounded boulder. When you come down onto a sloping shoulder, the push follows the surface normal, so you slide off naturally instead of being shoved sideways. Rocks lower than 30 cm are stepped onto. *Check:* dropping onto 1.9 m boulders lands on top (0 cm sideways movement), walking off steps down cleanly, jumping on a boulder lands back on it, and 0 of 54 tall-rock approaches climbed.

**H3. Rover, lander and landmarks are solid.** `collideRover` uses the same rock colliders through six spheres around the chassis. Small stones under 30 cm are rolled over, and a contact under an overhang pushes the rover straight out. The lander and point-of-interest models (flag, ALSEP, plaque, retroreflector, Huygens and so on) become one box per mesh part (`addBoxes`). The parked rover is an oriented box. *Check:* 40 rover rams at 5 m/s left at most 1 mm overlap. Walking into the lunar module from 8 directions never entered a box, and flags and ALSEP are solid.

**M1. Parking brake.** In `stepRover`, with no throttle the brakes hold using full static friction once the rover is nearly stopped, so it stays put on any slope its tyres can grip (up to about 31°). Coasting still slows at 0.35 g. A parked rover is no longer simulated until something moves it. *Check:* 0.000 m of creep in 10 s on 4° and 16° slopes, and a coast to a stop on 15° holds.

**M2. Lava edge for the rover.** The rover gets the same `lavaEdge` boundary and an alarm toast. *Check:* driving at an artificial lava edge on Hadley stops 8 m short and shows the warning. On Io the player still stops 6 m short.

**M3. Begin and Skip.** In `main.js` `begin()`, only one start can be pending, it does nothing if you have left the briefing, and `cancelBegin()` (called from `toMenu`, so it covers both Main menu and Esc) clears the timer and the warp overlay. *Check:* clicking Begin twice and then Skip gave 1 overlay and 1 "Reported for duty" entry. Begin then Esc, and Begin then Main menu, both stay on the menu with no game started and no overlay left.

**M4. Traverse distance.** `traverse` adds the real distance from your position to the destination, and records it as skipped distance, which walk and drive objectives don't count. *Check:* a 2,658 m traverse added 2,658 m (before, it added the target's 2,673 m distance from the origin). Walk objectives were unchanged.

**M5. Esc and Lift off while loading.** Esc, or the new "Cancel landing" button, stops a landing that is still loading. `build()` checks for cancellation after every await. The half-built scene is disposed, and you return to the menu or the solar system, whichever you launched from (no `toGame()` from the menu). The pause dialog and Lift off only exist once the game is running. *Check:* Esc 30 ms into a landing from the menu returned to the menu with no surface canvas left and no errors.

**M6. Reliable saves.** In `core.js`, pending saves are flushed on `pagehide`, `beforeunload` and when the page is hidden. A failed write logs the error, shows one "Progress not saved" toast (with the cause: storage full, or blocked or private mode) and sets `saveHealthy()`, so the pause menus no longer claim "saved automatically" when that isn't true. *Check:* with a simulated quota error there was exactly one warning and `saveHealthy` was false. It returned to true once storage worked again.

**M7. Focus loss.** `_blur` now clears held keys, the joystick, the jump state (without firing the jump) and `downHeld`, and releases pointer lock. It also runs when the tab is hidden. *Check:* on Enceladus, holding C, Space and W and then blurring cleared everything.

**M8. Immediate collision refresh.** `refreshNear(true)` runs after Traverse, boarding, dismounting, respawn and build, and whenever you have moved 6 m (no more 0.5 s timer). `freeSpot()` and `isFree()` keep spawn, respawn, Traverse and dismount points clear of rocks, models, the rover and lava. *Check:* spawn is clear on all 12 sites, and Traverse and respawn land on clear ground with nearby collision data refreshed.

**L1.** The crouch pose and charge % only appear when a grounded jump is actually pending (`jumpPending`). *Check:* holding Space through a landing on the Moon showed no charge text and no crouch, and releasing did not jump.

**L2.** `pressJump` and `releaseJump` are ignored during the intro, and `resetJump()` runs when it ends. *Check:* Space pressed and released during the intro queued nothing.

**L3.** `sliding` is cleared whenever you are airborne, and the HUD only shows it on the ground. *Check:* the flag and label both clear when airborne.

**L4.** `camClip` tests the view line against rocks (exact ray and ellipsoid), model boxes, the parked rover and a 16-point terrain march, both for the wanted camera position and for the smoothed one. The camera snaps after Traverse and respawn and is clamped above terrain. *Check:* the camera stops in front of the lunar module and is never inside a rock, and stays above ground after Traverse.

**L5.** Mouse drag with the left or right button looks around (the middle button no longer does), with pointer lock while dragging, released on release, in menus, on pause and on blur. Sensitivity and invert-Y come from the existing Settings sliders, and the base speeds are in `LOOK` at the top of the file. Dragging down now looks down in both first and third person.

**L6.** An event done before its prerequisite is remembered (`pendingEv`) and completes when the prerequisite does. Counter objectives with an `after` count only what happens after they unlock (`objBase`). *Check:* at Shackleton, "return" queued correctly and completed once "core" was done.

**L7.** `sunNow()` recomputes sunlight on demand (needs-shadow samples, scans) and whenever you have moved 1.5 m. Scans read your position and sunlight when the scan finishes.

**L8.** `evacuate()`, through `leaveRover()`, sets driving to false, rover speed and steering to 0 with the brake on, and the camera distance to 7. *Check:* after evacuation the rover moved 0 mm and the player was on clear ground.

**L9.** A flight that used the jetpack is reported as "Jetpack flight" and is not counted toward the max jump, best-jump records or jump objectives. Stepping off a ledge is not a jump either. The Earth comparison now scales the measured height and hang time by g, so it matches the recorded metric. *Check:* on Enceladus a full-charge jump recorded 14.34 m, which matches v²/2g = 14.34. A jetpack flight left it unchanged.

**L10.** `checkObjectives`, `startDrop`, the interact prompt and the point-of-interest facts all wait for the intro to end. *Check:* G during the intro did nothing.

**L11.** The Shadow objective uses the crest's real x and z.

**L12.** `sanitizeSave()` type-checks every field against a fresh save (string-only lists, objects, finite numbers, log entries, task-progress arrays). An unreadable save is copied to `astrolab.save.v1.corrupt` and the game starts fresh. `surfaceSave()` repairs damaged site records. *Check:* invalid JSON, an array, and a save with wrong types throughout all load without errors.

**L13.** Ctrl, Meta and Alt combinations are ignored by the surface key handler. *Check:* Ctrl+R did not scan and Ctrl+C did not thrust down.

**L14.** Visits are counted in `start()`, so an aborted landing doesn't count. Collected samples free their material, the shared sample geometry and material are freed in `dispose`, instanced meshes are freed with `InstancedMesh.dispose()`, drop-test props free their material, timers are cleared, and the environment-map scratch geometry and materials are freed. *Check:* four land, drop and lift-off cycles left no surface canvases. An aborted landing left visits at 0.

**C1.** `thrusting` now drives a cold-gas exhaust effect (`puffGas`) and the jetpack sound.

**C2.** The help now covers arrow keys, which mouse buttons look around, pointer capture, where the Settings are, touch look, T (shown on every site that has time warp), and H. H opens the surface controls during an expedition.

**C3.** Only the front wheels steer, and the track marks follow the same rule.

**C4.** The walk animation advances with every physics step (`animStep`) instead of once per frame with a clamped delta. *Check:* the walk cycle advanced exactly 5.428 radians per metre at both ×1 and ×16.

**C5.** Plume particles use a fractional accumulator, and the buffer is sized to rate × lifetime × 1.15. *Check:* 140 particles per second at both 30 and 144 fps, and 2,464 alive in a 2,898 buffer at ×16 (no overflow).

**C6.** The minimap covers ±(E − 25), which is wider than the walkable ±(E − 30), and boulders 0.6 m and larger are drawn to scale.

**C7.** New sounds for footsteps (rate-limited), landings, jetpack, rover motor and collisions. Every emitted sound name exists in the sound table.

## 4. Known limitations and items to test by hand

- **Rock shapes are approximate.** Rocks use fitted ellipsoids, so a noisy bump can stick out of, or fall slightly inside, the collider by a few centimetres.
- **Mouse look needs a real mouse.** Pointer lock and the feel of mouse look can't be exercised in an automated browser. Please try a left drag and a right drag, and check how sensitivity feels.
- **Some slopes are too steep to reverse up.** A rover facing downhill on a slope steeper than about 23° can't reverse up it, because its motors are too weak (as on the real lunar rover). Get off and walk if you get stuck nose-down in a crater.
- **Audio volume is untested.** The new sounds are deliberately quiet. Please check the volume by ear on your speakers.
- **One transient visual glitch.** During one automated screenshot, a single frame showed a colourful square. It did not come back in later frames. If you see it in normal play, please tell me.
- **Building requires esbuild.** It is not installed on this PC. I ran it from a temporary download. To rebuild yourself, run `npm i -g esbuild`, then `python tools/build/build.py .`.
