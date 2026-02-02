-- Adicionar coluna absences_discount à tabela instructors no Supabase
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS absences_discount REAL DEFAULT 0;
