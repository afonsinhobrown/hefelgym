const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const sourceDbPath = path.join(__dirname, 'hefelgym_local.db');
const targetDbPath = path.join(__dirname, 'inicializacao.db');

// Delete target if exists to start fresh
if (fs.existsSync(targetDbPath)) {
    fs.unlinkSync(targetDbPath);
}

const sourceDb = new sqlite3.Database(sourceDbPath);
const targetDb = new sqlite3.Database(targetDbPath);

const TABLES_TO_COPY = [
    'system_config',
    'clients',
    'products',
    'plans',
    'saas_subscriptions',
    'access_devices',
    'instructors'
];

const TABLES_TO_CREATE_EMPTY = [
    { name: 'invoices', schema: 'id TEXT PRIMARY KEY, client_id TEXT, client_name TEXT, amount REAL, status TEXT, items TEXT, date TEXT, payment_method TEXT, synced INTEGER DEFAULT 0' },
    { name: 'attendance', schema: 'id TEXT PRIMARY KEY, device_ip TEXT, user_id TEXT, user_name TEXT, timestamp TEXT, type TEXT, method TEXT, synced INTEGER DEFAULT 0' },
    { name: 'product_expenses', schema: 'id TEXT PRIMARY KEY, product_id TEXT, product_name TEXT, quantity INTEGER, unit_cost REAL, total_cost REAL, date TEXT, supplier TEXT, synced INTEGER DEFAULT 0' },
    { name: 'gym_expenses', schema: 'id TEXT PRIMARY KEY, description TEXT, amount REAL, category TEXT, date TEXT, payment_method TEXT, synced INTEGER DEFAULT 0' }
];

targetDb.serialize(() => {
    // 1. Create empty transactional tables
    TABLES_TO_CREATE_EMPTY.forEach(t => {
        targetDb.run(`CREATE TABLE ${t.name} (${t.schema})`);
    });

    // 2. Copy real data tables
    TABLES_TO_COPY.forEach(tableName => {
        sourceDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) {
                console.warn(`Skipping ${tableName} (perhaps not created yet):`, err.message);
                return;
            }

            // Get table schema to recreate it exactly
            sourceDb.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, schema) => {
                if (err || !schema) return;

                targetDb.run(schema.sql, () => {
                    if (rows.length === 0) return;

                    const keys = Object.keys(rows[0]);
                    const placeholders = keys.map(() => '?').join(',');
                    const stmt = targetDb.prepare(`INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`);

                    rows.forEach(row => {
                        const values = keys.map(k => row[k]);
                        stmt.run(values);
                    });
                    stmt.finalize();
                    console.log(`Copied ${rows.length} rows to ${tableName}`);
                });
            });
        });
    });
});

setTimeout(() => {
    sourceDb.close();
    targetDb.close();
    console.log("Database 'inicializacao.db' created successfully with real data only.");
}, 3000);
