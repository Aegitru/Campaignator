import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchCampaignBundle } from "@/lib/supabase-queries";
import AddSystemButton from "@/components/edit/AddSystemButton";
import { CampaignProvider } from "@/lib/campaign-context";
import CampaignBridgeClient from "./CampaignBridgeClient";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params;
  const bundle = await fetchCampaignBundle(id);
  if (!bundle) notFound();

  return (
    <CampaignBridgeClient bundle={bundle}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full text-center">
          <div className="hud-label mb-2">CAMPAIGN_BRIDGE // ACTIVE_LINK</div>
          <h1 className="font-display text-3xl md:text-4xl mb-3" style={{ color: "var(--accent-cyan)" }}>
            {bundle.campaign.name}
          </h1>
          {bundle.campaign.description && (
            <p className="font-mono text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {bundle.campaign.description}
            </p>
          )}

          <div className="hud-divider mb-8" style={{ maxWidth: 360, margin: "0 auto 2rem" }} />

          <div className="hud-label mb-3 flex items-center justify-center gap-3">
            SYSTEMS // {bundle.systems.length}
          </div>
          <div className="mb-4">
            <AddSystemButton campaignId={bundle.campaign.id} />
          </div>

          {bundle.systems.length === 0 ? (
            <div className="hud-panel--inset px-6 py-8 font-mono text-sm" style={{ color: "var(--text-faded)" }}>
              Aucun systeme cartographie. Cree-en un pour demarrer.
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bundle.systems.map((s) => (
                <li key={s.id}>
                  <Link href={`/system/${s.id}`}
                    className="block hud-panel--inset px-4 py-3 text-left hover:bg-[rgba(0,170,255,0.05)] transition-colors"
                    style={{ cursor: "crosshair" }}>
                    <div className="font-display text-sm tracking-wide" style={{ color: "var(--accent-cyan)" }}>{s.name}</div>
                    <div className="hud-label mt-1">{s.star_type}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <Link href="/" className="hud-button" style={{ padding: "0.4rem 0.9rem", fontSize: "0.7rem" }}>◂ Retour Accueil</Link>
          </div>
        </div>
      </div>
    </CampaignBridgeClient>
  );
}
