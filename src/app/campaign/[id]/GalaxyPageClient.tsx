"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GalaxyView from "@/components/galaxy/GalaxyView";
import { CampaignProvider } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import { apiEditCall } from "@/lib/api-edit";
import type { CampaignBundle } from "@/lib/supabase-queries";
import QuickCreateModal from "@/components/edit/QuickCreateModal";

export default function GalaxyPageClient({ bundle }: { bundle: CampaignBundle }) {
  return (
    <CampaignProvider data={{
      campaign: bundle.campaign, alliances: bundle.alliances, factions: bundle.factions,
      systems: bundle.systems, planets: bundle.planets, zones: bundle.zones, battles: bundle.battles,
    }}>
      <GalaxyInner bundle={bundle} />
    </CampaignProvider>
  );
}

function GalaxyInner({ bundle }: { bundle: CampaignBundle }) {
  const router = useRouter();
  const { isCampaignUnlocked } = useSession();
  const editing = isCampaignUnlocked(bundle.campaign.id);

  const [placingMode, setPlacingMode] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number } | null>(null);

  const handlePlace = (x: number, y: number) => {
    setPlacingMode(false);
    setPendingPlacement({ x, y });
  };

  const handleMove = async (id: string, x: number, y: number) => {
    await apiEditCall("/api/systems", "PUT", bundle.campaign.id, { id, galaxy_pos_x: x, galaxy_pos_y: y });
    router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col relative min-h-[100dvh]">
      <header className="relative z-20 px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="hud-button text-xs" style={{ padding: "0.4rem 0.9rem" }}>
          ◂ Retour Accueil
        </Link>
        <div className="text-center flex-1">
          <div className="hud-label">{bundle.campaign.name}</div>
          <div className="hud-title text-xl mt-1" style={{ letterSpacing: "0.3em" }}>VUE GALAXIE</div>
        </div>
        <div className="flex gap-2">
          {editing && (
            <button onClick={() => setPlacingMode((v) => !v)} className="hud-button text-xs"
              style={{ padding: "0.4rem 0.9rem",
                background: placingMode ? "rgba(127,223,255,0.3)" : "rgba(127,223,255,0.15)" }}>
              {placingMode ? "ANNULER PLACEMENT" : "+ AJOUTER SECTEUR"}
            </button>
          )}
          <Link href={`/campaign/${bundle.campaign.id}/factions`} className="hud-button text-xs"
            style={{ padding: "0.4rem 0.9rem" }}>
            FACTIONS ⛏
          </Link>
        </div>
      </header>

      <div className="relative flex-1">
        <GalaxyView
          systems={bundle.systems}
          editing={editing}
          placingMode={placingMode}
          onPlace={handlePlace}
          onSystemClick={(s) => router.push(`/system/${s.id}`)}
          onMoveSystem={editing ? handleMove : undefined}
        />
      </div>

      <footer className="relative z-10 px-6 py-3 flex items-center justify-between gap-4">
        <div className="hud-label hud-pulse" style={{ color: "var(--accent-blue)" }}>◉ GALACTIC SCAN</div>
        <div className="hud-label">{bundle.systems.length} SECTEUR{bundle.systems.length > 1 ? "S" : ""} CARTOGRAPHIE{bundle.systems.length > 1 ? "S" : ""}</div>
        <div className="hud-label" style={{ color: "var(--text-faded)" }}>SEGMENTUM_OBSCURUS</div>
      </footer>

      {pendingPlacement && (
        <QuickCreateModal
          mode={{ kind: "system", campaignId: bundle.campaign.id, posX: pendingPlacement.x, posY: pendingPlacement.y }}
          onClose={() => setPendingPlacement(null)}
        />
      )}
    </div>
  );
}
