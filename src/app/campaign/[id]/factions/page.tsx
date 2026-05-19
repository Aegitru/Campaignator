import { notFound } from "next/navigation";
import { fetchCampaignBundle, listUnitsForFactions } from "@/lib/supabase-queries";
import FactionsPageClient from "./FactionsPageClient";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function FactionsPage({ params }: PageProps) {
  const { id } = await params;
  const bundle = await fetchCampaignBundle(id);
  if (!bundle) notFound();
  const units = await listUnitsForFactions(bundle.factions.map((f) => f.id));
  return <FactionsPageClient bundle={bundle} units={units} />;
}
