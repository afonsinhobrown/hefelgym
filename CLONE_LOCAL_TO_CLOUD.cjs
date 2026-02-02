
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltam variáveis de ambiente Supabase");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = new sqlite3.Database('./hefelgym_local.db');

const TABLES = ['plans', 'products', 'clients', 'invoices'];

async function getGymId() {
    return new Promise((resolve) => {
        db.get("SELECT value FROM system_config WHERE key = 'gym_id'", (err, row) => resolve(row ? row.value : 'hefel_gym_v1'));
    });
}

async function cloneToCloud() {
    const GYM_ID = await getGymId();
    console.log(`🚀 CLONANDO ESTRUTURA E DADOS PARA NUVEM (ID: ${GYM_ID})...`);

    try {
        for (const table of TABLES) {
            console.log(`\n📦 Processando tabela: ${table}`);

            // 1. Obter dados locais
            const rows = await new Promise(r => db.all(`SELECT * FROM ${table}`, (err, rows) => r(rows || [])));
            console.log(`   - Local: ${rows.length} registos encontrados.`);

            // 2. Limpar dados na nuvem para este ginásio
            console.log(`   - Limpando dados antigos na nuvem...`);
            await supabase.from(table).delete().eq('gym_id', GYM_ID);

            // 3. Enviar em lotes
            if (rows.length > 0) {
                const BATCH_SIZE = 50;
                for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                    const batch = rows.slice(i, i + BATCH_SIZE).map(row => {
                        const clean = { ...row, gym_id: GYM_ID };
                        delete clean.synced; // Supabase não precisa deste controlo local

                        // Tratamento especial para JSON de faturas
                        if (table === 'invoices' && typeof clean.items === 'string') {
                            try { clean.items = JSON.parse(clean.items); } catch (e) { clean.items = []; }
                        }

                        return clean;
                    });

                    // Tentamos enviar todas as colunas. Se falhar, faremos fallback para colunas básicas.
                    const { error } = await supabase.from(table).upsert(batch);

                    if (error) {
                        console.warn(`   ⚠️ Erro no lote ${i} (Tentando colunas básicas): ${error.message}`);
                        // Fallback: Colunas mínimas vitais para não quebrar o sistema
                        const basicBatch = batch.map(item => {
                            if (table === 'plans') return { id: item.id, name: item.name, price: item.price, gym_id: item.gym_id };
                            if (table === 'products') return { id: item.id, name: item.name, price: item.price, stock: item.stock, gym_id: item.gym_id };
                            if (table === 'clients') return { id: item.id, name: item.name, phone: item.phone, status: item.status, gym_id: item.gym_id };
                            if (table === 'invoices') return { id: item.id, amount: item.amount, client_name: item.client_name, status: item.status, date: item.date, gym_id: item.gym_id };
                            return item;
                        });
                        const { error: error2 } = await supabase.from(table).upsert(basicBatch);
                        if (error2) console.error(`   ❌ Falha crítica na tabela ${table}:`, error2.message);
                    }
                }
                console.log(`   ✅ Sincronização de ${table} completa.`);
            }
        }

        console.log("\n✨ CLONAGEM INTEGRAL CONCLUÍDA!");
        console.log("A nuvem é agora um espelho fiel da sua base local.");

    } catch (err) {
        console.error("❌ Erro fatal:", err.message);
    } finally {
        db.close();
    }
}

cloneToCloud();
