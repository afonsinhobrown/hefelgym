
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'hefelgym_local.db');
const db = new sqlite3.Database(dbPath);

const orderedList = [
    'HENRIQUES JOSÉ BAMBO',
    'FELÍCIA CUSTÓDIO VICTORINO',
    'NÁDIA VICTORINO INROGA MACHEL',
    'ÉRICA CECÍLIA HENRIQUES BAMBO',
    'JANUÁRIO LISSUNA',
    'HERMELINO ANTÓNIO GINAMA',
    'GIL LÉLIO COSSA',
    'JULIA CANHAVANE',
    'ARMANDO MACHEL JÚNIOR',
    'DAVID ELIAS JOZINE',
    'SEBASTIÃO DANIEL MATHLULA',
    'ALBERTO AGOSTINHO MASSALANE',
    'VASCO SAVECA',
    'DORCIDIA MAOZE MUGUANDE',
    'CUSTODIO EMILIO LANGA',
    'SALIMO MADALENA CUNA',
    'VICENTE SALOMÃO NHANTUMBO',
    'CASIMIRO ANTÓNIO BERNARDO',
    'CALISTO PEDRO MAPSANGANHE',
    'LUÍS LOURINO NHATUMBO',
    'ALFREDO MÁRIO LUÍS',
    'HELENA AMÉRICO MANJATE'
];

db.serialize(() => {
    console.log("📊 Aplicando hierarquia oficial (1 a 22)...");

    orderedList.forEach((name, index) => {
        const order = index + 1;
        db.run(`UPDATE instructors SET order_index = ? WHERE UPPER(name) = ? OR name = ?`, [order, name, name], (err) => {
            if (err) console.error(`Erro ao ordenar ${name}:`, err.message);
        });
    });

    console.log("✅ Hierarquia aplicada com sucesso!");
});

db.close();
