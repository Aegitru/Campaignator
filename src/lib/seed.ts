import type {
  Campaign,
  Alliance,
  Faction,
  StellarSystem,
  Planet,
  Zone,
  Battle,
} from "@/types/domain";

/**
 * Données de seed V1 (cdc §19) : "La Croisade du Secteur Ashenveil".
 * Utilisées telles quelles pour le rendu V1 visuel sans branchement Supabase live.
 * Le même contenu sera inséré en DB par un script seed plus tard.
 */

export const seedCampaign: Campaign = {
  id: "campaign-ashenveil",
  name: "La Croisade du Secteur Ashenveil",
  description: "Une campagne narrative dans les confins du Segmentum Obscurus.",
  status_text:
    "Front actif sur Valthar Prime. Les forces du Chaos consolident leurs positions sur Morghast.",
  last_battle_summary:
    "Contre-offensive pestilentielle aux Ruines de Kral-Veth.",
  alliance_mode: true,
  created_at: new Date().toISOString(),
};

export const seedAlliances: Alliance[] = [
  {
    id: "alliance-imperium",
    campaign_id: seedCampaign.id,
    name: "Imperium",
    color_hex: "#1a3a8a",
    order_index: 0,
  },
  {
    id: "alliance-chaos",
    campaign_id: seedCampaign.id,
    name: "Forces du Chaos",
    color_hex: "#3a1a1a",
    order_index: 1,
  },
];

export const seedFactions: Faction[] = [
  {
    id: "faction-ultramarines",
    campaign_id: seedCampaign.id,
    alliance_id: "alliance-imperium",
    name: "Ultramarines",
    color_hex: "#0d47a1",
    lore_text:
      "Chapitre Adeptus Astartes loyaliste, héritiers de Roboute Guilliman.",
  },
  {
    id: "faction-deathguard",
    campaign_id: seedCampaign.id,
    alliance_id: "alliance-chaos",
    name: "Death Guard",
    color_hex: "#2d4a1a",
    lore_text:
      "Légion traîtresse dédiée à Nurgle, semant peste et corruption.",
  },
];

export const seedSystem: StellarSystem = {
  id: "system-valthar",
  campaign_id: seedCampaign.id,
  name: "Valthar Prime",
  lore_text:
    "Système binaire stratégique au cœur du secteur Ashenveil. Verrou logistique vers les mondes externes.",
  star_type: "yellow_dwarf",
  galaxy_pos_x: 50,
  galaxy_pos_y: 45,
};

export const seedPlanets: Planet[] = [
  {
    id: "planet-valthar",
    system_id: seedSystem.id,
    name: "Valthar Prime",
    planet_type: "rocky",
    variant: 1,
    orbit_index: 1,
    orbit_speed: 1.0,
    has_moon: false,
  },
  {
    id: "planet-morghast",
    system_id: seedSystem.id,
    name: "Morghast",
    planet_type: "dead",
    variant: 1,
    orbit_index: 2,
    orbit_speed: 0.72,
    has_moon: false,
  },
  {
    id: "planet-caelum",
    system_id: seedSystem.id,
    name: "Caelum",
    planet_type: "oceanic",
    variant: 1,
    orbit_index: 3,
    orbit_speed: 0.55,
    has_moon: true,
  },
  {
    id: "planet-infernus",
    system_id: seedSystem.id,
    name: "Infernus Belt",
    planet_type: "gaseous",
    variant: 3,
    orbit_index: 4,
    orbit_speed: 0.36,
    has_moon: false,
  },
];

export const seedZones: Zone[] = [
  {
    id: "zone-kral-veth",
    planet_id: "planet-valthar",
    name: "Ruines de Kral-Veth",
    controlling_faction_id: "faction-deathguard",
    angle_position: 45,
  },
];

export const seedBattles: Battle[] = [
  {
    id: "battle-aube",
    zone_id: "zone-kral-veth",
    title: "L'Assaut de l'Aube",
    battle_date: "2026-04-12",
    narrative_text: `## Préambule

Aux premières lueurs de l'aube, les **Ultramarines** déployèrent leurs forces sur la plaine de Kral-Veth, déterminés à reprendre les ruines tombées aux mains de l'ennemi.

## Déroulement

Les Sergents tactiques menèrent l'assaut, soutenus par un Dreadnought ancestral. Les premières lignes du Chaos cédèrent en quelques heures.

> "Pour Guilliman ! Pour Macragge !"

## Issue

Victoire écrasante des forces loyalistes. Le terrain est sécurisé temporairement.`,
    winning_faction_id: "faction-ultramarines",
    created_at: "2026-04-12T08:00:00Z",
  },
  {
    id: "battle-pestilence",
    zone_id: "zone-kral-veth",
    title: "La Contre-Offensive Pestilentielle",
    battle_date: "2026-05-03",
    narrative_text: `## Préambule

Quelques semaines après l'Assaut de l'Aube, **Mortarion lui-même** envoya ses Death Guard reprendre la position.

## Déroulement

Une marée de Plague Marines submergea les défenses impériales. Le brouillard de spores rendit l'air irrespirable. Les Dreadnoughts furent corrodés un à un.

## Issue

Victoire totale des forces du Chaos. Kral-Veth est désormais souillée de pourriture pour des siècles.`,
    winning_faction_id: "faction-deathguard",
    created_at: "2026-05-03T20:00:00Z",
  },
];
