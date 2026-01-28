const express = require('express');
const wppconnect = require('@wppconnect-team/wppconnect');
const cors = require('cors');
const fs = require('fs');
const HikvisionService = require('./hikvision'); // Importar Módulo Catraca

const app = express();
const port = 3001;

// Carregar Configurações
let config = {};
try {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (e) {
    console.error("Erro ao ler config.json, usando defaults");
    config = { hikvision: { ip: '192.168.1.64', user: 'admin', password: '@dmin2520' } };
}

// Configuração da Catraca
let hikvision = null;

function connectHiking() {
    if (!config.hikvision?.ip) return;
    console.log(`🔌 Conectando à catraca em ${config.hikvision.ip}...`);
    hikvision = new HikvisionService(config.hikvision.ip, config.hikvision.user, config.hikvision.password);

    hikvision.testConnection().then(res => {
        if (res.success) console.log('✅ CATRACA CONECTADA:', config.hikvision.ip);
        else console.warn('⚠️ FALHA CONEXÃO CATRACA:', res.error || res.status);
    });
}

connectHiking();

let clientInstance = null;
let qrCodeData = null;
let status = 'loading';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

console.log("Iniciando WPPConnect...");

wppconnect.create({
    session: 'hefelgym-pos-final', // Nova sessão limpa para evitar erros de bloqueio
    catchQR: (base64Qr, asciiQR) => {
        console.log('✅ QR CODE RECEBIDO');
        qrCodeData = base64Qr;
        status = 'qr_ready';
    },
    statusFind: (statusSession, session) => {
        console.log('Status Sessão:', statusSession);

        if (statusSession === 'isLogged' || statusSession === 'successChat' || statusSession === 'inChat') {
            status = 'ready';
            qrCodeData = null;
        }

        if (statusSession === 'notLogged' || statusSession === 'desconnectedMobile' || statusSession === 'browserClose') {
            status = 'disconnected';
        }
    },
    headless: true, // Keep hidden
    devtools: false,
    useChrome: false,
    debug: false,
    logQR: false, // Disable terminal log to avoid deprecation warnings
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    disableWelcome: true,
    autoClose: 0,
    puppeteerOptions: {
        timeout: 0,
        protocolTimeout: 1200000
    }
})
    .then((client) => {
        console.log('🎉 WPPConnect Iniciado!');
        clientInstance = client;
        status = 'ready';
    })
    .catch((erro) => {
        console.error('Erro WPPConnect:', erro);
        status = 'error';
    });

// APIs

app.get('/status', (req, res) => {
    res.json({ status, qrCode: qrCodeData });
});

app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    if (!clientInstance || status !== 'ready') return res.status(400).json({ error: 'Bot offline' });

    try {
        let formatNumber = number.replace(/\D/g, '');
        if (!formatNumber.startsWith('258')) formatNumber = '258' + formatNumber;
        const chatId = formatNumber + '@c.us';

        await clientInstance.sendText(chatId, message);
        res.json({ success: true });
    } catch (error) {
        console.error("Erro envio:", error);
        res.status(500).json({ error: error.toString() });
    }
});

// Send File
app.post('/send-file', async (req, res) => {
    let { number, fileBase64, fileName, caption } = req.body;
    if (!clientInstance || status !== 'ready') return res.status(400).json({ error: 'Bot offline' });

    try {
        let formatNumber = number.replace(/\D/g, '');
        if (!formatNumber.startsWith('258')) formatNumber = '258' + formatNumber;
        const chatId = formatNumber + '@c.us';

        // LIMPEZA E CRIAÇÃO DO FICHEIRO TEMPORÁRIO
        // 1. Remover prefixo Data URI se existir (data:application/pdf;base64,)
        const base64Data = fileBase64.replace(/^data:.*,/, "");

        // 2. Criar pasta temporária se não existir
        const tempDir = './temp_docs';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // 3. Caminho completo do ficheiro
        const filePath = `${tempDir}/${fileName}`;

        // 4. Salvar ficheiro no disco
        fs.writeFileSync(filePath, base64Data, 'base64');
        console.log(`Ficheiro salvo temporariamente em: ${filePath}`);

        // 5. Enviar usando o caminnho do ficheiro (Mais robusto)
        await clientInstance.sendFile(chatId, filePath, fileName, caption);

        console.log('Ficheiro enviado com sucesso via path!');
        res.json({ success: true });

        // 6. Limpeza (opcional, pode remover o ficheiro depois de alguns segundos)
        // setTimeout(() => fs.unlinkSync(filePath), 10000); 

    } catch (error) {
        console.error("Erro envio ficheiro:", error);
        res.status(500).json({ error: error.toString() });
    }
});

// === API CONFIGURAÇÃO ===
app.post('/config/update', (req, res) => {
    const { hikvision: newHik, whatsapp } = req.body;

    // Atualizar objeto config
    if (newHik) {
        config.hikvision = { ...config.hikvision, ...newHik };
        // Reconectar catraca
        connectHiking();
    }
    if (whatsapp) {
        config.whatsapp = { ...config.whatsapp, ...whatsapp };
    }

    // Salvar em disco
    try {
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        res.json({ success: true, message: 'Configurações salvas e aplicadas' });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Erro ao salvar config.json' });
    }
});

app.get('/config/get', (req, res) => {
    // Retornar config (ocultando senha por segurança se quisesse, mas aqui é admin local)
    res.json(config);
});

// === API CATRACA (HIKVISION) ===

app.post('/catraca/open', async (req, res) => {
    console.log("🚪 Comando de Abertura Remota Recebido");
    const success = await hikvision.remoteOpenDoor(1);
    if (success) res.json({ success: true, message: 'Porta Aberta' });
    else res.status(500).json({ success: false, error: 'Falha ao comunicar com catraca' });
});

app.post('/catraca/sync-user', async (req, res) => {
    const { id, name, userType } = req.body;
    console.log(`👤 Sincronizando user ${name} (${id})...`);
    try {
        const result = await hikvision.addUser(id, name, userType || 'normal');
        res.json({ success: true, result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
