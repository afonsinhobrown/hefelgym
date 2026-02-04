
-- 1. Adicionar coluna de status para produtos (workflow de aprovação)
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Adicionar coluna para mapear locais permitidos para cada usuário
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS assigned_locations TEXT;

-- 3. Atualizar produtos existentes para 'active'
UPDATE products SET status = 'active' WHERE status IS NULL;

-- 4. Criar função para facilitar a busca de locais (opcional mas bom para performance)
COMMENT ON COLUMN system_users.assigned_locations IS 'JSON array of location IDs that the user can manage';
