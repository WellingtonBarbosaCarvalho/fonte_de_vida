import { format } from "date-fns";

class WebPrinterService {
  constructor() {
    this.paperWidth = 42; // Largura do papel em caracteres (48mm térmico)
    console.log("🖨️ WebPrinterService inicializado para ambiente web");
  }

  // Método principal para processar e "imprimir" pedido no navegador
  async printOrder(order, customer, products) {
    try {
      console.log("🖨️ Processando pedido para impressão web:", order.id);

      // Gerar recibo em texto
      const receiptText = this.generateTextReceipt(order, customer, products);

      // Opções de impressão no navegador
      await this.showPrintDialog(receiptText, order);

      return { success: true, method: "web-browser" };
    } catch (error) {
      console.error("❌ Erro na impressão web:", error);
      throw error;
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
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 10px;
            line-height: 1.2;
          }
          .receipt {
            white-space: pre-line;
            max-width: 300px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 10px;">
          <button onclick="window.print()">🖨️ Imprimir</button>
          <button onclick="window.close()">❌ Fechar</button>
          <button onclick="downloadAsText()">💾 Baixar TXT</button>
        </div>
        <div class="receipt">${receiptText}</div>
        
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
          
          // Auto print em 1 segundo
          setTimeout(() => {
            window.print();
          }, 1000);
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
