"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCampaign } from "@/lib/campaign-context";
import { apiEditCall } from "@/lib/api-edit";
import { useRouter } from "next/navigation";

interface Props {
  zoneId: string;
  campaignId: string;
  existing?: {
    id: string; title: string; battle_date: string; narrative_text: string;
    winning_faction_id: string | null;
    participating_faction_ids?: string[];
  };
  onClose: () => void;
}

export default function BattleEditor({ zoneId, campaignId, existing, onClose }: Props) {
  const router = useRouter();
  const { factions } = useCampaign();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.battle_date ?? new Date().toISOString().slice(0, 10));
  const [text, setText] = useState(existing?.narrative_text ?? "");
  const [winner, setWinner] = useState<string>(existing?.winning_faction_id ?? "");
  const [participating, setParticipating] = useState<string[]>(
    existing?.participating_faction_ids ?? (existing?.winning_faction_id ? [existing.winning_faction_id] : [])
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const toggleParticipating = (fid: string) => {
    setParticipating((cur) => cur.includes(fid) ? cur.filter((x) => x !== fid) : [...cur, fid]);
  };

  const save = async () => {
    if (!title.trim()) { setError("Titre requis"); return; }
    if (participating.length === 0) { setError("Au moins une faction participante"); return; }
    if (winner && !participating.includes(winner)) { setError("Le vainqueur doit etre dans les participants"); return; }
    setError(null); setSubmitting(true);
    const payload = {
      title: title.trim(),
      battle_date: date,
      narrative_text: text,
      winning_faction_id: winner || null,
      participating_faction_ids: participating,
    };
    const res = existing
      ? await apiEditCall("/api/battles", "PUT", campaignId, { id: existing.id, ...payload })
      : await apiEditCall("/api/battles", "POST", campaignId, { zoneId, ...payload });
    setSubmitting(false);
    if (!res.ok) { setError(res.error ?? "Erreur"); return; }
    router.refresh();
    onClose();
  };

  const remove = async () => {
    if (!existing) return;
    if (!confirm(`Supprimer "${existing.title}" et toutes ses photos ?`)) return;
    setSubmitting(true);
    const res = await apiEditCall("/api/battles", "DELETE", campaignId, { id: existing.id });
    setSubmitting(false);
    if (!res.ok) { setError(res.error ?? "Erreur"); return; }
    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="hud-panel hud-panel--strong max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border-faded)" }}>
          <div className="hud-label mb-1">{existing ? "EDIT_BATTLE_REPORT" : "NEW_BATTLE_REPORT"}</div>
          <h2 className="font-display text-xl tracking-wide" style={{ color: "var(--accent-cyan)" }}>
            {existing ? "Modifier le rapport" : "Nouveau rapport de bataille"}
          </h2>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <div className="hud-label mb-1">TITRE *</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <div className="hud-label mb-1">DATE</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
                style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
            </div>
          </div>

          <div>
            <div className="hud-label mb-1">FACTIONS PARTICIPANTES *</div>
            <div className="flex flex-wrap gap-2">
              {factions.map((f) => {
                const checked = participating.includes(f.id);
                return (
                  <button key={f.id} type="button" onClick={() => toggleParticipating(f.id)}
                    className="font-mono text-xs px-3 py-1.5 flex items-center gap-2 transition-all"
                    style={{
                      cursor: "crosshair",
                      background: checked ? hexAlpha(f.color_hex, 0.25) : "rgba(0, 0, 0, 0.35)",
                      border: `1px solid ${checked ? f.color_hex : "var(--border-faded)"}`,
                      color: checked ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: checked ? `0 0 8px ${hexAlpha(f.color_hex, 0.5)}` : "none",
                    }}>
                    <span className="inline-block w-2 h-2" style={{ background: f.color_hex, boxShadow: `0 0 4px ${f.color_hex}` }} />
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="hud-label mb-1">RESULTAT</div>
            <select value={winner} onChange={(e) => setWinner(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
              <option value="">-- Match nul --</option>
              {factions.filter((f) => participating.length === 0 || participating.includes(f.id)).map((f) => (
                <option key={f.id} value={f.id}>Victoire - {f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="hud-label mb-1 flex items-center justify-between">
              <span>RAPPORT DE BATAILLE (markdown)</span>
              <button type="button" onClick={() => setShowPreview((v) => !v)}
                className="font-mono text-[10px] hover:text-white"
                style={{ cursor: "crosshair", color: showPreview ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
                {showPreview ? "← EDITION" : "PREVIEW →"}
              </button>
            </div>
            {showPreview ? (
              <div className="hud-panel--inset px-4 py-3 min-h-[280px]">
                <article className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {text || "_Aucun rapport redige._"}
                  </ReactMarkdown>
                </article>
              </div>
            ) : (
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14}
                placeholder="Raconte le deroulement de la bataille en markdown..."
                className="w-full px-3 py-2 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
                style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
            )}
          </div>

          {error && (
            <div className="px-3 py-2" style={{ color: "#ff7070", background: "rgba(139,26,26,0.18)", border: "1px solid #8b1a1a" }}>
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3 flex justify-between gap-2" style={{ borderTop: "1px solid var(--border-faded)" }}>
          <div>
            {existing && (
              <button onClick={remove} disabled={submitting} className="hud-button"
                style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", color: "#ff7070", borderColor: "#8b1a1a" }}>
                SUPPRIMER
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>
              ANNULER
            </button>
            <button onClick={save} disabled={submitting} className="hud-button"
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem", background: "rgba(127,223,255,0.2)" }}>
              {submitting ? "..." : (existing ? "ENREGISTRER" : "CREER")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16); const g = parseInt(h.slice(2, 4), 16); const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
