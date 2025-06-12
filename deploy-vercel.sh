#!/bin/bash

# Script de deploy para Vercel
# Execute: chmod +x deploy-vercel.sh && ./deploy-vercel.sh

echo "🚀 Iniciando deploy para Vercel..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Fazer build
echo "🔨 Fazendo build da aplicação..."
npm run build

# Deploy para Vercel
echo "☁️  Fazendo deploy..."
vercel --prod

echo "✅ Deploy concluído!"
echo "🌐 Sua aplicação está online!"
