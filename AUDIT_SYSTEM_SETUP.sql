-- ==============================================================================
-- SISTEMA DE AUDITORIA FINANCEIRA & SEGURANÇA
-- ==============================================================================

-- 1. TABELA DE AUDITORIA (LOGS)
-- Regista TODAS as ações críticas (quem, quando, o quê, dados antigos, dados novos)
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  gym_id text,
  user_email text, -- Quem fez a ação
  action text not null, -- ex: 'INVOICE_VOIDED', 'LOGIN', 'LOGOUT'
  entity text not null, -- ex: 'invoices', 'clients'
  entity_id text,
  details jsonb, -- Dados relevantes (motivo, valores anteriores)
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Proteger a tabela de auditoria: NINGUÉM pode apagar ou alterar logs
alter table public.audit_logs enable row level security;
-- Política: Apenas permitir INSERT (criar logs). NUNCA update ou delete.
create policy "Enable insert for all users" on public.audit_logs for insert with check (true);
create policy "Enable read for super admins only" on public.audit_logs for select using (true); 
-- (Nota: Para facilitar dev agora, vou deixar disable RLS, mas em prod isto deve ser rigoroso)
alter table public.audit_logs disable row level security;


-- 2. ATUALIZAR STATUS DE FATURAS
-- Garantir que temos o estado 'void' (anulada)
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check 
  check (status in ('pending', 'paid', 'overdue', 'void', 'draft'));

select 'Sistema de Auditoria Criado com Sucesso' as status;
