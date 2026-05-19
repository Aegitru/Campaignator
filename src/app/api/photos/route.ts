export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { authorize, resolveCampaignIdFromBattle } from "../_helpers";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { battleId, password, cloudinary_url, order_index } = body;
  const cid = await resolveCampaignIdFromBattle(battleId);
  if (!cid || !(await authorize(cid, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { data, error } = await sb.from("battle_photos").insert({
    battle_id: battleId, cloudinary_url, order_index: order_index ?? 0,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, battleId, password } = body;
  const cid = await resolveCampaignIdFromBattle(battleId);
  if (!cid || !(await authorize(cid, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sb = supabaseServer();
  const { error } = await sb.from("battle_photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
