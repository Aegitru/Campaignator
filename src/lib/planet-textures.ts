import type { PlanetType, PlanetVariant } from "@/types/domain";

/**
 * Palettes procédurales des planètes : 5 types × 4 variantes.
 * Le rendu Canvas (cf. drawPlanet) combine ces couleurs avec un bruit simple
 * et des radial-gradients pour obtenir une texture unique par combinaison.
 */
export interface PlanetPalette {
  /** Couleur dominante de surface */
  base: string;
  /** Couleur secondaire (mers, bandes, ombres) */
  mid: string;
  /** Couleur des reliefs ou highlights */
  high: string;
  /** Couleur d'atmosphère / halo */
  glow: string;
  /** Style de texture */
  texture: "speckled" | "bands" | "liquid" | "barren" | "metallic";
  /** Nom court pour debug */
  label: string;
}

type VariantMap = Record<PlanetVariant, PlanetPalette>;

export const PLANET_PALETTES: Record<PlanetType, VariantMap> = {
  rocky: {
    1: {
      base: "#a8462b",
      mid: "#6b2716",
      high: "#e89070",
      glow: "rgba(255, 120, 80, 0.32)",
      texture: "speckled",
      label: "Rouge-Mars",
    },
    2: {
      base: "#9aa0aa",
      mid: "#4a505c",
      high: "#d7dbe2",
      glow: "rgba(200, 215, 240, 0.28)",
      texture: "barren",
      label: "Gris-Lune",
    },
    3: {
      base: "#c08540",
      mid: "#7a4f20",
      high: "#f0c285",
      glow: "rgba(240, 200, 130, 0.30)",
      texture: "speckled",
      label: "Ocre-Désert",
    },
    4: {
      base: "#6e3a26",
      mid: "#2c0f06",
      high: "#d65a2a",
      glow: "rgba(255, 100, 40, 0.45)",
      texture: "speckled",
      label: "Brun-Volcanique",
    },
  },
  gaseous: {
    1: {
      base: "#c5a777",
      mid: "#7a5d35",
      high: "#f0dca9",
      glow: "rgba(240, 220, 170, 0.32)",
      texture: "bands",
      label: "Beige-Jupiter",
    },
    2: {
      base: "#3a6ec0",
      mid: "#1e3a78",
      high: "#7fb0ff",
      glow: "rgba(120, 170, 255, 0.40)",
      texture: "bands",
      label: "Bleu-Neptune",
    },
    3: {
      base: "#6a3b8a",
      mid: "#321a48",
      high: "#b27fd0",
      glow: "rgba(180, 130, 220, 0.38)",
      texture: "bands",
      label: "Violet-Tempête",
    },
    4: {
      base: "#d8c389",
      mid: "#8e7846",
      high: "#fdebb5",
      glow: "rgba(255, 235, 180, 0.32)",
      texture: "bands",
      label: "Crème-Saturne",
    },
  },
  oceanic: {
    1: {
      base: "#1a4a8a",
      mid: "#0a1f48",
      high: "#5da8e8",
      glow: "rgba(100, 170, 240, 0.42)",
      texture: "liquid",
      label: "Bleu-Profond",
    },
    2: {
      base: "#2ba9b8",
      mid: "#0d5a66",
      high: "#7ee0ec",
      glow: "rgba(120, 230, 240, 0.45)",
      texture: "liquid",
      label: "Turquoise",
    },
    3: {
      base: "#3a7a55",
      mid: "#143d27",
      high: "#7ec39a",
      glow: "rgba(130, 200, 160, 0.38)",
      texture: "liquid",
      label: "Vert-Algues",
    },
    4: {
      base: "#c8dde8",
      mid: "#7196ab",
      high: "#ffffff",
      glow: "rgba(220, 240, 255, 0.55)",
      texture: "liquid",
      label: "Blanc-Glacé",
    },
  },
  dead: {
    1: {
      base: "#1e1e22",
      mid: "#070708",
      high: "#3b3b40",
      glow: "rgba(70, 70, 80, 0.20)",
      texture: "barren",
      label: "Noir-Charbon",
    },
    2: {
      base: "#7a7570",
      mid: "#3c3935",
      high: "#bdb6ae",
      glow: "rgba(160, 155, 150, 0.22)",
      texture: "barren",
      label: "Gris-Cendres",
    },
    3: {
      base: "#5a3a26",
      mid: "#2a1809",
      high: "#a06a3f",
      glow: "rgba(180, 100, 50, 0.35)",
      texture: "barren",
      label: "Brun-Irradié",
    },
    4: {
      base: "#dfd2bd",
      mid: "#8e8170",
      high: "#fff3e0",
      glow: "rgba(255, 240, 220, 0.30)",
      texture: "barren",
      label: "Blanc-Os",
    },
  },
  fortress: {
    1: {
      base: "#6f7c8a",
      mid: "#2b3340",
      high: "#c8d5e5",
      glow: "rgba(180, 200, 230, 0.35)",
      texture: "metallic",
      label: "Métallique-Acier",
    },
    2: {
      base: "#a87a3e",
      mid: "#553a12",
      high: "#e8c182",
      glow: "rgba(230, 190, 130, 0.38)",
      texture: "metallic",
      label: "Bronze-Antique",
    },
    3: {
      base: "#1d1f24",
      mid: "#050608",
      high: "#4e5868",
      glow: "rgba(80, 100, 140, 0.30)",
      texture: "metallic",
      label: "Noir-Adamantium",
    },
    4: {
      base: "#dfe4ec",
      mid: "#6a7382",
      high: "#ffffff",
      glow: "rgba(220, 235, 255, 0.50)",
      texture: "metallic",
      label: "Chrome-Glacé",
    },
  },
};

export function getPalette(type: PlanetType, variant: PlanetVariant): PlanetPalette {
  return PLANET_PALETTES[type][variant] ?? PLANET_PALETTES[type][1];
}

/**
 * PRNG simple (mulberry32) — pour générer des textures déterministes
 * à partir d'un ID de planète (chaque planète aura toujours la même apparence).
 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Dessine une planète à un emplacement (cx, cy) avec un rayon r.
 * Le rendu est complètement procédural — aucune image externe.
 */
export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  type: PlanetType,
  variant: PlanetVariant,
  seed: number
) {
  const palette = getPalette(type, variant);
  const rand = seededRandom(seed);

  ctx.save();
  ctx.translate(cx, cy);

  // ---- Halo atmosphérique extérieur ----
  const haloR = r * 1.35;
  const haloGrad = ctx.createRadialGradient(0, 0, r * 0.95, 0, 0, haloR);
  haloGrad.addColorStop(0, palette.glow);
  haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();

  // ---- Disque planétaire (clip pour les textures internes) ----
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  // Base
  ctx.fillStyle = palette.base;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // Texture selon le type
  switch (palette.texture) {
    case "bands": {
      // Bandes horizontales (gazeuses)
      const bands = 7 + Math.floor(rand() * 5);
      for (let i = 0; i < bands; i++) {
        const y = -r + (r * 2 * i) / bands + rand() * 4 - 2;
        const h = (r * 2) / bands;
        const useMid = rand() > 0.5;
        ctx.fillStyle = useMid ? palette.mid : palette.high;
        ctx.globalAlpha = 0.25 + rand() * 0.25;
        ctx.fillRect(-r, y, r * 2, h * (0.55 + rand() * 0.4));
      }
      ctx.globalAlpha = 1;
      // Tâche cyclonique
      if (rand() > 0.4) {
        const sx = -r * 0.3 + rand() * r * 0.5;
        const sy = -r * 0.2 + rand() * r * 0.3;
        const sR = r * (0.12 + rand() * 0.18);
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sR);
        g.addColorStop(0, palette.high);
        g.addColorStop(1, palette.mid);
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(sx, sy, sR, sR * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case "liquid": {
      // Continents flottants (oceanic)
      const blobs = 5 + Math.floor(rand() * 5);
      for (let i = 0; i < blobs; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * r * 0.7;
        const bx = Math.cos(angle) * dist;
        const by = Math.sin(angle) * dist;
        const bR = r * (0.1 + rand() * 0.22);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, bR);
        g.addColorStop(0, palette.high);
        g.addColorStop(0.6, palette.mid);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.globalAlpha = 0.5 + rand() * 0.3;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(bx, by, bR, bR * (0.6 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "speckled": {
      // Cratères / reliefs (rocky)
      const dots = 60 + Math.floor(rand() * 60);
      for (let i = 0; i < dots; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * r * 0.95;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const dR = 1 + rand() * (r * 0.06);
        ctx.fillStyle = rand() > 0.55 ? palette.mid : palette.high;
        ctx.globalAlpha = 0.25 + rand() * 0.45;
        ctx.beginPath();
        ctx.arc(dx, dy, dR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Failles
      const cracks = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < cracks; i++) {
        ctx.strokeStyle = palette.mid;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1 + rand();
        ctx.beginPath();
        const sx = (rand() - 0.5) * r * 1.8;
        const sy = (rand() - 0.5) * r * 1.8;
        ctx.moveTo(sx, sy);
        let px = sx;
        let py = sy;
        const steps = 6 + Math.floor(rand() * 6);
        for (let s = 0; s < steps; s++) {
          px += (rand() - 0.5) * r * 0.4;
          py += (rand() - 0.5) * r * 0.4;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "barren": {
      // Surface stérile, poussière fine
      const dust = 200 + Math.floor(rand() * 200);
      for (let i = 0; i < dust; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * r;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        ctx.fillStyle = rand() > 0.5 ? palette.high : palette.mid;
        ctx.globalAlpha = 0.08 + rand() * 0.2;
        ctx.fillRect(dx, dy, 1.2, 1.2);
      }
      // Cratères larges
      const craters = 6 + Math.floor(rand() * 6);
      for (let i = 0; i < craters; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * r * 0.85;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const dR = r * (0.04 + rand() * 0.12);
        const g = ctx.createRadialGradient(dx, dy, 0, dx, dy, dR);
        g.addColorStop(0, palette.mid);
        g.addColorStop(0.7, palette.high);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(dx, dy, dR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "metallic": {
      // Structures géométriques (fortress)
      const rings = 4 + Math.floor(rand() * 3);
      for (let i = 0; i < rings; i++) {
        ctx.strokeStyle = palette.high;
        ctx.globalAlpha = 0.18 + rand() * 0.2;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.2 + i * 0.18), 0, Math.PI * 2);
        ctx.stroke();
      }
      const segs = 18;
      for (let i = 0; i < segs; i++) {
        ctx.strokeStyle = palette.mid;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        const a = (i / segs) * Math.PI * 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      // Plaques métalliques
      const plates = 14 + Math.floor(rand() * 10);
      for (let i = 0; i < plates; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * r * 0.85;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const w = r * (0.08 + rand() * 0.12);
        const h = r * (0.04 + rand() * 0.08);
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(angle);
        ctx.fillStyle = rand() > 0.5 ? palette.high : palette.mid;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }

  // ---- Ombrage spherique (light from upper-left) ----
  const shade = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  shade.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  shade.addColorStop(0.45, "rgba(255, 255, 255, 0)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = shade;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // ---- Terminator (ombre côté nuit) ----
  const term = ctx.createRadialGradient(r * 0.55, r * 0.4, r * 0.2, 0, 0, r);
  term.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  term.addColorStop(0.55, "rgba(0, 0, 0, 0.15)");
  term.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = term;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  ctx.restore(); // unclip
  ctx.restore(); // translate
}
