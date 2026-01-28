const express = require('express');
const wppconnect = require('@wppconnect-team/wppconnect');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3001;

let clientInstance = null;
let qrCodeData = null;
let status = 'loading';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

console.log("Iniciando WPPConnect...");

wppconnect.create({
    session: 'hefelgym-wpp',
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
    logQR: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    disableWelcome: true,
    autoClose: 0,
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
    const { number, fileBase64, fileName, caption } = req.body;
    if (!clientInstance || status !== 'ready') return res.status(400).json({ error: 'Bot offline' });

    try {
        let formatNumber = number.replace(/\D/g, '');
        if (!formatNumber.startsWith('258')) formatNumber = '258' + formatNumber;
        const chatId = formatNumber + '@c.us';

        // WPPConnect uses sendFile
        await clientInstance.sendFile(chatId, fileBase64, {
            filename: fileName,
            caption: caption
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Erro envio ficheiro:", error);
        res.status(500).json({ error: error.toString() });
    }
});

app.listen(port, () => {
    console.log(`🚀 API WPPConnect na porta ${port}`);
});
