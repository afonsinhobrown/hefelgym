-- ==============================================================================
-- GYMAR SAAS - MASTER DATABASE SETUP (V2.0)
-- Estrutura completa consolidada para Clientes, Financeiro, Aulas e Treinos.
-- ==============================================================================

-- 1. TENANTS (Ginásios)
create table if not exists public.tenants (
  id text primary key, -- ex: 'hefel_gym_v1'
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.tenants disable row level security;

-- 2. CLIENTES
create table if not exists public.clients (
  id text primary key,
  gym_id text references public.tenants(id),
  name text not null,
  email text,
  phone text,
  nuit text,
  photo_url text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.clients disable row level security;

-- 3. PLANOS
create table if not exists public.plans (
  id text primary key,
  gym_id text references public.tenants(id),
  name text not null,
  price decimal(10,2) not null,
  duration_months integer default 1,
  features jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.plans disable row level security;

-- 4. FATURAS (INVOICES) - Com restrições relaxadas para importação histórica
create table if not exists public.invoices (
  id text primary key,
  gym_id text references public.tenants(id),
  client_id text, -- SEM FOREIGN KEY ESTRITA para permitir dados históricos
  client_name text, -- Backup do nome caso o ID não exista
  amount decimal(10,2) not null,
  status text default 'pending', -- paid, pending, void
  items jsonb, -- Detalhes dos itens
  payment_method text,
  date timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.invoices disable row level security;

-- 5. PRODUTOS
create table if not exists public.products (
  id text primary key,
  gym_id text references public.tenants(id),
  name text not null,
  price decimal(10,2) not null,
  stock integer default 0,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.products disable row level security;

-- 6. INSTRUTORES
create table if not exists public.instructors (
  id text primary key,
  gym_id text references public.tenants(id),
  name text not null,
  email text,
  phone text,
  specialties text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.instructors disable row level security;

-- 7. AULAS (CLASSES)
create table if not exists public.classes (
  id text primary key,
  gym_id text references public.tenants(id),
  title text not null,
  instructor_id text, -- Referência solta
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  day_of_week text,
  capacity integer default 20,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.classes disable row level security;

-- 8. TREINOS (TRAININGS)
create table if not exists public.trainings (
  id text primary key,
  gym_id text references public.tenants(id),
  client_id text,
  title text not null,
  exercises jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.trainings disable row level security;

-- 9. ASSIDUIDADE (ATTENDANCE)
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  gym_id text references public.tenants(id),
  client_id text,
  check_in timestamp with time zone default timezone('utc'::text, now()),
  method text default 'qr_code'
);
alter table public.attendance disable row level security;

-- ==============================================================================
-- CORREÇÕES FINAIS
-- ==============================================================================

-- Remover constraint antiga de invoices se existir, para garantir importação
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_client_id_fkey') THEN 
    ALTER TABLE public.invoices DROP CONSTRAINT invoices_client_id_fkey; 
  END IF; 
END $$;

select 'MASTER SETUP COMPLETED: All tables ready & secure permissions removed for migration.' as status;
