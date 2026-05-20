import type {
  Campaign,
  Alliance,
  Faction,
  StellarSystem,
  Planet,
  Zone,
  Battle,
  BattlePhoto,
} from "@/types/domain";

export const seedCampaign: Campaign = {
  id: "campaign-ashenveil",
  name: "La Croisade du Secteur Ashenveil",
  description: "Une campagne narrative dans les confins du Segmentum Obscurus.",
  status_text:
    "Front actif sur Valthar Prime. Les forces du Chaos consolident leurs positions sur Morghast.",
  last_battle_summary: "Contre-offensive pestilentielle aux Ruines de Kral-Veth.",
  alliance_mode: true,
  created_at: new Date().toISOString(),
};

export const seedAlliances: Alliance[] = [
  { id: "alliance-imperium", campaign_id: seedCampaign.id, name: "Imperium", color_hex: "#1a3a8a", order_index: 0 },
  { id: "alliance-chaos",    campaign_id: seedCampaign.id, name: "Forces du Chaos", color_hex: "#3a1a1a", order_index: 1 },
];

export const seedFactions: Faction[] = [
  {
    id: "faction-ultramarines", campaign_id: seedCampaign.id, alliance_id: "alliance-imperium",
    name: "Ultramarines", color_hex: "#0d47a1",
    lore_text: "Chapitre Adeptus Astartes loyaliste, heritiers de Roboute Guilliman.", symbol_key: "aigle",
  },
  {
    id: "faction-deathguard", campaign_id: seedCampaign.id, alliance_id: "alliance-chaos",
    name: "Death Guard", color_hex: "#2d4a1a",
    lore_text: "Legion traitresse dediee a Nurgle, semant peste et corruption.", symbol_key: "crane",
  },
];

export const seedSystem: StellarSystem = {
  id: "system-valthar",
  campaign_id: seedCampaign.id,
  name: "Valthar Prime",
  lore_text:
    "Systeme binaire strategique au coeur du secteur Ashenveil. Verrou logistique vers les mondes externes.",
  star_type: "yellow_dwarf",
  galaxy_pos_x: 50,
  galaxy_pos_y: 45,
};

export const seedPlanets: Planet[] = [
  { id: "planet-valthar",  system_id: seedSystem.id, name: "Valthar Prime",  planet_type: "rocky",   variant: 1, orbit_index: 1, orbit_speed: 1.0,  has_moon: false, parent_planet_id: null },
  { id: "planet-morghast", system_id: seedSystem.id, name: "Morghast",       planet_type: "dead",    variant: 1, orbit_index: 2, orbit_speed: 0.72, has_moon: false, parent_planet_id: null },
  { id: "planet-caelum",   system_id: seedSystem.id, name: "Caelum",         planet_type: "oceanic", variant: 1, orbit_index: 3, orbit_speed: 0.55, has_moon: true, parent_planet_id: null },
  { id: "planet-infernus", system_id: seedSystem.id, name: "Infernus Belt",  planet_type: "gaseous", variant: 3, orbit_index: 4, orbit_speed: 0.36, has_moon: false, parent_planet_id: null },
];

export const seedZones: Zone[] = [
  { id: "zone-kral-veth",     planet_id: "planet-valthar",  name: "Ruines de Kral-Veth",    controlling_faction_id: "faction-deathguard",   angle_position: 45 },
  { id: "zone-citadelle-or",  planet_id: "planet-valthar",  name: "Citadelle d'Or",         controlling_faction_id: "faction-ultramarines", angle_position: 200 },
  { id: "zone-vallee-acier",  planet_id: "planet-valthar",  name: "Vallee d'Acier",         controlling_faction_id: null,                   angle_position: 310 },
  { id: "zone-necropole",     planet_id: "planet-morghast", name: "Necropole de Kha-rast",  controlling_faction_id: "faction-deathguard",   angle_position: 80 },
  { id: "zone-pic-cendre",    planet_id: "planet-morghast", name: "Pic de Cendre",          controlling_faction_id: "faction-deathguard",   angle_position: 250 },
  { id: "zone-archipel",      planet_id: "planet-caelum",   name: "Archipel d'Amethyste",   controlling_faction_id: "faction-ultramarines", angle_position: 130 },
];

const md = (s: string) => s;

export const seedBattles: Battle[] = [
  {
    id: "battle-aube", zone_id: "zone-kral-veth", title: "L'Assaut de l'Aube",
    battle_date: "2026-04-12",
    narrative_text: md("## Preambule\n\nAux premieres lueurs de l'aube, les **Ultramarines** deployerent leurs forces sur la plaine de Kral-Veth, determines a reprendre les ruines tombees aux mains de l'ennemi.\n\n## Deroulement\n\nLes Sergents tactiques menerent l'assaut, soutenus par un Dreadnought ancestral. Les premieres lignes du Chaos cederent en quelques heures.\n\n> Pour Guilliman ! Pour Macragge !\n\n## Issue\n\nVictoire ecrasante des forces loyalistes. Le terrain est securise temporairement."),
    winning_faction_id: "faction-ultramarines",

    participating_faction_ids: ["faction-ultramarines", "faction-deathguard"],
    created_at: "2026-04-12T08:00:00Z",
  },
  {
    id: "battle-pestilence", zone_id: "zone-kral-veth", title: "La Contre-Offensive Pestilentielle",
    battle_date: "2026-05-03",
    narrative_text: md("## Preambule\n\nQuelques semaines apres l'Assaut de l'Aube, **Mortarion lui-meme** envoya ses Death Guard reprendre la position.\n\n## Deroulement\n\nUne maree de Plague Marines submergea les defenses imperiales. Le brouillard de spores rendit l'air irrespirable. Les Dreadnoughts furent corrodes un a un.\n\n## Issue\n\nVictoire totale des forces du Chaos. Kral-Veth est desormais souillee de pourriture pour des siecles."),
    winning_faction_id: "faction-deathguard",

    participating_faction_ids: ["faction-ultramarines", "faction-deathguard"],
    created_at: "2026-05-03T20:00:00Z",
  },
  {
    id: "battle-citadelle", zone_id: "zone-citadelle-or", title: "Le Siege de la Citadelle d'Or",
    battle_date: "2026-03-22",
    narrative_text: md("## Preambule\n\nLa Citadelle d'Or, vestige d'un age oublie, fut le theatre d'une attaque surprise des Death Guard.\n\n## Deroulement\n\nLes murs millenaires tinrent bon. Les Ultramarines, retranches, repousserent assaut apres assaut grace a un usage habile de l'artillerie *Thunderfire*.\n\n## Issue\n\n**Victoire imperiale**. La Citadelle reste un bastion loyaliste."),
    winning_faction_id: "faction-ultramarines",

    participating_faction_ids: ["faction-ultramarines", "faction-deathguard"],
    created_at: "2026-03-22T14:00:00Z",
  },
  {
    id: "battle-necropole", zone_id: "zone-necropole", title: "Les Ombres de Kha-rast",
    battle_date: "2026-02-15",
    narrative_text: md("## Preambule\n\nUne force expeditionnaire ultramarine penetra la Necropole pour neutraliser un sanctuaire pestilentiel.\n\n## Deroulement\n\nLes couloirs etroits annulerent l'avantage technologique imperial. Les Plague Marines surgirent des cryptes, accompagnes d'essaims de mouches geantes.\n\n## Issue\n\nRetrait strategique des Ultramarines. La Necropole reste sous controle du Chaos."),
    winning_faction_id: "faction-deathguard",

    participating_faction_ids: ["faction-ultramarines", "faction-deathguard"],
    created_at: "2026-02-15T22:00:00Z",
  },
  {
    id: "battle-pic-cendre", zone_id: "zone-pic-cendre", title: "L'Embuscade du Pic",
    battle_date: "2026-01-08",
    narrative_text: md("## Preambule\n\nUne patrouille mecanisee ultramarine fut piegee au pied du Pic de Cendre.\n\n## Deroulement\n\nVolees d'artillerie, contre-attaques au corps-a-corps. Les pertes furent lourdes des deux cotes.\n\n## Issue\n\n**Match nul**. Aucune faction ne consolida sa position apres cet engagement."),
    winning_faction_id: null,

    participating_faction_ids: ["faction-ultramarines", "faction-deathguard"],
    created_at: "2026-01-08T10:00:00Z",
  },
  {
    id: "battle-archipel", zone_id: "zone-archipel", title: "La Liberation d'Amethyste",
    battle_date: "2026-04-28",
    narrative_text: md("## Preambule\n\nLes Ultramarines debarquerent sur l'Archipel pour liberer une colonie civile assiegee.\n\n## Deroulement\n\nLes Stormhawks imperiaux dominerent les cieux. Une operation combinee mer-air-terre devasta les positions ennemies.\n\n## Issue\n\n**Victoire totale**. La colonie est sauvee, l'archipel securise."),
    winning_faction_id: "faction-ultramarines",

    participating_faction_ids: ["faction-ultramarines", "faction-deathguard"],
    created_at: "2026-04-28T06:00:00Z",
  },
];

export const seedPhotos: BattlePhoto[] = [];
