"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCampaign } from "@/lib/campaign-context";

/**
 * Modal Rapport de Bataille (cdc §13) — mode lecture.
 * Affiche : titre, date, badge résultat coloré faction, narrative markdown, galerie photos + lightbox.
 */
export default function BattleModal() {
  const {
    selectedBattleId,
    closeBattle,
    battles,
    factions,
    zones,
    planets,
  } = useCampaign();

  const battle = useMemo(
    () => battles.find((b) => b.id === selectedBattleId) ?? null,
    [battles, selectedBattleId]
  );
  const zone = useMemo(
    () => (battle ? zones.find((z) => z.id === battle.zone_id) ?? null : null),
    [battle, zones]
  );
  const planet = useMemo(
    () => (zone ? planets.find((p) => p.id === zone.planet_id) ?? null : null),
    [zone, planets]
  );
  const winningFaction = useMemo(
    () =>
      battle && battle.winning_faction_id
        ? factions.find((f) => f.id === battle.winning_faction_id) ?? null
        : null,
    [battle, factions]
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = useMemo<string[]>(() => [], []); // V3 : remplacer par les vraies photos Cloudinary

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else closeBattle();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [closeBattle, lightboxIndex]);

  if (!battle) return null;

  const isDraw = !battle.winning_faction_id;
  const accent = winningFaction?.color_hex ?? "#6a8a9a";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-2 py-2 md:px-4 md:py-8"
      style={{ background: "rgba(0, 0, 0, 0.72)", backdropFilter: "blur(6px)" }}
      onClick={closeBattle}
    >
      <div
        className="hud-panel hud-panel--strong relative max-w-3xl w-full max-h-[calc(100dvh-1rem)] md:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0 }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 relative" style={{ borderBottom: "1px solid var(--border-faded)" }}>
          <button
            onClick={closeBattle}
            className="absolute top-3 right-4 hud-label hover:text-white transition-colors"
            style={{ fontSize: "0.9rem", cursor: "crosshair" }}
            aria-label="Fermer"
          >
            ✕
          </button>

          <div className="hud-label mb-1">BATTLE_REPORT</div>
          <h2
            className="font-display text-2xl md:text-3xl tracking-wide"
            style={{ color: "var(--accent-cyan)" }}
          >
            {battle.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span
              className="font-mono text-xs hud-panel--inset px-2.5 py-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {formatDate(battle.battle_date)}
            </span>
            {zone && planet && (
              <span
                className="font-mono text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {planet.name.toUpperCase()} &nbsp;▸&nbsp;{" "}
                <span style={{ color: "var(--text-primary)" }}>
                  {zone.name}
                </span>
              </span>
            )}
            {(battle as any).participating_faction_ids?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 w-full">
              <span className="hud-label" style={{ fontSize: "0.6rem" }}>PARTICIPANTES :</span>
              {((battle as any).participating_faction_ids as string[]).map((fid: string) => {
                const f = factions.find((x) => x.id === fid);
                if (!f) return null;
                return (
                  <span key={fid} className="font-mono text-[10px] px-2 py-0.5 flex items-center gap-1"
                    style={{ background: hexAlpha(f.color_hex, 0.15), border: `1px solid ${f.color_hex}55`, color: "#ffffff" }}>
                    <span className="inline-block w-1.5 h-1.5" style={{ background: f.color_hex }} />
                    {f.name}
                  </span>
                );
              })}
            </div>
          )}

          {isDraw ? (
              <span
                className="font-mono text-xs px-2.5 py-1"
                style={{
                  background: "rgba(106, 138, 154, 0.15)",
                  border: "1px solid var(--text-secondary)",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                MATCH NUL
              </span>
            ) : (
              <span
                className="font-mono text-xs px-2.5 py-1"
                style={{
                  background: hexAlpha(accent, 0.18),
                  border: `1px solid ${accent}`,
                  color: "#ffffff",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  boxShadow: `0 0 8px ${hexAlpha(accent, 0.4)}`,
                }}
              >
                VICTOIRE — {winningFaction?.name}
              </span>
            )}
          </div>
        </div>

        {/* Body — markdown */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <article className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {battle.narrative_text || "_Aucun rapport rédigé._"}
            </ReactMarkdown>
          </article>

          {/* Galerie photos */}
          {photos.length > 0 && (
            <div className="mt-6">
              <div className="hud-label mb-2">PHOTOGRAPHIC_RECORD</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square overflow-hidden border"
                    style={{
                      borderColor: "var(--border-faded)",
                      cursor: "crosshair",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          style={{ background: "rgba(0, 0, 0, 0.92)" }}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 hud-button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
          >
            FERMER ✕
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 hud-button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
            >
              ◂
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              className="absolute right-4 hud-button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
            >
              ▸
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIndex]}
            alt=""
            className="max-h-[88vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
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
