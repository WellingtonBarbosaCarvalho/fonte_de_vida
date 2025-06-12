import { format } from "date-fns";

class WebPrinterService {
  constructor() {
    this.paperWidth = 42; // Largura do papel em caracteres (48mm térmico)
    this.printServerUrl = "http://localhost:3001"; // Servidor local de impr  // Mostrar diálogo de impressão no navegador
  async showPrintDialog(receiptText, order) {
    // Criar uma nova janela/aba para impressão
    const printWindow = window.open("", "_blank", "width=420,height=650");

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cupom Pedido ${order.id}</title>
        <meta charset="UTF-8">
        <style>
          /* Estilos para tela */
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 15px;
            line-height: 1.3;
            background: #f0f0f0;
          }
          
          .container {
            max-width: 350px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .controls {
            text-align: center;
            margin-bottom: 20px;
            padding: 15px;
            background: #e8f4fd;
            border-radius: 6px;
          }
          
          .controls button {
            margin: 8px 5px;
            padding: 12px 20px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.2s;
          }
          
          .btn-print {
            background: #10b981;
            color: white;
          }
          
          .btn-print:hover {
            background: #059669;
            transform: translateY(-1px);
          }
          
          .btn-download {
            background: #3b82f6;
            color: white;
          }
          
          .btn-download:hover {
            background: #2563eb;
          }
          
          .btn-close {
            background: #ef4444;
            color: white;
          }
          
          .btn-close:hover {
            background: #dc2626;
          }
          
          .instructions {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            font-size: 13px;
          }
          
          .receipt-preview {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            background: white;
            border: 2px dashed #ccc;
            padding: 15px;
            white-space: pre-line;
            margin: 15px 0;
          }

          /* CSS ESPECÍFICO PARA IMPRESSÃO TÉRMICA */
          @media print {
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            
            html, body {
              font-family: 'Courier New', monospace !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .receipt-print {
              font-family: 'Courier New', monospace !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
              white-space: pre-line !important;
              word-wrap: break-word !important;
              color: black !important;
              background: white !important;
              width: 100% !important;
              max-width: none !important;
            }
            
            @page {
              size: 80mm auto !important;
              margin: 0mm !important;
              padding: 0mm !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Controles (não imprimem) -->
          <div class="no-print controls">
            <h3 style="margin: 0 0 15px 0; color: #1f2937;">🖨️ Imprimir Cupom</h3>
            <button class="btn-print" onclick="imprimirAgora()">
              🖨️ IMPRIMIR AGORA
            </button>
            <br>
            <button class="btn-download" onclick="baixarTXT()">
              💾 Baixar TXT
            </button>
            <button class="btn-close" onclick="window.close()">
              ❌ Fechar
            </button>
          </div>
          
          <!-- Instruções simples -->
          <div class="no-print instructions">
            <strong>📋 INSTRUÇÕES SIMPLES:</strong><br>
            1️⃣ Clique em "<strong>IMPRIMIR AGORA</strong>"<br>
            2️⃣ Na janela que abrir, selecione sua impressora térmica<br>
            3️⃣ Configure: <strong>Papel = A4</strong> e <strong>Margens = Estreitas</strong><br>
            4️⃣ Clique em <strong>Imprimir</strong><br><br>
            💡 <strong>Dica:</strong> Se não sair direito, use "Baixar TXT" e imprima o arquivo manualmente
          </div>
          
          <!-- Preview do cupom -->
          <div class="no-print">
            <h4 style="margin: 15px 0 10px 0; color: #374151;">📄 Preview do Cupom:</h4>
            <div class="receipt-preview">${receiptText}</div>
          </div>
          
          <!-- Conteúdo real para impressão (invisível na tela) -->
          <div class="receipt-print" style="display: none;">${receiptText}</div>
        </div>
        
        <script>
          function imprimirAgora() {
            // Mostrar apenas o conteúdo de impressão
            document.querySelector('.receipt-print').style.display = 'block';
            document.querySelector('.container').style.display = 'none';
            
            // Imprimir
            window.print();
            
            // Aguardar e restaurar visualização
            setTimeout(() => {
              document.querySelector('.receipt-print').style.display = 'none';
              document.querySelector('.container').style.display = 'block';
            }, 1000);
          }
          
          function baixarTXT() {
            const element = document.createElement('a');
            const texto = \`${receiptText.replace(/'/g, "\\\'")}\`;
            const file = new Blob([texto], {type: 'text/plain; charset=utf-8'});
            element.href = URL.createObjectURL(file);
            element.download = 'cupom_pedido_${order.id}.txt';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            
            alert('✅ Arquivo baixado! Abra o arquivo e imprima manualmente na sua impressora.');
          }
          
          // Focar na janela
          window.focus();
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }dows = navigator.platform.indexOf("Win") > -1;
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
  }

  // Método principal para processar e "imprimir" pedido no navegador
  async printOrder(order, customer, products) {
    try {
      console.log("🖨️ Processando pedido para impressão web:", order.id);

      // Gerar recibo em texto
      const receiptText = this.generateTextReceipt(order, customer, products);

      // 1. Verificar se tem API do Electron disponível (versão desktop)
      if (window.electronAPI) {
        console.log("🖥️ Modo Desktop detectado - usando impressão direta");
        try {
          const result = await window.electronAPI.printReceipt(receiptText);
          if (result.success) {
            this.showSuccessNotification('Impresso diretamente na impressora!');
            return { success: true, method: "electron-direct" };
          }
        } catch (electronError) {
          console.warn("⚠️ Erro no Electron:", electronError);
        }
      }

      // 2. Tentar usar servidor local de impressão
      try {
        const serverResult = await this.tryPrintWithServer(receiptText);
        if (serverResult.success) {
          return serverResult;
        }
      } catch (serverError) {
        console.warn("⚠️ Servidor local não disponível:", serverError.message);
      }

      // 3. Tentar impressão via Service Worker (PWA)
      if ('serviceWorker' in navigator) {
        try {
          console.log("📱 Tentando impressão via Service Worker...");
          const swResult = await this.sendPrintToServiceWorker(receiptText, order);
          if (swResult.success) {
            this.showSuccessNotification('✅ Impressão PWA executada!');
            return swResult;
          }
        } catch (swError) {
          console.warn("⚠️ Service Worker não disponível:", swError.message);
        }
      }

      // 4. Detectar se é impressora térmica e usar impressão automática
      if (await this.detectThermalPrinter()) {
        console.log("🔥 Impressora térmica detectada - impressão automática");
        return await this.printThermalAutomatic(receiptText, order);
      }

      // 5. Fallback: diálogo de impressão otimizado
      console.log("📋 Usando diálogo de impressão otimizado");
      await this.showPrintDialog(receiptText, order);

      return { success: true, method: "web-browser-optimized" };
    } catch (error) {
      console.error("❌ Erro na impressão web:", error);
      throw error;
    }
  }

  // Método para enviar impressão via Service Worker
  async sendPrintToServiceWorker(receiptText, order) {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Criar uma requisição de impressão fake para ser interceptada
        const printData = {
          text: receiptText,
          order: order,
          timestamp: new Date().toISOString()
        };

        // Enviar via fetch para ser interceptada pelo SW
        const response = await fetch('/api/thermal-print', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(printData)
        });

        const result = await response.json();
        console.log('📤 Resposta do Service Worker:', result);

        return result;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar para Service Worker:', error);
      throw error;
    }
  }
          if (result.success) {
            this.showSuccessNotification('Impresso diretamente na impressora!');
            return { success: true, method: "electron-direct" };
          }
        } catch (electronError) {
          console.warn("⚠️ Erro no Electron:", electronError);
        }
      }

      // 2. Detectar se é impressora térmica e usar impressão automática
      if (await this.detectThermalPrinter()) {
        console.log("🔥 Impressora térmica detectada - impressão automática");
        return await this.printThermalAutomatic(receiptText, order);
      }

      // 3. Fallback: diálogo de impressão otimizado
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
      const userAgent = navigator.userAgent.toLowerCase();
      const isKiosk = window.navigator.standalone || 
                     window.matchMedia('(display-mode: standalone)').matches ||
                     document.referrer.includes('android-app://') ||
                     window.top !== window.self;

      // Verificar configurações salvas
      const settings = JSON.parse(localStorage.getItem('fontevida_settings') || '{}');
      const printerConfig = settings.impressora || {};
      
      return printerConfig.modo_termica === true || 
             printerConfig.impressora_modelo?.includes('Generic') ||
             printerConfig.impressora_modelo?.includes('Thermal') ||
             isKiosk;
    } catch (error) {
      return false;
    }
  }

  // Impressão automática para térmicas
  async printThermalAutomatic(receiptText, order) {
    try {
      console.log("🔥 Iniciando impressão térmica automática...");
      
      // Criar iframe invisível para impressão
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '80mm';
      printFrame.style.height = 'auto';
      
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
                  parent.document.body.removeChild(parent.document.querySelector('iframe[style*="-9999px"]'));
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
      this.showSuccessNotification('Cupom enviado para impressão térmica!');
      
      return {
        success: true,
        method: 'thermal-automatic',
        message: 'Impressão térmica automática executada'
      };

    } catch (error) {
      console.error("❌ Erro na impressão automática:", error);
      
      // Fallback para diálogo manual
      await this.showPrintDialog(receiptText, order);
      return {
        success: true,
        method: 'thermal-automatic-fallback'
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
        this.showSuccessNotification("Impresso via servidor local (RAW)");

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
      `Data: ${format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}`
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
      const product = products.find((p) => p.id === item.product_id);
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
          /* Estilos para visualização na tela */
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

          /* CSS para impressão térmica */
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
          
          // Função para imprimir com configurações específicas
          function printThermal() {
            window.print();
          }
          
          // Focar na janela
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
