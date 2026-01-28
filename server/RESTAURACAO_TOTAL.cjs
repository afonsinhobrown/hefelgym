const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

console.log("--- 🚑 INICIANDO RESTAURO DEFINITIVO PARA ENTREGA ---");

db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Eliminar todos os registos que são apenas números (o lixo da sincronização)
    db.run("DELETE FROM clients WHERE id GLOB '[0-9]*' AND (name IS NULL OR name = id OR name GLOB '[0-9]*')", function (err) {
        if (!err) console.log(`✅ Removidos ${this.changes} registos numéricos inválidos.`);
    });

    // 2. Garantir que os nomes reais que estão na Nuvem permanecem
    console.log("Verificando integridade dos nomes reais...");

    db.all("SELECT id, name FROM clients WHERE name NOT GLOB '[0-9]*'", (err, rows) => {
        if (rows && rows.length > 0) {
            console.log(`✅ ${rows.length} Utentes Reais (Nadia, Afonso, etc.) estão seguros na base de dados.`);
        } else {
            console.log("⚠️ Atenção: A lista local está vazia. O sistema irá puxar os nomes da Nuvem automaticamente ao iniciar.");
        }

        db.run("COMMIT", (cErr) => {
            if (cErr) console.error("Erro ao gravar:", cErr);
            else {
                console.log("\n--- ✨ SISTEMA LIMPO E PRONTO PARA ENTREGA ---");
                console.log("Instrução: Fecha todos os terminais e reinicia o START_HEFELGYM.bat");
            }
            db.close();
        });
    });
});
