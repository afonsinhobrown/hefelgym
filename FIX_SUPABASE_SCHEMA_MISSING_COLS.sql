-- Adiciona colunas gym_id se estiverem em falta
ALTER TABLE products ADD COLUMN IF NOT EXISTS gym_id TEXT DEFAULT 'hefel_gym_v1';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS gym_id TEXT DEFAULT 'hefel_gym_v1';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS gym_id TEXT DEFAULT 'hefel_gym_v1';

-- Updates para Instructors (se necessário, baseado em arquivos anteriores)
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS specialties TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS nuit TEXT;
