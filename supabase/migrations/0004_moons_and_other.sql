-- Permet d'attacher des lunes (planètes filles) a une planete parente
alter table planets
  add column if not exists parent_planet_id uuid references planets(id) on delete cascade;

-- Ajoute le type "other" (champ d'asteroides, station, ruines)
alter type planet_type_enum add value if not exists 'other';

-- Index pour requeter rapidement les lunes d'une planete
create index if not exists idx_planets_parent on planets(parent_planet_id);

-- Trigger : max 3 lunes par planete
create or replace function enforce_moons_max() returns trigger as $$
declare cnt integer;
begin
  if new.parent_planet_id is null then return new; end if;
  select count(*) into cnt from planets where parent_planet_id = new.parent_planet_id;
  if cnt >= 3 then
    raise exception 'Max 3 lunes par planete';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_moons_max on planets;
create trigger trg_moons_max before insert on planets
  for each row execute function enforce_moons_max();
