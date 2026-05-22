-- Une seule photo par bataille / par unité (Cloudinary URL)
-- Stockée directement sur la ligne pour simplicité (1 photo = 1 slot).

alter table battles
  add column if not exists photo_url text;

alter table faction_units
  add column if not exists photo_url text;
