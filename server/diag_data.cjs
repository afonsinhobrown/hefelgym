const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

console.log("--- PROCURANDO DADOS PARA RESTAURO ---");

db.serialize(() => {
    // Procurar por faturas com nomes reais
    db.all("SELECT id, client_id, client_name, date FROM invoices WHERE client_name IS NOT NULL AND client_name != '' LIMIT 10", (err, rows) => {
        if (err) console.error("Erro Invoices:", err);
        else console.log("Faturas com Nomes Reais Encontradas:", rows);
    });

    // Procurar pelos IDs que aparecem na tua imagem (ex: Nadia, que é 00000003 ou similar)
    db.all("SELECT id, name FROM clients WHERE id IN ('0126491748', '0126491908', '00000003', '00000006')", (err, rows) => {
        if (err) console.error("Erro Clients:", err);
        else console.log("Estado Atual dos Clientes Alvo:", rows);
    });
});
