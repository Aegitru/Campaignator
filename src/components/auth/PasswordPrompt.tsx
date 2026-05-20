"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";

interface Props {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
  onUnlocked: () => void;
}

export default function PasswordPrompt({ campaignId, campaignName, onClose, onUnlocked }: Props) {
  const { loginCampaign } = useSession();
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/auth`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) {
        if (res.status === 401) setError("Mot de passe incorrect.");
        else setError("Erreur serveur.");
        return;
      }
      const data = await res.json();
      loginCampaign(campaignId, data.token);
      // Aussi stocker le mdp en sessionStorage pour les futures requetes
      try { sessionStorage.setItem(`wh40k_pwd_${campaignId}`, pwd); } catch {}
      onUnlocked();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="hud-panel hud-panel--strong p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hud-label mb-2">Accès à la campagne</div>
        <h3
          className="font-display text-xl mb-1"
          style={{ color: "var(--accent-cyan)" }}
        >
          {campaignName}
        </h3>
        <p
          className="font-mono text-xs mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          Accéder à la campagne avec le mot de passe.
        </p>

        <div className="hud-label mb-2">MOT DE PASSE</div>
        <input
          type="password"
          autoFocus
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="w-full px-3 py-2 mb-3 font-mono text-sm bg-black/40 border focus:outline-none"
          style={{
            borderColor: "var(--border-glow)",
            color: "var(--text-primary)",
            letterSpacing: "0.1em",
          }}
          placeholder="* * * * * *"
        />

        {error && (
          <div
            className="font-mono text-xs mb-3 px-2 py-1"
            style={{
              color: "#ff7070",
              background: "rgba(139,26,26,0.18)",
              border: "1px solid #8b1a1a",
            }}
          >
            ⚠ {error}
          </div>
        )}

        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}
          >
            ANNULER
          </button>
          <button
            type="submit"
            disabled={loading || !pwd}
            className="hud-button"
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}
          >
            {loading ? "..." : "ENTRER ▸"}
          </button>
        </div>
      </form>
    </div>
  );
}
