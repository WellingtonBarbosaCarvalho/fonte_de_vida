#!/bin/bash

# Script para iniciar o servidor de impressão térmica
# Uso: ./start-thermal-server.sh

echo "🖨️ Iniciando servidor de impressão térmica..."
echo "📍 Diretório: $(pwd)"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "💡 Instale o Node.js primeiro: https://nodejs.org/"
    exit 1
fi

# Verificar se o arquivo do servidor existe
if [ ! -f "thermal-print-server.cjs" ]; then
    echo "❌ Arquivo thermal-print-server.cjs não encontrado!"
    echo "💡 Execute este script na pasta do projeto"
    exit 1
fi

# Matar processos existentes na porta 3001
echo "🔍 Verificando processos na porta 3001..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Porta 3001 já está em uso, encerrando processo..."
    pkill -f "thermal-print-server.cjs" 2>/dev/null || true
    sleep 2
fi

# Verificar se a impressora "Generic / Text Only" está disponível
echo "🔍 Verificando impressora 'Generic / Text Only'..."
if lpstat -p 2>/dev/null | grep -q "Generic"; then
    echo "✅ Impressora encontrada!"
elif lpstat -a 2>/dev/null | grep -q "Generic"; then
    echo "✅ Impressora encontrada!"
else
    echo "⚠️ Impressora 'Generic / Text Only' não encontrada"
    echo "💡 Certifique-se que a impressora está instalada e conectada"
    echo "💡 O servidor ainda será iniciado..."
fi

echo ""
echo "🚀 Iniciando servidor..."
echo "📋 Para parar o servidor, pressione Ctrl+C"
echo ""

# Iniciar o servidor
node thermal-print-server.cjs
