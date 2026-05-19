"use client";

import { useMemo, useState } from "react";
import { useCampaign } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import { getBattlesForZone } from "@/lib/campaign-stats";
import BattleEditor from "@/components/battle/BattleEditor";
import { apiEditCall } from "@/lib/api-edit";
import { useRouter } from "next/navigation";

export default function ZonePanel() {
  const router = useRouter();
  const { selectedZoneId, closeZone, openBattle, zones, battles, factions, planets, campaign } = useCampaign();
  const { isCampaignUnlocked } = useSession();
  const editing = isCampaignUnlocked(campaign.id);

  const [editBattleId, setEditBattleId] = useState<string | null>(null);
  const [creatingBattle, setCreatingBattle] = useState(false);
  const [updating, setUpdating] = useState(false);

  const zone = useMemo(() => zones.find((z) => z.id === selectedZoneId) ?? null, [zones, selectedZoneId]);
  const planet = useMemo(() => (zone ? planets.find((p) => p.id === zone.planet_id) ?? null : null), [zone, planets]);
  const controllingFaction = useMemo(
    () => zone && zone.controlling_faction_id ? factions.find((f) => f.id === zone.controlling_faction_id) ?? null : null,
    [zone, factions]
  );
  const zoneBattles = useMemo(() => zone ? getBattlesForZone(zone.id, battles) : [], [zone, battles]);
  const factionById = useMemo(() => new Map(factions.map((f) => [f.id, f])), [factions]);

  const open = !!zone;

  const setController = async (factionId: string | null) => {
    if (!zone) return;
    setUpdating(true);
    const res = await apiEditCall("/api/zones", "PUT", campaign.id, { id: zone.id, controlling_faction_id: factionId });
    setUpdating(false);
    if (res.ok) router.refresh();
  };

  const deleteZone = async () => {
    if (!zone) return;
    if (!confirm(`Supprimer la zone "${zone.name}" et toutes ses batailles ?`)) return;
    const res = await apiEditCall("/api/zones", "DELETE", campaign.id, { id: zone.id });
    if (res.ok) { router.refresh(); closeZone(); }
  };

  const editingBattle = editBattleId ? battles.find((b) => b.id === editBattleId) ?? null : null;

  return (
    <>
      <div className={`fixed inset-0 z-30 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0, 0, 0, 0.45)" }} onClick={closeZone} aria-hidden />

      <aside className={`fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[440px] transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="hud-panel hud-panel--strong h-full flex flex-col"
          style={{ padding: 0, clipPath: "none", border: "none", borderLeft: "1px solid var(--border-strong)", background: "rgba(5, 15, 30, 0.95)" }}>
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 relative" style={{ borderBottom: "1px solid var(--border-faded)" }}>
            <div>
              <div className="hud-label mb-1">ZONE_RECORD</div>
              <h2 className="font-display text-xl tracking-wide mb-2" style={{ color: "var(--accent-cyan)" }}>{zone?.name}</h2>
              {planet && (
                <div className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  PLANETE : {planet.name.toUpperCase()}
                </div>
              )}
              {editing ? (
                <div className="mt-3">
                  <div className="hud-label mb-1">CONTROLE</div>
                  <select value={controllingFaction?.id ?? ""} disabled={updating}
                    onChange={(e) => setController(e.target.value || null)}
                    className="px-2 py-1 bg-black/40 border font-mono text-xs focus:outline-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                    <option value="">-- Neutre --</option>
                    {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              ) : controllingFaction ? (
                <div className="mt-3 inline-flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5" style={{ background: controllingFaction.color_hex, boxShadow: `0 0 6px ${controllingFaction.color_hex}` }} />
                  <span className="font-mono text-xs uppercase tracking-widest" style={{ color: controllingFaction.color_hex, filter: "brightness(1.6)" }}>
                    CONTROLE : {controllingFaction.name}
                  </span>
                </div>
              ) : (
                <div className="mt-3 hud-label">CONTROLE : NEUTRE</div>
              )}
            </div>
            <button onClick={closeZone} className="hud-button" style={{ padding: "0.3rem 0.55rem", fontSize: "0.7rem" }}>✕</button>
          </div>

          <div className="px-5 py-4 overflow-y-auto flex-1">
            <div className="hud-label mb-3 flex justify-between">
              <span>BATTLE_LOG · {zoneBattles.length}</span>
              {editing && (
                <button onClick={() => setCreatingBattle(true)} className="hover:text-white" style={{ cursor: "crosshair" }}>+ AJOUTER</button>
              )}
            </div>

            {zoneBattles.length === 0 ? (
              <div className="hud-panel--inset px-4 py-5 text-center font-mono text-xs" style={{ color: "var(--text-faded)" }}>
                Aucune bataille consignee.
              </div>
            ) : (
              <ul className="space-y-2">
                {zoneBattles.map((b) => {
                  const winning = b.winning_faction_id ? factionById.get(b.winning_faction_id) ?? null : null;
                  const isDraw = !winning;
                  return (
                    <li key={b.id}>
                      <div className="w-full hud-panel--inset px-3 py-3 hover:bg-[rgba(0,170,255,0.06)] transition-colors flex justify-between items-start gap-2">
                        <button onClick={() => openBattle(b.id)} className="flex-1 text-left" style={{ cursor: "crosshair" }}>
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <span className="font-display text-sm tracking-wide" style={{ color: "var(--accent-cyan)" }}>{b.title}</span>
                            {isDraw ? (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                                style={{ background: "rgba(106, 138, 154, 0.18)", border: "1px solid var(--text-secondary)", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                                MATCH NUL
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                                style={{ background: hexAlpha(winning!.color_hex, 0.18), border: `1px solid ${winning!.color_hex}`, color: "#ffffff", letterSpacing: "0.08em" }}>
                                ▲ {winning!.name.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                            {formatDate(b.battle_date)}
                          </div>
                        </button>
                        {editing && (
                          <button onClick={() => setEditBattleId(b.id)} className="hud-label hover:text-white" style={{ cursor: "crosshair" }}>✎</button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {editing && zone && (
              <div className="mt-6 pt-3" style={{ borderTop: "1px solid var(--border-faded)" }}>
                <button onClick={deleteZone} className="font-mono text-[10px]"
                  style={{ color: "#ff7070", cursor: "crosshair", letterSpacing: "0.1em" }}>
                  SUPPRIMER LA ZONE
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {creatingBattle && zone && (
        <BattleEditor zoneId={zone.id} campaignId={campaign.id} onClose={() => setCreatingBattle(false)} />
      )}
      {editingBattle && zone && (
        <BattleEditor zoneId={zone.id} campaignId={campaign.id} existing={{
          id: editingBattle.id, title: editingBattle.title, battle_date: editingBattle.battle_date,
          narrative_text: editingBattle.narrative_text, winning_faction_id: editingBattle.winning_faction_id,
          participating_faction_ids: (editingBattle as any).participating_faction_ids ?? [],
        }} onClose={() => setEditBattleId(null)} />
      )}
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16); const g = parseInt(h.slice(2, 4), 16); const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
