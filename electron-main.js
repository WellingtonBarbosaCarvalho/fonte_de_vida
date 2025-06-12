const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');

// Configuração da impressora
const PRINTER_NAME = 'Generic / Text Only';

class SimpleElectronApp {
  constructor() {
    this.mainWindow = null;
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron-preload.js')
      },
      icon: path.join(__dirname, 'public/icon.png'),
      title: 'Fonte de Vida - Sistema de Vendas'
    });

    // Carregar a aplicação
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    // Configurar handlers de impressão
    this.setupPrintHandlers();
  }

  setupPrintHandlers() {
    // Handler para impressão simples
    ipcMain.handle('print-receipt', async (event, receiptText) => {
      try {
        console.log('🖨️ Recebendo pedido de impressão...');
        const result = await this.printText(receiptText);
        return { success: true, result };
      } catch (error) {
        console.error('❌ Erro na impressão:', error);
        return { success: false, error: error.message };
      }
    });

    // Handler para teste de impressão
    ipcMain.handle('test-print', async () => {
      try {
        const testText = `
TESTE DE IMPRESSÃO
==================
Data: ${new Date().toLocaleString('pt-BR')}

Este é um teste da impressora.
Sistema: Fonte de Vida Desktop

Se você está lendo isto,
a impressão está funcionando!

==================
        `;
        
        const result = await this.printText(testText);
        return { success: true, result };
      } catch (error) {
        console.error('❌ Erro no teste:', error);
        return { success: false, error: error.message };
      }
    });

    // Handler para listar impressoras
    ipcMain.handle('list-printers', async () => {
      try {
        const printers = await this.listPrinters();
        return { success: true, printers };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  async printText(text) {
    return new Promise((resolve, reject) => {
      // Criar arquivo temporário
      const tempDir = os.tmpdir();
      const fileName = `fonte_vida_${Date.now()}.txt`;
      const filePath = path.join(tempDir, fileName);

      try {
        // Escrever texto no arquivo
        fs.writeFileSync(filePath, text, 'utf8');
        console.log(`📄 Arquivo criado: ${filePath}`);

        // Comando de impressão baseado no sistema
        let command;
        if (process.platform === 'win32') {
          command = `copy "${filePath}" "${PRINTER_NAME}"`;
        } else if (process.platform === 'linux') {
          command = `lpr -P "${PRINTER_NAME}" "${filePath}"`;
        } else {
          command = `lpr -P "${PRINTER_NAME}" "${filePath}"`;
        }

        console.log(`🖨️ Executando: ${command}`);

        // Executar impressão
        exec(command, (error, stdout, stderr) => {
          // Limpar arquivo temporário
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn('⚠️ Não foi possível remover arquivo temporário');
          }

          if (error) {
            console.error('❌ Erro na impressão:', error);
            reject(new Error(`Erro na impressão: ${error.message}`));
          } else {
            console.log('✅ Impressão enviada com sucesso');
            resolve({
              command,
              stdout,
              stderr
            });
          }
        });
      } catch (writeError) {
        reject(new Error(`Erro ao criar arquivo: ${writeError.message}`));
      }
    });
  }

  async listPrinters() {
    return new Promise((resolve, reject) => {
      let command;
      
      if (process.platform === 'win32') {
        command = 'wmic printer get name,status /format:csv';
      } else {
        command = 'lpstat -p';
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Erro ao listar impressoras: ${error.message}`));
          return;
        }

        try {
          let printers = [];
          
          if (process.platform === 'win32') {
            const lines = stdout.split('\n').filter(line => line.trim() && !line.startsWith('Node'));
            printers = lines.map(line => {
              const parts = line.split(',');
              return {
                name: parts[1] ? parts[1].trim() : 'Desconhecida',
                status: parts[2] ? parts[2].trim() : 'Desconhecido'
              };
            }).filter(p => p.name !== 'Desconhecida' && p.name !== '');
          } else {
            printers = stdout.split('\n')
              .filter(line => line.includes('printer'))
              .map(line => ({
                name: line.split(' ')[1],
                status: line.includes('disabled') ? 'Desabilitada' : 'Ativa'
              }));
          }

          resolve(printers);
        } catch (parseError) {
          reject(new Error(`Erro ao processar lista: ${parseError.message}`));
        }
      });
    });
  }
}

// Inicialização do app
const electronApp = new SimpleElectronApp();

app.whenReady().then(() => {
  electronApp.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      electronApp.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Log de inicialização
console.log('🚀 Fonte de Vida Desktop iniciando...');
console.log(`💻 Plataforma: ${process.platform}`);
console.log(`🖨️ Impressora configurada: ${PRINTER_NAME}`);
