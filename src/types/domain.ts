/**
 * Types métier — utilisés partout dans l'app.
 * Correspondent au schéma Supabase (voir supabase/migrations/0001_init.sql).
 */

export type StarType =
  | "yellow_dwarf"
  | "red_giant"
  | "white_dwarf"
  | "neutron"
  | "binary";

export type PlanetType = "rocky" | "gaseous" | "oceanic" | "dead" | "fortress";
export type PlanetVariant = 1 | 2 | 3 | 4;

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status_text: string;
  last_battle_summary: string;
  alliance_mode: boolean;
  created_at: string;
}

export interface Alliance {
  id: string;
  campaign_id: string;
  name: string;
  color_hex: string;
  order_index: number;
}

export interface Faction {
  id: string;
  campaign_id: string;
  alliance_id: string | null;
  name: string;
  color_hex: string;
  lore_text: string;
}

export interface FactionUnit {
  id: string;
  faction_id: string;
  name: string;
  description: string;
  evolution_notes: string;
}

export interface StellarSystem {
  id: string;
  campaign_id: string;
  name: string;
  lore_text: string;
  star_type: StarType;
  galaxy_pos_x: number;
  galaxy_pos_y: number;
}

export interface Planet {
  id: string;
  system_id: string;
  name: string;
  planet_type: PlanetType;
  variant: PlanetVariant;
  orbit_index: number;
  orbit_speed: number;
  has_moon: boolean;
}

export interface Zone {
  id: string;
  planet_id: string;
  name: string;
  controlling_faction_id: string | null;
  angle_position: number;
}

export interface Battle {
  id: string;
  zone_id: string;
  title: string;
  battle_date: string;
  narrative_text: string;
  winning_faction_id: string | null;
  participating_faction_ids: string[];
  created_at: string;
}

export interface BattlePhoto {
  id: string;
  battle_id: string;
  cloudinary_url: string;
  order_index: number;
}
