const fs = require('fs');

try {
    let content = fs.readFileSync('server.cjs', 'utf8');

    const startMarker = "app.post('/api/hardware/sync-events', async (req, res) => {";
    // Tentar achar um marcador seguro de fim. Normalmente seria o próximo endpoint ou comentário.
    // O próximo bloco era o helper hikvision.
    const endMarker = "const hikvision = {";

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
        console.log(`Localizado bloco: ${startIndex} até ${endIndex}`);

        const newCode = `
app.post('/api/hardware/sync-events', async (req, res) => {
    const { deviceId } = req.body;
    db.get("SELECT * FROM access_devices WHERE id = ?", [deviceId], async (err, device) => {
        if (!device) return res.status(404).json({ error: 'Dispositivo não encontrado' });

        try {
            console.log('[SYNC XML] Iniciando sincronização via XML para ' + device.ip);
            
            // ISAPI XML Payload using ISO Clean format
            const start = new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('.')[0];
            const end = new Date().toISOString().split('.')[0];

            const xmlPayload = \`
<AcsEventCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
    <searchID>1</searchID>
    <searchResultPosition>0</searchResultPosition>
    <maxResults>50</maxResults>
    <major>0</major>
    <minor>0</minor>
    <startTime>\${start}</startTime>
    <endTime>\${end}</endTime>
</AcsEventCond>\`;

            // Send XML Request (No ?format=json)
            const response = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent', xmlPayload, 'application/xml');

            if (response.statusCode !== 200) {
                 // Retry without time filter if 400 bad content
                 if(response.statusCode === 400 && (response.data.includes('startTime') || response.data.includes('badXmlContent'))) {
                     console.log("[SYNC XML] Falha com Data. Tentando sem filtros de tempo (últimos 50)...");
                     const simpleXml = '<AcsEventCond><searchID>1</searchID><maxResults>50</maxResults><major>0</major><minor>0</minor></AcsEventCond>';
                     const retry = await requestISAPI(device, 'POST', '/ISAPI/AccessControl/AcsEvent', simpleXml, 'application/xml');
                     if(retry.statusCode === 200) {
                         return processXmlResponse(retry.data, device, res);
                     }
                 }
                 return res.json({ error: 'Erro ISAPI XML: ' + response.statusCode, details: response.data });
            }

            processXmlResponse(response.data, device, res);

        } catch (e) {
            console.error("Sync Events XML Error:", e);
            res.status(500).json({ error: e.message });
        }
    });
});

// Helper to parse XML response simply (Regex)
function processXmlResponse(xmlData, device, res) {
    let count = 0;
    
    // Split by tags to iterate items
    const chunks = xmlData.split(/<AcsEvent>/i);
    chunks.shift(); // Remove content before first tag

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        chunks.forEach(chunk => {
            const getTag = (tag) => {
                const regex = new RegExp('<' + tag + '[^>]*>(.*?)</' + tag + '>', 'i');
                const m = chunk.match(regex);
                return m ? m[1] : null;
            }

            const major = getTag('major');
            const time = getTag('time');
            const employeeNo = getTag('employeeNoString') || getTag('employeeNo');
            const name = getTag('name');
            const serialNo = getTag('serialNo');
            
            if(time && (employeeNo || major)) {
                // Ensure unique ID
                const randomPart = Math.random().toString().slice(2,8);
                const id = 'EVT' + (serialNo || Date.now() + randomPart) + '_' + device.ip;
                
                let type = 'check';
                if (device.ip.includes('149')) type = 'in';
                else if (device.ip.includes('151')) type = 'out';

                db.run('INSERT OR IGNORE INTO attendance (id, device_ip, user_id, user_name, timestamp, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                    [ id, device.ip, employeeNo || 'Unk', name || 'Desconhecido', time, type, major ],
                    function (err) { if(!err) count++; }
                );
            }
        });
        db.run("COMMIT");
    });

    res.json({ success: true, count, msg: 'Sincronizados ' + count + ' eventos (via XML).' });
}

// 
`;

        const before = content.substring(0, startIndex);
        const after = content.substring(endIndex);

        fs.writeFileSync('server.cjs', before + newCode + after, 'utf8');
        console.log("RECONSTRUCAO COMPLETA: Sucesso!");

    } else {
        console.log("ERRO: Nao encontrei os marcadores de start/end. O arquivo deve estar muito quebrado.");
    }

} catch (e) {
    console.error("ERRO:", e);
}
