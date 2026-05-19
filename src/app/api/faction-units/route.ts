export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { authorize } from "../_helpers";

async function resolveCampaignFromFaction(factionId: string): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb.from("factions").select("campaign_id").eq("id", factionId).single();
  return data ? (data as { campaign_id: string }).campaign_id : null;
}

async function resolveCampaignFromUnit(unitId: string): Promise<string | null> {
  const sb = supabaseServer();
  const { data } = await sb.from("faction_units").select("faction_id").eq("id", unitId).single();
  if (!data) return null;
  return resolveCampaignFromFaction((data as { faction_id: string }).faction_id);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { factionId, password, name, description, evolution_notes } = body;
  const cid = await resolveCampaignFromFaction(factionId);
  if (!cid || !(await authorize(cid, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("faction_units")
    .insert({ faction_id: factionId, name, description: description ?? "", evolution_notes: evolution_notes ?? "" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, password, ...updates } = body;
  delete (updates as any).campaignId;
  delete (updates as any).factionId;
  const cid = await resolveCampaignFromUnit(id);
  if (!cid || !(await authorize(cid, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("faction_units").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, password } = body;
  const cid = await resolveCampaignFromUnit(id);
  if (!cid || !(await authorize(cid, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { error } = await sb.from("faction_units").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
