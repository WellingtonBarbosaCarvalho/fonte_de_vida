#!/usr/bin/env node

/**
 * SERVIDOR DE IMPRESSÃO TÉRMICA
 *
 * Cenário de uso:
 * - Desenvolvimento: Ubuntu (Wellington)
 * - Produção: Windows (Cliente final)
 *
 * Este servidor funciona em ambos os ambientes
 */

const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 3001;
const HOST = "localhost";

// Detectar sistema operacional
const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";
const isMac = os.platform() === "darwin";

console.log(`🖨️ Servidor de Impressão Térmica`);
console.log(
  `💻 Sistema: ${
    isWindows ? "Windows" : isLinux ? "Linux" : isMac ? "macOS" : "Desconhecido"
  }`
);
console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);

// Configurações específicas por sistema
const PRINTER_CONFIG = {
  windows: {
    defaultPrinter: "Generic / Text Only",
    printCommand: (file) => `copy "${file}" "Generic / Text Only"`,
    testCommand: "wmic printer list brief",
    encoding: "cp1252",
  },
  linux: {
    defaultPrinter: "Generic_Text_Only",
    printCommand: (file) => `lpr -P "Generic_Text_Only" "${file}"`,
    testCommand: "lpstat -p | grep Generic",
    encoding: "utf8",
  },
  mac: {
    defaultPrinter: "Generic_Text_Only",
    printCommand: (file) => `lpr -P "Generic_Text_Only" "${file}"`,
    testCommand: "lpstat -p | grep Generic",
    encoding: "utf8",
  },
};

// Obter configuração do sistema atual
function getSystemConfig() {
  if (isWindows) return PRINTER_CONFIG.windows;
  if (isLinux) return PRINTER_CONFIG.linux;
  if (isMac) return PRINTER_CONFIG.mac;
  return PRINTER_CONFIG.linux; // fallback
}

const config = getSystemConfig();

// Criar diretório temporário se não existir
const tempDir = path.join(os.tmpdir(), "fontevida-print");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Headers CORS para permitir requisições do webapp
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// Função para executar comando do sistema
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Executando: ${command}`);

    exec(command, { encoding: config.encoding }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro: ${error.message}`);
        reject(error);
        return;
      }

      if (stderr && !stderr.includes("warning")) {
        console.warn(`⚠️ Aviso: ${stderr}`);
      }

      // Fix para Windows: stdout pode ser buffer ou string
      const output = stdout
        ? typeof stdout === "string"
          ? stdout.trim()
          : stdout.toString().trim()
        : "";
      console.log(`✅ Sucesso: ${output}`);
      resolve(output);
    });
  });
}

// Função para imprimir texto
async function printText(text) {
  try {
    console.log(`🖨️ Iniciando impressão (${text.length} caracteres)`);

    // Criar arquivo temporário
    const timestamp = Date.now();
    const fileName = `print_${timestamp}.txt`;
    const filePath = path.join(tempDir, fileName);

    // Escrever texto no arquivo
    fs.writeFileSync(filePath, text, config.encoding);
    console.log(`📄 Arquivo criado: ${filePath}`);

    // Comando de impressão específico do sistema
    const printCommand = config.printCommand(filePath);

    // Executar impressão
    await executeCommand(printCommand);

    // Limpar arquivo temporário após 30 segundos
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Arquivo temporário removido: ${fileName}`);
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Erro ao limpar arquivo: ${cleanupError.message}`);
      }
    }, 30000);

    return {
      success: true,
      message: `Impresso via ${config.defaultPrinter}`,
      method: "system-command",
      file: fileName,
      system: os.platform(),
    };
  } catch (error) {
    console.error(`❌ Erro na impressão:`, error);
    return {
      success: false,
      error: error.message,
      system: os.platform(),
    };
  }
}

// Função para verificar impressora
async function checkPrinter() {
  try {
    console.log(`🔍 Verificando impressora: ${config.defaultPrinter}`);

    const output = await executeCommand(config.testCommand);
    const hasGeneric = output.toLowerCase().includes("generic");

    return {
      available: hasGeneric,
      printerName: config.defaultPrinter,
      system: os.platform(),
      output: output.substring(0, 200), // Limitar saída
    };
  } catch (error) {
    console.warn(`⚠️ Erro ao verificar impressora: ${error.message}`);
    return {
      available: false,
      error: error.message,
      system: os.platform(),
    };
  }
}

// Criar servidor HTTP
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Lidar com preflight OPTIONS
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log(
    `📥 ${req.method} ${pathname} - ${req.headers["user-agent"]?.substring(
      0,
      50
    )}...`
  );

  try {
    // Rota de status
    if (pathname === "/status" && req.method === "GET") {
      const printerStatus = await checkPrinter();

      const status = {
        server: "online",
        timestamp: new Date().toISOString(),
        system: {
          platform: os.platform(),
          arch: os.arch(),
          node: process.version,
          uptime: process.uptime(),
        },
        printer: printerStatus,
        tempDir: tempDir,
      };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(status, null, 2));
      return;
    }

    // Rota de impressão tradicional
    if (pathname === "/print" && req.method === "POST") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body);

          if (!data.text) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ success: false, error: "Texto não fornecido" })
            );
            return;
          }

          console.log(
            `📄 Recebido para impressão: ${data.text.length} caracteres`
          );

          const result = await printText(data.text);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (parseError) {
          console.error(`❌ Erro ao processar JSON:`, parseError);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "JSON inválido" }));
        }
      });

      return;
    }

    // NOVA ROTA: Raw chunk processing
    if (pathname === "/raw-chunk" && req.method === "POST") {
      let chunks = [];

      req.on("data", (chunk) => {
        chunks.push(chunk);
      });

      req.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const text = buffer.toString("utf8");

          console.log(`📄 Chunk RAW recebido: ${text.length} caracteres`);

          const result = await printText(text);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          console.error(`❌ Erro no chunk RAW:`, error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });

      return;
    }

    // NOVA ROTA: Extension simulation
    if (pathname === "/extension-print" && req.method === "POST") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          console.log(
            `📄 Impressão via extensão simulada: ${body.length} caracteres`
          );

          const result = await printText(body);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ ...result, method: "extension-simulation" })
          );
        } catch (error) {
          console.error(`❌ Erro na extensão simulada:`, error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });

      return;
    }

    // NOVA ROTA: Memory queue
    if (pathname === "/memory-queue" && req.method === "POST") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          console.log(`📄 Memory queue solicitada: ${data.queueId}`);

          // Simular sucesso para memory queue
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              method: "memory-queue",
              queueId: data.queueId,
            })
          );
        } catch (error) {
          console.error(`❌ Erro na memory queue:`, error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });

      return;
    }

    // Rota não encontrada
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Rota não encontrada",
        availableRoutes: ["/status", "/print"],
      })
    );
  } catch (error) {
    console.error(`❌ Erro no servidor:`, error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
});

// Tratamento de erros do servidor
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Porta ${PORT} já está em uso!`);
    console.log(`💡 Tente parar outros serviços ou use outra porta`);
  } else {
    console.error(`❌ Erro no servidor:`, error);
  }
  process.exit(1);
});

// Iniciar servidor
server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📋 Rotas disponíveis:`);
  console.log(`   GET  /status - Status do servidor e impressora`);
  console.log(`   POST /print  - Enviar texto para impressão`);
  console.log(`🖨️ Impressora configurada: ${config.defaultPrinter}`);
  console.log(`📁 Diretório temporário: ${tempDir}`);
  console.log(`✅ Pronto para receber requisições!`);
});

// Tratamento de sinais para encerramento limpo
process.on("SIGINT", () => {
  console.log(`\n🛑 Recebido SIGINT, encerrando servidor...`);
  server.close(() => {
    console.log(`✅ Servidor encerrado`);
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log(`🛑 Recebido SIGTERM, encerrando servidor...`);
  server.close(() => {
    console.log(`✅ Servidor encerrado`);
    process.exit(0);
  });
});

// Log não tratado de erros
process.on("uncaughtException", (error) => {
  console.error(`❌ Erro não tratado:`, error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(`❌ Promise rejeitada:`, reason);
  console.error(`   Promise:`, promise);
});
