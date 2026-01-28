import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const http = require('http');
const crypto = require('crypto');

const device = {
    ip: '192.168.0.151',
    port: 80,
    username: 'admin',
    password: '@dmin2520'
};

const path = '/ISAPI/AccessControl/RemoteControl/door/1';
const method = 'PUT';
const xml = '<RemoteControlDoor><cmd>open</cmd></RemoteControlDoor>';

console.log(`[TEST] Starting Test against ${device.ip}...`);

const doRequest = (authHeader = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: device.ip,
            port: device.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/xml',
                'Content-Length': Buffer.byteLength(xml)
            },
            timeout: 5000
        };
        if (authHeader) options.headers['Authorization'] = authHeader;

        console.log(`[REQ] Sending ${method} (Auth: ${authHeader ? 'digest/basic' : 'none'})...`);
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, headers: res.headers, data });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(xml);
        req.end();
    });
};

(async () => {
    try {
        // 1. First Try (Basic or None to trigger Challenge)
        // Note: Python requests.auth.HTTPDigestAuth usually sends no auth first, waits for 401, then sends Digest.
        // We will send Empty auth first to be clean.
        let response = await doRequest();

        console.log(`[RES 1] Status: ${response.statusCode}`);
        if (response.statusCode !== 401) {
            console.log("Success/Failure without Auth? Body:", response.data);
            return;
        }

        const authHeader = response.headers['www-authenticate'];
        console.log(`[RES 1] Auth Header: ${authHeader}`);

        if (!authHeader) {
            console.error("❌ CRITICAL: No 'www-authenticate' header received!");
            console.log("Headers received:", JSON.stringify(response.headers, null, 2));
            return;
        }

        if (authHeader.toLowerCase().startsWith('digest')) {
            console.log("✅ Digest Challenge received. Calculating...");

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
            const nc = '00000001';
            const cnonce = crypto.randomBytes(8).toString('hex');

            const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

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

            // 2. Second Try with Digest
            response = await doRequest(digestHeader);
            console.log(`[RES 2] Status: ${response.statusCode}`);
            console.log(`[RES 2] Body: ${response.data}`);
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
})();
