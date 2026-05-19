"use client";

import { useEffect, useMemo, useState } from "react";
import { useCampaign } from "@/lib/campaign-context";
import { buildChronicle } from "@/lib/campaign-stats";

type ResultFilter = "all" | "victory" | "draw";

export default function ChronicleModal() {
  const { chronicleOpen, closeChronicle, openBattle, battles, zones, planets, factions, systems } = useCampaign();
  const [factionFilter, setFactionFilter] = useState<string>("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");

  const allEntries = useMemo(() => buildChronicle(battles, zones, planets, factions), [battles, zones, planets, factions]);
  const systemById = useMemo(() => new Map(systems.map((s) => [s.id, s])), [systems]);

  const entries = useMemo(() => allEntries.filter((e) => {
    if (factionFilter !== "all" && e.battle.winning_faction_id !== factionFilter) return false;
    if (systemFilter !== "all" && e.planet.system_id !== systemFilter) return false;
    if (resultFilter === "victory" && !e.battle.winning_faction_id) return false;
    if (resultFilter === "draw" && e.battle.winning_faction_id) return false;
    return true;
  }), [allEntries, factionFilter, systemFilter, resultFilter]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeChronicle(); };
    if (chronicleOpen) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [chronicleOpen, closeChronicle]);

  if (!chronicleOpen) return null;

  const resetFilters = () => { setFactionFilter("all"); setSystemFilter("all"); setResultFilter("all"); };
  const filteringActive = factionFilter !== "all" || systemFilter !== "all" || resultFilter !== "all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(0, 0, 0, 0.72)", backdropFilter: "blur(6px)" }} onClick={closeChronicle}>
      <div className="hud-panel hud-panel--strong relative max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} style={{ padding: 0 }}>
        <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-faded)" }}>
          <div>
            <div className="hud-label mb-1">CAMPAIGN_CHRONICLE</div>
            <h2 className="font-display text-2xl tracking-wide" style={{ color: "var(--accent-cyan)" }}>
              Chronologie de la Croisade
            </h2>
          </div>
          <button onClick={closeChronicle} className="hud-button" style={{ padding: "0.4rem 0.7rem", fontSize: "0.75rem" }}>
            FERMER ✕
          </button>
        </div>

        {/* Filtres */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-2 hud-panel--inset"
          style={{ borderRadius: 0, clipPath: "none", border: "none", borderBottom: "1px solid var(--border-faded)" }}>
          <span className="hud-label mr-2">FILTRES</span>
          <select value={factionFilter} onChange={(e) => setFactionFilter(e.target.value)}
            className="px-2 py-1 bg-black/40 border font-mono text-xs"
            style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
            <option value="all">- toutes factions -</option>
            {factions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={systemFilter} onChange={(e) => setSystemFilter(e.target.value)}
            className="px-2 py-1 bg-black/40 border font-mono text-xs"
            style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
            <option value="all">- tous systemes -</option>
            {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value as ResultFilter)}
            className="px-2 py-1 bg-black/40 border font-mono text-xs"
            style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
            <option value="all">- tous resultats -</option>
            <option value="victory">Victoires uniquement</option>
            <option value="draw">Matchs nuls uniquement</option>
          </select>
          {filteringActive && (
            <button onClick={resetFilters} className="font-mono text-[10px] hover:text-white"
              style={{ color: "#ff7070", cursor: "crosshair", letterSpacing: "0.1em", marginLeft: "auto" }}>
              RESET FILTRES
            </button>
          )}
          <span className="hud-label ml-auto" style={{ color: "var(--accent-cyan)" }}>
            {entries.length} / {allEntries.length}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {entries.length === 0 ? (
            <div className="hud-panel--inset px-4 py-8 text-center font-mono text-sm" style={{ color: "var(--text-faded)" }}>
              Aucun rapport ne correspond aux filtres.
            </div>
          ) : (
            <ol className="space-y-2">
              {entries.map(({ battle, zone, planet, winningFaction }) => {
                const system = systemById.get(planet.system_id);
                const isDraw = !winningFaction;
                return (
                  <li key={battle.id}>
                    <button onClick={() => openBattle(battle.id)}
                      className="w-full text-left hud-panel--inset px-4 py-3 hover:bg-[rgba(0,170,255,0.07)] transition-colors group"
                      style={{ cursor: "crosshair" }}>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs flex-shrink-0" style={{ color: "var(--accent-blue)" }}>
                            {formatDateShort(battle.battle_date)}
                          </span>
                          <span className="font-display text-sm tracking-wide truncate" style={{ color: "var(--accent-cyan)" }}>
                            {battle.title}
                          </span>
                        </div>
                        {isDraw ? (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                            style={{ background: "rgba(106, 138, 154, 0.18)", border: "1px solid var(--text-secondary)", color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
                            MATCH NUL
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                            style={{ background: hexAlpha(winningFaction!.color_hex, 0.18), border: `1px solid ${winningFaction!.color_hex}`, color: "#ffffff", letterSpacing: "0.08em" }}>
                            ▲ {winningFaction!.name.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {system && (<><span style={{ color: "var(--text-primary)" }}>{system.name.toUpperCase()}</span> ▸ </>)}
                        {planet.name} ▸ <span style={{ color: "var(--text-primary)" }}>{zone.name}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase();
}
function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16); const g = parseInt(h.slice(2, 4), 16); const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
