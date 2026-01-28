const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'hefelgym_local.db'); // Fixed path
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, name, email, password, role, gym_id FROM system_users", [], (err, rows) => {
    if (err) {
        console.error("Error reading users:", err);
    } else {
        console.log("Current System Users:");
        console.table(rows);
    }
    db.all("SELECT id, name FROM gyms", [], (err, rows) => {
        if (err) console.error("Error gyms:", err);
        else {
            console.log("\nRegistered Gyms:");
            console.table(rows);
        }
        db.close();
    });
});
