@echo off
:: Instalador Automático - Servidor de Impressão Térmica
:: Para sistemas Windows em produção

title Instalador - Fonte de Vida - Servidor de Impressão

echo.
echo ===============================================
echo 🚀 INSTALADOR - SERVIDOR DE IMPRESSÃO TÉRMICA
echo ===============================================
echo      Sistema: Fonte de Vida
echo      Versão: 2.0 - Produção Windows
echo ===============================================
echo.

:: Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Este instalador precisa ser executado como ADMINISTRADOR
    echo.
    echo 💡 Clique com o botão direito e selecione:
    echo    "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo ✅ Executando como administrador
echo.

:: Criar diretório de instalação
set INSTALL_DIR=C:\FonteVida\PrintServer
echo 📁 Criando diretório de instalação: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo ✅ Diretório criado
) else (
    echo ℹ️ Diretório já existe
)

:: Verificar Node.js
echo.
echo 🔍 Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo 💡 Instalando Node.js automaticamente...
    
    :: Baixar Node.js (versão LTS)
    echo ⬇️ Baixando Node.js...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi' -OutFile '%TEMP%\nodejs.msi'}"
    
    if exist "%TEMP%\nodejs.msi" (
        echo 📦 Instalando Node.js...
        msiexec /i "%TEMP%\nodejs.msi" /quiet /norestart
        echo ✅ Node.js instalado
        
        :: Aguardar e recarregar PATH
        timeout /t 5 /nobreak >nul
        call refreshenv
    ) else (
        echo ❌ Falha no download do Node.js
        echo 💡 Instale manualmente: https://nodejs.org/
        pause
        exit /b 1
    )
) else (
    echo ✅ Node.js encontrado
    node --version
)

:: Copiar arquivos do servidor
echo.
echo 📋 Copiando arquivos do servidor...
copy "%~dp0thermal-print-server.js" "%INSTALL_DIR%\" >nul
copy "%~dp0start-thermal-server.bat" "%INSTALL_DIR%\" >nul
copy "%~dp0start-thermal-server.ps1" "%INSTALL_DIR%\" >nul

if exist "%INSTALL_DIR%\thermal-print-server.js" (
    echo ✅ Arquivos copiados
) else (
    echo ❌ Erro ao copiar arquivos
    pause
    exit /b 1
)

:: Criar script de inicialização
echo.
echo ⚙️ Configurando inicialização automática...

set STARTUP_SCRIPT=%INSTALL_DIR%\start-server.bat
echo @echo off > "%STARTUP_SCRIPT%"
echo title Fonte de Vida - Servidor de Impressão >> "%STARTUP_SCRIPT%"
echo cd /d "%INSTALL_DIR%" >> "%STARTUP_SCRIPT%"
echo echo 🖨️ Iniciando servidor de impressão... >> "%STARTUP_SCRIPT%"
echo node thermal-print-server.js >> "%STARTUP_SCRIPT%"

:: Criar atalho na área de trabalho
echo.
echo 🔗 Criando atalho na área de trabalho...
set DESKTOP=%USERPROFILE%\Desktop
powershell -Command "& {$WScriptShell = New-Object -ComObject WScript.Shell; $Shortcut = $WScriptShell.CreateShortcut('%DESKTOP%\Fonte de Vida - Servidor de Impressão.lnk'); $Shortcut.TargetPath = '%STARTUP_SCRIPT%'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\thermal-print-server.js,0'; $Shortcut.Description = 'Servidor de Impressão Térmica - Fonte de Vida'; $Shortcut.Save()}"

:: Criar entrada no menu iniciar
echo.
echo 📌 Adicionando ao menu iniciar...
set STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs
if not exist "%STARTMENU%\Fonte de Vida" mkdir "%STARTMENU%\Fonte de Vida"
powershell -Command "& {$WScriptShell = New-Object -ComObject WScript.Shell; $Shortcut = $WScriptShell.CreateShortcut('%STARTMENU%\Fonte de Vida\Servidor de Impressão.lnk'); $Shortcut.TargetPath = '%STARTUP_SCRIPT%'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Servidor de Impressão Térmica'; $Shortcut.Save()}"

:: Configurar firewall (opcional)
echo.
echo 🔥 Configurando firewall...
netsh advfirewall firewall add rule name="Fonte de Vida - Print Server" dir=in action=allow protocol=TCP localport=3001 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Regra de firewall adicionada
) else (
    echo ⚠️ Não foi possível configurar firewall automaticamente
)

:: Verificar impressora "Generic / Text Only"
echo.
echo 🔍 Verificando impressora térmica...
wmic printer where "name='Generic / Text Only'" get name,status >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Impressora "Generic / Text Only" encontrada
) else (
    echo ⚠️ Impressora "Generic / Text Only" não encontrada
    echo.
    echo 💡 IMPORTANTE: Instale a impressora térmica:
    echo    1. Painel de Controle ^> Dispositivos e Impressoras
    echo    2. Adicionar impressora ^> Adicionar impressora local
    echo    3. Usar porta existente ^> Selecionar porta da impressora
    echo    4. Driver: Generic / Text Only
    echo    5. Nome: Generic / Text Only
    echo.
)

:: Teste do servidor
echo.
echo 🧪 Testando instalação...
cd /d "%INSTALL_DIR%"
timeout /t 2 /nobreak >nul
start /b node thermal-print-server.js
timeout /t 3 /nobreak >nul

:: Verificar se o servidor iniciou
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost:3001/status' -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '✅ Servidor funcionando' } else { Write-Host '❌ Servidor com problemas' } } catch { Write-Host '❌ Servidor não respondeu' }}"

:: Parar o servidor de teste
taskkill /f /im node.exe >nul 2>&1

echo.
echo ===============================================
echo ✅ INSTALAÇÃO CONCLUÍDA!
echo ===============================================
echo.
echo 📋 Arquivos instalados em: %INSTALL_DIR%
echo 🔗 Atalho criado na área de trabalho
echo 📌 Adicionado ao menu iniciar
echo 🔥 Firewall configurado (porta 3001)
echo.
echo 🚀 Para iniciar o servidor:
echo    • Clique no atalho da área de trabalho
echo    • Ou execute: %STARTUP_SCRIPT%
echo    • Ou vá em Menu Iniciar ^> Fonte de Vida
echo.
echo 🌐 Acesse: http://localhost:3001/status
echo.
echo ⚠️ LEMBRETE IMPORTANTE:
echo    • Certifique-se que a impressora "Generic / Text Only" está instalada
echo    • O servidor deve estar rodando quando usar o sistema web
echo    • Para usar automaticamente, adicione à inicialização do Windows
echo.

set /p auto_start="Deseja configurar inicialização automática? (s/n): "
if /i "%auto_start%"=="s" (
    echo.
    echo ⚙️ Configurando inicialização automática...
    
    :: Adicionar à inicialização do sistema
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "FonteVidaPrintServer" /t REG_SZ /d "\"%STARTUP_SCRIPT%\"" /f >nul 2>&1
    
    if %ERRORLEVEL% equ 0 (
        echo ✅ Servidor configurado para iniciar automaticamente
        echo    O servidor será iniciado sempre que o Windows ligar
    ) else (
        echo ❌ Não foi possível configurar inicialização automática
        echo 💡 Configure manualmente através do msconfig
    )
)

echo.
echo 🎉 Instalação finalizada com sucesso!
echo    Pressione qualquer tecla para sair...
pause >nul
