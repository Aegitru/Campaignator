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
  existing?: { id: string; title: string; battle_date: string; narrative_text: string; winning_faction_id: string | null };
  onClose: () => void;
}

export default function BattleEditor({ zoneId, campaignId, existing, onClose }: Props) {
  const router = useRouter();
  const { factions } = useCampaign();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.battle_date ?? new Date().toISOString().slice(0, 10));
  const [text, setText] = useState(existing?.narrative_text ?? "## Preambule\n\n...\n\n## Deroulement\n\n...\n\n## Issue\n\n...");
  const [winner, setWinner] = useState<string>(existing?.winning_faction_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const save = async () => {
    if (!title.trim()) { setError("Titre requis"); return; }
    setError(null); setSubmitting(true);
    const payload = {
      title: title.trim(),
      battle_date: date,
      narrative_text: text,
      winning_faction_id: winner || null,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="hud-panel hud-panel--strong max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border-faded)" }}>
          <div className="hud-label mb-1">{existing ? "EDIT_BATTLE" : "NEW_BATTLE"}</div>
          <h2 className="font-display text-xl tracking-wide" style={{ color: "var(--accent-cyan)" }}>
            {existing ? "Modifier le rapport" : "Nouveau rapport de bataille"}
          </h2>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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

          <div className="mb-3">
            <div className="hud-label mb-1">RESULTAT</div>
            <select value={winner} onChange={(e) => setWinner(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border font-mono text-sm focus:outline-none"
              style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }}>
              <option value="">-- Match nul --</option>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>Victoire - {f.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <div className="hud-label mb-1">RECIT (markdown)</div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={16}
                className="w-full px-3 py-2 bg-black/40 border font-mono text-xs focus:outline-none resize-none"
                style={{ borderColor: "var(--border-glow)", color: "var(--text-primary)" }} />
            </div>
            <div>
              <div className="hud-label mb-1">PREVIEW</div>
              <div className="hud-panel--inset px-3 py-2 h-[420px] overflow-y-auto">
                <article className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
                </article>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 px-3 py-2" style={{ color: "#ff7070", background: "rgba(139,26,26,0.18)", border: "1px solid #8b1a1a" }}>
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
