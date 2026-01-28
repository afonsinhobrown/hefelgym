const fs = require('fs');

try {
    // Ler como buffer para evitar erros de encoding imediatos, depois converter string
    const buffer = fs.readFileSync('server.cjs');
    let content = buffer.toString('utf8');

    // Correção cirúrgica da linha quebrada
    // O erro é algo como: console.log(\`[SYNC... 
    // Vamos substituir por aspas simples para garantir

    // Procura por qualquer console.log que comece com `[SYNC XML] e tenha escapes estranhos
    const regex = /console\.log\s*\(\s*\\?`\s*\[SYNC XML\].*?\);?/s;

    if (regex.test(content)) {
        console.log("Encontrei o erro! Corrigindo...");
        content = content.replace(regex, "console.log('[SYNC XML] Iniciando sincronização via XML para ' + device.ip + '...' );");
        fs.writeFileSync('server.cjs', content, 'utf8');
        console.log("SUCESSO: Arquivo salvo corretamente.");
    } else {
        console.log("Não encontrei o padrão exato, tentando correção genérica de backslash...");
        // Tenta remover backslashes antes de crases
        let newContent = content.replace(/\\`/g, "`");
        newContent = newContent.replace(/\\\$\{/g, "${");
        if (newContent !== content) {
            fs.writeFileSync('server.cjs', newContent, 'utf8');
            console.log("SUCESSO: Correções genéricas aplicadas.");
        } else {
            console.log("AVISO: Nenhuma alteração necessária encontrada.");
        }
    }

} catch (e) {
    console.error("ERRO CRITICO:", e);
}
