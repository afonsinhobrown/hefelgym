
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
    console.log("🔍 Verificando dados no Supabase...");

    const tables = ['products', 'equipment', 'locations', 'tenants'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('gym_id', { count: 'exact' });
        if (error) {
            console.log(`❌ Tabela '${table}': Erro ou não existe - ${error.message}`);
        } else {
            const counts = {};
            data.forEach(row => {
                counts[row.gym_id] = (counts[row.gym_id] || 0) + 1;
            });
            console.log(`✅ Tabela '${table}': ${data.length} registos encontrados.`);
            console.log(`   Distribuição:`, counts);
        }
    }
}

checkData();
