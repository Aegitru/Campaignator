"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Planet, StellarSystem } from "@/types/domain";
import SystemView from "@/components/system/SystemView";
import { CampaignProvider } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import QuickCreateModal from "@/components/edit/QuickCreateModal";
import SystemInfoModal from "@/components/system/SystemInfoModal";
import GlobalOverlays from "@/components/overlays/GlobalOverlays";
import ScanLoader from "@/components/visual/ScanLoader";
import type { CampaignData } from "@/lib/fetch-campaign-data";

interface Props {
  system: StellarSystem;
  planets: Planet[];
  campaignName: string;
  data: CampaignData;
}

export default function SystemPageClient(props: Props) {
  return (
    <CampaignProvider data={{
      campaign: props.data.campaign, alliances: props.data.alliances, factions: props.data.factions,
      systems: props.data.systems, planets: props.data.planets, zones: props.data.zones, battles: props.data.battles,
    }}>
      <SystemPageInner {...props} />
      <GlobalOverlays />
    </CampaignProvider>
  );
}

function SystemPageInner({ system, planets, data }: Props) {
  const router = useRouter();
  const { isCampaignUnlocked } = useSession();
  const editing = !data.isSeed && isCampaignUnlocked(data.campaign.id);

  const [showInfo, setShowInfo] = useState(false);
  const [showCreatePlanet, setShowCreatePlanet] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const navigateToPlanet = (p: Planet) => {
    setNavigating(true);
    setTimeout(() => router.push(`/planet/${p.id}`), 100);
  };

  return (
    <div className="relative w-full" style={{ height: "100dvh" }}>
      {/* Canvas plein ecran */}
      <div className="absolute inset-0 z-0">
        <SystemView system={system} planets={planets} onPlanetClick={navigateToPlanet} />
      </div>

      {/* Header overlay top-left */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2" style={{ maxWidth: "380px" }}>
        <Link href={data.isSeed ? "/" : `/campaign/${data.campaign.id}`}
          className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
          ◂ {data.isSeed ? "ACCUEIL" : "GALAXIE"}
        </Link>
        <div className="hud-panel px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="hud-label" style={{ fontSize: "0.7rem" }}>SYSTEME</div>
            <div className="font-display text-xl tracking-widest truncate" style={{ color: "var(--accent-cyan)" }}>
              {system.name}
            </div>
          </div>
          <button onClick={() => setShowInfo(true)} className="hud-button flex-shrink-0"
            style={{ padding: "0.5rem 0.75rem", fontSize: "1.25rem", lineHeight: 1 }}
            title="Informations">
            ⓘ
          </button>
        </div>
        {editing && (
          <button onClick={() => setShowCreatePlanet(true)} className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.15)" }}>
            + AJOUTER PLANETE
          </button>
        )}
      </div>

      {/* Footer overlay bottom-left */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-4">
        <div className="hud-label hud-pulse" style={{ color: "var(--accent-blue)" }}>◉ LINK ACTIVE</div>
        <div className="hud-label">{planets.length} CORPS ORBITAUX DETECTES</div>
        <div className="hud-label" style={{ color: "var(--text-faded)" }}>
          {starTypeLabel(system.star_type)}
        </div>
      </div>

      {showInfo && (
        <SystemInfoModal
          system={system} planets={planets} campaignId={data.campaign.id}
          canEdit={editing} onClose={() => setShowInfo(false)} />
      )}

      {navigating && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center" style={{ background: "rgba(5,10,25,0.92)", backdropFilter: "blur(4px)" }}>
          <ScanLoader label="SCANNING SURFACE" />
        </div>
      )}

      {showCreatePlanet && (
        <QuickCreateModal
          mode={{ kind: "planet", campaignId: data.campaign.id, systemId: system.id }}
          onClose={() => setShowCreatePlanet(false)} />
      )}
    </div>
  );
}

function starTypeLabel(s: StellarSystem["star_type"]): string {
  return ({ yellow_dwarf: "NAINE JAUNE", red_giant: "GEANTE ROUGE", white_dwarf: "NAINE BLANCHE",
    neutron: "NEUTRONS", binary: "BINAIRE" } as const)[s];
}
