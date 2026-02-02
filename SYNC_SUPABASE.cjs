const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();

const supabase = createClient(
    'https://mxvpguyjybztnqyglwju.supabase.co',
    'sb_publishable_lylbjkYUrqqTvXrP50BJvw_BVcp66bF'
);

const db = new sqlite3.Database('./hefelgym_local.db');

async function syncToSupabase() {
    console.log('🔄 A sincronizar colaboradores para Supabase...');

    // 1. Eliminar todos os registos antigos do Supabase
    console.log('🗑️  A limpar dados antigos do Supabase...');
    const { error: deleteError } = await supabase
        .from('instructors')
        .delete()
        .eq('gym_id', 'hefel_gym_v1');

    if (deleteError) {
        console.error('❌ Erro ao limpar Supabase:', deleteError);
        return;
    }

    console.log('✅ Supabase limpo');

    // 2. Obter os 22 colaboradores corretos do SQLite local
    db.all('SELECT * FROM instructors ORDER BY order_index', [], async (err, rows) => {
        if (err) {
            console.error('❌ Erro ao ler SQLite:', err);
            return;
        }

        console.log(`📊 Encontrados ${rows.length} colaboradores no SQLite local`);

        // 3. Inserir no Supabase
        const instructorsToInsert = rows.map(row => ({
            id: row.id,
            gym_id: 'hefel_gym_v1',
            name: row.name,
            phone: row.phone,
            specialties: row.specialties,
            type: row.type,
            base_salary: row.base_salary || 0,
            extra_hours: row.extra_hours || 0,
            bonus: row.bonus || 0,
            additional_earnings: row.additional_earnings || 0,
            inss_discount: row.inss_discount || 0,
            inss_company: row.inss_company || 0,
            irt_discount: row.irt_discount || 0,
            absences_discount: row.absences_discount || 0,
            other_deductions: row.other_deductions || 0,
            net_salary: row.net_salary || 0,
            balance: row.balance || 0,
            order_index: row.order_index,
            nuit: row.nuit,
            account_number: row.account_number,
            status: 'active'
        }));

        const { data, error } = await supabase
            .from('instructors')
            .insert(instructorsToInsert);

        if (error) {
            console.error('❌ Erro ao inserir no Supabase:', error);
            return;
        }

        console.log(`✅ ${instructorsToInsert.length} colaboradores sincronizados com sucesso!`);
        console.log('🎉 Sincronização completa!');

        db.close();
        process.exit(0);
    });
}

syncToSupabase();
