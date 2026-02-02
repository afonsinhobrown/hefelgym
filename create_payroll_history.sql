-- Criar tabela para histórico de folhas salariais
CREATE TABLE IF NOT EXISTS payroll_history (
    id TEXT PRIMARY KEY,
    gym_id TEXT DEFAULT 'hefel_gym_v1',
    month TEXT NOT NULL,  -- formato: 2026-01
    year INTEGER NOT NULL,
    month_name TEXT NOT NULL,  -- Janeiro, Fevereiro, etc
    snapshot_date TEXT NOT NULL,  -- data de criação do snapshot
    data TEXT NOT NULL,  -- JSON com todos os dados da folha
    total_bruto REAL DEFAULT 0,
    total_descontos REAL DEFAULT 0,
    total_liquido REAL DEFAULT 0,
    created_by TEXT,
    synced INTEGER DEFAULT 0
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_history(gym_id, month);
