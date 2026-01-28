const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const crypto = require('crypto');
const db = new sqlite3.Database('./hefelgym_local.db');

const requestISAPI = async (device, method, path, body = null, contentType = 'application/json') => {
    const doRequest = (authHeader = null) => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: device.ip,
                port: 80,
                path: path,
                method: method,
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': body ? Buffer.byteLength(body) : 0
                },
                timeout: 5000
            };
            if (authHeader) options.headers['Authorization'] = authHeader;

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
            });
            req.on('error', reject);
            if (body) req.write(body);
            req.end();
        });
    };

    let response = await doRequest(null);

    if (response.statusCode === 401) {
        const authHeader = response.headers['www-authenticate'];
        if (authHeader && authHeader.toLowerCase().startsWith('digest')) {
            const challenge = {};
            const re = /(\w+)=("[^"]*"|[^,]*)/g;
            let match;
            while (match = re.exec(authHeader)) {
                challenge[match[1]] = match[2].replace(/^"|"$/g, '');
            }
            const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');
            const nc = '00000001';
            const cnonce = crypto.randomBytes(8).toString('hex');
            const HA1 = md5(`${device.username}:${challenge.realm}:${device.password}`);
            const HA2 = md5(`${method}:${path}`);
            const responseStr = md5(`${HA1}:${challenge.nonce}:${nc}:${cnonce}:${challenge.qop}:${HA2}`);
            const digestHeader = `Digest username="${device.username}", realm="${challenge.realm}", nonce="${challenge.nonce}", uri="${path}", response="${responseStr}", algorithm="MD5", qop=${challenge.qop}, nc=${nc}, cnonce="${cnonce}"`;

            response = await doRequest(digestHeader);
        }
    }
    return response;
};

// ==========================================
// TESTE PRINCIPAL
// ==========================================
db.get("SELECT * FROM access_devices LIMIT 1", [], async (err, device) => {
    if (err || !device) { console.log("Sem dispositivo"); return; }

    console.log(`🔍 ESCANEANDO EVENTOS EM ${device.ip}...`);

    const jsonPayload = JSON.stringify({
        AcsEventCond: {
            searchID: "TEST_JSON",
            searchResultPosition: 0,
            maxResults: 15,
            startTime: "2026-01-24T00:00:00",
            endTime: "2026-01-24T23:59:59"
        }
    });

    try {
        console.log("Tentando JSON Puro...", jsonPayload);
        // FORCE application/json e ?format=json
        const response = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent?format=json', jsonPayload, 'application/json');

        console.log(`STATUS: ${response.statusCode}`);
        console.log("BODY:", response.data.substring(0, 600));

    } catch (e) {
        console.error("Erro fatal:", e);
    }
});
