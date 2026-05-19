import { notFound } from "next/navigation";
import { fetchCampaignBundle } from "@/lib/supabase-queries";
import GalaxyPageClient from "./GalaxyPageClient";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function CampaignPage({ params }: PageProps) {
  const { id } = await params;
  const bundle = await fetchCampaignBundle(id);
  if (!bundle) notFound();
  return <GalaxyPageClient bundle={bundle} />;
}
