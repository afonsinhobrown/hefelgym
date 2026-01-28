const sqlite3 = require('sqlite3').verbose();
const http = require('http'); // ISAPI usa Digest, precisa de logica complexa ou usar o helper do server
// Como nao tenho acesso facil ao helper 'requestISAPI' aqui fora, vou fazer um fetch para o proprio server local
// Mas vou criar uma rota temporaria ou usar o debug? 
// Melhor: Vou criar um script que roda DENTRO do contexto do server depois? 
// Nao, vou fazer um script standalone que conecta no banco, le a senha, e faz o request digest na mao.

// Simplificação: Vou usar o servidor que JÁ ESTÁ RODANDO.
// Vou alterar o endpoint de SYNC temporariamente ou passar um parametro?
// O endpoint sync-events está hardcoded para 2 horas.

// PLANO: Vou criar um script 'restore_today.js' que faz o seguinte:
// 1. Lê os dispositivos do banco sqlite.
// 2. Para cada dispositivo, chama o endpoint /api/debug/sync-events-raw (que eu criei antes) 
//    MAS espere, o debug endpoint usa params hardcoded (ontem->hoje).
//    Vou modificar o server para aceitar parametros de data no debug ou no sync.

// MELHOR: Vou editar o server.cjs rapidinho para que o botão Sincronizar busque O DIA TODO (desde 00:00) ao invés de só 2 horas.
// Assim você clica e resolve.

const fs = require('fs');
const path = require('path');
const serverPath = path.join(__dirname, 'server.cjs');
let content = fs.readFileSync(serverPath, 'utf8');

// Muda: const twoHoursAgo = now - (2 * 60 * 60 * 1000);
// Para: const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);

const oldLogic = `const twoHoursAgo = now - (2 * 60 * 60 * 1000);`;
const newLogic = `const startOfDay = new Date(); startOfDay.setHours(0,0,0,0); const twoHoursAgo = startOfDay.getTime(); // Force Start of Day`;

if (content.includes(oldLogic)) {
    content = content.replace(oldLogic, newLogic);
    fs.writeFileSync(serverPath, content);
    console.log("✅ Servidor ajustado para buscar o DIA TODO no sincronizar.");
} else {
    // Fallback se o codigo nao for exatamente igual (espacos etc)
    console.log("⚠️ Não foi possível aplicar patch automatico (codigo diferente).");
}
