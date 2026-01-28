@echo off
title HEFEL GYM - SISTEMA DE GESTAO
color 0A

:: Garantir que estamos na pasta do projeto (permite atalhos no Desktop)
cd /d %~dp0

echo ===================================================
echo   INICIANDO SISTEMA HEFEL GYM (LOCAL + CLOUD)
echo ===================================================
echo.

:: 1. Iniciar Servidor Backend (SQLite/WhatsApp) -> Porta 3001
echo [1/3] A iniciar Servidor Local...
start "HefelGym Server" /min cmd /k "node server/server.cjs"

:: Aguardar 3 segundos para a BD carregar
timeout /t 3 /nobreak >nul

:: 2. Iniciar Frontend (Interface) -> Porta 8080
echo [2/3] A iniciar Interface Web...
:: Verifica se as dependencias estao instaladas, senao avisa
if not exist node_modules (
    echo [AVISO] Node Modules nao encontrados. A instalar...
    call npm install
)
start "HefelGym Interface" /min cmd /k "npm run dev"

:: Aguardar 5 segundos para o Vite arrancar
timeout /t 5 /nobreak >nul

:: 3. Abrir Navegador
echo [3/3] A abrir o sistema...
start http://localhost:8080

echo.
echo ===================================================
echo   SISTEMA OPERACIONAL!
echo ===================================================
echo   - Painel: http://localhost:8080 
echo   - Servidor: Porta 3001 (Minimizado)
echo.
echo   ATENCAO: Para configurar um novo Ginasio:
echo   Va a Configuracoes e insira o ID do Ginasio.
echo ===================================================
pause
