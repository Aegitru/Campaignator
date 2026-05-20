"use client";

import { useState } from "react";
import { FactionSymbol, FACTION_SYMBOLS, SYMBOL_LABELS } from "@/lib/faction-symbols";

interface Props {
  onClose: () => void;
  onCreated: (campaignId: string) => void;
}

interface Alliance { name: string; color: string }
interface Faction { name: string; color: string; allianceName?: string; symbol: string }

const DEFAULT_COLORS = ["#0d47a1", "#8b1a1a", "#2d4a1a", "#5a1a8a", "#8a7a1a", "#1a8a7a"];

export default function CreateCampaignWizard({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [allianceMode, setAllianceMode] = useState(false);
  const [alliances, setAlliances] = useState<Alliance[]>([
    { name: "Alliance A", color: "#1a3a8a" },
    { name: "Alliance B", color: "#3a1a1a" },
  ]);
  const [factions, setFactions] = useState<Faction[]>([
    { name: "Faction 1", color: DEFAULT_COLORS[0], symbol: "etoile" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step1Valid = name.trim() && password.length >= 4 && password === password2;
  const step2Valid =
    factions.length > 0 &&
    factions.length <= 6 &&
    factions.every((f) => f.name.trim()) &&
    (!allianceMode ||
      (alliances.length >= 2 &&
        alliances.length <= 3 &&
        alliances.every((a) => a.name.trim()) &&
        factions.every((f) => f.allianceName)));

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, description, password,
          allianceMode,
          alliances: allianceMode ? alliances : undefined,
          factions,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      onCreated(data.id);
    } catch {
      setError("Erreur reseau");
    } finally {
      setSubmitting(false);
    }
  };

  const addFaction = () => {
    if (factions.length >= 6) return;
    setFactions([...factions, { name: `Faction ${factions.length + 1}`, color: DEFAULT_COLORS[factions.length] ?? "#888", symbol: FACTION_SYMBOLS[factions.length % FACTION_SYMBOLS.length] }]);
  };
  const removeFaction = (i: number) => setFactions(factions.filter((_, j) => j !== i));
  const updateFaction = (i: number, patch: Partial<Faction>) =>
    setFactions(factions.map((f, j) => (j === i ? { ...f, ...patch } : f)));

  const addAlliance = () => {
    if (alliances.length >= 3) return;
    setAlliances([...alliances, { name: `Alliance ${String.fromCharCode(65 + alliances.length)}`, color: "#444" }]);
  };
  const removeAlliance = (i: number) => {
    const removed = alliances[i].name;
    setAlliances(alliances.filter((_, j) => j !== i));
    setFactions(factions.map((f) => (f.allianceName === removed ? { ...f, allianceName: undefined } : f)));
  };
  const updateAlliance = (i: number, patch: Partial<Alliance>) => {
    const oldName = alliances[i].name;
    setAlliances(alliances.map((a, j) => (j === i ? { ...a, ...patch } : a)));
    if (patch.name) {
      setFactions(factions.map((f) => (f.allianceName === oldName ? { ...f, allianceName: patch.name } : f)));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="hud-panel hud-panel--strong max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border-faded)" }}>
          <div className="hud-label mb-1">NEW_CAMPAIGN_WIZARD - STEP {step}/3</div>
          <h2 className="font-display text-xl tracking-wide" style={{ color: "var(--accent-cyan)" }}>
            {step === 1 ? "Informations generales" : step === 2 ? "Factions & Alliances" : "Confirmation"}
          </h2>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="hud-label mb-1">NOM DE LA CAMPAGNE *</div>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}
                  placeholder="La Croisade du..."
                  autoFocus
                />
              </div>
              <div>
                <div className="hud-label mb-1">DESCRIPTION COURTE</div>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none resize-none"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}
                  placeholder="(optionnel)"
                />
              </div>
              <div>
                <div className="hud-label mb-1">MOT DE PASSE * (min 4 caracteres)</div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none mb-2"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}
                />
                <div className="hud-label mb-1">CONFIRMATION *</div>
                <input
                  type="password" value={password2} onChange={(e) => setPassword2(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                  style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}
                />
                {password && password2 && password !== password2 && (
                  <div className="hud-label mt-1" style={{ color: "#ff7070" }}>Les mots de passe ne correspondent pas</div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAllianceMode(!allianceMode)}
                  className="hud-button"
                  style={{ padding: "0.35rem 0.7rem", fontSize: "0.65rem",
                    background: allianceMode ? "rgba(127,223,255,0.18)" : "rgba(0,170,255,0.04)" }}
                >
                  {allianceMode ? "● MODE ALLIANCE" : "○ MODE ALLIANCE"}
                </button>
                <span className="hud-label">{allianceMode ? "ON" : "OFF"} - definitif</span>
              </div>

              {allianceMode && (
                <div>
                  <div className="hud-label mb-2 flex justify-between">
                    <span>ALLIANCES ({alliances.length}/3)</span>
                    {alliances.length < 3 && (
                      <button type="button" onClick={addAlliance} className="hud-label hover:text-white" style={{ cursor: "crosshair" }}>+ AJOUTER</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {alliances.map((a, i) => (
                      <div key={i} className="hud-panel--inset px-3 py-2 flex gap-2 items-center">
                        <input type="color" value={a.color} onChange={(e) => updateAlliance(i, { color: e.target.value })}
                          className="w-8 h-8 bg-transparent border-0 cursor-crosshair" />
                        <input type="text" value={a.name} onChange={(e) => updateAlliance(i, { name: e.target.value })}
                          className="flex-1 px-2 py-1 bg-black/40 border font-mono text-xs focus:outline-none"
                          style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }} />
                        {alliances.length > 2 && (
                          <button type="button" onClick={() => removeAlliance(i)} className="hud-label" style={{ cursor: "crosshair", color: "#ff7070" }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="hud-label mb-2 flex justify-between">
                  <span>FACTIONS ({factions.length}/6)</span>
                  {factions.length < 6 && (
                    <button type="button" onClick={addFaction} className="hud-label hover:text-white" style={{ cursor: "crosshair" }}>+ AJOUTER</button>
                  )}
                </div>
                <div className="space-y-2">
                  {factions.map((f, i) => (
                    <div key={i} className="hud-panel--inset px-3 py-2 flex gap-2 items-center flex-wrap">
                      <input type="color" value={f.color} onChange={(e) => updateFaction(i, { color: e.target.value })}
                        className="w-8 h-8 bg-transparent border-0 cursor-crosshair" />
                      <select value={f.symbol} onChange={(e) => updateFaction(i, { symbol: e.target.value })}
                        className="px-2 py-1 bg-black/40 border font-mono text-xs focus:outline-none"
                        style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
                        {FACTION_SYMBOLS.map((s) => <option key={s} value={s}>{SYMBOL_LABELS[s]}</option>)}
                      </select>
                      <FactionSymbol symbol={f.symbol} size={20} />
                      <input type="text" value={f.name} onChange={(e) => updateFaction(i, { name: e.target.value })}
                        className="flex-1 min-w-[120px] px-2 py-1 bg-black/40 border font-mono text-xs focus:outline-none"
                        style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }} />
                      {allianceMode && (
                        <select value={f.allianceName ?? ""} onChange={(e) => updateFaction(i, { allianceName: e.target.value || undefined })}
                          className="px-2 py-1 bg-black/40 border font-mono text-xs focus:outline-none"
                          style={{ borderColor: "var(--border-faded)", color: "var(--text-primary)" }}>
                          <option value="">- alliance -</option>
                          {alliances.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
                        </select>
                      )}
                      {factions.length > 1 && (
                        <button type="button" onClick={() => removeFaction(i)} className="hud-label" style={{ cursor: "crosshair", color: "#ff7070" }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 font-mono text-sm" style={{ color: "var(--text-primary)" }}>
              <div className="hud-panel--inset px-3 py-2">
                <div className="hud-label">NOM</div>
                <div>{name}</div>
              </div>
              {description && (
                <div className="hud-panel--inset px-3 py-2">
                  <div className="hud-label">DESCRIPTION</div>
                  <div>{description}</div>
                </div>
              )}
              <div className="hud-panel--inset px-3 py-2">
                <div className="hud-label">MODE</div>
                <div>{allianceMode ? "Alliance ON" : "Factions individuelles"}</div>
              </div>
              {allianceMode && (
                <div className="hud-panel--inset px-3 py-2">
                  <div className="hud-label">ALLIANCES</div>
                  {alliances.map((a) => (
                    <div key={a.name} className="flex items-center gap-2 mt-1">
                      <span className="inline-block w-3 h-3" style={{ background: a.color }} />
                      <span>{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="hud-panel--inset px-3 py-2">
                <div className="hud-label">FACTIONS ({factions.length})</div>
                {factions.map((f) => (
                  <div key={f.name} className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-3 h-3" style={{ background: f.color }} />
                    <FactionSymbol symbol={f.symbol} size={16} />
                    <span>{f.name}</span>
                    {f.allianceName && <span style={{ color: "var(--text-secondary)" }}>({f.allianceName})</span>}
                  </div>
                ))}
              </div>
              {error && (
                <div className="px-2 py-1" style={{ color: "#ff7070", background: "rgba(139,26,26,0.18)", border: "1px solid #8b1a1a" }}>
                  ⚠ {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex justify-between gap-2" style={{ borderTop: "1px solid var(--border-faded)" }}>
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep((step - 1) as 1 | 2)}
            className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}
          >
            {step === 1 ? "ANNULER" : "◂ PRECEDENT"}
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 ? !step1Valid : !step2Valid}
              onClick={() => setStep((step + 1) as 2 | 3)}
              className="hud-button"
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}
            >
              SUIVANT ▸
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="hud-button"
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.2)" }}
            >
              {submitting ? "..." : "LANCER LA CAMPAGNE ▸"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
