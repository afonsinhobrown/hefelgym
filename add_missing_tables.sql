-- =========================================================
-- ADICIONAR TABELAS EM FALTA (Instrutores, Aulas, Treinos)
-- =========================================================

-- 1. INSTRUTORES
create table if not exists public.instructors (
  id text primary key,
  gym_id text references public.tenants(id),
  name text not null,
  email text,
  phone text,
  specialties text, -- Armazenado como string simples ou JSON
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
-- Desativar segurança para facilitar leitura/escrita
alter table public.instructors disable row level security;


-- 2. AULAS (Calendário)
create table if not exists public.classes (
  id text primary key,
  gym_id text references public.tenants(id),
  title text not null,
  instructor_id text references public.instructors(id), -- Opcional se instructor for apagado
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  day_of_week text, -- 'monday', etc.
  capacity integer default 20,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.classes disable row level security;


-- 3. TREINOS (Exercícios atribuídos a clientes)
create table if not exists public.trainings (
  id text primary key,
  gym_id text references public.tenants(id),
  client_id text, -- Referencia solta para evitar erros se cliente falhar
  title text not null,
  exercises jsonb, -- Lista de exercícios
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.trainings disable row level security;

select 'Tabelas em falta criadas com sucesso!' as result;
