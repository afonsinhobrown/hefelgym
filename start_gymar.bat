@echo off
title INICIALIZAR GYMAR...
echo ==========================================
echo       INICIANDO SISTEMA GYMAR (SAAS)
echo ==========================================
echo.
echo 1. Iniciando Servidor Backend (WhatsApp + Catraca)...
start "GYMAR SERVER" cmd /k "cd whatsapp-service && npm start"

echo.
echo 2. Iniciando Frontend (React App)...
start "GYMAR APP" cmd /k "npm run dev"

echo.
echo ==========================================
echo SUCESSO! O sistema esta a iniciar.
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:3001
echo.
echo Mantenha as janelas pretas abertas.
echo ==========================================
pause
