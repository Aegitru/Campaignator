"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CampaignSummary } from "@/lib/supabase-queries";
import CreateCampaignWizard from "@/components/wizard/CreateCampaignWizard";
import PasswordPrompt from "@/components/auth/PasswordPrompt";

interface Props {
  campaigns: CampaignSummary[];
  demoCampaignId: string;
  demoCampaignName: string;
  demoSystemId: string;
}

export default function HomeClient({
  campaigns,
  demoCampaignId,
  demoCampaignName,
  demoSystemId,
}: Props) {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [promptFor, setPromptFor] = useState<CampaignSummary | null>(null);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-4xl w-full">
        <div className="hud-label mb-4">
          // CAMPAIGN_TRACKER · COMMAND_INTERFACE
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
          className="font-mono uppercase tracking-[0.3em] text-sm mb-10"
          style={{ color: "var(--text-secondary)" }}
        >
          Journal de bord - Croisade Narrative
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            className="hud-button"
            onClick={() => setWizardOpen(true)}
          >
            + NOUVELLE CAMPAGNE
          </button>
          <Link
            href={`/system/${demoSystemId}`}
            className="hud-button"
            style={{ background: "rgba(0,170,255,0.02)" }}
          >
            ▸ DEMO (Valthar Prime)
          </Link>
        </div>

        {/* Liste campagnes */}
        <div className="hud-label mb-4 text-left">
          CAMPAGNES ENREGISTREES // {campaigns.length}
        </div>

        {campaigns.length === 0 ? (
          <div
            className="hud-panel--inset px-6 py-10 text-center font-mono text-sm"
            style={{ color: "var(--text-faded)" }}
          >
            Aucune campagne dans les archives. Lance la premiere.
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campaigns.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setPromptFor(c)}
                  className="w-full text-left hud-panel hud-panel--inset px-4 py-4 hover:bg-[rgba(0,170,255,0.05)] transition-colors"
                  style={{ cursor: "crosshair" }}
                >
                  <div
                    className="font-display text-base tracking-wide mb-1"
                    style={{ color: "var(--accent-cyan)" }}
                  >
                    {c.name}
                  </div>
                  {c.description && (
                    <div
                      className="font-mono text-[11px] mb-2 line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.description}
                    </div>
                  )}
                  <div
                    className="font-mono text-[10px] flex justify-between"
                    style={{ color: "var(--text-faded)" }}
                  >
                    <span>
                      {c.systemCount} SYS · {c.battleCount} BAT
                    </span>
                    <span>{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Demo entry (toujours visible) */}
        <div className="mt-10">
          <div className="hud-label mb-3 text-left">DONNEES DE DEMO</div>
          <div
            className="hud-panel--inset px-4 py-3 text-left flex items-center justify-between gap-3"
          >
            <div>
              <div
                className="font-display text-sm tracking-wide"
                style={{ color: "var(--accent-cyan)" }}
              >
                {demoCampaignName}
              </div>
              <div
                className="font-mono text-[11px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Campagne de demonstration (lecture seule, donnees en memoire)
              </div>
            </div>
            <Link
              href={`/system/${demoSystemId}`}
              className="hud-button"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.7rem" }}
            >
              VOIR ▸
            </Link>
          </div>
        </div>

        <div
          className="hud-label mt-16"
          style={{ color: "var(--text-faded)" }}
        >
          ◈ THE EMPEROR PROTECTS ◈
        </div>
      </div>

      {/* Wizard creation */}
      {wizardOpen && (
        <CreateCampaignWizard
          onClose={() => setWizardOpen(false)}
          onCreated={() => {
            setWizardOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Password prompt */}
      {promptFor && (
        <PasswordPrompt
          campaignId={promptFor.id}
          campaignName={promptFor.name}
          onClose={() => setPromptFor(null)}
          onUnlocked={() => {
            // Direction: page galaxie de la campagne ; en V3 on a pas encore /campaign/[id]
            // donc on ouvre le premier systeme ou la liste des systemes
            router.push(`/campaign/${promptFor.id}`);
          }}
        />
      )}
    </div>
  );
}
