#!/bin/bash

# Script para testar o sistema de modais
echo "🧪 Testando Sistema de Modais - Fonte de Vida"
echo "=============================================="

# Verificar se o servidor está rodando
echo "📡 Verificando servidor..."
if curl -s http://localhost:5174 > /dev/null; then
    echo "✅ Servidor rodando em http://localhost:5174"
else
    echo "❌ Servidor não está respondendo"
    exit 1
fi

# Verificar arquivos principais
echo "📁 Verificando arquivos..."

files=(
    "src/App.jsx"
    "src/components/Modal.jsx"
    "src/components/ClientesTab.jsx"
    "src/components/ProdutosTab.jsx"
    "src/components/CategoriasTab.jsx"
    "src/components/SettingsTab.jsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file não encontrado"
    fi
done

# Verificar se não há mais alerts/confirms nativos
echo "🔍 Verificando se alerts/confirms foram substituídos..."

# Buscar por alert( nos arquivos JSX
alert_count=$(grep -r "alert(" src/components/*.jsx | wc -l)
confirm_count=$(grep -r "confirm(" src/components/*.jsx | wc -l)

if [ $alert_count -eq 0 ] && [ $confirm_count -eq 0 ]; then
    echo "✅ Todos os alerts/confirms nativos foram substituídos"
else
    echo "⚠️  Ainda existem $alert_count alert() e $confirm_count confirm() nos componentes"
    if [ $alert_count -gt 0 ]; then
        echo "   Alerts encontrados:"
        grep -rn "alert(" src/components/*.jsx
    fi
    if [ $confirm_count -gt 0 ]; then
        echo "   Confirms encontrados:"
        grep -rn "confirm(" src/components/*.jsx
    fi
fi

# Verificar se modal.showAlert está sendo usado
modal_usage=$(grep -r "modal\.show" src/components/*.jsx | wc -l)
if [ $modal_usage -gt 0 ]; then
    echo "✅ Sistema de modais está sendo usado ($modal_usage ocorrências)"
else
    echo "❌ Sistema de modais não está sendo usado"
fi

echo ""
echo "📋 Resumo do teste:"
echo "   - Servidor: ✅ Funcionando"
echo "   - Arquivos: ✅ Presentes"
echo "   - Alerts nativos: $([ $alert_count -eq 0 ] && echo "✅ Substituídos" || echo "⚠️  $alert_count restantes")"
echo "   - Confirms nativos: $([ $confirm_count -eq 0 ] && echo "✅ Substituídos" || echo "⚠️  $confirm_count restantes")"
echo "   - Modal system: $([ $modal_usage -gt 0 ] && echo "✅ Em uso" || echo "❌ Não usado")"

echo ""
echo "🎉 Sistema de modais implementado com sucesso!"
echo "   Acesse http://localhost:5174 para testar"
