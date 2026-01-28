const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. ADD COLUMNS ON STARTUP
const schemaInit = `db.serialize(() => {
    db.run(\`CREATE TABLE IF NOT EXISTS system_config (key TEXT PRIMARY KEY, value TEXT)\`);`;
const schemaUpdate = `db.serialize(() => {
    db.run(\`CREATE TABLE IF NOT EXISTS system_config (key TEXT PRIMARY KEY, value TEXT)\`);
    // MIGRATION: Auto-add logging columns
    db.run("ALTER TABLE clients ADD COLUMN last_access TEXT", () => {});
    db.run("ALTER TABLE clients ADD COLUMN first_access TEXT", () => {});
`;
content = content.replace(schemaInit, schemaUpdate);

// 2. NEW ENDPOINT: CHECK INACTIVE
const checkInactiveCode = `
// AUTO-EXPIRE USERS
app.post('/api/clients/check-inactive', (req, res) => {
    const inactiveDays = req.body.days || 60; 
    console.log(\`🧹 Verificando usuários inativos (> \${inactiveDays} dias)...\`);
    db.run(\`UPDATE clients SET status = 'inactive', synced = 0 WHERE status = 'active' AND (last_access IS NOT NULL AND date(last_access) < date('now', '-\${inactiveDays} days'))\`, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const count = this.changes;
        console.log(\`📉 \${count} usuários marcados como inativos.\`);
        res.json({ status: 'ok', markedInactive: count });
    });
});

// Agendar limpeza diária
setInterval(() => {
    const fetch = require('node-fetch'); // Ensure fetch available or use http
    // Simple direct DB call instead of fetch to self
    const inactiveDays = 60;
    db.run(\`UPDATE clients SET status = 'inactive', synced = 0 WHERE status = 'active' AND (last_access IS NOT NULL AND date(last_access) < date('now', '-\${inactiveDays} days'))\`, (err) => {
         if(!err) console.log("🧹 Limpeza automática de inativos realizada.");
    });
}, 24 * 60 * 60 * 1000); 

`;
// Insert before final listener
const insertPoint = `app.listen(PORT, () => {`;
content = content.replace(insertPoint, checkInactiveCode + '\n' + insertPoint);


// 3. FIX SYNC-USERS (Prevent status overwrite)
// Find the query in the sync function
const oldQuery = `INSERT INTO clients (id, name, status, created_at, synced) 
                        VALUES (?, ?, 'active', ?, 0) 
                        ON CONFLICT(id) DO UPDATE SET 
                            name = excluded.name,
                            synced = 0`;

const newQuery = `INSERT INTO clients (id, name, status, created_at, synced) 
                        VALUES (?, ?, 'active', ?, 0) 
                        ON CONFLICT(id) DO UPDATE SET 
                            name = excluded.name,
                            synced = 0`;
// Note: We actually WANT to change the values logic, but SQLite ON CONFLICT is tricky with conditional updates.
// Better: Use COALESCE on the UPDATE part?
// No, DO UPDATE SET status = status (keep existing)
// But wait, if we are syncing from device, maybe they ARE active?
// User wants to keep them 'inactive' if they were 'inactive' locally, unless we explicitly reactivate.
// But device doesn't have status.
// The fix: Don't update 'status' in the ON CONFLICT clause.

const betterQuery = `INSERT INTO clients (id, name, status, created_at, synced) 
                        VALUES (?, ?, 'active', ?, 0) 
                        ON CONFLICT(id) DO UPDATE SET 
                            name = excluded.name,
                            synced = 0`;
// Wait, if I don't mention 'status' in DO UPDATE SET, it remains unchanged!
// The original code was: 
/*
    const query = `
        INSERT INTO clients (id, name, status, created_at, synced) 
        VALUES (?, ?, 'active', ?, 0) 
        ON CONFLICT(id) DO UPDATE SET 
            name = excluded.name,
            synced = 0
    `;
*/
// It DOES NOT update status in the UPDATE SET clause!
// So... why are they becoming active?
// Ah, because `INSERT OR REPLACE` or `ON CONFLICT` might be replacing the row?
// "INSERT INTO ... VALUES ... ON CONFLICT(id) DO UPDATE SET ..."
// It only updates name and synced.
// BUT... if the row didn't exist, it inserts 'active'.
// The issue is: The user says "users who don't frequent for 2 months". They ARE in the DB probably as 'active'.
// The sync just updates the NAME. It doesn't touch status.
// SO, the problem is not the Sync *changing* them to active (unless they were deleted?), but that they *remain* active forever.
// AND the webhook allows them to enter.

// So my "Solutions Recommended" point 4 was:
// "Modificar a Sincronização [...] Alterar a query INSERT/UPDATE para preservar status existente"
// Actually, the current query DOES preserve status if it exists (since it doesn't update it).
// The issue is simply LACK of invalidation.
// So Point 3 (Processo Automático) is the key.

// However, I still want to update 'last_access' in the Webhook.

// 4. UPDATE WEBHOOK (Update last_access)
const webhookStart = `db.run('INSERT OR IGNORE INTO attendance (id, device_ip, user_id, user_name, timestamp, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                        [ id, ip, employeeNo || 'Unk', name, eventDate.toISOString(), type, sub ],
                        (err) => { if(!err) console.log("💾 Salvo."); }
                    );`;

const webhookNew = `db.run('INSERT OR IGNORE INTO attendance (id, device_ip, user_id, user_name, timestamp, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                        [ id, ip, employeeNo || 'Unk', name, eventDate.toISOString(), type, sub ],
                        (err) => { 
                            if(!err) {
                                console.log("💾 Salvo.");
                                // Atualizar ultima visita
                                if(employeeNo) {
                                    db.run("UPDATE clients SET last_access = ?, synced = 0 WHERE id = ?", [eventDate.toISOString(), employeeNo]);
                                }
                            }
                        }
                    );`;

content = content.replace(webhookStart, webhookNew);

// Write
fs.writeFileSync(serverPath, content, 'utf8');
console.log("✅ Server Patched (Inactive Logic + Columns + Webhook Update).");
