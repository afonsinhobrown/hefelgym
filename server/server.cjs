const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // Importação adicionada
const { createClient } = require('@supabase/supabase-js');
const EventEmitter = require('events');
const os = require('os');
const net = require('net');
const http = require('http');
require('dotenv').config();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

// === WHATSAPP MODULE (LOCAL INFRA) ===
let sock;
let qrCodeAuth;
const qrEmitter = new EventEmitter();

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Fix deprecation warning
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeAuth = qr;
            qrEmitter.emit('qr', qr);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('WhatsApp fechado. Reconectar?', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Conectado com Sucesso!');
            qrCodeAuth = null;
            qrEmitter.emit('connected', true);
        }
    });
}
// Iniciar WhatsApp
// Iniciar WhatsApp
connectToWhatsApp();

app.post('/api/whatsapp/send', async (req, res) => {
    const { number, message } = req.body;
    if (!sock) return res.status(503).json({ error: 'WhatsApp Initializing...' });

    // Verificar se está conectado (opcional, mas bom check)
    // if (!qrCodeAuth && !sock.user) ...

    try {
        // Formatar número (aceita 351912345678 ou 351912345678@s.whatsapp.net)
        const jid = number.includes('@s.whatsapp.net') ? number : `${number.replace(/\D/g, '')}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });
        res.json({ status: 'sent', to: jid });
    } catch (e) {
        console.error("Erro WhatsApp Send:", e);
        res.status(500).json({ error: e.message });
    }
});


// === HARDWARE / CATRACA MODULE (LOCAL INFRA) ===
const openTurnstile = async (direction = 'entry') => {
    console.log(`🔓 CATRACA: Abrindo para ${direction.toUpperCase()}...`);
    return true;
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// === DATABASE SETUP (REAL LOCAL SQLITE) ===
const db = new sqlite3.Database('./hefelgym_local.db', (err) => {
    if (err) console.error("❌ Erro ao abrir SQLite:", err.message);
    else console.log("✅ Conectado ao SQLite Local (hefelgym_local.db)");
});

// Log de Diagnóstico para ver se as rotas estão a ser atingidas
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    }
    next();
});

app.post('/send-message', async (req, res) => {
    // Alias for compatibility
    const { number, message } = req.body;
    if (!sock) return res.status(503).json({ error: 'WhatsApp Initializing...' });
    try {
        const jid = number.includes('@s.whatsapp.net') ? number : `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        res.json({ status: 'sent' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/send-file', async (req, res) => {
    const { number, fileBase64, fileName, caption } = req.body;
    if (!sock) return res.status(503).json({ error: 'WhatsApp Initializing...' });
    try {
        const jid = number.includes('@s.whatsapp.net') ? number : `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        // Handle Base64 (strip prefix if present)
        const base64Data = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
        const buffer = Buffer.from(base64Data, 'base64');

        await sock.sendMessage(jid, {
            document: buffer,
            mimetype: 'application/pdf',
            fileName: fileName || 'document.pdf',
            caption: caption
        });
        res.json({ status: 'sent' });
    } catch (e) {
        console.error("Erro Send File:", e);
        res.status(500).json({ error: e.message });
    }
});

// Schema Initialization
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS system_config (key TEXT PRIMARY KEY, value TEXT)`);
    // Ensure synced defaults to 0 for local changes to push
    db.run(`CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, nuit TEXT, status TEXT, photo_url TEXT, plan_id TEXT, created_at TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, price REAL, cost_price REAL DEFAULT 0, stock INTEGER, category TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, client_id TEXT, client_name TEXT, amount REAL, status TEXT, items TEXT, date TEXT, payment_method TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, name TEXT, price REAL, duration INTEGER, features TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS saas_subscriptions (gym_id TEXT PRIMARY KEY, plan_name TEXT, license_fee REAL, status TEXT, last_payment_date TEXT, next_payment_due TEXT, features TEXT, synced INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS access_devices (id TEXT PRIMARY KEY, name TEXT, ip TEXT, port INTEGER, username TEXT, password TEXT, type TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS instructors (id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, specialties TEXT, contract_type TEXT, commission REAL, balance REAL DEFAULT 0, status TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, device_ip TEXT, user_id TEXT, user_name TEXT, timestamp TEXT, type TEXT, method TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS product_expenses (id TEXT PRIMARY KEY, product_id TEXT, product_name TEXT, quantity INTEGER, unit_cost REAL, total_cost REAL, date TEXT, supplier TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS gym_expenses (id TEXT PRIMARY KEY, description TEXT, amount REAL, category TEXT, date TEXT, payment_method TEXT, synced INTEGER DEFAULT 0)`);

    // Migrations Safety Check
    // Add columns if they don't exist
    // sqlite3 doesn't have IF NOT EXISTS for columns, need to check or swallow error
    db.run("ALTER TABLE clients ADD COLUMN last_access TEXT", () => { }); // Swallow error if exists
    db.run("ALTER TABLE clients ADD COLUMN plan_id TEXT", () => { });
    db.run("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0", () => { });

    // === MULTI-TENANCY MIGRATION ===
    // Adicionar gym_id a todas as tabelas operacionais
    const tablesToMigrate = ['clients', 'products', 'invoices', 'plans', 'access_devices', 'instructors', 'attendance', 'product_expenses', 'gym_expenses'];
    tablesToMigrate.forEach(table => {
        db.run(`ALTER TABLE ${table} ADD COLUMN gym_id TEXT DEFAULT 'hefel_gym_v1'`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error adding gym_id to ${table}:`, err.message);
            }
        });
    });
    // ===============================

    // ADD INDEXES FOR PERFORMANCE
    db.run("CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_prod_expenses_prod ON product_expenses(product_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_gym_id_clients ON clients(gym_id)"); // New Index

    // Migrações de Faturamento
    db.run(`CREATE TABLE IF NOT EXISTS gyms (id TEXT PRIMARY KEY, name TEXT, address TEXT, nuit TEXT, phone TEXT, email TEXT, logo_url TEXT, created_at TEXT, synced INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS system_users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, role TEXT, gym_id TEXT, sync_id TEXT, synced INTEGER DEFAULT 0)`);

    // 0. SEED: DEFAULT GYM (Hefel Gym Teste)
    db.get("SELECT id FROM gyms WHERE id = 'hefel_gym_v1'", (err, row) => {
        if (!row) {
            const now = new Date().toISOString();
            db.run("INSERT INTO gyms (id, name, address, nuit, created_at) VALUES ('hefel_gym_v1', 'Hefel Gym Teste', 'Maputo, Moçambique', '123456789', ?)", [now]);
            console.log("✅ Ginásio Padrão criado: Hefel Gym Teste");
        }
    });

    // 1. SEED: DEFAULT ADMIN (Local Gym)
    db.get("SELECT id FROM system_users WHERE email = 'admin@hefelgym.com'", (err, row) => {
        if (!row) {
            // Role: gym_admin (Admin que vê tudo)
            db.run("INSERT INTO system_users (id, email, password, name, role, gym_id) VALUES ('admin_01', 'admin@hefelgym.com', 'admin', 'Administrador Local', 'gym_admin', 'hefel_gym_v1')");
            console.log("✅ Admin padrão criado (admin@hefelgym.com / admin)");
        }
    });

    // 2. SEED: SAAS REGISTRAR (User especial p/ criar Ginasios)
    db.get("SELECT id FROM system_users WHERE email = 'register'", (err, row) => {
        if (!row) {
            db.run("INSERT INTO system_users (id, email, password, name, role) VALUES ('registrar_01', 'register', 'register', 'SaaS Registrar', 'saas_registrar')");
            console.log("✅ User Registrar criado (register / register)");
        }
    });

    // 3. SEED: Jorge Garrido (Para garantir estabilidade)
    db.get("SELECT id FROM system_users WHERE email = 'jorge@jorge.com'", (err, row) => {
        if (!row) {
            const jorgeGymId = '367ff0c8-4721-4ea2-807e-9e2067984538';
            db.run("INSERT OR IGNORE INTO gyms (id, name, address, nuit, created_at) VALUES (?, 'Ginásio do Jorge', 'Cidade da Beira', '987654321', ?)", [jorgeGymId, new Date().toISOString()]);
            db.run("INSERT INTO system_users (id, email, password, name, role, gym_id) VALUES ('jorge_01', 'jorge@jorge.com', '12345678', 'Jorge Garrido', 'gym_admin', ?)", [jorgeGymId]);
            console.log("✅ Jorge Garrido SEEDED (jorge@jorge.com / 12345678)");
            setTimeout(syncToCloud, 2000);
        }
    });

    // Migrations
    db.run("ALTER TABLE invoices ADD COLUMN payment_ref TEXT", () => { });
    db.run("ALTER TABLE system_users ADD COLUMN gym_id TEXT", () => { });
    db.run("ALTER TABLE system_users ADD COLUMN synced INTEGER DEFAULT 0", () => { });
    db.run("ALTER TABLE gyms ADD COLUMN synced INTEGER DEFAULT 0", () => { });
});

// === SAAS MODULE (REGISTRO DE GINÁSIOS) ===

// 1. Criar Novo Ginásio + Admin + CLONAR DADOS DE TESTE
app.post('/api/admin/register-gym', (req, res) => {
    const { gymName, gymAddress, gymNuit, adminName, adminEmail, adminPassword, cloneData } = req.body;

    // Default cloneData to true if not specified, per user request "deve herdar"
    const shouldClone = cloneData !== false;

    const gymId = uuidv4();
    const adminId = uuidv4();
    const now = new Date().toISOString();

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        try {
            // 1. Criar Ginásio
            const stmtGym = db.prepare("INSERT INTO gyms (id, name, address, nuit, created_at) VALUES (?, ?, ?, ?, ?)");
            stmtGym.run(gymId, gymName, gymAddress, gymNuit, now);
            stmtGym.finalize();

            // 2. Criar Admin do Ginásio
            const stmtUser = db.prepare("INSERT INTO system_users (id, email, password, name, role, gym_id) VALUES (?, ?, ?, ?, ?, ?)");
            stmtUser.run(adminId, adminEmail, adminPassword, adminName, 'gym_admin', gymId);
            stmtUser.finalize();

            // 3. CLONAGEM DE DADOS (Se solicitado)
            if (shouldClone) {
                const sourceGymId = 'hefel_gym_v1';
                console.log(`🔄 A clonar dados de ${sourceGymId} para ${gymId}...`);

                // Helper para clonar tabela (gera novos UUIDs)
                const cloneTable = (tableName, columnsToCopy) => {
                    db.all(`SELECT ${columnsToCopy.join(', ')} FROM ${tableName} WHERE gym_id = ?`, [sourceGymId], (err, rows) => {
                        if (err) {
                            console.error(`Erro ao ler ${tableName} para clonagem:`, err);
                            return;
                        }
                        if (rows && rows.length > 0) {
                            rows.forEach(row => {
                                const newRecordId = uuidv4();
                                const placeholders = columnsToCopy.map(() => '?').join(', ');
                                const values = columnsToCopy.map(col => row[col]);

                                db.run(`INSERT INTO ${tableName} (id, gym_id, ${columnsToCopy.join(', ')}) VALUES (?, ?, ${placeholders})`,
                                    [newRecordId, gymId, ...values], (insertErr) => {
                                        if (insertErr) console.error(`Erro ao inserir registro clonado em ${tableName}:`, insertErr);
                                    });
                            });
                            console.log(`✅ ${rows.length} registros clonados para ${tableName}.`);
                        } else {
                            console.log(`ℹ️ Nenhuns registos encontrados em ${tableName} para clonar.`);
                        }
                    });
                };

                // Clonar Planos
                cloneTable('plans', ['name', 'price', 'duration', 'features']);

                // Clonar Produtos
                cloneTable('products', ['name', 'price', 'cost_price', 'stock', 'category']);

                // Clonar Instrutores
                cloneTable('instructors', ['name', 'phone', 'email', 'specialties', 'contract_type', 'commission', 'balance', 'status']);

                // Clonar Dispositivos (Catracas)
                cloneTable('access_devices', ['name', 'ip', 'port', 'username', 'password', 'type']);

                // Clonar Clientes
                // Nota: plan_id aqui vai referenciar o plano ANTIGO (do gym teste).
                // Para um sistema robusto, seria necessário um mapeamento de IDs de planos.
                // Para esta versão, copiamos o valor literal do plan_id.
                cloneTable('clients', ['name', 'phone', 'email', 'nuit', 'status', 'photo_url', 'plan_id', 'created_at', 'last_access']);
            }

            db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                    console.error("Erro ao commitar transação:", commitErr);
                    res.status(500).json({ error: "Erro ao criar ginásio: " + commitErr.message });
                } else {
                    res.json({ success: true, gymId, message: "Ginásio, Admin e Dados Base criados com sucesso!" });
                    setTimeout(syncToCloud, 500);
                }
            });

        } catch (err) {
            db.run("ROLLBACK", (rollbackErr) => {
                if (rollbackErr) console.error("Erro ao fazer rollback:", rollbackErr);
            });
            console.error("Erro ao criar ginásio (transação):", err);
            res.status(500).json({ error: "Erro ao criar ginásio: " + err.message });
        }
    });

});

// 2. Listar Ginásios (Para o Registrar ver)
app.get('/api/admin/gyms', (req, res) => {
    db.all("SELECT * FROM gyms ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// === AUTH MODULE (LOCAL) ===
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`
        SELECT u.*, g.name as gym_name, g.address as gym_address, g.nuit as gym_nuit 
        FROM system_users u 
        LEFT JOIN gyms g ON u.gym_id = g.id 
        WHERE u.email = ? AND u.password = ?
    `, [email, password], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user) {
            res.json({
                success: true,
                user: {
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    id: user.id,
                    gymId: user.gym_id,
                    gym_name: user.gym_name
                },
                company: {
                    name: user.gym_name,
                    address: user.gym_address,
                    nuit: user.gym_nuit
                }
            });
        } else {
            res.status(401).json({ error: "Credenciais inválidas" });
        }
    });
});


// ... (Existing Endpoints) ...

// =================================================================================
// 🛠️ ZONA DE DIAGNÓSTICO E WEBHOOK (ADICIONADO VIA SUPORTE)
// =================================================================================

// 1. PING: Teste de Conexão Básica
app.post('/api/hardware/ping', async (req, res) => {
    const { deviceId } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado' });
        try {
            console.log(`[PING] Testando conexão com ${device.ip}...`);
            const info = await requestISAPI(device, 'GET', '/ISAPI/System/deviceInfo', null, 'text/xml');
            res.json({
                success: true,
                online: true,
                message: '✅ Catraca respondendo',
                preview: info.substring(0, 100)
            });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    });
});

// 2. TEST EVENTS NOW: Buscar os ÚLTIMOS eventos (Pular os 99 mil antigos)
app.post('/api/hardware/test-events-now', async (req, res) => {
    const { deviceId } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado' });

        try {
            console.log(`[TEST-NOW] Pegando a contagem total de ${device.ip}...`);

            // 1. Primeiro pegamos o total
            const countPayload = JSON.stringify({
                AcsEventCond: {
                    searchID: "COUNT_" + Date.now(),
                    searchResultPosition: 0,
                    maxResults: 1,
                    major: 0, minor: 0
                }
            });
            const countResText = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent?format=json', countPayload, 'application/json');
            const countData = JSON.parse(countResText);
            const total = countData.AcsEvent?.totalMatches || 0;

            console.log(`[TEST-NOW] Total de eventos na memória: ${total}. Buscando os últimos 20...`);

            // 2. Buscamos do final para o começo
            const startPos = Math.max(0, total - 20);

            const jsonPayload = JSON.stringify({
                AcsEventCond: {
                    searchID: "LATEST_" + Date.now(),
                    searchResultPosition: startPos,
                    maxResults: 20,
                    major: 0, minor: 0
                }
            });

            const responseText = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent?format=json', jsonPayload, 'application/json');
            const parsed = JSON.parse(responseText);
            const list = parsed.AcsEventSearch?.AcsEventSearchResult?.MatchList || parsed.AcsEvent?.InfoList || [];

            const resultData = {
                msg: "✅ Estes são os ÚLTIMOS eventos da memória!",
                total_catraca: total,
                posicao_inicial: startPos,
                last_events: list.map(e => {
                    const evt = e.AcsEvent || e;
                    return { nome: evt.name, hora: evt.time, tipo: evt.major + "/" + evt.minor };
                }).reverse() // Inverter para o mais novo ficar no topo
            };

            res.json({ success: true, result: resultData });
        } catch (e) {
            console.error("[TEST-NOW] Erro:", e);
            res.status(500).json({ error: e.message });
        }
    });
});

// 3. SETUP WEBHOOK: Configurar catraca para empurrar dados
app.post('/api/hardware/setup-webhook', async (req, res) => {
    const { deviceId, serverUrl } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado' });
        try {
            const webhookIP = serverUrl.split(':')[0];
            const webhookPort = parseInt(serverUrl.split(':')[1]) || 80;
            const xmlPayload = `
            <HttpHostNotificationList version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
                <HttpHostNotification>
                    <id>1</id><url>/api/webhook/hikvision</url><protocolType>HTTP</protocolType>
                    <parameterFormatType>JSON</parameterFormatType><addressingFormatType>ipaddress</addressingFormatType>
                    <ipAddress>${webhookIP}</ipAddress><portNo>${webhookPort}</portNo><httpAuthenticationMethod>none</httpAuthenticationMethod>
                </HttpHostNotification>
            </HttpHostNotificationList>`;
            const response = await requestISAPI(device, 'PUT', '/ISAPI/Event/notification/httpHosts', xmlPayload, 'application/xml');
            res.json({ success: true, response: response });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
});

// 4. DEBUG RAW API
app.post('/api/hardware/debug-raw-api', async (req, res) => {
    const { deviceId } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado' });
        try {
            const jsonPayload = JSON.stringify({ AcsEventCond: { searchID: "RAW_" + Date.now(), searchResultPosition: 0, maxResults: 5, major: 0, minor: 0 } });
            const responseText = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent?format=json', jsonPayload, 'application/json');
            res.json({ success: true, raw: responseText.substring(0, 1000) });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
});

// =================================================================================
// FIM ZOINA DIAGNOSTICO
// =================================================================================

// Rota para ler os acessos do banco (Suporta filtro por utente)
app.get('/api/attendance', (req, res) => {
    const { userId } = req.query;
    if (userId) {
        db.all("SELECT * FROM attendance WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1000", [userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    } else {
        db.all("SELECT * FROM attendance ORDER BY timestamp DESC LIMIT 500", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    }
});

// (Garbage/Duplicate block removed)
// ========== ENDPOINT DEBUG (USE PRIMEIRO PARA VER O QUE A CATRACA RETORNA) ==========
app.post('/api/debug/sync-events-raw', async (req, res) => {
    const { deviceId } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado' });

        try {
            console.log('[DEBUG] Testando comunicação com catraca...');

            // TESTE 1: Pedir INFORMAÇÕES do dispositivo primeiro
            try {
                const deviceInfo = await requestISAPI(device, 'GET', '/ISAPI/System/deviceInfo?format=json', null, 'application/json');
                console.log('[DEBUG] Info do dispositivo:', deviceInfo?.substring(0, 300));
            } catch (e) {
                console.log('[DEBUG] Não conseguiu info:', e.message);
            }

            // TESTE 2: Pedir eventos das últimas 24 horas (COM CORREÇÃO DE ANO)
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);

            // Converter para formato ISO que a Hikvision entende
            const startStr = yesterday.toISOString().split('.')[0];
            const endStr = now.toISOString().split('.')[0];

            console.log('[DEBUG] Pedindo eventos de:', startStr, 'até', endStr);

            const jsonPayload = {
                AcsEventCond: {
                    searchID: "DEBUG_" + Date.now(),
                    searchResultPosition: 0,
                    maxResults: 20,
                    startTime: startStr,
                    endTime: endStr,
                    major: 5,  // Apenas eventos de acesso
                    minor: 75  // Apenas eventos de porta
                }
            };

            console.log('[DEBUG] Payload:', JSON.stringify(jsonPayload, null, 2));

            const response = await requestISAPI(device, 'POST',
                '/ISAPI/AccessControl/AcsEvent?format=json',
                JSON.stringify(jsonPayload), 'application/json');

            console.log('[DEBUG] Status:', response.statusCode);

            let parsed;
            try {
                parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                console.log('[DEBUG] Estrutura completa da resposta:', parsed ? 'OK' : 'NULL');
            } catch (e) {
                console.log('[DEBUG] Erro ao parsear JSON:', e.message);
            }

            res.json({
                success: true,
                status: response.statusCode,
                request: { startTime: startStr, endTime: endStr },
                response: parsed || response.data,
                message: 'Debug completo executado'
            });

        } catch (e) {
            console.error("[DEBUG] Erro completo:", e);
            res.status(500).json({
                error: e.message,
                hint: 'Verifique: 1) IP correto 2) Usuário/senha 3) Dispositivo ligado'
            });
        }
    });
});

// ========== SYNC EVENTS CORRIGIDO (COM CORREÇÃO DE ANO 2025->2026) ==========
app.post('/api/hardware/sync-events', async (req, res) => {
    const { deviceId } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado' });

        try {
            console.log(`[SYNC] Iniciando sincronização para ${device.ip}...`);

            // 1. OBTER TOTAL DE EVENTOS DE ACESSO (Major 5) PARA PULAR PARA O FINAL
            // Filtramos por Major 5 (Acessos) já na contagem para ser preciso
            const countPayload = JSON.stringify({
                AcsEventCond: {
                    searchID: "SYNC_COUNT_ACC_" + Date.now(),
                    searchResultPosition: 0,
                    maxResults: 1,
                    major: 5,
                    minor: 0
                }
            });

            let total = 0;
            try {
                const countRes = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent?format=json', countPayload, 'application/json');
                total = JSON.parse(countRes).AcsEvent?.totalMatches || 0;
                console.log(`[SYNC] Total de acessos (Major 5) na memória: ${total}`);
            } catch (e) {
                console.log("[SYNC] Falha ao obter total de acessos.");
            }

            // 2. BUSCAR OS ÚLTIMOS ACESSOS
            const maxResults = 1000;
            const skip = Math.max(0, total - maxResults);

            const jsonPayload = JSON.stringify({
                AcsEventCond: {
                    searchID: "SYNC_ACC_FINAL_" + Date.now(),
                    searchResultPosition: skip,
                    maxResults: maxResults,
                    major: 5, // APENAS ACESSOS (Evita Remote Login, NTP Sync, etc)
                    minor: 0
                }
            });

            console.log(`[SYNC] Buscando os últimos ${maxResults} ACESSOS (Posição ${skip})...`);

            // 3. FAZER REQUISIÇÃO
            let responseData = null;
            let isJSONSuccess = false;

            try {
                responseData = await requestISAPI(device, 'POST',
                    '/ISAPI/AccessControl/AcsEvent?format=json',
                    jsonPayload, 'application/json');
                isJSONSuccess = true;
                console.log('[SYNC] JSON Sucesso!');
            } catch (jsonErr) {
                console.log(`[SYNC] JSON falhou: ${jsonErr.message}. Tentando XML...`);
            }

            let events = [];

            // 4. PROCESSAR JSON (Se deu certo)
            if (isJSONSuccess) {
                try {
                    let jsonData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

                    // Encontrar a lista
                    let rawList = jsonData.AcsEventSearch?.AcsEventSearchResult?.MatchList
                        || jsonData.AcsEvent?.InfoList
                        || jsonData.AcsEvent?.MatchList
                        || (Array.isArray(jsonData.AcsEvent) ? jsonData.AcsEvent : null);

                    if (rawList) {
                        const items = Array.isArray(rawList) ? rawList : [rawList];
                        events = items.map(item => item.AcsEvent || item).filter(evt => evt && evt.time);
                        console.log(`[SYNC] Extraídos ${events.length} eventos do JSON.`);
                    } else {
                        console.log('[SYNC] JSON vazio ou estrutura desconhecida.');
                    }
                } catch (e) {
                    console.log('[SYNC] Erro parse JSON:', e.message);
                    isJSONSuccess = false;
                }
            }

            // FALLBACK XML (Se JSON falhou ou parse falhou)
            if (!isJSONSuccess) {
                const xmlPayload = `
                        <AcsEventCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
                            <searchID>${"SYNC_" + Date.now()}</searchID>
                            <searchResultPosition>0</searchResultPosition>
                            <maxResults>50</maxResults>
                            <major>0</major>
                            <minor>0</minor>
                            <startTime>${startStr}</startTime>
                            <endTime>${endStr}</endTime>
                        </AcsEventCond>`;

                try {
                    console.log('[SYNC] Enviando XML...');
                    const xmlData = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent', xmlPayload, 'application/xml');

                    console.log('[SYNC] XML Sucesso. Fazendo parse manual...');
                    const regex = /<AcsEvent>([\s\S]*?)<\/AcsEvent>/g;
                    let match;
                    while ((match = regex.exec(xmlData)) !== null) {
                        const block = match[1];
                        const getTag = (tag) => {
                            const m = block.match(new RegExp(`<${tag}>([^<]+)<\/${tag}>`));
                            return m ? m[1] : null;
                        };
                        events.push({
                            serialNo: getTag('serialNo'),
                            employeeNoString: getTag('employeeNoString'),
                            name: getTag('name'),
                            time: getTag('time'),
                            major: parseInt(getTag('major') || '0'),
                            minor: parseInt(getTag('minor') || '0'),
                            AcsEvent: true
                        });
                    }
                } catch (xmlError) {
                    console.log('[SYNC] XML também falhou:', xmlError.message);
                    return res.json({ success: false, error: 'Falha em JSON e XML', details: xmlError.message });
                }
            }

            if (events.length === 0) return res.json({ success: true, count: 0, msg: 'Nenhum evento válido' });

            // 7. APLICAR CORREÇÃO DE ANO E FILTRO DE DATA
            const currentYear = new Date().getFullYear();
            // NÃO FILTRAR POR DATA. A CATRACA ESTÁ COM DATA ERRADA (Ex: Out 2025 em vez de Jan 2026).
            // Vamos confiar que a API retornou os eventos mais recentes.
            const filteredEvents = events.filter(evt => {
                if (!evt.time) return false;
                try {
                    // Tentar corrigir o ano para o atual apenas para ficar bonito no relatório,
                    // mas aceitar o evento de qualquer jeito.
                    let eventDate = new Date(evt.time);
                    if (eventDate.getFullYear() < new Date().getFullYear()) {
                        // Se for ano passado (2025), traz para 2026 mantendo mês/dia
                        // Isso corrige o erro de ano, mas mantemos o erro de mês se houver.
                        // O importante é importar.
                        eventDate.setFullYear(new Date().getFullYear());
                    }
                    evt.correctedTime = eventDate.toISOString();
                    return true;
                } catch (e) { return true; } // Se der erro na data, importa mesmo assim
            });

            console.log(`[SYNC] Importando ${filteredEvents.length} eventos (Sem filtro de data).`);

            // 8. SALVAR NO BANCO
            let savedCount = 0;
            if (filteredEvents.length > 0) {
                db.serialize(() => {
                    db.run("BEGIN TRANSACTION");
                    filteredEvents.forEach(evt => {
                        const timestamp = evt.correctedTime || evt.time;
                        const employeeNo = evt.employeeNoString || evt.employeeNo || 'UNKNOWN';
                        // ID Único: IP + UID + Hora (para não duplicar se sincronizar 2x)
                        const id = `EVT_${device.ip.replace(/\./g, '_')}_${employeeNo}_${timestamp.replace(/[:.-]/g, '')}`;

                        let type = device.ip.includes('149') ? 'in' : (device.ip.includes('151') ? 'out' : 'check');

                        db.run(`INSERT OR IGNORE INTO attendance (id, device_ip, user_id, user_name, timestamp, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [id, device.ip, evt.employeeNoString || evt.employeeNo || 'UNKNOWN', evt.name || 'Desconhecido', timestamp, type, evt.major || 0],
                            function (err) {
                                if (!err && this.changes > 0) {
                                    savedCount++;
                                    // Atualizar último acesso do cliente
                                    const userId = evt.employeeNoString || evt.employeeNo;
                                    if (userId && userId !== 'UNKNOWN') {
                                        db.run(`UPDATE clients SET last_access = ?, synced = 0 WHERE id = ?`, [timestamp, userId]);
                                    }
                                }
                            }
                        );
                    });
                    db.run("COMMIT");
                });
            }

            res.json({ success: true, count: savedCount, msg: `Sincronizados ${savedCount} eventos de hoje` });

        } catch (e) {
            console.error("[SYNC] Erro fatal:", e);
            res.status(500).json({ error: e.message });
        }
    });
});

// ========== LIMPAR EVENTOS FALSOS (EXECUTE AGORA) ==========
app.post('/api/attendance/clean-fake', (req, res) => {
    // Deletar eventos que foram criados hoje mas têm datas antigas (Lixo)
    db.run(`DELETE FROM attendance WHERE date(timestamp) != date('now') AND date(created_at) = date('now')`, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`[CLEAN] Removidos ${this.changes} eventos falsos`);
        res.json({ success: true, removed: this.changes });
    });
});

// WEBHOOK HIKVISION (Real-time Events - RAW HANDLER)
app.post('/api/webhook/hikvision', (req, res) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', function () {
        try {
            let eventBody = null;
            if (data.includes('{')) {
                const jsonMatch = data.match(/({[\s\S]*})/);
                if (jsonMatch) {
                    try { eventBody = JSON.parse(jsonMatch[1]).AccessControllerEvent; } catch (e) { }
                }
            }
            if (eventBody) {
                const name = eventBody.name;
                const employeeNo = eventBody.employeeNoString || eventBody.employeeNo;
                const major = eventBody.majorEventType;
                const sub = eventBody.subEventType;
                // 1. DATA E CORREÇÃO DE ANO
                if (!eventBody.time) return res.status(200).send('OK - No Time');
                const originalDate = new Date(eventBody.time);
                if (isNaN(originalDate.getTime())) return res.status(200).send('OK - Invalid Time');

                const currentYear = new Date().getFullYear();
                if (originalDate.getFullYear() === 2025) originalDate.setFullYear(currentYear);
                const eventDate = originalDate;

                // 2. CHECK HOJE (Desativado: aceitar tudo que vier no webhook)
                // const isToday = eventDate.getDate() === now.getDate() && eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                // if (!isToday) return res.status(200).send('OK - Old Date');
                console.log(`[WEBHOOK RAW DATE] ${originalDate.toISOString()} -> ${eventDate.toISOString()}`);

                const isValidAccess = (major === 5 && sub === 75) || (major === 196);
                if (isValidAccess || (name && name.length > 0)) {
                    let type = req.ip.includes('149') ? 'in' : (req.ip.includes('151') ? 'out' : 'check');
                    console.log(`✅ [WEBHOOK] ${name} (${type.toUpperCase()})`);
                    const id = 'WH_' + Date.now() + '_' + Math.random().toString().slice(2, 5);
                    db.run('INSERT OR IGNORE INTO attendance (id, device_ip, user_id, user_name, timestamp, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [id, req.ip || '0.0.0.0', employeeNo || 'Unk', name || 'Desconhecido', eventDate.toISOString(), type, sub],
                        (err) => { if (!err && employeeNo) db.run("UPDATE clients SET last_access = ?, synced = 0 WHERE id = ?", [eventDate.toISOString(), employeeNo]); }
                    );
                }
            }
        } catch (e) { }
        res.status(200).send('OK');
    });
});

let isSyncing = false;
// Helper para obter ID do Ginásio
const getGymId = () => {
    return new Promise((resolve) => {
        db.get("SELECT value FROM system_config WHERE key = 'gym_id'", (err, row) => resolve(row ? row.value : null));
    });
};
app.get('/api/sync-status', (req, res) => res.json({ isSyncing }));

// === SUPABASE SYNC AGENT (BACKGROUND) ===
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("☁️ Agente de Sync Inicializado");
}

// SYNC ENGINE
const syncToCloud = async () => {
    if (!supabase || isSyncing) return;
    const GYM_ID = await getGymId();
    if (!GYM_ID) return;

    try { const { error } = await supabase.from('company_settings').select('id').limit(1); if (error) throw error; } catch (e) { return; }

    isSyncing = true;
    console.log(`🔄 SINCRONIZANDO (Ginásio: ${GYM_ID})...`);

    try {
        // UPLOAD (Local -> Cloud)
        await new Promise((resolve) => {
            db.all("SELECT * FROM invoices WHERE synced = 0", async (err, rows) => {
                if (rows && rows.length) {
                    console.log(`⬆️ Enviando ${rows.length} faturas...`);
                    for (const row of rows) {
                        const { synced, items, ...data } = row;
                        await supabase.from('invoices').upsert({ ...data, gym_id: GYM_ID, items: JSON.parse(items || '[]') });
                        db.run("UPDATE invoices SET synced = 1 WHERE id = ?", [row.id]);
                    }
                }
                resolve();
            });
        });

        await new Promise((resolve) => {
            db.all("SELECT * FROM clients WHERE synced = 0", async (err, rows) => {
                if (rows && rows.length) {
                    console.log(`⬆️ Enviando ${rows.length} clientes...`);
                    for (const row of rows) {
                        const { synced, created_at, ...data } = row; // Ensure created_at matches Supabase expectations
                        // if created_at is null, maybe omit it or set default
                        await supabase.from('clients').upsert({
                            ...data,
                            gym_id: GYM_ID
                        });
                        db.run("UPDATE clients SET synced = 1 WHERE id = ?", [row.id]);
                    }
                }
                resolve();
            });
        });

        await new Promise((resolve) => {
            db.all("SELECT * FROM system_users WHERE synced = 0", async (err, rows) => {
                if (rows && rows.length) {
                    console.log(`⬆️ Enviando ${rows.length} utilizadores...`);
                    for (const row of rows) {
                        const { synced, ...data } = row;
                        await supabase.from('system_users').upsert(data);
                        db.run("UPDATE system_users SET synced = 1 WHERE id = ?", [row.id]);
                    }
                }
                resolve();
            });
        });

        await new Promise((resolve) => {
            db.all("SELECT * FROM gyms WHERE synced = 0", async (err, rows) => {
                if (rows && rows.length) {
                    console.log(`⬆️ Enviando ${rows.length} ginásios...`);
                    for (const row of rows) {
                        const { synced, ...data } = row;
                        await supabase.from('gyms').upsert(data);
                        db.run("UPDATE gyms SET synced = 1 WHERE id = ?", [row.id]);
                    }
                }
                resolve();
            });
        });

        /* 
        // DOWNLOAD (Cloud -> Local) - DESATIVADO PARA EVITAR SOBREPOSIÇÃO DE DADOS LOCAIS
        const { data: cloudInvoices } = await supabase.from('invoices').select('*').eq('gym_id', GYM_ID);
        if (cloudInvoices) {
            db.serialize(() => {
                const stmt = db.prepare(`INSERT OR REPLACE INTO invoices (id, client_id, client_name, amount, status, items, date, payment_method, synced) VALUES (?,?,?,?,?,?,?,?,1)`);
                cloudInvoices.forEach(inv => {
                    const itemsStr = typeof inv.items === 'string' ? inv.items : JSON.stringify(inv.items);
                    stmt.run(inv.id, inv.client_id, inv.client_name, inv.amount, inv.status, itemsStr, inv.date, inv.payment_method);
                });
                stmt.finalize();
            });
        }
 
        // DOWNLOAD (Cloud -> Local) - RESTAURO DE EMERGÊNCIA DE NOMES
        const { data: cloudClients } = await supabase.from('clients').select('*').eq('gym_id', GYM_ID);
        if (cloudClients && cloudClients.length > 0) {
            console.log(`⬇️ Restaurando/Sincronizando ${cloudClients.length} clientes da nuvem...`);
            db.serialize(() => {
                const stmt = db.prepare(`INSERT OR REPLACE INTO clients (id, name, phone, email, nuit, status, photo_url, created_at, last_access, plan_id, synced) VALUES (?,?,?,?,?,?,?,?,?,?,1)`);
                cloudClients.forEach(c => {
                    stmt.run(c.id, c.name, c.phone, c.email, c.nuit, c.status, c.photo_url, c.created_at, c.last_access, c.plan_id);
                });
                stmt.finalize();
            });
        }
 
        // License
        const { data: license } = await supabase.from('saas_subscriptions').select('*').eq('gym_id', GYM_ID).single();
        if (license) {
            db.run(`INSERT OR REPLACE INTO saas_subscriptions (gym_id, plan_name, license_fee, status, last_payment_date, next_payment_due, features, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [license.gym_id, license.plan_name, license.license_fee, license.status, license.last_payment_date, license.next_payment_due, JSON.stringify(license.features)]
            );
        }
        */

    } catch (error) {
        console.error("❌ Erro no Sync:", error);
    } finally {
        isSyncing = false;
    }
};

// GET Client Details Endpoint
app.get('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM clients WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Cliente não encontrado" });
        res.json(row);
    });
});
setInterval(syncToCloud, 60000); // 60s fallback sync


// === API ROUTES ===

// Config
app.get('/api/config', async (req, res) => { const gymId = await getGymId(); res.json({ gymId }); });
app.post('/api/config', (req, res) => {
    const { gymId } = req.body;
    if (!gymId) return res.status(400).json({ error: 'Gym ID required' });
    db.run("INSERT OR REPLACE INTO system_config (key, value) VALUES ('gym_id', ?)", [gymId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        setTimeout(syncToCloud, 1000);
        res.json({ status: 'ok', gymId });
    });
});

// WhatsApp Management
app.get('/api/whatsapp/status', (req, res) => res.json({ connected: !!sock?.user, qr: qrCodeAuth }));
app.get('/api/whatsapp/qr-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const onQr = (qr) => res.write(`data: ${JSON.stringify({ qr })}\n\n`);
    const onConnected = () => res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);
    qrEmitter.on('qr', onQr);
    qrEmitter.on('connected', onConnected);
    if (qrCodeAuth) onQr(qrCodeAuth);
    req.on('close', () => { qrEmitter.off('qr', onQr); qrEmitter.off('connected', onConnected); });
});
app.post('/api/whatsapp/disconnect', async (req, res) => {
    try { await sock.logout(); res.json({ status: 'logged_out' }); connectToWhatsApp(); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/whatsapp/send', async (req, res) => {
    const { phone, message, pdfBase64 } = req.body;
    if (!sock) return res.status(500).json({ error: 'WhatsApp not ready' });
    try {
        const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
        if (pdfBase64) {
            await sock.sendMessage(jid, { document: Buffer.from(pdfBase64, 'base64'), mimetype: 'application/pdf', fileName: 'Fatura_HefelGym.pdf', caption: message });
        } else {
            await sock.sendMessage(jid, { text: message });
        }
        res.json({ status: 'sent' });
    } catch (e) {
        console.error("Erro WhatsApp:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/access/open', async (req, res) => { await openTurnstile(req.body.direction); res.json({ status: 'opened' }); });

// Clients
app.get('/api/clients', (req, res) => {
    const query = `
        SELECT 
            *,
            CASE 
                WHEN name GLOB '*[a-zA-Z]*' THEN 1  -- Nomes reais primeiro
                ELSE 2                               -- Números depois
            END as sort_priority
        FROM clients
        ORDER BY sort_priority ASC, created_at ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.get('/api/plans', (req, res) => {
    db.all("SELECT * FROM plans ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Inventory
app.get('/api/inventory', (req, res) => db.all("SELECT * FROM products", [], (err, rows) => res.json(rows || [])));
app.post('/api/inventory', (req, res) => {
    const { id, name, price, cost_price, stock, category } = req.body;
    db.run(`INSERT INTO products (id, name, price, cost_price, stock, category, synced) VALUES (?,?,?,?,?,?,0)`, [id, name, price, cost_price || 0, stock, category], (err) => {
        if (err) res.status(500).json(err);
        else {
            res.json({ status: 'ok' });
            setTimeout(syncToCloud, 500); // Trigger immediate sync
        }
    });
});
app.put('/api/inventory/:id', (req, res) => {
    const { name, price, cost_price, stock, category } = req.body;
    db.run("UPDATE products SET name = ?, price = ?, cost_price = ?, stock = ?, category = ?, synced = 0 WHERE id = ?", [name, price, cost_price || 0, stock, category, req.params.id], (err) => {
        if (err) res.status(500).json(err);
        else { res.json({ status: 'ok' }); setTimeout(syncToCloud, 500); }
    });
});
app.delete('/api/inventory/:id', (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
        if (err) res.status(500).json(err);
        else { res.json({ status: 'ok' }); }
    });
});

// Financial / Expenses
app.get('/api/expenses/products', (req, res) => {
    db.all("SELECT * FROM product_expenses ORDER BY date DESC", [], (err, rows) => res.json(rows || []));
});

app.post('/api/expenses/products', (req, res) => {
    const { product_id, product_name, quantity, unit_cost, supplier } = req.body;
    const total_cost = quantity * unit_cost;
    const date = new Date().toISOString();
    const id = `PEXP${Date.now()}`;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT INTO product_expenses (id, product_id, product_name, quantity, unit_cost, total_cost, date, supplier, synced) VALUES (?,?,?,?,?,?,?,?,0)`,
            [id, product_id, product_name, quantity, unit_cost, total_cost, date, supplier], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json(err);
                }
                // Update stock and cost_price (moving average could be better, but let's keep it simple: use last cost)
                db.run("UPDATE products SET stock = stock + ?, cost_price = ?, synced = 0 WHERE id = ?", [quantity, unit_cost, product_id], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json(err);
                    }
                    db.run("COMMIT");
                    res.json({ status: 'ok', id });
                });
            });
    });
});

app.get('/api/expenses/gym', (req, res) => {
    const { gymId } = req.query;
    const sql = gymId ? "SELECT * FROM gym_expenses WHERE gym_id = ? ORDER BY date DESC" : "SELECT * FROM gym_expenses ORDER BY date DESC";
    const params = gymId ? [gymId] : [];

    db.all(sql, params, (err, rows) => res.json(rows || []));
});

app.post('/api/expenses/gym', (req, res) => {
    const { description, amount, category, payment_method, gym_id } = req.body;
    const date = new Date().toISOString();
    const id = `EXP${Date.now()}`;
    const targetGymId = gym_id || 'hefel_gym_v1';

    db.run(`INSERT INTO gym_expenses (id, description, amount, category, date, payment_method, gym_id, synced) VALUES (?,?,?,?,?,?,?,0)`,
        [id, description, amount, category, date, payment_method, targetGymId], (err) => {
            if (err) res.status(500).json(err);
            else res.json({ status: 'ok', id });
        });
});

// Clients
app.post('/api/clients', (req, res) => {
    const { id, name, phone, email, nuit, status, photo_url, plan_id, planId } = req.body;
    const finalPlanId = plan_id || planId;
    db.run(`INSERT INTO clients (id, name, phone, email, nuit, status, photo_url, plan_id, created_at, synced) VALUES (?,?,?,?,?,?,?,?,?,0)`,
        [id, name, phone, email, nuit, status, photo_url, finalPlanId, new Date().toISOString()], (err) => {
            if (err) res.status(500).json(err);
            else {
                res.json({ status: 'ok' });
                setTimeout(syncToCloud, 500);
            }
        });
});
app.put('/api/clients/:id', (req, res) => {
    const { name, phone, email, nuit, status, photo_url, plan_id, planId } = req.body;
    const finalPlanId = plan_id || planId;
    db.run("UPDATE clients SET name = ?, phone = ?, email = ?, nuit = ?, status = ?, photo_url = ?, plan_id = ?, synced = 0 WHERE id = ?",
        [name, phone, email, nuit, status, photo_url, finalPlanId, req.params.id], (err) => {
            if (err) res.status(500).json(err);
            else { res.json({ status: 'ok' }); setTimeout(syncToCloud, 500); }
        });
});
app.delete('/api/clients/:id', (req, res) => {
    db.run("DELETE FROM clients WHERE id = ?", [req.params.id], (err) => {
        if (err) res.status(500).json(err);
        else { res.json({ status: 'ok' }); }
    });
});

// Hardware & Access Control
app.get('/api/hardware/devices', (req, res) => {
    db.all("SELECT * FROM access_devices", [], (err, rows) => res.json(rows || []));
});

app.post('/api/hardware/devices', (req, res) => {
    const { name, ip, port, username, password, type } = req.body;
    db.run(`INSERT INTO access_devices (id, name, ip, port, username, password, type) VALUES (?,?,?,?,?,?,?)`,
        [`DEV${Date.now()}`, name, ip, port, username, password, type],
        (err) => {
            if (err) res.status(500).json(err);
            else res.json({ status: 'ok' });
        }
    );
});

app.delete('/api/hardware/devices/:id', (req, res) => {
    db.run("DELETE FROM access_devices WHERE id = ?", [req.params.id], (err) => {
        if (err) res.status(500).json(err);
        else res.json({ status: 'ok' });
    });
});
// ISAPI HANDLER & SYNC
// ISAPI HANDLER & SYNC

// ISAPI HANDLER & SYNC (With Digest Auth Support)
const fs = require('fs');
const https = require('https');

const requestISAPI = async (device, method, path, body = null, contentType = 'application/xml') => {
    const log = (msg) => {
        const line = `[${new Date().toISOString()}] ${msg}\n`;
        console.log(msg);
        fs.appendFileSync('server_debug.log', line);
    };

    // Detectar https
    const isHttps = device.port === 443 || (device.protocol && device.protocol.includes('https'));
    const requestModule = isHttps ? https : http;

    const doRequest = (authHeader = null) => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: device.ip,
                port: device.port || (isHttps ? 443 : 80),
                path: path,
                method: method,
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': body ? Buffer.byteLength(body) : 0
                },
                rejectUnauthorized: false, // Aceitar certificados auto-assinados da Hikvision
                timeout: 8000
            };

            // Override Content-Type if explicitly passed or JSON detected
            if (contentType) {
                options.headers['Content-Type'] = contentType;
            } else if (body && typeof body === 'string' && body.trim().startsWith('{')) {
                options.headers['Content-Type'] = 'application/json';
            }

            if (authHeader) options.headers['Authorization'] = authHeader;

            const protocolStr = isHttps ? 'https' : 'http';

            // Detailed Logging
            console.log('=== REQUEST DETAILS ===');
            console.log('URL:', `${protocolStr}://${device.ip}:${options.port}${path}`);
            console.log('Method:', method);
            console.log('Headers:', JSON.stringify(options.headers, null, 2));
            console.log('Body Preview:', body ? body.substring(0, 200) : 'NO BODY');
            console.log('=====================\n');

            log(`Make Request: ${method} ${protocolStr}://${device.ip}:${options.port}${path} (Auth: ${authHeader ? 'Yes' : 'No'})`);

            const req = requestModule.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    log(`Response: ${res.statusCode} Headers: ${JSON.stringify(res.headers)} BodySnippet: ${data.substring(0, 100)}...`);
                    resolve({ statusCode: res.statusCode, headers: res.headers, data });
                });
            });

            req.on('error', (e) => {
                log(`Request Error: ${e.message}`);
                reject(e);
            });
            if (body) req.write(body);
            req.end();
        });
    };

    // 1. Tentar primeiro SEM Auth (mas com body)
    let response = await doRequest(null);

    // Se receber 401, processar o desafio Digest
    if (response.statusCode === 401) {
        const authHeader = response.headers['www-authenticate'];

        if (!authHeader) {
            log(`[ISAPI] 401 mas SEM header 'www-authenticate'. Possível erro de PERMISSÃO ou HTTPS.`);
            throw new Error("ISAPI 401: Falha de Autenticação/Permissão. Verifique se o usuário tem permissão 'Remote Door Control'.");
        }

        if (authHeader && authHeader.toLowerCase().startsWith('digest')) {
            log(`[ISAPI] 401 Detectado. Header: ${authHeader}`);

            // Parse Challenge
            const challenge = {};
            const re = /(\w+)=("[^"]*"|[^,]*)/g;
            let match;
            while (match = re.exec(authHeader)) {
                challenge[match[1]] = match[2].replace(/^"|"$/g, '');
            }

            const realm = challenge.realm;
            const nonce = challenge.nonce;
            const qop = challenge.qop;
            const opaque = challenge.opaque;
            const algorithm = challenge.algorithm || 'MD5';

            // Calculate Digest
            const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

            const nc = '00000001';
            const cnonce = crypto.randomBytes(8).toString('hex');

            const HA1 = md5(`${device.username}:${realm}:${device.password}`);
            const HA2 = md5(`${method}:${path}`);

            let responseStr;
            if (qop) {
                responseStr = md5(`${HA1}:${nonce}:${nc}:${cnonce}:${qop}:${HA2}`);
            } else {
                responseStr = md5(`${HA1}:${nonce}:${HA2}`);
            }

            let digestHeader = `Digest username="${device.username}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${responseStr}", algorithm="${algorithm}"`;
            if (qop) digestHeader += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
            if (opaque) digestHeader += `, opaque="${opaque}"`;

            log(`Sending Digest Header: ${digestHeader}`);
            response = await doRequest(digestHeader);
        } else {
            log(`[ISAPI] 401 mas Header de Auth não é Digest ou não existe: ${authHeader}`);
        }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data;
    } else {
        throw new Error(`ISAPI Error ${response.statusCode}: ${response.data}`);
    }
};

app.post('/api/hardware/restore-names-emergency', async (req, res) => {
    console.log("🚑 INICIANDO RESTAURO DE EMERGÊNCIA...");
    try {
        // Buscar nomes reais das faturas (onde os dados estão preservados)
        db.all("SELECT DISTINCT client_id, client_name FROM invoices WHERE client_id IS NOT NULL AND client_name NOT GLOB '[0-9]*'", [], async (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            console.log(`🔎 Encontrados ${rows.length} nomes nas faturas locais.`);

            // Se as locais estiverem vazias, tentar as da nuvem se possível
            if (rows.length === 0 && supabase) {
                console.log("☁️ Tentando recuperar nomes das faturas na nuvem...");
                const { data: cloudInvoices } = await supabase.from('invoices').select('client_id, client_name');
                if (cloudInvoices) {
                    for (const inv of cloudInvoices) {
                        if (inv.client_id && inv.client_name && !inv.client_name.match(/^[0-9]+$/)) {
                            db.run("UPDATE clients SET name = ? WHERE id = ? AND (name GLOB '[0-9]*' OR name IS NULL)", [inv.client_name, inv.client_id]);
                        }
                    }
                }
            } else {
                for (const row of rows) {
                    db.run("UPDATE clients SET name = ? WHERE id = ? AND (name GLOB '[0-9]*' OR name IS NULL)", [row.client_name, row.client_id]);
                }
            }

            res.json({ status: 'ok', msg: 'Processo de restauro iniciado. Por favor, recarregue a página em 10 segundos.' });
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/hardware/sync-users', (req, res) => {
    // DESATIVADO: Este comando causou corrupção de nomes. 
    // Só voltaremos a ativar quando o hardware tiver nomes configurados.
    res.status(403).json({ error: "Sincronização automática desativada para proteger a integridade dos nomes." });
});

// Adicione esta rota para testar métodos alternativos
app.post('/api/hardware/test-search', async (req, res) => {
    const { deviceId } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (err || !device) return res.status(404).json({ error: "Dispositivo não encontrado" });

        const testResults = [];

        // Teste 1: GET simples (alguns dispositivos permitem)
        try {
            console.log("🔍 Testando GET /ISAPI/AccessControl/UserInfo/Record?...");
            const getResponse = await requestISAPI(device, 'GET', '/ISAPI/AccessControl/UserInfo/Record?format=xml');
            testResults.push({ method: 'GET Record', status: 'success', data: getResponse.substring(0, 200) });
        } catch (e) {
            testResults.push({ method: 'GET Record', status: 'error', error: e.message });
        }

        // Teste 2: POST com XML mínimo
        try {
            const xmlMin = `<?xml version="1.0"?><UserInfoSearch/>`;
            console.log("🔍 Testando POST com XML mínimo...");
            const postResponse = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/UserInfo/Search', xmlMin);
            testResults.push({ method: 'POST minimal', status: 'success', data: postResponse.substring(0, 200) });
        } catch (e) {
            testResults.push({ method: 'POST minimal', status: 'error', error: e.message });
        }

        // Teste 3: Verificar capabilities do dispositivo
        try {
            console.log("🔍 Verificando capabilities...");
            const caps = await requestISAPI(device, 'GET', '/ISAPI/AccessControl/capabilities');
            testResults.push({ method: 'GET capabilities', status: 'success', data: caps.substring(0, 300) });
        } catch (e) {
            testResults.push({ method: 'GET capabilities', status: 'error', error: e.message });
        }

        res.json({ tests: testResults });
    });
});

// Validar Detalhes do Dispositivo (Prova de Vida)
app.post('/api/hardware/info', async (req, res) => {
    const { deviceId, tempConfig } = req.body;

    if (deviceId) {
        try {
            device = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], (err, row) => err ? reject(err) : resolve(row));
            });
        } catch (e) { return res.status(500).json({ error: "DB Error" }); }
    }

    if (!device) return res.status(404).json({ error: "Dispositivo não especificado" });

    try {
        console.log(`[HIKVISION] Get Info em ${device.ip}...`);

        // 1. Tentar JSON
        try {
            const jsonResponse = await requestISAPI(
                device,
                'GET',
                '/ISAPI/System/deviceInfo?format=json',
                null,
                'application/json'
            );

            // Parse JSON response
            const deviceInfo = (typeof jsonResponse === 'object' && jsonResponse.data) ? JSON.parse(jsonResponse.data) : JSON.parse(jsonResponse);

            // Check nested structure (DeviceInfo or direct properties)
            const info = deviceInfo.DeviceInfo || deviceInfo;

            res.json({
                status: 'ok',
                info: {
                    model: info.deviceName || info.model || 'Desconhecido',
                    serial: info.serialNumber || '---',
                    firmware: info.firmwareVersion || '---',
                    deviceType: info.deviceType || 'Hikvision',
                    mode: 'JSON'
                }
            });
            return; // Success exit

        } catch (jsonError) {
            console.log(`[HIKVISION] Info JSON falhou (${jsonError.message}). Tentando XML...`);
        }

        // 2. Fallback XML
        const xml = await requestISAPI(device, 'GET', '/ISAPI/System/deviceInfo');

        // Regex Parse
        // Regex Parse Flexível (aceita namespaces como xmlns ou prefixos)
        const model = (/<(?:[^:]+:)?model>([^<]+)<\//i.exec(xml) || [])[1] || 'Desconhecido';
        const serial = (/<(?:[^:]+:)?serialNumber>([^<]+)<\//i.exec(xml) || [])[1] || '---';
        const firmware = (/<(?:[^:]+:)?firmwareVersion>([^<]+)<\//i.exec(xml) || [])[1] || '---';

        // Validação Forte: Se não encontrar modelo, não é um dispositivo válido
        if (model === 'Desconhecido' && serial === '---') {
            return res.status(422).json({ error: "Dispositivo não reconhecido. Resposta inválida." });
        }

        res.json({ status: 'ok', info: { model, serial, firmware, mode: 'XML' } });

    } catch (e) {
        // Se falhar ISAPI padrão, tenta XML puro se for ZKTeco ou outro
        // Mas por agora assumimos erro
        res.status(500).json({ error: e.message, hint: "Falha ao ler dados. Verifique a senha." });
    }
});

// --- Instructors Endpoints ---
app.get('/api/instructors', (req, res) => {
    db.all("SELECT * FROM instructors", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows || []);
    });
});

app.post('/api/instructors', (req, res) => {
    const { id, name, phone, email, specialties, contract_type, commission } = req.body;

    // Auto-Migration for new fields
    db.run("ALTER TABLE instructors ADD COLUMN contract_type TEXT", () => { });
    db.run("ALTER TABLE instructors ADD COLUMN commission REAL", () => { });

    db.run(`INSERT INTO instructors (id, name, phone, email, specialties, contract_type, commission, status, synced) VALUES (?,?,?,?,?,?,?, 'active', 0)`,
        [id, name, phone, email, specialties, contract_type, commission],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, status: 'saved' });
            setTimeout(syncToCloud, 500);
        }
    );
});

app.put('/api/instructors/:id', (req, res) => {
    const { name, phone, email, specialties, contract_type, commission, balance } = req.body;
    console.log(`📝 UPDATE INSTRUCTOR: ${req.params.id}`, req.body);

    // Auto-Migration Balance & New Fields
    db.run("ALTER TABLE instructors ADD COLUMN balance REAL DEFAULT 0", () => { });
    db.run("ALTER TABLE instructors ADD COLUMN contract_type TEXT", () => { });
    db.run("ALTER TABLE instructors ADD COLUMN commission REAL", () => { });

    // Construir query dinâmica ou update fixo? 
    // Como balance é opcional no update normal (edit profile), mas obrigatrio no financeiro.
    // Vou fazer update de tudo. Se balance for undefined, mantem? SQLite "UPDATE ... SET col = COALESCE(?, col)" 
    // ou simplesmente leio o anterior.
    // Para simplificar, o frontend deve enviar o objeto completo ou o backend suportar partial updates.
    // O meu endpoint antigo fazia SET fixo.
    // Vou mudar para logicamente atualizar o que vier, mas SQL estático é mais seguro/fácil.
    // Vou assumir que o frontend envia os campos, ou se enviar só balance, o resto vai a null? Perigoso.
    // Vou fazer 2 querys: Leitura antes de Update ou usar COALESCE.

    // Melhor abordagem rápida: COALESCE para campos opcionais no update
    db.run(`UPDATE instructors SET 
            name = COALESCE(?, name), 
            phone = COALESCE(?, phone), 
            email = COALESCE(?, email), 
            specialties = COALESCE(?, specialties), 
            contract_type = COALESCE(?, contract_type), 
            commission = COALESCE(?, commission), 
            balance = COALESCE(?, balance),
            synced = 0 
            WHERE id = ?`,
        [name, phone, email, specialties, contract_type, commission, balance, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: 'updated' });
            setTimeout(syncToCloud, 500);
        }
    );
});

app.delete('/api/instructors/:id', (req, res) => {
    db.run("DELETE FROM instructors WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'deleted' });
    });
});

// --- Classes Endpoints ---
app.get('/api/classes', (req, res) => {
    db.all("SELECT * FROM classes", [], (err, rows) => {
        if (err) {
            if (err.message.includes('no such table')) return res.json([]);
            return res.status(500).json(err);
        }
        res.json(rows || []);
    });
});

app.post('/api/classes', (req, res) => {
    const { id, name, instructor_id, schedule, capacity, status, attendees, enrolled } = req.body;
    db.run(`CREATE TABLE IF NOT EXISTS classes (
            id TEXT PRIMARY KEY, 
            name TEXT, 
            instructor_id TEXT, 
            schedule TEXT, 
            capacity INTEGER, 
            status TEXT, 
            attendees TEXT,
            enrolled INTEGER DEFAULT 0,
            synced INTEGER DEFAULT 0
        )`, () => {
        // Migrations
        db.run("ALTER TABLE classes ADD COLUMN attendees TEXT", () => { });
        db.run("ALTER TABLE classes ADD COLUMN enrolled INTEGER DEFAULT 0", () => { });

        db.run(`INSERT INTO classes (id, name, instructor_id, schedule, capacity, status, attendees, enrolled, synced) VALUES (?,?,?,?,?,?,?,?,0)`,
            [id, name, instructor_id, JSON.stringify(schedule), capacity, status || 'active', JSON.stringify(attendees || []), enrolled || 0],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id, status: 'saved' });
            }
        );
    });
});

app.put('/api/classes/:id', (req, res) => {
    const { name, instructor_id, schedule, capacity, status, attendees, enrolled } = req.body;

    // Migrations on Update too, just in case
    db.run("ALTER TABLE classes ADD COLUMN attendees TEXT", () => { });
    db.run("ALTER TABLE classes ADD COLUMN enrolled INTEGER DEFAULT 0", () => { });

    db.run(`UPDATE classes SET 
            name = COALESCE(?, name), 
            instructor_id = COALESCE(?, instructor_id), 
            schedule = COALESCE(?, schedule), 
            capacity = COALESCE(?, capacity), 
            status = COALESCE(?, status),
            attendees = COALESCE(?, attendees),
            enrolled = COALESCE(?, enrolled),
            synced = 0 
            WHERE id = ?`,
        [name, instructor_id, JSON.stringify(schedule), capacity, status, JSON.stringify(attendees), enrolled, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: 'updated' });
        }
    );
});

app.delete('/api/classes/:id', (req, res) => {
    db.run("DELETE FROM classes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'deleted' });
    });
});

// --- Trainings Endpoints ---
app.get('/api/trainings', (req, res) => {
    db.all("SELECT * FROM trainings", [], (err, rows) => {
        if (err) {
            if (err.message.includes('no such table')) return res.json([]);
            return res.status(500).json(err);
        }
        res.json(rows || []);
    });
});

app.post('/api/trainings', (req, res) => {
    const { id, name, type, duration, exercises, difficulty, days } = req.body;
    db.run(`CREATE TABLE IF NOT EXISTS trainings (
            id TEXT PRIMARY KEY, 
            name TEXT,
            type TEXT,
            duration INTEGER,
            exercises INTEGER,
            difficulty TEXT,
            days TEXT,
            synced INTEGER DEFAULT 0
        )`, () => {
        db.run(`INSERT INTO trainings (id, name, type, duration, exercises, difficulty, days, synced) VALUES (?,?,?,?,?,?,?,0)`,
            [id, name, type, duration, exercises, difficulty, JSON.stringify(days)],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id, status: 'saved' });
            }
        );
    });
});

app.put('/api/trainings/:id', (req, res) => {
    const { name, type, duration, exercises, difficulty, days } = req.body;
    db.run(`UPDATE trainings SET 
            name = COALESCE(?, name),
            type = COALESCE(?, type),
            duration = COALESCE(?, duration),
            exercises = COALESCE(?, exercises),
            difficulty = COALESCE(?, difficulty),
            days = COALESCE(?, days),
            synced = 0 
            WHERE id = ?`,
        [name, type, duration, exercises, difficulty, JSON.stringify(days), req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: 'updated' });
        }
    );
});

app.delete('/api/trainings/:id', (req, res) => {
    db.run("DELETE FROM trainings WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: 'deleted' });
    });
});




// --- Hardware Control Endpoints ---

// 1. Remote Open Door
app.post('/api/hardware/open-door', async (req, res) => {
    let { ip, port, user, pass } = req.body;

    // Suporte para IP:Porta (ex: 192.168.1.100:8000)
    if (ip && ip.includes(':')) {
        const parts = ip.split(':');
        ip = parts[0];
        port = parseInt(parts[1]);
    }

    const device = {
        ip,
        port: port || 80, // Usa a porta informada ou 80 por defeito
        username: user,
        password: pass
    };

    // XML payload para abrir
    const xml = `<RemoteControlDoor><cmd>open</cmd></RemoteControlDoor>`;

    try {
        await requestISAPI(device, 'PUT', '/ISAPI/AccessControl/RemoteControl/door/1', xml);
        res.json({ status: 'ok', msg: 'Porta Aberta com Sucesso' });
    } catch (e) {
        console.error("Open Door Error:", e.message);
        res.status(500).json({ error: 'Falha ao abrir porta', details: e.message });
    }
});

// 2. Block/Unlock User (Modify User Status)
app.post('/api/hardware/user-control', async (req, res) => {
    const { ip, user, pass, userId, action } = req.body; // action: 'block' or 'unblock'

    // Para bloquear, geralmente editamos o user e definimos "enabled" como false ou mudamos o UserType.
    // Simplificação: Vamos assumir que deletar face/cartão ou mudar validade é o caminho, 
    // mas o ISAPI padrão permite editar Info.
    // Se "block", vamos apagar as permissões ou definir expiry date para passado.
    // Melhor abordagem: Sync individual com enable = false.

    // Reutilizar a logica de sync mas para um user especifico
    // ... Implementação simplificada por agora:
    res.json({ status: 'ok', msg: `Comando ${action} enviado (Simulação)` });
    // TODO: Implementar PUT ISAPI/AccessControl/UserInfo/Modify
});

app.get('/api/network/scan', async (req, res) => {
    try {
        // 1. Descobrir IP Local
        const interfaces = os.networkInterfaces();
        let subnet = '';

        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                // Pula internos e não-IPv4
                if (iface.family === 'IPv4' && !iface.internal) {
                    const parts = iface.address.split('.');
                    parts.pop(); // Remove o último octeto
                    subnet = parts.join('.');
                    break;
                }
            }
            if (subnet) break;
        }

        if (!subnet) return res.json({ devices: [] });

        // 2. Varrer Rede (1-254)
        const checkPort = (ip) => {
            return new Promise((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(300);

                socket.on('connect', () => {
                    socket.destroy();
                    // Porta aberta! Tentar identificar Vendor.
                    identifyVendor(ip).then(info => {
                        resolve({ ip, status: 'online', name: info.name, vendor: info.vendor });
                    });
                });

                socket.on('timeout', () => { socket.destroy(); resolve(null); });
                socket.on('error', () => { socket.destroy(); resolve(null); });

                socket.connect(80, ip);
            });
        };

        const identifyVendor = (ip) => {
            return new Promise(resolve => {
                const req = http.get(`http://${ip}/`, { timeout: 1000 }, (res) => {
                    const serverHeader = res.headers['server'] || '';
                    const authHeader = res.headers['www-authenticate'] || '';

                    let vendor = 'Desconhecido';
                    let name = `Dispositivo ${ip.split('.').pop()}`;

                    // Hikvision detection heuristics
                    if (serverHeader.includes('Hikvision') || serverHeader.includes('App-webs') || authHeader.includes('Digest')) {
                        vendor = 'Hikvision';
                        name = 'Catraca/Câmera Hikvision';
                    } else if (serverHeader.includes('BoaHttp')) {
                        vendor = 'ZKTeco'; // Comum em ZK
                    }

                    resolve({ vendor, name });
                    res.resume(); // Consume
                });
                req.on('error', () => resolve({ vendor: 'Genérico', name: `Device ${ip.split('.').pop()}` }));
                req.setTimeout(800, () => { req.abort(); resolve({ vendor: 'Genérico', name: `Device ${ip.split('.').pop()}` }); });
            });
        };

        const promises = [];
        // Scan limitado para ser rápido (apenas 50 ips vizinhos ou full se quiser)
        // Vamos fazer full 1-254 em batches
        for (let i = 1; i < 255; i++) {
            promises.push(checkPort(`${subnet}.${i}`));
        }

        const results = await Promise.all(promises);
        const found = results.filter(r => r !== null);

        res.json({ subnet, devices: found });

    } catch (e) {
        console.error("Scan Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Invoices Routes (previously defined...)
app.get('/api/invoices', (req, res) => {
    const { clientId, invoiceId, gymId } = req.query;
    if (invoiceId) {
        db.get("SELECT * FROM invoices WHERE id = ?", [invoiceId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: "Fatura não encontrada" });
            res.json({ ...row, items: JSON.parse(row.items || '[]') });
        });
    } else if (clientId) {
        db.all("SELECT * FROM invoices WHERE client_id = ? ORDER BY date DESC", [clientId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json((rows || []).map(r => ({ ...r, items: JSON.parse(r.items || '[]') })));
        });
    } else if (gymId) {
        db.all("SELECT * FROM invoices WHERE gym_id = ? ORDER BY date DESC", [gymId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json((rows || []).map(r => ({ ...r, items: JSON.parse(r.items || '[]') })));
        });
    } else {
        db.all("SELECT * FROM invoices ORDER BY date DESC", [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json((rows || []).map(r => ({ ...r, items: JSON.parse(r.items || '[]') })));
        });
    }
});
app.post('/api/invoices', (req, res) => {
    const { id, client_id, client_name, amount, status, items, date, payment_method, gym_id } = req.body;
    // Fallback to hefel_gym_v1 if no gym_id provided (compatibility)
    const targetGymId = gym_id || 'hefel_gym_v1';

    db.run(`INSERT INTO invoices (id, client_id, client_name, amount, status, items, date, payment_method, gym_id, synced) VALUES (?,?,?,?,?,?,?,?,?,0)`,
        [id, client_id, client_name, amount, status, JSON.stringify(items), date, payment_method, targetGymId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, status: 'saved_locally' });
            setTimeout(syncToCloud, 100);
        }
    );
});

// Initialize DB migration if needed (void_reason) - ensuring it runs safely
// db.run("ALTER TABLE invoices ADD COLUMN void_reason TEXT", () => {}); -- Já deve estar no boot principal


// ... (rest of DB init) ...

// Void Invoice Endpoint
app.put('/api/invoices/:id/void', (req, res) => {
    const { reason } = req.body;
    db.run("UPDATE invoices SET status = 'anulada', void_reason = ?, synced = 0 WHERE id = ?", [reason, req.params.id], (err) => {
        if (err) res.status(500).json(err);
        else {
            res.json({ status: 'ok' });
            setTimeout(syncToCloud, 500);
        }
    });
});

// === SYSTEM USERS MODULE (GESTÃO LOCAL DE UTILIZADORES) ===
// 1. Listar utilizadores de um ginásio
app.get('/api/system-users', (req, res) => {
    const { gymId } = req.query;
    if (!gymId) return res.status(400).json({ error: "Gym ID obrigatório" });

    db.all("SELECT id, name, email, role, gym_id FROM system_users WHERE gym_id = ?", [gymId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Criar novo utilizador (Ex: Gerente ou Operador)
app.post('/api/system-users', (req, res) => {
    const { name, email, password, role, gymId } = req.body;

    // Validação básica
    if (!name || !email || !password || !role || !gymId) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    const { v4: uuidv4 } = require('uuid'); // Added for uuidv4()
    const id = uuidv4();
    const sql = "INSERT INTO system_users (id, name, email, password, role, gym_id) VALUES (?, ?, ?, ?, ?, ?)";

    db.run(sql, [id, name, email, password, role, gymId], function (err) {
        if (err) {
            // Verifica duplicidade
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: "Este email já está em uso." });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id, message: "Utilizador criado com sucesso!" });
    });
});

// Pay Invoice Endpoint
app.put('/api/invoices/:id/pay', (req, res) => {
    const { payment_method, payment_ref } = req.body;
    const now = new Date().toISOString();
    db.run("UPDATE invoices SET status = 'pago', payment_method = ?, payment_ref = ?, synced = 0 WHERE id = ?",
        [payment_method, payment_ref, req.params.id], (err) => {
            if (err) res.status(500).json(err);
            else {
                res.json({ status: 'ok' });
                setTimeout(syncToCloud, 500);
            }
        }
    );
});

// Subscription
app.get('/api/subscription', async (req, res) => {
    const gymId = await getGymId();
    if (!gymId) return res.json({ status: 'setup_required' });
    db.get("SELECT * FROM saas_subscriptions WHERE gym_id = ?", [gymId], (err, row) => {
        if (!row) return res.json({ status: 'trial' });
        let features = {}; try { features = JSON.parse(row.features || '{}'); } catch (e) { }
        res.json({ ...row, features });
    });
});

// AUTO-EXPIRE USERS
app.post('/api/clients/check-inactive', (req, res) => {
    const inactiveDays = req.body.days || 60;
    console.log(`🧹 Verificando usuários inativos (> ${inactiveDays} dias)...`);
    db.run(`UPDATE clients SET status = 'inactive', synced = 0 WHERE status = 'active' AND (last_access IS NOT NULL AND date(last_access) < date('now', '-${inactiveDays} days'))`, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const count = this.changes;
        console.log(`📉 ${count} usuários marcados como inativos.`);
        res.json({ status: 'ok', markedInactive: count });
    });
});

// Agendar limpeza diária
setInterval(() => {
    const fetch = require('node-fetch'); // Ensure fetch available or use http
    // Simple direct DB call instead of fetch to self
    const inactiveDays = 60;
    db.run(`UPDATE clients SET status = 'inactive', synced = 0 WHERE status = 'active' AND (last_access IS NOT NULL AND date(last_access) < date('now', '-${inactiveDays} days'))`, (err) => {
        if (!err) console.log("🧹 Limpeza automática de inativos realizada.");
    });
}, 24 * 60 * 60 * 1000);


app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR LOCAL RODANDO NA PORTA ${PORT}`);
});

