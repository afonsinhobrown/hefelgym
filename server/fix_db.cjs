const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

db.serialize(() => {
    // 1. Criar a tabela 'attendance' se não existir
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY, 
        device_ip TEXT, 
        user_id TEXT, 
        user_name TEXT, 
        timestamp TEXT, 
        type TEXT, 
        method TEXT, 
        synced INTEGER DEFAULT 0
    )`, (err) => {
        if (err) console.error("Erro ao criar tabela:", err.message);
        else console.log("✅ Tabela 'attendance' verificada/criada com sucesso.");
    });

    // 2. Verificar se existe (listar tabelas)
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) console.error("Erro ao listar:", err);
        else {
            console.log("📂 Tabelas existentes no banco:");
            rows.forEach(r => console.log(" - " + r.name));

            const exists = rows.find(r => r.name === 'attendance');
            if (exists) console.log("🎉 CONFIRMADO: Tabela 'attendance' EXISTE agora.");
            else console.log("❌ ERRO CRÍTICO: Tabela ainda não existe.");
        }
    });
});
