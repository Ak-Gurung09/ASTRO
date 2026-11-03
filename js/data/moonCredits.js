// Sources and licences for the real moon maps (textures/moons/*.jpg). Shown in Help & Controls → Image credits.
// Full notes: textures/moons/CREDITS.md
export const MOON_CREDITS = [
  { id: 'moon', name: 'Moon', source: 'Ruslan Kabatsayev, from Hapke-normalised LROC WAC data (NASA / GSFC / Arizona State University); via Stellarium', licence: 'CC BY-SA 4.0', note: 'resized and dimmed' },
  { id: 'phobos', name: 'Phobos', source: 'NASA / JPL global map (David Seal), from NASA 3D Resources', licence: 'Public domain (NASA)', note: 'resized, warm tint added' },
  { id: 'io', name: 'Io', source: 'Map processed by Oleg Pluton (Helleformer); via Stellarium', licence: 'CC BY 4.0', note: '' },
  { id: 'europa', name: 'Europa', source: 'Map processed by Oleg Pluton (Helleformer); via Stellarium. Fine detail from the NASA / JPL map in NASA 3D Resources', licence: 'CC BY 4.0 + public domain', note: 'detail layers combined' },
  { id: 'ganymede', name: 'Ganymede', source: 'Map processed by Oleg Pluton (Helleformer); via Stellarium. Fine detail from the NASA / JPL map in NASA 3D Resources', licence: 'CC BY 4.0 + public domain', note: 'detail layers combined' },
  { id: 'callisto', name: 'Callisto', source: 'John van Vliet from NASA PDS data, modified by RVS; via Stellarium. Fine detail from the NASA / JPL map in NASA 3D Resources', licence: 'CC BY-SA (version not stated by Stellarium)', note: 'detail layers combined, colour muted' },
  { id: 'titan', name: 'Titan', source: 'Cloud and haze map by Magenta Meteorite, post-processed by Oleg Pluton (Helleformer); via Stellarium. Titan’s surface is hidden by haze in visible light', licence: 'CC BY 4.0', note: '' },
  { id: 'enceladus', name: 'Enceladus', source: 'NASA / CICLOPS team from Cassini data, coloured by RVS; via Stellarium', licence: 'Public domain (NASA)', note: '' },
  { id: 'triton', name: 'Triton', source: 'NASA / JPL map (David Seal) from Voyager 2 data; via Stellarium. Voyager 2 imaged only part of Triton, so the rest is filled in', licence: 'NASA / JPL source; see CREDITS.md', note: 'gaps filled by the map author' },
  { id: 'charon', name: 'Charon', source: 'Map by Kexitt, post-processed by Oleg Pluton (Helleformer); via Stellarium', licence: 'CC BY 4.0', note: 'poorly imaged areas are filled in by the map authors' },
];
export const MOON_CREDIT_INTRO = 'Moon textures are real maps of each world, shipped inside the game so it works offline. If one cannot be decoded the game quietly falls back to its generated texture.';
