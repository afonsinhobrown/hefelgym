const fs = require('fs');

try {
    const content = fs.readFileSync('server.cjs', 'utf8');
    const lines = content.split('\n');

    console.log("--- DIAGNOSTICO ---");
    // Imprimir linhas 150 a 180
    for (let i = 150; i < 180; i++) {
        if (lines[i]) {
            console.log(`${i + 1}: ${JSON.stringify(lines[i])}`); // JSON stringify mostra escapes
        }
    }
    console.log("-------------------");
} catch (e) { console.error(e); }
