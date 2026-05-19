"use client";

import { useEffect, useRef } from "react";

/**
 * Starfield — champ d'étoiles global, fond fixe.
 * - 250 étoiles avec scintillation aléatoire
 * - 3-4 nébuleuses radial-gradient discrètes
 * - Composant monté UNE SEULE FOIS (dans layout.tsx)
 * - Position fixe derrière tout le contenu
 */
type Star = {
  x: number;
  y: number;
  r: number;            // radius
  baseOpacity: number;
  twinkleSpeed: number;
  phase: number;
};

type Nebula = {
  x: number;            // 0..1 (% écran)
  y: number;            // 0..1
  radius: number;       // px
  hue: number;          // teinte bleue/violette
  alpha: number;
};

const STAR_COUNT = 250;

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildStars = () => {
      const stars: Star[] = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        // Bias radius distribution toward small (most stars tiny)
        const t = Math.random();
        const r = 0.5 + Math.pow(t, 3) * 2.5; // 0.5..3 px
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r,
          baseOpacity: 0.35 + Math.random() * 0.6,
          twinkleSpeed: 0.4 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;
    };

    const buildNebulae = () => {
      const palettes = [
        { hue: 215, alpha: 0.18 }, // deep blue
        { hue: 205, alpha: 0.14 }, // cyan-blue
        { hue: 250, alpha: 0.12 }, // indigo
        { hue: 195, alpha: 0.10 }, // teal-blue
      ];
      const nebulae: Nebula[] = palettes.map((p) => ({
        x: Math.random(),
        y: Math.random(),
        radius: Math.max(width, height) * (0.18 + Math.random() * 0.22),
        hue: p.hue,
        alpha: p.alpha,
      }));
      nebulaeRef.current = nebulae;
    };

    const drawNebulae = () => {
      for (const n of nebulaeRef.current) {
        const cx = n.x * width;
        const cy = n.y * height;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.radius);
        grad.addColorStop(0, `hsla(${n.hue}, 80%, 55%, ${n.alpha})`);
        grad.addColorStop(0.55, `hsla(${n.hue}, 70%, 30%, ${n.alpha * 0.35})`);
        grad.addColorStop(1, `hsla(${n.hue}, 70%, 10%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const drawStars = (time: number) => {
      for (const s of starsRef.current) {
        const flicker =
          0.5 + 0.5 * Math.sin(time * 0.001 * s.twinkleSpeed + s.phase);
        const a = s.baseOpacity * (0.55 + 0.45 * flicker);

        // glow halo for larger stars
        if (s.r > 1.7) {
          const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
          halo.addColorStop(0, `rgba(180, 220, 255, ${a * 0.35})`);
          halo.addColorStop(1, `rgba(180, 220, 255, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(220, 235, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let lastResize = 0;
    const onResize = () => {
      const now = Date.now();
      if (now - lastResize < 200) return;
      lastResize = now;
      resize();
      buildStars();
      buildNebulae();
    };

    resize();
    buildStars();
    buildNebulae();

    const tick = (time: number) => {
      // Subtle base — clear then draw
      ctx.clearRect(0, 0, width, height);
      drawNebulae();
      drawStars(time);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at center, #07111e 0%, #030610 60%, #010205 100%)",
      }}
    />
  );
}
