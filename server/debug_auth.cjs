const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const crypto = require('crypto');

const db = new sqlite3.Database('./hefelgym_local.db');

// REQUEST ISAPI ISOLADO
const requestISAPI = async (device, method, path) => {
    const doRequest = (authHeader = null) => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: device.ip,
                port: 80,
                path: path,
                method: method,
                headers: {},
                timeout: 5000
            };
            if (authHeader) options.headers['Authorization'] = authHeader;

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
            });
            req.on('error', reject);
            req.end();
        });
    };

    let response = await doRequest(null);
    console.log(`[AUTH TEST] 1st Try: ${response.statusCode}`);

    if (response.statusCode === 401) {
        const authHeader = response.headers['www-authenticate'];
        console.log(`[AUTH TEST] Challenge: ${authHeader}`);

        if (authHeader && authHeader.toLowerCase().startsWith('digest')) {
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

            const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');
            const nc = '00000001';
            const cnonce = crypto.randomBytes(8).toString('hex');
            const HA1 = md5(`${device.username}:${realm}:${device.password}`);
            const HA2 = md5(`${method}:${path}`);
            let responseStr = qop ? md5(`${HA1}:${nonce}:${nc}:${cnonce}:${qop}:${HA2}`) : md5(`${HA1}:${nonce}:${HA2}`);

            let digestHeader = `Digest username="${device.username}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${responseStr}", algorithm="${algorithm}"`;
            if (qop) digestHeader += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
            if (opaque) digestHeader += `, opaque="${opaque}"`;

            console.log(`[AUTH TEST] Sending Digest...`);
            response = await doRequest(digestHeader);
            console.log(`[AUTH TEST] 2nd Try: ${response.statusCode}`);
            console.log(`[AUTH TEST] Body: ${response.data.substring(0, 200)}`);
        }
    }
};

db.get("SELECT * FROM access_devices LIMIT 1", [], async (err, device) => {
    if (err) console.error(err);
    if (!device) console.log("No device");
    else {
        console.log(`Testing Auth for ${device.ip} (${device.username})`);
        await requestISAPI(device, 'GET', '/ISAPI/System/deviceInfo');
    }
});
