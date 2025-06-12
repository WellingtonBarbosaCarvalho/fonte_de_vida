# 🚀 Deploy Windows - Sistema Fonte de Vida

## 📦 Pacote Completo para Produção

Este repositório contém **tudo necessário** para colocar o sistema Fonte de Vida em produção em ambiente Windows, com impressão térmica funcionando perfeitamente.

## ⚡ Instalação Expressa (Usuário Final)

```cmd
# 1. Baixar o projeto
git clone [seu-repositorio] fonte-vida
cd fonte-vida

# 2. Executar instalador (como Administrador)
install-windows.bat

# 3. Testar tudo
test-complete-windows.bat
```

**Pronto!** O sistema estará funcionando com impressão térmica automática.

## 🎯 O Que Este Pacote Resolve

### ❌ Problema Original

- Webapp não conseguia imprimir em impressora térmica
- Driver "Generic / Text Only" não funcionava via navegador
- Impressão saía em branco ou não funcionava

### ✅ Solução Implementada

- **Servidor Local:** Converte requisições HTTP em comandos RAW
- **Detecção Automática:** Sistema detecta Windows/Linux/Mac
- **Fallback Inteligente:** Se servidor não estiver disponível, usa diálogo otimizado
- **Instalação Automática:** Script instala tudo automaticamente

## 📁 Estrutura do Pacote

```
📦 fonte-vida/
├── 🚀 install-windows.bat          # Instalador automático
├── 🧪 test-complete-windows.bat    # Teste completo do sistema
├── 🖨️ thermal-print-server.js      # Servidor de impressão
├── 📋 start-thermal-server.bat     # Iniciar servidor (simples)
├── ⚙️ start-thermal-server.ps1     # Iniciar servidor (PowerShell)
├── 📖 GUIA_PRODUCAO_WINDOWS.md     # Guia completo
├── 🌐 src/                         # Código do webapp
├── 📦 package.json                 # Dependências
└── 🔧 Outros arquivos...
```

## 🎬 Fluxo de Instalação

### 1. **Preparação** (2 minutos)

```cmd
# Baixar projeto
git clone [repositorio] fonte-vida
cd fonte-vida
```

### 2. **Instalação** (5 minutos)

```cmd
# Executar como Administrador
install-windows.bat
```

O instalador irá:

- ✅ Verificar/instalar Node.js
- ✅ Configurar impressora
- ✅ Instalar servidor em `C:\FonteVida\PrintServer`
- ✅ Criar atalhos
- ✅ Configurar firewall
- ✅ Testar funcionamento

### 3. **Teste** (1 minuto)

```cmd
# Testar tudo automaticamente
test-complete-windows.bat
```

### 4. **Uso** (Pronto!)

- Abrir webapp no navegador
- Criar pedidos
- Imprimir automaticamente! 🎉

## 🔄 Uso Diário

### Iniciar Sistema

**Opção 1: Atalho Desktop**

- Duplo clique em "Fonte de Vida - Servidor de Impressão"

**Opção 2: Menu Iniciar**

- Menu Iniciar → Fonte de Vida → Servidor de Impressão

**Opção 3: Manual**

```cmd
cd C:\FonteVida\PrintServer
start-thermal-server.bat
```

### Usar Sistema

1. **Servidor iniciar** (janela preta aparece)
2. **Abrir navegador:** `http://localhost:5173`
3. **Usar normalmente** - impressão será automática!

## 🔧 Configurações Avançadas

### Inicialização Automática

```cmd
# Adicionar à inicialização do Windows
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "FonteVidaPrintServer" /t REG_SZ /d "C:\FonteVida\PrintServer\start-server.bat" /f
```

### Configurar Impressora Diferente

1. Editar `thermal-print-server.js`
2. Alterar linha: `const PRINTER_NAME = "SUA_IMPRESSORA";`
3. Reiniciar servidor

### Usar em Rede Local

1. Editar `thermal-print-server.js`
2. Alterar: `this.server.listen(PORT, '0.0.0.0', () => {`
3. No webapp: alterar URL para `http://IP_DO_SERVIDOR:3001`

## 🧪 Testes e Verificações

### Teste Rápido

```cmd
# Verificar se servidor está rodando
curl http://localhost:3001/status

# Teste de impressão
curl -X GET http://localhost:3001/test
```

### Teste Completo

```cmd
# Executar bateria de testes
test-complete-windows.bat
```

### Teste Manual

1. Abrir: `http://localhost:3001/status`
2. Deve mostrar JSON com informações
3. Abrir: `http://localhost:3001/test`
4. Deve imprimir página de teste

## 🔍 Solução de Problemas

### "Servidor não inicia"

```cmd
# Verificar Node.js
node --version

# Verificar porta
netstat -ano | findstr :3001

# Matar processos conflitantes
taskkill /f /im node.exe
```

### "Impressora não imprime"

```cmd
# Verificar impressora
wmic printer where "name='Generic / Text Only'" get name,status

# Teste direto
echo Teste > teste.txt
copy teste.txt "Generic / Text Only"
```

### "Erro no webapp"

- Verificar console do navegador (F12)
- Confirmar se servidor está rodando
- Verificar URL: `http://localhost:3001`

## 📊 Monitoramento

### Status do Sistema

```cmd
# Status do servidor
powershell -Command "Invoke-RestMethod http://localhost:3001/status"

# Listar processos Node.js
tasklist | findstr node

# Verificar logs
type C:\FonteVida\PrintServer\logs.txt
```

### URLs Importantes

- **Status:** http://localhost:3001/status
- **Teste:** http://localhost:3001/test
- **Webapp:** http://localhost:5173
- **Build produção:** http://localhost:4173

## 🎯 Deploy para Clientes

### Pacote Mínimo para Cliente

```
📦 PacoteCliente/
├── install-windows.bat
├── thermal-print-server.js
├── start-thermal-server.bat
├── GUIA_INSTALACAO.md
└── dist/ (build do webapp)
```

### Instruções para Cliente

1. **Descompactar** pacote
2. **Executar** `install-windows.bat` como Administrador
3. **Seguir** instruções na tela
4. **Testar** impressão
5. **Usar** sistema normalmente

## 📞 Suporte

### Para Usuários

- **Problema:** Servidor não inicia → Executar como Administrador
- **Problema:** Não imprime → Verificar se impressora está ligada
- **Problema:** Erro na tela → Pressionar F5 para recarregar

### Para Técnicos

- **Logs:** Console do navegador + logs do servidor
- **Debug:** Executar `test-complete-windows.bat`
- **Configuração:** Editar arquivos em `C:\FonteVida\PrintServer`

## 🔄 Atualizações

### Atualizar Sistema

1. Parar servidor atual
2. Substituir arquivos
3. Reiniciar servidor
4. Testar funcionamento

### Backup Configuração

```cmd
# Backup completo
xcopy C:\FonteVida\PrintServer C:\Backup\FonteVida /E /I

# Restore
xcopy C:\Backup\FonteVida C:\FonteVida\PrintServer /E /I
```

---

## 🏆 Resultado Final

Após seguir este guia, você terá:

- ✅ **Sistema 100% funcional** em Windows
- ✅ **Impressão térmica automática** funcionando
- ✅ **Interface web responsiva** e moderna
- ✅ **Instalação automatizada** para novos clientes
- ✅ **Documentação completa** para suporte
- ✅ **Testes automatizados** para validação

**O problema de impressão térmica em webapp está completamente resolvido!** 🎉
