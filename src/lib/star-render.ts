import type { StarType } from "@/types/domain";

/**
 * Rendu d'etoile minimaliste : disque colore + halo radial + corona.
 * Pas de texture, juste de la lumiere.
 */

export interface StarRenderConfig {
  /** Couleur centrale (presque blanche pour les etoiles chaudes) */
  core: string;
  /** Couleur dominante (la "vraie" couleur de l'etoile) */
  body: string;
  /** Couleur corona interieure */
  coronaInner: string;
  /** Couleur corona milieu (rgba) */
  coronaMid: string;
  /** Couleur corona externe (rgba 0) */
  coronaOuter: string;
  scale: number;
  pulse: number;
}

export const STAR_RENDER: Record<StarType, StarRenderConfig> = {
  yellow_dwarf: {
    core: "rgba(255, 250, 220, 1)",
    body: "rgba(255, 200, 90, 1)",
    coronaInner: "rgba(255, 220, 140, 0.55)",
    coronaMid:   "rgba(255, 165, 60, 0.22)",
    coronaOuter: "rgba(255, 130, 30, 0)",
    scale: 1.0, pulse: 1.0,
  },
  red_giant: {
    core: "rgba(255, 200, 140, 1)",
    body: "rgba(230, 90, 40, 1)",
    coronaInner: "rgba(255, 140, 80, 0.55)",
    coronaMid:   "rgba(220, 70, 30, 0.22)",
    coronaOuter: "rgba(180, 35, 10, 0)",
    scale: 1.55, pulse: 0.7,
  },
  white_dwarf: {
    core: "rgba(255, 255, 255, 1)",
    body: "rgba(225, 240, 255, 1)",
    coronaInner: "rgba(240, 250, 255, 0.65)",
    coronaMid:   "rgba(190, 220, 255, 0.22)",
    coronaOuter: "rgba(140, 200, 255, 0)",
    scale: 0.7, pulse: 1.4,
  },
  neutron: {
    core: "rgba(255, 255, 255, 1)",
    body: "rgba(220, 240, 255, 1)",
    coronaInner: "rgba(255, 255, 255, 0.78)",
    coronaMid:   "rgba(190, 230, 255, 0.32)",
    coronaOuter: "rgba(140, 200, 255, 0)",
    scale: 0.55, pulse: 2.2,
  },
  binary: {
    core: "rgba(255, 250, 220, 1)",
    body: "rgba(255, 200, 90, 1)",
    coronaInner: "rgba(255, 220, 140, 0.55)",
    coronaMid:   "rgba(255, 165, 60, 0.22)",
    coronaOuter: "rgba(255, 130, 30, 0)",
    scale: 0.85, pulse: 1.0,
  },
};

/**
 * Dessine une etoile au point (cx, cy).
 * Sphere lumineuse coloree avec halo radial et corona pulsante.
 */
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, baseRadius: number,
  starType: StarType, time: number
) {
  const cfg = STAR_RENDER[starType];
  const r = baseRadius * cfg.scale;
  const pulse = 1 + 0.04 * Math.sin(time * 0.001 * cfg.pulse);

  // ---- Halo externe large ----
  const haloR = r * 4.8 * pulse;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, haloR);
  halo.addColorStop(0, cfg.coronaInner);
  halo.addColorStop(0.35, cfg.coronaMid);
  halo.addColorStop(1, cfg.coronaOuter);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Corona intermediaire (plus dense pres de la surface) ----
  const coronaR = r * 2.2 * pulse;
  const corona = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, coronaR);
  corona.addColorStop(0, cfg.coronaInner);
  corona.addColorStop(0.55, cfg.coronaMid);
  corona.addColorStop(1, cfg.coronaOuter);
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Disque coloree (body) ----
  ctx.fillStyle = cfg.body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // ---- Centre brillant (core glow) ----
  const flicker = 0.85 + 0.10 * Math.sin(time * 0.002 * cfg.pulse);
  const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  innerGrad.addColorStop(0, cfg.core);
  innerGrad.addColorStop(0.6, cfg.body);
  innerGrad.addColorStop(1, cfg.body);
  ctx.globalAlpha = flicker;
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ---- Effet bord doux (limb soften) ----
  const edge = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.05);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, cfg.coronaInner);
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
  ctx.fill();
}
