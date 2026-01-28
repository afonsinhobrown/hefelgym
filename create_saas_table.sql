-- TABELA DE LICENÇAS SAAS (Controle do Dono do Software)
create table if not exists public.saas_subscriptions (
    gym_id text primary key references public.tenants(id),
    plan_name text not null default 'Standard', -- 'Basic', 'Pro', 'Enterprise'
    license_fee decimal(10,2) not null default 3500.00, -- O valor que o ginásio paga a você
    status text default 'active', -- 'active', 'overdue', 'blocked'
    last_payment_date timestamp with time zone,
    next_payment_due timestamp with time zone,
    features jsonb -- Funcionalidades ativas (ex: { "whatsapp": true, "multi_user": false })
);

alter table public.saas_subscriptions disable row level security;

-- Inserir licença padrão para o Hefel Gym
insert into public.saas_subscriptions (gym_id, plan_name, license_fee, status, next_payment_due)
values ('hefel_gym_v1', 'Professional', 5000.00, 'active', now() + interval '30 days')
on conflict (gym_id) do nothing;
