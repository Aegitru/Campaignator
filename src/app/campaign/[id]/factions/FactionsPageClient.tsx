"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CampaignProvider } from "@/lib/campaign-context";
import { useSession } from "@/lib/session-context";
import { apiEditCall } from "@/lib/api-edit";
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

  const [lore, setLore] = useState(faction?.lore_text ?? "");
  const [savingLore, setSavingLore] = useState(false);

  const onSelectFaction = (id: string) => {
    setSelectedId(id);
    setLore(bundle.factions.find((f) => f.id === id)?.lore_text ?? "");
  };

  const saveLore = async () => {
    if (!faction) return;
    setSavingLore(true);
    await apiEditCall("/api/factions", "PUT", bundle.campaign.id, { id: faction.id, lore_text: lore });
    setSavingLore(false);
    router.refresh();
  };

  const addUnit = async () => {
    if (!faction) return;
    const name = prompt("Nom de la nouvelle unite ?");
    if (!name?.trim()) return;
    await apiEditCall("/api/faction-units", "POST", bundle.campaign.id, { factionId: faction.id, name: name.trim() });
    router.refresh();
  };

  const updateUnit = async (u: Unit, patch: Partial<Unit>) => {
    await apiEditCall("/api/faction-units", "PUT", bundle.campaign.id, { id: u.id, ...patch });
    router.refresh();
  };

  const deleteUnit = async (u: Unit) => {
    if (!confirm(`Supprimer l'unite "${u.name}" ?`)) return;
    await apiEditCall("/api/faction-units", "DELETE", bundle.campaign.id, { id: u.id });
    router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col relative min-h-[100dvh]">
      <header className="relative z-20 px-6 py-4 flex items-center justify-between gap-4">
        <Link href={`/campaign/${bundle.campaign.id}`} className="hud-button text-xs" style={{ padding: "0.4rem 0.9rem" }}>
          ◂ Retour Galaxie
        </Link>
        <div className="text-center flex-1">
          <div className="hud-label">{bundle.campaign.name}</div>
          <div className="hud-title text-xl mt-1" style={{ letterSpacing: "0.3em" }}>GESTION DES FACTIONS</div>
        </div>
        <div className="w-[120px]" />
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-4 px-6 pb-6 overflow-hidden">
        {/* Liste factions */}
        <aside className="w-full md:w-[260px] flex-shrink-0">
          <div className="hud-panel hud-panel--strong p-3 overflow-y-auto max-h-[80vh]">
            <div className="hud-label mb-2">FACTIONS // {bundle.factions.length}</div>
            <ul className="space-y-1.5">
              {bundle.factions.map((f) => (
                <li key={f.id}>
                  <button onClick={() => onSelectFaction(f.id)}
                    className={`w-full text-left px-2 py-2 flex items-center gap-2 font-mono text-xs ${selectedId === f.id ? "bg-[rgba(0,170,255,0.12)]" : "hover:bg-[rgba(0,170,255,0.05)]"}`}
                    style={{ cursor: "crosshair", border: "1px solid var(--border-faded)" }}>
                    <span className="inline-block w-2.5 h-2.5" style={{ background: f.color_hex, boxShadow: `0 0 6px ${f.color_hex}` }} />
                    <span style={{ color: "var(--text-primary)" }}>{f.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto">
          {faction ? (
            <div className="hud-panel hud-panel--strong p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-2xl tracking-wide" style={{ color: faction.color_hex, filter: "brightness(1.5)" }}>
                  {faction.name}
                </h2>
                <span className="hud-label">{factionUnits.length} UNITES</span>
              </div>

              <div className="hud-label mb-1">LORE / HISTOIRE</div>
              {editing ? (
                <>
                  <textarea value={lore} onChange={(e) => setLore(e.target.value)} rows={6}
                    className="w-full px-3 py-2 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
                    style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
                  <div className="flex justify-end mt-2">
                    <button onClick={saveLore} disabled={savingLore} className="hud-button"
                      style={{ padding: "0.3rem 0.7rem", fontSize: "0.65rem" }}>
                      {savingLore ? "..." : "ENREGISTRER LORE"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="font-mono text-xs leading-relaxed mb-4" style={{ color: "var(--text-primary)" }}>
                  {faction.lore_text || "Aucun lore enregistre."}
                </p>
              )}

              <div className="hud-divider my-4" />

              <div className="hud-label mb-2 flex justify-between">
                <span>UNITES</span>
                {editing && (
                  <button onClick={addUnit} className="hover:text-white" style={{ cursor: "crosshair" }}>+ AJOUTER</button>
                )}
              </div>

              {factionUnits.length === 0 ? (
                <div className="hud-panel--inset px-4 py-5 text-center font-mono text-xs" style={{ color: "var(--text-faded)" }}>
                  Aucune unite enregistree.
                </div>
              ) : (
                <ul className="space-y-2">
                  {factionUnits.map((u) => (
                    <li key={u.id} className="hud-panel--inset px-3 py-2">
                      {editing ? (
                        <div className="space-y-2">
                          <input value={u.name} onChange={(e) => updateUnit(u, { name: e.target.value })}
                            className="w-full px-2 py-1 bg-black/40 border font-mono text-sm focus:outline-none"
                            style={{ borderColor: "var(--border-faded)", color: "var(--accent-cyan)" }} />
                          <textarea value={u.description} onChange={(e) => updateUnit(u, { description: e.target.value })}
                            rows={2} placeholder="Description..."
                            className="w-full px-2 py-1 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
                            style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }} />
                          <textarea value={u.evolution_notes} onChange={(e) => updateUnit(u, { evolution_notes: e.target.value })}
                            rows={2} placeholder="Evolution / notes..."
                            className="w-full px-2 py-1 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
                            style={{ borderColor: "var(--border-faded)", color: "var(--text-secondary)" }} />
                          <div className="flex justify-end">
                            <button onClick={() => deleteUnit(u)} className="font-mono text-[10px]"
                              style={{ color: "#ff7070", cursor: "crosshair", letterSpacing: "0.1em" }}>
                              SUPPRIMER
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-display text-sm" style={{ color: "var(--accent-cyan)" }}>{u.name}</div>
                          {u.description && <p className="font-mono text-xs mt-1" style={{ color: "var(--text-primary)" }}>{u.description}</p>}
                          {u.evolution_notes && <p className="font-mono text-[11px] mt-1 italic" style={{ color: "var(--text-secondary)" }}>{u.evolution_notes}</p>}
                        </>
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
  );
}
