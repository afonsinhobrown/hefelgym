const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();

// Chaves que já confirmámos
const SUPABASE_URL = "https://mxvpguyjybztnqyglwju.supabase.co";
const SUPABASE_KEY = "sb_publishable_lylbjkYUrqqTvXrP50BJvw_BVcp66bF";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para tentar abrir a DB com retentativas se estiver bloqueada
function restore() {
    const db = new sqlite3.Database('./hefelgym_local.db', sqlite3.OPEN_READWRITE, async (err) => {
        if (err) {
            console.error("A base de dados está ocupada. Vou tentar novamente em 2 segundos...");
            setTimeout(restore, 2000);
            return;
        }

        console.log("🌐 Ligado à Nuvem...");
        const { data: cloudInvoices, error } = await supabase.from('invoices').select('client_id, client_name');

        if (error) {
            console.error("Erro Nuvem:", error.message);
            db.close();
            return;
        }

        console.log("✅ Dados das faturas recuperados. Aplicando nomes...");

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            // Usar os nomes das faturas para corrigir os clientes que ficaram só com números
            cloudInvoices.forEach(inv => {
                if (inv.client_id && inv.client_name && !inv.client_name.match(/^[0-9]+$/)) {
                    db.run("UPDATE clients SET name = ? WHERE id = ? AND (name GLOB '[0-9]*' OR name IS NULL)", [inv.client_name, inv.client_id], (uErr) => {
                        if (!uErr) console.log(`[OK] Restaurado: ${inv.client_name}`);
                    });
                }
            });

            db.run("COMMIT", (cErr) => {
                if (cErr) console.error("Erro Commit:", cErr);
                else console.log("--- RESTAURO TERMINADO: NOMES RECUPERADOS ---");
                db.close();
            });
        });
    });
}

restore();
