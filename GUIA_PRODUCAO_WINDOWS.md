# 🖨️ Guia de Produção - Windows

## 📋 Configuração Completa para Ambiente Windows

Este guia detalha como configurar o sistema **Fonte de Vida** em um ambiente Windows de produção, com foco na solução de impressão térmica.

## 🏗️ Arquitetura da Solução

```
┌─────────────────┐    HTTP    ┌──────────────────┐    RAW     ┌─────────────────┐
│   Web Browser   │ ──────────▶│  Print Server    │ ─────────▶│ Impressora      │
│                 │            │  (localhost:3001)│           │ Generic/Text    │
│ React PWA       │            │  Node.js         │           │ Térmica         │
└─────────────────┘            └──────────────────┘           └─────────────────┘
```

## 🚀 Instalação Rápida (Recomendada)

### Opção 1: Instalador Automático

1. **Baixar o projeto** (via git clone ou zip)
2. **Executar como Administrador:** `install-windows.bat`
3. **Seguir as instruções** na tela

O instalador irá:

- ✅ Verificar/instalar Node.js
- ✅ Copiar arquivos para `C:\FonteVida\PrintServer`
- ✅ Criar atalhos (Desktop + Menu Iniciar)
- ✅ Configurar firewall
- ✅ Testar a instalação
- ✅ Opção de inicialização automática

### Opção 2: Instalação Manual

```cmd
# 1. Instalar Node.js (se necessário)
# Baixar de: https://nodejs.org/

# 2. Copiar arquivos para pasta de produção
mkdir C:\FonteVida\PrintServer
copy thermal-print-server.js C:\FonteVida\PrintServer\
copy start-thermal-server.bat C:\FonteVida\PrintServer\

# 3. Testar servidor
cd C:\FonteVida\PrintServer
node thermal-print-server.js
```

## 🖨️ Configuração da Impressora Térmica

### Passo a Passo - Windows

1. **Abrir Painel de Controle**

   - `Windows + R` → `control printers`

2. **Adicionar Impressora**

   - Clique em "Adicionar impressora"
   - Selecione "Adicionar impressora local ou de rede"

3. **Configurar Porta**

   - Usar porta existente: `USB001` (ou porta da sua impressora)
   - Se não souber: `Dispositivos e Impressoras` → Localizar sua impressora térmica

4. **Selecionar Driver**

   - Fabricante: `Generic`
   - Impressora: `Generic / Text Only`
   - **IMPORTANTE:** Nome deve ser exatamente `"Generic / Text Only"`

5. **Testar Impressora**
   - Botão direito na impressora → `Propriedades`
   - Aba `Geral` → `Imprimir página de teste`

### Verificação via CMD

```cmd
# Listar impressoras instaladas
wmic printer get name,status

# Verificar se "Generic / Text Only" existe
wmic printer where "name='Generic / Text Only'" get name,status

# Enviar teste manual
echo Teste de impressao > teste.txt
copy teste.txt "Generic / Text Only"
```

## 🌐 Configuração do Sistema Web

### 1. Instalar Dependências

```cmd
cd caminho\para\projeto
npm install
```

### 2. Configurar para Produção

```cmd
# Build para produção
npm run build

# Ou executar em desenvolvimento
npm run dev
```

### 3. Configurar CORS (se necessário)

Se o webapp estiver em um domínio diferente, configure no `thermal-print-server.js`:

```javascript
// Alterar linha:
res.setHeader("Access-Control-Allow-Origin", "*");

// Para domínio específico:
res.setHeader("Access-Control-Allow-Origin", "https://seudominio.com");
```

## 🔧 Scripts de Produção

### Para iniciar o servidor:

```cmd
# Opção 1: Script batch
start-thermal-server.bat

# Opção 2: PowerShell (mais detalhado)
powershell -ExecutionPolicy Bypass -File start-thermal-server.ps1

# Opção 3: Direto
node thermal-print-server.js
```

### Para executar webapp + servidor juntos:

```cmd
# Terminal 1 - Servidor de impressão
cd C:\FonteVida\PrintServer
start-thermal-server.bat

# Terminal 2 - Aplicação web
cd C:\Caminho\Para\Projeto
npm run dev
```

## 🔄 Inicialização Automática

### Método 1: Registro do Windows

```cmd
# Adicionar à inicialização
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "FonteVidaPrintServer" /t REG_SZ /d "C:\FonteVida\PrintServer\start-server.bat" /f

# Remover da inicialização
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "FonteVidaPrintServer" /f
```

### Método 2: Serviço Windows (Avançado)

```cmd
# Instalar como serviço (requer ferramentas adicionais)
npm install -g node-windows
# Configurar conforme documentação do node-windows
```

### Método 3: Agendador de Tarefas

1. `Windows + R` → `taskschd.msc`
2. `Criar Tarefa Básica`
3. **Nome:** Fonte de Vida - Print Server
4. **Disparador:** Ao iniciar o computador
5. **Ação:** Iniciar programa
6. **Programa:** `C:\FonteVida\PrintServer\start-server.bat`

## 🧪 Testes de Funcionamento

### 1. Teste do Servidor

```cmd
# Verificar se servidor está rodando
curl http://localhost:3001/status

# Ou via PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/status"

# Teste de impressão direto
curl -X POST http://localhost:3001/test
```

### 2. Teste via Navegador

1. Acesse: `http://localhost:3001/status`
2. Deve retornar JSON com informações do servidor

3. Teste de impressão: `http://localhost:3001/test`
4. Deve imprimir uma página de teste

### 3. Teste Integrado

1. **Abrir o sistema web** (localhost:5173 ou seu domínio)
2. **Criar um pedido** de teste
3. **Clicar em "Imprimir"**
4. **Verificar:** Deve imprimir automaticamente sem diálogo

## 🔍 Solução de Problemas

### Problema: "Porta 3001 em uso"

```cmd
# Verificar processos
netstat -ano | findstr :3001

# Matar processo específico
taskkill /PID <numero_do_pid> /F

# Ou matar todos os Node.js
taskkill /f /im node.exe
```

### Problema: "Impressora não encontrada"

```cmd
# Verificar impressoras
wmic printer get name,status

# Reinstalar driver "Generic / Text Only"
# Painel de Controle > Dispositivos e Impressoras > Adicionar impressora
```

### Problema: "Servidor não inicia"

```cmd
# Verificar Node.js
node --version

# Verificar arquivos
dir C:\FonteVida\PrintServer

# Executar com logs
cd C:\FonteVida\PrintServer
node thermal-print-server.js
```

### Problema: "CORS Error"

- Verificar se o servidor está rodando
- Confirmar URL: `http://localhost:3001`
- Verificar configurações de CORS no servidor

## 📊 Monitoramento

### Logs do Servidor

```cmd
# Executar com logs detalhados
set DEBUG=*
node thermal-print-server.js

# Redirecionar logs para arquivo
node thermal-print-server.js > logs.txt 2>&1
```

### Status via PowerShell

```powershell
# Script para verificar status
$status = try {
    Invoke-RestMethod -Uri "http://localhost:3001/status" -TimeoutSec 5
} catch {
    "Servidor não responde"
}
Write-Host $status
```

## 🎯 Configuração de Produção Final

### Checklist de Deploy

- [ ] ✅ Node.js instalado (v16+)
- [ ] ✅ Impressora "Generic / Text Only" configurada
- [ ] ✅ Servidor de impressão instalado em `C:\FonteVida\PrintServer`
- [ ] ✅ Firewall configurado (porta 3001)
- [ ] ✅ Atalhos criados (Desktop + Menu)
- [ ] ✅ Teste de impressão funcionando
- [ ] ✅ Webapp conectando ao servidor
- [ ] ✅ Inicialização automática configurada (opcional)

### Estrutura Final de Arquivos

```
C:\FonteVida\PrintServer\
├── thermal-print-server.js      # Servidor principal
├── start-server.bat            # Script de inicialização
├── start-thermal-server.bat    # Script original
├── start-thermal-server.ps1    # Script PowerShell
└── logs.txt                    # Logs (se configurado)

Desktop\
├── Fonte de Vida - Servidor de Impressão.lnk

Menu Iniciar\Fonte de Vida\
├── Servidor de Impressão.lnk
```

## 📞 Suporte

### Para usuários finais:

1. **Problema com impressão:** Verificar se atalho está funcionando
2. **Servidor não inicia:** Executar `start-thermal-server.bat` como administrador
3. **Impressora não imprime:** Verificar se está ligada e tem papel

### Para desenvolvedores:

- **Logs:** Console do navegador + logs do servidor
- **API:** Documentação em `http://localhost:3001/`
- **Código:** Verificar `src/services/WebPrinterService.js`

## 🔄 Updates e Manutenção

### Atualizar servidor:

1. Substituir `thermal-print-server.js`
2. Reiniciar servidor
3. Testar funcionamento

### Backup da configuração:

- Exportar configurações do sistema
- Backup da pasta `C:\FonteVida\PrintServer`
- Documentar configurações específicas da impressora
