-- ATENÇÃO: EXECUTE ESTE SCRIPT NO 'SQL EDITOR' DO SUPABASE
-- ESTE SCRIPT APAGA TODOS OS DADOS DE MOVIMENTO (VENDAS, DESPESAS, HISTÓRICOS)
-- MANTENDO APENAS OS CADASTROS PRINCIPAIS (CLIENTES, PRODUTOS, STAFF).

BEGIN;

-- 1. Limpar Vendas (Faturas do POS)
DELETE FROM invoices;

-- 2. Limpar Detalhes de Compras de Produtos (Stock Expenses)
DELETE FROM product_expenses;

-- 3. Limpar Despesas Gerais do Ginásio
DELETE FROM gym_expenses;

-- 4. Limpar Histórico de Presenças (Entradas/Saídas)
DELETE FROM attendance;

-- 5. Limpar Histórico de Folhas de Pagamento (Payroll)
DELETE FROM payroll_history;

-- 6. Limpar Histórico de Alterações Salariais
DELETE FROM salary_history;

-- Opcional: Se quiser zerar o Stock de todos os produtos, descomente a linha abaixo:
-- UPDATE products SET stock = 0;

COMMIT;

-- FIM DA LIMPEZA
