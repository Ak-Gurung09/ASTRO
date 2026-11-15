# ASTRO LAB: layering, sorting and interaction convention

This is the convention every Career Mode scene follows so that boards, screens, glass, held items, effects and UI always draw in the right order. The game is three.js plus HTML, so Unity's sorting layers map to `renderOrder`, `depthWrite`/`depthTest`, `polygonOffset` and CSS `z-index`.

Code: `js/career/engine/layers.js` (3D), `css/career.css` (screen-space bands), `js/career/engine/world.js` (first-person pass).

## 1. 3D render order bands (`RO` in `engine/layers.js`)

three.js draws opaque meshes first (front to back), then transparent meshes (back to front). Inside each group, a higher `renderOrder` draws later.

| Band | `renderOrder` | What goes here | Rules |
|---|---|---|---|
| Background environment | `RO.ENV` = 0 | rooms, terrain, sky, buildings, domes | opaque, writes depth |
| Interactive props | `RO.PROP` = 0 | furniture, tools, machines, parts | opaque, writes depth |
| Characters | `RO.CHAR` = 0 | people, crew, instructors | opaque, writes depth; never sunk into the floor (use the sit or ground-sit pose instead) |
| Decals | `RO.DECAL` = 1 | floor marks, tape lines, posters, labels lying on a surface | `decal(obj)`: polygon offset −1/−4 so they never z-fight |
| World-space UI | `RO.WORLD_UI` = 2 | signs, mission boards, monitors, eye chart, terminal screens | `worldUI(obj)`: stronger polygon offset (−2/−8); boards stand on posts or hang on a wall, never float |
| Glass and holograms | `RO.GLASS` = 5 | windows, visors, greenhouse dome, water, assembly "ghost" outlines | `glassy(obj)`: transparent, `depthWrite: false` |
| Held item and hands | `RO.HELD` = 8 | the first-person hands and whatever is in them | drawn in a separate pass (see 3) |
| Effects and particles | `RO.FX` = 9 | extinguisher spray, smoke, mist, light beams | `fx(obj)`: `depthWrite: false`, also `noBlock` for line of sight |
| Highlight | `RO.HIGHLIGHT` = 20 | focus outline (corner brackets) on the object under the crosshair | `onTop(obj)`: `depthTest: false` |
| Objective marker | `RO.MARKER` = 21 | yellow chevron over the current objective, robot-arm guide line | `onTop(obj, RO.MARKER)` |

`auditScene(scene)` runs after every scene is built and fixes the usual mistakes automatically: transparent materials that still write depth go to the glass band, invisible hit boxes never cast shadows, and small flat planes lying on other surfaces get a polygon offset.

## 2. Screen-space UI bands (`css/career.css`)

One `z-index` band per kind of element inside `#screen-career`:

| z-index | Variable | Elements |
|---|---|---|
| 0 | `--z-canvas` | the 3D canvas |
| 2 | `--z-aim` | crosshair, use prompt, "click to look" hint |
| 3 | `--z-hud` | objectives, timer, readout panel (right), meters such as hydration (left), item buttons, robot-arm view label |
| 4 | `--z-alert` | flash messages, touch controls, robot-arm panel, Skip button |
| 5 | `--z-talk` | conversation box |
| 6 | `--z-fx` | full-screen soft effects (oxygen-mask rim, glare, haze, blur, vignette); `pointer-events: none` |
| 40 / 60 / 70 | (style.css) | modals, the fade, toasts: above the whole career screen |

Placement rules: the readout sits top-right under the buttons, meters bottom-left above the touch joystick, so they never overlap. Screen effects never take clicks and never strobe (see 6).

## 3. First-person pass

Hands and the held item live in `world.fpScene`. `World.render()` draws the world, clears only the depth buffer and draws the first-person scene, so a carried object can never clip into a wall, table or person.

## 4. Interaction (hit boxes, line of sight, pickup categories)

* **Usable objects**: `makeUsable(obj, { label, verb, use, enabled, range })`. The crosshair ray picks the nearest enabled usable object within its range.
* **Line of sight**: a usable object is rejected if a solid (visible, opaque, larger than 30 cm) mesh is in front of it, so nothing is used through walls. Transparent shells that should still block use (the greenhouse dome) are added to `ix.blockers`.
* **Hit boxes**: invisible `BoxGeometry` meshes with `material.visible = false` and `userData.hitbox = true`. Thin or tiny things (tent poles, bottles, cartridges, small sensors) get a hit box larger than the visible model; big shells get none.
* **Player collision**: `player.addBox(x0, x1, z0, z1, y0, y1)` for every solid thing the player could walk into (tents, helicopter once landed, tanks, beds, benches, dome walls, partitions). Doorways stay open; colliders that only exist in some states are switched with `collider.on`.
* **Pickable** (`carry.makeCarriable`): tools, small equipment, food and drink, medical items, documents, small parts, containers. They have a home position and are returned there if they ever leave the world.
* **Not pickable**: walls, floors, furniture, large machinery, vehicles, fixed terminals.
* **Sockets** (`carry.makeSocket`): placement zones with an optional `check()` that rejects the wrong item with a message, then snap the right one into place with a confirmation pulse and sound. The step-by-step assembly helper (`scenes/assembly.js`) builds on these and shows a see-through ghost of each part in its slot.

## 5. Characters

Characters are complete procedural rigs (`models/humans.js`). Sitting people use the `sit` pose (on a chair, cot or bed edge) or the `ground` pose (on the floor or sand), never a negative `y`. Each character that the player can talk to has a usable root and a small collider.

## 6. Light-sensitive effects

Effects that simulate light sensitivity or migraine (medical centre) follow these limits: at most one slow, smooth pulse per second, no flashing, capped opacity for glare and blur, a warning before the first effect, and an "Effects off" mode (default when the system asks for reduced motion) that replaces effects with text descriptions. The 💡 button toggles it at any time.
