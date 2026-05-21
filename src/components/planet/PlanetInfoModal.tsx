"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Planet, Zone } from "@/types/domain";
import { useCampaign } from "@/lib/campaign-context";
import { apiEditCall } from "@/lib/api-edit";
import PortalToBody from "@/components/overlays/PortalToBody";
import QuickCreateModal from "@/components/edit/QuickCreateModal";

const PLANET_TYPES = ["rocky", "gaseous", "oceanic", "dead", "other"];
const VARIANTS = [1, 2, 3, 4];

interface Props {
  planet: Planet;
  zones: Zone[];
  campaignId: string;
  canEdit: boolean;
  onClose: () => void;
}

export default function PlanetInfoModal(props: Props) {
  return (
    <PortalToBody>
      <Inner {...props} />
    </PortalToBody>
  );
}

function Inner({ planet, zones, campaignId, canEdit, onClose }: Props) {
  const router = useRouter();
  const { planets } = useCampaign();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(planet.name);
  const [planetType, setPlanetType] = useState(planet.planet_type);
  const [variant, setVariant] = useState<number>(planet.variant);
  const [orbitIndex, setOrbitIndex] = useState(planet.orbit_index);
  const [saving, setSaving] = useState(false);
  const [creatingMoon, setCreatingMoon] = useState(false);

  // Lunes = planètes filles
  const moons = planets.filter((p) => p.parent_planet_id === planet.id);
  const isMoon = !!planet.parent_planet_id;
  const parentPlanet = isMoon ? planets.find((p) => p.id === planet.parent_planet_id) : null;

  const save = async () => {
    setSaving(true);
    await apiEditCall("/api/planets", "PUT", campaignId, {
      id: planet.id, name, planet_type: planetType, variant, orbit_index: orbitIndex,
    });
    setSaving(false);
    router.refresh();
    setEditing(false);
  };

  const deletePlanet = async () => {
    const label = isMoon ? "lune" : "planete";
    if (!confirm("Supprimer la " + label + " \"" + planet.name + "\" et tout son contenu ?")) return;
    await apiEditCall("/api/planets", "DELETE", campaignId, { id: planet.id });
    if (isMoon && parentPlanet) router.push("/planet/" + parentPlanet.id);
    else router.back();
  };

  return (
    <>
      <div className="fixed inset-0 z-30" style={{ background: "rgba(0, 0, 0, 0.45)" }} onClick={onClose} aria-hidden />
      <aside className="fixed top-0 left-0 bottom-0 z-40 w-full sm:w-[440px]">
        <div className="hud-panel hud-panel--strong h-full flex flex-col"
          style={{ padding: 0, clipPath: "none", border: "none", borderRight: "1px solid var(--border-strong)", background: "rgba(5, 15, 30, 0.95)" }}>
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid var(--border-faded)" }}>
            <div className="flex-1 min-w-0">
              <div className="hud-label mb-1">{isMoon ? "LUNAR_BRIEFING" : "PLANETARY_BRIEFING"}</div>
              {editing ? (
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1 bg-black/40 border font-display text-xl focus:outline-none w-full"
                  style={{ borderColor: "var(--border-glow)", color: "var(--accent-cyan)" }} />
              ) : (
                <h2 className="font-display text-2xl tracking-wide" style={{ color: "var(--accent-cyan)" }}>{planet.name}</h2>
              )}
              {isMoon && parentPlanet && (
                <Link href={"/planet/" + parentPlanet.id} className="font-mono text-[11px] mt-1 inline-block hover:text-white" style={{ color: "var(--text-secondary)" }}>
                  ◂ Retour à {parentPlanet.name}
                </Link>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {canEdit && !editing && (
                <button onClick={() => setEditing(true)} className="hud-button" style={{ padding: "0.4rem 0.7rem", fontSize: "0.85rem" }}>EDIT</button>
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

            <div>
              <div className="hud-label mb-1">{isMoon ? "ORBITE LUNAIRE" : "ORBITE"}</div>
              {editing ? (
                <input type="number" min={1} max={isMoon ? 3 : 9} value={orbitIndex} onChange={(e) => setOrbitIndex(+e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border font-mono text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
              ) : (
                <div className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>{planet.orbit_index}</div>
              )}
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
                    Aucune zone.
                  </li>
                )}
              </ul>
            </div>

            {!isMoon && (
              <div>
                <div className="hud-label mb-2 flex justify-between">
                  <span>LUNES // {moons.length}/3</span>
                  {canEdit && moons.length < 3 && (
                    <button onClick={() => setCreatingMoon(true)} className="hover:text-white" style={{ cursor: "crosshair" }}>+ AJOUTER</button>
                  )}
                </div>
                <ul className="space-y-1">
                  {moons.map((m) => (
                    <li key={m.id}>
                      <Link href={"/planet/" + m.id} className="hud-panel--inset px-3 py-1.5 font-mono text-xs flex justify-between items-center hover:bg-[rgba(0,170,255,0.05)]" style={{ cursor: "crosshair" }}>
                        <span style={{ color: "var(--text-primary)" }}>{m.name.toUpperCase()}</span>
                        <span className="hud-label" style={{ letterSpacing: "0.12em" }}>{m.planet_type}</span>
                      </Link>
                    </li>
                  ))}
                  {moons.length === 0 && (
                    <li className="hud-panel--inset px-3 py-2 text-center font-mono text-xs" style={{ color: "var(--text-faded)" }}>
                      Aucune lune.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {editing && (
            <div className="px-5 py-3 flex justify-between gap-2" style={{ borderTop: "1px solid var(--border-faded)" }}>
              <button onClick={deletePlanet} className="hud-button"
                style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", color: "#ff7070", borderColor: "#8b1a1a" }}>
                SUPPRIMER
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setName(planet.name); setPlanetType(planet.planet_type); setVariant(planet.variant); setOrbitIndex(planet.orbit_index); }}
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

      {creatingMoon && (
        <QuickCreateModal
          mode={{ kind: "moon", campaignId, parentPlanetId: planet.id, systemId: planet.system_id }}
          onClose={() => setCreatingMoon(false)}
        />
      )}
    </>
  );
}
