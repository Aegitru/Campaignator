import { notFound } from "next/navigation";
import { seedPlanets, seedSystem, seedZones } from "@/lib/seed";
import PlanetPageClient from "./PlanetPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanetPage({ params }: PageProps) {
  const { id } = await params;
  const planet = seedPlanets.find((p) => p.id === id);
  if (!planet) notFound();

  const planetZones = seedZones.filter((z) => z.planet_id === planet.id);

  return (
    <PlanetPageClient
      planet={planet}
      zones={planetZones}
      systemName={seedSystem.name}
      systemId={seedSystem.id}
    />
  );
}
