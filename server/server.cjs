const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const EventEmitter = require('events');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// === CONFIGURAÇÃO SUPABASE ===
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_KEY não configuradas!');
    console.error('Adicione no Render Dashboard:');
    console.error('1. SUPABASE_URL = sua-url.supabase.co');
    console.error('2. SUPABASE_KEY = sua-chave-serviço');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('✅ Supabase conectado com sucesso!');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// === LOG DE REQUISIÇÕES ===
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    }
    next();
});

// === ROTAS BÁSICAS ===
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Hefel Gym API',
        mode: 'cloud-only',
        timestamp: new Date().toISOString(),
        database: 'Supabase'
    });
});

app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
        res.json({
            status: 'healthy',
            database: error ? 'disconnected' : 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (err) {
        res.status(500).json({ status: 'unhealthy', error: err.message });
    }
});

// === ROTAS DE AUTENTICAÇÃO ===
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: users, error } = await supabase
            .from('system_users')
            .select('*, gyms(name, address, nuit)')
            .eq('email', email)
            .eq('password', password)
            .limit(1);

        if (error || !users || users.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = users[0];
        const gym = user.gyms || {};

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                gymId: user.gym_id,
                gym_name: gym.name || 'Ginásio'
            },
            company: {
                name: gym.name || 'Ginásio',
                address: gym.address || '',
                nuit: gym.nuit || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// === ROTAS DE CLIENTES ===
app.get('/api/clients', async (req, res) => {
    try {
        const { gymId, search } = req.query;
        let query = supabase.from('clients').select('*');
        if (gymId) query = query.eq('gym_id', gymId);
        if (search) query = query.ilike('name', `%${search}%`);
        query = query.order('name', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const client = req.body;
        const clientId = client.id || uuidv4();
        const { error } = await supabase
            .from('clients')
            .upsert({
                id: clientId,
                name: client.name,
                phone: client.phone,
                email: client.email,
                nuit: client.nuit,
                status: client.status || 'active',
                photo_url: client.photo_url,
                plan_id: client.plan_id,
                created_at: client.created_at || new Date().toISOString(),
                last_access: client.last_access,
                gym_id: client.gym_id || 'hefel_gym_v1'
            });
        if (error) throw error;
        res.json({ success: true, id: clientId, message: 'Cliente salvo com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true, message: 'Cliente excluído' });
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        res.status(500).json({ error: error.message });
    }
});

// === ROTAS DE FATURAS ===
app.get('/api/invoices', async (req, res) => {
    try {
        const { clientId, gymId, status } = req.query;
        let query = supabase.from('invoices').select('*');
        if (clientId) query = query.eq('client_id', clientId);
        if (gymId) query = query.eq('gym_id', gymId);
        if (status) query = query.eq('status', status);
        query = query.order('date', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        const processed = (data || []).map(invoice => ({
            ...invoice,
            items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
        }));
        res.json(processed);
    } catch (error) {
        console.error('Erro ao buscar faturas:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/invoices', async (req, res) => {
    try {
        const invoice = req.body;
        const invoiceId = invoice.id || uuidv4();
        const { error } = await supabase
            .from('invoices')
            .upsert({
                id: invoiceId,
                client_id: invoice.client_id,
                client_name: invoice.client_name,
                amount: invoice.amount,
                status: invoice.status || 'pendente',
                items: JSON.stringify(invoice.items || []),
                date: invoice.date || new Date().toISOString(),
                payment_method: invoice.payment_method,
                tax_amount: invoice.tax_amount || 0,
                gym_id: invoice.gym_id || 'hefel_gym_v1'
            });
        if (error) throw error;
        res.json({ success: true, id: invoiceId, message: 'Fatura criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar fatura:', error);
        res.status(500).json({ error: error.message });
    }
});

// === ROTAS DE PLANOS ===
app.get('/api/plans', async (req, res) => {
    try {
        const { gymId } = req.query;
        let query = supabase.from('plans').select('*');
        if (gymId) query = query.eq('gym_id', gymId);
        query = query.order('price', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === ROTAS DE PRODUTOS/INVENTÁRIO ===
app.get('/api/inventory', async (req, res) => {
    try {
        const { gymId } = req.query;
        let query = supabase.from('products').select('*');
        if (gymId) query = query.eq('gym_id', gymId);
        query = query.order('name', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === ROTA DE REGISTRO DE GINÁSIO (SAAS) ===
app.post('/api/admin/register-gym', async (req, res) => {
    try {
        const { gymName, gymAddress, gymNuit, adminName, adminEmail, adminPassword } = req.body;
        const gymId = uuidv4();
        const adminId = uuidv4();
        const { error: gymError } = await supabase.from('gyms').upsert({
            id: gymId, name: gymName, address: gymAddress, nuit: gymNuit, created_at: new Date().toISOString()
        });
        if (gymError) throw gymError;
        const { error: userError } = await supabase.from('system_users').upsert({
            id: adminId, email: adminEmail, password: adminPassword, name: adminName, role: 'gym_admin', gym_id: gymId
        });
        if (userError) throw userError;
        res.json({ success: true, gymId, message: 'Ginásio criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
    console.log(`🚀 Servidor Hefel Gym rodando na porta ${PORT}`);
    console.log(`📊 Modo: Cloud-Only (Supabase)`);
});
