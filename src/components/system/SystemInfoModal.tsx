"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Planet, StellarSystem } from "@/types/domain";
import { apiEditCall } from "@/lib/api-edit";

const STAR_TYPES = ["yellow_dwarf", "red_giant", "white_dwarf", "neutron", "binary"];

interface Props {
  system: StellarSystem;
  planets: Planet[];
  campaignId: string;
  canEdit: boolean;
  onClose: () => void;
}

export default function SystemInfoModal({ system, planets, campaignId, canEdit, onClose }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(system.name);
  const [lore, setLore] = useState(system.lore_text);
  const [starType, setStarType] = useState(system.star_type);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await apiEditCall("/api/systems", "PUT", campaignId, {
      id: system.id, name, lore_text: lore, star_type: starType,
    });
    setSaving(false);
    router.refresh();
    setEditing(false);
  };

  const deleteSystem = async () => {
    if (!confirm("Supprimer le systeme \"" + system.name + "\" et TOUT son contenu ?")) return;
    await apiEditCall("/api/systems", "DELETE", campaignId, { id: system.id });
    router.push("/campaign/" + campaignId);
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
              <div className="hud-label mb-1">SYSTEM_BRIEFING</div>
              {editing ? (
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1 bg-black/40 border font-display text-xl focus:outline-none w-full"
                  style={{ borderColor: "var(--border-glow)", color: "var(--accent-cyan)" }} />
              ) : (
                <h2 className="font-display text-2xl tracking-wide" style={{ color: "var(--accent-cyan)" }}>{system.name}</h2>
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
            <div>
              <div className="hud-label mb-1">TYPE D'ETOILE</div>
              {editing ? (
                <select value={starType} onChange={(e) => setStarType(e.target.value as StellarSystem["star_type"])}
                  className="w-full px-3 py-1.5 bg-black/40 border font-mono text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                  {STAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <div className="font-mono text-sm uppercase tracking-widest" style={{ color: "var(--accent-cyan)" }}>
                  {system.star_type}
                </div>
              )}
            </div>

            <div>
              <div className="hud-label mb-1">LORE</div>
              {editing ? (
                <textarea value={lore} onChange={(e) => setLore(e.target.value)} rows={5}
                  className="w-full px-3 py-2 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
              ) : (
                <p className="font-mono text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {system.lore_text || "Aucune entree d'archive."}
                </p>
              )}
            </div>

            <div>
              <div className="hud-label mb-2">PLANETES // {planets.length}</div>
              <ul className="space-y-1">
                {planets.slice().sort((a, b) => a.orbit_index - b.orbit_index).map((p) => (
                  <li key={p.id} className="hud-panel--inset px-3 py-1.5 font-mono text-xs flex justify-between items-center">
                    <span style={{ color: "var(--text-primary)" }}>
                      {p.orbit_index.toString().padStart(2, "0")} - {p.name.toUpperCase()}
                    </span>
                    <span className="hud-label" style={{ letterSpacing: "0.12em" }}>{p.planet_type}</span>
                  </li>
                ))}
                {planets.length === 0 && (
                  <li className="hud-panel--inset px-3 py-2 text-center font-mono text-xs" style={{ color: "var(--text-faded)" }}>
                    Aucune planete cartographiee.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {editing && (
            <div className="px-5 py-3 flex justify-between gap-2" style={{ borderTop: "1px solid var(--border-faded)" }}>
              <button onClick={deleteSystem} className="hud-button"
                style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", color: "#ff7070", borderColor: "#8b1a1a" }}>
                SUPPRIMER
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setName(system.name); setLore(system.lore_text); setStarType(system.star_type); }}
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
