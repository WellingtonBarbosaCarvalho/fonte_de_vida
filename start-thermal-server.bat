@echo off
:: Script para iniciar o servidor de impressão térmica no Windows
:: Uso: start-thermal-server.bat

title Servidor de Impressão Térmica - Fonte de Vida

echo.
echo ===============================================
echo 🖨️ Servidor de Impressão Térmica - Windows
echo ===============================================
echo.

:: Verificar se Node.js está instalado
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js não encontrado!
    echo 💡 Instale o Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Mostrar versão do Node.js
echo ⚙️ Verificando Node.js...
node --version

:: Verificar se o arquivo do servidor existe
if not exist "thermal-print-server.js" (
    echo ❌ Arquivo thermal-print-server.js não encontrado!
    echo 💡 Execute este script na pasta do projeto
    echo.
    pause
    exit /b 1
)

:: Verificar se a porta 3001 está em uso
echo.
echo 🔍 Verificando porta 3001...
netstat -ano | findstr :3001 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ⚠️ Porta 3001 já está em uso!
    echo 💡 Para ver processos: netstat -ano ^| findstr :3001
    echo 💡 Para matar processo: taskkill /PID ^<PID^> /F
    echo.
    set /p kill_existing="Deseja continuar mesmo assim? (s/n): "
    if /i not "%kill_existing%"=="s" exit /b 1
)

:: Verificar impressora "Generic / Text Only"
echo.
echo 🔍 Verificando impressora "Generic / Text Only"...
wmic printer where "name='Generic / Text Only'" get name,status >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Impressora "Generic / Text Only" encontrada!
) else (
    echo ⚠️ Impressora "Generic / Text Only" não encontrada
    echo 💡 Verifique:
    echo    • Painel de Controle ^> Dispositivos e Impressoras
    echo    • A impressora deve estar instalada e online
    echo    • Nome exato: "Generic / Text Only"
    echo.
    echo 💡 O servidor ainda será iniciado...
)

echo.
echo ===============================================
echo 🚀 Iniciando servidor...
echo 📋 Para parar o servidor: Ctrl+C
echo ===============================================
echo.

:: Iniciar o servidor
node thermal-print-server.js

:: Se chegou aqui, o servidor foi encerrado
echo.
echo 👋 Servidor encerrado!
pause
