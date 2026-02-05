
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
    console.log("🔍 Verificando dados no Supabase...");

    const gymTables = ['products', 'equipment', 'locations'];

    // Check tables that must have gym_id
    for (const table of gymTables) {
        try {
            const { data, error } = await supabase.from(table).select('gym_id');
            if (error) {
                console.log(`❌ Tabela '${table}': Erro - ${error.message}`);
            } else {
                console.log(`✅ Tabela '${table}': ${data.length} registos (gym_id validado).`);
            }
        } catch (e) {
            console.log(`❌ Tabela '${table}': Exceção - ${e.message}`);
        }
    }

    // Check tenants (uses id)
    const { data: tenants, error: tError } = await supabase.from('tenants').select('id');
    if (tError) console.log(`❌ Tabela 'tenants': Erro - ${tError.message}`);
    else console.log(`✅ Tabela 'tenants': ${tenants.length} registos.`);
}

checkData();
