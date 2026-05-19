import { NextResponse } from "next/server";
import { checkCampaignPassword } from "@/lib/supabase-queries";
import { hashPassword, generateSessionToken } from "@/lib/auth";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!password) return NextResponse.json({ ok: false }, { status: 400 });
  const ok = await checkCampaignPassword(id, hashPassword(password));
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, token: generateSessionToken() });
}
