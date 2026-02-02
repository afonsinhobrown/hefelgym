ALTER TABLE instructors ADD COLUMN base_salary REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN bonus REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN absences_discount REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN inss_discount REAL DEFAULT 0;
ALTER TABLE instructors ADD COLUMN irt_discount REAL DEFAULT 0;
-- ALTER TABLE instructors ADD COLUMN other_deductions REAL DEFAULT 0; -- Ja existe
-- ALTER TABLE instructors ADD COLUMN net_salary REAL DEFAULT 0; -- Ja existe
ALTER TABLE instructors ADD COLUMN bank_account TEXT;
ALTER TABLE instructors ADD COLUMN nuit TEXT;
ALTER TABLE instructors ADD COLUMN type TEXT DEFAULT 'internal';
