"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Planet, Zone, Faction } from "@/types/domain";
import { drawPlanet, hashString } from "@/lib/planet-textures";

interface PlanetViewProps {
  planet: Planet;
  zones: Zone[];
  factionById: Map<string, Faction>;
  battleCountByZone: Map<string, number>;
  onZoneClick?: (zone: Zone) => void;
}

/**
 * Vue Planète (cdc §11) :
 * - Planète zoomée procédurale (~60% écran), atmosphère + halo
 * - Système visible en arrière-plan (flou/lointain)
 * - Zones = hexagones lumineux superposés, couleur = faction contrôlante
 * - Survol → highlight + nombre de batailles
 */
export default function PlanetView({
  planet,
  zones,
  factionById,
  battleCountByZone,
  onZoneClick,
}: PlanetViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hoverZoneId, setHoverZoneId] = useState<string | null>(null);

  const planetSeed = useMemo(() => hashString(planet.id), [planet.id]);

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

  // Positions des hexagones, recalculées si zones / taille changent
  const hexPositions = useMemo(() => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    const planetR = Math.min(size.w, size.h) * 0.28;
    const annulusR = planetR * 1.04;

    return zones.map((z) => {
      const a = (z.angle_position * Math.PI) / 180;
      // Légère perspective : presse les Y
      const x = cx + Math.cos(a) * annulusR;
      const y = cy + Math.sin(a) * annulusR * 0.62;
      return {
        zone: z,
        x,
        y,
        anchor: { x: cx + Math.cos(a) * planetR * 0.92, y: cy + Math.sin(a) * planetR * 0.92 * 0.62 },
        hexSize: Math.max(14, planetR * 0.085),
      };
    });
  }, [zones, size.w, size.h]);

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
    const planetR = Math.min(size.w, size.h) * 0.28;

    const tick = (time: number) => {
      ctx.clearRect(0, 0, size.w, size.h);

      // Planète zoomée — légère rotation visuelle simulée via dérive de seed
      drawPlanet(
        ctx,
        cx,
        cy,
        planetR,
        planet.planet_type,
        planet.variant,
        planetSeed
      );

      // Anneau atmosphérique extérieur (suggestion d'orbite)
      ctx.save();
      ctx.strokeStyle = "rgba(127, 223, 255, 0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, planetR * 1.08, planetR * 1.08 * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Lune (si applicable)
      if (planet.has_moon) {
        const moonOrbitR = planetR * 1.45;
        const a = time * 0.0006;
        const mx = cx + Math.cos(a) * moonOrbitR;
        const my = cy + Math.sin(a) * moonOrbitR * 0.55;
        drawPlanet(ctx, mx, my, planetR * 0.12, "rocky", 2, planetSeed + 1);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size.w, size.h, planet.planet_type, planet.variant, planet.has_moon, planetSeed]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} />

      {/* Overlay hexagones — SVG superposé pour interactivité facile */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={size.w}
        height={size.h}
        style={{ overflow: "visible" }}
      >
        {hexPositions.map(({ zone, x, y, anchor, hexSize }) => {
          const isHover = hoverZoneId === zone.id;
          const faction = zone.controlling_faction_id
            ? factionById.get(zone.controlling_faction_id)
            : null;
          const color = faction?.color_hex ?? "#c8d8e8";
          const brightColor = brighten(color, isHover ? 0.6 : 0.25);
          const battleCount = battleCountByZone.get(zone.id) ?? 0;

          // Hexagone pointy-top
          const pts = hexPoints(x, y, hexSize);

          return (
            <g
              key={zone.id}
              style={{ pointerEvents: "auto", cursor: "crosshair" }}
              onMouseEnter={() => setHoverZoneId(zone.id)}
              onMouseLeave={() => setHoverZoneId(null)}
              onClick={() => onZoneClick?.(zone)}
            >
              {/* Ligne annotation */}
              <line
                x1={anchor.x}
                y1={anchor.y}
                x2={x}
                y2={y}
                stroke={brightColor}
                strokeWidth={isHover ? 1.2 : 0.7}
                opacity={isHover ? 0.9 : 0.55}
              />
              {/* Petit point d'ancrage sur la planète */}
              <circle cx={anchor.x} cy={anchor.y} r={2} fill={brightColor} />

              {/* Glow halo */}
              <polygon
                points={pts}
                fill={color}
                opacity={isHover ? 0.5 : 0.28}
                style={{
                  filter: `drop-shadow(0 0 ${isHover ? 10 : 6}px ${color})`,
                  transition: "opacity 0.18s ease",
                }}
              />
              {/* Bord hexagone */}
              <polygon
                points={pts}
                fill="none"
                stroke={brightColor}
                strokeWidth={isHover ? 2 : 1.2}
                style={{ transition: "stroke-width 0.18s ease" }}
              />

              {/* Label */}
              <text
                x={x}
                y={y + hexSize + 16}
                fill={isHover ? "#ffffff" : "rgba(200, 220, 240, 0.85)"}
                textAnchor="middle"
                fontFamily="var(--font-share-tech-mono), monospace"
                fontSize="11"
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  textShadow: "0 0 6px rgba(0, 0, 0, 0.9)",
                }}
              >
                {zone.name}
              </text>

              {/* Hover badge battle count */}
              {isHover && (
                <g>
                  <rect
                    x={x - 38}
                    y={y - hexSize - 28}
                    width={76}
                    height={20}
                    fill="rgba(5, 15, 30, 0.92)"
                    stroke={brightColor}
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={y - hexSize - 14}
                    fill="#ffffff"
                    textAnchor="middle"
                    fontFamily="var(--font-share-tech-mono), monospace"
                    fontSize="10"
                    style={{ letterSpacing: "0.1em" }}
                  >
                    {battleCount} BATAILLE{battleCount > 1 ? "S" : ""}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + Math.cos(angle) * size;
    const y = cy + Math.sin(angle) * size;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function brighten(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lerp = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${lerp(r)}, ${lerp(g)}, ${lerp(b)})`;
}
