"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiEditCall } from "@/lib/api-edit";

type Mode =
  | { kind: "system"; campaignId: string; posX?: number; posY?: number }
  | { kind: "planet"; campaignId: string; systemId: string }
  | { kind: "zone"; campaignId: string; planetId: string };

interface Props { mode: Mode; onClose: () => void }

const STAR_TYPES = ["yellow_dwarf", "red_giant", "white_dwarf", "neutron", "binary"];
const PLANET_TYPES = ["rocky", "gaseous", "oceanic", "dead", "fortress"];
const VARIANTS = [1, 2, 3, 4];

export default function QuickCreateModal({ mode, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [starType, setStarType] = useState("yellow_dwarf");
  const [planetType, setPlanetType] = useState("rocky");
  const [variant, setVariant] = useState(1);
  const [orbitIndex, setOrbitIndex] = useState(1);
  const [hasMoon, setHasMoon] = useState(false);
  const angle = Math.floor(Math.random() * 360);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError("Nom requis"); return; }
    setSubmitting(true); setError(null);
    let res: any;
    if (mode.kind === "system") {
      res = await apiEditCall("/api/systems", "POST", mode.campaignId, {
        name: name.trim(), star_type: starType, galaxy_pos_x: mode.posX ?? 50, galaxy_pos_y: mode.posY ?? 50, lore_text: "",
      });
    } else if (mode.kind === "planet") {
      res = await apiEditCall("/api/planets", "POST", mode.campaignId, {
        systemId: mode.systemId, name: name.trim(), planet_type: planetType, variant,
        orbit_index: orbitIndex, orbit_speed: Math.max(0.2, 1.2 - orbitIndex * 0.18), has_moon: hasMoon,
      });
    } else {
      res = await apiEditCall("/api/zones", "POST", mode.campaignId, {
        planetId: mode.planetId, name: name.trim(), angle_position: angle, controlling_faction_id: null,
      });
    }
    setSubmitting(false);
    if (!res.ok) { setError(res.error ?? "Erreur"); return; }
    router.refresh();
    onClose();
  };

  const title = mode.kind === "system" ? "Nouveau systeme stellaire"
    : mode.kind === "planet" ? "Nouvelle planete" : "Nouvelle zone";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="hud-panel hud-panel--strong max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="hud-label mb-1">QUICK_CREATE - {mode.kind.toUpperCase()}</div>
        <h2 className="font-display text-xl mb-4" style={{ color: "var(--accent-cyan)" }}>{title}</h2>

        <div className="space-y-3 mb-4">
          <div>
            <div className="hud-label mb-1">NOM *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
          </div>

          {mode.kind === "system" && (
            <div>
              <div className="hud-label mb-1">TYPE D'ETOILE</div>
              <select value={starType} onChange={(e) => setStarType(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                {STAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {mode.kind === "planet" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="hud-label mb-1">TYPE</div>
                  <select value={planetType} onChange={(e) => setPlanetType(e.target.value)}
                    className="w-full px-2 py-2 bg-black/40 border font-mono text-xs focus:outline-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                    {PLANET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div className="hud-label mb-1">VARIANTE</div>
                  <select value={variant} onChange={(e) => setVariant(+e.target.value)}
                    className="w-full px-2 py-2 bg-black/40 border font-mono text-xs focus:outline-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                    {VARIANTS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="hud-label mb-1">ORBITE (1-9)</div>
                  <input type="number" min={1} max={9} value={orbitIndex} onChange={(e) => setOrbitIndex(+e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
                </div>
                <label className="flex items-center gap-2 mt-6 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                  <input type="checkbox" checked={hasMoon} onChange={(e) => setHasMoon(e.target.checked)} />
                  AVEC LUNE
                </label>
              </div>
            </>
          )}

        </div>

        {error && (
          <div className="mb-3 px-3 py-2" style={{ color: "#ff7070", background: "rgba(139,26,26,0.18)", border: "1px solid #8b1a1a" }}>
            ⚠ {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
            ANNULER
          </button>
          <button onClick={submit} disabled={submitting} className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.2)" }}>
            {submitting ? "..." : "CREER ▸"}
          </button>
        </div>
      </div>
    </div>
  );
}
