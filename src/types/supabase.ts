/**
 * Type Database pour le typage du client Supabase.
 * Schéma minimal pour V1 — sera étendu (ou regénéré via supabase gen types) plus tard.
 */
import type {
  Campaign,
  Alliance,
  Faction,
  FactionUnit,
  StellarSystem,
  Planet,
  Zone,
  Battle,
  BattlePhoto,
} from "./domain";

type Row<T> = T;
type Insert<T, K extends keyof T = never> = Omit<T, "id" | "created_at"> & Partial<Pick<T, K>>;
type Update<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      campaigns:       { Row: Row<Campaign>;       Insert: Insert<Campaign>;       Update: Update<Campaign> };
      alliances:       { Row: Row<Alliance>;       Insert: Insert<Alliance>;       Update: Update<Alliance> };
      factions:        { Row: Row<Faction>;        Insert: Insert<Faction>;        Update: Update<Faction> };
      faction_units:   { Row: Row<FactionUnit>;    Insert: Insert<FactionUnit>;    Update: Update<FactionUnit> };
      stellar_systems: { Row: Row<StellarSystem>;  Insert: Insert<StellarSystem>;  Update: Update<StellarSystem> };
      planets:         { Row: Row<Planet>;         Insert: Insert<Planet>;         Update: Update<Planet> };
      zones:           { Row: Row<Zone>;           Insert: Insert<Zone>;           Update: Update<Zone> };
      battles:         { Row: Row<Battle>;         Insert: Insert<Battle>;         Update: Update<Battle> };
      battle_photos:   { Row: Row<BattlePhoto>;    Insert: Insert<BattlePhoto>;    Update: Update<BattlePhoto> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      star_type_enum:   "yellow_dwarf" | "red_giant" | "white_dwarf" | "neutron" | "binary";
      planet_type_enum: "rocky" | "gaseous" | "oceanic" | "dead" | "fortress";
    };
  };
}
