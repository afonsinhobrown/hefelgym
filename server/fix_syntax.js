const fs = require('fs');
const path = './server.cjs';

try {
    let content = fs.readFileSync(path, 'utf8');
    // Se falhar em ler utf8 correto (ex: se for utf16), vai dar string zoada.
    // Mas vamos tentar replace simples.

    // Fix backslash escapes introduced erroneously
    content = content.replace(/console\.log\(`\[/g, "console.log(`["); // Tenta casar o certo primeiro, se tiver errado corrige
    content = content.replace(/console\.log\(\\`/g, "console.log(`"); // Corrige `\` antes de `
    content = content.replace(/\\\${/g, "${"); // Corrige `\${` para `${`

    // Force simple quote logic just to be safe for that line
    content = content.replace(/console\.log\((.*?)\[SYNC XML\](.*?)\)/, "console.log('[SYNC XML] Iniciando sincronização via XML para ' + device.ip + '...')");

    fs.writeFileSync(path, content, 'utf8');
    console.log("File fixed and saved as UTF-8");
} catch (e) {
    console.error("Error:", e);
}
