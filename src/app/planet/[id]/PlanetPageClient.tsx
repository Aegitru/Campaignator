"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Planet, Zone } from "@/types/domain";
import PlanetView from "@/components/planet/PlanetView";
import { CampaignProvider, useCampaign } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import QuickCreateModal from "@/components/edit/QuickCreateModal";
import type { CampaignData } from "@/lib/fetch-campaign-data";

interface Props {
  planet: Planet;
  zones: Zone[];
  systemName: string;
  systemId: string;
  data: CampaignData;
}

export default function PlanetPageClient(props: Props) {
  return (
    <CampaignProvider data={{
      campaign: props.data.campaign,
      alliances: props.data.alliances,
      factions: props.data.factions,
      systems: props.data.systems,
      planets: props.data.planets,
      zones: props.data.zones,
      battles: props.data.battles,
    }}>
      <PlanetPageInner {...props} />
    </CampaignProvider>
  );
}

function PlanetPageInner({ planet, zones, systemName, systemId, data }: Props) {
  const { factions, battles, openZone } = useCampaign();
  const { isCampaignUnlocked } = useSession();
  const editing = !data.isSeed && isCampaignUnlocked(data.campaign.id);
  const [showCreateZone, setShowCreateZone] = useState(false);

  const factionById = useMemo(() => new Map(factions.map((f) => [f.id, f])), [factions]);
  const battleCountByZone = useMemo(() => {
    const m = new Map<string, number>();
    for (const z of zones) m.set(z.id, battles.filter((b) => b.zone_id === z.id).length);
    return m;
  }, [zones, battles]);

  return (
    <div className="flex-1 flex flex-col relative min-h-[100dvh]">
      <header className="relative z-20 px-6 py-4 flex items-center gap-4">
        <Link href={`/system/${systemId}`} className="hud-button text-xs" style={{ padding: "0.4rem 0.9rem" }}>
          ◂ Retour Systeme
        </Link>
        <div className="flex-1 text-center">
          <div className="hud-label">{systemName.toUpperCase()} ▸ PLANETAIRE</div>
          <div className="hud-title text-xl mt-1" style={{ letterSpacing: "0.3em" }}>{planet.name}</div>
        </div>
        {editing ? (
          <button onClick={() => setShowCreateZone(true)} className="hud-button text-xs"
            style={{ padding: "0.4rem 0.9rem", background: "rgba(127,223,255,0.15)" }}
            disabled={zones.length >= 5}
            title={zones.length >= 5 ? "Max 5 zones" : ""}>
            + ZONE
          </button>
        ) : (
          <div className="w-[120px]" aria-hidden />
        )}
      </header>

      <div className="relative flex-1 flex">
        <div className="relative flex-1">
          <PlanetView planet={planet} zones={zones} factionById={factionById}
            battleCountByZone={battleCountByZone} onZoneClick={(z) => openZone(z.id)} />
        </div>
      </div>

      <footer className="relative z-10 px-6 py-3 flex items-center justify-between gap-4">
        <div className="hud-label hud-pulse" style={{ color: "var(--accent-blue)" }}>◉ SURFACE SCAN ACTIVE</div>
        <div className="hud-label">{zones.length} ZONE{zones.length > 1 ? "S" : ""} CARTOGRAPHIEE{zones.length > 1 ? "S" : ""}</div>
        <div className="hud-label" style={{ color: "var(--text-faded)" }}>
          {planet.planet_type.toUpperCase()} · V{planet.variant}
        </div>
      </footer>

      {showCreateZone && (
        <QuickCreateModal mode={{ kind: "zone", campaignId: data.campaign.id, planetId: planet.id }}
          onClose={() => setShowCreateZone(false)} />
      )}
    </div>
  );
}
