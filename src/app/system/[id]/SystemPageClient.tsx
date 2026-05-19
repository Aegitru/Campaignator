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

  const [transitioning, setTransitioning] = useState<Planet | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showCreatePlanet, setShowCreatePlanet] = useState(false);

  const navigateToPlanet = (p: Planet) => {
    setTransitioning(p);
    setTimeout(() => router.push(`/planet/${p.id}`), 480);
  };

  return (
    <div className="relative w-full" style={{ height: "100dvh", overflow: "hidden" }}>
      {/* Canvas plein ecran */}
      <div className="absolute inset-0 z-0">
        <SystemView system={system} planets={planets} onPlanetClick={navigateToPlanet} />
        {transitioning && (
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(circle at center, rgba(127, 223, 255, 0.0) 0%, rgba(127, 223, 255, 0.06) 30%, rgba(5, 10, 25, 0.95) 70%)",
            animation: "warp-zoom 0.5s ease-in forwards",
          }} />
        )}
      </div>

      {/* Header overlay top-left */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2" style={{ maxWidth: "300px" }}>
        <Link href={data.isSeed ? "/" : `/campaign/${data.campaign.id}`}
          className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
          ◂ {data.isSeed ? "ACCUEIL" : "GALAXIE"}
        </Link>
        <div className="hud-panel px-3 py-2 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="hud-label" style={{ fontSize: "0.55rem" }}>SYSTEME</div>
            <div className="font-display text-base tracking-widest truncate" style={{ color: "var(--accent-cyan)" }}>
              {system.name}
            </div>
          </div>
          <button onClick={() => setShowInfo(true)} className="hud-button flex-shrink-0"
            style={{ padding: "0.4rem 0.6rem", fontSize: "1rem", lineHeight: 1 }}
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
