"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Planet, Zone } from "@/types/domain";
import { apiEditCall } from "@/lib/api-edit";

const PLANET_TYPES = ["rocky", "gaseous", "oceanic", "dead", "fortress"];
const VARIANTS = [1, 2, 3, 4];

interface Props {
  planet: Planet;
  zones: Zone[];
  campaignId: string;
  canEdit: boolean;
  onClose: () => void;
}

export default function PlanetInfoModal({ planet, zones, campaignId, canEdit, onClose }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(planet.name);
  const [planetType, setPlanetType] = useState(planet.planet_type);
  const [variant, setVariant] = useState<number>(planet.variant);
  const [hasMoon, setHasMoon] = useState(planet.has_moon);
  const [orbitIndex, setOrbitIndex] = useState(planet.orbit_index);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await apiEditCall("/api/planets", "PUT", campaignId, {
      id: planet.id, name, planet_type: planetType, variant, has_moon: hasMoon, orbit_index: orbitIndex,
    });
    setSaving(false);
    router.refresh();
    setEditing(false);
  };

  const deletePlanet = async () => {
    if (!confirm("Supprimer la planete \"" + planet.name + "\" et toutes ses zones/batailles ?")) return;
    await apiEditCall("/api/planets", "DELETE", campaignId, { id: planet.id });
    router.back();
  };

  return (
    <>
      <div className="fixed inset-0 z-30 transition-opacity duration-300 opacity-100 pointer-events-auto"
        style={{ background: "rgba(0, 0, 0, 0.45)" }} onClick={onClose} aria-hidden />
      <aside className="fixed top-0 left-0 bottom-0 z-40 w-full sm:w-[440px] transition-transform duration-300 ease-out translate-x-0">
        <div className="hud-panel hud-panel--strong h-full flex flex-col"
          style={{ padding: 0, clipPath: "none", border: "none", borderRight: "1px solid var(--border-strong)", background: "rgba(5, 15, 30, 0.95)" }}>
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--border-faded)" }}>
            <div className="flex-1 min-w-0">
              <div className="hud-label mb-1">PLANETARY_BRIEFING</div>
              {editing ? (
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1 bg-black/40 border font-display text-xl focus:outline-none w-full"
                  style={{ borderColor: "var(--border-glow)", color: "var(--accent-cyan)" }} />
              ) : (
                <h2 className="font-display text-2xl tracking-wide" style={{ color: "var(--accent-cyan)" }}>{planet.name}</h2>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {canEdit && !editing && (
                <button onClick={() => setEditing(true)} className="hud-button" style={{ padding: "0.4rem 0.7rem", fontSize: "0.85rem", lineHeight: 1 }}>EDIT</button>
              )}
              <button onClick={onClose} className="hud-button" style={{ padding: "0.3rem 0.55rem", fontSize: "0.7rem" }}>FERMER</button>
            </div>
          </div>

          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="hud-label mb-1">TYPE</div>
                {editing ? (
                  <select value={planetType} onChange={(e) => setPlanetType(e.target.value as Planet["planet_type"])}
                    className="w-full px-3 py-1.5 bg-black/40 border font-mono text-sm focus:outline-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                    {PLANET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <div className="font-mono text-sm uppercase" style={{ color: "var(--accent-cyan)" }}>{planet.planet_type}</div>
                )}
              </div>
              <div>
                <div className="hud-label mb-1">VARIANTE</div>
                {editing ? (
                  <select value={variant} onChange={(e) => setVariant(+e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/40 border font-mono text-sm focus:outline-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                    {VARIANTS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : (
                  <div className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{planet.variant}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="hud-label mb-1">ORBITE</div>
                {editing ? (
                  <input type="number" min={1} max={9} value={orbitIndex} onChange={(e) => setOrbitIndex(+e.target.value)}
                    className="w-full px-3 py-1.5 bg-black/40 border font-mono text-sm focus:outline-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
                ) : (
                  <div className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{planet.orbit_index}</div>
                )}
              </div>
              <div>
                <div className="hud-label mb-1">LUNE</div>
                {editing ? (
                  <label className="flex items-center gap-2 mt-2 font-mono text-xs" style={{ color: "var(--text-primary)", cursor: "crosshair" }}>
                    <input type="checkbox" checked={hasMoon} onChange={(e) => setHasMoon(e.target.checked)} />
                    AVEC LUNE
                  </label>
                ) : (
                  <div className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{planet.has_moon ? "Oui" : "Non"}</div>
                )}
              </div>
            </div>

            <div>
              <div className="hud-label mb-2">ZONES // {zones.length}</div>
              <ul className="space-y-1">
                {zones.map((z) => (
                  <li key={z.id} className="hud-panel--inset px-3 py-1.5 font-mono text-xs">
                    <span style={{ color: "var(--text-primary)" }}>{z.name.toUpperCase()}</span>
                  </li>
                ))}
                {zones.length === 0 && (
                  <li className="hud-panel--inset px-3 py-2 text-center font-mono text-xs" style={{ color: "var(--text-faded)" }}>
                    Aucune zone cartographiee.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {editing && (
            <div className="px-5 py-3 flex justify-between gap-2" style={{ borderTop: "1px solid var(--border-faded)" }}>
              <button onClick={deletePlanet} className="hud-button"
                style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", color: "#ff7070", borderColor: "#8b1a1a" }}>
                SUPPRIMER
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setName(planet.name); setPlanetType(planet.planet_type); setVariant(planet.variant); setHasMoon(planet.has_moon); setOrbitIndex(planet.orbit_index); }}
                  className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
                  ANNULER
                </button>
                <button onClick={save} disabled={saving} className="hud-button"
                  style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.2)" }}>
                  {saving ? "..." : "ENREGISTRER"}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
