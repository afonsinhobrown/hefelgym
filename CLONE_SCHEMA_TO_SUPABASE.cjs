require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./hefelgym_local.db');

// Mapeamento de tipos SQLite -> PostgreSQL
const typeMap = {
    'TEXT': 'TEXT',
    'INTEGER': 'INTEGER',
    'REAL': 'REAL',
    'BLOB': 'BYTEA',
    'NUMERIC': 'NUMERIC'
};

async function getTableSchema(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
            if (err) reject(err);
            else resolve(columns);
        });
    });
}

async function getAllTables() {
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, tables) => {
            if (err) reject(err);
            else resolve(tables.map(t => t.name));
        });
    });
}

async function generateCreateTableSQL(tableName, columns) {
    const columnDefs = columns.map((col, idx) => {
        const type = typeMap[col.type] || 'TEXT';
        const notNull = col.notnull ? 'NOT NULL' : '';
        const defaultVal = col.dflt_value ? `DEFAULT ${col.dflt_value}` : '';
        const pk = col.pk ? 'PRIMARY KEY' : '';

        const parts = [col.name, type, notNull, defaultVal, pk].filter(p => p).join(' ');
        return `    ${parts}`;
    });

    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnDefs.join(',\n')}\n);`;
}

async function cloneSchema() {
    try {
        console.log('🔍 A analisar estrutura do SQLite local...\n');

        const tables = await getAllTables();
        console.log(`📊 Encontradas ${tables.length} tabelas:\n${tables.map(t => `   - ${t}`).join('\n')}\n`);

        let fullSQL = '-- SCHEMA COMPLETO GERADO AUTOMATICAMENTE DO SQLITE\n\n';

        for (const table of tables) {
            const columns = await getTableSchema(table);
            const createSQL = await generateCreateTableSQL(table, columns);

            console.log(`✅ ${table} (${columns.length} colunas)`);
            fullSQL += `-- Tabela: ${table}\n${createSQL}\n\n`;
        }

        // Salvar SQL gerado
        fs.writeFileSync('./SUPABASE_FULL_SCHEMA.sql', fullSQL);

        console.log('\n✅ Schema completo gerado em: SUPABASE_FULL_SCHEMA.sql');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Abre o Supabase Dashboard → SQL Editor');
        console.log('2. Copia e cola o conteúdo de SUPABASE_FULL_SCHEMA.sql');
        console.log('3. Executa o SQL');
        console.log('4. Depois executa: node SYNC_ALL_DATA.cjs\n');

    } catch (err) {
        console.error('❌ Erro:', err);
    } finally {
        db.close();
    }
}

cloneSchema();
