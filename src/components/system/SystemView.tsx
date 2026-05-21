"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Planet, StellarSystem } from "@/types/domain";
import { drawPlanet, hashString } from "@/lib/planet-textures";
import { drawStar } from "@/lib/star-render";

interface SystemViewProps {
  system: StellarSystem;
  planets: Planet[];
  /** Appelée quand l'utilisateur clique sur une planète */
  onPlanetClick?: (planet: Planet) => void;
}

interface PlanetState {
  planet: Planet;
  orbitRadiusX: number;   // demi-grand axe (px)
  orbitRadiusY: number;   // demi-petit axe (px)
  orbitTilt: number;      // inclinaison (rad)
  orbitPhase: number;     // décalage de départ
  planetRadius: number;
  seed: number;
}

interface HoverInfo {
  planet: Planet;
  x: number;
  y: number;
}

export default function SystemView({
  system,
  planets,
  onPlanetClick,
}: SystemViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hover, setHover] = useState<HoverInfo | null>(null);

  // Précalculer les paramètres d'orbite stables par planète (mémoïsés sur l'id)
  const planetStates = useMemo<PlanetState[]>(() => {
    const topLevel = planets.filter((p) => !p.parent_planet_id);
    const sorted = [...topLevel].sort((a, b) => a.orbit_index - b.orbit_index);
    const maxOrbit = Math.max(1, ...sorted.map((p) => p.orbit_index));
    const minDim = Math.min(size.w, size.h);
    const innerR = minDim * 0.12;
    const outerR = minDim * 0.62;

    return sorted.map((p, idx) => {
      const t = maxOrbit > 1 ? (p.orbit_index - 1) / (maxOrbit - 1) : 0;
      const orbitRadiusX = innerR + (outerR - innerR) * (0.1 + 0.55 * t + 0.35 * t * t);
      const orbitRadiusY = orbitRadiusX * (0.42 + (idx % 3) * 0.04);
      const orbitTilt = -0.08 + (idx % 2) * -0.05;
      const seed = hashString(p.id);
      const phase = (seed % 360) / 360 * Math.PI * 2;

      // Rayon de planète selon le type
      const radiusFactor =
        p.planet_type === "gaseous"
          ? 0.052
          : p.planet_type === "dead"
          ? 0.032
          : 0.038;
      const planetRadius = Math.max(8, minDim * radiusFactor);

      return {
        planet: p,
        orbitRadiusX,
        orbitRadiusY,
        orbitTilt,
        orbitPhase: phase,
        planetRadius,
        seed,
      };
    });
  }, [planets, size.w, size.h]);

  // Resize handler
  useEffect(() => {
    const update = () => {
      const el = wrapperRef.current;
      if (!el) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size.w * dpr);
    canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size.w / 2;
    const cy = size.h / 2;
    const starBaseR = Math.min(size.w, size.h) * 0.08;

    // -- Positions courantes des planètes (recalculées chaque frame), pour hit testing
    const positions = new Map<string, { x: number; y: number; r: number }>();

    const tick = (time: number) => {
      ctx.clearRect(0, 0, size.w, size.h);

      // -- Orbites (ellipses subtiles) --
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(120, 180, 230, 0.18)";
      ctx.lineWidth = 1;
      for (const ps of planetStates) {
        ctx.save();
        ctx.rotate(ps.orbitTilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, ps.orbitRadiusX, ps.orbitRadiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // -- Étoile centrale --
      if (system.star_type === "binary") {
        const sep = starBaseR * 1.3;
        drawStar(ctx, cx - sep / 2, cy, starBaseR * 0.75, "yellow_dwarf", time);
        drawStar(ctx, cx + sep / 2, cy, starBaseR * 0.65, "red_giant", time + 800);
      } else {
        drawStar(ctx, cx, cy, starBaseR, system.star_type, time);
      }

      // -- Planètes --
      positions.clear();
      for (const ps of planetStates) {
        const orbitalT =
          time * 0.00006 * ps.planet.orbit_speed + ps.orbitPhase;
        const ex = Math.cos(orbitalT) * ps.orbitRadiusX;
        const ey = Math.sin(orbitalT) * ps.orbitRadiusY;
        // Tilt
        const tilt = ps.orbitTilt;
        const px = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt);
        const py = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);

        drawPlanet(ctx, px, py, ps.planetRadius, ps.planet.planet_type, ps.planet.variant, ps.seed, time);

        // Lunes (planetes filles)
        const moons = planets.filter((m) => m.parent_planet_id === ps.planet.id);
        moons.forEach((moon, mi) => {
          const moonOrbitR = ps.planetRadius * (1.8 + mi * 1.0);
          const moonSpeed = (0.0005 + mi * 0.0002) * moon.orbit_speed;
          const moonAngle = time * moonSpeed + ps.orbitPhase * 2 + mi * 1.7;
          const mx = px + Math.cos(moonAngle) * moonOrbitR;
          const my = py + Math.sin(moonAngle) * moonOrbitR * 0.6;
          const mr = Math.max(5, ps.planetRadius * 0.35);
          drawPlanet(ctx, mx, my, mr, moon.planet_type, moon.variant, hashString(moon.id), time);
          positions.set(moon.id, { x: mx, y: my, r: mr });
        });

        positions.set(ps.planet.id, { x: px, y: py, r: ps.planetRadius });

        // Label (toujours visible, sobre)
        ctx.save();
        ctx.font =
          "10px var(--font-share-tech-mono), ui-monospace, monospace";
        ctx.fillStyle = "rgba(200, 220, 240, 0.7)";
        ctx.textAlign = "center";
        const labelY = py + ps.planetRadius + 16;
        ctx.fillText(ps.planet.name.toUpperCase(), px, labelY);
        ctx.restore();
      }

      // expose positions for hit test on next mousemove
      hitMapRef.current = positions;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size.w, size.h, planetStates, system.star_type]);

  // Hit test pour hover/click
  const hitMapRef = useRef<Map<string, { x: number; y: number; r: number }>>(
    new Map()
  );

  const planetAt = (px: number, py: number): Planet | null => {
    const map = hitMapRef.current;
    for (const planet of planets) {
      const pos = map.get(planet.id);
      if (!pos) continue;
      const dx = px - pos.x;
      const dy = py - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) <= pos.r + 4) {
        return planet;
      }
    }
    return null;
  };

  const handleMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const planet = planetAt(x, y);
    setHover(planet ? { planet, x, y } : null);
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const planet = planetAt(x, y);
    if (planet && onPlanetClick) onPlanetClick(planet);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: hover ? "crosshair" : "default" }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        onClick={handleClick}
      />

      {/* Tooltip hover planète */}
      {hover && (
        <div
          className="hud-panel hud-panel--strong pointer-events-none"
          style={{
            position: "absolute",
            left: Math.min(hover.x + 18, size.w - 220),
            top: Math.min(hover.y + 18, size.h - 110),
            padding: "10px 14px 12px",
            minWidth: 200,
            zIndex: 20,
          }}
        >
          <div className="hud-title text-sm mb-1">{hover.planet.name}</div>
          <div className="hud-label">{planetTypeLabel(hover.planet.planet_type)} · variante {hover.planet.variant}</div>
          <div
            className="font-mono text-xs mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Orbite {hover.planet.orbit_index} ·{" "}
            {hover.planet.has_moon ? "1 lune" : "Sans lune"}
          </div>
        </div>
      )}
    </div>
  );
}

function planetTypeLabel(t: Planet["planet_type"]): string {
  const labels: Record<Planet["planet_type"], string> = {
    rocky: "Monde rocheux",
    gaseous: "Geante gazeuse",
    oceanic: "Monde oceanique",
    dead: "Monde mort",
    other: "Objet spatial",
  };
  return labels[t];
}
