-- ==============================================================================
-- CORREÇÃO DE PERMISSÕES (ABRIR LEITURA)
-- Execute isto para garantir que a aplicação consegue ler os dados do Supabase.
-- ==============================================================================

-- 1. Desativar RLS nas tabelas principais (Permite leitura/escrita publica com a API Key)
alter table public.tenants disable row level security;
alter table public.clients disable row level security;
alter table public.plans disable row level security;
alter table public.products disable row level security;
alter table public.invoices disable row level security;

--OU (Alternativa Segura se quiser manter RLS ativado)
-- create policy "Public Read" on public.clients for select using (true);
-- Mas disable é mais garantido para debugging agora.

select 'Permissões Atualizadas: Tabelas Destrancadas' as status;
