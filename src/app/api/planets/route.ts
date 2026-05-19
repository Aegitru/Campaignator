import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { authorize, resolveCampaignIdFromPlanet } from "../_helpers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { systemId, campaignId, password, ...payload } = body;
  if (!(await authorize(campaignId, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("planets").insert({ system_id: systemId, ...payload }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, password, ...updates } = body;
  const cid = await resolveCampaignIdFromPlanet(id);
  if (!cid || !(await authorize(cid, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("planets").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, password } = body;
  const cid = await resolveCampaignIdFromPlanet(id);
  if (!cid || !(await authorize(cid, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { error } = await sb.from("planets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
