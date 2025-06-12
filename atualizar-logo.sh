#!/bin/bash

# Script para fazer deploy após atualizar logos
# Uso: ./atualizar-logo.sh

echo "🎨 Script de Deploy com Logos Atualizados - Fonte de Vida"
echo "========================================================="

# Verificar se os arquivos de logo existem
if [ ! -f "public/logo_site.png" ]; then
    echo "❌ Erro: logo_site.png não encontrado em public/"
    echo "📝 Coloque sua logo como: public/logo_site.png"
    exit 1
fi

if [ ! -f "public/icon.svg" ]; then
    echo "❌ Erro: icon.svg não encontrado em public/"
    echo "📝 Coloque seu ícone como: public/icon.svg"
    exit 1
fi

echo "✅ Logos encontrados:"
echo "   📷 Logo principal: public/logo_site.png"
echo "   🎯 Ícone SVG: public/icon.svg"
    echo "💡 Uso: ./atualizar-logo.sh caminho/para/sua-logo.png"
    echo ""
    echo "📋 Exemplo:"
    echo "   ./atualizar-logo.sh ~/Downloads/logo-empresa.png"
    exit 1
fi

LOGO_FILE="$1"

# Verificar se o arquivo existe
if [ ! -f "$LOGO_FILE" ]; then
    echo "❌ Erro: Arquivo '$LOGO_FILE' não encontrado"
    exit 1
fi

echo "📁 Logo encontrada: $LOGO_FILE"

# Verificar se ImageMagick está instalado (para redimensionar)
if command -v convert &> /dev/null; then
    echo "🔧 ImageMagick detectado - redimensionando logos..."
    
    # Criar diferentes tamanhos
    convert "$LOGO_FILE" -resize 200x200 public/logo-empresa.png
    convert "$LOGO_FILE" -resize 32x32 public/icon.png
    convert "$LOGO_FILE" -resize 192x192 public/icon-192x192.png
    convert "$LOGO_FILE" -resize 512x512 public/icon-512x512.png
    
    echo "✅ Logos redimensionadas e salvas em public/"
else
    echo "⚠️  ImageMagick não instalado - copiando logo original..."
    cp "$LOGO_FILE" public/logo-empresa.png
    cp "$LOGO_FILE" public/icon.png
    cp "$LOGO_FILE" public/icon-192x192.png
    cp "$LOGO_FILE" public/icon-512x512.png
    
    echo "💡 Para redimensionamento automático, instale ImageMagick:"
    echo "   sudo apt install imagemagick  (Ubuntu/Debian)"
    echo "   brew install imagemagick       (macOS)"
fi

# Verificar se o código está configurado para usar logo personalizada
if grep -q "logo-empresa.png" src/App.jsx; then
    echo "✅ Código já configurado para logo personalizada"
else
    echo "⚠️  Atenção: Ative a logo personalizada no código"
    echo "📝 Edite src/App.jsx e descomente a linha da logo"
    echo ""
    echo "🔍 Procure por esta linha (~linha 777):"
    echo '   <ShoppingCart className="h-8 w-8 text-white" />'
    echo ""
    echo "🔄 E substitua por:"
    echo '   <img src="/logo-empresa.png" alt="Logo" className="h-8 w-8 object-contain" />'
fi

# Perguntar se deve fazer deploy
echo ""
read -p "🚀 Fazer deploy agora? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Fazendo build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "☁️  Fazendo deploy..."
        vercel --prod
        echo "✅ Deploy concluído!"
        echo "🌐 Sua logo está online!"
    else
        echo "❌ Erro no build. Verifique os erros acima."
    fi
else
    echo "⏸️  Deploy cancelado. Para fazer depois:"
    echo "   vercel --prod"
fi

echo ""
echo "✨ Atualização de logo concluída!"
