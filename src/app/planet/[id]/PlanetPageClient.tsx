"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Planet, Zone } from "@/types/domain";
import PlanetView from "@/components/planet/PlanetView";
import { CampaignProvider, useCampaign } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import QuickCreateModal from "@/components/edit/QuickCreateModal";
import PlanetInfoModal from "@/components/planet/PlanetInfoModal";
import GlobalOverlays from "@/components/overlays/GlobalOverlays";
import ScanLoader from "@/components/visual/ScanLoader";
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
  const router = useRouter();
  const { factions, battles, openZone, planets } = useCampaign();
  const { isCampaignUnlocked } = useSession();
  const editing = !data.isSeed && isCampaignUnlocked(data.campaign.id);
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [showCreateMoon, setShowCreateMoon] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const factionById = useMemo(() => new Map(factions.map((f) => [f.id, f])), [factions]);
  const battleCountByZone = useMemo(() => {
    const m = new Map<string, number>();
    for (const z of zones) m.set(z.id, battles.filter((b) => b.zone_id === z.id).length);
    return m;
  }, [zones, battles]);

  // Lunes = enfants directs de cette planète
  const moons = useMemo(
    () => planets.filter((p) => p.parent_planet_id === planet.id),
    [planets, planet.id]
  );

  const navigateToMoon = (m: Planet) => {
    setNavigating(true);
    setTimeout(() => router.push(`/planet/${m.id}`), 100);
  };

  return (
    <div className="relative w-full" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 z-0">
        <PlanetView planet={planet} zones={zones} moons={moons} factionById={factionById}
          battleCountByZone={battleCountByZone}
          onZoneClick={(z) => openZone(z.id)}
          onMoonClick={navigateToMoon} />
      </div>

      {/* Header overlay top-left */}
      <div className="absolute z-20 flex flex-col gap-2 md:top-6 md:left-6 md:right-auto md:bottom-auto md:max-w-[380px] bottom-2 left-2 right-2 safe-bottom">
        <Link href={`/system/${systemId}`} className="hud-button"
          style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
          ◂ SYSTEME
        </Link>
        <div className="hud-panel px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="hud-label" style={{ fontSize: "0.7rem" }}>PLANETE</div>
            <div className="font-display text-xl tracking-widest truncate" style={{ color: "var(--accent-cyan)" }}>
              {planet.name}
            </div>
            <div className="hud-label mt-0.5" style={{ fontSize: "0.7rem", color: "var(--text-faded)" }}>
              {planet.planet_type.toUpperCase()} · V{planet.variant}
            </div>
          </div>
          <button onClick={() => setShowInfo(true)} className="hud-button flex-shrink-0"
            style={{ padding: "0.5rem 0.75rem", fontSize: "1.25rem", lineHeight: 1 }}
            title="Informations">
            ⓘ
          </button>
        </div>
        {editing && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowCreateZone(true)} className="hud-button"
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.15)" }}
              disabled={zones.length >= 5}
              title={zones.length >= 5 ? "Max 5 zones" : ""}>
              + AJOUTER ZONE
            </button>
            {!planet.parent_planet_id && (
              <button onClick={() => setShowCreateMoon(true)} className="hud-button"
                style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(180,220,255,0.10)" }}
                disabled={moons.length >= 3}
                title={moons.length >= 3 ? "Max 3 lunes" : ""}>
                + AJOUTER LUNE
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer overlay bottom-left */}
      <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-4">
        <div className="hud-label hud-pulse" style={{ color: "var(--accent-blue)" }}>◉ SURFACE SCAN</div>
        <div className="hud-label">{zones.length} ZONE{zones.length > 1 ? "S" : ""} CARTOGRAPHIEE{zones.length > 1 ? "S" : ""}</div>
        {moons.length > 0 && (
          <div className="hud-label" style={{ color: "var(--text-faded)" }}>
            {moons.length} LUNE{moons.length > 1 ? "S" : ""}
          </div>
        )}
      </div>

      {showInfo && (
        <PlanetInfoModal
          planet={planet} zones={zones} campaignId={data.campaign.id}
          canEdit={editing} onClose={() => setShowInfo(false)} />
      )}

      {navigating && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center" style={{ background: "rgba(5,10,25,0.92)", backdropFilter: "blur(4px)" }}>
          <ScanLoader label="SCANNING SURFACE" />
        </div>
      )}

      {showCreateZone && (
        <QuickCreateModal mode={{ kind: "zone", campaignId: data.campaign.id, planetId: planet.id }}
          onClose={() => setShowCreateZone(false)} />
      )}

      {showCreateMoon && (
        <QuickCreateModal mode={{ kind: "moon", campaignId: data.campaign.id, parentPlanetId: planet.id, systemId: planet.system_id }}
          onClose={() => setShowCreateMoon(false)} />
      )}
    </div>
  );
}
