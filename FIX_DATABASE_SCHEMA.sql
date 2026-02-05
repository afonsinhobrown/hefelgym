-- Script para corrigir schema da base de dados Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna assigned_locations à tabela system_users (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_users' AND column_name = 'assigned_locations'
    ) THEN
        ALTER TABLE system_users ADD COLUMN assigned_locations TEXT;
        RAISE NOTICE 'Coluna assigned_locations adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna assigned_locations já existe';
    END IF;
END $$;

-- 2. Adicionar coluna status à tabela products (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'status'
    ) THEN
        ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Coluna status adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna status já existe';
    END IF;
END $$;

-- 3. Garantir que todos os produtos existentes têm status 'active'
UPDATE products SET status = 'active' WHERE status IS NULL OR status = '';

-- 4. Verificar se há clientes sem gym_id (problema de visibilidade)
SELECT COUNT(*) as clientes_sem_gym FROM clients WHERE gym_id IS NULL;

-- 5. Listar todas as colunas das tabelas críticas para debug
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('system_users', 'products', 'clients')
ORDER BY table_name, ordinal_position;
