// Adaptador universal para impressão
class PrinterAdapter {
  constructor() {
    this.isElectron = typeof window !== "undefined" && window.electronAPI;
    this.printerService = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      if (this.isElectron) {
        // Modo Electron - usar PrinterService original
        const PrinterService = (await import("../../public/PrinterService.js"))
          .default;
        this.printerService = new PrinterService();
        console.log("🖨️ PrinterAdapter: Modo Electron inicializado");
      } else {
        // Modo Web - usar WebPrinterService
        const WebPrinterService = (await import("./WebPrinterService.js"))
          .default;
        this.printerService = new WebPrinterService();
        console.log("🖨️ PrinterAdapter: Modo Web inicializado");
      }

      this.initialized = true;
    } catch (error) {
      console.error("❌ Erro ao inicializar PrinterAdapter:", error);
      throw error;
    }
  }

  async printOrder(order, customer, products) {
    await this.initialize();
    return this.printerService.printOrder(order, customer, products);
  }

  async testPrint() {
    await this.initialize();
    return this.printerService.testPrint();
  }

  getMode() {
    return this.isElectron ? "electron" : "web";
  }
}

// Singleton
const printerAdapter = new PrinterAdapter();
export default printerAdapter;
