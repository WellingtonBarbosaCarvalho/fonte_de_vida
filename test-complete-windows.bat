@echo off
:: Script de Teste Completo - Sistema Fonte de Vida
:: Testa todas as funcionalidades de impressão

title Teste Completo - Sistema Fonte de Vida

echo.
echo ===============================================
echo 🧪 TESTE COMPLETO - SISTEMA FONTE DE VIDA
echo ===============================================
echo.

set ERROR_COUNT=0
set TEST_COUNT=0

:: Função para incrementar testes
:increment_test
set /a TEST_COUNT+=1
goto :eof

:: Função para incrementar erros
:increment_error
set /a ERROR_COUNT+=1
goto :eof

:: Teste 1: Verificar Node.js
call :increment_test
echo [%TEST_COUNT%] 🔍 Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ✅ Node.js encontrado
    node --version
) else (
    echo    ❌ Node.js não encontrado
    call :increment_error
)
echo.

:: Teste 2: Verificar arquivos do servidor
call :increment_test
echo [%TEST_COUNT%] 📁 Verificando arquivos...
if exist "thermal-print-server.js" (
    echo    ✅ thermal-print-server.js encontrado
) else (
    echo    ❌ thermal-print-server.js não encontrado
    call :increment_error
)

if exist "start-thermal-server.bat" (
    echo    ✅ start-thermal-server.bat encontrado
) else (
    echo    ❌ start-thermal-server.bat não encontrado
    call :increment_error
)
echo.

:: Teste 3: Verificar impressora
call :increment_test
echo [%TEST_COUNT%] 🖨️ Verificando impressora "Generic / Text Only"...
wmic printer where "name='Generic / Text Only'" get name,status >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ✅ Impressora encontrada
    wmic printer where "name='Generic / Text Only'" get name,status
) else (
    echo    ❌ Impressora "Generic / Text Only" não encontrada
    echo    💡 Instale a impressora antes de continuar
    call :increment_error
)
echo.

:: Teste 4: Verificar porta 3001
call :increment_test
echo [%TEST_COUNT%] 🔌 Verificando porta 3001...
netstat -ano | findstr :3001 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ⚠️ Porta 3001 já está em uso
    echo    💡 Parando processos existentes...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
) else (
    echo    ✅ Porta 3001 disponível
)
echo.

:: Teste 5: Iniciar servidor de impressão
call :increment_test
echo [%TEST_COUNT%] 🚀 Iniciando servidor de impressão...
start /b node thermal-print-server.js
timeout /t 3 /nobreak >nul

:: Verificar se o servidor está respondendo
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/status' -TimeoutSec 5; Write-Host '    ✅ Servidor respondendo'; Write-Host $response.Content } catch { Write-Host '    ❌ Servidor não responde'; exit 1 }}"
if %ERRORLEVEL% neq 0 (
    call :increment_error
)
echo.

:: Teste 6: Teste de impressão via API
call :increment_test
echo [%TEST_COUNT%] 📄 Teste de impressão via API...
powershell -Command "& {try { $body = @{text='TESTE VIA API\n=============\nData: ' + (Get-Date).ToString('dd/MM/yyyy HH:mm') + '\n\nEste e um teste via API\ndo sistema Fonte de Vida.\n\n=============\n'} | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3001/print' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 10; Write-Host '    ✅ Impressão enviada via API'; Write-Host $response.Content } catch { Write-Host '    ❌ Erro na impressão via API'; Write-Host $_.Exception.Message; exit 1 }}"
if %ERRORLEVEL% neq 0 (
    call :increment_error
)
echo.

:: Teste 7: Teste direto da impressora
call :increment_test
echo [%TEST_COUNT%] 🖨️ Teste direto da impressora...
echo TESTE DIRETO > teste_direto.txt
echo ============= >> teste_direto.txt
echo Data: %date% %time% >> teste_direto.txt
echo. >> teste_direto.txt
echo Este e um teste direto >> teste_direto.txt
echo da impressora termica. >> teste_direto.txt
echo. >> teste_direto.txt
echo ============= >> teste_direto.txt

copy teste_direto.txt "Generic / Text Only" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo    ✅ Comando copy executado com sucesso
) else (
    echo    ❌ Erro no comando copy
    call :increment_error
)

:: Limpar arquivo de teste
del teste_direto.txt >nul 2>&1
echo.

:: Teste 8: Verificar estrutura do projeto web
call :increment_test
echo [%TEST_COUNT%] 🌐 Verificando estrutura do projeto web...
if exist "package.json" (
    echo    ✅ package.json encontrado
) else (
    echo    ❌ package.json não encontrado
    call :increment_error
)

if exist "src\" (
    echo    ✅ Pasta src encontrada
) else (
    echo    ❌ Pasta src não encontrada
    call :increment_error
)

if exist "src\services\WebPrinterService.js" (
    echo    ✅ WebPrinterService.js encontrado
) else (
    echo    ❌ WebPrinterService.js não encontrado
    call :increment_error
)
echo.

:: Teste 9: Verificar dependências do projeto
call :increment_test
echo [%TEST_COUNT%] 📦 Verificando dependências...
if exist "node_modules\" (
    echo    ✅ node_modules encontrado
) else (
    echo    ⚠️ node_modules não encontrado
    echo    💡 Execute: npm install
)
echo.

:: Parar servidor de teste
echo 🛑 Parando servidor de teste...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Resumo dos testes
echo.
echo ===============================================
echo 📊 RESUMO DOS TESTES
echo ===============================================
echo    Total de testes: %TEST_COUNT%
echo    Testes com erro: %ERROR_COUNT%
set /a SUCCESS_COUNT=%TEST_COUNT%-%ERROR_COUNT%
echo    Testes bem-sucedidos: %SUCCESS_COUNT%
echo.

if %ERROR_COUNT% equ 0 (
    echo ✅ TODOS OS TESTES PASSARAM!
    echo    O sistema está pronto para uso em produção.
    echo.
    echo 🚀 Para usar o sistema:
    echo    1. Execute: start-thermal-server.bat
    echo    2. Abra o navegador em: http://localhost:5173
    echo    3. Crie um pedido e teste a impressão
) else (
    echo ❌ ALGUNS TESTES FALHARAM!
    echo    Corrija os problemas antes de usar em produção.
    echo.
    echo 💡 Problemas mais comuns:
    echo    • Node.js não instalado
    echo    • Impressora "Generic / Text Only" não configurada
    echo    • Arquivos do projeto ausentes
)

echo.
echo ===============================================
echo 🔧 PRÓXIMOS PASSOS
echo ===============================================
echo.

if %ERROR_COUNT% equ 0 (
    echo ✅ Sistema testado com sucesso!
    echo.
    echo 📋 Para produção:
    echo    1. Execute o instalador: install-windows.bat
    echo    2. Configure inicialização automática
    echo    3. Teste com usuários finais
    echo.
    echo 🌐 URLs importantes:
    echo    • Servidor de impressão: http://localhost:3001/status
    echo    • Sistema web: http://localhost:5173
    echo    • Teste de impressão: http://localhost:3001/test
) else (
    echo ❌ Corrija os problemas encontrados:
    echo.
    if not exist "thermal-print-server.js" (
        echo    • Copie thermal-print-server.js para esta pasta
    )
    wmic printer where "name='Generic / Text Only'" get name,status >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo    • Instale impressora "Generic / Text Only"
    )
    where node >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo    • Instale Node.js: https://nodejs.org/
    )
)

echo.
pause
