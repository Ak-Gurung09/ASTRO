# Moon map credits

The ten `.jpg` files in this folder are the global colour maps used for the moons in the 3D solar system view, the Celestial Explorer and the Help credits. They are embedded in the game as `js/data/moonMaps.js` so the game works offline and from a double-clicked `index.html`. If a map cannot be decoded, the game keeps its generated texture for that moon.

## Where the data came from

Two public GitHub repositories were used. The build sandbox could not reach NASA, USGS, Wikimedia or PDS web servers directly, so these were the only routes to real maps.

| Source | What was used | Licence |
|---|---|---|
| [nasa/NASA-3D-Resources](https://github.com/nasa/NASA-3D-Resources) at commit `11ebb4ee`, folder `Images and Textures` | 1440 x 720 global maps of Phobos, Europa, Ganymede and Callisto (JPL maps by David Seal) | The repository says its assets "are free and without copyright". See the [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media). |
| [Stellarium/stellarium](https://github.com/Stellarium/stellarium) at commit `1b75fca9`, folder `textures`, credits in `CREDITS.md` section 4 | Full-coverage colour maps for the other bodies and as the colour base for Europa, Ganymede and Callisto | Per map, see below. Stellarium's own code is GPL, but its credits file gives the licence of each map. |

## The ten maps

| File | Size | Source and author (as stated by the source) | Licence | What was changed |
|---|---|---|---|---|
| `moon.jpg` | 2048 x 1024 | Ruslan Kabatsayev, from Hapke-normalised LROC WAC data (NASA / GSFC / Arizona State University), Stellarium `moon_4k.jpg` | **CC BY-SA 4.0** | Resized from 4096 x 2048, dimmed to 80% so it sits with the other bodies |
| `phobos.jpg` | 1024 x 512 | NASA / JPL global map (David Seal), from NASA 3D Resources | Public domain (NASA) | Resized, mild warm tint added to the grey map |
| `io.jpg` | 512 x 256 | Oleg Pluton ("Helleformer"), Stellarium `io.png` | CC BY 4.0 | None |
| `europa.jpg` | 1024 x 512 | Colour: Oleg Pluton, Stellarium `europa.png`. Detail: NASA / JPL map in NASA 3D Resources | CC BY 4.0 + public domain | Upscaled, then the fine detail of the NASA map was added on top |
| `ganymede.jpg` | 1024 x 512 | Colour: Oleg Pluton, Stellarium `ganymede.png`. Detail: NASA / JPL map | CC BY 4.0 + public domain | Same as Europa |
| `callisto.jpg` | 1024 x 512 | Colour: John van Vliet from NASA PDS data, modified by RVS, Stellarium `callisto.png`. Detail: NASA / JPL map | **CC BY-SA** (Stellarium does not state a version) | Same as Europa; colour saturation reduced to 45% because the source map is tinted green |
| `titan.jpg` | 512 x 256 | Magenta Meteorite, post-processed by Oleg Pluton, Stellarium `titan.png` | CC BY 4.0 | None. This is a cloud and haze map: Titan's surface is not visible in visible light |
| `enceladus.jpg` | 512 x 256 | NASA / CICLOPS team from Cassini data, coloured by RVS, Stellarium `enceladus.png` | Public domain (NASA) | None |
| `triton.jpg` | 512 x 256 | NASA / JPL map (David Seal) from Voyager 2, Stellarium `triton.png` | NASA / JPL source. Stellarium points to a licence section that is missing from its credits file | None. Voyager 2 imaged only part of Triton, so the rest of the map is filled in, not photographed |
| `charon.jpg` | 512 x 256 | Kexitt, post-processed by Oleg Pluton, Stellarium `charon.png` | CC BY 4.0 | None. Areas that were poorly imaged are filled in by the map authors |

Notes:

* **Share-alike.** `moon.jpg` and `callisto.jpg` are CC BY-SA. If you publish the game, keep those two files (and `js/data/moonMaps.js`, which embeds them) under the same licence and keep the credit lines. The game code itself is not affected. If that is a problem, delete the two entries from `moonMaps.js` and the game falls back to its generated textures for them.
* **Moon source match.** Stellarium's credits file lists a single "Moon albedo map" entry. It was matched to `moon_4k.jpg` because that is the file Stellarium's `ssystem_major.ini` loads for the Moon.
* **How "Detail" was added.** The NASA map and the Stellarium map of Europa, Ganymede and Callisto line up (checked by cross-correlation, no shift or flip). Only the fine detail of the NASA map (the map minus a blurred copy of itself) was added to the Stellarium colour map. The maps for Io, Enceladus, Triton and Charon do not line up with the NASA files, so they were not combined.
* The Moon has no usable global map in NASA 3D Resources (its Moon image is a photograph of the disc), which is why the Moon comes from Stellarium's LROC-based map.
* The maps are albedo (brightness and colour) maps, not elevation. The 3D view fakes a little relief from them near the day / night line.

## Rebuilding

`tools/moon-maps/make_final.py` and `proc.py` show exactly how the maps were produced from the two source repositories. `python3 tools/moon-maps/embed.py` (run from the repository root) regenerates `js/data/moonMaps.js` from the `.jpg` files here.

## Not done

Higher-resolution global mosaics (for example the 100 m/pixel LROC mosaic, USGS Galileo and Cassini mosaics) and elevation models (LOLA and similar) would look better still. They sit on NASA and USGS servers that were not reachable from the build sandbox. If you download them and put them in a folder, they can be resized and swapped in with the same scripts.
