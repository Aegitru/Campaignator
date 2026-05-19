export const runtime = "nodejs";

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
  try {
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

    // Check env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Variables d'environnement Supabase manquantes cote serveur" },
        { status: 500 }
      );
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
      console.error("[campaigns POST] insert campaign failed:", campErr);
      return NextResponse.json(
        { error: `Insert campagne: ${campErr?.message ?? "unknown"}`, details: campErr },
        { status: 500 }
      );
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
        console.error("[campaigns POST] insert alliances failed:", aErr);
        return NextResponse.json(
          { error: `Insert alliances: ${aErr?.message ?? "unknown"}` },
          { status: 500 }
        );
      }
      allianceIdByName = new Map(
        (insertedAlliances as { name: string; id: string }[]).map((a) => [a.name, a.id])
      );
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
      console.error("[campaigns POST] insert factions failed:", fErr);
      return NextResponse.json(
        { error: `Insert factions: ${fErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: camp.id });
  } catch (e: any) {
    console.error("[campaigns POST] uncaught:", e);
    return NextResponse.json(
      { error: `Exception: ${e?.message ?? String(e)}` },
      { status: 500 }
    );
  }
}
