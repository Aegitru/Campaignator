import Link from "next/link";
import { seedCampaign, seedSystem } from "@/lib/seed";

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-3xl">
        {/* Bandeau supérieur stylisé */}
        <div className="hud-label mb-4">
          // CAMPAIGN_TRACKER · VERSION 1 · INITIALIZING
        </div>

        <h1
          className="font-display text-5xl md:text-7xl mb-3"
          style={{
            color: "var(--accent-cyan)",
            letterSpacing: "0.16em",
            textShadow: "0 0 18px rgba(127, 223, 255, 0.45)",
          }}
        >
          WARHAMMER
        </h1>
        <h2
          className="font-display text-3xl md:text-5xl mb-6"
          style={{
            color: "var(--accent-blue)",
            letterSpacing: "0.32em",
            textShadow: "0 0 14px rgba(0, 170, 255, 0.35)",
          }}
        >
          40&nbsp;000
        </h2>

        <div
          className="hud-divider mb-8"
          style={{ maxWidth: 480, margin: "0 auto 2rem" }}
        />

        <p
          className="font-mono uppercase tracking-[0.3em] text-sm mb-12"
          style={{ color: "var(--text-secondary)" }}
        >
          Journal de bord — Croisade Narrative
        </p>

        <div className="hud-panel inline-block mx-auto px-8 py-6 mb-10 text-left">
          <div className="hud-label mb-2">DÉMO V1 — DONNÉES DE SEED</div>
          <div
            className="font-display text-xl mb-1"
            style={{ color: "var(--accent-cyan)" }}
          >
            {seedCampaign.name}
          </div>
          <div
            className="font-mono text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Système actif&nbsp;:{" "}
            <span style={{ color: "var(--text-primary)" }}>
              {seedSystem.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href={`/system/${seedSystem.id}`} className="hud-button">
            ▸ Entrer dans le système Valthar
          </Link>
          <button className="hud-button" disabled title="À venir en V5">
            ＋ Nouvelle campagne (V5)
          </button>
        </div>

        <div
          className="hud-label mt-16"
          style={{ color: "var(--text-faded)" }}
        >
          ◈ THE EMPEROR PROTECTS ◈
        </div>
      </div>
    </div>
  );
}
