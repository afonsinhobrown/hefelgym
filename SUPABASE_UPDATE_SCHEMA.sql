-- Adicionar todas as colunas em falta na tabela instructors do Supabase
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS absences_discount REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS specialties TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS extra_hours REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS additional_earnings REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS inss_company REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS irt_discount REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS other_deductions REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS balance REAL DEFAULT 0;

-- Criar tabela de histórico de folhas salariais no Supabase
CREATE TABLE IF NOT EXISTS payroll_history (
    id TEXT PRIMARY KEY,
    gym_id TEXT DEFAULT 'hefel_gym_v1',
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    month_name TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    data TEXT NOT NULL,
    total_bruto REAL DEFAULT 0,
    total_descontos REAL DEFAULT 0,
    total_liquido REAL DEFAULT 0,
    created_by TEXT,
    synced INTEGER DEFAULT 0
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_history(gym_id, month);
