require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const db = new sqlite3.Database('./hefelgym_local.db');

async function getAllTables() {
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, tables) => {
            if (err) reject(err);
            else resolve(tables.map(t => t.name));
        });
    });
}

async function getTableData(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function syncAllData() {
    try {
        console.log('🔄 A sincronizar TODOS os dados para Supabase...\n');

        const tables = await getAllTables();

        for (const table of tables) {
            const rows = await getTableData(table);

            if (rows.length === 0) {
                console.log(`⏭️  ${table}: Vazia, a saltar...`);
                continue;
            }

            // Limpar dados antigos
            const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (deleteError && !deleteError.message.includes('does not exist')) {
                console.log(`⚠️  ${table}: Erro ao limpar - ${deleteError.message}`);
            }

            // Inserir novos dados em lotes de 100
            const batchSize = 100;
            let inserted = 0;

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);

                const { data, error } = await supabase
                    .from(table)
                    .insert(batch);

                if (error) {
                    console.log(`❌ ${table}: Erro no lote ${Math.floor(i / batchSize) + 1} - ${error.message}`);
                    break;
                } else {
                    inserted += batch.length;
                }
            }

            if (inserted > 0) {
                console.log(`✅ ${table}: ${inserted}/${rows.length} registos sincronizados`);
            }
        }

        console.log('\n🎉 Sincronização completa!');

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        db.close();
    }
}

syncAllData();
