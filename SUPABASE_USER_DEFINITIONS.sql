-- DEFINIÇÃO FORNECIDA PELO USER (2026-02-05)

CREATE TABLE IF NOT EXISTS public.gyms (
  id text not null,
  name text null,
  address text null,
  nuit text null,
  created_at text null,
  synced integer null default 0,
  constraint gyms_pkey primary key (id)
) TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.products (
  id text not null,
  name text null,
  price real null,
  stock integer null,
  category text null,
  synced integer null default 0,
  cost_price real null default 0,
  gym_id text null default 'hefel_gym_v1'::text,
  location_id text null,
  photo_url text null,
  type text null,
  status text null default 'active'::text,
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;
