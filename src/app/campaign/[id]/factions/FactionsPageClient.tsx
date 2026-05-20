"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampaignProvider } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import { apiEditCall } from "@/lib/api-edit";
import { FactionSymbol, FACTION_SYMBOLS, SYMBOL_LABELS } from "@/lib/faction-symbols";
import GlobalOverlays from "@/components/overlays/GlobalOverlays";
import type { CampaignBundle } from "@/lib/supabase-queries";

interface Unit { id: string; faction_id: string; name: string; description: string; evolution_notes: string }

export default function FactionsPageClient({ bundle, units }: { bundle: CampaignBundle; units: Unit[] }) {
  return (
    <CampaignProvider data={{
      campaign: bundle.campaign, alliances: bundle.alliances, factions: bundle.factions,
      systems: bundle.systems, planets: bundle.planets, zones: bundle.zones, battles: bundle.battles,
    }}>
      <FactionsInner bundle={bundle} units={units} />
      <GlobalOverlays />
    </CampaignProvider>
  );
}

function FactionsInner({ bundle, units }: { bundle: CampaignBundle; units: Unit[] }) {
  const router = useRouter();
  const { isCampaignUnlocked } = useSession();
  const editing = isCampaignUnlocked(bundle.campaign.id);
  const [selectedId, setSelectedId] = useState<string>(bundle.factions[0]?.id ?? "");
  const faction = bundle.factions.find((f) => f.id === selectedId);
  const factionUnits = units.filter((u) => u.faction_id === selectedId);

  const [editingFaction, setEditingFaction] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [creatingUnit, setCreatingUnit] = useState(false);

  return (
    <div className="relative w-full" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 overflow-y-auto">
        <div className="px-6 pt-6 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/campaign/${bundle.campaign.id}`} className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
              ◂ GALAXIE
            </Link>
            <div className="flex-1 text-center">
              <div className="hud-label">{bundle.campaign.name}</div>
              <div className="hud-title text-xl mt-1" style={{ letterSpacing: "0.3em" }}>GESTION DES FACTIONS</div>
            </div>
            <div className="w-[120px]" />
          </div>

          <div className="flex flex-col md:flex-row gap-4 max-w-5xl mx-auto">
            <aside className="w-full md:w-[280px] flex-shrink-0">
              <div className="hud-panel hud-panel--strong p-3">
                <div className="hud-label mb-2">FACTIONS // {bundle.factions.length}</div>
                <ul className="space-y-1.5">
                  {bundle.factions.map((f) => (
                    <li key={f.id}>
                      <button onClick={() => setSelectedId(f.id)}
                        className={"w-full text-left px-2 py-2 flex items-center gap-2 font-mono text-xs " + (selectedId === f.id ? "bg-[rgba(0,170,255,0.12)]" : "hover:bg-[rgba(0,170,255,0.05)]")}
                        style={{ cursor: "crosshair", border: "1px solid var(--border-faded)" }}>
                        <span className="inline-block w-2.5 h-2.5 flex-shrink-0" style={{ background: f.color_hex, boxShadow: "0 0 6px " + f.color_hex }} />
                        <FactionSymbol symbol={f.symbol_key} size={16} />
                        <span style={{ color: "var(--text-primary)" }}>{f.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="flex-1">
              {faction ? (
                <div className="hud-panel hud-panel--strong p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FactionSymbol symbol={faction.symbol_key} size={28} />
                      <h2 className="font-display text-2xl tracking-wide" style={{ color: faction.color_hex, filter: "brightness(1.5)" }}>
                        {faction.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hud-label">{factionUnits.length} UNITES</span>
                      {editing && (
                        <button onClick={() => setEditingFaction(true)} className="hud-button" style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem", lineHeight: 1 }}>EDIT</button>
                      )}
                    </div>
                  </div>

                  <div className="hud-label mb-1">LORE / HISTOIRE</div>
                  <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: "var(--text-primary)" }}>
                    {faction.lore_text || "Aucun lore enregistre."}
                  </p>

                  <div className="hud-divider my-4" />

                  <div className="hud-label mb-2 flex justify-between">
                    <span>UNITES</span>
                    {editing && (
                      <button onClick={() => setCreatingUnit(true)} className="hover:text-white" style={{ cursor: "crosshair" }}>+ AJOUTER</button>
                    )}
                  </div>

                  {factionUnits.length === 0 ? (
                    <div className="hud-panel--inset px-4 py-5 text-center font-mono text-xs" style={{ color: "var(--text-faded)" }}>
                      Aucune unite enregistree.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {factionUnits.map((u) => (
                        <li key={u.id} className="hud-panel--inset px-3 py-2 flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-display text-sm" style={{ color: "var(--accent-cyan)" }}>{u.name}</div>
                            {u.description && <p className="font-mono text-xs mt-1" style={{ color: "var(--text-primary)" }}>{u.description}</p>}
                            {u.evolution_notes && <p className="font-mono text-[11px] mt-1 italic" style={{ color: "var(--text-secondary)" }}>{u.evolution_notes}</p>}
                          </div>
                          {editing && (
                            <button onClick={() => setEditingUnit(u)} className="hud-button flex-shrink-0" style={{ padding: "0.3rem 0.5rem", fontSize: "0.7rem" }}>EDIT</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="hud-panel--inset px-6 py-10 text-center font-mono text-sm" style={{ color: "var(--text-faded)" }}>
                  Selectionne une faction.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingFaction && faction && (
        <FactionEditor faction={faction} campaignId={bundle.campaign.id}
          onClose={() => setEditingFaction(false)} onSaved={() => router.refresh()} />
      )}
      {creatingUnit && faction && (
        <UnitEditor campaignId={bundle.campaign.id} factionId={faction.id}
          onClose={() => setCreatingUnit(false)} onSaved={() => router.refresh()} />
      )}
      {editingUnit && (
        <UnitEditor campaignId={bundle.campaign.id} factionId={editingUnit.faction_id} existing={editingUnit}
          onClose={() => setEditingUnit(null)} onSaved={() => router.refresh()} />
      )}
    </div>
  );
}

function FactionEditor({ faction, campaignId, onClose, onSaved }: {
  faction: { id: string; name: string; color_hex: string; symbol_key: string; lore_text: string };
  campaignId: string; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(faction.name);
  const [color, setColor] = useState(faction.color_hex);
  const [symbol, setSymbol] = useState(faction.symbol_key || "etoile");
  const [lore, setLore] = useState(faction.lore_text);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true); setError(null);
    const res = await apiEditCall("/api/factions", "PUT", campaignId, {
      id: faction.id, name, color_hex: color, symbol_key: symbol, lore_text: lore,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? "Erreur"); return; }
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="hud-panel hud-panel--strong max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="hud-label mb-1">ÉDITION FACTION</div>
        <h2 className="font-display text-xl mb-4" style={{ color: "var(--accent-cyan)" }}>Modifier la faction</h2>

        <div className="space-y-3 mb-4">
          <div>
            <div className="hud-label mb-1">NOM *</div>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="hud-label mb-1">COULEUR</div>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 bg-transparent border" style={{ borderColor: "var(--border-glow)" }} />
            </div>
            <div className="flex-1">
              <div className="hud-label mb-1">SYMBOLE</div>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-2 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
                {FACTION_SYMBOLS.map((s) => <option key={s} value={s}>{SYMBOL_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="flex flex-col items-center" style={{ marginTop: "1.4rem" }}>
              <FactionSymbol symbol={symbol} size={32} />
            </div>
          </div>
          <div>
            <div className="hud-label mb-1">LORE</div>
            <textarea value={lore} onChange={(e) => setLore(e.target.value)} rows={4}
              className="w-full px-3 py-2 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
          </div>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2" style={{ color: "#ff7070", background: "rgba(139,26,26,0.18)", border: "1px solid #8b1a1a" }}>
            ⚠ {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>ANNULER</button>
          <button onClick={save} disabled={saving} className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.2)" }}>
            {saving ? "..." : "ENREGISTRER"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitEditor({ campaignId, factionId, existing, onClose, onSaved }: {
  campaignId: string; factionId: string;
  existing?: Unit; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [evolution, setEvolution] = useState(existing?.evolution_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) { setError("Nom requis"); return; }
    setSaving(true); setError(null);
    const res = existing
      ? await apiEditCall("/api/faction-units", "PUT", campaignId, { id: existing.id, name, description, evolution_notes: evolution })
      : await apiEditCall("/api/faction-units", "POST", campaignId, { factionId, name, description, evolution_notes: evolution });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? "Erreur"); return; }
    onSaved(); onClose();
  };

  const remove = async () => {
    if (!existing) return;
    if (!confirm("Supprimer l'unite \"" + existing.name + "\" ?")) return;
    setSaving(true);
    await apiEditCall("/api/faction-units", "DELETE", campaignId, { id: existing.id });
    setSaving(false);
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="hud-panel hud-panel--strong max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="hud-label mb-1">{existing ? "ÉDITION UNITÉ" : "NOUVELLE UNITÉ"}</div>
        <h2 className="font-display text-xl mb-4" style={{ color: "var(--accent-cyan)" }}>
          {existing ? "Modifier l'unité" : "Ajouter une unité"}
        </h2>

        <div className="space-y-3 mb-4">
          <div>
            <div className="hud-label mb-1">NOM *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus
              className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <div className="hud-label mb-1">DESCRIPTION</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <div className="hud-label mb-1">ÉVOLUTION / NOTES</div>
            <textarea value={evolution} onChange={(e) => setEvolution(e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-secondary)" }} />
          </div>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2" style={{ color: "#ff7070", background: "rgba(139,26,26,0.18)", border: "1px solid #8b1a1a" }}>
            ⚠ {error}
          </div>
        )}

        <div className="flex justify-between gap-2">
          <div>
            {existing && (
              <button onClick={remove} className="hud-button"
                style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", color: "#ff7070", borderColor: "#8b1a1a" }}>
                SUPPRIMER
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>ANNULER</button>
            <button onClick={save} disabled={saving} className="hud-button"
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.2)" }}>
              {saving ? "..." : (existing ? "ENREGISTRER" : "CRÉER")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
