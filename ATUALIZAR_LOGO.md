# 🎨 Guia de Atualização de Logo - Vercel

## 🚀 **Resposta Rápida: NÃO precisa deployar "desde o começo"!**

### **⚡ Deploy rápido (1-2 minutos):**

```bash
# 1. Trocar logo
# 2. Executar:
vercel --prod
# 3. Pronto!
```

## 📍 **Onde Colocar Cada Tipo de Logo**

### **1. Logo Principal do Sistema (Header)**

**Localização**: `public/logo-empresa.png`
**Como ativar**: Editar `src/App.jsx` linha ~775

```jsx
// Trocar esta linha:
<ShoppingCart className="h-8 w-8 text-white" />

// Por esta:
<img src="/logo-empresa.png" alt="Logo da Empresa" className="h-8 w-8 object-contain" />
```

### **2. Ícone PWA (Aparece na tela inicial)**

**Arquivos**:

- `public/icon.png` (favicon)
- `public/icon-192x192.png` (ícone pequeno)
- `public/icon-512x512.png` (ícone grande)

**Tamanhos recomendados**:

- icon.png: 32x32px ou 64x64px
- icon-192x192.png: 192x192px
- icon-512x512.png: 512x512px

### **3. Logo nos Relatórios PDF**

**Como adicionar**: Editar `src/services/PDFReportService.js`

```javascript
// Adicionar antes do texto do cabeçalho:
if (logoUrl) {
  pdf.addImage(logoUrl, "PNG", 20, 10, 30, 15);
}
```

## 🔄 **Processo de Atualização Completa**

### **Passo 1: Preparar Logos**

```bash
# Criar logos nos tamanhos corretos
# Colocar na pasta public/
cp sua-logo.png public/logo-empresa.png
cp icone-32x32.png public/icon.png
cp icone-192x192.png public/icon-192x192.png
cp icone-512x512.png public/icon-512x512.png
```

### **Passo 2: Ativar Logo no Sistema**

Editar `src/App.jsx`:

```jsx
// Linha ~777, trocar:
<ShoppingCart className="h-8 w-8 text-white" />
// Por:
<img src="/logo-empresa.png" alt="Logo" className="h-8 w-8 object-contain" />
```

### **Passo 3: Deploy Rápido**

```bash
# Opção A: Deploy direto
vercel --prod

# Opção B: Com git (se conectado)
git add .
git commit -m "Atualizar logos da empresa"
git push
# (deploy automático)
```

## ⚡ **Tipos de Deploy**

### **🟢 Deploy Rápido (1-2 min)**

- Apenas arquivos alterados
- Mantém dados existentes
- Zero downtime

### **🔄 Deploy Completo (3-5 min)**

- Rebuilda tudo
- Raramente necessário
- Mesmo resultado final

### **🟠 Deploy Automático (GitHub)**

- Push no git = deploy automático
- Mais profissional
- Histórico de mudanças

## 📱 **Formatos Recomendados**

### **Logo Principal**:

- **Formato**: PNG com fundo transparente
- **Tamanho**: 200x200px (máximo)
- **Cor**: Funciona com fundo colorido

### **Ícones PWA**:

- **Formato**: PNG quadrado
- **Fundo**: Opaco (não transparente)
- **Design**: Simples, legível em tamanho pequeno

## 🎯 **Dicas Profissionais**

### **1. Teste Local Primeiro**

```bash
npm run dev
# Verificar se logo aparece corretamente
```

### **2. Cache do Navegador**

```bash
# Se logo não atualizar, limpar cache:
Ctrl + F5 (ou Cmd + Shift + R)
```

### **3. Logo Responsiva**

```jsx
<img
  src="/logo-empresa.png"
  alt="Logo"
  className="h-8 w-8 object-contain max-w-full"
/>
```

## ✅ **Checklist de Atualização**

- [ ] Logo principal (public/logo-empresa.png)
- [ ] Ícone pequeno (public/icon.png)
- [ ] Ícone PWA 192px (public/icon-192x192.png)
- [ ] Ícone PWA 512px (public/icon-512x512.png)
- [ ] Ativar no código (App.jsx)
- [ ] Testar localmente (npm run dev)
- [ ] Deploy (vercel --prod)
- [ ] Verificar online

## 🚀 **Resultado**

Após a atualização:

- ✅ Logo aparece no header do sistema
- ✅ Ícone personalizado na tela inicial
- ✅ Favicon personalizado na aba do navegador
- ✅ Branding completo da empresa

**Tempo total: 5-10 minutos** (incluindo preparação das imagens)
