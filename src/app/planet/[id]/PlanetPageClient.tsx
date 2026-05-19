"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Planet, Zone } from "@/types/domain";
import PlanetView from "@/components/planet/PlanetView";
import { CampaignProvider, useCampaign } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import QuickCreateModal from "@/components/edit/QuickCreateModal";
import GlobalOverlays from "@/components/overlays/GlobalOverlays";
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
      campaign: props.data.campaign, alliances: props.data.alliances, factions: props.data.factions,
      systems: props.data.systems, planets: props.data.planets, zones: props.data.zones, battles: props.data.battles,
    }}>
      <PlanetPageInner {...props} />
      <GlobalOverlays />
    </CampaignProvider>
  );
}

function PlanetPageInner({ planet, zones, systemId, data }: Props) {
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
    <div className="absolute inset-0 flex flex-col">
      <div className="absolute inset-0 z-0">
        <PlanetView planet={planet} zones={zones} factionById={factionById}
          battleCountByZone={battleCountByZone} onZoneClick={(z) => openZone(z.id)} />
      </div>

      {/* Header overlay top-left */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-[280px]">
        <Link href={`/system/${systemId}`} className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
          ◂ SYSTEME
        </Link>
        <div className="hud-panel px-3 py-2">
          <div className="hud-label" style={{ fontSize: "0.55rem" }}>PLANETE</div>
          <div className="font-display text-sm tracking-widest" style={{ color: "var(--accent-cyan)" }}>{planet.name}</div>
          <div className="hud-label mt-1" style={{ fontSize: "0.55rem", color: "var(--text-faded)" }}>
            {planet.planet_type.toUpperCase()} · V{planet.variant}
          </div>
        </div>
        {editing && (
          <button onClick={() => setShowCreateZone(true)} className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.15)" }}
            disabled={zones.length >= 5}
            title={zones.length >= 5 ? "Max 5 zones" : ""}>
            + AJOUTER ZONE
          </button>
        )}
      </div>

      {showCreateZone && (
        <QuickCreateModal mode={{ kind: "zone", campaignId: data.campaign.id, planetId: planet.id }}
          onClose={() => setShowCreateZone(false)} />
      )}
    </div>
  );
}
