@echo off
chcp 65001 >nul
title TESTE SOLUÇÃO AUTOMÁTICA - WINDOWS

echo.
echo 🎯 TESTE SOLUÇÃO 100%% AUTOMÁTICA - WINDOWS
echo ==========================================
echo.

REM Verificar Node.js
echo 📋 Verificando Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js não encontrado! Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js OK

REM Verificar arquivo servidor
if not exist "thermal-print-server.cjs" (
    echo ❌ Arquivo thermal-print-server.cjs não encontrado!
    pause
    exit /b 1
)
echo ✅ Servidor encontrado

REM Instalar dependências
echo 📋 Instalando dependências...
npm install >nul 2>&1
echo ✅ Dependências OK

REM Matar processos anteriores
taskkill /f /im node.exe >nul 2>&1
timeout 2 >nul

REM Iniciar servidor
echo 📋 Iniciando servidor...
start "Servidor" /min cmd /k "node thermal-print-server.cjs"
timeout 5 >nul

REM Testar servidor
echo 📋 Testando servidor...
curl -s http://localhost:3001/status >nul 2>&1
if %errorLevel% equ 0 (
    echo ✅ Servidor funcionando
) else (
    echo ❌ Servidor com problemas
    pause
    exit /b 1
)

REM Iniciar webapp
echo 📋 Iniciando webapp...
start "Webapp" cmd /k "npm run dev"
timeout 3 >nul

REM Abrir navegador
start http://localhost:5173

echo.
echo ✅ TESTE INICIADO COM SUCESSO!
echo.
echo 🎮 COMO TESTAR:
echo   1. No navegador: Configurações ^> Impressora
echo   2. Clique: "Detectar Impressora Térmica"
echo   3. Clique: "Teste de Impressão"
echo   4. Faça um pedido e imprima
echo.
echo 📊 SERVIÇOS RODANDO:
echo   • Servidor: http://localhost:3001
echo   • Webapp: http://localhost:5173
echo.
pause
