const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

db.serialize(() => {
    console.log("🧹 LIMPANDO REGISTOS NUMÉRICOS INVÁLIDOS...");

    // Apagar todos os utentes onde o nome é igual ao ID ou é apenas um número longo
    db.run("DELETE FROM clients WHERE name GLOB '[0-9]*' OR name = id", function (err) {
        if (err) console.error("Erro ao limpar:", err);
        else console.log(`\n🗑️ Removidos ${this.changes} registos de IDs sem nome.`);
    });

    // Verificar quantos nomes reais restaram e mostrá-los
    db.all("SELECT id, name FROM clients WHERE name NOT GLOB '[0-9]*' AND name IS NOT NULL", (err, rows) => {
        if (err) {
            console.error("Erro ao listar:", err);
            return;
        }
        console.log("\n--- UTENTES COM NOMES REAIS RESTAURADOS ---");
        if (rows.length === 0) {
            console.log("Atenção: Nenhum nome real encontrado localmente. Será necessário novo restauro da nuvem.");
        } else {
            rows.forEach(r => console.log(`✅ ID: ${r.id} | NOME: ${r.name}`));
        }
        console.log("------------------------------------------");
        console.log("\nPor favor, recarrega a página no navegador.");
    });
});
