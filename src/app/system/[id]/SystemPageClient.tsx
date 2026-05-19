"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Planet, StellarSystem } from "@/types/domain";
import SystemView from "@/components/system/SystemView";
import { CampaignProvider } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import QuickCreateModal from "@/components/edit/QuickCreateModal";
import type { CampaignData } from "@/lib/fetch-campaign-data";

interface Props {
  system: StellarSystem;
  planets: Planet[];
  campaignName: string;
  data: CampaignData;
}

export default function SystemPageClient(props: Props) {
  return (
    <CampaignProvider
      data={{
        campaign: props.data.campaign,
        alliances: props.data.alliances,
        factions: props.data.factions,
        systems: props.data.systems,
        planets: props.data.planets,
        zones: props.data.zones,
        battles: props.data.battles,
      }}
    >
      <SystemPageInner {...props} />
    </CampaignProvider>
  );
}

function SystemPageInner({ system, planets, campaignName, data }: Props) {
  const router = useRouter();
  const { isCampaignUnlocked } = useSession();
  const editing = !data.isSeed && isCampaignUnlocked(data.campaign.id);

  const [transitioning, setTransitioning] = useState<Planet | null>(null);
  const [loreOpen, setLoreOpen] = useState(true);
  const [showCreatePlanet, setShowCreatePlanet] = useState(false);

  const navigateToPlanet = (p: Planet) => {
    setTransitioning(p);
    setTimeout(() => router.push(`/planet/${p.id}`), 480);
  };

  return (
    <div className="flex-1 flex flex-col relative min-h-[100dvh]">
      <header className="relative z-20 px-6 py-4 flex items-center justify-between gap-4">
        <Link href={data.isSeed ? "/" : `/campaign/${data.campaign.id}`}
          className="hud-button text-xs" style={{ padding: "0.4rem 0.9rem" }}>
          ◂ Retour
        </Link>
        <div className="text-center flex-1">
          <div className="hud-label">{campaignName}</div>
          <div className="hud-title text-xl mt-1" style={{ letterSpacing: "0.3em" }}>
            {system.name}
          </div>
        </div>
        <div className="hud-panel px-3 py-2 hidden md:block min-w-[180px]">
          <div className="hud-label">STELLAR_TYPE</div>
          <div className="font-mono text-sm uppercase tracking-widest mt-0.5" style={{ color: "var(--accent-cyan)" }}>
            {starTypeLabel(system.star_type)}
          </div>
        </div>
      </header>

      <div className="relative flex-1 flex">
        <aside className="relative z-10 transition-all duration-300" style={{ width: loreOpen ? 320 : 0 }}>
          <div className="absolute inset-y-0 left-4 right-0 my-2 overflow-hidden"
            style={{ opacity: loreOpen ? 1 : 0, transition: "opacity 220ms ease" }}>
            <div className="hud-panel hud-panel--strong h-full p-5 overflow-auto">
              <div className="hud-label mb-2">SYSTEM_LORE</div>
              <h3 className="font-display text-lg mb-3" style={{ color: "var(--accent-cyan)" }}>{system.name}</h3>
              <p className="font-mono text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {system.lore_text || "Aucune entree d'archive disponible."}
              </p>

              <div className="hud-divider my-5" style={{ opacity: 0.6 }} />

              <div className="hud-label mb-2 flex justify-between">
                <span>PLANETS // {planets.length}</span>
                {editing && (
                  <button onClick={() => setShowCreatePlanet(true)} className="hover:text-white" style={{ cursor: "crosshair" }}>+ AJOUTER</button>
                )}
              </div>
              <ul className="space-y-2">
                {planets.slice().sort((a, b) => a.orbit_index - b.orbit_index).map((p) => (
                  <li key={p.id} className="font-mono text-xs flex items-center justify-between">
                    <span style={{ color: "var(--text-primary)" }}>
                      {p.orbit_index.toString().padStart(2, "0")} - {p.name.toUpperCase()}
                    </span>
                    <span className="hud-label" style={{ letterSpacing: "0.12em" }}>{p.planet_type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <button onClick={() => setLoreOpen((v) => !v)} className="absolute z-30 hud-button"
          style={{ left: loreOpen ? 312 : 8, top: "50%", transform: "translateY(-50%)",
            padding: "0.6rem 0.4rem", fontSize: "0.7rem", transition: "left 0.3s ease" }}>
          {loreOpen ? "◂" : "▸"}
        </button>

        <div className="relative flex-1">
          <SystemView system={system} planets={planets} onPlanetClick={navigateToPlanet} />
          {transitioning && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(circle at center, rgba(127, 223, 255, 0.0) 0%, rgba(127, 223, 255, 0.06) 30%, rgba(5, 10, 25, 0.95) 70%)",
              animation: "warp-zoom 0.5s ease-in forwards",
            }} />
          )}
        </div>
      </div>

      <footer className="relative z-10 px-6 py-3 flex items-center justify-between gap-4">
        <div className="hud-label hud-pulse" style={{ color: "var(--accent-blue)" }}>◉ LINK ACTIVE</div>
        <div className="hud-label">{planets.length} CORPS ORBITAUX DETECTES</div>
        <div className="hud-label" style={{ color: "var(--text-faded)" }}>
          {data.isSeed ? "DEMO · SEED_DATA" : "LIVE_DATA"}
        </div>
      </footer>

      {showCreatePlanet && (
        <QuickCreateModal
          mode={{ kind: "planet", campaignId: data.campaign.id, systemId: system.id }}
          onClose={() => setShowCreatePlanet(false)}
        />
      )}
    </div>
  );
}

function starTypeLabel(s: StellarSystem["star_type"]): string {
  return ({ yellow_dwarf: "Naine jaune", red_giant: "Geante rouge", white_dwarf: "Naine blanche",
    neutron: "Neutrons", binary: "Binaire" } as const)[s];
}
