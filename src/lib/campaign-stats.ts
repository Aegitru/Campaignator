import type {
  Alliance,
  Battle,
  Faction,
  Planet,
  Zone,
} from "@/types/domain";

export interface FactionStats {
  faction: Faction;
  victories: number;
  battles: number; // batailles auxquelles la faction a participé (ici on approxime = batailles où la faction OU son alliée a gagné/perdu = via zones contrôlées + batailles avec winning_faction_id)
}

export interface AllianceStats {
  alliance: Alliance;
  victories: number;
  factions: FactionStats[];
}

/** Calcule victoires/batailles par faction. Match nul = non comptabilisé en victoire. */
export function computeFactionStats(
  factions: Faction[],
  battles: Battle[]
): FactionStats[] {
  return factions.map((f) => {
    const victories = battles.filter((b) => b.winning_faction_id === f.id).length;
    // Approximation : battles "concernées" = celles où la faction a gagné, ou où une autre faction a gagné mais où la faction est concernée par la campagne.
    // Comme on n'a pas d'info "participants" en V2, on prend toutes les batailles de la campagne.
    const battlesCount = battles.length;
    return { faction: f, victories, battles: battlesCount };
  });
}

export function computeAllianceStats(
  alliances: Alliance[],
  factions: Faction[],
  battles: Battle[]
): AllianceStats[] {
  return alliances.map((a) => {
    const allianceFactions = factions.filter((f) => f.alliance_id === a.id);
    const factionStats = computeFactionStats(allianceFactions, battles);
    const victories = factionStats.reduce((sum, fs) => sum + fs.victories, 0);
    return { alliance: a, victories, factions: factionStats };
  });
}

export interface ZoneWithContext {
  zone: Zone;
  planet: Planet;
  battles: Battle[];
  controllingFaction: Faction | null;
}

export interface BattleWithContext {
  battle: Battle;
  zone: Zone;
  planet: Planet;
  winningFaction: Faction | null;
}

export function getBattlesForZone(zoneId: string, battles: Battle[]): Battle[] {
  return battles
    .filter((b) => b.zone_id === zoneId)
    .sort((a, b) => +new Date(b.battle_date) - +new Date(a.battle_date));
}

export function getZonesForPlanet(planetId: string, zones: Zone[]): Zone[] {
  return zones.filter((z) => z.planet_id === planetId);
}

export function buildChronicle(
  battles: Battle[],
  zones: Zone[],
  planets: Planet[],
  factions: Faction[]
): BattleWithContext[] {
  const planetById = new Map(planets.map((p) => [p.id, p]));
  const zoneById = new Map(zones.map((z) => [z.id, z]));
  const factionById = new Map(factions.map((f) => [f.id, f]));

  return battles
    .slice()
    .sort((a, b) => +new Date(b.battle_date) - +new Date(a.battle_date))
    .map((b) => {
      const zone = zoneById.get(b.zone_id);
      const planet = zone ? planetById.get(zone.planet_id) : undefined;
      const winningFaction = b.winning_faction_id
        ? factionById.get(b.winning_faction_id) ?? null
        : null;
      return {
        battle: b,
        zone: zone!,
        planet: planet!,
        winningFaction,
      };
    })
    .filter((b) => b.zone && b.planet);
}
