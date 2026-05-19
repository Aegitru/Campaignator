import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { checkCampaignPassword } from "@/lib/supabase-queries";
import { hashPassword } from "@/lib/auth";

async function authorize(campaignId: string, password: string) {
  if (!password) return false;
  return checkCampaignPassword(campaignId, hashPassword(password));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { campaignId, password, name, lore_text, star_type, galaxy_pos_x, galaxy_pos_y } = body;
  if (!(await authorize(campaignId, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("stellar_systems").insert({
    campaign_id: campaignId, name, lore_text: lore_text ?? "",
    star_type: star_type ?? "yellow_dwarf",
    galaxy_pos_x: galaxy_pos_x ?? 50, galaxy_pos_y: galaxy_pos_y ?? 50,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, campaignId, password, ...updates } = body;
  if (!(await authorize(campaignId, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("stellar_systems").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, campaignId, password } = body;
  if (!(await authorize(campaignId, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { error } = await sb.from("stellar_systems").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
