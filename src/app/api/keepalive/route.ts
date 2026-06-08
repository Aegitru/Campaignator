export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Endpoint pinguée par Vercel Cron pour empêcher Supabase free tier
 * de se mettre en pause après 7 jours d'inactivité.
 *
 * Sécurité : Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>` si tu
 * définis l'env var CRON_SECRET. On vérifie ce token quand il est présent ;
 * sinon on accepte tout (l'endpoint ne fait qu'un select 1, faible risque).
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const sb = supabaseServer();
    // Lecture la plus légère possible : 1 ligne sans payload utile
    const { error } = await sb.from("campaigns").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}
