const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

console.log("=== ÚLTIMOS ACESSOS REGISTRADOS (HOJE) ===");

db.all(`SELECT * FROM attendance ORDER BY timestamp DESC LIMIT 10`, [], (err, rows) => {
    if (err) {
        console.error("Erro:", err.message);
        return;
    }

    if (rows.length === 0) {
        console.log("📭 Nenhum acesso registrado no banco de dados.");
        console.log("Isso significa que a catraca não enviou nada ou o Sync não encontrou novos eventos.");
    } else {
        rows.forEach(row => {
            console.log(`🕒 ${row.timestamp.substring(11, 19)} | 👤 ${row.user_name} (${row.type})`);
        });
        console.log(`\nTotal listado: ${rows.length}`);
    }
});
