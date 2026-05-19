import {
  seedCampaign, seedAlliances, seedFactions, seedSystem,
  seedPlanets, seedZones, seedBattles,
} from "@/lib/seed";
import { fetchCampaignBundle } from "@/lib/supabase-queries";
import type {
  Campaign, Alliance, Faction, StellarSystem, Planet, Zone, Battle,
} from "@/types/domain";

export interface CampaignData {
  campaign: Campaign;
  alliances: Alliance[];
  factions: Faction[];
  systems: StellarSystem[];
  planets: Planet[];
  zones: Zone[];
  battles: Battle[];
  isSeed: boolean;
}

/** Fetch campaign data starting from a system id. Falls back to seed for the demo. */
export async function fetchDataFromSystemId(systemId: string): Promise<CampaignData | null> {
  if (systemId === seedSystem.id) {
    return {
      campaign: seedCampaign, alliances: seedAlliances, factions: seedFactions,
      systems: [seedSystem], planets: seedPlanets, zones: seedZones, battles: seedBattles,
      isSeed: true,
    };
  }
  // Find campaign owning this system
  const { supabaseServer } = await import("@/lib/supabase/server");
  const sb = supabaseServer();
  const { data: sys } = await sb.from("stellar_systems").select("campaign_id").eq("id", systemId).single();
  if (!sys) return null;
  const bundle = await fetchCampaignBundle((sys as { campaign_id: string }).campaign_id);
  if (!bundle) return null;
  return { ...bundle, isSeed: false };
}

/** Fetch campaign data starting from a planet id. */
export async function fetchDataFromPlanetId(planetId: string): Promise<CampaignData | null> {
  const seedHit = seedPlanets.find((p) => p.id === planetId);
  if (seedHit) {
    return {
      campaign: seedCampaign, alliances: seedAlliances, factions: seedFactions,
      systems: [seedSystem], planets: seedPlanets, zones: seedZones, battles: seedBattles,
      isSeed: true,
    };
  }
  const { supabaseServer } = await import("@/lib/supabase/server");
  const sb = supabaseServer();
  const { data: pl } = await sb.from("planets").select("system_id").eq("id", planetId).single();
  if (!pl) return null;
  return fetchDataFromSystemId((pl as { system_id: string }).system_id);
}
