# Fonte de Vida - PWA

Sistema de Gerenciamento de Pedidos convertido para Progressive Web App (PWA).

## ✨ Características

- **🌐 Executável no Navegador**: Funciona em qualquer navegador moderno
- **📱 Instalável**: Pode ser instalado como aplicativo no dispositivo
- **💾 Offline**: Funciona mesmo sem conexão à internet
- **🖨️ Impressão**: Sistema de impressão adaptado para web
- **💽 Persistência**: Dados salvos no localStorage do navegador

## 🚀 Como Executar

### Desenvolvimento

```bash
npm install
npm run dev
```

### Produção

```bash
npm run build
npm run serve
```

### Build PWA

```bash
npm run build:pwa
```

## 📱 Instalação como App

1. Abra a aplicação no navegador
2. No Chrome/Edge: Clique no ícone "Instalar" na barra de endereços
3. No Firefox: Menu → "Instalar este site como aplicativo"
4. No Safari (iOS): Compartilhar → "Adicionar à Tela de Início"

## 🖨️ Sistema de Impressão

### Modo Web

- Abre nova aba/janela com o recibo formatado
- Opção de imprimir via diálogo do navegador
- Opção de baixar como arquivo TXT
- Impressão automática após 1 segundo

### Modo Electron (Legacy)

- Mantém compatibilidade com impressoras térmicas
- Comunicação via IPC com sistema nativo

## 💾 Armazenamento de Dados

### LocalStorage (Modo Web)

- **Clientes**: `fonte_vida_customers`
- **Produtos**: `fonte_vida_products`
- **Pedidos**: `fonte_vida_orders`
- **Configurações**: `fonte_vida_settings`

### SQLite (Modo Electron)

- Banco de dados nativo para melhor performance
- Backup automático dos dados

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **PWA**: vite-plugin-pwa + Workbox
- **Icons**: Lucide React
- **Charts**: Recharts
- **Storage**: LocalStorage (Web) / SQLite (Electron)

## 📊 Funcionalidades

- ✅ Gerenciamento de Clientes
- ✅ Controle de Produtos
- ✅ Sistema de Pedidos
- ✅ Relatórios e Gráficos
- ✅ Impressão de Recibos
- ✅ Configurações do Sistema
- ✅ Backup/Restore de Dados

## 🔧 Configuração

### Service Worker

O service worker é automaticamente registrado e gerencia:

- Cache de recursos estáticos
- Funcionalidade offline
- Atualizações automáticas

### Manifest

O arquivo `manifest.json` define:

- Nome e ícones da aplicação
- Modo de exibição (standalone)
- Cores do tema
- Orientação da tela

## 🌐 Suporte a Navegadores

- ✅ Chrome/Chromium 90+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 90+

## 📱 Plataformas Móveis

- ✅ Android (Chrome, Firefox, Edge)
- ✅ iOS (Safari, Chrome, Firefox)
- ✅ iPadOS
- ✅ Windows Mobile

## 🔄 Migração do Electron

### Diferenças Principais

| Recurso       | Electron           | PWA                  |
| ------------- | ------------------ | -------------------- |
| Armazenamento | SQLite             | LocalStorage         |
| Impressão     | Impressora Térmica | Navegador + Download |
| Instalação    | Executável         | Web App              |
| Atualizações  | Download Manual    | Automática           |
| Plataforma    | Desktop            | Universal            |

### Compatibilidade

O código detecta automaticamente o ambiente e usa os serviços apropriados:

```javascript
// Detecção automática de ambiente
const isElectron = window.electronAPI !== undefined;

if (isElectron) {
  // Usar DatabaseService e PrinterService original
} else {
  // Usar WebStorageService e WebPrinterService
}
```

## 🆘 Suporte

### Problemas Comuns

1. **Dados não salvos**: Verifique se o localStorage está habilitado
2. **Não imprime**: Verifique as configurações de pop-up do navegador
3. **Não instala**: Navegador deve suportar PWA

### Backup Manual

Para fazer backup dos dados:

```javascript
// No console do navegador
const data = {
  customers: JSON.parse(localStorage.getItem("fonte_vida_customers")),
  products: JSON.parse(localStorage.getItem("fonte_vida_products")),
  orders: JSON.parse(localStorage.getItem("fonte_vida_orders")),
};
console.log(JSON.stringify(data));
```

## 📞 Contato

**Soluctions S.A**  
Desenvolvimento: Sistema Fonte de Vida v2.0  
Modo: Progressive Web App (PWA)

---

**Nota**: Esta versão PWA mantém todas as funcionalidades da versão Electron, adaptadas para funcionar perfeitamente no navegador web.
