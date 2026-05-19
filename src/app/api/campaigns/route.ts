import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth";

interface CreateBody {
  name: string;
  description?: string;
  password: string;
  allianceMode: boolean;
  alliances?: { name: string; color: string }[];
  factions: { name: string; color: string; allianceName?: string }[];
}

export async function POST(req: Request) {
  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  if (!body.password) return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
  if (!body.factions?.length) return NextResponse.json({ error: "Au moins 1 faction" }, { status: 400 });
  if (body.factions.length > 6) return NextResponse.json({ error: "Max 6 factions" }, { status: 400 });
  if (body.allianceMode && (!body.alliances || body.alliances.length < 2)) {
    return NextResponse.json({ error: "Au moins 2 alliances en mode alliance" }, { status: 400 });
  }
  if ((body.alliances?.length ?? 0) > 3) {
    return NextResponse.json({ error: "Max 3 alliances" }, { status: 400 });
  }

  const sb = supabaseServer();
  const { data: camp, error: campErr } = await sb
    .from("campaigns")
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() ?? "",
      password_hash: hashPassword(body.password),
      alliance_mode: body.allianceMode,
      status_text: "",
      last_battle_summary: "",
    })
    .select()
    .single();
  if (campErr || !camp) {
    return NextResponse.json({ error: campErr?.message ?? "Erreur creation" }, { status: 500 });
  }

  let allianceIdByName = new Map<string, string>();
  if (body.allianceMode && body.alliances) {
    const allianceRows = body.alliances.map((a, i) => ({
      campaign_id: camp.id,
      name: a.name.trim(),
      color_hex: a.color,
      order_index: i,
    }));
    const { data: insertedAlliances, error: aErr } = await sb
      .from("alliances")
      .insert(allianceRows)
      .select();
    if (aErr || !insertedAlliances) {
      return NextResponse.json({ error: aErr?.message ?? "Erreur alliances" }, { status: 500 });
    }
    allianceIdByName = new Map(insertedAlliances.map((a) => [a.name, a.id]));
  }

  const factionRows = body.factions.map((f) => ({
    campaign_id: camp.id,
    alliance_id:
      body.allianceMode && f.allianceName ? allianceIdByName.get(f.allianceName) ?? null : null,
    name: f.name.trim(),
    color_hex: f.color,
    lore_text: "",
  }));
  const { error: fErr } = await sb.from("factions").insert(factionRows);
  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: camp.id });
}
