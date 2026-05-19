"use client";

export function getStoredPassword(campaignId: string): string {
  try {
    return sessionStorage.getItem(`wh40k_pwd_${campaignId}`) ?? "";
  } catch {
    return "";
  }
}

export async function apiEditCall(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  campaignId: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; data?: any; error?: string }> {
  const password = getStoredPassword(campaignId);
  try {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, campaignId, password }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: json?.error ?? `HTTP ${res.status}` };
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Network error" };
  }
}
