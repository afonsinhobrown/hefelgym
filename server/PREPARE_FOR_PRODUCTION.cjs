const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Caminho CORRETO (Raiz do projeto)
// Subimos um nível (..) porque o script está na pasta /server
const dbPath = path.resolve(__dirname, '../hefelgym_local.db');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.resolve(__dirname, `../hefelgym_PRODUCTION_BACKUP_${timestamp}.db`);

console.log("--------------------------------------------------");
console.log("🎯 ALVO: " + dbPath);
console.log("--------------------------------------------------");

// 2. Backup de Segurança na Raiz
try {
    if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        console.log(`✅ BACKUP CRIADO NA RAIZ: ${path.basename(backupPath)}`);
    } else {
        console.error("❌ ERRO: Não encontrei a base de dados na raiz.");
        process.exit(1);
    }
} catch (err) {
    console.error("❌ ERRO NO BACKUP:", err);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

// Tabelas financeiras para limpar
const tablesToClear = ['invoices', 'gym_expenses', 'product_expenses'];

db.serialize(() => {
    console.log("🧹 A limpar apenas o histórico financeiro de teste...");

    db.run("BEGIN TRANSACTION");

    tablesToClear.forEach(table => {
        db.run(`DELETE FROM ${table}`, (err) => {
            if (err) console.error(`❌ Erro em ${table}:`, err.message);
            else console.log(`✅ Tabela ${table} limpa.`);
        });
        db.run(`DELETE FROM sqlite_sequence WHERE name = '${table}'`, () => { });
    });

    // Resetar Saldos Financeiros (Sem apagar as pessoas)
    db.run("UPDATE instructors SET balance = 0, absences_discount = 0", (err) => {
        if (!err) console.log("✅ Saldos de Instrutores ZERADOS.");
    });

    db.run("UPDATE clients SET status = 'active'", (err) => {
        // Opcional: Resetar status ou saldo se existir
    });

    // Manter utentes e entradas intactos
    db.run("COMMIT", (err) => {
        if (err) {
            console.error("❌ ERRO AO SALVAR:");
        } else {
            console.log("\n✨ SUCESSO!");
            console.log("O script limpou a base de dados da Raiz (a de 2.6MB).");
            console.log("Os Utentes e os Acessos das Catracas foram PRESERVADOS.");
        }
        db.close();
    });
});
