-- ==============================================================================
-- CORREÇÃO DE RESTRIÇÕES (PERMITIR FATURAS HISTÓRICAS)
-- Permite inserir faturas mesmo que o cliente original já não exista na BD.
-- ==============================================================================

-- 1. Remover a restrição de chave estrangeira atual
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;

-- 2. Recriar a restrição mas permitindo que falhe (opcional) ou simplesmente deixar sem constraint estrita
-- Para migração de dados sujos/antigos, o melhor é deixar o client_id como texto livre ou FK opcional (NULL)
-- Vamos permitir NULL e deixar a FK desligada para importação massiva.

-- Se quiser manter a integridade futura, use:
-- ALTER TABLE public.invoices ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
-- Mas para agora, vamos LIBERTAR TUDO para garantir que os dados entram:

-- Apenas garantimos que a coluna aceita NULL
ALTER TABLE public.invoices ALTER COLUMN client_id DROP NOT NULL;

select 'Restrições de Faturas Removidas - Pronto para Migração' as status;
