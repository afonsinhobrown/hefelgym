-- ==============================================================================
-- UPDATE PREÇOS E PLANOS - HEFEL GYM JANEIRO 2026
-- Baseado nas imagens fornecidas (Pacotes Gerais e Personal Trainer)
-- ==============================================================================

-- 1. LIMPAR PLANOS ANTIGOS (Opcional, mas recomendado para evitar confusão)
-- DELETE FROM plans; -- Descomente se quiser limpar tudo antes
-- Para segurança, vamos apenas inserir novos ou atualizar se ID bater.

-- 2. PLANOS DE MENSALIDADE (SUBSCRIPTIONS)
INSERT OR REPLACE INTO plans (id, gym_id, name, price, duration) VALUES
('PL_GERAL_FULL', 'hefel_gym_v1', 'Mensalidade Geral (MUS + AUL)', 2000, 1),
('PL_FDS', 'hefel_gym_v1', 'Pacote Finais de Semana (Mensal)', 850, 1),
('PL_PT_2X', 'hefel_gym_v1', 'Personal Trainer (2x Semana)', 2500, 1),
('PL_PT_3X', 'hefel_gym_v1', 'Personal Trainer (3x Semana)', 3250, 1),
('PL_PT_4X', 'hefel_gym_v1', 'Personal Trainer (4x Semana)', 4500, 1),
('PL_SEMANAL', 'hefel_gym_v1', 'Pacote Semanal', 850, 0);

-- 3. PRODUTOS E SERVIÇOS AVULSOS (POS)
-- Inserir como produtos para venda rápida
INSERT OR REPLACE INTO products (id, gym_id, name, price, stock, category) VALUES
('SERV_INSCRICAO', 'hefel_gym_v1', 'Taxa de Inscrição (Inclui Cartão)', 700, 9999, 'Serviço'),
('SERV_CARTAO', 'hefel_gym_v1', 'Cartão de Acesso (2ª Via)', 500, 9999, 'Serviço'),
('SERV_PLANO_TREINO', 'hefel_gym_v1', 'Plano de Treino Avulso', 700, 9999, 'Serviço'),
('SERV_DIARIA_GYM', 'hefel_gym_v1', 'Diária Ginásio', 300, 9999, 'Serviço'),
('SERV_DIARIA_PT', 'hefel_gym_v1', 'Diária Personal Trainer', 400, 9999, 'Serviço');

-- 4. CONFIRMAÇÃO
SELECT 'Planos e Produtos Atualizados com Sucesso!' as status;
