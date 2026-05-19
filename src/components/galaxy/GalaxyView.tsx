"use client";

import { useEffect, useRef, useState } from "react";
import type { StellarSystem } from "@/types/domain";

interface Props {
  systems: StellarSystem[];
  onSystemClick: (s: StellarSystem) => void;
  editing: boolean;
  placingMode: boolean;
  onPlace: (x: number, y: number) => void;
  onMoveSystem?: (id: string, x: number, y: number) => void;
}

interface CanvasStar { x: number; y: number; r: number; baseOpacity: number; armIdx: number }

const STAR_COUNT_PER_ARM = 800;
const ARMS = 2;

export default function GalaxyView({
  systems, onSystemClick, editing, placingMode, onPlace, onMoveSystem,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hover, setHover] = useState<{ system: StellarSystem; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<{ id: string } | null>(null);
  const starsRef = useRef<CanvasStar[]>([]);

  useEffect(() => {
    const update = () => {
      const el = wrapperRef.current; if (!el) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const stars: CanvasStar[] = [];
    for (let arm = 0; arm < ARMS; arm++) {
      for (let i = 0; i < STAR_COUNT_PER_ARM; i++) {
        const t = (i / STAR_COUNT_PER_ARM) * 6 + Math.random() * 0.4;
        const angle = t + (arm * Math.PI * 2) / ARMS;
        const r = 0.04 + t * 0.18;
        const scatter = (Math.random() - 0.5) * 0.07;
        const xRel = Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * scatter;
        const yRel = Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * scatter;
        const x = 50 + xRel * 50;
        const y = 50 + yRel * 50;
        stars.push({ x, y, r: Math.random() * 1.4 + 0.3, baseOpacity: 0.25 + Math.random() * 0.55, armIdx: arm });
      }
    }
    for (let i = 0; i < 300; i++) {
      stars.push({ x: Math.random() * 100, y: Math.random() * 100,
        r: 0.4 + Math.random() * 0.6, baseOpacity: 0.1 + Math.random() * 0.3, armIdx: -1 });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size.w * dpr); canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = `${size.w}px`; canvas.style.height = `${size.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size.w / 2;
    const cy = size.h / 2;
    const galaxyR = Math.min(size.w, size.h) * 0.48;
    const toScreen = (gx: number, gy: number) => ({ x: cx + (gx - 50) / 50 * galaxyR, y: cy + (gy - 50) / 50 * galaxyR });

    const tick = (time: number) => {
      ctx.clearRect(0, 0, size.w, size.h);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, galaxyR * 0.25);
      coreGrad.addColorStop(0, "rgba(220, 235, 255, 0.85)");
      coreGrad.addColorStop(0.4, "rgba(140, 180, 255, 0.5)");
      coreGrad.addColorStop(1, "rgba(50, 90, 180, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath(); ctx.arc(cx, cy, galaxyR * 0.25, 0, Math.PI * 2); ctx.fill();

      const rot = time * 0.000013;
      const cosR = Math.cos(rot), sinR = Math.sin(rot);
      for (const s of starsRef.current) {
        const dx = (s.x - 50) / 50; const dy = (s.y - 50) / 50;
        const rx = dx * cosR - dy * sinR;
        const ry = dx * sinR + dy * cosR;
        const sx = cx + rx * galaxyR;
        const sy = cy + ry * galaxyR;
        if (sx < -10 || sy < -10 || sx > size.w + 10 || sy > size.h + 10) continue;
        ctx.fillStyle = s.armIdx >= 0
          ? `rgba(180, 220, 255, ${s.baseOpacity})`
          : `rgba(160, 180, 220, ${s.baseOpacity * 0.6})`;
        ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI * 2); ctx.fill();
      }

      const nebulae = [
        { x: 30, y: 35, r: 0.25, h: 215 },
        { x: 65, y: 60, r: 0.30, h: 250 },
        { x: 50, y: 30, r: 0.18, h: 195 },
      ];
      for (const n of nebulae) {
        const p = toScreen(n.x, n.y);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, galaxyR * n.r);
        g.addColorStop(0, `hsla(${n.h}, 80%, 55%, 0.18)`);
        g.addColorStop(1, `hsla(${n.h}, 80%, 30%, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size.w, size.h);
      }

      for (const s of systems) {
        const p = toScreen(s.galaxy_pos_x, s.galaxy_pos_y);
        const pulse = 1 + 0.3 * Math.sin(time * 0.003 + s.galaxy_pos_x);
        const isHover = hover?.system.id === s.id;
        const r = isHover ? 8 : 5;
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4 * pulse);
        halo.addColorStop(0, "rgba(127, 223, 255, 0.6)");
        halo.addColorStop(0.5, "rgba(0, 170, 255, 0.25)");
        halo.addColorStop(1, "rgba(0, 170, 255, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 4 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isHover ? "#ffffff" : "#dff5ff";
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.font = `${isHover ? 12 : 10}px var(--font-share-tech-mono), monospace`;
        ctx.fillStyle = isHover ? "#ffffff" : "rgba(200, 220, 240, 0.85)";
        ctx.textAlign = "left";
        ctx.fillText(s.name.toUpperCase(), p.x + r + 8, p.y + 4);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [size.w, size.h, systems, hover]);

  const screenToGalaxy = (sx: number, sy: number) => {
    const cx = size.w / 2; const cy = size.h / 2;
    const galaxyR = Math.min(size.w, size.h) * 0.48;
    return { x: ((sx - cx) / galaxyR) * 50 + 50, y: ((sy - cy) / galaxyR) * 50 + 50 };
  };

  const systemAt = (sx: number, sy: number): StellarSystem | null => {
    const cx = size.w / 2; const cy = size.h / 2;
    const galaxyR = Math.min(size.w, size.h) * 0.48;
    for (const s of systems) {
      const x = cx + (s.galaxy_pos_x - 50) / 50 * galaxyR;
      const y = cy + (s.galaxy_pos_y - 50) / 50 * galaxyR;
      if (Math.hypot(sx - x, sy - y) <= 12) return s;
    }
    return null;
  };

  const handleMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left; const sy = e.clientY - rect.top;
    if (dragging && onMoveSystem) {
      const g = screenToGalaxy(sx, sy);
      onMoveSystem(dragging.id, Math.max(0, Math.min(100, g.x)), Math.max(0, Math.min(100, g.y)));
      return;
    }
    const s = systemAt(sx, sy);
    setHover(s ? { system: s, x: sx, y: sy } : null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left; const sy = e.clientY - rect.top;
    if (placingMode) {
      const g = screenToGalaxy(sx, sy);
      onPlace(Math.max(0, Math.min(100, g.x)), Math.max(0, Math.min(100, g.y)));
      return;
    }
    const s = systemAt(sx, sy);
    if (s) onSystemClick(s);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editing || placingMode) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left; const sy = e.clientY - rect.top;
    const s = systemAt(sx, sy);
    if (s) setDragging({ id: s.id });
  };

  const handleMouseUp = () => setDragging(null);

  return (
    <div ref={wrapperRef} className="relative w-full h-full overflow-hidden"
      style={{ cursor: placingMode ? "crosshair" : hover ? "pointer" : "default" }}>
      <canvas ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={() => { setHover(null); setDragging(null); }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      {hover && !dragging && (
        <div className="hud-panel hud-panel--strong pointer-events-none"
          style={{ position: "absolute", left: Math.min(hover.x + 16, size.w - 200), top: hover.y + 16, padding: "8px 12px", zIndex: 20 }}>
          <div className="hud-title text-sm">{hover.system.name}</div>
          <div className="hud-label">{hover.system.star_type}</div>
        </div>
      )}
      {placingMode && (
        <div className="hud-panel--inset px-3 py-2 absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="hud-label" style={{ color: "var(--accent-cyan)" }}>● MODE PLACEMENT - Clic dans la galaxie</span>
        </div>
      )}
    </div>
  );
}
