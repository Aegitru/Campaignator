import { notFound } from "next/navigation";
import { seedSystem, seedPlanets, seedCampaign } from "@/lib/seed";
import SystemPageClient from "./SystemPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SystemPage({ params }: PageProps) {
  const { id } = await params;

  // V1 : la seule source de données est le seed in-memory.
  // V2+ : remplacer par un fetch Supabase.
  if (id !== seedSystem.id) {
    notFound();
  }

  return (
    <SystemPageClient
      system={seedSystem}
      planets={seedPlanets}
      campaignName={seedCampaign.name}
    />
  );
}
