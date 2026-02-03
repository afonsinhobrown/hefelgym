const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para a base de dados ativa
const dbPath = path.resolve(__dirname, 'hefelgym_local.db');

console.log(`🔌 Conectando à base de dados local: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado com sucesso.');
});

// Comandos de limpeza
const queries = [
    "DELETE FROM invoices",
    "DELETE FROM product_expenses",
    "DELETE FROM gym_expenses",
    "DELETE FROM attendance",
    "DELETE FROM payroll_history",
    "DELETE FROM salary_history"
    // "UPDATE products SET stock = 0" // Descomente se quiser zerar stock
];

db.serialize(() => {
    console.log('🧹 Iniciando limpeza de dados (Vendas, Despesas, Históricos)...');

    db.run("BEGIN TRANSACTION");

    queries.forEach((query) => {
        db.run(query, function (err) {
            if (err) {
                console.error(`❌ Erro ao executar ${query}:`, err.message);
            } else {
                console.log(`✅ Executado: ${query} (Linhas afetadas: ${this.changes})`);
            }
        });
    });

    db.run("COMMIT", (err) => {
        if (err) {
            console.error('❌ Erro ao fazer COMMIT:', err.message);
            db.run("ROLLBACK");
        } else {
            console.log('✨ Limpeza concluída com sucesso! O sistema está pronto para entrega.');
        }
        db.close();
    });
});
