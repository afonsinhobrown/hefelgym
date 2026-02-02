-- Adicionar colunas para suporte completo de Payroll (Folha Salarial)
-- Ignorar erros se as colunas já existirem (o SQLite não tem IF NOT EXISTS para colunas em versões antigas, mas o comando falha benignamente se a coluna já existir).

ALTER TABLE instructors ADD COLUMN base_salary REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN bonus REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN absences_discount REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN inss_discount REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN irt_discount REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN other_deductions REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN net_salary REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN bank_account TEXT;
ALTER TABLE instructors ADD COLUMN nuit TEXT;
ALTER TABLE instructors ADD COLUMN type TEXT DEFAULT 'internal'; -- manager, security, cleaner, etc
