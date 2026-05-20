import type { StarType } from "@/types/domain";
import { fbm, ridge, smoothstep, mixRgb } from "@/lib/noise";

/**
 * Rendu d'etoile en 3 couches :
 *   1. Photosphère : granulation fBM avec mapping de température (corps noir approxime)
 *   2. Taches solaires : ridge inversé masqué (zones plus froides locales)
 *   3. Corona : halo radial multi-couches anime avec flares
 *
 * La photosphère est cachée dans une OffscreenCanvas par star_type+seed.
 * On la régénère à intervalle pour donner un effet "vivant" (pas a chaque frame).
 */

export interface StarRenderConfig {
  /** Couleur d'une zone "chaude" (max temp) */
  hot: [number, number, number];
  /** Couleur d'une zone "froide" (granulation moins lumineuse) */
  cool: [number, number, number];
  /** Couleur des taches (sunspots) */
  spot: [number, number, number];
  /** Couleur corona externe (rgba) */
  coronaOuter: string;
  /** Couleur corona intermediaire (rgba) */
  coronaMid: string;
  /** Couleur corona proche surface */
  coronaInner: string;
  /** Echelle (multiplie le rayon) */
  scale: number;
  /** Frequence des flares (rayons solaires) */
  flares: number;
  /** Frequence de pulsation */
  pulse: number;
}

export const STAR_RENDER: Record<StarType, StarRenderConfig> = {
  yellow_dwarf: {
    hot: [255, 245, 200], cool: [240, 160, 60], spot: [110, 40, 10],
    coronaOuter: "rgba(255, 140, 40, 0)",
    coronaMid: "rgba(255, 165, 60, 0.18)",
    coronaInner: "rgba(255, 220, 140, 0.55)",
    scale: 1.0, flares: 1.0, pulse: 1.0,
  },
  red_giant: {
    hot: [255, 200, 130], cool: [220, 60, 20], spot: [80, 8, 4],
    coronaOuter: "rgba(180, 40, 12, 0)",
    coronaMid: "rgba(220, 70, 30, 0.20)",
    coronaInner: "rgba(255, 140, 80, 0.5)",
    scale: 1.55, flares: 1.4, pulse: 0.7,
  },
  white_dwarf: {
    hot: [255, 255, 255], cool: [200, 220, 255], spot: [100, 130, 180],
    coronaOuter: "rgba(120, 180, 255, 0)",
    coronaMid: "rgba(180, 220, 255, 0.20)",
    coronaInner: "rgba(240, 250, 255, 0.6)",
    scale: 0.7, flares: 0.6, pulse: 1.4,
  },
  neutron: {
    hot: [255, 255, 255], cool: [180, 220, 255], spot: [80, 120, 200],
    coronaOuter: "rgba(160, 200, 255, 0)",
    coronaMid: "rgba(200, 230, 255, 0.30)",
    coronaInner: "rgba(255, 255, 255, 0.75)",
    scale: 0.55, flares: 0.4, pulse: 2.2,
  },
  binary: {
    hot: [255, 245, 200], cool: [240, 160, 60], spot: [110, 40, 10],
    coronaOuter: "rgba(255, 140, 40, 0)",
    coronaMid: "rgba(255, 165, 60, 0.18)",
    coronaInner: "rgba(255, 220, 140, 0.55)",
    scale: 0.85, flares: 1.0, pulse: 1.0,
  },
};

// Cache : on regenere la photosphere toutes les FRAME_INTERVAL_MS pour effet d'animation
const PHOTO_SIZE = 192;
const FRAME_INTERVAL_MS = 220; // ~4.5 "frames" par seconde, suffisant pour effet vivant
interface PhotoCache { canvas: HTMLCanvasElement | OffscreenCanvas; lastUpdate: number; phase: number }
const photoCache = new Map<string, PhotoCache>();

function makeOffscreen(size: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  return c;
}

function renderPhotosphere(
  starType: StarType, seed: number, phase: number
): HTMLCanvasElement | OffscreenCanvas {
  const cfg = STAR_RENDER[starType];
  const canvas = makeOffscreen(PHOTO_SIZE);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (!ctx) return canvas;
  const img = ctx.createImageData(PHOTO_SIZE, PHOTO_SIZE);
  const data = img.data;
  const half = PHOTO_SIZE / 2;
  const r = half;

  for (let py = 0; py < PHOTO_SIZE; py++) {
    for (let px = 0; px < PHOTO_SIZE; px++) {
      const dx = (px - half) / r;
      const dy = (py - half) / r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      const z = Math.sqrt(1 - d2);
      const ux = (dx / (z + 0.5)) * 2 + phase * 0.3;
      const uy = dy * 2 + phase * 0.15;

      // Granulation : fBM moyenne frequence
      const granule = fbm(ux * 4.5, uy * 4.5, seed, 4);
      // Regions plus chaudes : fBM basse frequence
      const hotRegion = fbm(ux * 1.5, uy * 1.5, seed + 700, 3);
      // Spots : ridge inverse, ne garde que pics
      const spotRaw = ridge(ux * 2.2, uy * 2.2, seed + 1500, 3);
      const spotMask = smoothstep(0.78, 0.95, spotRaw);

      // Temperature locale [0,1]
      let temp = granule * 0.6 + hotRegion * 0.5;
      temp = Math.max(0, Math.min(1, temp));

      // Couleur de base : interpolation cool -> hot
      let color = mixRgb(cfg.cool, cfg.hot, temp);

      // Centre de l'etoile plus brillant (effet de luminosite vue de face)
      const centerGlow = 1 - d2;
      color = [
        color[0] + (255 - color[0]) * centerGlow * 0.4,
        color[1] + (255 - color[1]) * centerGlow * 0.35,
        color[2] + (255 - color[2]) * centerGlow * 0.3,
      ];

      // Application des spots (taches sombres locales)
      if (spotMask > 0) {
        color = mixRgb(color as [number, number, number], cfg.spot, spotMask * 0.85);
      }

      // Limb darkening (assombrissement des bords)
      const limb = 0.55 + 0.45 * z;
      color = [color[0] * limb, color[1] * limb, color[2] * limb];

      const i = (py * PHOTO_SIZE + px) * 4;
      data[i] = Math.min(255, color[0]);
      data[i + 1] = Math.min(255, color[1]);
      data[i + 2] = Math.min(255, color[2]);
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

function getPhotoCache(starType: StarType, seed: number, time: number): HTMLCanvasElement | OffscreenCanvas {
  const key = starType + "-" + (seed >>> 0);
  let entry = photoCache.get(key);
  if (!entry || time - entry.lastUpdate > FRAME_INTERVAL_MS) {
    const phase = (time * 0.0006) % 100;
    const canvas = renderPhotosphere(starType, seed, phase);
    entry = { canvas, lastUpdate: time, phase };
    photoCache.set(key, entry);
  }
  return entry.canvas;
}

/**
 * Dessine une étoile au point (cx, cy) avec un rayon de référence baseRadius.
 * starType determine la palette et le scale. time anime corona et photosphere.
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, baseRadius: number,
  starType: StarType, time: number
) {
  const cfg = STAR_RENDER[starType];
  const r = baseRadius * cfg.scale;
  const pulse = 1 + 0.04 * Math.sin(time * 0.001 * cfg.pulse);

  // ---- Halo externe (corona lointaine, pulse) ----
  const haloR = r * 4.8 * pulse;
  const halo = ctx.createRadialGradient(cx, cy, r * 1.0, cx, cy, haloR);
  halo.addColorStop(0, cfg.coronaInner);
  halo.addColorStop(0.35, cfg.coronaMid);
  halo.addColorStop(1, cfg.coronaOuter);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Couronne intermediaire (plus dense pres de la surface) ----
  const coronaR = r * 2.3 * pulse;
  const corona = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, coronaR);
  corona.addColorStop(0, cfg.coronaInner);
  corona.addColorStop(0.6, cfg.coronaMid);
  corona.addColorStop(1, cfg.coronaOuter);
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Flares (rayons solaires anime) ----
  if (cfg.flares > 0.1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.00007);
    const rays = 18;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const len = r * (2.6 + Math.sin(time * 0.0012 + i * 1.7) * 0.5) * cfg.flares;
      const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      grad.addColorStop(0, "rgba(255, 220, 150, 0.32)");
      grad.addColorStop(1, "rgba(255, 220, 150, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- Photosphère cachée ----
  const photo = getPhotoCache(starType, Math.floor(cx + cy) | 0, time);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(photo as CanvasImageSource, cx - r - 1, cy - r - 1, r * 2 + 2, r * 2 + 2);
  ctx.restore();

  // ---- Brillance centrale (overlay additif) ----
  const flicker = 0.65 + 0.25 * Math.sin(time * 0.003 * cfg.pulse);
  const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.55);
  inner.addColorStop(0, "rgba(255, 255, 255, " + (flicker * 0.6) + ")");
  inner.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}
