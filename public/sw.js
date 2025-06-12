// Service Worker para interceptar impressão e tornar o PWA mais poderoso
const CACHE_NAME = "fonte-vida-v1";
const PRINT_CACHE = "print-cache-v1";

// Arquivos para cache
const urlsToCache = [
  "/",
  "/index.html",
  "/src/main.jsx",
  "/src/App.jsx",
  "/icon.svg",
  "/logo_site.png",
];

// Instalação do service worker
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Cache inicializado");
      return cache.addAll(urlsToCache);
    })
  );
  // Forçar ativação imediata
  self.skipWaiting();
});

// Ativação do service worker
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker ativado");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== PRINT_CACHE) {
            console.log("🗑️ Removendo cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Assumir controle imediato de todas as páginas
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  // Interceptar requisições de impressão
  if (
    event.request.url.includes("/api/print") ||
    event.request.url.includes("thermal-print") ||
    (event.request.method === "POST" && event.request.url.includes("print"))
  ) {
    event.respondWith(handlePrintRequest(event.request));
    return;
  }

  // Cache normal para outros recursos
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        // Fallback offline para recursos críticos
        if (event.request.destination === "document") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

// Handler especial para impressão
async function handlePrintRequest(request) {
  try {
    console.log("🖨️ Service Worker interceptou requisição de impressão");

    let data;
    if (request.method === "POST") {
      data = await request.json();
    } else {
      data = { text: "Impressão via PWA", order: { id: "PWA-" + Date.now() } };
    }

    // Criar resposta de impressão otimizada para PWA
    const printResponse = {
      success: true,
      method: "pwa-thermal-print",
      action: "automatic-print",
      data: data,
      timestamp: new Date().toISOString(),
    };

    // Enviar mensagem para a página principal para executar impressão
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => {
      console.log("📤 Enviando comando de impressão para cliente");
      client.postMessage({
        type: "THERMAL_PRINT_REQUEST",
        payload: printResponse,
      });
    });

    // Cache da requisição de impressão para modo offline
    const cache = await caches.open(PRINT_CACHE);
    const cacheKey = `print-${Date.now()}`;
    await cache.put(cacheKey, new Response(JSON.stringify(data)));

    return new Response(JSON.stringify(printResponse), {
      headers: {
        "Content-Type": "application/json",
        "X-Print-Method": "pwa-thermal",
        "X-Cache-Status": "cached",
      },
    });
  } catch (error) {
    console.error("❌ Erro no handler de impressão:", error);
    return new Response(
      JSON.stringify({
        success: false,
        method: "pwa-thermal-error",
        error: error.message,
        fallback: "browser-dialog",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Escutar mensagens da página principal
self.addEventListener("message", (event) => {
  console.log("📨 Service Worker recebeu mensagem:", event.data);

  if (event.data && event.data.type === "PRINT_STATUS") {
    // Responder com status da impressão
    event.ports[0].postMessage({
      status: "ready",
      capabilities: {
        thermalPrint: true,
        automaticPrint: true,
        offlineSupport: true,
      },
    });
  }

  if (event.data && event.data.type === "FORCE_UPDATE") {
    // Forçar atualização do service worker
    self.skipWaiting();
  }
});

// Background sync para impressão offline
self.addEventListener("sync", (event) => {
  if (event.tag === "background-print") {
    console.log("🔄 Executando impressão em background");
    event.waitUntil(processPendingPrints());
  }
});

// Processar impressões pendentes quando voltar online
async function processPendingPrints() {
  try {
    const cache = await caches.open(PRINT_CACHE);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();

      // Reenviar para impressão
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "RETRY_PRINT",
          data: data,
        });
      });

      // Remover do cache após processar
      await cache.delete(request);
    }
  } catch (error) {
    console.error("❌ Erro ao processar impressões pendentes:", error);
  }
}
