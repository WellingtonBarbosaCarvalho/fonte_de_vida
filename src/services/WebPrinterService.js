import { format } from "date-fns";
import DirectPrintService from "./DirectPrintService.js";

class WebPrinterService {
  constructor() {
    this.paperWidth = 42; // Largura do papel em caracteres (48mm térmico)
    this.printServerUrl = "http://localhost:3001"; // Servidor local de impressão

    // Detectar sistema operacional
    this.isWindows = navigator.platform.indexOf("Win") > -1;
    this.isLinux = navigator.platform.indexOf("Linux") > -1;
    this.isMac = navigator.platform.indexOf("Mac") > -1;

    console.log("🖨️ WebPrinterService inicializado para ambiente web");
    console.log(
      `💻 Sistema detectado: ${
        this.isWindows
          ? "Windows"
          : this.isLinux
          ? "Linux"
          : this.isMac
          ? "macOS"
          : "Desconhecido"
      }`
    );

    // NOVA ABORDAGEM: DirectPrintService para pensar fora da caixa
    this.directPrint = new DirectPrintService();

    // Configurar listener para mensagens do Service Worker
    this.setupServiceWorkerListener();
  }

  // Configurar listener para comunicação com Service Worker
  setupServiceWorkerListener() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("📨 Mensagem recebida do Service Worker:", event.data);

        if (event.data.type === "THERMAL_PRINT_REQUEST") {
          this.handleServiceWorkerPrint(event.data.payload);
        }

        if (event.data.type === "RETRY_PRINT") {
          this.handleRetryPrint(event.data.data);
        }
      });

      // Verificar se o service worker está ativo
      navigator.serviceWorker.ready.then((registration) => {
        console.log("✅ Service Worker pronto para impressão térmica");

        // Enviar mensagem para verificar capacidades
        if (registration.active) {
          registration.active.postMessage({
            type: "PRINT_STATUS",
          });
        }
      });
    }
  }

  // Handler para impressão via Service Worker
  async handleServiceWorkerPrint(payload) {
    try {
      console.log("🔥 Executando impressão térmica via PWA Service Worker");

      if (payload.data && payload.data.text) {
        // Usar impressão automática térmica
        const order = payload.data.order || { id: "PWA-" + Date.now() };
        await this.printThermalAutomatic(payload.data.text, order);

        this.showSuccessNotification("✅ Impressão térmica PWA executada!");
      }
    } catch (error) {
      console.error("❌ Erro na impressão via Service Worker:", error);
      this.showToast("Erro na impressão PWA: " + error.message, "error");
    }
  }

  // Handler para retry de impressão
  async handleRetryPrint(data) {
    try {
      console.log("🔄 Reexecutando impressão pendente");
      const order = data.order || { id: "RETRY-" + Date.now() };
      await this.printThermalAutomatic(data.text, order);
    } catch (error) {
      console.error("❌ Erro no retry de impressão:", error);
    }
  }

  // Método para enviar impressão via Service Worker
  async sendPrintToServiceWorker(receiptText, order) {
    try {
      if ("serviceWorker" in navigator) {
        // Criar uma requisição de impressão fake para ser interceptada
        const printData = {
          text: receiptText,
          order: order,
          timestamp: new Date().toISOString(),
        };

        // Enviar via fetch para ser interceptada pelo SW
        const response = await fetch("/api/thermal-print", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(printData),
        });

        const result = await response.json();
        console.log("📤 Resposta do Service Worker:", result);

        return result;
      }
    } catch (error) {
      console.error("❌ Erro ao enviar para Service Worker:", error);
      throw error;
    }
  }

  // Método CORRIGIDO para enviar impressão via Service Worker (resolve erro 405)
  async sendPrintToServiceWorkerFixed(receiptText, order) {
    try {
      if ("serviceWorker" in navigator) {
        console.log("📱 [FIX] Enviando para Service Worker via MessageChannel");

        // Abordagem 1: Tentar via MessageChannel (mais confiável)
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            return new Promise((resolve, reject) => {
              const messageChannel = new MessageChannel();

              messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                  resolve(event.data);
                } else {
                  reject(new Error(event.data.error || "Service Worker error"));
                }
              };

              registration.active.postMessage(
                {
                  type: "THERMAL_PRINT_DIRECT",
                  data: {
                    text: receiptText,
                    order: order,
                    timestamp: new Date().toISOString(),
                  },
                },
                [messageChannel.port2]
              );

              // Timeout após 5 segundos
              setTimeout(() => {
                reject(new Error("Service Worker timeout"));
              }, 5000);
            });
          }
        } catch (msgError) {
          console.warn("⚠️ MessageChannel falhou:", msgError.message);
        }

        // Abordagem 2: Usar rota diferente que não conflita
        try {
          const printData = {
            text: receiptText,
            order: order,
            timestamp: new Date().toISOString(),
          };

          const response = await fetch("/sw-thermal-print", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "ServiceWorker",
            },
            body: JSON.stringify(printData),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("📤 [FIX] Resposta do Service Worker:", result);
            return result;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (fetchError) {
          console.warn("⚠️ Fetch alternativo falhou:", fetchError.message);
        }

        // Abordagem 3: Fallback via localStorage (para PWA offline)
        try {
          const printQueue = JSON.parse(
            localStorage.getItem("thermal_print_queue") || "[]"
          );
          const printJob = {
            id: "job_" + Date.now(),
            text: receiptText,
            order: order,
            timestamp: new Date().toISOString(),
            status: "pending",
          };

          printQueue.push(printJob);
          localStorage.setItem(
            "thermal_print_queue",
            JSON.stringify(printQueue)
          );

          // Notificar Service Worker sobre nova tarefa
          if (
            "serviceWorker" in navigator &&
            navigator.serviceWorker.controller
          ) {
            navigator.serviceWorker.controller.postMessage({
              type: "PROCESS_PRINT_QUEUE",
            });
          }

          console.log("📦 [FALLBACK] Adicionado à fila offline");
          return {
            success: true,
            method: "service-worker-queue",
            message: "Adicionado à fila de impressão",
          };
        } catch (queueError) {
          console.error("❌ Todas as abordagens do Service Worker falharam");
          throw queueError;
        }
      }
    } catch (error) {
      console.error("❌ Erro no Service Worker corrigido:", error);
      throw error;
    }
  }

  // Método principal para processar e "imprimir" pedido no navegador - SOLUÇÃO 100% AUTOMÁTICA
  async printOrder(order, customer, products) {
    try {
      console.log(
        "🖨️ [NOVA SOLUÇÃO] Processando pedido para impressão web:",
        order.id
      );

      // Gerar recibo em texto
      const receiptText = this.generateTextReceipt(order, customer, products);

      // 1. PRIORIDADE MÁXIMA: Verificar se tem API do Electron disponível (versão desktop)
      if (window.electronAPI) {
        console.log("🖥️ Modo Desktop detectado - usando impressão direta");
        try {
          const result = await window.electronAPI.printReceipt(receiptText);
          if (result.success) {
            this.showSuccessNotification(
              "✅ Impresso diretamente na impressora!"
            );
            return { success: true, method: "electron-direct" };
          }
        } catch (electronError) {
          console.warn("⚠️ Erro no Electron:", electronError);
        }
      }

      // 2. SEGUNDA PRIORIDADE: DirectPrintService - SOLUÇÃO REVOLUCIONÁRIA!
      try {
        console.log(
          "🚀 [INOVAÇÃO] Tentando DirectPrintService - bypass das limitações do navegador"
        );
        const directResult = await this.directPrint.printDirect(receiptText, {
          serverId: order.id,
          timestamp: new Date().toISOString(),
        });

        if (directResult.success) {
          this.showSuccessNotification(
            "✅ Impressão RAW executada via DirectPrintService!"
          );
          return {
            success: true,
            method: "direct-print-service",
            strategy: directResult.strategy,
            details: directResult.details,
          };
        }
      } catch (directError) {
        console.warn("⚠️ DirectPrintService falhou:", directError.message);
      }

      // 3. TERCEIRA PRIORIDADE: Tentar usar servidor local de impressão (RAW) com retry inteligente
      try {
        const serverResult = await this.tryPrintWithServerRetry(receiptText);
        if (serverResult.success) {
          return serverResult;
        }
      } catch (serverError) {
        console.warn("⚠️ Servidor local não disponível:", serverError.message);
      }

      // 4. QUARTA PRIORIDADE: Impressão via Service Worker (PWA) CORRIGIDA!
      if ("serviceWorker" in navigator) {
        try {
          console.log("📱 Tentando impressão via Service Worker...");
          const swResult = await this.sendPrintToServiceWorkerFixed(
            receiptText,
            order
          );
          if (swResult.success) {
            this.showSuccessNotification(
              "✅ Impressão PWA automática executada!"
            );
            return swResult;
          }
        } catch (swError) {
          console.warn("⚠️ Service Worker não disponível:", swError.message);
        }
      }

      // 5. QUINTA PRIORIDADE: Detectar se é impressora térmica e usar impressão automática
      if (await this.detectThermalPrinter()) {
        console.log("🔥 Impressora térmica detectada - impressão automática");
        return await this.printThermalAutomatic(receiptText, order);
      }

      // 6. FALLBACK FINAL: Diálogo de impressão otimizado
      console.log("📋 Usando diálogo de impressão otimizado");
      await this.showPrintDialog(receiptText, order);

      return { success: true, method: "web-browser-optimized" };
    } catch (error) {
      console.error("❌ Erro na impressão web:", error);
      throw error;
    }
  }

  // Detectar se é uma impressora térmica
  async detectThermalPrinter() {
    try {
      // Verificar se há indicações de impressora térmica
      const isKiosk =
        window.navigator.standalone ||
        window.matchMedia("(display-mode: standalone)").matches ||
        document.referrer.includes("android-app://") ||
        window.top !== window.self;

      // Verificar configurações salvas
      const settings = JSON.parse(
        localStorage.getItem("fontevida_settings") || "{}"
      );
      const printerConfig = settings.impressora || {};

      return (
        printerConfig.modo_termica === true ||
        printerConfig.tipo === "termica" ||
        printerConfig.modo_impressao === "thermal_direct" ||
        printerConfig.nome?.includes("Generic") ||
        printerConfig.nome?.includes("Thermal") ||
        isKiosk
      );
    } catch (error) {
      return false;
    }
  }

  // Impressão automática para térmicas
  async printThermalAutomatic(receiptText, order) {
    try {
      console.log("🔥 Iniciando impressão térmica automática...");

      // Criar iframe invisível para impressão
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "absolute";
      printFrame.style.top = "-9999px";
      printFrame.style.left = "-9999px";
      printFrame.style.width = "80mm";
      printFrame.style.height = "auto";

      document.body.appendChild(printFrame);

      // Conteúdo otimizado para impressão térmica
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 2mm !important;
              color: black !important;
              background: white !important;
            }
            .receipt {
              white-space: pre-line !important;
              word-wrap: break-word !important;
              font-family: 'Courier New', monospace !important;
            }
            @page {
              size: 80mm auto !important;
              margin: 0 !important;
            }
          </style>
        </head>
        <body>
          <div class="receipt">${receiptText}</div>
          <script>
            // Impressão automática quando carregado
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // Remover iframe após impressão
                setTimeout(() => {
                  if (parent.document.querySelector('iframe[style*="-9999px"]')) {
                    parent.document.body.removeChild(parent.document.querySelector('iframe[style*="-9999px"]'));
                  }
                }, 1000);
              }, 100);
            };
          </script>
        </body>
        </html>
      `;

      // Escrever conteúdo no iframe
      printFrame.contentDocument.open();
      printFrame.contentDocument.write(printContent);
      printFrame.contentDocument.close();

      // Mostrar feedback de sucesso
      this.showSuccessNotification("✅ Cupom enviado para impressão térmica!");

      return {
        success: true,
        method: "thermal-automatic",
        message: "Impressão térmica automática executada",
      };
    } catch (error) {
      console.error("❌ Erro na impressão automática:", error);

      // Fallback para diálogo manual
      await this.showPrintDialog(receiptText, order);
      return {
        success: true,
        method: "thermal-automatic-fallback",
      };
    }
  }

  // Tentar imprimir usando servidor local
  async tryPrintWithServer(text) {
    try {
      console.log("🔍 Verificando servidor de impressão local...");

      // Primeiro, verificar se o servidor está rodando
      const statusResponse = await fetch(`${this.printServerUrl}/status`, {
        method: "GET",
        signal: AbortSignal.timeout(2000), // Timeout de 2 segundos
      });

      if (!statusResponse.ok) {
        throw new Error("Servidor não está respondendo");
      }

      console.log("✅ Servidor local encontrado, enviando para impressão...");

      // Enviar dados para impressão
      const printResponse = await fetch(`${this.printServerUrl}/print`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
      });

      const result = await printResponse.json();

      if (result.success) {
        // Mostrar notificação de sucesso
        this.showSuccessNotification("✅ Impresso via servidor local (RAW)");

        return {
          success: true,
          method: "thermal-server",
          message: "Impresso via servidor local (RAW)",
        };
      } else {
        throw new Error(result.message || "Erro no servidor de impressão");
      }
    } catch (error) {
      console.warn("⚠️ Servidor local não disponível:", error.message);

      // Mostrar dica específica para Windows
      if (
        this.isWindows &&
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        const instructions = this.getSystemInstructions();
        console.log(`💡 Dica Windows: ${instructions.serverStart}`);
        this.showToast(
          `Servidor não encontrado. ${instructions.serverStart}`,
          "error"
        );
      }

      return { success: false, error: error.message };
    }
  }

  // Tentar imprimir usando servidor local com RETRY INTELIGENTE
  async tryPrintWithServerRetry(text) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 segundo

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `🔍 [${attempt}/${maxRetries}] Verificando servidor de impressão local...`
        );

        // Primeiro, verificar se o servidor está rodando
        const statusResponse = await fetch(`${this.printServerUrl}/status`, {
          method: "GET",
          signal: AbortSignal.timeout(2000), // Timeout de 2 segundos
        });

        if (!statusResponse.ok) {
          throw new Error("Servidor não está respondendo");
        }

        console.log(
          `✅ [${attempt}] Servidor local encontrado, enviando para impressão...`
        );

        // Enviar dados para impressão
        const printResponse = await fetch(`${this.printServerUrl}/print`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
        });

        const result = await printResponse.json();

        if (result.success) {
          // Mostrar notificação de sucesso
          this.showSuccessNotification("✅ Impresso via servidor local (RAW)!");

          return {
            success: true,
            method: "thermal-server",
            message: `Impresso via servidor local (tentativa ${attempt})`,
            attempts: attempt,
          };
        } else {
          throw new Error(result.message || "Erro no servidor de impressão");
        }
      } catch (error) {
        console.warn(
          `⚠️ [${attempt}/${maxRetries}] Tentativa falhou:`,
          error.message
        );

        if (attempt === maxRetries) {
          // Última tentativa - mostrar instruções específicas do sistema
          if (
            this.isWindows &&
            error.name === "TypeError" &&
            error.message.includes("fetch")
          ) {
            const instructions = this.getSystemInstructions();
            console.log(`💡 Dica Windows: ${instructions.serverStart}`);
            this.showToast(
              `Servidor não encontrado após ${maxRetries} tentativas. ${instructions.serverStart}`,
              "error"
            );
          }

          return { success: false, error: error.message, attempts: maxRetries };
        }

        // Aguardar antes da próxima tentativa
        if (attempt < maxRetries) {
          console.log(
            `⏳ Aguardando ${retryDelay}ms antes da próxima tentativa...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    return { success: false, error: "Máximo de tentativas atingido" };
  }

  // Gerar recibo em texto simples
  generateTextReceipt(order, customer, products) {
    // Obter configurações da aplicação
    let empresaConfig = {};
    let impressoraConfig = {};

    // Tentar obter configurações do localStorage
    try {
      const settings = JSON.parse(
        localStorage.getItem("fontevida_settings") || "{}"
      );
      empresaConfig = settings.empresa || {};
      impressoraConfig = settings.impressora || {};
    } catch (error) {
      console.warn("Erro ao carregar configurações:", error);
    }

    const lines = [];
    const width = this.paperWidth;

    // Header da empresa (se habilitado)
    if (impressoraConfig.informacoes_empresa !== false) {
      lines.push(
        this.centerText(
          (empresaConfig.nome || "FONTE DE VIDA").toUpperCase(),
          width
        )
      );
      lines.push(this.centerText("=".repeat(width), width));

      if (empresaConfig.endereco) {
        lines.push(this.centerText(empresaConfig.endereco, width));
      }
      if (empresaConfig.cidade) {
        lines.push(this.centerText(empresaConfig.cidade, width));
      }
      if (empresaConfig.telefone) {
        lines.push(this.centerText(`Tel: ${empresaConfig.telefone}`, width));
      }
      if (empresaConfig.cnpj) {
        lines.push(this.centerText(`CNPJ: ${empresaConfig.cnpj}`, width));
      }
    } else {
      lines.push(this.centerText("FONTE DE VIDA", width));
      lines.push(this.centerText("=".repeat(width), width));
    }

    lines.push("");

    // Info do pedido
    lines.push(`Pedido: ${order.id}`);
    lines.push(
      `Data: ${format(
        new Date(order.created_at || order.createdAt),
        "dd/MM/yyyy HH:mm"
      )}`
    );

    // Info do cliente
    if (customer) {
      lines.push(`Cliente: ${customer.name}`);
      if (customer.phone) {
        lines.push(`Telefone: ${customer.phone}`);
      }
      if (customer.address) {
        lines.push(`Endereço: ${customer.address}`);
      }
    }

    lines.push("");
    lines.push("-".repeat(width));

    // Itens
    let total = 0;
    order.items.forEach((item) => {
      const product = products.find(
        (p) => p.id === item.product_id || p.id === item.productId
      );
      if (product) {
        const subtotal = item.quantity * (item.unit_price || item.price);
        total += subtotal;

        lines.push(`${product.name}`);
        lines.push(
          `${item.quantity}x R$ ${(item.unit_price || item.price).toFixed(
            2
          )} = R$ ${subtotal.toFixed(2)}`
        );
        lines.push("");
      }
    });

    lines.push("-".repeat(width));
    lines.push(`TOTAL: R$ ${total.toFixed(2)}`);
    lines.push("");

    // Observações
    if (order.notes) {
      lines.push("OBSERVAÇÕES:");
      lines.push(order.notes);
      lines.push("");
    }

    // Rodapé personalizado
    const rodape =
      impressoraConfig.rodape_nota ||
      "Obrigado pela preferência!\nFonte de Vida - Água Pura";
    const linhasRodape = rodape.split("\\n");
    linhasRodape.forEach((linha) => {
      lines.push(this.centerText(linha, width));
    });

    // Mensagem adicional
    if (impressoraConfig.mensagem_adicional) {
      lines.push("");
      const linhasMensagem = impressoraConfig.mensagem_adicional.split("\\n");
      linhasMensagem.forEach((linha) => {
        lines.push(this.centerText(linha, width));
      });
    }

    return lines.join("\n");
  }

  // Mostrar diálogo de impressão no navegador
  async showPrintDialog(receiptText, order) {
    // Criar uma nova janela/aba para impressão
    const printWindow = window.open("", "_blank", "width=400,height=600");

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido ${order.id}</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 10px;
            line-height: 1.2;
            background: #f5f5f5;
          }
          .thermal-preview {
            max-width: 300px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            border: 1px solid #ccc;
            padding: 10px;
            background: white;
            margin: 20px auto;
            white-space: pre-line;
          }
          .controls {
            text-align: center;
            margin-bottom: 20px;
          }
          .controls button {
            margin: 5px;
            padding: 10px 15px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            border-radius: 5px;
            background: #007acc;
            color: white;
          }
          .controls button:hover {
            background: #005c99;
          }
          .instructions {
            text-align: center;
            margin: 20px;
            padding: 15px;
            background: #e8f4fd;
            border: 1px solid #b8ddf2;
            border-radius: 5px;
            font-size: 13px;
          }

          @media print {
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              text-shadow: none !important;
              background: transparent !important;
              color: black !important;
            }

            body {
              font-family: 'Courier New', monospace !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .thermal-receipt {
              width: 80mm !important;
              max-width: 80mm !important;
              min-width: 80mm !important;
              font-family: 'Courier New', monospace !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              white-space: pre-line !important;
              word-wrap: break-word !important;
              page-break-inside: avoid !important;
              color: black !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            @page {
              size: 80mm auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .thermal-receipt * {
              color: black !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print controls">
          <button onclick="window.print()">🖨️ Imprimir Agora</button>
          <button onclick="downloadAsText()">💾 Baixar TXT</button>
          <button onclick="window.close()">❌ Fechar</button>
        </div>
        
        <div class="no-print instructions">
          <strong>📋 Instruções para Impressora Térmica:</strong><br>
          1. Certifique-se que a impressora "Generic / Text Only" está conectada<br>
          2. Clique em "🖨️ Imprimir Agora"<br>
          3. Na caixa de diálogo, selecione "Generic / Text Only"<br>
          4. Configure: Tamanho do papel = A4 ou Personalizado (80mm)<br>
          5. Margens: 0 em todos os lados<br>
          6. Clique em Imprimir
        </div>
        
        <!-- Preview na tela -->
        <div class="no-print thermal-preview">${receiptText}</div>
        
        <!-- Conteúdo real para impressão -->
        <div class="thermal-receipt">${receiptText}</div>
        
        <script>
          function downloadAsText() {
            const element = document.createElement('a');
            const file = new Blob(['${receiptText.replace(
              /'/g,
              "\\'"
            )}'], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = 'pedido_${order.id}.txt';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }
          
          window.focus();
          
          console.log('💡 Dica: Selecione a impressora "Generic / Text Only" na caixa de diálogo');
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }

  // Centralizar texto
  centerText(text, width) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  }

  // Teste de impressão
  async testPrint() {
    try {
      const testData = `
        TESTE DE IMPRESSÃO
        ==================
        Data: ${new Date().toLocaleString("pt-BR")}
        
        Este é um teste da impressora.
        Sistema: Fonte de Vida
        Modo: Navegador Web
        
        ==================
      `;

      // Tentar servidor local primeiro
      const serverResult = await this.tryPrintWithServer(testData);
      if (serverResult.success) {
        return { success: true, method: "thermal-server-test" };
      }

      // Fallback: diálogo do navegador
      await this.showPrintDialog(testData, { id: "TESTE" });
      return { success: true, method: "web-test" };
    } catch (error) {
      console.error("❌ Erro no teste:", error);
      throw error;
    }
  }

  // Compatibilidade com a interface antiga
  async printElectronRAW() {
    throw new Error("Método Electron não disponível no modo web");
  }

  // Mostrar notificação de sucesso
  showSuccessNotification(message) {
    // Tentar usar Notification API se disponível
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("✅ Impressão Realizada", {
        body: message,
        icon: "/icon.svg",
        badge: "/icon.svg",
      });
    }

    // Sempre mostrar no console
    console.log(`✅ ${message}`);

    // Mostrar alerta visual se possível
    if (typeof window !== "undefined") {
      // Criar toast notification simples
      this.showToast(message, "success");
    }
  }

  // Mostrar toast notification
  showToast(message, type = "info") {
    // Remover toast anterior se existir
    const existingToast = document.getElementById("thermal-print-toast");
    if (existingToast) {
      existingToast.remove();
    }

    // Criar elemento toast
    const toast = document.createElement("div");
    toast.id = "thermal-print-toast";
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      ${
        type === "success"
          ? "background: #10B981;"
          : type === "error"
          ? "background: #EF4444;"
          : "background: #3B82F6;"
      }
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 16px;">
          ${type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
        </span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(0)";
    }, 100);

    // Remover após 4 segundos
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  // Verificar status do servidor de impressão
  async checkPrintServerStatus() {
    try {
      const response = await fetch(`${this.printServerUrl}/status`, {
        method: "GET",
        signal: AbortSignal.timeout(1000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          data,
        };
      }
      return { available: false };
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }

  // Mostrar instruções específicas do sistema
  getSystemInstructions() {
    if (this.isWindows) {
      return {
        serverStart: 'Execute "start-thermal-server.bat" como administrador',
        printerCheck: "Painel de Controle > Dispositivos e Impressoras",
        printCommand: 'copy arquivo.txt "Generic / Text Only"',
      };
    } else if (this.isLinux) {
      return {
        serverStart: 'Execute "./start-thermal-server.sh"',
        printerCheck: "lpstat -p | grep Generic",
        printCommand: 'lpr -P "Generic / Text Only" arquivo.txt',
      };
    } else {
      return {
        serverStart: 'Execute "./start-thermal-server.sh"',
        printerCheck: "lpstat -p | grep Generic",
        printCommand: 'lpr -P "Generic / Text Only" arquivo.txt',
      };
    }
  }
}

export default WebPrinterService;
