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
import GlobalOverlays from "@/components/overlays/GlobalOverlays";

export default function GalaxyPageClient({ bundle }: { bundle: CampaignBundle }) {
  return (
    <CampaignProvider data={{
      campaign: bundle.campaign, alliances: bundle.alliances, factions: bundle.factions,
      systems: bundle.systems, planets: bundle.planets, zones: bundle.zones, battles: bundle.battles,
    }}>
      <GalaxyInner bundle={bundle} />
      <GlobalOverlays />
    </CampaignProvider>
  );
}

function GalaxyInner({ bundle }: { bundle: CampaignBundle }) {
  const router = useRouter();
  const { isCampaignUnlocked } = useSession();
  const editing = isCampaignUnlocked(bundle.campaign.id);
  const [placingMode, setPlacingMode] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Galaxie : occupe TOUT l'ecran sous les overlays */}
      <div className="absolute inset-0 z-0">
        <GalaxyView
          systems={bundle.systems}
          editing={editing}
          placingMode={placingMode}
          onPlace={(x, y) => { setPlacingMode(false); setPendingPlacement({ x, y }); }}
          onSystemClick={(s) => router.push(`/system/${s.id}`)}
          onMoveSystem={async (id, x, y) => {
            await apiEditCall("/api/systems", "PUT", bundle.campaign.id, { id, galaxy_pos_x: x, galaxy_pos_y: y });
            router.refresh();
          }}
        />
      </div>

      {/* Header flottant top-left */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-[260px]">
        <Link href="/" className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
          ◂ ACCUEIL
        </Link>
        <div className="hud-panel px-3 py-2">
          <div className="hud-label" style={{ fontSize: "0.55rem" }}>VUE GALAXIE</div>
          <div className="font-display text-sm tracking-widest" style={{ color: "var(--accent-cyan)" }}>
            {bundle.systems.length} SECTEUR{bundle.systems.length > 1 ? "S" : ""}
          </div>
        </div>
        {editing && (
          <button onClick={() => setPlacingMode((v) => !v)} className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem",
              background: placingMode ? "rgba(127,223,255,0.3)" : "rgba(127,223,255,0.15)" }}>
            {placingMode ? "ANNULER" : "+ AJOUTER SECTEUR"}
          </button>
        )}
        <Link href={`/campaign/${bundle.campaign.id}/factions`} className="hud-button"
          style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
          FACTIONS ⛏
        </Link>
      </div>

      {pendingPlacement && (
        <QuickCreateModal
          mode={{ kind: "system", campaignId: bundle.campaign.id, posX: pendingPlacement.x, posY: pendingPlacement.y }}
          onClose={() => setPendingPlacement(null)}
        />
      )}
    </div>
  );
}
