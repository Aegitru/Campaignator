import { supabaseServer } from "@/lib/supabase/server";
import type {
  Alliance, Battle, BattlePhoto, Campaign, Faction,
  Planet, StellarSystem, Zone,
} from "@/types/domain";

export interface CampaignSummary {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  systemCount: number;
  battleCount: number;
}

export interface CampaignBundle {
  campaign: Campaign;
  alliances: Alliance[];
  factions: Faction[];
  systems: StellarSystem[];
  planets: Planet[];
  zones: Zone[];
  battles: Battle[];
  photos: BattlePhoto[];
}

/** Fetch all campaigns with light counts. */
export async function listCampaigns(): Promise<CampaignSummary[]> {
  const sb = supabaseServer();
  const { data: camps, error } = await sb
    .from("campaigns")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!camps || camps.length === 0) return [];

  const ids = camps.map((c) => c.id);

  const { data: systems } = await sb
    .from("stellar_systems")
    .select("id, campaign_id")
    .in("campaign_id", ids);

  const sysCountByCamp = new Map<string, number>();
  const sysIdsByCamp = new Map<string, string[]>();
  (systems ?? []).forEach((s) => {
    sysCountByCamp.set(s.campaign_id, (sysCountByCamp.get(s.campaign_id) ?? 0) + 1);
    const arr = sysIdsByCamp.get(s.campaign_id) ?? [];
    arr.push(s.id);
    sysIdsByCamp.set(s.campaign_id, arr);
  });

  // Battle counts via zone -> planet -> system -> campaign chain.
  // Simple approach: fetch all battles for all systems we collected.
  const allSysIds = (systems ?? []).map((s) => s.id);
  const battleCountByCamp = new Map<string, number>();
  if (allSysIds.length) {
    const { data: planets } = await sb
      .from("planets")
      .select("id, system_id")
      .in("system_id", allSysIds);
    const planetIds = (planets ?? []).map((p) => p.id);
    if (planetIds.length) {
      const { data: zones } = await sb
        .from("zones")
        .select("id, planet_id")
        .in("planet_id", planetIds);
      const zoneIds = (zones ?? []).map((z) => z.id);
      if (zoneIds.length) {
        const { data: battles } = await sb
          .from("battles")
          .select("id, zone_id")
          .in("zone_id", zoneIds);
        const zoneToPlanet = new Map((zones ?? []).map((z) => [z.id, z.planet_id]));
        const planetToSystem = new Map((planets ?? []).map((p) => [p.id, p.system_id]));
        const systemToCampaign = new Map(
          (systems ?? []).map((s) => [s.id, s.campaign_id])
        );
        (battles ?? []).forEach((b) => {
          const pid = zoneToPlanet.get(b.zone_id);
          if (!pid) return;
          const sid = planetToSystem.get(pid);
          if (!sid) return;
          const cid = systemToCampaign.get(sid);
          if (!cid) return;
          battleCountByCamp.set(cid, (battleCountByCamp.get(cid) ?? 0) + 1);
        });
      }
    }
  }

  return camps.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    created_at: c.created_at,
    systemCount: sysCountByCamp.get(c.id) ?? 0,
    battleCount: battleCountByCamp.get(c.id) ?? 0,
  }));
}

/** Fetch one campaign with all nested data (alliances, factions, systems, planets, zones, battles, photos). */
export async function fetchCampaignBundle(
  campaignId: string
): Promise<CampaignBundle | null> {
  const sb = supabaseServer();

  const { data: campaign, error } = await sb
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (error || !campaign) return null;

  const [
    { data: alliances },
    { data: factions },
    { data: systems },
  ] = await Promise.all([
    sb.from("alliances").select("*").eq("campaign_id", campaignId).order("order_index"),
    sb.from("factions").select("*").eq("campaign_id", campaignId),
    sb.from("stellar_systems").select("*").eq("campaign_id", campaignId),
  ]);

  const systemIds = (systems ?? []).map((s) => s.id);
  const { data: planets } = systemIds.length
    ? await sb.from("planets").select("*").in("system_id", systemIds)
    : { data: [] };

  const planetIds = (planets ?? []).map((p) => p.id);
  const { data: zones } = planetIds.length
    ? await sb.from("zones").select("*").in("planet_id", planetIds)
    : { data: [] };

  const zoneIds = (zones ?? []).map((z) => z.id);
  const { data: battles } = zoneIds.length
    ? await sb.from("battles").select("*").in("zone_id", zoneIds)
    : { data: [] };

  const battleIds = (battles ?? []).map((b) => b.id);
  const { data: photos } = battleIds.length
    ? await sb.from("battle_photos").select("*").in("battle_id", battleIds).order("order_index")
    : { data: [] };

  return {
    campaign: campaign as Campaign,
    alliances: (alliances ?? []) as Alliance[],
    factions: (factions ?? []) as Faction[],
    systems: (systems ?? []) as StellarSystem[],
    planets: (planets ?? []) as Planet[],
    zones: (zones ?? []) as Zone[],
    battles: (battles ?? []) as Battle[],
    photos: (photos ?? []) as BattlePhoto[],
  };
}

/** Check if password matches. */
export async function checkCampaignPassword(
  campaignId: string,
  passwordHash: string
): Promise<boolean> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("campaigns")
    .select("password_hash")
    .eq("id", campaignId)
    .single();
  if (error || !data) return false;
  return data.password_hash === passwordHash;
}
