"use client";

import Link from "next/link";
import { useState } from "react";
import type { Planet, StellarSystem } from "@/types/domain";
import SystemView from "@/components/system/SystemView";

interface Props {
  system: StellarSystem;
  planets: Planet[];
  campaignName: string;
}

export default function SystemPageClient({
  system,
  planets,
  campaignName,
}: Props) {
  const [selected, setSelected] = useState<Planet | null>(null);
  const [loreOpen, setLoreOpen] = useState(true);

  return (
    <div className="flex-1 flex flex-col relative min-h-[100dvh]">
      {/* ===================== HEADER bar ===================== */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="hud-button text-xs"
          style={{ padding: "0.4rem 0.9rem" }}
        >
          ◂ Retour
        </Link>

        <div className="text-center flex-1">
          <div className="hud-label">{campaignName}</div>
          <div
            className="hud-title text-xl mt-1"
            style={{ letterSpacing: "0.3em" }}
          >
            {system.name}
          </div>
        </div>

        {/* HUD top-right preview (V2 = vrai HUD permanent) */}
        <div className="hud-panel px-3 py-2 hidden md:block min-w-[180px]">
          <div className="hud-label">STELLAR_TYPE</div>
          <div
            className="font-mono text-sm uppercase tracking-widest mt-0.5"
            style={{ color: "var(--accent-cyan)" }}
          >
            {starTypeLabel(system.star_type)}
          </div>
        </div>
      </header>

      {/* ===================== Main viewport ===================== */}
      <div className="relative flex-1 flex">
        {/* Panneau latéral gauche — lore système rétractable */}
        <aside
          className="relative z-10 transition-all duration-300"
          style={{ width: loreOpen ? 320 : 0 }}
        >
          <div
            className="absolute inset-y-0 left-4 right-0 my-2 overflow-hidden"
            style={{ opacity: loreOpen ? 1 : 0, transition: "opacity 220ms ease" }}
          >
            <div className="hud-panel hud-panel--strong h-full p-5 overflow-auto">
              <div className="hud-label mb-2">SYSTEM_LORE</div>
              <h3
                className="font-display text-lg mb-3"
                style={{ color: "var(--accent-cyan)" }}
              >
                {system.name}
              </h3>
              <p
                className="font-mono text-xs leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {system.lore_text || "Aucune entrée d'archive disponible."}
              </p>

              <div
                className="hud-divider my-5"
                style={{ opacity: 0.6 }}
              />

              <div className="hud-label mb-2">PLANETS_REGISTERED</div>
              <ul className="space-y-2">
                {planets
                  .slice()
                  .sort((a, b) => a.orbit_index - b.orbit_index)
                  .map((p) => (
                    <li
                      key={p.id}
                      className="font-mono text-xs flex items-center justify-between"
                    >
                      <span style={{ color: "var(--text-primary)" }}>
                        {p.orbit_index.toString().padStart(2, "0")} ·{" "}
                        {p.name.toUpperCase()}
                      </span>
                      <span
                        className="hud-label"
                        style={{ letterSpacing: "0.12em" }}
                      >
                        {p.planet_type}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Toggle lore panel */}
        <button
          onClick={() => setLoreOpen((v) => !v)}
          className="absolute z-30 hud-button"
          style={{
            left: loreOpen ? 312 : 8,
            top: "50%",
            transform: "translateY(-50%)",
            padding: "0.6rem 0.4rem",
            fontSize: "0.7rem",
            transition: "left 0.3s ease",
          }}
          aria-label={loreOpen ? "Replier" : "Déplier"}
        >
          {loreOpen ? "◂" : "▸"}
        </button>

        {/* Canvas Vue Système */}
        <div className="relative flex-1">
          <SystemView
            system={system}
            planets={planets}
            onPlanetClick={(p) => setSelected(p)}
          />
        </div>
      </div>

      {/* ===================== Footer hud ===================== */}
      <footer className="relative z-10 px-6 py-3 flex items-center justify-between gap-4">
        <div
          className="hud-label hud-pulse"
          style={{ color: "var(--accent-blue)" }}
        >
          ◉ LINK ACTIVE
        </div>
        <div className="hud-label">
          {planets.length} CORPS ORBITAUX DÉTECTÉS
        </div>
        <div
          className="hud-label"
          style={{ color: "var(--text-faded)" }}
        >
          V1 · SEED_DATA
        </div>
      </footer>

      {/* ===================== Modal de sélection planète (provisoire V2) ===================== */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="hud-panel hud-panel--strong p-6 max-w-md text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hud-label mb-2">PLANETARY_RECORD</div>
            <h3
              className="font-display text-2xl mb-2"
              style={{ color: "var(--accent-cyan)" }}
            >
              {selected.name}
            </h3>
            <p
              className="font-mono text-xs mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              {planetTypeLabel(selected.planet_type)} · Variante{" "}
              {selected.variant} · Orbite {selected.orbit_index}
            </p>
            <p
              className="font-mono text-xs mb-6"
              style={{ color: "var(--text-faded)" }}
            >
              La Vue Planète (zones hexagonales, rapports de bataille) arrive
              en V2.
            </p>
            <button
              className="hud-button"
              onClick={() => setSelected(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function starTypeLabel(s: StellarSystem["star_type"]): string {
  return (
    {
      yellow_dwarf: "Naine jaune",
      red_giant: "Géante rouge",
      white_dwarf: "Naine blanche",
      neutron: "Neutrons",
      binary: "Binaire",
    } as const
  )[s];
}

function planetTypeLabel(t: Planet["planet_type"]): string {
  return (
    {
      rocky: "Monde rocheux",
      gaseous: "Géante gazeuse",
      oceanic: "Monde océanique",
      dead: "Monde mort",
      fortress: "Monde-forteresse",
    } as const
  )[t];
}
