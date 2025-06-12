# 🖨️ Soluções para Impressão Térmica no Web App

Este documento explica como resolver o problema de impressão em impressoras térmicas com driver "Generic / Text Only" em aplicações web.

## 🔍 O Problema

Navegadores web **não podem enviar dados RAW diretamente** para impressoras por questões de segurança. Isso impede que impressoras térmicas funcionem corretamente com o diálogo de impressão padrão.

## ✅ Soluções Implementadas

### 1. **Servidor Local de Impressão (Recomendado)**

**O que faz:** Cria um servidor HTTP local que recebe comandos do webapp e envia diretamente para a impressora.

**Como usar:**

```bash
# Opção 1: Script automatizado
./start-thermal-server.sh

# Opção 2: Comando manual
node thermal-print-server.js

# Opção 3: Via npm
npm run print-server
```

**Características:**

- ✅ Impressão RAW real (funciona perfeitamente com térmicas)
- ✅ Resposta instantânea
- ✅ Funciona em background
- ✅ API REST simples
- ⚠️ Requer Node.js instalado

### 2. **Impressão Otimizada via Navegador (Fallback)**

**O que faz:** Quando o servidor local não está disponível, abre uma janela otimizada para impressão térmica.

**Melhorias implementadas:**

- CSS específico para impressoras térmicas (80mm)
- Instruções claras para o usuário
- Preview na tela antes da impressão
- Opção de download como TXT

### 3. **Download de Arquivo TXT (Última opção)**

**O que faz:** Permite baixar o cupom como arquivo .txt para impressão manual.

## 🚀 Como Executar

### Cenário Ideal (Servidor + Web App):

1. **Terminal 1 - Servidor de Impressão:**

   ```bash
   cd /home/wellington/Documentos/fdv/fdv_final_v22
   ./start-thermal-server.sh
   ```

2. **Terminal 2 - Web App:**
   ```bash
   cd /home/wellington/Documentos/fdv/fdv_final_v22
   npm run dev
   ```

### Apenas Web App (sem servidor):

```bash
cd /home/wellington/Documentos/fdv/fdv_final_v22
npm run dev
```

## 🔧 Configuração da Impressora

### No Windows:

1. Vá em **Configurações > Impressoras e scanners**
2. Encontre "Generic / Text Only"
3. Defina como **impressora padrão** (opcional)
4. Em propriedades, configure:
   - Papel: Personalizado (80mm x 297mm) ou A4
   - Margens: 0 em todos os lados

### No Linux:

```bash
# Verificar impressoras disponíveis
lpstat -p

# Verificar se "Generic / Text Only" está listada
lpstat -a | grep -i generic
```

## 🧪 Testando

### Via Interface Web:

1. Acesse o sistema
2. Vá em Configurações/Impressora
3. Clique em "Teste de Impressão"

### Via API (se servidor estiver rodando):

```bash
# Teste direto na API
curl -X GET http://localhost:3001/test

# Status do servidor
curl -X GET http://localhost:3001/status
```

## 📊 Fluxo de Impressão

```
[Pedido Criado]
    ↓
[WebPrinterService.printOrder()]
    ↓
[Tentar Servidor Local] → ✅ Sucesso → [Impressão RAW]
    ↓ (se falhar)
[Fallback: Navegador] → [Janela Otimizada] → [Seleção Manual da Impressora]
    ↓ (se falhar)
[Download TXT] → [Impressão Manual]
```

## 🔍 Logs e Debugging

**Console do Navegador:**

- Verifique mensagens do WebPrinterService
- Erros de conexão com servidor local
- Status das tentativas de impressão

**Console do Servidor:**

```bash
# Executar com logs detalhados
DEBUG=* node thermal-print-server.js
```

## 🆘 Solução de Problemas

### Problema: "Servidor local não disponível"

**Solução:**

1. Verificar se o servidor está rodando: `curl http://localhost:3001/status`
2. Verificar se a porta 3001 está livre: `lsof -i :3001`
3. Executar: `./start-thermal-server.sh`

### Problema: "Impressora não encontrada"

**Solução:**

1. Verificar nome exato: deve ser "Generic / Text Only"
2. No Windows: Painel de Controle > Dispositivos e Impressoras
3. No Linux: `lpstat -p`

### Problema: "Impressão sai em branco"

**Solução:**

1. Usar o servidor local (envia RAW)
2. No navegador: selecionar impressora correta
3. Configurar margens = 0
4. Papel = 80mm ou A4

### Problema: "Formatação incorreta"

**Solução:**

1. Verificar se está usando fonte Courier New
2. Verificar largura do papel (80mm)
3. Usar servidor local para melhor resultado

## 🎯 Recomendações

### Para Desenvolvimento:

- **Sempre use o servidor local** para testes
- Mantenha ambos rodando: `npm run start:full`

### Para Produção:

- **Configure o servidor como serviço do sistema**
- **Documente para usuários finais** como iniciar o servidor
- **Inclua verificação automática** de impressora

### Para Usuários Finais:

1. **Preferência:** Servidor local + webapp
2. **Alternativa:** Apenas webapp (com instruções claras)
3. **Último recurso:** Download + impressão manual

## 📝 Arquivos Modificados

- `src/services/WebPrinterService.js` - Lógica de impressão web melhorada
- `src/styles/thermal-print.css` - CSS específico para térmicas
- `thermal-print-server.js` - Servidor HTTP para impressão RAW
- `start-thermal-server.sh` - Script de inicialização
- `package.json` - Scripts adicionais

## 🔄 Próximos Passos

1. **Testar** as soluções implementadas
2. **Ajustar** configurações específicas da sua impressora
3. **Documentar** para outros usuários
4. **Considerar** criar instalador automático para o servidor
