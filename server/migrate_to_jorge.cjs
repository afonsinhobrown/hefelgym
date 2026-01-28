const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hefelgym_local.db');

const SOURCE_GYM = 'hefel_gym_v1';
const TARGET_USER_EMAIL = 'jorge@jorge.com';

db.serialize(() => {
    console.log(`🚀 Iniciando migração de dados para ${TARGET_USER_EMAIL}...`);

    // 1. Localizar o gym_id do Jorge
    db.get("SELECT gym_id FROM system_users WHERE email = ?", [TARGET_USER_EMAIL], (err, user) => {
        if (err || !user) {
            console.error("❌ Erro: Utilizador jorge@jorge.com não encontrado.");
            db.close();
            return;
        }

        const targetGymId = user.gym_id;
        console.log(`📍 Ginásio destino: ${targetGymId}`);

        // Tabelas para clonar
        const tables = ['clients', 'products', 'plans', 'instructors', 'access_devices'];

        tables.forEach(table => {
            // Limpar dados existentes no destino para evitar duplicados se rodar 2x
            db.run(`DELETE FROM ${table} WHERE gym_id = ?`, [targetGymId], (err) => {
                if (err) console.error(`Erro ao limpar ${table}:`, err.message);

                // Clonar da fonte para o destino
                // Nota: Assumimos que as tabelas têm a coluna gym_id
                db.run(`
                    INSERT INTO ${table} 
                    SELECT * FROM ${table} WHERE gym_id = ?
                `.replace('SELECT *', `SELECT ${table === 'clients' ? 'id, name, email, phone, status, plan_id, photo, last_access, synced' : '*'}, ?`),
                    [SOURCE_GYM, targetGymId], function (err) {
                        if (err) {
                            // Se falhar o insert complexo, tentamos um simples (ajustando dinamicamente)
                            // Para facilitar, vamos apenas forçar o gym_id no final se não conseguirmos mapear colunas
                            console.log(`⚠️ Tentando clonagem simplificada para ${table}...`);
                            db.all(`PRAGMA table_info(${table})`, (err, columns) => {
                                const cols = columns.map(c => c.name).filter(c => c !== 'gym_id').join(', ');
                                db.run(`
                                INSERT INTO ${table} (${cols}, gym_id)
                                SELECT ${cols}, ? FROM ${table} WHERE gym_id = ?
                            `, [targetGymId, SOURCE_GYM], (err) => {
                                    if (err) console.error(`❌ Erro crítico em ${table}:`, err.message);
                                    else console.log(`✅ Tabela ${table} clonada com sucesso! (${this.changes || 'N'} registos)`);
                                });
                            });
                        } else {
                            console.log(`✅ Tabela ${table} clonada com sucesso!`);
                        }
                    });
            });
        });
    });
});
