"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCampaign } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import {
  computeAllianceStats,
  computeFactionStats,
} from "@/lib/campaign-stats";

export default function PermanentHud() {
  const pathname = usePathname();
  const { campaign, alliances, factions, battles, openChronicle } = useCampaign();
  const { isEditing, logoutCampaign } = useSession();

  const [expanded, setExpanded] = useState(false);

  if (pathname === "/") return null;

  const allianceMode = campaign.alliance_mode && alliances.length > 0;

  const segments = allianceMode
    ? computeAllianceStats(alliances, factions, battles).map((a) => ({
        id: a.alliance.id, label: a.alliance.name, color: a.alliance.color_hex, victories: a.victories,
      }))
    : computeFactionStats(factions, battles).map((f) => ({
        id: f.faction.id, label: f.faction.name, color: f.faction.color_hex, victories: f.victories,
      }));

  const totalVictories = segments.reduce((s, x) => s + x.victories, 0);
  const drawCount = battles.filter((b) => !b.winning_faction_id).length;

  return (
    <div
      className="fixed top-4 right-4 z-30 w-[320px] md:w-[360px] hud-panel hud-panel--strong"
      style={{ padding: "12px 14px 14px" }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div
          className="font-display text-sm tracking-widest truncate"
          style={{ color: "var(--accent-cyan)" }}
          title={campaign.name}
        >
          ◈ {campaign.name.toUpperCase()}
        </div>
        <button
          className="hud-button"
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.65rem" }}
          onClick={openChronicle}
        >
          CHRONO ↗
        </button>
      </div>

      {isEditing && (
        <div className="flex items-center justify-between mb-2 hud-panel--inset px-2 py-1">
          <span className="font-mono text-[10px] hud-pulse" style={{ color: "#7fdfff", letterSpacing: "0.16em" }}>
            ● MODE EDITION
          </span>
          <button
            className="font-mono text-[10px] hover:text-white"
            style={{ color: "#ff7070", cursor: "crosshair", letterSpacing: "0.1em" }}
            onClick={logoutCampaign}
          >
            DECONNEXION
          </button>
        </div>
      )}

      <div className="hud-divider mb-2" />

      <div className="cursor-pointer" data-interactive="true" onClick={() => setExpanded((v) => !v)}>
        <div className="hud-label mb-1.5 flex justify-between">
          <span>FORCE DEPLOYEE</span>
          <span style={{ color: "var(--text-secondary)" }}>
            {totalVictories} VIC · {drawCount} NUL
          </span>
        </div>
        <ForceBar segments={segments} />
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {allianceMode
            ? computeAllianceStats(alliances, factions, battles).map((a) => (
                <AllianceRow key={a.alliance.id} stats={a} />
              ))
            : computeFactionStats(factions, battles).map((f) => (
                <FactionRow key={f.faction.id} stats={f} />
              ))}
        </div>
      )}

      <div className="hud-divider my-3" style={{ opacity: 0.5 }} />

      {campaign.last_battle_summary && (
        <div className="font-mono text-[11px] italic mb-1" style={{ color: "var(--accent-cyan)" }}>
          "{campaign.last_battle_summary}"
        </div>
      )}
      {campaign.status_text && (
        <div className="font-mono text-[11px] leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
          {campaign.status_text}
        </div>
      )}
    </div>
  );
}

function ForceBar({ segments }: { segments: { id: string; color: string; victories: number; label: string }[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.victories, 0));
  return (
    <div className="relative h-3 overflow-hidden" style={{
      background: "rgba(0, 0, 0, 0.5)", border: "1px solid var(--border-faded)",
      clipPath: "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)",
    }}>
      <div className="flex h-full">
        {segments.map((seg) => {
          const pct = total === 0 ? 100 / segments.length : (seg.victories / total) * 100;
          return (
            <div key={seg.id} title={`${seg.label} - ${seg.victories} victoires`} style={{
              width: `${pct}%`,
              background: `linear-gradient(180deg, ${seg.color} 0%, ${darken(seg.color, 0.4)} 100%)`,
              boxShadow: `0 0 8px ${seg.color}aa inset`, transition: "width 350ms ease",
            }} />
          );
        })}
      </div>
    </div>
  );
}

function AllianceRow({ stats }: any) {
  return (
    <div className="hud-panel--inset px-2.5 py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5" style={{ background: stats.alliance.color_hex, boxShadow: `0 0 6px ${stats.alliance.color_hex}` }} />
          <span className="font-display text-xs tracking-wider" style={{ color: "var(--accent-cyan)" }}>
            {stats.alliance.name.toUpperCase()}
          </span>
        </div>
        <span className="font-mono text-[11px]" style={{ color: "var(--text-primary)" }}>
          {stats.victories} VIC
        </span>
      </div>
      <div className="pl-4 space-y-0.5">
        {stats.factions.map((f: any) => (
          <div key={f.faction.id} className="font-mono text-[10px] flex justify-between" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5" style={{ background: f.faction.color_hex }} />
              {f.faction.name}
            </span>
            <span>{f.victories}/{f.battles}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactionRow({ stats }: any) {
  return (
    <div className="hud-panel--inset px-2.5 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2" style={{ background: stats.faction.color_hex, boxShadow: `0 0 6px ${stats.faction.color_hex}` }} />
        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>{stats.faction.name}</span>
      </div>
      <span className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
        {stats.victories}/{stats.battles}
      </span>
    </div>
  );
}

function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const dr = Math.max(0, Math.floor(r * (1 - amount)));
  const dg = Math.max(0, Math.floor(g * (1 - amount)));
  const db = Math.max(0, Math.floor(b * (1 - amount)));
  return `rgb(${dr}, ${dg}, ${db})`;
}
