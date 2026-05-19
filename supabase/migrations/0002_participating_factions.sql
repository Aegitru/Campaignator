-- Ajoute la liste des factions ayant participe a une bataille
-- (la winning_faction_id peut etre une de ces factions, ou null si match nul)

alter table battles
  add column if not exists participating_faction_ids uuid[] not null default '{}';

-- Pas d'index necessaire pour V3 (peu de batailles)
