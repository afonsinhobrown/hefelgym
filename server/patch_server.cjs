const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

const startMarker = "// WEBHOOK HIKVISION (Real-time Events - RAW HANDLER)";
const endMarker = "const hikvision = {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newWebhookCode = `// WEBHOOK HIKVISION (Real-time Events - RAW HANDLER)
app.post('/api/webhook/hikvision', (req, res) => {
    // console.log('🔔 [WEBHOOK] PING...'); 
    
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', function(chunk) { 
        data += chunk;
    });

    req.on('end', function() {
        try {
            let eventBody = null;
            let rootData = {};

            // 1. Extrair JSON do Multipart
            if(data.includes('{')) {
                 const jsonMatch = data.match(/({[\\s\\S]*})/);
                 if(jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[1]);
                        rootData = parsed; // Root object (has dateTime)
                        eventBody = parsed.AccessControllerEvent; // Sub-object (has user data)
                    } catch(e) { /* ignore JSON error */ }
                 }
            }

            if(eventBody) {
                const name = eventBody.name;
                const employeeNo = eventBody.employeeNoString || eventBody.employeeNo;
                const major = eventBody.majorEventType;
                const sub = eventBody.subEventType;
                
                // DATA: Usar hora do servidor se a catraca estiver errada (2025 vs 2026),
                // para garantir que apareça na view "Hoje".
                const time = new Date().toISOString(); 

                // Validação de Acesso:
                // Major 5 + Sub 75 = Access Granted (Face/Card)
                // Major 196 = Access Granted (Legacy)
                // Ignorar "status" pings sem nome
                const isValidAccess = (major === 5 && sub === 75) || (major === 196);
                const hasUser = (name && name !== 'undefined' && name.length > 0);

                if (isValidAccess || hasUser) {
                    console.log(\`✅ [WEBHOOK] ACESSO: \${name} (\${employeeNo}) - Sub: \${sub}\`);

                    const id = 'WH_' + Date.now() + '_' + Math.random().toString().slice(2,5);
                    const type = 'check'; // Padrão

                    db.run('INSERT OR IGNORE INTO attendance (id, device_ip, user_id, user_name, timestamp, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                        [ id, req.ip || '0.0.0.0', employeeNo || 'Unk', name || 'Desconhecido', time, type, sub ],
                        (err) => { 
                            if(err) console.error("DB Error:", err.message);
                            else console.log("💾 Salvo no Banco.");
                        }
                    );
                }
            } else {
                // console.log("⚠️ JSON não encontrado.");
            }

        } catch (e) {
            console.error("Webhook Processing Error:", e);
        }
        
        res.status(200).send('OK');
    });
});

// 
`;

    const newContent = content.substring(0, startIndex) + newWebhookCode + content.substring(endIndex);
    fs.writeFileSync(serverPath, newContent, 'utf8');
    console.log("Success: Webhook patched.");
} else {
    console.log("Error: Markers not found.");
    console.log("Start:", startIndex, "End:", endIndex);
}
