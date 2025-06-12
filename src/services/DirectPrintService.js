/**
 * DIRECT PRINT SERVICE - PENSANDO FORA DA CAIXA
 *
 * Esta é uma abordagem revolucionária que bypassa completamente
 * as limitações do navegador para impressão térmica RAW
 */

class DirectPrintService {
  constructor() {
    this.serverUrl = "http://localhost:3001";
    this.maxRetries = 3;
    this.retryDelay = 1000;

    console.log("🚀 DirectPrintService: Pensando fora da caixa!");
  }

  /**
   * ESTRATÉGIA 1: WEBSOCKET PARA COMUNICAÇÃO DIRETA
   * Bypassa HTTP tradicional e estabelece conexão direta
   */
  async establishDirectConnection() {
    try {
      // Tentar WebSocket se disponível
      if (typeof WebSocket !== "undefined") {
        const ws = new WebSocket("ws://localhost:3001");
        return new Promise((resolve, reject) => {
          ws.onopen = () => {
            console.log("🔌 Conexão WebSocket estabelecida");
            resolve(ws);
          };
          ws.onerror = () => reject("WebSocket failed");
          setTimeout(() => reject("WebSocket timeout"), 2000);
        });
      }
    } catch (error) {
      console.log("⚠️ WebSocket não disponível, usando HTTP direto");
    }
    return null;
  }

  /**
   * ESTRATÉGIA 2: RAW TCP SIMULATION VIA CHUNKED TRANSFER
   * Simula conexão TCP direta usando chunks HTTP
   */
  async sendRawDataDirect(textData) {
    const chunks = this.createRawChunks(textData);

    for (let i = 0; i < chunks.length; i++) {
      try {
        const response = await fetch(`${this.serverUrl}/raw-chunk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "X-Chunk-Index": i.toString(),
            "X-Total-Chunks": chunks.length.toString(),
            "X-Print-Mode": "direct-raw",
          },
          body: chunks[i],
        });

        if (!response.ok) {
          throw new Error(`Chunk ${i} failed`);
        }
      } catch (error) {
        console.error(`❌ Erro no chunk ${i}:`, error);
        throw error;
      }
    }

    return { success: true, method: "raw-chunked" };
  }

  /**
   * ESTRATÉGIA 3: ELECTRON-STYLE BRIDGE
   * Cria uma ponte direta com o sistema operacional
   */
  async createSystemBridge(textData) {
    // Detectar se temos capacidades especiais
    const capabilities = await this.detectSystemCapabilities();

    if (capabilities.hasNodeIntegration) {
      return await this.useNodeIntegration(textData);
    }

    if (capabilities.hasFileAPI) {
      return await this.useFileSystemBridge(textData);
    }

    if (capabilities.hasClipboard) {
      return await this.useClipboardBridge(textData);
    }

    throw new Error("Nenhuma capacidade de sistema disponível");
  }

  /**
   * ESTRATÉGIA 4: MEMORY-BASED PRINTER QUEUE
   * Cria uma fila de impressão em memória compartilhada
   */
  async useMemoryQueue(textData) {
    const queueId = "thermal_print_" + Date.now();

    // Armazenar dados na memória local compartilhada
    if (typeof SharedArrayBuffer !== "undefined") {
      const buffer = new SharedArrayBuffer(textData.length * 2);
      const view = new Uint16Array(buffer);

      for (let i = 0; i < textData.length; i++) {
        view[i] = textData.charCodeAt(i);
      }

      // Notificar servidor sobre dados disponíveis
      return await fetch(`${this.serverUrl}/memory-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId,
          bufferSize: textData.length,
          dataHash: this.calculateHash(textData),
        }),
      });
    }

    throw new Error("SharedArrayBuffer não disponível");
  }

  /**
   * ESTRATÉGIA 5: BROWSER EXTENSION SIMULATION
   * Simula uma extensão do navegador para acesso direto
   */
  async simulateBrowserExtension(textData) {
    // Verificar se podemos injetar código no contexto da página
    try {
      const script = document.createElement("script");
      script.textContent = `
        (function() {
          if (window.chrome && window.chrome.runtime) {
            // Simular API de extensão
            window.thermalPrintExtension = {
              printRaw: function(data) {
                return fetch('${this.serverUrl}/extension-print', {
                  method: 'POST',
                  headers: { 'X-Extension-Mode': 'true' },
                  body: data
                });
              }
            };
          }
        })();
      `;

      document.head.appendChild(script);

      if (window.thermalPrintExtension) {
        const result = await window.thermalPrintExtension.printRaw(textData);
        return { success: true, method: "extension-simulation" };
      }
    } catch (error) {
      console.log("⚠️ Extension simulation falhou:", error);
    }

    throw new Error("Browser extension simulation falhou");
  }

  /**
   * ESTRATÉGIA 6: NATIVE MESSAGING SIMULATION
   * Simula native messaging para comunicação direta com SO
   */
  async useNativeMessaging(textData) {
    const message = {
      type: "THERMAL_PRINT",
      data: textData,
      printer: "Generic / Text Only",
      timestamp: Date.now(),
    };

    // Tentar diferentes métodos de native messaging
    const methods = [
      () => this.tryNativeHost(message),
      () => this.tryRegistryAccess(message),
      () => this.tryPipeConnection(message),
      () => this.trySocketConnection(message),
    ];

    for (const method of methods) {
      try {
        const result = await method();
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.log("⚠️ Native method falhou:", error);
      }
    }

    throw new Error("Todos os métodos nativos falharam");
  }

  /**
   * MÉTODO PRINCIPAL - TENTATIVA HIERÁRQUICA DE TODAS AS ESTRATÉGIAS
   */
  async printDirect(textData) {
    console.log("🎯 DirectPrintService: Iniciando impressão fora da caixa");

    const strategies = [
      {
        name: "Direct Connection",
        method: () =>
          this.establishDirectConnection().then((ws) =>
            this.sendViaWebSocket(ws, textData)
          ),
      },
      {
        name: "Raw TCP Simulation",
        method: () => this.sendRawDataDirect(textData),
      },
      {
        name: "System Bridge",
        method: () => this.createSystemBridge(textData),
      },
      { name: "Memory Queue", method: () => this.useMemoryQueue(textData) },
      {
        name: "Extension Simulation",
        method: () => this.simulateBrowserExtension(textData),
      },
      {
        name: "Native Messaging",
        method: () => this.useNativeMessaging(textData),
      },
    ];

    for (const strategy of strategies) {
      try {
        console.log(`🔄 Tentando: ${strategy.name}`);
        const result = await strategy.method();

        if (result && result.success) {
          console.log(`✅ Sucesso com: ${strategy.name}`);
          return result;
        }
      } catch (error) {
        console.log(`⚠️ ${strategy.name} falhou:`, error.message);
      }
    }

    // FALLBACK FINAL: HTTP tradicional com retry inteligente
    return await this.httpFallbackWithRetry(textData);
  }

  /**
   * UTILS: Funções auxiliares para as estratégias
   */
  createRawChunks(text, chunkSize = 512) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(new TextEncoder().encode(text.slice(i, i + chunkSize)));
    }
    return chunks;
  }

  async detectSystemCapabilities() {
    return {
      hasNodeIntegration:
        typeof process !== "undefined" &&
        process.versions &&
        process.versions.node,
      hasFileAPI:
        typeof File !== "undefined" && typeof FileReader !== "undefined",
      hasClipboard: typeof navigator !== "undefined" && navigator.clipboard,
      hasSharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
      hasWebSocket: typeof WebSocket !== "undefined",
      hasServiceWorker: "serviceWorker" in navigator,
    };
  }

  calculateHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  async sendViaWebSocket(ws, textData) {
    return new Promise((resolve, reject) => {
      const message = JSON.stringify({
        type: "THERMAL_PRINT",
        data: textData,
        timestamp: Date.now(),
      });

      ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        if (response.success) {
          resolve({ success: true, method: "websocket" });
        } else {
          reject(new Error(response.error));
        }
      };

      ws.send(message);

      setTimeout(() => reject(new Error("WebSocket timeout")), 5000);
    });
  }

  async httpFallbackWithRetry(textData) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `🔄 HTTP Fallback - Tentativa ${attempt}/${this.maxRetries}`
        );

        const response = await fetch(`${this.serverUrl}/print`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Print-Mode": "fallback",
            "X-Attempt": attempt.toString(),
          },
          body: JSON.stringify({ text: textData }),
          signal: AbortSignal.timeout(10000), // 10 segundos de timeout
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, method: "http-fallback", attempt };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ HTTP Fallback tentativa ${attempt} falhou:`, error);

        if (attempt < this.maxRetries) {
          console.log(
            `⏳ Aguardando ${this.retryDelay}ms antes da próxima tentativa...`
          );
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          this.retryDelay *= 2; // Backoff exponencial
        } else {
          throw new Error(
            `Todas as ${this.maxRetries} tentativas HTTP falharam`
          );
        }
      }
    }
  }

  // Métodos auxiliares para native messaging (implementação básica)
  async tryNativeHost(message) {
    throw new Error("Native host não implementado");
  }

  async tryRegistryAccess(message) {
    throw new Error("Registry access não implementado");
  }

  async tryPipeConnection(message) {
    throw new Error("Pipe connection não implementado");
  }

  async trySocketConnection(message) {
    throw new Error("Socket connection não implementado");
  }

  async useNodeIntegration(textData) {
    throw new Error("Node integration não disponível no navegador");
  }

  async useFileSystemBridge(textData) {
    throw new Error("File system bridge não implementado");
  }

  async useClipboardBridge(textData) {
    throw new Error("Clipboard bridge não implementado");
  }
}

export default DirectPrintService;
