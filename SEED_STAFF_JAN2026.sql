-- ==============================================================================
-- SEED STAFF - HEFEL GYM - JANEIRO 2026
-- Baseado na Folha de Salários oficial fornecida.
-- ==============================================================================

-- 1. LIMPEZA (Remove dados de teste anteriores)
DELETE FROM instructors;

-- 2. INSERÇÃO DE FUNCIONÁRIOS
-- Formato: id, gym_id, name, type, base_salary, status
-- Notas: Bónus e Descontos Variáveis (Faltas) devem ser lançados mensalmente na interface.

INSERT INTO instructors (id, gym_id, name, type, base_salary, status, email, phone) VALUES
-- DIREÇÃO E ADMINISTRAÇÃO
('ST01', 'hefel_gym_v1', 'Henriques José Dumbo', 'manager', 30000.00, 'active', 'henriques@hefel.com', '84-870135981'),
('ST02', 'hefel_gym_v1', 'Hélia Custódia Victorino', 'manager', 15000.00, 'active', NULL, '84-870135982'),
('ST03', 'hefel_gym_v1', 'Nádia Victorino Inroga Machel', 'manager', 15000.00, 'active', NULL, '844550623'),
('ST04', 'hefel_gym_v1', 'Enia Cecília Henriques Bomba', 'manager', 13500.00, 'active', NULL, NULL),
('ST05', 'hefel_gym_v1', 'Januário Ussene', 'internal', 13500.00, 'active', NULL, '879373483'),
('ST06', 'hefel_gym_v1', 'Hermínio António Gujamo', 'manager', 12400.00, 'active', NULL, '875532905'),
('ST07', 'hefel_gym_v1', 'Gil Inácio Cossa', 'manager', 12000.00, 'active', NULL, NULL),

-- EQUIPA TÉCNICA (INSTRUTORES/MONITORES)
('ST08', 'hefel_gym_v1', 'Júlia Canhe', 'internal', 12000.00, 'active', NULL, '842733884'),
('ST09', 'hefel_gym_v1', 'Armando Maciel Júnior', 'internal', 12000.00, 'active', NULL, '871612080'),
('ST10', 'hefel_gym_v1', 'David Elias Bozene', 'internal', 12000.00, 'active', NULL, '873933584'), -- Tem +10.310 Bónus e 134 Faltas este mês
('ST11', 'hefel_gym_v1', 'Sebastião Daniel Mathaite', 'internal', 12000.00, 'active', NULL, '840164306'), -- Tem 2.400 Faltas este mês
('ST12', 'hefel_gym_v1', 'Alberto Agostinho Massolone', 'internal', 12000.00, 'active', NULL, '844568357'), -- Tem 2.000 Faltas este mês

-- CONTABILIDADE E ADMINISTRAÇÃO
('ST13', 'hefel_gym_v1', 'Vasco Sevele', 'manager', 12000.00, 'active', NULL, '841787658'),
('ST14', 'hefel_gym_v1', 'Doroteia Maeze Maguande', 'manager', 12000.00, 'active', NULL, '845980042'),
('ST15', 'hefel_gym_v1', 'Custódio Paulo Langa', 'manager', 12000.00, 'active', NULL, '8507099228'),

-- MANUTENÇÃO E APOIO
('ST16', 'hefel_gym_v1', 'Belino Madalena Suma', 'maintenance', 12000.00, 'active', NULL, '877327648'),
('ST17', 'hefel_gym_v1', 'Vicente Salomão Nhatumbo', 'maintenance', 12000.00, 'active', NULL, '844828637'), -- Motorista

-- SEGURANÇA E LIMPEZA
('ST18', 'hefel_gym_v1', 'Casimiro António Reinardo', 'security', 10310.00, 'active', NULL, '877033045'),
('ST19', 'hefel_gym_v1', 'Calisto Pedro Mapanzene', 'security', 10310.00, 'active', NULL, '871071799'),
('ST20', 'hefel_gym_v1', 'Luís Laurindo Nhatumbo', 'security', 10310.00, 'active', NULL, '840461907'),
('ST21', 'hefel_gym_v1', 'Alfredo Mário Luís', 'security', 10310.00, 'active', NULL, '847522202'),
('ST22', 'hefel_gym_v1', 'Helena Américo Manjate', 'cleaner', 10310.00, 'active', NULL, '849030270');

SELECT 'Staff Importado com Sucesso: 22 Colaboradores.' as status;
