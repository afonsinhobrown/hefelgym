const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// === CONFIGURAÇÃO SUPABASE ===
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERRO CRÍTICO: Variáveis SUPABASE_URL ou SUPABASE_KEY em falta!');
    // Não crashar, apenas logar, para permitir debug se necessário
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('✅ Supabase conectado');

// === SERVIR FRONTEND (BUILD) ===
// Serve ficheiros estáticos da pasta dist na raiz do projeto (um nível acima de server/)
app.use(express.static(path.join(__dirname, '../dist')));

// === CORS E MIDDLEWARE ===
app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Log
app.use((req, res, next) => {
    if (!req.path.startsWith('/assets')) console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// === ROTAS API ===
app.get('/api/status', (req, res) => res.json({ status: 'online', mode: 'web-service', timestamp: new Date() }));

app.get('/api/clients', async (req, res) => {
    try {
        const { gymId } = req.query;
        let query = supabase.from('clients').select('*');
        if (gymId) query = query.eq('gym_id', gymId);
        const { data, error } = await query.order('name');
        if (error) throw error;
        res.json(data || []);
    } catch (e) {
        console.error("Erro GET Clients:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const client = req.body;
        const { error } = await supabase.from('clients').upsert({
            ...client,
            id: client.id || uuidv4(),
            gym_id: client.gym_id || 'hefel_gym_v1'
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error("Erro POST Client:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/system-users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('system_users').select('*');
        if (error) throw error;
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/system-users', async (req, res) => {
    try {
        const user = req.body;
        const { error } = await supabase.from('system_users').upsert({
            ...user,
            id: user.id || uuidv4()
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/plans', async (req, res) => {
    try {
        const { data, error } = await supabase.from('plans').select('*');
        if (error) throw error;
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/invoices', async (req, res) => {
    try {
        const { clientId } = req.query;
        let query = supabase.from('invoices').select('*');
        if (clientId) query = query.eq('client_id', clientId);
        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/invoices', async (req, res) => {
    try {
        const inv = req.body;
        const { error } = await supabase.from('invoices').upsert({
            ...inv,
            id: inv.id || uuidv4(),
            items: typeof inv.items === 'string' ? inv.items : JSON.stringify(inv.items || [])
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// === ROTA CATCH-ALL (PARA SPA/REACT) ===
// Qualquer rota que não seja /api deve retornar o index.html
// Express 5 regex fix: usar /(.*)/ para match all
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor Hefel Gym Online na porta ${PORT}`));
