// Replaces the generated (procedural) moon textures with real maps of each world.
// Every step is optional: if a map is missing, cannot be decoded or takes too long, that moon keeps its generated texture.
const MAX_W = { low: 512, medium: 1024, high: 2048 };

function decode(uri, ms = 6000) {
  return new Promise((resolve, reject) => {
    const img = new Image(); let done = false;
    const t = setTimeout(() => { if (!done) { done = true; reject(new Error('timeout')); } }, ms);
    img.onload = () => { if (!done) { done = true; clearTimeout(t); resolve(img); } };
    img.onerror = () => { if (!done) { done = true; clearTimeout(t); reject(new Error('decode failed')); } };
    img.src = uri;
  });
}

/** textures: { id: canvas }. Returns the ids that were upgraded. */
export async function upgradeMoonTextures(textures, quality = 'high') {
  let data;
  try { data = (await import('../data/moonMaps.js')).MOON_MAP_DATA; } catch (e) { console.warn('Real moon maps unavailable, keeping generated textures', e); return []; }
  const maxW = MAX_W[quality] || MAX_W.high, done = [];
  for (const [id, uri] of Object.entries(data)) {
    if (!(id in textures)) continue;
    try {
      const img = await decode(uri);
      const w = Math.min(img.naturalWidth, maxW), h = Math.round(w / 2);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h);
      textures[id] = c; done.push(id);
    } catch (e) { console.warn(`Real map for ${id} failed, keeping generated texture`, e); }
  }
  return done;
}
