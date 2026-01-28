const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();

const SUPABASE_URL = "https://mxvpguyjybztnqyglwju.supabase.co";
const SUPABASE_KEY = "sb_publishable_lylbjkYUrqqTvXrP50BJvw_BVcp66bF";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const db = new sqlite3.Database('./hefelgym_local.db');

async function restoreNamesFromInvoices() {
    console.log("📥 Buscando nomes reais nas faturas da Nuvem...");

    // Buscar todas as faturas para mapear ID -> Nome
    const { data: invoices, error } = await supabase.from('invoices').select('client_id, client_name');

    if (error) {
        console.error("Erro ao buscar faturas:", error.message);
        return;
    }

    // Criar um mapa de ID -> Nome (mais recente prevalece)
    const nameMap = {};
    invoices.forEach(inv => {
        if (inv.client_id && inv.client_name && !inv.client_name.match(/^[0-9]+$/)) {
            nameMap[inv.client_id] = inv.client_name;
        }
    });

    console.log(`✅ Mapeados ${Object.keys(nameMap).length} nomes únicos.`);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        let count = 0;
        for (const [id, name] of Object.entries(nameMap)) {
            db.run("UPDATE clients SET name = ? WHERE id = ?", [name, id], function (err) {
                if (!err && this.changes > 0) {
                    console.log(`[RESTORED] ${id} -> ${name}`);
                    count++;
                }
            });
        }

        db.run("COMMIT", (err) => {
            if (err) console.error("Erro ao finalizar:", err);
            else console.log(`--- RESTAURO FINALIZADO: ${count} NOMES RECUPERADOS ---`);
            db.close();
        });
    });
}

restoreNamesFromInvoices();
