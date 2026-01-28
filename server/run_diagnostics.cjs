const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const db = new sqlite3.Database('./hefelgym_local.db');

const doRequest = (path, payload) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(payload)) }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(JSON.stringify(payload));
        req.end();
    });
};

db.get("SELECT * FROM access_devices LIMIT 1", [], async (err, device) => {
    if (err || !device) { console.log("Sem dispositivo no banco."); return; }

    console.log(`🔍 Iniciando Diagnóstico para Device: ${device.name} (${device.ip})`);

    // 1. PING
    console.log("\n--- 1. TESTE DE PING ---");
    try {
        const ping = await doRequest('/api/hardware/ping', { deviceId: device.id });
        console.log("PING Result:", ping.body);
    } catch (e) { console.log("Erro Ping:", e.message); }

    // 2. WEBHOOK
    console.log("\n--- 2. CONFIGURAR WEBHOOK (Correção Definitiva) ---");
    try {
        // Encontrar meu IP local
        const ip = require('os').networkInterfaces();
        let myIP = '192.168.0.100'; // Fallback
        for (const name of Object.keys(ip)) {
            for (const net of ip[name]) {
                if (net.family === 'IPv4' && !net.internal && net.address.startsWith('192')) {
                    myIP = net.address;
                }
            }
        }
        console.log(`Meu IP Local: ${myIP}`);

        const hook = await doRequest('/api/hardware/setup-webhook', { deviceId: device.id, serverUrl: `${myIP}:3001` });
        console.log("WEBHOOK Config Result:", hook.body);
    } catch (e) { console.log("Erro Webhook:", e.message); }

    // 3. TEST NOW
    console.log("\n--- 3. LER EVENTOS IMEDIATOS (XML Force) ---");
    try {
        const now = await doRequest('/api/hardware/test-events-now', { deviceId: device.id });
        console.log("TEST NOW Result:", now.body.substring(0, 500) + "...");
    } catch (e) { console.log("Erro Test Now:", e.message); }

});
