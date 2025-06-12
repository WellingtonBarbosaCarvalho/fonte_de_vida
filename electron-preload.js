const { contextBridge, ipcRenderer } = require("electron");

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Função para imprimir recibo
  printReceipt: async (receiptText) => {
    return await ipcRenderer.invoke("print-receipt", receiptText);
  },

  // Função para teste de impressão
  testPrint: async () => {
    return await ipcRenderer.invoke("test-print");
  },

  // Função para listar impressoras
  listPrinters: async () => {
    return await ipcRenderer.invoke("list-printers");
  },

  // Verificar se está no Electron
  isElectron: true,

  // Informações da plataforma
  platform: process.platform,
});
