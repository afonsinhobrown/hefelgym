const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

db.serialize(() => {
    // 1. Log current clients
    db.all("SELECT id, name FROM clients LIMIT 10", (err, rows) => {
        console.log("Current Clients (First 10):", rows);
    });

    // 2. Try to restore names from invoices
    db.all("SELECT DISTINCT client_id, client_name FROM invoices WHERE client_id IS NOT NULL", (err, rows) => {
        if (err || !rows) {
            console.error("Error fetching invoices:", err);
            return;
        }
        console.log(`Found ${rows.length} unique client names in invoices.`);

        rows.forEach(row => {
            db.run("UPDATE clients SET name = ? WHERE id = ?", [row.client_name, row.client_id], function (err) {
                if (!err && this.changes > 0) {
                    console.log(`Restored: ${row.client_id} -> ${row.client_name}`);
                }
            });
        });
    });
});
