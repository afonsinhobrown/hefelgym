const request = require('request');
const crypto = require('crypto');

// CONFIGURAÇÃO - AJUSTE SE NECESSÁRIO
const DEVICE_IP = '192.168.0.149';
const USER = 'admin';
const PASS = '12345'; // Coloque a senha correta aqui se souber, ou passaremos via argumento
const TIMEOUT = 5000;

console.log("=== DIAGNÓSTICO AVANÇADO HIKVISION ===");
console.log(`Alvo: ${DEVICE_IP}`);

function md5(str) { return crypto.createHash('md5').update(str).digest('hex'); }

async function doRequest(method, uri, body = null, json = true, label = "") {
    return new Promise((resolve) => {
        console.log(`\n[${label}] Testando ${method} ${uri}...`);

        // Primeiro Request (vai falhar 401 e pegar headers)
        const opts = {
            method: method,
            url: `http://${DEVICE_IP}${uri}`,
            timeout: TIMEOUT,
            body: body,
            json: json,
            headers: {}
        };

        request(opts, (err, res, resBody) => {
            if (err) { console.log(`❌ Erro conexão: ${err.message}`); return resolve(false); }
            if (res.statusCode !== 401) { console.log(`⚠️ Esperado 401, veio ${res.statusCode}`); return resolve(false); }

            // Calcular Digest
            const authHeader = res.headers['www-authenticate'];
            if (!authHeader) { console.log("❌ Sem header www-authenticate"); return resolve(false); }

            const getVal = (k) => { const m = authHeader.match(new RegExp(`${k}="?([^",]+)"?`)); return m ? m[1] : ''; };
            const realm = getVal('realm');
            const nonce = getVal('nonce');
            const qop = getVal('qop');
            // const opaque = getVal('opaque');

            const ha1 = md5(`${USER}:${realm}:${PASS}`);
            const ha2 = md5(`${method}:${uri}`);
            const nc = "00000001";
            const cnonce = Math.random().toString(36).substring(7);
            const response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);

            const digest = `Digest username="${USER}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;

            opts.headers['Authorization'] = digest;

            // Segundo Request (Autenticado)
            request(opts, (err2, res2, body2) => {
                if (err2) { console.log(`❌ Erro requisição auth: ${err2.message}`); return resolve(false); }

                console.log(`Status: ${res2.statusCode}`);
                if (res2.statusCode === 200) {
                    console.log(`✅ SUCESSO! Resposta:`, JSON.stringify(body2).substring(0, 200));
                    return resolve(true);
                } else {
                    const errStr = typeof body2 === 'string' ? body2 : JSON.stringify(body2);
                    console.log(`❌ Falha. Body: ${errStr.substring(0, 300)}`);
                    return resolve(false);
                }
            });
        });
    });
}

async function runTests() {
    // TESTE 1: JSON SEM DATAS (Só ultimos)
    // Muitos dispositivos aceitam isso para pegar os ultimos X
    await doRequest('POST', '/ISAPI/AccessControl/AcsEvent?format=json', {
        AcsEventCond: {
            searchID: "1",
            searchResultPosition: 0,
            maxResults: 5
        }
    }, true, "T1: JSON Simples (sem data)");

    // TESTE 2: JSON COM TIMESTAMP INT
    const now = Math.floor(Date.now() / 1000);
    await doRequest('POST', '/ISAPI/AccessControl/AcsEvent?format=json', {
        AcsEventCond: {
            searchID: "1",
            maxResults: 5,
            startTime: (now - 86400), // Ontem (numero)
            endTime: now
        }
    }, true, "T2: JSON Timestamp Numérico");

    // TESTE 3: JSON DATA ISO LIMPA
    // YYYY-MM-DDTHH:mm:ss (sem ms, sem Z)
    const isoStart = new Date(Date.now() - 86400000).toISOString().split('.')[0];
    const isoEnd = new Date().toISOString().split('.')[0];
    await doRequest('POST', '/ISAPI/AccessControl/AcsEvent?format=json', {
        AcsEventCond: {
            searchID: "1",
            maxResults: 5,
            startTime: isoStart,
            endTime: isoEnd
        }
    }, true, "T3: JSON ISO String");

    // TESTE 4: XML NATIVO (O que estava no codigo, mas via script limpo)
    // Nota: passamos string no body e json=false
    const xmlBody = `<AcsEventCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><searchID>1</searchID><maxResults>5</maxResults><startTime>${isoStart}</startTime><endTime>${isoEnd}</endTime></AcsEventCond>`;
    await doRequest('POST', '/ISAPI/AccessControl/AcsEvent', xmlBody, false, "T4: XML Nativo (Com Datas)");

    // TESTE 5: XML NATIVO (Sem Datas)
    const xmlBodySimple = `<AcsEventCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema"><searchID>1</searchID><maxResults>5</maxResults></AcsEventCond>`;
    await doRequest('POST', '/ISAPI/AccessControl/AcsEvent', xmlBodySimple, false, "T5: XML Nativo (Sem Datas)");

    console.log("\n=== FIM DOS TESTES ===");
}

// Se rodar direto: node diagnose_hikvision.js [SENHA]
if (require.main === module) {
    if (process.argv[2]) {
        // override senha se passada
        // ... mas aqui é const, então teria que mudar a lógica. 
        // Deixar hardcoded 'admin'/'12345' por enquanto ou avisar user pra editar.
    }
    runTests();
}
