#!/bin/bash

# Gerador de Versões Simples - Fonte de Vida
# Cria 3 versões diferentes para diferentes níveis de usuário

echo "🚀 Gerando versões do Sistema Fonte de Vida..."
echo

# Criar diretórios
mkdir -p releases/versao-web
mkdir -p releases/versao-desktop
mkdir -p releases/versao-completa

echo "📦 Criando Versão 1: WEB SIMPLES (Para usuários básicos)"
echo "   - Apenas navegador"
echo "   - Impressão via diálogo do browser"
echo "   - Download de arquivo TXT"

# Build para web
npm run build

# Copiar arquivos da versão web
cp -r dist/* releases/versao-web/
cp src/styles/thermal-print.css releases/versao-web/
cat > releases/versao-web/COMO_USAR.txt << 'EOF'
🌐 VERSÃO WEB - COMO USAR

✅ MAIS SIMPLES - RECOMENDADO PARA INICIANTES

1. ABRIR O SISTEMA:
   - Clique duas vezes no arquivo "index.html"
   - Ou abra no navegador (Chrome, Firefox, Edge)

2. USAR O SISTEMA:
   - Cadastre produtos, clientes, faça pedidos normalmente
   
3. IMPRIMIR CUPONS:
   - Ao clicar em "Imprimir", uma janela será aberta
   - Clique em "IMPRIMIR AGORA"
   - Selecione sua impressora
   - Pronto!

4. SE A IMPRESSÃO NÃO FUNCIONAR:
   - Use a opção "Baixar TXT"
   - Abra o arquivo baixado
   - Imprima normalmente (Ctrl+P)

💡 DICAS:
   - Funciona em qualquer computador com navegador
   - Não precisa instalar nada
   - Dados ficam salvos no navegador

⚠️ IMPORTANTE:
   - Para impressoras térmicas, use as versões Desktop ou Completa
   - Esta versão é ideal para impressoras comuns
EOF

echo "📦 Criando Versão 2: DESKTOP (Para impressão térmica)"

# Adicionar dependências do Electron ao package.json temporário
cp package.json package-backup.json
cat package-electron.json | jq -s '.[0] * .[1]' package.json - > package-temp.json
mv package-temp.json package.json

# Build desktop (se electron estiver instalado)
if command -v electron &> /dev/null; then
    echo "   - Electron encontrado, gerando executável..."
    npm run build
    # npm run dist 2>/dev/null || echo "   ⚠️ Erro no build desktop - será incluído código fonte"
fi

# Restaurar package.json
mv package-backup.json package.json

# Copiar arquivos desktop
cp -r dist/* releases/versao-desktop/
cp electron-main.js releases/versao-desktop/
cp electron-preload.js releases/versao-desktop/
cp package-electron.json releases/versao-desktop/package.json

cat > releases/versao-desktop/COMO_USAR.txt << 'EOF'
🖥️ VERSÃO DESKTOP - COMO USAR

✅ MELHOR PARA IMPRESSORAS TÉRMICAS

1. INSTALAR (APENAS UMA VEZ):
   - Instale o Node.js: https://nodejs.org/
   - Abra o prompt de comando nesta pasta
   - Digite: npm install
   - Digite: npm install electron -g

2. EXECUTAR O SISTEMA:
   - Clique duas vezes em "INICIAR_DESKTOP.bat"
   - Ou digite no prompt: electron .

3. USAR O SISTEMA:
   - Uma janela do programa será aberta
   - Use normalmente como qualquer programa
   - A impressão será DIRETA na impressora térmica

4. CONFIGURAR IMPRESSORA:
   - Certifique-se que sua impressora se chama "Generic / Text Only"
   - Ou edite o arquivo "electron-main.js" e mude o nome

💡 VANTAGENS:
   - Impressão direta em impressoras térmicas
   - Interface nativa do Windows
   - Melhor performance

⚠️ REQUISITOS:
   - Node.js instalado
   - Impressora térmica configurada
EOF

# Criar script de inicialização para desktop
cat > releases/versao-desktop/INICIAR_DESKTOP.bat << 'EOF'
@echo off
title Fonte de Vida - Desktop
echo 🖥️ Iniciando Fonte de Vida - Versão Desktop...
echo.

if not exist node_modules (
    echo 📦 Instalando dependências pela primeira vez...
    npm install
)

echo 🚀 Abrindo aplicação...
electron .
EOF

chmod +x releases/versao-desktop/INICIAR_DESKTOP.bat

echo "📦 Criando Versão 3: COMPLETA (Para técnicos)"

# Copiar tudo para versão completa
cp -r . releases/versao-completa/
rm -rf releases/versao-completa/releases  # Evitar recursão
rm -rf releases/versao-completa/node_modules
rm -rf releases/versao-completa/.git

cat > releases/versao-completa/COMO_USAR.txt << 'EOF'
🔧 VERSÃO COMPLETA - COMO USAR

✅ PARA USUÁRIOS TÉCNICOS E DESENVOLVEDORES

Esta versão inclui TODAS as soluções de impressão:
1. 🌐 Impressão via navegador (otimizada)
2. 🖥️ Aplicativo desktop (Electron)
3. 🖨️ Servidor local de impressão
4. 📄 Download de arquivos TXT

ESCOLHA SUA ABORDAGEM:

🥇 RECOMENDADO - Servidor Local:
   1. Execute: start-thermal-server.bat
   2. Execute: npm run dev
   3. Impressão automática funcionará!

🥈 ALTERNATIVA - Desktop:
   1. Execute: npm install
   2. Execute: npm run electron
   3. Aplicação desktop com impressão direta

🥉 BÁSICO - Web:
   1. Execute: npm run dev
   2. Use diálogo de impressão otimizado

📋 COMANDOS ÚTEIS:
   - npm run dev          (modo desenvolvimento)
   - npm run build        (gerar versão produção)
   - npm run print-server (apenas servidor impressão)
   - npm run electron     (versão desktop)

💡 PERSONALIZAÇÃO:
   - Edite thermal-print-server.js para mudar impressora
   - Modifique src/services/ para ajustar comportamento
   - Configure em src/config/ para suas necessidades

⚠️ REQUISITOS TÉCNICOS:
   - Node.js v16+
   - npm ou yarn
   - Conhecimento básico de terminal/prompt
EOF

echo
echo "✅ Versões geradas com sucesso!"
echo
echo "📁 Arquivos criados:"
echo "   releases/versao-web/       - Para usuários básicos"
echo "   releases/versao-desktop/   - Para impressão térmica"
echo "   releases/versao-completa/  - Para técnicos"
echo
echo "📋 Como distribuir:"
echo "   1. Comprima cada pasta em um .zip"
echo "   2. Entregue a versão adequada para cada usuário"
echo "   3. Inclua as instruções (arquivo COMO_USAR.txt)"
echo
echo "🎯 Recomendações por perfil:"
echo "   👤 Usuário leigo: versao-web"
echo "   🖨️ Precisa impressão térmica: versao-desktop"  
echo "   🔧 Técnico/Desenvolvedor: versao-completa"
echo
