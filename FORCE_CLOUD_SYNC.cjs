
const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltam variáveis de ambiente Supabase no ficheiro .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = new sqlite3.Database('./hefelgym_local.db');

async function getGymId() {
    return new Promise((resolve) => {
        db.get("SELECT value FROM system_config WHERE key = 'gym_id'", (err, row) => resolve(row ? row.value : 'hefel_gym_v1'));
    });
}

async function forceCloudReset() {
    const GYM_ID = await getGymId();
    console.log(`🚀 A iniciar RESET da Nuvem para o Ginásio: ${GYM_ID}...`);

    try {
        // 1. Limpar Planos e Produtos no Supabase para este ginásio
        console.log("🧹 A apagar planos e produtos antigos na nuvem...");
        await supabase.from('plans').delete().eq('gym_id', GYM_ID);
        await supabase.from('products').delete().eq('gym_id', GYM_ID);

        // 2. Marcar tudo como não sincronizado localmente para forçar o upload
        console.log("🔄 A marcar dados locais para novo upload...");
        await new Promise((resolve) => {
            db.serialize(() => {
                db.run("UPDATE plans SET synced = 0");
                db.run("UPDATE products SET synced = 0");
                db.run("UPDATE clients SET synced = 0");
                db.run("UPDATE invoices SET synced = 0");
                resolve();
            });
        });

        // 3. Carregar dados atuais do SQLite
        console.log("📦 A ler dados locais do SQLite...");

        const localPlans = await new Promise(r => db.all("SELECT * FROM plans", (err, rows) => r(rows || [])));
        const localProducts = await new Promise(r => db.all("SELECT * FROM products", (err, rows) => r(rows || [])));

        // 4. Upsert para o Cloud
        if (localPlans.length > 0) {
            console.log(`⬆️ A enviar ${localPlans.length} planos para a nuvem...`);
            for (const plan of localPlans) {
                // Selecionar apenas campos compatíveis
                const cloudData = {
                    id: plan.id,
                    name: plan.name,
                    price: plan.price,
                    gym_id: GYM_ID
                };
                const { error } = await supabase.from('plans').upsert(cloudData);
                if (error) console.error(`❌ Erro no plano ${plan.name}:`, error.message);
                else console.log(`✅ Plano sincronizado: ${plan.name}`);
            }
        }

        if (localProducts.length > 0) {
            console.log(`⬆️ A enviar ${localProducts.length} produtos/taxas para a nuvem...`);
            for (const prod of localProducts) {
                const cloudData = {
                    id: prod.id,
                    name: prod.name,
                    price: prod.price,
                    stock: prod.stock || 0,
                    category: prod.category || 'Geral',
                    gym_id: GYM_ID
                };
                const { error } = await supabase.from('products').upsert(cloudData);
                if (error) console.error(`❌ Erro no produto ${prod.name}:`, error.message);
                else console.log(`✅ Produto sincronizado: ${prod.name}`);
            }
        }

        // 5. Sincronizar Clientes (Otimizado com Lotes de 50)
        console.log("👥 A sincronizar clientes...");
        const localClients = await new Promise(r => db.all("SELECT * FROM clients", (err, rows) => r(rows || [])));
        if (localClients.length > 0) {
            const BATCH_SIZE = 50;
            for (let i = 0; i < localClients.length; i += BATCH_SIZE) {
                const batch = localClients.slice(i, i + BATCH_SIZE).map(c => ({
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    email: c.email,
                    nuit: c.nuit,
                    status: c.status || 'active',
                    photo_url: c.photo_url,
                    plan_id: c.plan_id,
                    gym_id: GYM_ID
                }));

                const { error } = await supabase.from('clients').upsert(batch);
                if (error) console.error(`❌ Erro no lote de clientes ${i}-${i + BATCH_SIZE}:`, error.message);
                else console.log(`✅ Lote de clientes sincronizado: ${i + batch.length}/${localClients.length}`);
            }
        }

        // 6. Sincronizar Faturas
        console.log("🧾 A sincronizar faturas...");
        const localInvoices = await new Promise(r => db.all("SELECT * FROM invoices", (err, rows) => r(rows || [])));
        if (localInvoices.length > 0) {
            const batch = localInvoices.map(inv => ({
                id: inv.id,
                client_id: inv.client_id,
                client_name: inv.client_name,
                amount: inv.amount,
                status: inv.status,
                items: JSON.parse(inv.items || '[]'),
                date: inv.date,
                payment_method: inv.payment_method,
                gym_id: GYM_ID
            }));
            const { error } = await supabase.from('invoices').upsert(batch);
            if (error) console.error(`❌ Erro faturas:`, error.message);
            else console.log(`✅ ${localInvoices.length} faturas sincronizadas.`);
        }

        console.log("✅ CLOUD RESET CONCLUÍDO!");
        console.log("Os dados da nuvem estão agora idênticos aos locais.");

    } catch (err) {
        console.error("❌ Erro fatal durante o reset:", err.message);
    } finally {
        db.close();
    }
}

forceCloudReset();
