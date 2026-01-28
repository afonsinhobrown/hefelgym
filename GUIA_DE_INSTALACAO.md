# 🏋️ Guia de Instalação e Operação - HEFEL GYM

Este documento contém os procedimentos necessários para instalar, executar e atualizar o sistema Hefel Gym de forma segura, garantindo a integridade dos dados.

---

## 1. Passo Zero: Instalação do Node.js
O sistema necessita do motor **Node.js** para funcionar. Siga estes passos:
1.  Aceda ao site oficial: [https://nodejs.org/](https://nodejs.org/)
2.  Clique no botão que diz **"LTS"** (Long Term Support) – é a versão mais estável.
3.  Descarregue o instalador para Windows (.msi).
4.  Execute o ficheiro e clique em "Next" até ao fim. **Importante:** Marque a opção "Automatically install the necessary tools" se ela aparecer.
5.  Para confirmar se instalou bem, abra o terminal (CMD) e escreva: `node -v`. Deve aparecer uma versão (ex: v18.16.0).

---

## 2. Como Instalar o Ginásio (Primeira Vez)
1.  **Cópia da Pasta:** Copie a pasta completa `hefelgym` para o local definitivo (Ex: `C:\HefelGym`).
2.  **Limpeza de Testes (Inicialização):**
    *   Fomos criados dados de teste (faturas, vendas, entradas) durante o desenvolvimento.
    *   Na pasta `server/`, encontrará um ficheiro chamado **`inicializacao.db`**.
    *   Este ficheiro contém todos os seus **Utentes Reais**, **Produtos Reais** e **Planos**, mas **ZERO** faturas ou movimentos.
    *   Para começar do zero: Apague o ficheiro `gym_local.db` e renomeie o `inicializacao.db` para `gym_local.db`.

---

## 3. Como Iniciar o Sistema
Não é necessário utilizar linhas de comando complexas no dia-a-dia. 
1.  Vá para a raiz da pasta `hefelgym`.
2.  Clique duas vezes no ficheiro: **`START_HEFELGYM.bat`**
3.  **Janelas que abrem:**
    *   Uma janela preta para o **Servidors (Porta 3001)** - Regista faturas e comunica com a catraca.
    *   Outra janela para a **Interface (Porta 8080)** - Onde o utilizador mexe.
    *   O navegador abrirá automaticamente em `http://localhost:8080`.

---

## 4. Segurança de Dados e Atualizações
O sistema é **Local-First**, os dados estão no seu computador.

### Onde estão os meus dados?
*   Ficheiro: `hefelgym/server/gym_local.db` (Este é o coração do seu ginásio).

### Como atualizar sem perder dados?
Sempre que receber uma atualização do código:
1.  Substitua os ficheiros da pasta `src/` ou os ficheiros `.jsx`.
2.  **NUNCA** apague o ficheiro `gym_local.db` depois de ter começado a usar o ginásio a sério.
3.  Ao reiniciar o sistema, a base de dados adapta-se automaticamente à nova versão do código sem apagar nada.

---

## 5. Backups
1.  **Manual:** Copie periodicamente o ficheiro `gym_local.db` para uma PenDrive.
2.  **Cloud:** Se houver internet, os dados sincronizam com a nuvem (Supabase).

---
*Documento atualizado em 25 de Janeiro de 2026.*
