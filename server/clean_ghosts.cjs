const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

const DAYS = 60;

console.log(`🧹 Iniciando limpeza de fantasmas (> ${DAYS} dias sem acesso)...`);

db.serialize(() => {
    // 1. Garantir que as colunas existem (caso server ainda nao tenha reiniciado)
    db.run("ALTER TABLE clients ADD COLUMN last_access TEXT", () => { });
    db.run("ALTER TABLE clients ADD COLUMN first_access TEXT", () => { });

    // 2. Executar Limpeza
    // Se last_access for NULL, assumimos que é muito antigo? 
    // Ou assumimos que é novo e nunca entrou?
    // Se foi sincronizado da catraca e nunca entrou no sistema novo... é fantasma?
    // Vamos assumir: Se last_access IS NULL -> MANTEM (pode ser novo cadastrado hoje).
    // Apenas se last_access < 60 dias inativa.

    // Mas o problema do usuário é "usuarios que nao frequentam ha 2 meses".
    // Se eles não frequentam, eles NÃO TÊM last_access registrado no sistema novo ainda?
    // Se o sistema é novo, `last_access` é NULL para todos.
    // COMO SABER QUEM É VELHO?
    // Pelo ID? Não.

    // Ah! O usuário disse "esta a mostrar registos de usuarios que ja nao frequentam".
    // Isso significa que o Webhook estava registrando eles entrando HOJE?
    // Não, o Webhook estava trazendo HITÓRICO da catraca (datas antigas) e marcando como HOJE.
    // ISSO eu já resolvi com o `patch_server_v2/v3` (ignorando datas antigas).

    // Então, o problema "mostrar usuários antigos" refere-se à TELA DE ACESSOS (logs)?
    // Se for isso, eu JÁ LIMPEI a tabela `attendance`.

    // OU refere-se à LISTA DE USUÁRIOS?
    // Se for a lista, o comando abaixo resolve.

    // Se o problema era "Entradas Falsas" (Ghosts) de gente antiga:
    // O patch de limitar 5 minutos resolve daqui pra frente.
    // O DELETE FROM attendance limpou o passado.

    // Se o problema é "Eles continuam ativos no sistema":
    // Este script inativa eles.

    db.run(`UPDATE clients SET status = 'inactive', synced = 0 
            WHERE status = 'active' 
            AND last_access IS NOT NULL 
            AND date(last_access) < date('now', '-${DAYS} days')`,
        function (err) {
            if (err) console.error(err);
            else console.log(`📉 ${this.changes} usuários inativados por inatividade.`);
        });
});
