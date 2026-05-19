import type { StarType } from "@/types/domain";

export interface StarRenderConfig {
  /** Couleur du noyau */
  core: string;
  /** Couleur intermédiaire de la couronne */
  mid: string;
  /** Couleur extérieure (halo lointain) */
  outer: string;
  /** Rayon de base (multiplié par le rayon de référence du système) */
  scale: number;
  /** Vitesse de pulsation */
  pulse: number;
  /** Intensité de la couronne (rayons solaires) */
  flares: number;
}

export const STAR_RENDER: Record<StarType, StarRenderConfig> = {
  yellow_dwarf: {
    core: "#fff0c0",
    mid: "#ffa840",
    outer: "rgba(255, 140, 40, 0)",
    scale: 1.0,
    pulse: 1.0,
    flares: 1.0,
  },
  red_giant: {
    core: "#ffd0a0",
    mid: "#ff5028",
    outer: "rgba(180, 30, 10, 0)",
    scale: 1.55,
    pulse: 0.7,
    flares: 1.4,
  },
  white_dwarf: {
    core: "#ffffff",
    mid: "#9ad6ff",
    outer: "rgba(120, 180, 255, 0)",
    scale: 0.7,
    pulse: 1.4,
    flares: 0.6,
  },
  neutron: {
    core: "#ffffff",
    mid: "#cfe9ff",
    outer: "rgba(180, 220, 255, 0)",
    scale: 0.55,
    pulse: 2.2,
    flares: 0.4,
  },
  binary: {
    core: "#fff0c0",
    mid: "#ffa840",
    outer: "rgba(255, 140, 40, 0)",
    scale: 0.85,
    pulse: 1.0,
    flares: 1.0,
  },
};

/**
 * Dessine une étoile (corps stellaire avec pulsation et couronne).
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  starType: StarType,
  time: number
) {
  const cfg = STAR_RENDER[starType];
  const r = baseRadius * cfg.scale;
  const pulse = 1 + 0.04 * Math.sin(time * 0.001 * cfg.pulse);

  // ---- Halo extérieur (couronne lointaine) ----
  const haloR = r * 4.5 * pulse;
  const halo = ctx.createRadialGradient(cx, cy, r * 1.05, cx, cy, haloR);
  halo.addColorStop(0, "rgba(255, 200, 100, 0.18)");
  halo.addColorStop(0.5, cfg.mid.replace(")", ", 0.10)").replace("rgb(", "rgba(").replace("#", "#"));
  halo.addColorStop(1, cfg.outer);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Couronne intermédiaire avec pulsation ----
  const coronaR = r * 2.2 * pulse;
  const corona = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, coronaR);
  corona.addColorStop(0, cfg.mid);
  corona.addColorStop(0.55, "rgba(255, 120, 40, 0.35)");
  corona.addColorStop(1, "rgba(255, 80, 20, 0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Rayons (flares) ----
  if (cfg.flares > 0.1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 0.00007);
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const len = r * (2.4 + Math.sin(time * 0.001 + i) * 0.4) * cfg.flares;
      const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      grad.addColorStop(0, "rgba(255, 200, 120, 0.30)");
      grad.addColorStop(1, "rgba(255, 200, 120, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- Corps de l'étoile ----
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.4, cfg.core);
  core.addColorStop(1, cfg.mid);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // ---- Brillance centrale ----
  const flicker = 0.75 + 0.25 * Math.sin(time * 0.003 * cfg.pulse);
  const inner = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.4);
  inner.addColorStop(0, `rgba(255, 255, 255, ${flicker})`);
  inner.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
}
