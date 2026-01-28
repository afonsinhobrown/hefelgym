const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();

const SUPABASE_URL = "https://mxvpguyjybztnqyglwju.supabase.co";
const SUPABASE_KEY = "sb_publishable_lylbjkYUrqqTvXrP50BJvw_BVcp66bF";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const db = new sqlite3.Database('./hefelgym_local.db');

async function restore() {
    console.log("🌐 Conectando à Nuvem para recuperar nomes...");
    const { data: cloudClients, error } = await supabase.from('clients').select('*');

    if (error) {
        console.error("Erro ao ler nuvem:", error.message);
        return;
    }

    console.log(`✅ Encontrados ${cloudClients.length} clientes na nuvem. Restaurando localmente...`);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        // Limpar os IDs numéricos que estão a causar confusão
        db.run("DELETE FROM clients WHERE name IS NULL OR name = id OR name GLOB '[0-9]*'");

        const stmt = db.prepare(`INSERT OR REPLACE INTO clients (id, name, phone, email, nuit, status, photo_url, created_at, plan_id, synced) VALUES (?,?,?,?,?,?,?,?,?,1)`);

        cloudClients.forEach(c => {
            stmt.run(c.id, c.name, c.phone, c.email, c.nuit, c.status, c.photo_url, c.created_at, c.plan_id);
            console.log(`Restaurado: ${c.name}`);
        });

        stmt.finalize();
        db.run("COMMIT", (err) => {
            if (err) console.error("Erro no Commit:", err);
            else console.log("--- RESTAURO COMPLETO COM SUCESSO ---");
        });
    });
}

restore();
