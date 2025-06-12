#!/bin/bash

# Script para deploy da PWA Fonte de Vida
# Uso: ./deploy.sh [destino]

echo "🚀 Iniciando deploy da PWA Fonte de Vida..."

# Limpar build anterior
echo "🧹 Limpando builds anteriores..."
rm -rf dist/

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    # Verificar se foi passado um destino
    if [ ! -z "$1" ]; then
        echo "📁 Copiando arquivos para $1..."
        cp -r dist/* $1/
        echo "✅ Deploy concluído em $1"
    else
        echo "📂 Arquivos gerados em: ./dist/"
        echo "📋 Para servir localmente: npm run serve"
        echo "🌐 Para deploy, copie o conteúdo de ./dist/ para seu servidor web"
    fi
    
    echo ""
    echo "📊 Estatísticas do build:"
    du -sh dist/
    echo ""
    echo "📁 Arquivos gerados:"
    ls -la dist/
    
else
    echo "❌ Erro no build!"
    exit 1
fi
