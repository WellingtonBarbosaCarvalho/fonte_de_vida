import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

class PDFReportService {
  static generateFechamentoCaixaReport(dadosDia) {
    const pdf = new jsPDF();
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString("pt-BR");
    const horaFormatada = dataAtual.toLocaleTimeString("pt-BR");

    // Configurar fonte
    pdf.setFont("helvetica");

    // Cabeçalho
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("FECHAMENTO DE CAIXA", 105, 20, { align: "center" });

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Data: ${dataFormatada}`, 20, 35);
    pdf.text(`Hora do Fechamento: ${horaFormatada}`, 20, 45);

    // Linha separadora
    pdf.setLineWidth(0.5);
    pdf.line(20, 55, 190, 55);

    // Resumo Geral
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("RESUMO DO DIA", 20, 70);

    const resumoData = [
      [
        "Total de Vendas",
        `R$ ${dadosDia.vendasDia.toFixed(2).replace(".", ",")}`,
      ],
      ["Quantidade de Pedidos", dadosDia.pedidosDia.toString()],
      ["Clientes Atendidos", dadosDia.clientesAtivos.toString()],
      ["Produtos Vendidos", dadosDia.produtosVendidos.toString()],
    ];

    // Usar autoTable corretamente
    autoTable(pdf, {
      startY: 75,
      head: [["Descrição", "Valor"]],
      body: resumoData,
      theme: "grid",
      headStyles: { fillColor: [70, 130, 180] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 50, halign: "right" },
      },
    });

    // Obter a posição Y final da tabela anterior
    let currentY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 20 : 120;

    // Detalhes dos Pedidos
    if (dadosDia.pedidosDetalhados && dadosDia.pedidosDetalhados.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("PEDIDOS DO DIA", 20, currentY);

      const pedidosData = dadosDia.pedidosDetalhados.map((pedido) => [
        pedido.id.toString(),
        pedido.cliente || "Cliente Avulso",
        pedido.endereco || "Endereço não informado",
        new Date(pedido.data).toLocaleTimeString("pt-BR"),
        `R$ ${pedido.total.toFixed(2).replace(".", ",")}`,
        pedido.status || "Concluído",
      ]);

      autoTable(pdf, {
        startY: currentY + 5,
        head: [["ID", "Cliente", "Endereço", "Hora", "Valor", "Status"]],
        body: pedidosData,
        theme: "striped",
        headStyles: { fillColor: [70, 130, 180] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 45 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30, halign: "right" },
          5: { cellWidth: 25 },
        },
      });

      currentY = pdf.lastAutoTable
        ? pdf.lastAutoTable.finalY + 20
        : currentY + 80;
    }

    // Produtos Mais Vendidos
    if (
      dadosDia.produtosMaisVendidos &&
      dadosDia.produtosMaisVendidos.length > 0
    ) {
      // Verificar se precisamos de uma nova página
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("PRODUTOS MAIS VENDIDOS", 20, currentY);

      const produtosData = dadosDia.produtosMaisVendidos.map((produto) => [
        produto.nome || "Produto",
        produto.quantidade.toString(),
        `R$ ${produto.precoUnitario.toFixed(2).replace(".", ",")}`,
        `R$ ${(produto.quantidade * produto.precoUnitario)
          .toFixed(2)
          .replace(".", ",")}`,
      ]);

      autoTable(pdf, {
        startY: currentY + 5,
        head: [["Produto", "Qtd", "Preço Unit.", "Total"]],
        body: produtosData,
        theme: "striped",
        headStyles: { fillColor: [70, 130, 180] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 40, halign: "right" },
          3: { cellWidth: 40, halign: "right" },
        },
      });

      currentY = pdf.lastAutoTable
        ? pdf.lastAutoTable.finalY + 20
        : currentY + 80;
    }

    // Rodapé
    const pageHeight = pdf.internal.pageSize.height;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.text(
      "Relatório gerado automaticamente pelo Sistema Fonte de Vida",
      105,
      pageHeight - 20,
      { align: "center" }
    );
    pdf.text(
      `Gerado em: ${dataFormatada} às ${horaFormatada}`,
      105,
      pageHeight - 10,
      { align: "center" }
    );

    return pdf;
  }

  static downloadFechamentoCaixa(dadosDia) {
    try {
      const pdf = this.generateFechamentoCaixaReport(dadosDia);
      const dataAtual = new Date();
      const dataFormatada = dataAtual
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "_");
      const nomeArquivo = `fechamento_caixa_${dataFormatada}.pdf`;

      pdf.save(nomeArquivo);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw error;
    }
  }

  static async coletarDadosDia() {
    try {
      const hoje = new Date();
      const inicioDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        0,
        0,
        0
      );
      const fimDia = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        23,
        59,
        59
      );

      // Detectar se está no Electron ou modo web
      const isElectron = window.electronAPI !== undefined;

      let pedidos = [];
      let produtos = [];
      let clientes = [];

      if (isElectron) {
        // Buscar dados via Electron API
        try {
          const pedidosResult = await window.electronAPI.orders.getAll();
          const produtosResult = await window.electronAPI.products.getAll();
          const clientesResult = await window.electronAPI.customers.getAll();

          pedidos = pedidosResult?.success ? pedidosResult.data : [];
          produtos = produtosResult?.success ? produtosResult.data : [];
          clientes = clientesResult?.success ? clientesResult.data : [];
        } catch (error) {
          console.error("Erro ao buscar dados via Electron API:", error);
          pedidos = [];
          produtos = [];
          clientes = [];
        }
      } else {
        // Modo web - usar WebStorageService
        try {
          const { default: WebStorageService } = await import(
            "./WebStorageService.js"
          );
          const webStorage = new WebStorageService();

          pedidos = webStorage.getOrders() || [];
          produtos = webStorage.getProducts() || [];
          clientes = webStorage.getCustomers() || [];
        } catch (error) {
          console.error("Erro ao buscar dados via WebStorage:", error);
          pedidos = [];
          produtos = [];
          clientes = [];
        }
      }

      // Filtrar pedidos do dia
      const pedidosDia = pedidos.filter((pedido) => {
        try {
          const dataPedido = new Date(pedido.created_at);
          return dataPedido >= inicioDia && dataPedido <= fimDia;
        } catch (error) {
          console.error("Erro ao processar data do pedido:", error);
          return false;
        }
      });

      // Calcular vendas do dia
      const vendasDia = pedidosDia.reduce(
        (total, pedido) => total + (parseFloat(pedido.total) || 0),
        0
      );

      // Calcular produtos vendidos
      const produtosVendidosMap = new Map();
      let totalProdutosVendidos = 0;

      pedidosDia.forEach((pedido) => {
        if (pedido.items && Array.isArray(pedido.items)) {
          pedido.items.forEach((item) => {
            const quantidade = parseInt(item.quantity) || 0;
            totalProdutosVendidos += quantidade;

            if (produtosVendidosMap.has(item.product_id)) {
              produtosVendidosMap.get(item.product_id).quantidade += quantidade;
            } else {
              const produto = produtos.find((p) => p.id === item.product_id);
              if (produto) {
                produtosVendidosMap.set(item.product_id, {
                  nome: produto.name || "Produto sem nome",
                  quantidade: quantidade,
                  precoUnitario: parseFloat(produto.price) || 0,
                });
              }
            }
          });
        }
      });

      // Converter para array e ordenar por quantidade
      const produtosMaisVendidos = Array.from(produtosVendidosMap.values())
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10); // Top 10

      // Buscar clientes únicos do dia
      const clientesUnicos = new Set();
      pedidosDia.forEach((pedido) => {
        if (pedido.customer_id) {
          clientesUnicos.add(pedido.customer_id);
        }
      });

      return {
        vendasDia,
        pedidosDia: pedidosDia.length,
        clientesAtivos: clientesUnicos.size,
        produtosVendidos: totalProdutosVendidos,
        pedidosDetalhados: pedidosDia.map((pedido) => {
          const cliente = clientes.find((c) => c.id === pedido.customer_id);
          return {
            id: pedido.id,
            cliente: cliente
              ? cliente.name
              : pedido.customer_name || "Cliente Avulso",
            endereco: cliente?.address || "Endereço não informado",
            data: pedido.created_at,
            total: parseFloat(pedido.total) || 0,
            status: pedido.status || "Concluído",
          };
        }),
        produtosMaisVendidos,
      };
    } catch (error) {
      console.error("Erro ao coletar dados do dia:", error);
      throw error;
    }
  }
}

export default PDFReportService;
