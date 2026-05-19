import { listCampaigns } from "@/lib/supabase-queries";
import HomeClient from "./HomeClient";
import { seedSystem, seedCampaign } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function Home() {
  let campaigns: Awaited<ReturnType<typeof listCampaigns>> = [];
  try {
    campaigns = await listCampaigns();
  } catch (e) {
    console.error("Failed to fetch campaigns", e);
  }

  return (
    <HomeClient
      campaigns={campaigns}
      demoCampaignId={seedCampaign.id}
      demoCampaignName={seedCampaign.name}
      demoSystemId={seedSystem.id}
    />
  );
}
