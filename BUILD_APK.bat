@echo off
echo PREPARANDO AMBIENTE PARA APK...
cd /d %~dp0
call npm run build
call npx cap sync android
echo.
echo ==========================================================
echo A TENTAR GERAR O APK (DEBUG)...
echo ==========================================================
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] A compilacao falhou. 
    echo Verifique se tem o Android SDK instalado e o JDK 17 configurado.
    echo Dica: Abra a pasta 'android' no Android Studio para resolver erros de SDK.
) else (
    echo.
    echo [SUCESSO] APK gerado em:
    echo android\app\build\outputs\apk\debug\app-debug.apk
)
pause
