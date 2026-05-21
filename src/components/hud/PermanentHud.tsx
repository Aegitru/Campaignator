"use client";

import { useEffect, useState, useMemo } from "react";
import { useCampaign } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import { apiEditCall } from "@/lib/api-edit";
import { computeAllianceStats, computeFactionStats, buildChronicle } from "@/lib/campaign-stats";
import { FactionSymbol } from "@/lib/faction-symbols";
import BattleQuickCreate from "@/components/battle/BattleQuickCreate";
import type { Faction, StellarSystem } from "@/types/domain";

type EntryShape = ReturnType<typeof buildChronicle>[number];

export default function PermanentHud() {
  const { campaign, alliances, factions, battles, zones, planets, systems, openBattle } = useCampaign();
  const { isCampaignUnlocked } = useSession();
  const editing = isCampaignUnlocked(campaign.id);

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)") : null;
    if (!mq) return;
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState(campaign.status_text);
  const [savingStatus, setSavingStatus] = useState(false);
  const [showChronicle, setShowChronicle] = useState(false);
  const [showAddBattle, setShowAddBattle] = useState(false);

  const [factionFilter, setFactionFilter] = useState("all");
  const [systemFilter, setSystemFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState<"all" | "victory" | "draw">("all");

  useEffect(() => { setStatusDraft(campaign.status_text); }, [campaign.status_text]);

  const allianceMode = campaign.alliance_mode && alliances.length > 0;
  const factionStats = useMemo(() => computeFactionStats(factions, battles), [factions, battles]);
  const allianceStats = useMemo(() => computeAllianceStats(alliances, factions, battles), [alliances, factions, battles]);
  const totalBattles = battles.length;

  const saveStatus = async () => {
    setSavingStatus(true);
    await apiEditCall("/api/campaigns", "PUT", campaign.id, { id: campaign.id, status_text: statusDraft });
    setSavingStatus(false);
    setEditingStatus(false);
    if (typeof window !== "undefined") window.location.reload();
  };

  const chronicleEntries = useMemo(() => buildChronicle(battles, zones, planets, factions), [battles, zones, planets, factions]);
  const filteredEntries = useMemo(() => chronicleEntries.filter((e) => {
    if (factionFilter !== "all" && e.battle.winning_faction_id !== factionFilter) return false;
    if (systemFilter !== "all" && e.planet.system_id !== systemFilter) return false;
    if (resultFilter === "victory" && !e.battle.winning_faction_id) return false;
    if (resultFilter === "draw" && e.battle.winning_faction_id) return false;
    return true;
  }), [chronicleEntries, factionFilter, systemFilter, resultFilter]);

  const expanded = showChronicle;

  return (
    <div
      className="hud-panel hud-panel--strong"
      style={{
        position: "fixed",
        top: isMobile ? "0.5rem" : "1.5rem",
        right: isMobile ? "0.5rem" : "1.5rem",
        left: isMobile ? "0.5rem" : "auto",
        bottom: expanded ? (isMobile ? "55vh" : "1.5rem") : "auto",
        zIndex: 50,
        width: isMobile ? "auto" : "360px",
        maxWidth: isMobile ? "none" : "calc(100vw - 3rem)",
        padding: isMobile ? "10px 12px" : "14px 16px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        maxHeight: isMobile && expanded ? "45vh" : "none",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
        <div className="font-display text-sm tracking-widest truncate" style={{ color: "var(--accent-cyan)" }} title={campaign.name}>
          {"◈"} {campaign.name.toUpperCase()}
        </div>
        <button onClick={() => setCollapsed((v) => !v)} className="hud-button"
          style={{ padding: "0.25rem 0.55rem", fontSize: "0.75rem", lineHeight: 1 }}
          title={collapsed ? "Deplier" : "Replier"}>
          {collapsed ? "v" : "^"}
        </button>
      </div>

      {!collapsed && (
        <>
          {!showChronicle && (
            <>
              <div className="font-mono text-[10px] mb-2 flex-shrink-0" style={{ color: "var(--text-secondary)", letterSpacing: "0.16em" }}>
                {totalBattles} BATAILLE{totalBattles > 1 ? "S" : ""} DEROULEE{totalBattles > 1 ? "S" : ""}
              </div>

              <ForceBar
                segments={allianceMode
                  ? allianceStats.map((a) => ({
                      id: a.alliance.id, label: a.alliance.name, color: a.alliance.color_hex,
                      victories: a.victories, symbol: a.factions[0]?.faction.symbol_key ?? "etoile",
                    }))
                  : factionStats.map((f) => ({
                      id: f.faction.id, label: f.faction.name, color: f.faction.color_hex,
                      victories: f.victories, symbol: f.faction.symbol_key ?? "etoile",
                    }))
                }
              />

              <div className="hud-divider my-3 flex-shrink-0" style={{ opacity: 0.5 }} />

              <div className="hud-label mb-1 flex items-center justify-between flex-shrink-0">
                <span>STATUT</span>
                {editing && !editingStatus && (
                  <button onClick={() => setEditingStatus(true)} aria-label="Modifier le statut"
                    className="hud-button" style={{ padding: "0.2rem 0.5rem", fontSize: "0.9rem", lineHeight: 1 }}>
                    EDIT
                  </button>
                )}
              </div>
              {editingStatus ? (
                <div className="flex-shrink-0">
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
                </div>
              ) : campaign.status_text ? (
                <p className="font-mono text-[11px] leading-relaxed flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                  {campaign.status_text}
                </p>
              ) : (
                <p className="font-mono text-[11px] italic flex-shrink-0" style={{ color: "var(--text-faded)" }}>
                  {editing ? "Decris ou en est la campagne..." : "Aucun statut renseigne."}
                </p>
              )}
            </>
          )}

          {showChronicle && (
            <ChronicleInline
              entries={filteredEntries} total={chronicleEntries.length}
              factions={factions} systems={systems}
              factionFilter={factionFilter} systemFilter={systemFilter} resultFilter={resultFilter}
              setFactionFilter={setFactionFilter} setSystemFilter={setSystemFilter} setResultFilter={setResultFilter}
              onBattleClick={(id: string) => openBattle(id)}
            />
          )}

          <div className="mt-3 pt-2 flex items-center justify-between gap-2 flex-shrink-0" style={{ borderTop: "1px solid var(--border-faded)" }}>
            <button onClick={() => setShowChronicle((v) => !v)} className="hud-button"
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.65rem" }}>
              {showChronicle ? "RETOUR STATUT" : "CHRONIQUES"}
            </button>
            {editing && (
              <button onClick={() => setShowAddBattle(true)} className="hud-button"
                style={{ padding: "0.3rem 0.7rem", fontSize: "0.85rem", lineHeight: 1, background: "rgba(127,223,255,0.15)" }}
                title="Ajouter une bataille">
                +
              </button>
            )}
          </div>
        </>
      )}

      {showAddBattle && (
        <BattleQuickCreate campaignId={campaign.id} onClose={() => setShowAddBattle(false)} />
      )}
    </div>
  );
}

interface SegmentInfo { id: string; color: string; victories: number; label: string; symbol: string }

function ForceBar({ segments }: { segments: SegmentInfo[] }) {
  const total = Math.max(1, segments.reduce((s, x) => s + x.victories, 0));
  return (
    <div className="relative h-9 overflow-hidden flex-shrink-0" style={{
      background: "rgba(0, 0, 0, 0.5)",
      border: "1px solid var(--border-faded)",
      clipPath: "polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)",
    }}>
      <div className="flex h-full">
        {segments.map((seg) => {
          const pct = total === 0 ? 100 / segments.length : (seg.victories / total) * 100;
          return (
            <div key={seg.id} className="relative flex items-center justify-center gap-1.5"
              title={seg.label + " - " + seg.victories + " victoires"}
              style={{
                width: pct + "%",
                background: "linear-gradient(180deg, " + seg.color + " 0%, " + darken(seg.color, 0.4) + " 100%)",
                boxShadow: "0 0 8px " + seg.color + "aa inset",
                transition: "width 350ms ease",
              }}>
              {pct > 14 && <FactionSymbol symbol={seg.symbol} size={16} />}
              {pct > 8 && (
                <span className="font-mono text-[11px] font-bold" style={{ color: "#ffffff", textShadow: "0 0 4px #000" }}>
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

interface ChronicleInlineProps {
  entries: EntryShape[];
  total: number;
  factions: Faction[];
  systems: StellarSystem[];
  factionFilter: string; systemFilter: string; resultFilter: string;
  setFactionFilter: (s: string) => void;
  setSystemFilter: (s: string) => void;
  setResultFilter: (s: "all" | "victory" | "draw") => void;
  onBattleClick: (id: string) => void;
}

function ChronicleInline({
  entries, total, factions, systems,
  factionFilter, systemFilter, resultFilter,
  setFactionFilter, setSystemFilter, setResultFilter,
  onBattleClick,
}: ChronicleInlineProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="hud-label mb-2 flex-shrink-0">CHRONIQUES // {entries.length}/{total}</div>
      <div className="flex flex-wrap gap-1 mb-2 flex-shrink-0">
        <select value={factionFilter} onChange={(e) => setFactionFilter(e.target.value)}
          className="px-1.5 py-0.5 bg-black/40 border font-mono text-[10px]"
          style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
          <option value="all">Toutes</option>
          {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)}
          className="px-1.5 py-0.5 bg-black/40 border font-mono text-[10px]"
          style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
          <option value="all">Tous secteurs</option>
          {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as "all" | "victory" | "draw")}
          className="px-1.5 py-0.5 bg-black/40 border font-mono text-[10px]"
          style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
          <option value="all">Tous</option>
          <option value="victory">Victoires</option>
          <option value="draw">Matchs nuls</option>
        </select>
      </div>
      <div className="overflow-y-auto flex-1 space-y-1.5">
        {entries.length === 0 ? (
          <div className="hud-panel--inset px-3 py-4 text-center font-mono text-[10px]" style={{ color: "var(--text-faded)" }}>
            Aucun rapport.
          </div>
        ) : entries.map(({ battle, zone, planet, winningFaction }) => (
          <button key={battle.id} onClick={() => onBattleClick(battle.id)}
            className="w-full text-left hud-panel--inset px-2 py-1.5 hover:bg-[rgba(0,170,255,0.07)] transition-colors"
            style={{ cursor: "crosshair" }}>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[9px] flex-shrink-0" style={{ color: "var(--accent-blue)" }}>
                  {new Date(battle.battle_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </span>
                <span className="font-display text-[11px] truncate" style={{ color: "var(--accent-cyan)" }}>{battle.title}</span>
              </div>
              {winningFaction ? (
                <span className="font-mono text-[9px] px-1 py-0.5 flex-shrink-0"
                  style={{ background: hexAlpha(winningFaction.color_hex, 0.18), border: "1px solid " + winningFaction.color_hex, color: "#fff" }}>
                  V
                </span>
              ) : (
                <span className="font-mono text-[9px] px-1 py-0.5 flex-shrink-0"
                  style={{ border: "1px solid var(--text-secondary)", color: "var(--text-secondary)" }}>=</span>
              )}
            </div>
            <div className="font-mono text-[9px] truncate" style={{ color: "var(--text-secondary)" }}>
              {planet?.name} / {zone?.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function darken(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const f = (c: number) => Math.max(0, Math.floor(c * (1 - amount)));
  return "rgb(" + f(r) + ", " + f(g) + ", " + f(b) + ")";
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}
