
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'hefelgym_local.db');
const db = new sqlite3.Database(dbPath);

const employees = [
    { name: 'HENRIQUES JOSÉ BAMBO', role: 'manager', specialty: 'Administrador', base_salary: 30000 },
    { name: 'FELÍCIA CUSTÓDIO VICTORINO', role: 'manager', specialty: 'Coordenadora', base_salary: 15000 },
    { name: 'NÁDIA VICTORINO INROGA MACHEL', role: 'manager', specialty: 'Diretora Administrativa', base_salary: 15000 },
    { name: 'ÉRICA CECÍLIA HENRIQUES BAMBO', role: 'manager', specialty: 'Assistente de Direção', base_salary: 13500 },
    { name: 'JANUÁRIO LISSUNA', role: 'internal', specialty: 'Diretor Técnico', base_salary: 13500, inss_exempt: true },
    { name: 'HERMELINO ANTÓNIO GINAMA', role: 'manager', specialty: 'Assessor Jurídico', base_salary: 12400 },
    { name: 'GIL LÉLIO COSSA', role: 'manager', specialty: 'Gestor de Relações Públicas e Marketing', base_salary: 12000 },
    { name: 'JULIA CANHAVANE', role: 'internal', specialty: 'Instrutora', base_salary: 12000 },
    { name: 'ARMANDO MACHEL JÚNIOR', role: 'internal', specialty: 'Monitor', base_salary: 12000 },
    { name: 'DAVID ELIAS JOZINE', role: 'internal', specialty: 'Monitor', base_salary: 12000, bonus: 10310 },
    { name: 'SEBASTIÃO DANIEL MATHLULA', role: 'internal', specialty: 'Monitor', base_salary: 12000, absences: 2400 },
    { name: 'ALBERTO AGOSTINHO MASSALANE', role: 'internal', specialty: 'Monitor', base_salary: 12000, absences: 2000 },
    { name: 'VASCO SAVECA', role: 'receptionist', specialty: 'Contabilista', base_salary: 12000 },
    { name: 'DORCIDIA MAOZE MUGUANDE', role: 'receptionist', specialty: 'Contabilista', base_salary: 12000 },
    { name: 'CUSTODIO EMILIO LANGA', role: 'receptionist', specialty: 'Contabilista', base_salary: 12000 },
    { name: 'SALIMO MADALENA CUNA', role: 'maintenance', specialty: 'Técnico de Manutenção', base_salary: 12000 },
    { name: 'VICENTE SALOMÃO NHANTUMBO', role: 'maintenance', specialty: 'Motorista', base_salary: 12000 },
    { name: 'CASIMIRO ANTÓNIO BERNARDO', role: 'security', specialty: 'Segurança/Auxiliar', base_salary: 10310 },
    { name: 'CALISTO PEDRO MAPSANGANHE', role: 'security', specialty: 'Segurança', base_salary: 10310 },
    { name: 'LUÍS LOURINO NHATUMBO', role: 'security', specialty: 'Segurança', base_salary: 10310 },
    { name: 'ALFREDO MÁRIO LUÍS', role: 'security', specialty: 'Segurança', base_salary: 10310 },
    { name: 'HELENA AMÉRICO MANJATE', role: 'cleaner', specialty: 'Auxiliar', base_salary: 10310 }
];

db.serialize(() => {
    console.log("🚀 Iniciando importação dos 22 funcionários...");

    employees.forEach(emp => {
        const id = 'EMP' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Cálculo básico para o Seed bater com a demonstração
        const inss = emp.inss_exempt ? 0 : (emp.base_salary + (emp.bonus || 0)) * 0.03;
        const inss_co = emp.inss_exempt ? 0 : (emp.base_salary + (emp.bonus || 0)) * 0.04;

        // Simulação IRPS rápida baseada na sua demonstração
        let irps = 0;
        const bruto = emp.base_salary + (emp.bonus || 0);
        if (bruto > 8500) irps = (bruto - 8500) * 0.10;

        const net = bruto - inss - irps - (emp.absences || 0);

        db.run(`INSERT OR REPLACE INTO instructors 
            (id, name, contract_type, specialties, base_salary, bonus, absences_discount, inss_discount, inss_company, irt_discount, net_salary, status, synced) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0)`,
            [id, emp.name, emp.role, emp.specialty, emp.base_salary, emp.bonus || 0, emp.absences || 0, inss, inss_co, irps, net]
        );
    });

    console.log("✅ 22 Funcionários inseridos com sucesso!");
});

db.close();
