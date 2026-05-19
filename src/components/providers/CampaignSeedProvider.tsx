"use client";

import { CampaignProvider } from "@/lib/campaign-context";
import {
  seedAlliances,
  seedBattles,
  seedCampaign,
  seedFactions,
  seedPlanets,
  seedSystem,
  seedZones,
} from "@/lib/seed";

/**
 * Provider qui injecte les données seed (V1/V2) au CampaignProvider.
 * En V3+ : remplacer par un fetch depuis Supabase basé sur l'URL.
 */
export default function CampaignSeedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CampaignProvider
      data={{
        campaign: seedCampaign,
        alliances: seedAlliances,
        factions: seedFactions,
        systems: [seedSystem],
        planets: seedPlanets,
        zones: seedZones,
        battles: seedBattles,
      }}
    >
      {children}
    </CampaignProvider>
  );
}
