# 🏋️ Guia de Instalação e Operação - HEFEL GYM

Este documento contém os procedimentos necessários para instalar, executar e operar o sistema no computador oficial do ginásio.

---

## 1. Requisitos do Sistema
O sistema necessita do motor **Node.js** instalado:
1.  Descarregue a versão **LTS** em: [https://nodejs.org/](https://nodejs.org/)
2.  Instale com as opções padrão.
3.  Confirme abrindo um terminal e digitando: `node -v` (deve aparecer v18, v20 ou superior).

---

## 2. Instalação no Computador do Ginásio
1.  **Copiar pasta:** Transfira a pasta completa `hefelgym` para o computador (ex: no Disco C: ou Ambiente de Trabalho).
2.  **Instalar Dependências (Apenas na 1ª vez):**
    *   Abra a pasta `hefelgym`.
    *   Clique com o botão direito num espaço vazio e escolha "Abrir no Terminal" (ou CMD).
    *   Digite: `npm install` e aguarde alguns minutos até terminar.

---

## 3. Preparação para o "Go-Live" (Limpeza de Testes)
Antes de começar a usar com clientes reais, deve limpar os dados de teste que criámos durante a programação.
1.  No terminal, digite:
    ```powershell
    node server/PREPARE_FOR_PRODUCTION.cjs
    ```
2.  **O que isto faz:** Apaga todas as faturas e despesas de teste, mas **MANTÉM** os Utentes, Produtos, Planos e todo o histórico das Catracas.
3.  O script cria automaticamente um backup antes de limpar.

---

## 4. Iniciar o Sistema no Dia-a-Dia
Basta usar o atalho automático:
1.  Dê duplo clique no ficheiro: **`START_HEFELGYM.bat`**
2.  O sistema abrirá duas janelas minimizadas (Servidor e Interface).
3.  O navegador abrirá em: `http://localhost:8080`

---

## 5. Configurações Iniciais Importantes
Ao abrir o sistema pela primeira vez no ginásio:
1.  **WhatsApp:** Vá a **Configurações** e aponte o telemóvel para o QR Code para ativar o envio automático de recibos.
2.  **Dados da Empresa:** Insira o NUIT, Endereço e Logotipo do Hefel Gym para que as faturas saiam corretas.
3.  **Equipa:** Crie o utilizador para o seu Rececionista (Role: **Operador**). Lembre-se que o Operador só tem acesso ao Ponto de Venda e Mensalidades.

---

## 6. Segurança e Backups
Os seus dados são locais e muito importantes:
*   **Base de Dados:** O ficheiro principal é o `hefelgym_local.db` (na raiz da pasta).
*   **Backup:** Recomendamos copiar este ficheiro para uma PenDrive ou Google Drive uma vez por semana.
*   **Privacidade:** Cada funcionário deve mudar a sua senha no menu de Configurações após o primeiro acesso.

---
*Documento atualizado em 30 de Janeiro de 2026 para a Versão de Lançamento.*
