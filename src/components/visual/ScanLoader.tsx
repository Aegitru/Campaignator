"use client";

import { useEffect, useRef } from "react";

interface Props {
  label?: string;
}

/**
 * Loader immersif "scan spatial" : cercle de scan tournant + texte HUD.
 */
export default function ScanLoader({ label = "SCANNING SECTOR" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 260;
    canvas.width = SIZE * dpr; canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`; canvas.style.height = `${SIZE}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tick = (time: number) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const cx = SIZE / 2; const cy = SIZE / 2;

      // Rotating sweep
      const angle = (time * 0.002) % (Math.PI * 2);
      // Sector sweep
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, SIZE / 2, 0);
      grad.addColorStop(0, "rgba(127, 223, 255, 0)");
      grad.addColorStop(0.7, "rgba(127, 223, 255, 0.18)");
      grad.addColorStop(1, "rgba(127, 223, 255, 0.45)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, SIZE / 2 - 4, -0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Concentric rings
      for (let i = 1; i <= 4; i++) {
        const r = (SIZE / 2 - 4) * (i / 4);
        ctx.strokeStyle = `rgba(0, 170, 255, ${0.18 + (i / 4) * 0.12})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }
      // Cross
      ctx.strokeStyle = "rgba(0, 170, 255, 0.18)";
      ctx.beginPath();
      ctx.moveTo(cx, 4); ctx.lineTo(cx, SIZE - 4);
      ctx.moveTo(4, cy); ctx.lineTo(SIZE - 4, cy);
      ctx.stroke();
      // Outer circle
      ctx.strokeStyle = "rgba(127, 223, 255, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, SIZE / 2 - 4, 0, Math.PI * 2); ctx.stroke();

      // Center pulsing dot
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
      ctx.fillStyle = `rgba(127, 223, 255, ${0.6 + pulse * 0.4})`;
      ctx.beginPath(); ctx.arc(cx, cy, 4 + pulse * 2, 0, Math.PI * 2); ctx.fill();

      // Tick marks at 0, 90, 180, 270
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const x1 = cx + Math.cos(a) * (SIZE / 2 - 12);
        const y1 = cy + Math.sin(a) * (SIZE / 2 - 12);
        const x2 = cx + Math.cos(a) * (SIZE / 2 - 4);
        const y2 = cy + Math.sin(a) * (SIZE / 2 - 4);
        ctx.strokeStyle = "rgba(127, 223, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] gap-6">
      <canvas ref={canvasRef} aria-hidden />
      <div className="text-center">
        <div className="hud-label hud-pulse mb-1" style={{ color: "var(--accent-cyan)", fontSize: "0.85rem", letterSpacing: "0.3em" }}>
          {label}
        </div>
        
      </div>
    </div>
  );
}
