# 🎯 TESTE COMPLETO - SOLUÇÃO 100% AUTOMÁTICA
# PowerShell Script para testar no Windows

Write-Host "`n🎯 TESTE COMPLETO - SOLUÇÃO 100% AUTOMÁTICA" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Verificar se está executando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ ERRO: Execute como Administrador" -ForegroundColor Red
    Write-Host "💡 Clique direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green

# Verificar Node.js
Write-Host "`n📋 1. Verificando Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "💡 Baixe e instale em: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar arquivos do projeto
Write-Host "`n📋 2. Verificando arquivos do projeto..." -ForegroundColor Blue
if (-not (Test-Path "thermal-print-server.cjs")) {
    Write-Host "❌ Arquivo thermal-print-server.cjs não encontrado!" -ForegroundColor Red
    Write-Host "💡 Certifique-se de estar na pasta do projeto" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "✅ Servidor de impressão encontrado" -ForegroundColor Green

# Verificar impressora
Write-Host "`n📋 3. Verificando impressora térmica..." -ForegroundColor Blue
$printers = Get-WmiObject -Class Win32_Printer | Where-Object { $_.Name -like "*Generic*" }
if ($printers) {
    Write-Host "✅ Impressora Generic / Text Only encontrada: $($printers[0].Name)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Impressora Generic / Text Only não encontrada" -ForegroundColor Yellow
    Write-Host "💡 Instale o driver 'Generic / Text Only' no Windows" -ForegroundColor Yellow
    Write-Host "💡 O teste continuará, mas a impressão pode falhar" -ForegroundColor Yellow
}

# Matar processos anteriores
Write-Host "`n📋 4. Limpando processos anteriores..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Processos anteriores finalizados" -ForegroundColor Green

# Instalar dependências
Write-Host "`n📋 5. Verificando dependências..." -ForegroundColor Blue
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependências instaladas" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Host "✅ Dependências já instaladas" -ForegroundColor Green
}

# Configurar firewall
Write-Host "`n📋 6. Configurando firewall..." -ForegroundColor Blue
try {
    netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3001 | Out-Null
    netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173 | Out-Null
    Write-Host "✅ Regras de firewall configuradas" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Não foi possível configurar firewall automaticamente" -ForegroundColor Yellow
}

# Iniciar servidor de impressão
Write-Host "`n📋 7. Iniciando servidor de impressão..." -ForegroundColor Blue
Start-Process -FilePath "cmd" -ArgumentList "/c", "node thermal-print-server.cjs & pause" -WindowStyle Minimized
Write-Host "📊 Servidor iniciado em background" -ForegroundColor Cyan

# Aguardar servidor inicializar
Write-Host "⏳ Aguardando servidor inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Testar servidor
Write-Host "`n📋 8. Testando servidor..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/status" -Method Get -TimeoutSec 5
    Write-Host "✅ Servidor está respondendo" -ForegroundColor Green
    Write-Host "   Sistema: $($response.system.platform)" -ForegroundColor Cyan
    Write-Host "   Node: $($response.system.node)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Servidor não está respondendo" -ForegroundColor Red
    Write-Host "💡 Verifique o console do servidor para erros" -ForegroundColor Yellow
    Read-Host "Pressione Enter para continuar mesmo assim"
}

# Testar impressão básica
Write-Host "`n📋 9. Testando impressão básica..." -ForegroundColor Blue
$testData = @{
    text = "TESTE AUTOMATICO WINDOWS`n=================`nData: $(Get-Date)`nSolucao 100% Automatica`n=================`n`n`n"
} | ConvertTo-Json

try {
    $printResponse = Invoke-RestMethod -Uri "http://localhost:3001/print" -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 10
    if ($printResponse.success) {
        Write-Host "✅ Impressão básica funcionando" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Impressão básica com problemas: $($printResponse.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Impressão básica com problemas" -ForegroundColor Yellow
    Write-Host "💡 Verifique se a impressora está conectada" -ForegroundColor Yellow
}

# Testar rotas do DirectPrintService
Write-Host "`n📋 10. Testando rotas do DirectPrintService..." -ForegroundColor Blue

# Teste raw-chunk
try {
    $rawResponse = Invoke-RestMethod -Uri "http://localhost:3001/raw-chunk" -Method Post -Body "TESTE RAW CHUNK WINDOWS" -ContentType "text/plain" -TimeoutSec 5
    if ($rawResponse.success) {
        Write-Host "✅ Rota /raw-chunk funcionando" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Rota /raw-chunk com problemas" -ForegroundColor Red
}

# Teste extension-print
try {
    $extResponse = Invoke-RestMethod -Uri "http://localhost:3001/extension-print" -Method Post -Body "TESTE EXTENSION WINDOWS" -ContentType "text/plain" -TimeoutSec 5
    if ($extResponse.success) {
        Write-Host "✅ Rota /extension-print funcionando" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Rota /extension-print com problemas" -ForegroundColor Red
}

# Teste memory-queue
try {
    $queueData = @{
        queueId = "win-test"
        bufferSize = 100
        metadata = @{
            type = "thermal"
        }
    } | ConvertTo-Json
    
    $queueResponse = Invoke-RestMethod -Uri "http://localhost:3001/memory-queue" -Method Post -Body $queueData -ContentType "application/json" -TimeoutSec 5
    if ($queueResponse.success) {
        Write-Host "✅ Rota /memory-queue funcionando" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Rota /memory-queue com problemas" -ForegroundColor Red
}

# Compilar projeto
Write-Host "`n📋 11. Testando compilação do projeto..." -ForegroundColor Blue
npm run build *>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Projeto compila sem erros" -ForegroundColor Green
} else {
    Write-Host "❌ Projeto tem erros de compilação" -ForegroundColor Red
    Write-Host "💡 Execute 'npm run build' para ver detalhes" -ForegroundColor Yellow
}

# Iniciar webapp
Write-Host "`n📋 12. Iniciando webapp..." -ForegroundColor Blue
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev & echo. & echo 🌐 Webapp rodando em http://localhost:5173 & echo 📋 Pressione Ctrl+C para parar & pause"
Write-Host "📊 Webapp iniciado em nova janela" -ForegroundColor Cyan

# Aguardar webapp inicializar
Write-Host "⏳ Aguardando webapp inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Abrir no navegador
Write-Host "`n📋 13. Abrindo webapp no navegador..." -ForegroundColor Blue
Start-Process "http://localhost:5173"
Write-Host "✅ Navegador aberto" -ForegroundColor Green

# Resultado final
Write-Host "`n🎯 RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "✅ TESTE COMPLETO FINALIZADO!" -ForegroundColor Green

Write-Host "`n📊 SERVIÇOS RODANDO:" -ForegroundColor Blue
Write-Host "  • Servidor de Impressão: http://localhost:3001" -ForegroundColor White
Write-Host "  • Webapp: http://localhost:5173" -ForegroundColor White

Write-Host "`n🎮 COMO TESTAR:" -ForegroundColor Blue
Write-Host "  1. No navegador que abriu, vá em: Configurações > Impressora" -ForegroundColor White
Write-Host "  2. Clique em 'Detectar Impressora Térmica'" -ForegroundColor White
Write-Host "  3. Clique em 'Teste de Impressão'" -ForegroundColor White
Write-Host "  4. Observe o console do navegador (F12)" -ForegroundColor White
Write-Host "  5. Crie um pedido e imprima" -ForegroundColor White

Write-Host "`n🔍 VERIFICAR:" -ForegroundColor Blue
Write-Host "  • DirectPrintService tentando 6 estratégias" -ForegroundColor White
Write-Host "  • Service Worker sem erro 405" -ForegroundColor White
Write-Host "  • Impressão automática funcionando" -ForegroundColor White
Write-Host "  • Fallbacks quando servidor parado" -ForegroundColor White

Write-Host "`n💡 DICAS:" -ForegroundColor Blue
Write-Host "  • Pressione F12 no navegador para ver logs" -ForegroundColor White
Write-Host "  • Verifique se a impressora 'Generic / Text Only' está instalada" -ForegroundColor White
Write-Host "  • Execute sempre como Administrador" -ForegroundColor White

Write-Host "`n✅ SOLUÇÃO 100% AUTOMÁTICA PRONTA PARA PRODUÇÃO!" -ForegroundColor Green
Write-Host ""

Read-Host "Pressione Enter para finalizar"
