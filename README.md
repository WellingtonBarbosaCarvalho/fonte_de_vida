# Fonte de Vida - Sistema de Gestão

Sistema de gestão para empresa Fonte de Vida, desenvolvido com React + Vite + Electron.

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Desktop**: Electron 25
- **Database**: Better-SQLite3
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Ou com pnpm
pnpm install
```

## 🏃‍♂️ Executar o projeto

### Desenvolvimento Web

```bash
npm run dev
# ou
pnpm dev
```

### Desenvolvimento Electron

```bash
npm run electron-dev
# ou
pnpm electron-dev
```

### Produção

```bash
# Build web
npm run build

# Executar Electron
npm run electron

# Build para distribuição
npm run dist
```

## 📱 Build para diferentes plataformas

```bash
# Windows
npm run build-win

# Linux
npm run build-linux

# macOS
npm run build-mac
```

## 🗂️ Estrutura do projeto

```
├── public/
│   ├── electron.cjs          # Processo principal do Electron
│   ├── preload.cjs           # Script de preload (segurança)
│   └── PrinterService.js     # Serviço de impressão
├── src/
│   ├── components/           # Componentes React
│   ├── services/
│   │   ├── DatabaseService.cjs    # Banco SQLite (Electron)
│   │   ├── MockDatabaseService.js # Mock para web
│   │   └── AppSettings.js          # Configurações
│   ├── App.jsx              # Componente principal
│   └── main.jsx             # Entry point React
├── package.json
└── vite.config.mjs
```

## ⚙️ Configurações importantes

### Electron

- **Main Process**: `public/electron.cjs`
- **Preload Script**: `public/preload.cjs`
- **Database**: SQLite3 com WAL mode
- **Security**: Context isolation habilitado

### Build

- **Output**: `dist/`
- **Assets**: Incluídos automaticamente
- **Native modules**: Better-SQLite3 unpacked

## 🔧 Resolução de problemas

### Erro de módulos ES/CommonJS

Se encontrar erros relacionados a módulos, verifique:

1. `package.json` tem `"type": "commonjs"`
2. Arquivos do Electron usam `.cjs`
3. Arquivos do React usam `.js` ou `.jsx`

### Problemas com SQLite

```bash
# Reinstalar dependências nativas
npm run postinstall
```

## 📄 Licença

Projeto privado - Fonte de Vida+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
