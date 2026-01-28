const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.cjs');

try {
    let content = fs.readFileSync(serverPath, 'utf8');

    const startStr = "// WEBHOOK HIKVISION (Real-time Events - RAW HANDLER)";
    const endStr = "const hikvision = {";

    const startIdx = content.indexOf(startStr);
    const endIdx = content.indexOf(endStr);

    if (startIdx === -1 || endIdx === -1) {
        throw new Error(`Markers not found. Start: ${startIdx}, End: ${endIdx}`);
    }

    const newCode = `// WEBHOOK HIKVISION (Real-time Events - RAW HANDLER)
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
                        rootData = parsed; 
                        eventBody = parsed.AccessControllerEvent; 
                    } catch(e) { /* ignore */ }
                 }
            }

            if(eventBody) {
                const name = eventBody.name;
                const employeeNo = eventBody.employeeNoString || eventBody.employeeNo;
                const major = eventBody.majorEventType;
                const sub = eventBody.subEventType;
                const time = new Date().toISOString(); 

                const isValidAccess = (major === 5 && sub === 75) || (major === 196);
                const hasUser = (name && name !== 'undefined' && name.length > 0);

                if (isValidAccess || hasUser) {
                    // Determinar Entrada/Saída pelo IP
                    let type = 'check';
                    const ip = req.ip || '';
                    if (ip.includes('149')) type = 'in';
                    else if (ip.includes('151')) type = 'out';

                    console.log(\`✅ [WEBHOOK] ACESSO (\${type.toUpperCase()}): \${name} (\${employeeNo})\`);

                    const id = 'WH_' + Date.now() + '_' + Math.random().toString().slice(2,5);

                    db.run('INSERT OR IGNORE INTO attendance (id, device_ip, user_id, user_name, timestamp, type, method) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                        [ id, ip || '0.0.0.0', employeeNo || 'Unk', name || 'Desconhecido', time, type, sub ],
                        (err) => { 
                            if(err) console.error("DB Error:", err.message);
                            else console.log("💾 Salvo no Banco.");
                        }
                    );
                }
            }
        } catch (e) { console.error("Webhook Error:", e); }
        res.status(200).send('OK');
    });
});

`;

    const newContent = content.substring(0, startIdx) + newCode + content.substring(endIdx);

    fs.writeFileSync(serverPath, newContent, 'utf8');
    console.log("✅ PATCH V3 SUCCESSFUL (IP Logic Updated)");

} catch (e) {
    console.error("❌ PATCH FAILED:", e.message);
    process.exit(1);
}
