-- ============================================================
-- WH40K Campaign Tracker — Schema initial (V1)
-- Migration unique : toutes les tables du cdc créées en une fois
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
do $$ begin
  create type star_type_enum   as enum ('yellow_dwarf', 'red_giant', 'white_dwarf', 'neutron', 'binary');
exception when duplicate_object then null; end $$;

do $$ begin
  create type planet_type_enum as enum ('rocky', 'gaseous', 'oceanic', 'dead', 'fortress');
exception when duplicate_object then null; end $$;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists campaigns (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  description          text,
  password_hash        text not null,          -- SHA-256 hex
  status_text          text default '',
  last_battle_summary  text default '',
  alliance_mode        boolean not null default false,
  created_at           timestamptz not null default now()
);

create table if not exists alliances (
  id           uuid primary key default uuid_generate_v4(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  name         text not null,
  color_hex    text not null,
  order_index  integer not null default 0
);
create index if not exists idx_alliances_campaign on alliances(campaign_id);

create table if not exists factions (
  id           uuid primary key default uuid_generate_v4(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  alliance_id  uuid references alliances(id) on delete set null,
  name         text not null,
  color_hex    text not null,
  lore_text    text default ''
);
create index if not exists idx_factions_campaign on factions(campaign_id);
create index if not exists idx_factions_alliance on factions(alliance_id);

create table if not exists faction_units (
  id               uuid primary key default uuid_generate_v4(),
  faction_id       uuid not null references factions(id) on delete cascade,
  name             text not null,
  description      text default '',
  evolution_notes  text default ''
);
create index if not exists idx_faction_units_faction on faction_units(faction_id);

create table if not exists stellar_systems (
  id            uuid primary key default uuid_generate_v4(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  name          text not null,
  lore_text     text default '',
  star_type     star_type_enum not null default 'yellow_dwarf',
  galaxy_pos_x  real not null default 50,    -- 0..100 (%)
  galaxy_pos_y  real not null default 50
);
create index if not exists idx_systems_campaign on stellar_systems(campaign_id);

create table if not exists planets (
  id           uuid primary key default uuid_generate_v4(),
  system_id    uuid not null references stellar_systems(id) on delete cascade,
  name         text not null,
  planet_type  planet_type_enum not null default 'rocky',
  variant      integer not null default 1 check (variant between 1 and 4),
  orbit_index  integer not null default 1,
  orbit_speed  real not null default 1.0,
  has_moon     boolean not null default false
);
create index if not exists idx_planets_system on planets(system_id);

create table if not exists zones (
  id                       uuid primary key default uuid_generate_v4(),
  planet_id                uuid not null references planets(id) on delete cascade,
  name                     text not null,
  controlling_faction_id   uuid references factions(id) on delete set null,
  angle_position           real not null default 0   -- 0..360
);
create index if not exists idx_zones_planet on zones(planet_id);

-- Contrainte métier : max 5 zones par planète (vérifié via trigger)
create or replace function enforce_zones_max() returns trigger as $$
declare
  cnt integer;
begin
  select count(*) into cnt from zones where planet_id = new.planet_id;
  if cnt >= 5 then
    raise exception 'Max 5 zones per planet';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_zones_max on zones;
create trigger trg_zones_max
  before insert on zones
  for each row execute function enforce_zones_max();

create table if not exists battles (
  id                  uuid primary key default uuid_generate_v4(),
  zone_id             uuid not null references zones(id) on delete cascade,
  title               text not null,
  battle_date         date not null default current_date,
  narrative_text      text default '',      -- markdown
  winning_faction_id  uuid references factions(id) on delete set null,
  created_at          timestamptz not null default now()
);
create index if not exists idx_battles_zone on battles(zone_id);

create table if not exists battle_photos (
  id              uuid primary key default uuid_generate_v4(),
  battle_id       uuid not null references battles(id) on delete cascade,
  cloudinary_url  text not null,
  order_index     integer not null default 0
);
create index if not exists idx_photos_battle on battle_photos(battle_id);

-- Contrainte métier : max 5 photos par bataille
create or replace function enforce_photos_max() returns trigger as $$
declare
  cnt integer;
begin
  select count(*) into cnt from battle_photos where battle_id = new.battle_id;
  if cnt >= 5 then
    raise exception 'Max 5 photos per battle';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_photos_max on battle_photos;
create trigger trg_photos_max
  before insert on battle_photos
  for each row execute function enforce_photos_max();

-- Contraintes métier : max 6 factions / 3 alliances par campagne
create or replace function enforce_factions_max() returns trigger as $$
declare cnt integer;
begin
  select count(*) into cnt from factions where campaign_id = new.campaign_id;
  if cnt >= 6 then
    raise exception 'Max 6 factions per campaign';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_factions_max on factions;
create trigger trg_factions_max
  before insert on factions
  for each row execute function enforce_factions_max();

create or replace function enforce_alliances_max() returns trigger as $$
declare cnt integer;
begin
  select count(*) into cnt from alliances where campaign_id = new.campaign_id;
  if cnt >= 3 then
    raise exception 'Max 3 alliances per campaign';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_alliances_max on alliances;
create trigger trg_alliances_max
  before insert on alliances
  for each row execute function enforce_alliances_max();

-- ============================================================
-- Row Level Security : ouvert pour V1 (lecture publique, écriture via service role côté serveur)
-- À durcir en V3 avec l'auth par mot de passe
-- ============================================================
alter table campaigns       enable row level security;
alter table alliances       enable row level security;
alter table factions        enable row level security;
alter table faction_units   enable row level security;
alter table stellar_systems enable row level security;
alter table planets         enable row level security;
alter table zones           enable row level security;
alter table battles         enable row level security;
alter table battle_photos   enable row level security;

-- Policies : lecture publique de tout (V1)
do $$
declare
  t text;
begin
  foreach t in array array[
    'campaigns','alliances','factions','faction_units',
    'stellar_systems','planets','zones','battles','battle_photos'
  ] loop
    execute format(
      'drop policy if exists "public_read" on %I; create policy "public_read" on %I for select using (true);',
      t, t
    );
  end loop;
end $$;
