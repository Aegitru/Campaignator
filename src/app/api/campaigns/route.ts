export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth";
import { checkCampaignPassword } from "@/lib/supabase-queries";

interface CreateBody {
  name: string;
  description?: string;
  password: string;
  allianceMode: boolean;
  alliances?: { name: string; color: string }[];
  factions: { name: string; color: string; allianceName?: string; symbol?: string }[];
}

async function authorize(campaignId: string, password: string) {
  if (!campaignId || !password) return false;
  return checkCampaignPassword(campaignId, hashPassword(password));
}

export async function POST(req: Request) {
  try {
    let body: CreateBody;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (!body.name?.trim()) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    if (!body.password) return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    if (!body.factions?.length) return NextResponse.json({ error: "Au moins 1 faction" }, { status: 400 });
    if (body.factions.length > 6) return NextResponse.json({ error: "Max 6 factions" }, { status: 400 });
    if (body.allianceMode && (!body.alliances || body.alliances.length < 2)) {
      return NextResponse.json({ error: "Au moins 2 alliances en mode alliance" }, { status: 400 });
    }
    if ((body.alliances?.length ?? 0) > 3) return NextResponse.json({ error: "Max 3 alliances" }, { status: 400 });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Env Supabase manquantes" }, { status: 500 });
    }

    const sb = supabaseServer();
    const { data: camp, error: campErr } = await sb.from("campaigns").insert({
      name: body.name.trim(),
      description: body.description?.trim() ?? "",
      password_hash: hashPassword(body.password),
      alliance_mode: body.allianceMode,
      status_text: "",
      last_battle_summary: "",
    }).select().single();
    if (campErr || !camp) return NextResponse.json({ error: `Insert campagne: ${campErr?.message ?? "unknown"}` }, { status: 500 });

    let allianceIdByName = new Map<string, string>();
    if (body.allianceMode && body.alliances) {
      const allianceRows = body.alliances.map((a, i) => ({
        campaign_id: camp.id, name: a.name.trim(), color_hex: a.color, order_index: i,
      }));
      const { data: insertedAlliances, error: aErr } = await sb.from("alliances").insert(allianceRows).select();
      if (aErr || !insertedAlliances) return NextResponse.json({ error: `Insert alliances: ${aErr?.message ?? "unknown"}` }, { status: 500 });
      allianceIdByName = new Map((insertedAlliances as { name: string; id: string }[]).map((a) => [a.name, a.id]));
    }

    const factionRows = body.factions.map((f) => ({
      campaign_id: camp.id,
      alliance_id: body.allianceMode && f.allianceName ? allianceIdByName.get(f.allianceName) ?? null : null,
      name: f.name.trim(), color_hex: f.color, lore_text: "", symbol_key: f.symbol ?? "etoile",
    }));
    const { error: fErr } = await sb.from("factions").insert(factionRows);
    if (fErr) return NextResponse.json({ error: `Insert factions: ${fErr.message}` }, { status: 500 });

    return NextResponse.json({ id: camp.id });
  } catch (e: any) {
    return NextResponse.json({ error: `Exception: ${e?.message ?? String(e)}` }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad body" }, { status: 400 });
  const { id, campaignId, password, ...updates } = body;
  const targetId = campaignId ?? id;
  if (!(await authorize(targetId, password))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // Drop forbidden fields
  delete (updates as any).id;
  delete (updates as any).password_hash;
  delete (updates as any).created_at;
  const sb = supabaseServer();
  const { data, error } = await sb.from("campaigns").update(updates).eq("id", targetId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
