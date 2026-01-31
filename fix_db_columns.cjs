const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'hefelgym_local.db');
const db = new sqlite3.Database(dbPath);

const tables = {
    products: ['photo_url', 'cost_price', 'location_id', 'gym_id'],
    gym_expenses: ['responsible', 'status', 'payment_method', 'title', 'is_fixed', 'gym_id'],
    equipment: ['photo_url', 'gym_id'],
    invoices: ['gym_id', 'tax_amount']
};

db.serialize(() => {
    Object.keys(tables).forEach(table => {
        const columns = tables[table];
        columns.forEach(col => {
            const sql = `ALTER TABLE ${table} ADD COLUMN ${col} TEXT`; // Using TEXT for simplicity in migration
            db.run(sql, (err) => {
                if (err) {
                    if (err.message.includes('duplicate column name')) {
                        console.log(`[OK] Column ${col} already exists in ${table}`);
                    } else {
                        console.error(`[ERROR] ${table}.${col}: ${err.message}`);
                    }
                } else {
                    console.log(`[ADDED] Column ${col} to ${table}`);
                }
            });
        });
    });
});

setTimeout(() => db.close(), 3000);
