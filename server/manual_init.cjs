const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'hefelgym_local.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Starting manual init...");
    db.run("CREATE TABLE IF NOT EXISTS product_expenses (id TEXT PRIMARY KEY, product_id TEXT, product_name TEXT, quantity INTEGER, unit_cost REAL, total_cost REAL, date TEXT, supplier TEXT, synced INTEGER DEFAULT 0)", (err) => {
        if (err) console.error("Error product_expenses:", err.message);
        else console.log("product_expenses OK");
    });
    db.run("CREATE TABLE IF NOT EXISTS gym_expenses (id TEXT PRIMARY KEY, description TEXT, amount REAL, category TEXT, date TEXT, payment_method TEXT, synced INTEGER DEFAULT 0)", (err) => {
        if (err) console.error("Error gym_expenses:", err.message);
        else console.log("gym_expenses OK");
    });
    db.run("CREATE TABLE IF NOT EXISTS gyms (id TEXT PRIMARY KEY, name TEXT, address TEXT, nuit TEXT, created_at TEXT)", (err) => {
        if (err) console.error("Error gyms:", err.message);
        else console.log("gyms OK");
    });
    db.run("CREATE TABLE IF NOT EXISTS system_users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, role TEXT, gym_id TEXT, sync_id TEXT)", (err) => {
        if (err) console.error("Error system_users:", err.message);
        else console.log("system_users OK");
    });

    // Seed
    db.run("INSERT OR IGNORE INTO system_users (id, email, password, name, role, gym_id) VALUES ('admin_01', 'admin@hefelgym.com', 'admin', 'Administrador Local', 'gym_admin', 'hefel_gym_v1')", (err) => {
        if (err) console.error("Error seed admin:", err.message);
        else console.log("Seed admin OK");
    });

    db.run("INSERT OR IGNORE INTO system_users (id, email, password, name, role) VALUES ('registrar_01', 'register', 'register', 'SaaS Registrar', 'saas_registrar')", (err) => {
        if (err) console.error("Error seed register:", err.message);
        else console.log("Seed register OK");
    });
});
