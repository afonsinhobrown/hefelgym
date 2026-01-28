-- ==============================================================================
-- SCHEMA GYMAR SAAS (MULTI-TENANT)
-- Execute este script no SQL Editor do Supabase para criar a estrutura inicial.
-- ==============================================================================

-- 1. TABELA DE GINÁSIOS (TENANTS)
-- Armazena os clientes do sistema (Ex: Hefel Gym, Iron Pump, etc.)
create table public.tenants (
  id text primary key, -- Ex: 'hefel_gym_v1'
  name text not null,
  owner_email text,
  plan text default 'Starter', -- Starter, Pro, Enterprise
  status text default 'active', -- active, inactive, suspended
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. TABELA DE UTILIZADORES DO SISTEMA
-- Staff, Recepcionistas, PTs (Ligados a um Ginásio)
create table public.app_users (
  id uuid default gen_random_uuid() primary key,
  gym_id text references public.tenants(id),
  email text not null,
  role text default 'staff', -- admin, staff, trainer
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. TABELA DE CLIENTES (UTENTES)
create table public.clients (
  id text primary key, -- Mantemos text para compatibilidade com IDs antigos
  gym_id text references public.tenants(id), -- OBRIGATÓRIO: Liga ao ginásio
  name text not null,
  email text,
  phone text,
  nuit text,
  status text default 'active',
  photo_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. TABELA DE PLANOS/MENSALIDADES
create table public.plans (
  id text primary key,
  gym_id text references public.tenants(id),
  name text not null,
  price numeric(10,2) default 0,
  duration_months integer default 1,
  features text[], -- Array de strings
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. TABELA DE FATURAS (INVOICES)
create table public.invoices (
  id text primary key,
  gym_id text references public.tenants(id),
  client_id text references public.clients(id),
  client_name text, -- Cache do nome para histórico
  amount numeric(10,2) not null,
  status text default 'pending', -- pending, paid, void
  items jsonb, -- Guarda os itens da fatura como JSON
  payment_method text,
  date timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. TABELA DE PRODUTOS (POS)
create table public.products (
  id text primary key,
  gym_id text references public.tenants(id),
  name text not null,
  price numeric(10,2) not null,
  stock integer default 0,
  category text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. TABELA DE FREQUÊNCIA (ATTENDANCE/CATRACA)
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  gym_id text references public.tenants(id),
  client_id text references public.clients(id),
  check_in timestamp with time zone default timezone('utc'::text, now()),
  access_method text default 'qrcode', -- qrcode, biometria, manual
  status text default 'allowed'
);

-- HABILITAR RLS (SEGURANÇA BASICA)
-- (Descomente se quiser forçar segurança imediata, mas para migração inicial pode deixar aberto para facilitar)
-- alter table public.tenants enable row level security;
-- alter table public.clients enable row level security;

-- MENSAGEM DE SUCESSO
select 'Estrutura GYMAR criada com sucesso!' as result;
