const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

db.serialize(() => {
    console.log("🛠️ Iniciando migração de banco de dados...");

    // 1. Adicionar colunas na tabela clients
    const columnsToAdd = [
        { name: 'last_access', type: 'TEXT' },
        { name: 'first_access', type: 'TEXT' }
    ];

    columnsToAdd.forEach(col => {
        db.run(`ALTER TABLE clients ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`ℹ️ Coluna '${col.name}' já existe em 'clients'.`);
                } else {
                    console.error(`❌ Erro ao adicionar '${col.name}':`, err.message);
                }
            } else {
                console.log(`✅ Coluna '${col.name}' adicionada com sucesso em 'clients'.`);
            }
        });
    });

    console.log("🏁 Migração concluída.");
});
