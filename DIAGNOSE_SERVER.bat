@echo off
title DIAGNOSTICO HEFEL GYM
color 0E
cd /d %~dp0

echo ==========================================
echo      DIAGNOSTICO DO SERVIDOR BACKEND
echo ==========================================
echo.
echo A tentar iniciar o servidor manualmente para ver erros...
echo.

node server/server.cjs

echo.
echo ==========================================
echo O servidor parou. Veja o erro acima.
echo ==========================================
pause
