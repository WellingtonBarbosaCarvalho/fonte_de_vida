import { format } from "date-fns";

class PrinterService {
  constructor() {
    // Nome da impressora - usar o EXATO que aparece no Windows
    this.printerName = "Generic / Text Only";
    this.paperWidth = 42; // Largura do papel em caracteres (48mm térmico)

    // Verificar se está no Electron de forma mais robusta
    this.isElectron =
      typeof window !== "undefined" &&
      (window.electronAPI || (window.require && window.require("electron")));

    console.log("🖨️ PrinterService inicializado:", {
      isElectron: this.isElectron,
      hasElectronAPI: !!window.electronAPI,
      printerName: this.printerName,
    });
  }

  // Comandos ESC/POS para impressoras térmicas
  ESC = {
    INIT: "\x1B\x40", // Inicializar impressora
    LF: "\x0A", // Line Feed
    CR: "\x0D", // Carriage Return
    CUT: "\x1D\x56\x42\x00", // Cortar papel

    // Alinhamento
    ALIGN_LEFT: "\x1B\x61\x00",
    ALIGN_CENTER: "\x1B\x61\x01",
    ALIGN_RIGHT: "\x1B\x61\x02",

    // Formatação de texto
    BOLD_ON: "\x1B\x45\x01",
    BOLD_OFF: "\x1B\x45\x00",
    UNDERLINE_ON: "\x1B\x2D\x01",
    UNDERLINE_OFF: "\x1B\x2D\x00",

    // Tamanho da fonte
    FONT_NORMAL: "\x1B\x21\x00",
    FONT_DOUBLE_HEIGHT: "\x1B\x21\x10",
    FONT_DOUBLE_WIDTH: "\x1B\x21\x20",
    FONT_DOUBLE: "\x1B\x21\x30",
  };

  // Gerar recibo em TEXTO SIMPLES (sem ESC/POS)
  generatePlainTextReceipt(order, customer, products) {
    console.log("📄 Gerando recibo em texto simples...");

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

    let receipt = "";

    // Cabeçalho da empresa (se habilitado)
    if (impressoraConfig.informacoes_empresa !== false) {
      receipt += "=================================\n";
      receipt += `         ${(
        empresaConfig.nome || "FONTE DE VIDA"
      ).toUpperCase()}\n`;

      if (empresaConfig.endereco) {
        receipt += `    ${empresaConfig.endereco}\n`;
      }
      if (empresaConfig.cidade) {
        receipt += `    ${empresaConfig.cidade}\n`;
      }
      if (empresaConfig.telefone) {
        receipt += `    Tel: ${empresaConfig.telefone}\n`;
      }
      if (empresaConfig.cnpj) {
        receipt += `    CNPJ: ${empresaConfig.cnpj}\n`;
      }
      receipt += "=================================\n\n";
    }

    // Informações do pedido
    receipt += `Pedido: ${order.id}\n`;
    receipt += `Data: ${new Date(
      order.created_at || order.createdAt
    ).toLocaleString("pt-BR")}\n\n`;

    // Cliente
    receipt += "---------------------------------\n";
    receipt += "CLIENTE:\n";
    receipt += `Nome: ${customer.name}\n`;
    if (customer.phone) receipt += `Telefone: ${customer.phone}\n`;
    if (customer.address) receipt += `Endereco: ${customer.address}\n`;
    receipt += "---------------------------------\n\n";

    // Itens
    receipt += "ITENS:\n";
    let total = 0;

    order.items.forEach((item) => {
      const product = products.find(
        (p) => p.id === (item.product_id || item.productId)
      );
      if (product) {
        const subtotal = item.quantity * item.price;
        total += subtotal;

        receipt += `${item.quantity}x ${product.name}\n`;
        receipt += `    R$ ${item.price.toFixed(2)} cada\n`;
        receipt += `    Subtotal: R$ ${subtotal.toFixed(2)}\n\n`;
      }
    });

    // Total
    receipt += "---------------------------------\n";
    receipt += `TOTAL: R$ ${total.toFixed(2)}\n`;
    receipt += "---------------------------------\n\n";

    // Observações
    if (order.notes) {
      receipt += "OBSERVACOES:\n";
      receipt += `${order.notes}\n\n`;
    }

    // Rodapé personalizado
    const rodape =
      impressoraConfig.rodape_nota ||
      "Obrigado pela preferência!\nFonte de Vida - Água Pura";
    const linhasRodape = rodape.split("\\n");
    linhasRodape.forEach((linha) => {
      receipt += `${linha}\n`;
    });

    // Mensagem adicional
    if (impressoraConfig.mensagem_adicional) {
      receipt += "\n";
      const linhasMensagem = impressoraConfig.mensagem_adicional.split("\\n");
      linhasMensagem.forEach((linha) => {
        receipt += `${linha}\n`;
      });
    }

    receipt += "\n";

    console.log("✅ Recibo texto gerado:", receipt.length, "caracteres");
    return receipt;
  }

  // Gerar dados RAW para impressão térmica (com comandos ESC/POS)
  generateRAWReceipt(order, customer, products) {
    console.log("🖨️ Gerando recibo RAW com comandos ESC/POS...");

    let receipt = "";

    // Inicializar impressora
    receipt += this.ESC.INIT;

    // Cabeçalho centralizado
    receipt += this.ESC.ALIGN_CENTER;
    receipt += this.ESC.FONT_DOUBLE_HEIGHT;
    receipt += this.ESC.BOLD_ON;
    receipt += "FONTE DE VIDA" + this.ESC.LF;
    receipt += this.ESC.FONT_NORMAL;
    receipt += this.ESC.BOLD_OFF;
    receipt += "Delivery de Água Mineral" + this.ESC.LF;
    receipt += this.divider() + this.ESC.LF;

    // Voltar alinhamento à esquerda
    receipt += this.ESC.ALIGN_LEFT;

    // Informações do pedido
    receipt += this.ESC.BOLD_ON;
    receipt += `Pedido: ${order.id}` + this.ESC.LF;
    receipt += this.ESC.BOLD_OFF;
    receipt +=
      `Data: ${format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}` +
      this.ESC.LF;
    receipt += this.ESC.LF;

    // Cliente
    receipt += this.divider() + this.ESC.LF;
    receipt += this.ESC.BOLD_ON + "CLIENTE:" + this.ESC.BOLD_OFF + this.ESC.LF;
    receipt += `Nome: ${customer.name}` + this.ESC.LF;
    if (customer.phone) {
      receipt += `Tel: ${customer.phone}` + this.ESC.LF;
    }
    if (customer.address) {
      receipt += `End: ${this.wrapText(customer.address)}` + this.ESC.LF;
    }
    receipt += this.divider() + this.ESC.LF + this.ESC.LF;

    // Itens
    receipt += this.ESC.BOLD_ON + "ITENS:" + this.ESC.BOLD_OFF + this.ESC.LF;
    let total = 0;

    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const subtotal = item.quantity * item.price;
        total += subtotal;

        receipt +=
          `${item.quantity}x ${this.truncateText(product.name, 25)}` +
          this.ESC.LF;
        receipt += `  R$ ${item.price.toFixed(2)} cada` + this.ESC.LF;
        receipt += `  Subtotal: R$ ${subtotal.toFixed(2)}` + this.ESC.LF;
        receipt += this.ESC.LF;
      }
    });

    // Total
    receipt += this.divider() + this.ESC.LF;
    receipt += this.ESC.ALIGN_CENTER;
    receipt += this.ESC.FONT_DOUBLE_HEIGHT;
    receipt += this.ESC.BOLD_ON;
    receipt += `TOTAL: R$ ${total.toFixed(2)}` + this.ESC.LF;
    receipt += this.ESC.FONT_NORMAL;
    receipt += this.ESC.BOLD_OFF;
    receipt += this.ESC.ALIGN_LEFT;
    receipt += this.divider() + this.ESC.LF + this.ESC.LF;

    // Observações
    if (order.notes) {
      receipt +=
        this.ESC.BOLD_ON + "OBSERVAÇÕES:" + this.ESC.BOLD_OFF + this.ESC.LF;
      receipt += this.wrapText(order.notes) + this.ESC.LF + this.ESC.LF;
    }

    // Rodapé personalizado
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

    receipt += this.ESC.ALIGN_CENTER;
    const rodape =
      impressoraConfig.rodape_nota ||
      "Obrigado pela preferência!\nFonte de Vida - Água Pura";
    const linhasRodape = rodape.split("\\n");
    linhasRodape.forEach((linha) => {
      receipt += linha + this.ESC.LF;
    });

    // Mensagem adicional
    if (impressoraConfig.mensagem_adicional) {
      receipt += this.ESC.LF;
      const linhasMensagem = impressoraConfig.mensagem_adicional.split("\\n");
      linhasMensagem.forEach((linha) => {
        receipt += linha + this.ESC.LF;
      });
    }

    receipt += this.ESC.LF + this.ESC.LF + this.ESC.LF;

    // Cortar papel
    receipt += this.ESC.CUT;

    console.log("✅ Recibo RAW gerado:", receipt.length, "caracteres");
    return receipt;
  }

  // Método principal para processar e imprimir pedido
  async printOrder(order, customer, products) {
    console.log("🖨️ Iniciando impressão...", {
      orderId: order.id,
      isElectron: this.isElectron,
      printerName: this.printerName,
    });

    try {
      // 🎯 DECIDIR FORMATO baseado na impressora
      let printData;
      const isGenericPrinter =
        this.printerName.includes("Generic") ||
        this.printerName.includes("Text Only");

      if (isGenericPrinter) {
        console.log("📄 Impressora Generic detectada → Usando TEXTO SIMPLES");
        printData = this.generatePlainTextReceipt(order, customer, products);
        console.log(
          "📄 Texto gerado, tamanho:",
          printData.length,
          "caracteres"
        );
      } else {
        console.log("🖨️ Impressora térmica detectada → Usando dados RAW");
        printData = this.generateRAWReceipt(order, customer, products);
        console.log(
          "📄 Dados RAW gerados, tamanho:",
          printData.length,
          "bytes"
        );
      }

      // 🚀 TENTAR ELECTRON
      if (this.isElectron) {
        try {
          console.log("🚀 Tentando impressão via Electron...");
          const result = await this.printElectronRAW(printData);
          console.log("✅ SUCESSO: Impressão via Electron!");
          return result;
        } catch (electronError) {
          console.warn("⚠️ Electron falhou:", electronError.message);
        }
      }

      // 💾 Fallback: arquivo
      console.log("💾 Usando fallback: arquivo");
      if (typeof printData === "string") {
        // Texto simples → arquivo .txt
        return await this.savePlainTextFile(printData, order);
      } else {
        // Dados RAW → arquivo .prn
        return await this.saveRAWFile(printData, order);
      }
    } catch (error) {
      console.error("❌ Erro geral na impressão:", error);
      throw error;
    }
  }

  // Imprimir usando API simples do Electron (texto OU RAW)
  async printElectronRAW(printData) {
    try {
      console.log("🖨️ Usando API do Electron...");

      // Verificar se API está disponível
      if (!window.electronAPI) {
        console.log("⏳ Aguardando API do Electron...");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!window.electronAPI) {
          throw new Error("API do Electron não disponível");
        }
      }

      // Preparar dados conforme tipo
      let dataToSend;
      if (typeof printData === "string") {
        console.log(
          "📄 Enviando TEXTO SIMPLES:",
          printData.length,
          "caracteres"
        );
        // Para texto simples, enviar como string
        dataToSend = printData;
      } else {
        console.log("📄 Enviando dados RAW:", printData.length, "bytes");
        // Para dados RAW, converter para array
        const uint8Array = this.stringToUint8Array(printData);
        dataToSend = Array.from(uint8Array);
      }

      // Usar API do Electron
      const result = await window.electronAPI.printRAW({
        printerName: this.printerName,
        data: dataToSend,
      });

      console.log("✅ Impressão via Electron concluída:", result);
      return { success: true, method: "electron-auto", ...result };
    } catch (error) {
      console.error("❌ Erro na impressão via Electron:", error);
      throw error;
    }
  }

  // Salvar arquivo de texto simples como fallback
  async savePlainTextFile(textData, order) {
    try {
      console.log("💾 Salvando arquivo de texto...");

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `cupom_${order.id}_${timestamp}.txt`;

      // Criar blob de texto
      const blob = new Blob([textData], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      // Criar link de download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";

      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL
      URL.revokeObjectURL(url);

      console.log("✅ Arquivo de texto salvo:", filename);

      return {
        success: true,
        method: "file-text",
        filename,
        message: `Arquivo ${filename} salvo. Abra e imprima manualmente.`,
      };
    } catch (error) {
      console.error("❌ Erro ao salvar arquivo de texto:", error);
      throw error;
    }
  }

  // Salvar arquivo RAW como fallback
  async saveRAWFile(rawData, order) {
    try {
      console.log("💾 Salvando arquivo .prn...");

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `cupom_${order.id}_${timestamp}.prn`;

      // Converter string para Uint8Array
      const uint8Array = this.stringToUint8Array(rawData);

      // Criar blob binário
      const blob = new Blob([uint8Array], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      // Criar link de download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";

      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL
      URL.revokeObjectURL(url);

      console.log("✅ Arquivo .prn salvo:", filename);

      return {
        success: true,
        method: "file-download",
        filename,
        message: `Arquivo ${filename} salvo. Copie para a impressora com: copy ${filename} "Nome da Impressora"`,
      };
    } catch (error) {
      console.error("❌ Erro ao salvar arquivo RAW:", error);
      throw error;
    }
  }

  // Verificar impressoras disponíveis (simplificado)
  async getAvailablePrinters() {
    console.log("ℹ️ Lista de impressoras (versão simplificada)");
    return [
      { name: "Generic / Text Only", port: "USB", status: "Padrão" },
      { name: "EPSON TM-T20", port: "USB", status: "Térmica" },
    ];
  }

  // Testar impressora (texto simples OU RAW conforme tipo)
  async testPrint() {
    try {
      console.log("🧪 Teste de impressão...");

      const isGenericPrinter =
        this.printerName.includes("Generic") ||
        this.printerName.includes("Text Only");

      let testData;

      if (isGenericPrinter) {
        console.log("📄 Gerando teste em TEXTO SIMPLES...");
        testData = [
          "=================================",
          "       TESTE DE IMPRESSAO",
          "        Fonte de Vida",
          "=================================",
          "",
          "Esta e uma impressao de teste.",
          "Se voce consegue ler isto,",
          "a impressora esta funcionando!",
          "",
          "Data: " + new Date().toLocaleString("pt-BR"),
          "Impressora: " + this.printerName,
          "",
          "=================================",
          "",
          "",
        ].join("\r\n");
      } else {
        console.log("🖨️ Gerando teste em dados RAW...");
        testData = this.ESC.INIT;
        testData += this.ESC.ALIGN_CENTER;
        testData += "TESTE RAW\n";
        testData += this.ESC.ALIGN_LEFT;
        testData += "Data: " + new Date().toLocaleString("pt-BR") + "\n";
        testData += this.ESC.LF + this.ESC.LF;
        testData += this.ESC.CUT;
      }

      if (this.isElectron && window.electronAPI) {
        console.log("🚀 Testando via Electron...");

        let dataToSend;
        if (typeof testData === "string" && isGenericPrinter) {
          dataToSend = testData; // Texto simples
        } else {
          const uint8Array = this.stringToUint8Array(testData);
          dataToSend = Array.from(uint8Array); // RAW
        }

        return await window.electronAPI.printRAW({
          printerName: this.printerName,
          data: dataToSend,
        });
      }

      // Fallback para arquivo
      const mockOrder = { id: "TEST" };
      if (typeof testData === "string") {
        return await this.savePlainTextFile(testData, mockOrder);
      } else {
        return await this.saveRAWFile(testData, mockOrder);
      }
    } catch (error) {
      console.error("❌ Erro no teste:", error);
      throw error;
    }
  }

  // Funções auxiliares
  stringToUint8Array(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  divider() {
    return "=".repeat(this.paperWidth);
  }

  wrapText(text, maxWidth = this.paperWidth) {
    if (!text) return "";

    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.join(this.ESC.LF);
  }

  truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  }

  // MÉTODO ESTÁTICO para uso direto (sem instanciar)
  static async printOrder(order, customer, products) {
    console.log("🖨️ Método estático chamado - criando instância...");
    const printerService = new PrinterService();
    return await printerService.printOrder(order, customer, products);
  }

  // MÉTODO ESTÁTICO para teste
  static async testPrint() {
    console.log("🧪 Teste estático chamado - criando instância...");
    const printerService = new PrinterService();
    return await printerService.testPrint();
  }
}

export default PrinterService;
