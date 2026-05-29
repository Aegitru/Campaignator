"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Planet, Zone, Faction } from "@/types/domain";
import { drawPlanet, hashString } from "@/lib/planet-textures";

interface PlanetViewProps {
  planet: Planet;
  zones: Zone[];
  moons: Planet[];
  factionById: Map<string, Faction>;
  battleCountByZone: Map<string, number>;
  onZoneClick?: (zone: Zone) => void;
  onMoonClick?: (moon: Planet) => void;
}

interface MoonHit { id: string; x: number; y: number; r: number; inFront: boolean }

export default function PlanetView({
  planet, zones, moons, factionById, battleCountByZone, onZoneClick, onMoonClick,
}: PlanetViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const moonHitsRef = useRef<Map<string, MoonHit>>(new Map());
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hoverZoneId, setHoverZoneId] = useState<string | null>(null);
  const [hoverMoonId, setHoverMoonId] = useState<string | null>(null);
  // bump pour forcer un re-render react quand les positions des lunes bougent
  const [moonTick, setMoonTick] = useState(0);

  const planetSeed = useMemo(() => hashString(planet.id), [planet.id]);

  useEffect(() => {
    const update = () => {
      const el = wrapperRef.current; if (!el) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Hexagones SUR la planete : positionnes a 60% du rayon depuis le centre
  // Libelle a l'exterieur (1.25 * rayon)
  const hexPositions = useMemo(() => {
    const cx = size.w / 2;
    const cy = size.h / 2;
    const planetR = Math.min(size.w, size.h) * 0.28;
    const hexRadius = planetR * 0.6; // sur la planete
    const labelRadius = planetR * 1.25; // labels a l'exterieur

    return zones.map((z) => {
      const a = (z.angle_position * Math.PI) / 180;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      // Hexagone : sur la planete
      const hx = cx + cosA * hexRadius;
      const hy = cy + sinA * hexRadius * 0.65; // perspective ecrasee
      // Label : exterieur
      const lx = cx + cosA * labelRadius;
      const ly = cy + sinA * labelRadius * 0.65;
      return {
        zone: z,
        hx, hy, lx, ly,
        hexSize: Math.max(22, planetR * 0.14),
      };
    });
  }, [zones, size.w, size.h]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size.w * dpr); canvas.height = Math.floor(size.h * dpr);
    canvas.style.width = `${size.w}px`; canvas.style.height = `${size.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size.w / 2; const cy = size.h / 2;
    const planetR = Math.min(size.w, size.h) * 0.28;

    let frameCount = 0;

    const tick = (time: number) => {
      ctx.clearRect(0, 0, size.w, size.h);

      // Calcul des positions de chaque lune + drapeau front/back
      type MoonPos = {
        moon: Planet; mi: number; mx: number; my: number; mr: number;
        moonOrbitR: number; inFront: boolean; sinA: number;
      };
      const moonPositions: MoonPos[] = moons.map((moon, mi) => {
        const moonOrbitR = planetR * (1.55 + mi * 0.45);
        const moonSpeed = (0.00012 + mi * 0.00005) * Math.max(0.2, moon.orbit_speed || 1);
        const moonAngle = time * moonSpeed + mi * 2.1;
        const cosA = Math.cos(moonAngle);
        const sinA = Math.sin(moonAngle);
        const mx = cx + cosA * moonOrbitR;
        const my = cy + sinA * moonOrbitR * 0.55;
        const mr = Math.max(10, planetR * 0.18);
        // L'orbite est inclinée : la moitié basse (sinA > 0) est en avant du
        // plan de la planète, la moitié haute (sinA < 0) est derrière.
        const inFront = sinA > 0;
        return { moon, mi, mx, my, mr, moonOrbitR, inFront, sinA };
      });

      // 1) Anneaux d'orbite (subtils) — dessinés en premier pour que la planète
      // recouvre la moitié arrière naturellement
      moonPositions.forEach(({ moonOrbitR }) => {
        ctx.save();
        ctx.strokeStyle = "rgba(180, 220, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, moonOrbitR, moonOrbitR * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // 2) Lunes DERRIÈRE la planète (seront partiellement masquées par le draw planète)
      moonPositions.filter((p) => !p.inFront).forEach(({ moon, mx, my, mr }) => {
        drawPlanet(ctx, mx, my, mr, moon.planet_type, moon.variant, hashString(moon.id), time);
      });

      // 3) Planète principale + halo
      drawPlanet(ctx, cx, cy, planetR, planet.planet_type, planet.variant, planetSeed, time);
      ctx.save();
      ctx.strokeStyle = "rgba(127, 223, 255, 0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, planetR * 1.08, planetR * 1.08 * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4) Lunes EN AVANT
      moonPositions.filter((p) => p.inFront).forEach(({ moon, mx, my, mr }) => {
        drawPlanet(ctx, mx, my, mr, moon.planet_type, moon.variant, hashString(moon.id), time);
      });

      // 5) Labels — uniquement pour les lunes en avant (sinon le label
      // flotterait sur la planète sans la lune)
      moonPositions.filter((p) => p.inFront).forEach(({ moon, mx, my, mr }) => {
        ctx.save();
        ctx.font = "10px var(--font-share-tech-mono), ui-monospace, monospace";
        ctx.fillStyle = "rgba(200, 220, 240, 0.7)";
        ctx.textAlign = "center";
        ctx.fillText(moon.name.toUpperCase(), mx, my + mr + 14);
        ctx.restore();
      });

      // 6) Hits pour les boutons cliquables (toutes les lunes, avec inFront)
      const newHits = new Map<string, MoonHit>();
      moonPositions.forEach(({ moon, mx, my, mr, inFront }) => {
        newHits.set(moon.id, { id: moon.id, x: mx, y: my, r: mr, inFront });
      });
      moonHitsRef.current = newHits;
      // Rafraîchir les boutons overlay ~10 fois / sec pour les coller aux lunes
      frameCount++;
      if (moons.length > 0 && frameCount % 6 === 0) {
        setMoonTick((t) => (t + 1) % 1000000);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [size.w, size.h, planet.planet_type, planet.variant, planetSeed, moons]);

  const handleHexEnter = (id: string) => setHoverZoneId(id);
  const handleHexLeave = () => setHoverZoneId(null);
  const handleHexClick = (z: Zone, e: React.MouseEvent) => {
    e.stopPropagation();
    onZoneClick?.(z);
  };

  // Snapshot des positions actuelles (utilisé pour positionner les boutons overlay)
  const moonHitsArr = useMemo<MoonHit[]>(() => {
    void moonTick; // dépendance pour re-render
    return Array.from(moonHitsRef.current.values());
  }, [moonTick, moons]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} />

      {/* Boutons cliquables overlay sur chaque lune — uniquement quand en avant */}
      {moonHitsArr.filter((h) => h.inFront).map((hit) => {
        const moon = moons.find((m) => m.id === hit.id);
        if (!moon) return null;
        const isHover = hoverMoonId === hit.id;
        const padding = 6;
        return (
          <button
            key={hit.id}
            onClick={(e) => { e.stopPropagation(); onMoonClick?.(moon); }}
            onMouseEnter={() => setHoverMoonId(hit.id)}
            onMouseLeave={() => setHoverMoonId(null)}
            className="absolute"
            style={{
              left: hit.x - hit.r - padding,
              top: hit.y - hit.r - padding,
              width: (hit.r + padding) * 2,
              height: (hit.r + padding) * 2,
              borderRadius: "50%",
              background: "transparent",
              border: isHover ? "1px solid rgba(127, 223, 255, 0.9)" : "1px solid transparent",
              boxShadow: isHover ? "0 0 14px rgba(127, 223, 255, 0.55)" : "none",
              cursor: "crosshair",
              padding: 0,
              zIndex: 12,
              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
            }}
            aria-label={moon.name}
            title={moon.name}
          />
        );
      })}

      {/* Hexagones overlay - HTML pour click events fiables */}
      {hexPositions.map(({ zone, hx, hy, lx, ly, hexSize }) => {
        const isHover = hoverZoneId === zone.id;
        const faction = zone.controlling_faction_id ? factionById.get(zone.controlling_faction_id) : null;
        const color = faction?.color_hex ?? "#7fdfff";
        const brightColor = brighten(color, isHover ? 0.55 : 0.2);
        const battleCount = battleCountByZone.get(zone.id) ?? 0;

        const labelAlignLeft = lx > size.w / 2;

        return (
          <div key={zone.id}>
            {/* SVG ligne hexagone -> label */}
            <svg className="absolute inset-0 pointer-events-none" width={size.w} height={size.h}>
              <line x1={hx} y1={hy} x2={lx} y2={ly}
                stroke={brightColor} strokeWidth={isHover ? 1.4 : 0.9}
                opacity={isHover ? 0.95 : 0.6}
                strokeDasharray={isHover ? "" : "3 3"} />
              {/* Petit point fin de ligne */}
              <circle cx={lx} cy={ly} r={2} fill={brightColor} />
            </svg>

            {/* Hexagone interactif */}
            <button
              onClick={(e) => handleHexClick(zone, e)}
              onMouseEnter={() => handleHexEnter(zone.id)}
              onMouseLeave={handleHexLeave}
              className="absolute"
              style={{
                left: hx - hexSize, top: hy - hexSize,
                width: hexSize * 2, height: hexSize * 2,
                cursor: "crosshair",
                background: "transparent",
                border: "none",
                padding: 0,
                zIndex: 10,
              }}
              aria-label={zone.name}
            >
              <svg width={hexSize * 2} height={hexSize * 2} viewBox={`0 0 ${hexSize * 2} ${hexSize * 2}`}
                style={{ display: "block", overflow: "visible" }}>
                <polygon points={hexPointsLocal(hexSize, hexSize, hexSize * 0.85)}
                  fill={color}
                  opacity={isHover ? 0.55 : 0.32}
                  style={{
                    filter: `drop-shadow(0 0 ${isHover ? 14 : 8}px ${color})`,
                    transition: "opacity 0.18s ease",
                  }}
                />
                <polygon points={hexPointsLocal(hexSize, hexSize, hexSize * 0.85)}
                  fill="none" stroke={brightColor}
                  strokeWidth={isHover ? 2.5 : 1.6}
                  style={{ transition: "stroke-width 0.18s ease" }}
                />
                {isHover && (
                  <text x={hexSize} y={hexSize + 4} fill="#ffffff" textAnchor="middle"
                    fontFamily="var(--font-share-tech-mono), monospace" fontSize="11"
                    style={{ textShadow: "0 0 6px rgba(0, 0, 0, 0.9)" }}>
                    {battleCount}
                  </text>
                )}
              </svg>
            </button>

            {/* Label exterieur */}
            <div className="absolute pointer-events-none"
              style={{
                left: labelAlignLeft ? "auto" : lx + 8,
                right: labelAlignLeft ? size.w - lx + 8 : "auto",
                top: ly - 16,
                maxWidth: 220,
              }}>
              <div className="font-mono text-[11px] uppercase tracking-widest"
                style={{ color: isHover ? "#ffffff" : "rgba(220, 235, 255, 0.85)",
                  textShadow: "0 0 6px rgba(0, 0, 0, 0.9)",
                  textAlign: labelAlignLeft ? "right" : "left",
                  whiteSpace: "nowrap" }}>
                {zone.name}
              </div>
              {isHover && (
                <div className="font-mono text-[9px] mt-0.5"
                  style={{ color: brightColor, textAlign: labelAlignLeft ? "right" : "left",
                    textShadow: "0 0 4px rgba(0,0,0,0.9)" }}>
                  {battleCount} BATAILLE{battleCount > 1 ? "S" : ""}
                  {faction && ` · ${faction.name.toUpperCase()}`}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function hexPointsLocal(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function brighten(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16); const g = parseInt(h.slice(2, 4), 16); const b = parseInt(h.slice(4, 6), 16);
  const lerp = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${lerp(r)}, ${lerp(g)}, ${lerp(b)})`;
}
