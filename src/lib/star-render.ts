import type { StarType } from "@/types/domain";
import { fbm, ridge, smoothstep, mixRgb, warpedFbm } from "@/lib/noise";

/**
 * Rendu d'etoile en 2 strategies :
 *  - "smooth"  : surface quasi uniforme et lumineuse (white_dwarf, neutron)
 *  - "lava"    : surface type magma rouge/orange avec taches plus foncees (yellow_dwarf, red_giant)
 *
 * La photosphere est rendue UNE SEULE FOIS (cache forever par star_type + seed).
 * L'animation passe uniquement par des overlays additifs dessines a chaque frame :
 *  - hot spots qui derivent lentement
 *  - respiration globale (alpha)
 *  - corona / halo / flares
 */

type Surface = "smooth" | "lava";

export interface StarRenderConfig {
  surface: Surface;
  /** Couleur la plus chaude (pics) */
  hot: [number, number, number];
  /** Couleur de base (croute lave ou ton dominant pour smooth) */
  base: [number, number, number];
  /** Couleur des taches plus foncees */
  spot: [number, number, number];
  /** Couleur du noyau central additif */
  core: [number, number, number];
  /** Couleur des hot spots animes (overlay) */
  emberHot: [number, number, number];
  /** Corona externe (rgba) */
  coronaOuter: string;
  /** Corona intermediaire (rgba) */
  coronaMid: string;
  /** Corona proche surface */
  coronaInner: string;
  scale: number;
  flares: number;
  pulse: number;
}

export const STAR_RENDER: Record<StarType, StarRenderConfig> = {
  yellow_dwarf: {
    surface: "lava",
    hot:  [255, 210, 90],
    base: [205,  70,  10],
    spot: [ 95,  25,   5],
    core: [255, 240, 180],
    emberHot: [255, 200, 80],
    coronaOuter: "rgba(255, 120,  30, 0)",
    coronaMid:   "rgba(255, 150,  50, 0.22)",
    coronaInner: "rgba(255, 210, 120, 0.55)",
    scale: 1.0, flares: 1.0, pulse: 1.0,
  },
  red_giant: {
    surface: "lava",
    hot:  [255, 150,  60],
    base: [160,  35,  10],
    spot: [ 60,  10,   3],
    core: [255, 180, 100],
    emberHot: [255, 120, 40],
    coronaOuter: "rgba(180,  35,  10, 0)",
    coronaMid:   "rgba(220,  70,  30, 0.22)",
    coronaInner: "rgba(255, 140,  80, 0.5)",
    scale: 1.55, flares: 1.4, pulse: 0.7,
  },
  white_dwarf: {
    surface: "smooth",
    hot:  [255, 255, 255],
    base: [230, 240, 255],
    spot: [200, 220, 245],
    core: [255, 255, 255],
    emberHot: [255, 255, 255],
    coronaOuter: "rgba(150, 200, 255, 0)",
    coronaMid:   "rgba(200, 230, 255, 0.22)",
    coronaInner: "rgba(245, 250, 255, 0.65)",
    scale: 0.7, flares: 0.5, pulse: 1.4,
  },
  neutron: {
    surface: "smooth",
    hot:  [255, 255, 255],
    base: [210, 235, 255],
    spot: [170, 210, 250],
    core: [255, 255, 255],
    emberHot: [220, 240, 255],
    coronaOuter: "rgba(140, 200, 255, 0)",
    coronaMid:   "rgba(190, 230, 255, 0.32)",
    coronaInner: "rgba(255, 255, 255, 0.78)",
    scale: 0.55, flares: 0.3, pulse: 2.2,
  },
  binary: {
    surface: "lava",
    hot:  [255, 210,  90],
    base: [205,  70,  10],
    spot: [ 95,  25,   5],
    core: [255, 240, 180],
    emberHot: [255, 200, 80],
    coronaOuter: "rgba(255, 120, 30, 0)",
    coronaMid:   "rgba(255, 150, 50, 0.22)",
    coronaInner: "rgba(255, 210, 120, 0.55)",
    scale: 0.85, flares: 1.0, pulse: 1.0,
  },
};

const PHOTO_SIZE = 256;
const photoCache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();

function makeOffscreen(size: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(size, size);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  return c;
}

function renderLava(seed: number, cfg: StarRenderConfig): HTMLCanvasElement | OffscreenCanvas {
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
      // Projection sphere -> UV en gardant compte de l'inclinaison
      const ux = (dx / (z + 0.4)) * 1.8;
      const uy = (dy / (z + 0.4)) * 1.8;

      // Granulation fine (cellules de convection)
      const granule = fbm(ux * 5.5, uy * 5.5, seed, 4);
      // Veines de lave chaude basse frequence avec domain warp
      const veins = warpedFbm(ux * 2.2, uy * 2.2, seed + 700, 1.2);
      // Taches plus foncees (zones moins chaudes)
      const spotRaw = ridge(ux * 1.8, uy * 1.8, seed + 1500, 3);
      const spotMask = smoothstep(0.62, 0.88, spotRaw);

      // Temperature normalisee : combine granulation + veines
      let temp = granule * 0.45 + veins * 0.65;
      temp = Math.max(0, Math.min(1, temp));
      // Boost contraste pour effet lave
      temp = Math.pow(temp, 0.85);

      // Couleur base -> hot
      let color = mixRgb(cfg.base, cfg.hot, temp);

      // Taches sombres
      if (spotMask > 0) {
        color = mixRgb(color as [number, number, number], cfg.spot, spotMask * 0.7);
      }

      // Brillance centrale (effet de luminosite vue de face)
      const centerGlow = Math.pow(1 - d2, 1.2);
      color = [
        color[0] + (cfg.core[0] - color[0]) * centerGlow * 0.35,
        color[1] + (cfg.core[1] - color[1]) * centerGlow * 0.30,
        color[2] + (cfg.core[2] - color[2]) * centerGlow * 0.25,
      ];

      // Limb darkening (assombrissement des bords)
      const limb = 0.5 + 0.5 * z;
      color = [color[0] * limb, color[1] * limb, color[2] * limb];

      const i = (py * PHOTO_SIZE + px) * 4;
      data[i]     = Math.min(255, color[0]);
      data[i + 1] = Math.min(255, color[1]);
      data[i + 2] = Math.min(255, color[2]);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function renderSmooth(seed: number, cfg: StarRenderConfig): HTMLCanvasElement | OffscreenCanvas {
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
      const ux = dx * 1.5;
      const uy = dy * 1.5;

      // Variation tres legere basse frequence
      const subtle = fbm(ux * 1.2, uy * 1.2, seed, 3);
      const t = 0.7 + subtle * 0.3;
      let color: [number, number, number] = [
        cfg.base[0] + (cfg.hot[0] - cfg.base[0]) * t,
        cfg.base[1] + (cfg.hot[1] - cfg.base[1]) * t,
        cfg.base[2] + (cfg.hot[2] - cfg.base[2]) * t,
      ];

      // Centre presque blanc pur
      const centerGlow = Math.pow(1 - d2, 0.6);
      color = [
        color[0] + (255 - color[0]) * centerGlow * 0.55,
        color[1] + (255 - color[1]) * centerGlow * 0.55,
        color[2] + (255 - color[2]) * centerGlow * 0.55,
      ];

      // Limb darkening doux
      const limb = 0.7 + 0.3 * z;
      color = [color[0] * limb, color[1] * limb, color[2] * limb];

      const i = (py * PHOTO_SIZE + px) * 4;
      data[i]     = Math.min(255, color[0]);
      data[i + 1] = Math.min(255, color[1]);
      data[i + 2] = Math.min(255, color[2]);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function getPhotoCache(starType: StarType, seed: number): HTMLCanvasElement | OffscreenCanvas {
  const key = starType + "-" + (seed >>> 0);
  let entry = photoCache.get(key);
  if (!entry) {
    const cfg = STAR_RENDER[starType];
    entry = cfg.surface === "lava" ? renderLava(seed, cfg) : renderSmooth(seed, cfg);
    photoCache.set(key, entry);
  }
  return entry;
}

/**
 * Dessine une etoile au point (cx, cy). La photosphere est statique (cachee).
 * L'animation passe par des overlays additifs et la corona.
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, baseRadius: number,
  starType: StarType, time: number
) {
  const cfg = STAR_RENDER[starType];
  const r = baseRadius * cfg.scale;
  const pulse = 1 + 0.04 * Math.sin(time * 0.001 * cfg.pulse);

  // ---- Halo externe ----
  const haloR = r * 4.8 * pulse;
  const halo = ctx.createRadialGradient(cx, cy, r * 1.0, cx, cy, haloR);
  halo.addColorStop(0, cfg.coronaInner);
  halo.addColorStop(0.35, cfg.coronaMid);
  halo.addColorStop(1, cfg.coronaOuter);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Couronne intermediaire ----
  const coronaR = r * 2.3 * pulse;
  const corona = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, coronaR);
  corona.addColorStop(0, cfg.coronaInner);
  corona.addColorStop(0.6, cfg.coronaMid);
  corona.addColorStop(1, cfg.coronaOuter);
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Flares (rayons) ----
  if (cfg.flares > 0.1) {
    ctx.save();
    ctx.translate(cx, cy);
    const rays = 18;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const len = r * (2.6 + Math.sin(time * 0.0009 + i * 1.7) * 0.45) * cfg.flares;
      const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      grad.addColorStop(0, "rgba(255, 220, 150, 0.30)");
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

  // ---- Photosphere statique cachee ----
  const seed = Math.floor(cx * 31 + cy * 17 + r * 7) | 0;
  const photo = getPhotoCache(starType, seed);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(photo as CanvasImageSource, cx - r - 1, cy - r - 1, r * 2 + 2, r * 2 + 2);

  // ---- Overlays animes (sur surface clippee) ----
  if (cfg.surface === "lava") {
    // 3 hot spots qui derivent lentement (additif)
    ctx.globalCompositeOperation = "lighter";
    const e = cfg.emberHot;
    for (let i = 0; i < 3; i++) {
      const phase = time * 0.00018 + i * 2.094; // 2pi/3
      const ox = Math.cos(phase + i * 1.7) * r * 0.55;
      const oy = Math.sin(phase * 1.3 + i * 2.1) * r * 0.55;
      const breath = 0.45 + 0.35 * Math.sin(time * 0.0011 + i * 1.3);
      const spotR = r * (0.45 + 0.1 * Math.sin(time * 0.0008 + i));
      const g = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, spotR);
      g.addColorStop(0, "rgba(" + e[0] + "," + e[1] + "," + e[2] + "," + (breath * 0.35) + ")");
      g.addColorStop(0.5, "rgba(" + e[0] + "," + e[1] + "," + e[2] + "," + (breath * 0.12) + ")");
      g.addColorStop(1, "rgba(" + e[0] + "," + e[1] + "," + e[2] + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, spotR, 0, Math.PI * 2);
      ctx.fill();
    }
    // Respiration globale (subtile)
    const breathAll = 0.18 + 0.10 * Math.sin(time * 0.0009);
    const gAll = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gAll.addColorStop(0, "rgba(255, 220, 140," + breathAll + ")");
    gAll.addColorStop(1, "rgba(255, 220, 140, 0)");
    ctx.fillStyle = gAll;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else {
    // Smooth : juste un noyau central pulsant
    ctx.globalCompositeOperation = "lighter";
    const flicker = 0.55 + 0.30 * Math.sin(time * 0.0025 * cfg.pulse);
    const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.75);
    inner.addColorStop(0, "rgba(255, 255, 255, " + (flicker * 0.55) + ")");
    inner.addColorStop(0.5, "rgba(255, 255, 255, " + (flicker * 0.18) + ")");
    inner.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.restore();

  // ---- Noyau central additif (toujours) ----
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const flicker = 0.55 + 0.25 * Math.sin(time * 0.003 * cfg.pulse);
  const innerCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.4);
  innerCore.addColorStop(0, "rgba(" + cfg.core[0] + "," + cfg.core[1] + "," + cfg.core[2] + "," + (flicker * 0.5) + ")");
  innerCore.addColorStop(1, "rgba(" + cfg.core[0] + "," + cfg.core[1] + "," + cfg.core[2] + ",0)");
  ctx.fillStyle = innerCore;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
