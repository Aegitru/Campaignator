-- Ajoute un symbole identifiant chaque faction (rendu en SVG cote frontend)
alter table factions
  add column if not exists symbol_key text not null default 'etoile';
