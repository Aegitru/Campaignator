import { notFound } from "next/navigation";
import { fetchDataFromPlanetId } from "@/lib/fetch-campaign-data";
import PlanetPageClient from "./PlanetPageClient";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function PlanetPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchDataFromPlanetId(id);
  if (!data) notFound();
  const planet = data.planets.find((p) => p.id === id);
  if (!planet) notFound();
  const planetZones = data.zones.filter((z) => z.planet_id === planet.id);
  const system = data.systems.find((s) => s.id === planet.system_id);

  return (
    <PlanetPageClient
      planet={planet}
      zones={planetZones}
      systemName={system?.name ?? ""}
      systemId={system?.id ?? ""}
      data={data}
    />
  );
}
