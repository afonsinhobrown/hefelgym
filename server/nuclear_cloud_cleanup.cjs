const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = "https://mxvpguyjybztnqyglwju.supabase.co";
const SUPABASE_KEY = "sb_publishable_lylbjkYUrqqTvXrP50BJvw_BVcp66bF";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function nuclearCleanup() {
    console.log("🚀 INICIANDO LIMPEZA NUCLEAR NA NUVEM...");

    // 1. Identificar quem são os "falsos" (nomes que são apenas números)
    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('gym_id', 'hefel_gym_v1');

    if (error) {
        console.error("Erro ao ler nuvem:", error);
        return;
    }

    const junkIds = clients
        .filter(c => c.name && c.name.match(/^[0-9]+$/))
        .map(c => c.id);

    console.log(`🔎 Encontrados ${junkIds.length} registos corrompidos na nuvem.`);

    if (junkIds.length > 0) {
        // 2. Apagar da nuvem
        const { error: delError } = await supabase
            .from('clients')
            .delete()
            .in('id', junkIds);

        if (delError) console.error("Erro ao apagar na nuvem:", delError);
        else console.log("✅ Nuvem limpa com sucesso!");
    } else {
        console.log("Nenhum lixo encontrado na nuvem sob o filtro de números.");
    }

    console.log("\n--- NOMES REAIS QUE SOBREVIVERAM NA NUVEM ---");
    clients.filter(c => !c.name || !c.name.match(/^[0-9]+$/)).forEach(c => console.log(`- ${c.name}`));
}

nuclearCleanup();
