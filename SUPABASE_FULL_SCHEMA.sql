-- SCHEMA COMPLETO GERADO AUTOMATICAMENTE DO SQLITE

-- Tabela: clients
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT,
    nuit TEXT,
    status TEXT,
    photo_url TEXT,
    created_at TEXT,
    synced INTEGER DEFAULT 0,
    last_access TEXT,
    plan_id TEXT,
    gym_id TEXT DEFAULT 'hefel_gym_v1'
);

-- Tabela: products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    stock INTEGER,
    category TEXT,
    synced INTEGER DEFAULT 0,
    cost_price REAL DEFAULT 0,
    gym_id TEXT DEFAULT 'hefel_gym_v1',
    location_id TEXT,
    photo_url TEXT,
    type TEXT,
    status TEXT DEFAULT 'active'
);

-- Tabela: invoices
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    client_name TEXT,
    amount REAL,
    status TEXT,
    items TEXT,
    date TEXT,
    payment_method TEXT,
    synced INTEGER DEFAULT 0,
    payment_ref TEXT,
    gym_id TEXT DEFAULT 'hefel_gym_v1',
    tax_amount REAL DEFAULT 0
);

-- Tabela: plans
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    duration INTEGER,
    features TEXT,
    synced INTEGER DEFAULT 0,
    gym_id TEXT DEFAULT 'hefel_gym_v1'
);

-- Tabela: saas_subscriptions
CREATE TABLE IF NOT EXISTS saas_subscriptions (
    gym_id TEXT PRIMARY KEY,
    plan_name TEXT,
    license_fee REAL,
    status TEXT,
    last_payment_date TEXT,
    next_payment_due TEXT,
    features TEXT,
    synced INTEGER DEFAULT 1
);

-- Tabela: system_config
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Tabela: access_devices
CREATE TABLE IF NOT EXISTS access_devices (
    id TEXT PRIMARY KEY,
    name TEXT,
    ip TEXT,
    port INTEGER,
    username TEXT,
    password TEXT,
    type TEXT,
    gym_id TEXT DEFAULT 'hefel_gym_v1'
);

-- Tabela: instructors
CREATE TABLE IF NOT EXISTS instructors (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT,
    specialties TEXT,
    contract_type TEXT,
    commission REAL,
    balance REAL DEFAULT 0,
    status TEXT,
    synced INTEGER DEFAULT 0,
    gym_id TEXT DEFAULT 'hefel_gym_v1',
    salary REAL DEFAULT 0,
    role TEXT DEFAULT 'instructor',
    base_salary REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    inss_discount REAL DEFAULT 0,
    irt_discount REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    absences_discount REAL DEFAULT 0,
    bank_account TEXT,
    nuit TEXT,
    type TEXT DEFAULT 'internal',
    shift_bonus REAL DEFAULT 0,
    holiday_bonus REAL DEFAULT 0,
    night_bonus REAL DEFAULT 0,
    account_number TEXT,
    extra_hours REAL DEFAULT 0,
    additional_earnings REAL DEFAULT 0,
    inss_company REAL DEFAULT 0,
    irps REAL DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    specialty TEXT
);

-- Tabela: classes
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT,
    instructor_id TEXT,
    schedule TEXT,
    capacity INTEGER,
    status TEXT,
    synced INTEGER DEFAULT 0,
    attendees TEXT,
    enrolled INTEGER DEFAULT 0
);

-- Tabela: attendance
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    device_ip TEXT,
    user_id TEXT,
    user_name TEXT,
    timestamp TEXT,
    type TEXT,
    method TEXT,
    synced INTEGER DEFAULT 0,
    gym_id TEXT DEFAULT 'hefel_gym_v1'
);

-- Tabela: product_expenses
CREATE TABLE IF NOT EXISTS product_expenses (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_name TEXT,
    quantity INTEGER,
    unit_cost REAL,
    total_cost REAL,
    date TEXT,
    supplier TEXT,
    synced INTEGER DEFAULT 0,
    gym_id TEXT DEFAULT 'hefel_gym_v1'
);

-- Tabela: gym_expenses
CREATE TABLE IF NOT EXISTS gym_expenses (
    id TEXT PRIMARY KEY,
    description TEXT,
    amount REAL,
    category TEXT,
    date TEXT,
    payment_method TEXT,
    synced INTEGER DEFAULT 0,
    gym_id TEXT DEFAULT 'hefel_gym_v1',
    is_fixed INTEGER DEFAULT 0,
    title TEXT,
    responsible TEXT,
    status TEXT DEFAULT 'pago'
);

-- Tabela: gyms
CREATE TABLE IF NOT EXISTS gyms (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    nuit TEXT,
    created_at TEXT,
    synced INTEGER DEFAULT 0
);

-- Tabela: system_users
CREATE TABLE IF NOT EXISTS system_users (
    id TEXT PRIMARY KEY,
    email TEXT,
    password TEXT,
    name TEXT,
    role TEXT,
    gym_id TEXT,
    sync_id TEXT,
    synced INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
);

-- Tabela: locations
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT,
    gym_id TEXT
);

-- Tabela: equipment
CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    location_id TEXT,
    status TEXT DEFAULT 'working',
    condition TEXT,
    cost REAL DEFAULT 0,
    purchase_date TEXT,
    gym_id TEXT,
    synced INTEGER DEFAULT 0,
    photo_url TEXT
);

-- Tabela: salary_history
CREATE TABLE IF NOT EXISTS salary_history (
    id TEXT PRIMARY KEY,
    instructor_id TEXT,
    old_salary REAL,
    new_salary REAL,
    old_role TEXT,
    new_role TEXT,
    change_date TEXT,
    reason TEXT,
    synced INTEGER DEFAULT 0
);

-- Tabela: payroll_history
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

