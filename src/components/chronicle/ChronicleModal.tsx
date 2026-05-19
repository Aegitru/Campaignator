"use client";

import { useEffect, useMemo } from "react";
import { useCampaign } from "@/lib/campaign-context";
import { buildChronicle } from "@/lib/campaign-stats";

/**
 * Onglet Chronologie (cdc §14) — modal global.
 * Toutes les batailles de la campagne, ordre chronologique décroissant.
 * Chaque entrée : date | Système > Planète > Zone | Titre | Badge résultat
 */
export default function ChronicleModal() {
  const {
    chronicleOpen,
    closeChronicle,
    openBattle,
    battles,
    zones,
    planets,
    factions,
    systems,
  } = useCampaign();

  const entries = useMemo(
    () => buildChronicle(battles, zones, planets, factions),
    [battles, zones, planets, factions]
  );

  const systemById = useMemo(
    () => new Map(systems.map((s) => [s.id, s])),
    [systems]
  );

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChronicle();
    };
    if (chronicleOpen) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [chronicleOpen, closeChronicle]);

  if (!chronicleOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(0, 0, 0, 0.72)", backdropFilter: "blur(6px)" }}
      onClick={closeChronicle}
    >
      <div
        className="hud-panel hud-panel--strong relative max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0 }}
      >
        {/* Header */}
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-faded)" }}
        >
          <div>
            <div className="hud-label mb-1">CAMPAIGN_CHRONICLE</div>
            <h2
              className="font-display text-2xl tracking-wide"
              style={{ color: "var(--accent-cyan)" }}
            >
              Chronologie de la Croisade
            </h2>
          </div>
          <button
            onClick={closeChronicle}
            className="hud-button"
            style={{ padding: "0.4rem 0.7rem", fontSize: "0.75rem" }}
            aria-label="Fermer"
          >
            FERMER ✕
          </button>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {entries.length === 0 ? (
            <div
              className="hud-panel--inset px-4 py-8 text-center font-mono text-sm"
              style={{ color: "var(--text-faded)" }}
            >
              Aucun rapport de bataille enregistré dans cette campagne.
            </div>
          ) : (
            <ol className="space-y-2">
              {entries.map(({ battle, zone, planet, winningFaction }) => {
                const system = systemById.get(planet.system_id);
                const isDraw = !winningFaction;
                return (
                  <li key={battle.id}>
                    <button
                      onClick={() => {
                        openBattle(battle.id);
                      }}
                      className="w-full text-left hud-panel--inset px-4 py-3 hover:bg-[rgba(0,170,255,0.07)] transition-colors group"
                      style={{ cursor: "crosshair" }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="font-mono text-xs flex-shrink-0"
                            style={{ color: "var(--accent-blue)" }}
                          >
                            {formatDateShort(battle.battle_date)}
                          </span>
                          <span
                            className="font-display text-sm tracking-wide truncate"
                            style={{ color: "var(--accent-cyan)" }}
                          >
                            {battle.title}
                          </span>
                        </div>
                        {isDraw ? (
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                            style={{
                              background: "rgba(106, 138, 154, 0.18)",
                              border: "1px solid var(--text-secondary)",
                              color: "var(--text-secondary)",
                              letterSpacing: "0.08em",
                            }}
                          >
                            MATCH NUL
                          </span>
                        ) : (
                          <span
                            className="font-mono text-[10px] px-1.5 py-0.5 flex-shrink-0"
                            style={{
                              background: hexAlpha(winningFaction!.color_hex, 0.18),
                              border: `1px solid ${winningFaction!.color_hex}`,
                              color: "#ffffff",
                              letterSpacing: "0.08em",
                              boxShadow: `0 0 6px ${hexAlpha(winningFaction!.color_hex, 0.5)}`,
                            }}
                          >
                            ▲ {winningFaction!.name.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div
                        className="font-mono text-[11px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {system && (
                          <>
                            <span style={{ color: "var(--text-primary)" }}>
                              {system.name.toUpperCase()}
                            </span>
                            &nbsp;▸&nbsp;
                          </>
                        )}
                        {planet.name}
                        &nbsp;▸&nbsp;
                        <span style={{ color: "var(--text-primary)" }}>
                          {zone.name}
                        </span>
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
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).toUpperCase();
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
