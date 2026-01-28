@echo off
echo ===================================================
echo   HEFEL GYM - MODO DEMONSTRACAO REMOTA (BR)
echo ===================================================
echo.
echo 1. Iniciando o Servidor Local...
start "Hefel Server" node server/server.cjs
timeout /t 5

echo.
echo 2. Criando Túnel Seguro para a Internet...
echo O link gerado abaixo deve ser enviado ao Sr. Bambo!
echo.
npx localtunnel --port 3001
