"use client";

import { useEffect, useState } from "react";
import { useCampaign } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import { apiEditCall } from "@/lib/api-edit";
import {
  computeAllianceStats,
  computeFactionStats,
} from "@/lib/campaign-stats";

export default function PermanentHud() {
  const { campaign, alliances, factions, battles, openChronicle } = useCampaign();
  const { isCampaignUnlocked, logoutCampaign } = useSession();
  const editing = isCampaignUnlocked(campaign.id);

  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState(campaign.status_text);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => { setStatusDraft(campaign.status_text); }, [campaign.status_text]);

  const allianceMode = campaign.alliance_mode && alliances.length > 0;

  const segments = allianceMode
    ? computeAllianceStats(alliances, factions, battles).map((a) => ({
        id: a.alliance.id, label: a.alliance.name, color: a.alliance.color_hex, victories: a.victories,
      }))
    : computeFactionStats(factions, battles).map((f) => ({
        id: f.faction.id, label: f.faction.name, color: f.faction.color_hex, victories: f.victories,
      }));

  const totalBattles = battles.length;

  const saveStatus = async () => {
    setSavingStatus(true);
    await apiEditCall("/api/campaigns", "PUT" as any, campaign.id, {
      id: campaign.id, status_text: statusDraft,
    });
    setSavingStatus(false);
    setEditingStatus(false);
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-30 w-[360px] hud-panel hud-panel--strong" style={{ padding: "14px 16px" }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-display text-sm tracking-widest truncate" style={{ color: "var(--accent-cyan)" }} title={campaign.name}>
          ◈ {campaign.name.toUpperCase()}
        </div>
        <button className="hud-button" style={{ padding: "0.3rem 0.6rem", fontSize: "0.6rem" }} onClick={openChronicle}>
          CHRONIQUES ↗
        </button>
      </div>

      <div className="font-mono text-[10px] mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "0.16em" }}>
        {totalBattles} BATAILLE{totalBattles > 1 ? "S" : ""} DEROULEE{totalBattles > 1 ? "S" : ""}
      </div>

      <ForceBar segments={segments} />

      <div className="hud-divider my-3" style={{ opacity: 0.5 }} />

      <div className="hud-label mb-1 flex items-center justify-between">
        <span>STATUT</span>
        {editing && !editingStatus && (
          <button onClick={() => setEditingStatus(true)} className="hover:text-white" style={{ cursor: "crosshair", fontSize: "0.8em" }}>✎</button>
        )}
      </div>
      {editingStatus ? (
        <>
          <textarea value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} rows={4}
            className="w-full px-2 py-1.5 bg-black/40 border font-mono text-[11px] focus:outline-none resize-none"
            style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} autoFocus />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setEditingStatus(false); setStatusDraft(campaign.status_text); }}
              className="font-mono text-[10px]" style={{ color: "var(--text-secondary)", cursor: "crosshair" }}>
              ANNULER
            </button>
            <button onClick={saveStatus} disabled={savingStatus} className="font-mono text-[10px]"
              style={{ color: "var(--accent-cyan)", cursor: "crosshair" }}>
              {savingStatus ? "..." : "ENREGISTRER"}
            </button>
          </div>
        </>
      ) : campaign.status_text ? (
        <p className="font-mono text-[11px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {campaign.status_text}
        </p>
      ) : (
        <p className="font-mono text-[11px] italic" style={{ color: "var(--text-faded)" }}>
          {editing ? "Decris ou en est la campagne..." : "Aucun statut renseigne."}
        </p>
      )}

      {editing && (
        <div className="mt-3 pt-2 flex justify-end" style={{ borderTop: "1px solid var(--border-faded)" }}>
          <button onClick={logoutCampaign} className="font-mono text-[9px] hover:text-white"
            style={{ color: "var(--text-faded)", cursor: "crosshair", letterSpacing: "0.12em" }}
            title="Verrouiller la campagne (vider la session)">
            ⊗ SE DECONNECTER
          </button>
        </div>
      )}
    </div>
  );
}

function ForceBar({ segments }: { segments: { id: string; color: string; victories: number; label: string }[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.victories, 0));
  return (
    <div className="relative h-6 overflow-hidden" style={{
      background: "rgba(0, 0, 0, 0.5)", border: "1px solid var(--border-faded)",
      clipPath: "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)",
    }}>
      <div className="flex h-full">
        {segments.map((seg) => {
          const pct = total === 0 ? 100 / segments.length : (seg.victories / total) * 100;
          return (
            <div key={seg.id} className="relative flex items-center justify-center" title={`${seg.label} - ${seg.victories} victoires`}
              style={{
                width: `${pct}%`,
                background: `linear-gradient(180deg, ${seg.color} 0%, ${darken(seg.color, 0.4)} 100%)`,
                boxShadow: `0 0 8px ${seg.color}aa inset`, transition: "width 350ms ease",
              }}>
              {seg.victories > 0 && pct > 8 && (
                <span className="font-mono text-[10px] font-bold relative z-10" style={{ color: "#ffffff", textShadow: "0 0 4px #000, 0 0 2px #000" }}>
                  {seg.victories}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16); const g = parseInt(h.slice(2, 4), 16); const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${Math.floor(r * (1 - amount))}, ${Math.floor(g * (1 - amount))}, ${Math.floor(b * (1 - amount))})`;
}
