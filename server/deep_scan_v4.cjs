const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const crypto = require('crypto');
const db = new sqlite3.Database('./hefelgym_local.db');

const requestISAPI = async (device, method, path, body = null, contentType = 'application/json') => {
    const doRequest = (authHeader = null) => {
        return new Promise((resolve, reject) => {
            // ... (código igual) ...
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
        // ... (auth igual) ...
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
// TESTE V4 - SEM T E COM 2025
// ==========================================
db.get("SELECT * FROM access_devices LIMIT 1", [], async (err, device) => {
    if (err || !device) return;

    console.log(`🔍 V4: Tentando 2025 e 2026 SEM 'T'...`);

    // TENTATIVA A: 2026 SEM T
    const jsonPayloadA = JSON.stringify({
        AcsEventCond: {
            searchID: "TEST_V4_A",
            searchResultPosition: 0,
            maxResults: 15,
            major: 5, minor: 75,
            startTime: "2026-01-24 00:00:00",
            endTime: "2026-01-24 23:59:59"
        }
    });

    // TENTATIVA B: 2025 COM T (Se a A falhar)
    const jsonPayloadB = JSON.stringify({
        AcsEventCond: {
            searchID: "TEST_V4_B",
            searchResultPosition: 0,
            maxResults: 15,
            major: 5, minor: 75,
            startTime: "2025-01-24T00:00:00",
            endTime: "2025-01-24T23:59:59"
        }
    });

    try {
        console.log("--> Tentando A (2026 Space):");
        let r = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent?format=json', jsonPayloadA, 'application/json');
        console.log(`STATUS A: ${r.statusCode}`);
        if (r.statusCode === 200) console.log(r.data.substring(0, 200));
        else console.log(r.data);

        console.log("\n--> Tentando B (2025 ISO):");
        r = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent?format=json', jsonPayloadB, 'application/json');
        console.log(`STATUS B: ${r.statusCode}`);
        if (r.statusCode === 200) console.log(r.data.substring(0, 200));
        else console.log(r.data);

    } catch (e) { console.error(e); }
});
