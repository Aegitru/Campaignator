"use client";

import { useMemo } from "react";
import { useCampaign } from "@/lib/campaign-context";
import { getBattlesForZone } from "@/lib/campaign-stats";

/**
 * Panel Zone (cdc §12) — slide-in latéral droit.
 * Affiche : nom zone, badge faction contrôlante, liste des batailles
 * (récent → ancien) avec badge victoire/nul.
 */
export default function ZonePanel() {
  const {
    selectedZoneId,
    closeZone,
    openBattle,
    zones,
    battles,
    factions,
    planets,
  } = useCampaign();

  const zone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );
  const planet = useMemo(
    () => (zone ? planets.find((p) => p.id === zone.planet_id) ?? null : null),
    [zone, planets]
  );
  const controllingFaction = useMemo(
    () =>
      zone && zone.controlling_faction_id
        ? factions.find((f) => f.id === zone.controlling_faction_id) ?? null
        : null,
    [zone, factions]
  );
  const zoneBattles = useMemo(
    () => (zone ? getBattlesForZone(zone.id, battles) : []),
    [zone, battles]
  );
  const factionById = useMemo(
    () => new Map(factions.map((f) => [f.id, f])),
    [factions]
  );

  const open = !!zone;

  return (
    <>
      {/* Backdrop (clic = fermer) */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0, 0, 0, 0.45)" }}
        onClick={closeZone}
        aria-hidden
      />

      {/* Panel slide-in */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[420px] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="hud-panel hud-panel--strong h-full flex flex-col"
          style={{ padding: 0, clipPath: "none", border: "none", borderLeft: "1px solid var(--border-strong)", background: "rgba(5, 15, 30, 0.95)" }}
        >
          {/* Header */}
          <div
            className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 relative"
            style={{ borderBottom: "1px solid var(--border-faded)" }}
          >
            <div>
              <div className="hud-label mb-1">ZONE_RECORD</div>
              <h2
                className="font-display text-xl tracking-wide mb-2"
                style={{ color: "var(--accent-cyan)" }}
              >
                {zone?.name}
              </h2>
              {planet && (
                <div
                  className="font-mono text-[11px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  PLANÈTE&nbsp;: {planet.name.toUpperCase()}
                </div>
              )}
              {controllingFaction ? (
                <div className="mt-3 inline-flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5"
                    style={{
                      background: controllingFaction.color_hex,
                      boxShadow: `0 0 6px ${controllingFaction.color_hex}`,
                    }}
                  />
                  <span
                    className="font-mono text-xs uppercase tracking-widest"
                    style={{ color: controllingFaction.color_hex, filter: "brightness(1.6)" }}
                  >
                    CONTRÔLE&nbsp;: {controllingFaction.name}
                  </span>
                </div>
              ) : (
                <div className="mt-3 hud-label">CONTRÔLE&nbsp;: NEUTRE</div>
              )}
            </div>

            <button
              onClick={closeZone}
              className="hud-button"
              style={{ padding: "0.3rem 0.55rem", fontSize: "0.7rem" }}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Liste batailles */}
          <div className="px-5 py-4 overflow-y-auto flex-1">
            <div className="hud-label mb-3">
              BATTLE_LOG · {zoneBattles.length} RAPPORT{zoneBattles.length > 1 ? "S" : ""}
            </div>

            {zoneBattles.length === 0 ? (
              <div
                className="hud-panel--inset px-4 py-5 text-center font-mono text-xs"
                style={{ color: "var(--text-faded)" }}
              >
                Aucune bataille consignée pour cette zone.
              </div>
            ) : (
              <ul className="space-y-2">
                {zoneBattles.map((b) => {
                  const winning = b.winning_faction_id
                    ? factionById.get(b.winning_faction_id) ?? null
                    : null;
                  const isDraw = !winning;
                  return (
                    <li key={b.id}>
                      <button
                        onClick={() => openBattle(b.id)}
                        className="w-full text-left hud-panel--inset px-3 py-3 hover:bg-[rgba(0,170,255,0.06)] transition-colors"
                        style={{ cursor: "crosshair" }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <span
                            className="font-display text-sm tracking-wide"
                            style={{ color: "var(--accent-cyan)" }}
                          >
                            {b.title}
                          </span>
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
                                background: hexAlpha(winning!.color_hex, 0.18),
                                border: `1px solid ${winning!.color_hex}`,
                                color: "#ffffff",
                                letterSpacing: "0.08em",
                                boxShadow: `0 0 6px ${hexAlpha(winning!.color_hex, 0.5)}`,
                              }}
                            >
                              ▲ {winning!.name.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div
                          className="font-mono text-[11px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {formatDate(b.battle_date)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
