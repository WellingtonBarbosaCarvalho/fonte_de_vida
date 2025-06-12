import { format } from "date-fns";

class WebPrinterService {
  constructor() {
    this.paperWidth = 42; // Largura do papel em caracteres (48mm térmico)
    this.printServerUrl = "http://localhost:3001"; // Servidor local de impressão
    console.log("🖨️ WebPrinterService inicializado para ambiente web");
  }

  // Método principal para processar e "imprimir" pedido no navegador
  async printOrder(order, customer, products) {
    try {
      console.log("🖨️ Processando pedido para impressão web:", order.id);

      // Gerar recibo em texto
      const receiptText = this.generateTextReceipt(order, customer, products);

      // Tentar usar servidor local primeiro
      const serverResult = await this.tryPrintWithServer(receiptText);
      if (serverResult.success) {
        console.log("✅ Impressão via servidor local bem-sucedida!");
        return serverResult;
      }

      // Fallback: diálogo de impressão do navegador
      console.log("📋 Usando fallback: diálogo de impressão do navegador");
      await this.showPrintDialog(receiptText, order);

      return { success: true, method: "web-browser" };
    } catch (error) {
      console.error("❌ Erro na impressão web:", error);
      throw error;
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
}

export default WebPrinterService;
