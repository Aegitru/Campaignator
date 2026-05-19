"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Planet, Zone } from "@/types/domain";
import PlanetView from "@/components/planet/PlanetView";
import { useCampaign } from "@/lib/campaign-context";

interface Props {
  planet: Planet;
  zones: Zone[];
  systemName: string;
  systemId: string;
}

export default function PlanetPageClient({
  planet,
  zones,
  systemName,
  systemId,
}: Props) {
  const { factions, battles, openZone } = useCampaign();

  const factionById = useMemo(
    () => new Map(factions.map((f) => [f.id, f])),
    [factions]
  );

  const battleCountByZone = useMemo(() => {
    const m = new Map<string, number>();
    for (const z of zones) {
      m.set(z.id, battles.filter((b) => b.zone_id === z.id).length);
    }
    return m;
  }, [zones, battles]);

  return (
    <div className="flex-1 flex flex-col relative min-h-[100dvh]">
      {/* Header */}
      <header className="relative z-20 px-6 py-4 flex items-center gap-4">
        <Link
          href={`/system/${systemId}`}
          className="hud-button text-xs"
          style={{ padding: "0.4rem 0.9rem" }}
        >
          ◂ Retour Système
        </Link>

        <div className="flex-1 text-center">
          <div className="hud-label">
            {systemName.toUpperCase()} ▸ PLANÉTAIRE
          </div>
          <div
            className="hud-title text-xl mt-1"
            style={{ letterSpacing: "0.3em" }}
          >
            {planet.name}
          </div>
        </div>

        {/* Placeholder pour équilibrer le layout (HUD est top-right via portal) */}
        <div className="w-[120px]" aria-hidden />
      </header>

      {/* Viewport principal */}
      <div className="relative flex-1 flex">
        <div className="relative flex-1">
          <PlanetView
            planet={planet}
            zones={zones}
            factionById={factionById}
            battleCountByZone={battleCountByZone}
            onZoneClick={(z) => openZone(z.id)}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-3 flex items-center justify-between gap-4">
        <div
          className="hud-label hud-pulse"
          style={{ color: "var(--accent-blue)" }}
        >
          ◉ SURFACE SCAN ACTIVE
        </div>
        <div className="hud-label">
          {zones.length} ZONE{zones.length > 1 ? "S" : ""} CARTOGRAPHIÉE
          {zones.length > 1 ? "S" : ""}
        </div>
        <div
          className="hud-label"
          style={{ color: "var(--text-faded)" }}
        >
          {planetTypeLabel(planet.planet_type).toUpperCase()} · VARIANTE{" "}
          {planet.variant}
        </div>
      </footer>
    </div>
  );
}

function planetTypeLabel(t: Planet["planet_type"]): string {
  return (
    {
      rocky: "Monde rocheux",
      gaseous: "Géante gazeuse",
      oceanic: "Monde océanique",
      dead: "Monde mort",
      fortress: "Monde-forteresse",
    } as const
  )[t];
}
