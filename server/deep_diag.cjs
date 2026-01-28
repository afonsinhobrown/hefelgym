const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

console.log("--- DIAGNÓSTICO PROFUNDO: UTENTE 0126491748 ---");

db.serialize(() => {
    // 1. Ver como ele está na tabela de clientes
    db.get("SELECT * FROM clients WHERE id = '0126491748'", (err, row) => {
        console.log("\n[TABELA CLIENTES]:", row || "NÃO ENCONTRADO");
    });

    // 2. Ver se existem faturas com este ID e que nome está lá
    db.all("SELECT id, client_name, date FROM invoices WHERE client_id = '0126491748' OR client_name LIKE '%0126491748%'", (err, rows) => {
        console.log("\n[TABELA FATURAS (Histórico)]: Encontradas", rows ? rows.length : 0, "faturas.");
        if (rows) rows.forEach(r => console.log(`- Fatura ${r.id}: Nome Gravado = "${r.client_name}"`));
    });

    // 3. Ver quantos utentes existem no total com nomes puramente numéricos
    db.all("SELECT count(*) as total FROM clients WHERE name GLOB '[0-9]*'", (err, row) => {
        console.log("\n[RESUMO]: Existem", row[0].total, "utentes com IDs no lugar de Nomes.");
    });
});
