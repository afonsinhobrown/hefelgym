import { createClient } from '@supabase/supabase-js';

// Tenta ler do .env (se existir)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn("⚠️ Supabase não configurado. Dados reais indisponíveis.");
}

export { supabase };

// Função de Migração de Dados (LocalStorage -> Supabase)
export const migrateToCloud = async () => {
    if (!supabase) return { success: false, error: "Base de dados não conectada no .env" };

    const session = JSON.parse(localStorage.getItem('gymar_session') || '{}');
    const GYM_ID = session?.gymId;
    if (!GYM_ID) return { success: false, error: "Gym ID não encontrado na sessão (Login necessário)" };
    const report = { clients: 0, invoices: 0, products: 0, errors: [] };

    try {
        console.log("🚀 Iniciando Migração para a Nuvem...");

        // 1. Criar/Garantir Tenant (O Ginásio)
        const companyData = JSON.parse(localStorage.getItem('hefel_company_v2') || '{}');
        const { error: tenantError } = await supabase.from('tenants').upsert({
            id: GYM_ID,
            name: companyData.name || 'Hefel Gym',
            owner_email: companyData.email || 'admin@hefelgym.com',
            status: 'active',
            plan: 'Enterprise'
        });

        if (tenantError) throw new Error('Falha ao criar Ginásio: ' + tenantError.message);

        // =================================================================================
        // ESTRATÉGIA "PENTE FINO": Procurar dados em todas as variações de chaves possíveis
        // =================================================================================

        // 1. DEFINIÇÃO DE FONTES DE DADOS
        const SOURCES = {
            clients: ['hefel_clients_v2', 'hefel_clients', 'clients', 'gym_clients'],
            invoices: ['hefel_invoices_v2', 'hefel_invoices', 'invoices', 'gym_invoices'],
            products: ['hefel_products_v2', 'hefel_products', 'products', 'inventory'],
            plans: ['hefel_plans_v2', 'hefel_plans', 'plans'],
            instructors: ['hefel_instructors_v2', 'hefel_instructors', 'instructors'],
            classes: ['hefel_classes_v2', 'hefel_classes', 'classes'],
            trainings: ['hefel_trainings_v2', 'hefel_trainings', 'trainings'],
            attendance: ['hefel_attendance_v2', 'hefel_attendance', 'attendance']
        };

        const extractData = (type) => {
            let data = [];
            const keysToCheck = SOURCES[type] || [];
            keysToCheck.forEach(key => {
                const raw = localStorage.getItem(key);
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            console.log(`🔍 Encontrados ${parsed.length} registos em '${key}'`);
                            data = [...data, ...parsed];
                        }
                    } catch (e) {
                        console.warn(`Erro ao ler key '${key}'`, e);
                    }
                }
            });
            // Remover duplicados por ID (se existir ID)
            const unique = new Map();
            data.forEach(item => {
                if (item.id) unique.set(item.id, item);
                else unique.set(JSON.stringify(item), item); // Fallback para itens sem ID
            });
            return Array.from(unique.values());
        };

        // 2. MIGRAÇÃO DE CLIENTES
        const clientsData = extractData('clients');
        console.log(`📊 Total Clientes Únicos a Migrar: ${clientsData.length}`);

        let clients = clientsData.map(c => ({
            id: c.id,
            gym_id: GYM_ID,
            name: c.name || 'Sem Nome',
            email: c.email || null,
            phone: c.phone || null,
            nuit: c.nuit || null,
            status: c.status || 'active',
            photo_url: c.photo || c.photo_url || null,
            created_at: c.joinDate || c.created_at || new Date().toISOString()
        }));

        if (clients.length > 0) {
            const { error } = await supabase.from('clients').upsert(clients);
            if (error) report.errors.push('Erro Clientes: ' + error.message);
            else report.clients = clients.length;
        }

        // 3. MIGRAÇÃO DE PLANOS
        const plansData = extractData('plans');
        let plans = plansData.map(p => ({
            id: p.id,
            gym_id: GYM_ID,
            name: p.name || 'Plano Sem Nome',
            price: parseFloat(p.price || 0),
            duration_months: parseInt(p.duration || p.duration_months || 1),
            features: p.features || []
        }));
        if (plans.length > 0) {
            await supabase.from('plans').upsert(plans);
            report.plans = plans.length;
        }

        // 4. MIGRAÇÃO DE PRODUTOS
        const productsData = extractData('products');
        let products = productsData.map(p => ({
            id: p.id,
            gym_id: GYM_ID,
            name: p.name || 'Produto',
            price: parseFloat(p.price || 0),
            stock: parseInt(p.stock || 0),
            category: p.category || 'Geral'
        }));
        if (products.length > 0) {
            await supabase.from('products').upsert(products);
            report.products = products.length;
        }

        // 5. MIGRAÇÃO DE FATURAS (Crítico)
        const invoicesData = extractData('invoices');
        console.log(`📊 Total Faturas Únicas a Migrar: ${invoicesData.length}`);

        let invoices = invoicesData.map(inv => ({
            id: inv.id,
            gym_id: GYM_ID,
            client_id: inv.clientId || inv.client_id || 'unknown',
            client_name: inv.clientName || inv.client_name || 'Desconhecido',
            amount: parseFloat(inv.total || inv.amount || 0),
            status: inv.status || 'pending',
            items: inv.items || [],
            payment_method: inv.paymentMethod || inv.payment_method || (inv.paymentData ? inv.paymentData.method : 'unknown'),
            date: inv.date ? new Date(inv.date).toISOString() : new Date().toISOString()
        }));

        if (invoices.length > 0) {
            const { error } = await supabase.from('invoices').upsert(invoices);
            if (error) report.errors.push('Erro Faturas: ' + error.message);
            else report.invoices = invoices.length;
        } else {
            report.errors.push("⚠️ NENHUMA FATURA ENCONTRADA! Verifique logs.");
        }

        // 6. MIGRAÇÃO DE INSTRUTORES
        const instructorsData = extractData('instructors');
        let instructors = instructorsData.map(i => ({
            id: i.id, gym_id: GYM_ID, name: i.name || 'Instrutor', email: i.email, phone: i.phone, specialties: i.specialty
        }));
        if (instructors.length > 0) {
            await supabase.from('instructors').upsert(instructors);
            report.instructors = instructors.length;
        }

        // 7. MIGRAÇÃO DE AULAS
        const classesData = extractData('classes');
        let classes = classesData.map(c => ({
            id: c.id, gym_id: GYM_ID, title: c.name || c.title || 'Aula', instructor_id: c.instructorId, day_of_week: c.day,
            created_at: new Date().toISOString()
        }));
        if (classes.length > 0) {
            await supabase.from('classes').upsert(classes);
            report.classes = classes.length;
        }

        // 8. MIGRAÇÃO DE TREINOS
        const trainingsData = extractData('trainings');
        let trainings = trainingsData.map(t => ({
            id: t.id, gym_id: GYM_ID, client_id: t.studentId, title: t.name, exercises: t.exercises
        }));
        if (trainings.length > 0) {
            await supabase.from('trainings').upsert(trainings);
            report.trainings = trainings.length;
        }

        // 9. MIGRAÇÃO DE ASSIDUIDADE
        const attendanceData = extractData('attendance');
        let attendance = attendanceData.map(a => ({
            gym_id: GYM_ID, client_id: a.studentId || a.clientId, check_in: a.date || a.timestamp || new Date().toISOString(), method: 'qr_code'
        }));
        if (attendance.length > 0) {
            await supabase.from('attendance').upsert(attendance);
            report.attendance = attendance.length;
        }

        return { success: true, report };

    } catch (e) {
        console.error("Erro fatal na migração:", e);
        return { success: false, error: e.message, report };
    }
};
