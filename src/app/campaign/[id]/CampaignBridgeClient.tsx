"use client";

import { CampaignProvider } from "@/lib/campaign-context";
import type { CampaignBundle } from "@/lib/supabase-queries";

export default function CampaignBridgeClient({
  bundle, children,
}: {
  bundle: CampaignBundle;
  children: React.ReactNode;
}) {
  return (
    <CampaignProvider data={{
      campaign: bundle.campaign,
      alliances: bundle.alliances,
      factions: bundle.factions,
      systems: bundle.systems,
      planets: bundle.planets,
      zones: bundle.zones,
      battles: bundle.battles,
    }}>
      {children}
    </CampaignProvider>
  );
}
