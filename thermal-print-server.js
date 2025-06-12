#!/usr/bin/env node

/**
 * Servidor local para impressão térmica RAW
 *
 * Este servidor permite que o aplicativo web envie dados RAW
 * diretamente para impressoras térmicas via HTTP.
 *
 * Uso:
 * 1. Execute: node thermal-print-server.js
 * 2. O servidor ficará disponível em http://localhost:3001
 * 3. Seu webapp pode enviar dados via POST para imprimir
 */

const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 3001;
const PRINTER_NAME = "Generic / Text Only"; // Nome exato da sua impressora

class ThermalPrintServer {
  constructor() {
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      // Headers CORS para permitir requisições do webapp
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === "POST" && req.url === "/print") {
        this.handlePrintRequest(req, res);
      } else if (req.method === "GET" && req.url === "/status") {
        this.handleStatusRequest(req, res);
      } else if (req.method === "GET" && req.url === "/test") {
        this.handleTestRequest(req, res);
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    this.server.listen(PORT, () => {
      console.log(`🖨️ Servidor de Impressão Térmica iniciado!`);
      console.log(`📡 Porta: ${PORT}`);
      console.log(`🖨️ Impressora: ${PRINTER_NAME}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`\n💡 Como usar no seu webapp:`);
      console.log(`   fetch('http://localhost:${PORT}/print', {`);
      console.log(`     method: 'POST',`);
      console.log(`     headers: { 'Content-Type': 'application/json' },`);
      console.log(`     body: JSON.stringify({ text: 'Texto do cupom...' })`);
      console.log(`   })`);
    });
  }

  handlePrintRequest(req, res) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const result = await this.printText(data.text || data.content);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Impressão enviada com sucesso",
            result,
          })
        );
      } catch (error) {
        console.error("❌ Erro na impressão:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: error.message,
          })
        );
      }
    });
  }

  handleStatusRequest(req, res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "online",
        printer: PRINTER_NAME,
        platform: os.platform(),
        port: PORT,
      })
    );
  }

  async handleTestRequest(req, res) {
    try {
      const testText = `
TESTE DE IMPRESSÃO
==================
Data: ${new Date().toLocaleString("pt-BR")}

Esta é uma impressão de teste
do servidor de impressão térmica.

Sistema: Fonte de Vida
Servidor: http://localhost:${PORT}

==================
`;

      const result = await this.printText(testText);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          message: "Teste de impressão enviado",
          result,
        })
      );
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: error.message,
        })
      );
    }
  }

  async printText(text) {
    return new Promise((resolve, reject) => {
      // Criar arquivo temporário
      const tempDir = os.tmpdir();
      const fileName = `print_${Date.now()}.txt`;
      const filePath = path.join(tempDir, fileName);

      // Escrever o texto no arquivo
      fs.writeFileSync(filePath, text, "utf8");

      let command;
      if (os.platform() === "win32") {
        // Windows - usar comando COPY
        command = `copy "${filePath}" "${PRINTER_NAME}"`;
      } else if (os.platform() === "linux") {
        // Linux - usar lpr
        command = `lpr -P "${PRINTER_NAME}" "${filePath}"`;
      } else {
        // macOS
        command = `lpr -P "${PRINTER_NAME}" "${filePath}"`;
      }

      console.log(`🖨️ Executando: ${command}`);

      exec(command, (error, stdout, stderr) => {
        // Limpar arquivo temporário
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn(
            "⚠️ Não foi possível remover arquivo temporário:",
            e.message
          );
        }

        if (error) {
          console.error("❌ Erro na impressão:", error);
          reject(new Error(`Erro na impressão: ${error.message}`));
        } else {
          console.log("✅ Impressão enviada com sucesso");
          resolve({
            command,
            stdout: stdout || "",
            stderr: stderr || "",
          });
        }
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log("🛑 Servidor de impressão parado");
    }
  }
}

// Inicializar servidor
const printServer = new ThermalPrintServer();
printServer.start();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Parando servidor...");
  printServer.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  printServer.stop();
  process.exit(0);
});
