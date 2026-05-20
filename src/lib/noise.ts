// Bruit value-noise 2D base sur hash deterministe.
// Plus rapide que simplex pour Canvas 2D pixel-rendering.
// Inspiration : Book of Shaders chapitre fBM.

export function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1274126177) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smoothstep cubique
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

export function noise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smooth(xf);
  const v = smooth(yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + u * (b - a) + v * (c - a) + u * v * (a - b - c + d);
}

// fBM : somme d'octaves de bruit à fréquence croissante / amplitude décroissante
export function fbm(x: number, y: number, seed: number, octaves: number = 5, lacunarity: number = 2, gain: number = 0.5): number {
  let v = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    v += amp * noise2(x * freq, y * freq, seed + i * 17);
    norm += amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return v / norm;
}

// Ridge noise (1 - |2*noise-1|) elevee a une puissance : creates de cretes
export function ridge(x: number, y: number, seed: number, octaves: number = 4): number {
  let v = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = noise2(x * freq, y * freq, seed + i * 23);
    const r = 1 - Math.abs(n * 2 - 1);
    v += amp * (r * r);
    norm += amp;
    freq *= 2;
    amp *= 0.5;
  }
  return v / norm;
}

// Turbulence : abs(noise-0.5)*2 sommé en octaves (plus aggressif que fbm)
export function turbulence(x: number, y: number, seed: number, octaves: number = 4): number {
  let v = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    v += amp * Math.abs(noise2(x * freq, y * freq, seed + i * 31) * 2 - 1);
    norm += amp;
    freq *= 2;
    amp *= 0.5;
  }
  return v / norm;
}

// Domain warp : on perturbe les coords avec un fBM avant de calculer le terrain
export function warpedFbm(x: number, y: number, seed: number, warpAmount: number = 0.5): number {
  const qx = fbm(x, y, seed + 100, 3);
  const qy = fbm(x + 5.2, y + 1.3, seed + 200, 3);
  return fbm(x + warpAmount * qx, y + warpAmount * qy, seed, 5);
}

// Linear interpolate
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

// Smoothstep utilitaire (a,b) -> [0,1]
export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Couleur RGB -> string css
export function rgbStr(r: number, g: number, b: number): string {
  return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
}

// Mix lineaire entre 2 couleurs RGB
export function mixRgb(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// Convertit #RRGGBB en [r,g,b]
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
