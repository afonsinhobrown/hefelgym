
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'hefelgym_local.db');
const db = new sqlite3.Database(dbPath);

const columns = [
    "base_salary REAL DEFAULT 0",
    "bonus REAL DEFAULT 0",
    "inss_discount REAL DEFAULT 0",
    "irt_discount REAL DEFAULT 0",
    "other_deductions REAL DEFAULT 0",
    "absences_discount REAL DEFAULT 0",
    "net_salary REAL DEFAULT 0",
    "shift_bonus REAL DEFAULT 0",
    "holiday_bonus REAL DEFAULT 0",
    "night_bonus REAL DEFAULT 0",
    "account_number TEXT",
    "extra_hours REAL DEFAULT 0",
    "additional_earnings REAL DEFAULT 0",
    "inss_company REAL DEFAULT 0",
    "irps REAL DEFAULT 0"
];

db.serialize(() => {
    console.log("🛠️ Garantindo colunas na tabela de instrutores...");
    columns.forEach(col => {
        const name = col.split(' ')[0];
        db.run(`ALTER TABLE instructors ADD COLUMN ${col}`, (err) => {
            if (err) {
                // Provavelmente a coluna já existe
                console.log(`ℹ️ Coluna ${name} já existe ou erro: ${err.message}`);
            } else {
                console.log(`✅ Coluna ${name} adicionada.`);
            }
        });
    });
});

db.close();
