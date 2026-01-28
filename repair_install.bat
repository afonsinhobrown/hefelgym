@echo off
title REPARAR INSTALACAO GYMAR
echo ==========================================
echo       REPARACAO DE DEPENDENCIAS
echo ==========================================
echo.
echo 1. Fechando processos Node.js presos...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 2. Entrando na pasta do servidor...
cd whatsapp-service

echo.
echo 3. Limpando instalacao antiga (pode demorar)...
rmdir /s /q node_modules
del package-lock.json

echo.
echo 4. Instalando dependencias (aguarde)...
call npm install express @wppconnect-team/wppconnect cors digest-fetch node-fetch --force

echo.
echo ==========================================
echo PRONTO! Pode fechar esta janela e tentar 
echo abrir o start_gymar.bat novamente.
echo ==========================================
pause
