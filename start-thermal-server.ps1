# PowerShell Script para Servidor de Impressão Térmica - Windows
# Uso: .\start-thermal-server.ps1

# Definir encoding para UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "🖨️ Servidor de Impressão Térmica - Windows" -ForegroundColor Green  
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Função para verificar se comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Verificar se Node.js está instalado
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "💡 Instale o Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Mostrar versão do Node.js
Write-Host "⚙️ Verificando Node.js..." -ForegroundColor Blue
$nodeVersion = node --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# Verificar se o arquivo do servidor existe
if (-not (Test-Path "thermal-print-server.js")) {
    Write-Host "❌ Arquivo thermal-print-server.js não encontrado!" -ForegroundColor Red
    Write-Host "💡 Execute este script na pasta do projeto" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar se a porta 3001 está em uso
Write-Host ""
Write-Host "🔍 Verificando porta 3001..." -ForegroundColor Blue
$portCheck = netstat -ano | Select-String ":3001"
if ($portCheck) {
    Write-Host "⚠️ Porta 3001 já está em uso!" -ForegroundColor Yellow
    Write-Host "💡 Processos encontrados:" -ForegroundColor Yellow
    netstat -ano | Select-String ":3001"
    Write-Host ""
    $kill = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($kill -ne "s") { exit 1 }
}

# Verificar impressora "Generic / Text Only"
Write-Host ""
Write-Host "🔍 Verificando impressora 'Generic / Text Only'..." -ForegroundColor Blue
try {
    $printer = Get-WmiObject -Class Win32_Printer | Where-Object { $_.Name -eq "Generic / Text Only" }
    if ($printer) {
        Write-Host "✅ Impressora 'Generic / Text Only' encontrada!" -ForegroundColor Green
        Write-Host "📊 Status: $($printer.PrinterStatus)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Impressora 'Generic / Text Only' não encontrada" -ForegroundColor Yellow
        Write-Host "💡 Verifique:" -ForegroundColor Yellow
        Write-Host "   • Painel de Controle > Dispositivos e Impressoras" -ForegroundColor Yellow
        Write-Host "   • A impressora deve estar instalada e online" -ForegroundColor Yellow
        Write-Host "   • Nome exato: 'Generic / Text Only'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 O servidor ainda será iniciado..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Não foi possível verificar impressoras" -ForegroundColor Yellow
}

# Mostrar informações do sistema
Write-Host ""
Write-Host "💻 Informações do sistema:" -ForegroundColor Cyan
Write-Host "   OS: $([System.Environment]::OSVersion.VersionString)" -ForegroundColor White
Write-Host "   Processador: $([System.Environment]::ProcessorCount) cores" -ForegroundColor White
Write-Host "   Usuário: $([System.Environment]::UserName)" -ForegroundColor White

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Write-Host "📋 Para parar o servidor: Ctrl+C" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Configurar tratamento de Ctrl+C
$Global:ServerProcess = $null

# Função para limpar ao sair
function Stop-Server {
    if ($Global:ServerProcess -and -not $Global:ServerProcess.HasExited) {
        Write-Host ""
        Write-Host "🛑 Parando servidor..." -ForegroundColor Yellow
        $Global:ServerProcess.Kill()
        Start-Sleep -Seconds 1
    }
    Write-Host "👋 Servidor encerrado!" -ForegroundColor Green
}

# Registrar evento de saída
Register-EngineEvent PowerShell.Exiting -Action { Stop-Server }

try {
    # Iniciar o servidor como processo filho
    $Global:ServerProcess = Start-Process -FilePath "node" -ArgumentList "thermal-print-server.js" -NoNewWindow -PassThru
    
    # Aguardar o processo terminar
    $Global:ServerProcess.WaitForExit()
} catch {
    Write-Host "❌ Erro ao iniciar servidor: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Stop-Server
    Read-Host "Pressione Enter para sair"
}
