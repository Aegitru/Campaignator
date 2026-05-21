import type { PlanetType, PlanetVariant } from "@/types/domain";
import { fbm, ridge, turbulence, warpedFbm, smoothstep, lerp, hexToRgb, mixRgb } from "@/lib/noise";

/**
 * Refonte 2D des textures planètes :
 * - Rendu pixel-par-pixel via ImageData (4 octaves fBM + domain warp)
 * - Texture cachee dans une OffscreenCanvas, reutilisee pour les frames suivantes
 * - 5 types x 4 variantes : palettes + biome shaping different
 * - Atmosphère + ombrage sphérique appliques au moment du blit
 */

const TEX_SIZE = 384; // resolution interne de chaque texture cachee
const cache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();

interface BiomePalette {
  // Couleurs par paliers de hauteur (de basse a haute altitude)
  bands: Array<{ at: number; color: [number, number, number] }>;
  // Couleur d'atmosphere (RGBA)
  glow: string;
  // Style de bruit
  variant: "continents" | "bands" | "rocky" | "barren" | "metallic" | "lava" | "asteroid" | "station" | "ruins";
  // Animation des nuages (oui/non)
  hasClouds: boolean;
  cloudColor?: [number, number, number];
}

export interface PlanetPalette {
  label: string;
  glow: string; // pour compat externe (halo CSS)
}

const PALETTES: Record<PlanetType, Record<PlanetVariant, BiomePalette>> = {
  oceanic: {
    1: { variant: "continents", glow: "rgba(120, 180, 240, 0.45)", hasClouds: true, cloudColor: [255,255,255],
      bands: [
        { at: 0.00, color: [8, 24, 64] },
        { at: 0.42, color: [20, 60, 140] },
        { at: 0.55, color: [40, 110, 200] },
        { at: 0.60, color: [200, 180, 130] }, // littoral
        { at: 0.66, color: [80, 130, 70] },
        { at: 0.85, color: [120, 100, 60] },
        { at: 1.00, color: [240, 240, 240] }
      ]
    },
    2: { variant: "continents", glow: "rgba(120, 220, 230, 0.5)", hasClouds: true, cloudColor: [240, 250, 255],
      bands: [
        { at: 0.00, color: [10, 60, 80] },
        { at: 0.45, color: [40, 150, 170] },
        { at: 0.58, color: [120, 220, 230] },
        { at: 0.62, color: [220, 220, 180] },
        { at: 0.78, color: [60, 110, 90] },
        { at: 1.00, color: [220, 230, 200] }
      ]
    },
    3: { variant: "continents", glow: "rgba(130, 200, 150, 0.5)", hasClouds: true, cloudColor: [255,255,255],
      bands: [
        { at: 0.00, color: [20, 50, 30] },
        { at: 0.45, color: [40, 110, 60] },
        { at: 0.58, color: [80, 160, 90] },
        { at: 0.62, color: [180, 170, 100] },
        { at: 0.80, color: [120, 80, 40] },
        { at: 1.00, color: [220, 220, 220] }
      ]
    },
    4: { variant: "continents", glow: "rgba(220, 240, 255, 0.6)", hasClouds: true, cloudColor: [255,255,255],
      bands: [
        { at: 0.00, color: [60, 100, 150] },
        { at: 0.50, color: [180, 210, 230] },
        { at: 0.60, color: [240, 250, 255] },
        { at: 1.00, color: [255, 255, 255] }
      ]
    }
  },
  rocky: {
    1: { variant: "rocky", glow: "rgba(220, 110, 60, 0.4)", hasClouds: false,
      bands: [
        { at: 0.00, color: [60, 18, 10] },
        { at: 0.45, color: [140, 50, 30] },
        { at: 0.65, color: [200, 100, 60] },
        { at: 0.85, color: [240, 170, 110] },
        { at: 1.00, color: [255, 220, 180] }
      ]
    },
    2: { variant: "rocky", glow: "rgba(180, 200, 220, 0.32)", hasClouds: false,
      bands: [
        { at: 0.00, color: [40, 40, 50] },
        { at: 0.50, color: [110, 110, 120] },
        { at: 0.75, color: [180, 180, 190] },
        { at: 1.00, color: [230, 230, 240] }
      ]
    },
    3: { variant: "rocky", glow: "rgba(220, 180, 110, 0.38)", hasClouds: false,
      bands: [
        { at: 0.00, color: [80, 50, 18] },
        { at: 0.50, color: [180, 130, 60] },
        { at: 0.75, color: [220, 180, 110] },
        { at: 1.00, color: [255, 220, 160] }
      ]
    },
    4: { variant: "lava", glow: "rgba(255, 100, 30, 0.55)", hasClouds: false,
      bands: [
        { at: 0.00, color: [20, 8, 4] },
        { at: 0.40, color: [60, 22, 10] },
        { at: 0.55, color: [120, 40, 16] },
        { at: 0.65, color: [220, 70, 20] },
        { at: 0.80, color: [255, 160, 40] },
        { at: 1.00, color: [255, 240, 180] }
      ]
    }
  },
  gaseous: {
    1: { variant: "bands", glow: "rgba(230, 200, 140, 0.45)", hasClouds: false,
      bands: [
        { at: 0.00, color: [90, 60, 30] },
        { at: 0.30, color: [200, 160, 100] },
        { at: 0.55, color: [240, 220, 160] },
        { at: 0.75, color: [200, 160, 100] },
        { at: 1.00, color: [120, 90, 50] }
      ]
    },
    2: { variant: "bands", glow: "rgba(120, 180, 255, 0.5)", hasClouds: false,
      bands: [
        { at: 0.00, color: [10, 30, 90] },
        { at: 0.35, color: [40, 90, 200] },
        { at: 0.55, color: [120, 180, 255] },
        { at: 0.75, color: [40, 90, 200] },
        { at: 1.00, color: [10, 30, 90] }
      ]
    },
    3: { variant: "bands", glow: "rgba(190, 140, 230, 0.5)", hasClouds: false,
      bands: [
        { at: 0.00, color: [40, 16, 70] },
        { at: 0.30, color: [110, 50, 150] },
        { at: 0.55, color: [180, 130, 220] },
        { at: 0.75, color: [110, 50, 150] },
        { at: 1.00, color: [40, 16, 70] }
      ]
    },
    4: { variant: "bands", glow: "rgba(255, 235, 180, 0.45)", hasClouds: false,
      bands: [
        { at: 0.00, color: [140, 110, 60] },
        { at: 0.30, color: [220, 200, 130] },
        { at: 0.55, color: [255, 245, 200] },
        { at: 0.75, color: [220, 200, 130] },
        { at: 1.00, color: [140, 110, 60] }
      ]
    }
  },
  dead: {
    1: { variant: "barren", glow: "rgba(70, 70, 80, 0.2)", hasClouds: false,
      bands: [
        { at: 0.00, color: [8, 8, 12] },
        { at: 0.50, color: [28, 28, 32] },
        { at: 0.80, color: [60, 60, 64] },
        { at: 1.00, color: [110, 110, 116] }
      ]
    },
    2: { variant: "barren", glow: "rgba(160, 155, 150, 0.22)", hasClouds: false,
      bands: [
        { at: 0.00, color: [50, 48, 44] },
        { at: 0.50, color: [120, 115, 108] },
        { at: 0.80, color: [180, 175, 165] },
        { at: 1.00, color: [220, 215, 200] }
      ]
    },
    3: { variant: "barren", glow: "rgba(180, 100, 50, 0.35)", hasClouds: false,
      bands: [
        { at: 0.00, color: [40, 24, 12] },
        { at: 0.50, color: [90, 56, 30] },
        { at: 0.80, color: [160, 100, 50] },
        { at: 1.00, color: [220, 160, 90] }
      ]
    },
    4: { variant: "barren", glow: "rgba(255, 240, 220, 0.30)", hasClouds: false,
      bands: [
        { at: 0.00, color: [220, 215, 200] },
        { at: 0.50, color: [240, 230, 210] },
        { at: 1.00, color: [255, 250, 240] }
      ]
    }
  },
  other: {
    1: { variant: "asteroid", glow: "rgba(160, 130, 90, 0.25)", hasClouds: false,
      bands: [
        { at: 0.00, color: [25, 20, 18] },
        { at: 0.45, color: [70, 55, 40] },
        { at: 0.70, color: [140, 110, 80] },
        { at: 1.00, color: [200, 180, 140] }
      ]
    },
    2: { variant: "station", glow: "rgba(150, 200, 240, 0.35)", hasClouds: false,
      bands: [
        { at: 0.00, color: [10, 12, 18] },
        { at: 0.40, color: [50, 70, 90] },
        { at: 0.70, color: [150, 180, 210] },
        { at: 1.00, color: [220, 240, 255] }
      ]
    },
    3: { variant: "ruins", glow: "rgba(100, 90, 110, 0.3)", hasClouds: false,
      bands: [
        { at: 0.00, color: [12, 10, 16] },
        { at: 0.45, color: [50, 40, 55] },
        { at: 0.75, color: [110, 95, 120] },
        { at: 1.00, color: [180, 170, 190] }
      ]
    },
    4: { variant: "asteroid", glow: "rgba(120, 140, 160, 0.22)", hasClouds: false,
      bands: [
        { at: 0.00, color: [20, 22, 28] },
        { at: 0.50, color: [60, 70, 90] },
        { at: 0.80, color: [130, 145, 170] },
        { at: 1.00, color: [200, 215, 240] }
      ]
    }
  }
};

export function getPalette(type: PlanetType, variant: PlanetVariant): PlanetPalette {
  const p = PALETTES[type]?.[variant] ?? PALETTES.rocky[1];
  return { label: type + "-" + variant, glow: p.glow };
}

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function colorAt(palette: BiomePalette, h: number): [number, number, number] {
  const bands = palette.bands;
  for (let i = 0; i < bands.length - 1; i++) {
    if (h <= bands[i + 1].at) {
      const t = (h - bands[i].at) / (bands[i + 1].at - bands[i].at);
      return mixRgb(bands[i].color, bands[i + 1].color, Math.max(0, Math.min(1, t)));
    }
  }
  return bands[bands.length - 1].color;
}

function makeOffscreen(size: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  return c;
}

function getTextureCanvas(type: PlanetType, variant: PlanetVariant, seed: number): HTMLCanvasElement | OffscreenCanvas {
  const key = type + "-" + variant + "-" + (seed >>> 0);
  const cached = cache.get(key);
  if (cached) return cached;

  const palette = PALETTES[type]?.[variant] ?? PALETTES.rocky[1];
  const canvas = makeOffscreen(TEX_SIZE);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) return canvas;
  const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);
  const data = img.data;
  const half = TEX_SIZE / 2;
  const r = half;

  for (let py = 0; py < TEX_SIZE; py++) {
    for (let px = 0; px < TEX_SIZE; px++) {
      const dx = (px - half) / r;
      const dy = (py - half) / r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      const z = Math.sqrt(1 - d2);

      // UV "sphérique" simulée : on utilise (dx, dy, z) comme 3 axes
      // Pour 2D on combine dx/z + dy comme entree fBM
      const ux = (dx / (z + 0.5)) * 2;
      const uy = dy * 2;

      let h: number;
      if (palette.variant === "continents") {
        // Domain warp pour casser le bruit fractal
        const wx = fbm(ux + 5, uy + 5, seed + 100, 3) - 0.5;
        const wy = fbm(ux - 3, uy - 3, seed + 200, 3) - 0.5;
        h = fbm(ux * 1.3 + wx * 1.2, uy * 1.3 + wy * 1.2, seed, 5);
      } else if (palette.variant === "bands") {
        // Bandes horizontales fortes + perturbations
        const warp = fbm(ux * 0.7, uy * 0.7, seed + 50, 4) * 0.4;
        h = 0.5 + 0.45 * Math.sin(uy * 3.5 + warp * 6 + seed * 0.01) + (fbm(ux * 2, uy * 6, seed, 4) - 0.5) * 0.3;
        h = Math.max(0, Math.min(1, h));
      } else if (palette.variant === "rocky") {
        // Mix fbm + ridge pour cratères et failles
        const f = fbm(ux * 1.5, uy * 1.5, seed, 5);
        const rg = ridge(ux * 2, uy * 2, seed + 70, 4);
        h = f * 0.7 + rg * 0.3;
      } else if (palette.variant === "lava") {
        // Turbulence pour la lave
        const t = turbulence(ux * 1.2, uy * 1.2, seed, 4);
        const fl = fbm(ux * 3, uy * 3, seed + 50, 3);
        h = Math.min(1, t * 0.65 + fl * 0.45);
      } else if (palette.variant === "barren") {
        // Surface lisse avec cratères marqués (ridge inverse)
        const f = fbm(ux, uy, seed, 3) * 0.5;
        const craters = ridge(ux * 3, uy * 3, seed + 80, 3);
        h = f + 0.5 * craters;
      } else if (palette.variant === "metallic") {
        // metallic : grilles + plaques
        const tn = turbulence(ux * 2.5, uy * 2.5, seed, 3);
        const stripes = Math.abs(Math.sin(uy * 6 + ux * 4 + tn * 3));
        h = 0.45 + tn * 0.3 + stripes * 0.2;
      } else if (palette.variant === "asteroid") {
        // Champ d'asteroides : turbulence + masque de "vide" pour donner aspect cluster
        const tn = turbulence(ux * 3.5, uy * 3.5, seed, 4);
        const void_ = fbm(ux * 1.2, uy * 1.2, seed + 90, 3);
        const mask = smoothstep(0.35, 0.7, void_);
        h = tn * mask;
      } else if (palette.variant === "station") {
        // Station spatiale : structure geometrique
        const r2 = Math.sqrt(dx * dx + dy * dy);
        const a = Math.atan2(dy, dx);
        const ring = Math.abs(Math.sin(r2 * 12)) * 0.4 + Math.abs(Math.sin(a * 8)) * 0.3;
        const struct = smoothstep(0.4, 0.7, ring);
        const noise_ = fbm(ux * 2, uy * 2, seed + 200, 2) * 0.3;
        h = 0.3 + struct * 0.6 + noise_;
      } else if (palette.variant === "ruins") {
        // Ruines flottantes : fragments + bruit
        const tn = turbulence(ux * 2.2, uy * 2.2, seed, 3);
        const rg = ridge(ux * 4, uy * 4, seed + 333, 3);
        h = tn * 0.5 + rg * 0.4;
      } else {
        h = 0.5;
      }

      const rgb = colorAt(palette, h);

      const i = (py * TEX_SIZE + px) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  cache.set(key, canvas);
  return canvas;
}

/** Cache pour les masques nuages, animes via time. Une couche separe rendu rapide. */
const cloudCache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();
const CLOUD_SIZE = 128;

function getCloudCanvas(seed: number, cloudColor: [number, number, number]): HTMLCanvasElement | OffscreenCanvas {
  const key = "clouds-" + (seed >>> 0);
  const cached = cloudCache.get(key);
  if (cached) return cached;

  const canvas = makeOffscreen(CLOUD_SIZE);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) return canvas;
  const img = ctx.createImageData(CLOUD_SIZE, CLOUD_SIZE);
  const data = img.data;
  const half = CLOUD_SIZE / 2;
  const r = half;

  for (let py = 0; py < CLOUD_SIZE; py++) {
    for (let px = 0; px < CLOUD_SIZE; px++) {
      const dx = (px - half) / r;
      const dy = (py - half) / r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      const z = Math.sqrt(1 - d2);
      const ux = (dx / (z + 0.5)) * 2;
      const uy = dy * 2;
      const t = turbulence(ux * 1.8, uy * 1.8, seed + 555, 4);
      const m = smoothstep(0.45, 0.78, t);
      const i = (py * CLOUD_SIZE + px) * 4;
      data[i] = cloudColor[0];
      data[i + 1] = cloudColor[1];
      data[i + 2] = cloudColor[2];
      data[i + 3] = Math.round(220 * m);
    }
  }

  ctx.putImageData(img, 0, 0);
  cloudCache.set(key, canvas);
  return canvas;
}

/**
 * Dessine une planète au point (cx, cy) avec rayon r.
 * type, variant, seed déterminent la texture (cachée).
 * time (ms) permet l'animation des nuages.
 */
export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  type: PlanetType, variant: PlanetVariant, seed: number,
  time: number = 0,
) {
  const palette = PALETTES[type]?.[variant] ?? PALETTES.rocky[1];

  // --- Halo atmospherique extérieur ---
  const haloR = r * 1.35;
  const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, haloR);
  haloGrad.addColorStop(0, palette.glow);
  haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // --- Disque planétaire (clip) ---
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Texture cachée blitée
  const tex = getTextureCanvas(type, variant, seed);
  ctx.drawImage(tex as CanvasImageSource, cx - r - 1, cy - r - 1, r * 2 + 2, r * 2 + 2);

  // Nuages animés (translation horizontale)
  if (palette.hasClouds && palette.cloudColor) {
    const clouds = getCloudCanvas(seed + 9999, palette.cloudColor);
    const offset = ((time * 0.000012 * r) % (r * 2));
    ctx.globalAlpha = 0.6;
    ctx.drawImage(clouds as CanvasImageSource, cx - r + offset - 1, cy - r - 1, r * 2 + 2, r * 2 + 2);
    ctx.drawImage(clouds as CanvasImageSource, cx - r + offset - r * 2 - 1, cy - r - 1, r * 2 + 2, r * 2 + 2);
    ctx.globalAlpha = 1;
  }

  // --- Ombrage sphérique (lumière haut-gauche) ---
  const shade = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  shade.addColorStop(0, "rgba(255, 255, 255, 0.16)");
  shade.addColorStop(0.45, "rgba(255, 255, 255, 0)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.65)");
  ctx.fillStyle = shade;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // --- Terminator (ombre cote nuit, plus marquee) ---
  const term = ctx.createRadialGradient(cx + r * 0.55, cy + r * 0.4, r * 0.2, cx, cy, r);
  term.addColorStop(0, "rgba(0, 0, 0, 0.65)");
  term.addColorStop(0.55, "rgba(0, 0, 0, 0.2)");
  term.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = term;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // --- Rim light (atmosphere bord) ---
  if (palette.hasClouds || palette.variant === "continents") {
    const rim = ctx.createRadialGradient(cx, cy, r * 0.88, cx, cy, r);
    rim.addColorStop(0, "rgba(127, 200, 255, 0)");
    rim.addColorStop(1, "rgba(127, 200, 255, 0.35)");
    ctx.fillStyle = rim;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  ctx.restore();
}
