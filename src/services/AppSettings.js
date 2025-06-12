// AppSettings.js - Gerenciamento de configurações da aplicação
class AppSettings {
  constructor() {
    this.storageKey = "fontevida_settings";
    this.defaultSettings = {
      empresa: {
        nome: "Fonte Vida",
        endereco: "Rua das Flores, 123 - Centro",
        cidade: "Fortaleza - CE",
        cep: "60000-000",
        telefone: "(85) 3333-4444",
        email: "contato@fontevida.com.br",
        cnpj: "12.345.678/0001-90",
        logo: null,
      },
      sistema: {
        tema: "light", // light, dark, auto
        idioma: "pt-BR",
        moeda: "BRL",
        formato_data: "DD/MM/YYYY",
        fuso_horario: "America/Fortaleza",
        auto_backup: true,
        backup_intervalo: 24, // horas
        som_notificacoes: true,
        notificacoes_push: true,
      },
      impressora: {
        nome: "Impressora Padrão",
        tipo: "termica", // termica, jato_tinta, laser
        largura_papel: 80, // mm
        margens: {
          top: 5,
          bottom: 5,
          left: 2,
          right: 2,
        },
        auto_corte: true,
        logo_no_cupom: true,
        informacoes_empresa: true,
        imprimir_automatico: false,
        copia_cliente: false,
        rodape_nota: "Obrigado pela preferência!\nFonte de Vida - Água Pura",
        mensagem_adicional: "",
      },
      vendas: {
        desconto_maximo: 20, // %
        taxa_entrega: 3.5,
        tempo_entrega_padrao: 30, // minutos
        produtos_por_pagina: 20,
        mostrar_estoque_zero: false,
        alerta_estoque_baixo: 10,
        permitir_venda_sem_estoque: false,
        calcular_troco: true,
      },
      relatorios: {
        periodo_padrao: "mes_atual",
        formato_exportacao: "json", // json, csv, pdf
        incluir_graficos: true,
        detalhamento: "completo", // resumido, completo
        auto_refresh: 300, // segundos
        salvar_historico: true,
      },
      seguranca: {
        session_timeout: 480, // minutos (8 horas)
        backup_automatico: true,
        log_acoes: true,
        validar_cpf: false,
        validar_telefone: true,
        exigir_cliente: false,
      },
      interface: {
        sidebar_collapsed: false,
        densidade: "normal", // compacta, normal, espaçosa
        animacoes: true,
        sons_interface: true,
        mostrar_tutorial: true,
        atalhos_teclado: true,
      },
    };

    this.settings = this.loadSettings();
    this.subscribers = [];
  }

  // Carregar configurações do localStorage ou usar padrões
  loadSettings() {
    try {
      const isElectron = window.electronAPI !== undefined;

      if (isElectron) {
        // No Electron, tentar carregar do arquivo de configuração
        // Por enquanto usar localStorage como fallback
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return this.mergeWithDefaults(parsed);
        }
      } else {
        // No modo web, usar localStorage
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return this.mergeWithDefaults(parsed);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }

    return { ...this.defaultSettings };
  }

  // Mesclar configurações salvas com padrões
  mergeWithDefaults(stored) {
    const merged = { ...this.defaultSettings };

    for (const category in stored) {
      if (merged[category]) {
        merged[category] = { ...merged[category], ...stored[category] };
      }
    }

    return merged;
  }

  // Salvar configurações
  saveSettings() {
    try {
      const isElectron = window.electronAPI !== undefined;

      if (isElectron) {
        // No Electron, salvar no arquivo de configuração
        // Por enquanto usar localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));

        // TODO: Implementar salvamento via IPC
        // window.electronAPI.settings.save(this.settings);
      } else {
        // No modo web, usar localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      }

      // Notificar subscribers
      this.notifySubscribers();

      console.log("Configurações salvas com sucesso");
      return true;
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      return false;
    }
  }

  // Obter uma configuração específica
  get(path) {
    const parts = path.split(".");
    let current = this.settings;

    for (const part of parts) {
      if (current[part] === undefined) {
        return null;
      }
      current = current[part];
    }

    return current;
  }

  // Definir uma configuração específica
  set(path, value) {
    const parts = path.split(".");
    let current = this.settings;

    // Navegar até o penúltimo nível
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    // Definir o valor final
    current[parts[parts.length - 1]] = value;

    return this.saveSettings();
  }

  // Obter todas as configurações
  getAll() {
    return { ...this.settings };
  }

  // Atualizar múltiplas configurações
  update(updates) {
    for (const path in updates) {
      this.set(path, updates[path]);
    }
    return this.saveSettings();
  }

  // Resetar configurações para padrão
  reset(category = null) {
    if (category) {
      this.settings[category] = { ...this.defaultSettings[category] };
    } else {
      this.settings = { ...this.defaultSettings };
    }

    return this.saveSettings();
  }

  // Exportar configurações
  export() {
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      settings: this.settings,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fontevida_configuracoes_${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Importar configurações
  async import(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.settings) {
        this.settings = this.mergeWithDefaults(data.settings);
        const success = this.saveSettings();

        if (success) {
          console.log("Configurações importadas com sucesso");
          return {
            success: true,
            message: "Configurações importadas com sucesso",
          };
        } else {
          throw new Error("Erro ao salvar configurações importadas");
        }
      } else {
        throw new Error("Arquivo de configuração inválido");
      }
    } catch (error) {
      console.error("Erro ao importar configurações:", error);
      return { success: false, error: error.message };
    }
  }

  // Subscrever a mudanças nas configurações
  subscribe(callback) {
    this.subscribers.push(callback);

    // Retornar função para cancelar inscrição
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Notificar subscribers sobre mudanças
  notifySubscribers() {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.settings);
      } catch (error) {
        console.error("Erro ao notificar subscriber:", error);
      }
    });
  }

  // Validar configurações
  validate() {
    const errors = [];

    // Validar empresa
    if (!this.settings.empresa.nome.trim()) {
      errors.push("Nome da empresa é obrigatório");
    }

    if (!this.settings.empresa.telefone.trim()) {
      errors.push("Telefone da empresa é obrigatório");
    }

    // Validar vendas
    if (
      this.settings.vendas.desconto_maximo < 0 ||
      this.settings.vendas.desconto_maximo > 100
    ) {
      errors.push("Desconto máximo deve estar entre 0% e 100%");
    }

    if (this.settings.vendas.taxa_entrega < 0) {
      errors.push("Taxa de entrega não pode ser negativa");
    }

    // Validar impressora
    if (
      this.settings.impressora.largura_papel < 40 ||
      this.settings.impressora.largura_papel > 200
    ) {
      errors.push("Largura do papel deve estar entre 40mm e 200mm");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Métodos de conveniência
  isEmpresaCompleta() {
    const emp = this.settings.empresa;
    return emp.nome && emp.endereco && emp.telefone && emp.email;
  }

  isTemaEscuro() {
    return (
      this.settings.sistema.tema === "dark" ||
      (this.settings.sistema.tema === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }

  getFormatoMoeda() {
    return new Intl.NumberFormat(this.settings.sistema.idioma, {
      style: "currency",
      currency: this.settings.sistema.moeda,
    });
  }

  formatarData(date) {
    return new Intl.DateTimeFormat(this.settings.sistema.idioma, {
      timeZone: this.settings.sistema.fuso_horario,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  }

  formatarDataHora(date) {
    return new Intl.DateTimeFormat(this.settings.sistema.idioma, {
      timeZone: this.settings.sistema.fuso_horario,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  // Configurações de impressão
  getConfigImpressao() {
    return {
      ...this.settings.impressora,
      dadosEmpresa: this.settings.empresa,
    };
  }

  // Configurações de relatórios
  getConfigRelatorios() {
    return {
      ...this.settings.relatorios,
      formatoMoeda: this.getFormatoMoeda(),
      formatoData: this.settings.sistema.formato_data,
    };
  }

  // Debug e logs
  debug() {
    console.group("🔧 FonteVida - Configurações");
    console.log("Empresa completa:", this.isEmpresaCompleta());
    console.log("Tema escuro:", this.isTemaEscuro());
    console.log("Validação:", this.validate());
    console.log("Configurações:", this.settings);
    console.groupEnd();
  }
}

// Instância singleton
const appSettings = new AppSettings();

// Exportar instância e classe
export default appSettings;
export { AppSettings };
