-- Adiciona colunas gym_id se estiverem em falta
ALTER TABLE products ADD COLUMN IF NOT EXISTS gym_id TEXT DEFAULT 'hefel_gym_v1';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- Adicionado conforme definição do user
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS gym_id TEXT DEFAULT 'hefel_gym_v1';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS gym_id TEXT DEFAULT 'hefel_gym_v1';

-- Updates para Instructors
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS specialties TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS nuit TEXT;

-- Garantir tabela gyms
CREATE TABLE IF NOT EXISTS public.gyms (
  id text not null,
  name text null,
  address text null,
  nuit text null,
  created_at text null,
  synced integer null default 0,
  constraint gyms_pkey primary key (id)
);
