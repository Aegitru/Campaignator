import { notFound } from "next/navigation";
import { fetchDataFromSystemId } from "@/lib/fetch-campaign-data";
import SystemPageClient from "./SystemPageClient";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function SystemPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchDataFromSystemId(id);
  if (!data) notFound();
  const system = data.systems.find((s) => s.id === id);
  if (!system) notFound();
  const planets = data.planets.filter((p) => p.system_id === system.id);

  return (
    <SystemPageClient
      system={system}
      planets={planets}
      campaignName={data.campaign.name}
      data={data}
    />
  );
}
