import { checkCampaignPassword } from "@/lib/supabase-queries";
import { hashPassword } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function authorize(campaignId: string, password: string) {
  if (!campaignId || !password) return false;
  return checkCampaignPassword(campaignId, hashPassword(password));
}

/** Resolves the parent campaignId given a row id from a child table. */
export async function resolveCampaignIdFromPlanet(planetId: string): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb.from("planets").select("system_id").eq("id", planetId).single();
  if (!data) return null;
  const { data: sys } = await sb.from("stellar_systems").select("campaign_id").eq("id", data.system_id).single();
  return sys?.campaign_id ?? null;
}

export async function resolveCampaignIdFromZone(zoneId: string): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb.from("zones").select("planet_id").eq("id", zoneId).single();
  if (!data) return null;
  return resolveCampaignIdFromPlanet(data.planet_id);
}

export async function resolveCampaignIdFromBattle(battleId: string): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb.from("battles").select("zone_id").eq("id", battleId).single();
  if (!data) return null;
  return resolveCampaignIdFromZone(data.zone_id);
}
