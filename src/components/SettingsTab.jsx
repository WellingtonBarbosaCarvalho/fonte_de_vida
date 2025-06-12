import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  Printer, 
  ShoppingCart, 
  BarChart3, 
  Shield, 
  Monitor,
  Save,
  RotateCcw,
  Download,
  Upload,
  Check,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import appSettings from '../services/AppSettings.js';

const SettingsTab = ({ modal }) => {
  const [activeSection, setActiveSection] = useState('empresa');
  const [settings, setSettings] = useState(appSettings.getAll());
  const [tempSettings, setTempSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState({ valid: true, errors: [] });

  // Detectar se está no Electron ou modo web
  const isElectron = window.electronAPI !== undefined;

  // Seções de configuração
  const sections = [
    { id: 'empresa', name: 'Empresa', icon: Building },
    { id: 'sistema', name: 'Sistema', icon: Monitor },
    { id: 'impressora', name: 'Impressora', icon: Printer },
    { id: 'vendas', name: 'Vendas', icon: ShoppingCart },
    { id: 'relatorios', name: 'Relatórios', icon: BarChart3 },
    { id: 'seguranca', name: 'Segurança', icon: Shield },
    { id: 'interface', name: 'Interface', icon: Settings }
  ];

  useEffect(() => {
    // Subscrever a mudanças nas configurações
    const unsubscribe = appSettings.subscribe((newSettings) => {
      setSettings(newSettings);
      if (!hasChanges) {
        setTempSettings(newSettings);
      }
    });

    return unsubscribe;
  }, [hasChanges]);

  useEffect(() => {
    // Verificar se há mudanças
    const changed = JSON.stringify(settings) !== JSON.stringify(tempSettings);
    setHasChanges(changed);

    // Validar configurações
    const valid = appSettings.validate();
    setValidation(valid);
  }, [settings, tempSettings]);

  const handleChange = (path, value) => {
    const newSettings = { ...tempSettings };
    const parts = path.split('.');
    let current = newSettings;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    setTempSettings(newSettings);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Atualizar configurações no AppSettings
      for (const category in tempSettings) {
        for (const key in tempSettings[category]) {
          appSettings.set(`${category}.${key}`, tempSettings[category][key]);
        }
      }
      
      // Verificar se foi salvo com sucesso
      const success = appSettings.saveSettings();
      
      if (success) {
        setSettings(tempSettings);
        modal.showAlert('Configurações salvas com sucesso!', 'success');
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      modal.showAlert('Erro ao salvar configurações: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (category = null) => {
    modal.showConfirm(
      `Tem certeza que deseja resetar ${category ? `as configurações de ${category}` : 'todas as configurações'}?`,
      'Confirmar Reset',
      () => {
        if (category) {
          const defaultCategory = appSettings.defaultSettings[category];
          setTempSettings(prev => ({
            ...prev,
            [category]: { ...defaultCategory }
          }));
        } else {
          setTempSettings(appSettings.defaultSettings);
        }
      }
    );
  };

  const handleExport = () => {
    appSettings.export();
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const result = await appSettings.import(file);
    
    if (result.success) {
      setTempSettings(appSettings.getAll());
      modal.showAlert('Configurações importadas com sucesso!', 'success');
    } else {
      modal.showAlert('Erro ao importar configurações: ' + result.error, 'error');
    }
    
    // Limpar input
    event.target.value = '';
  };

  const handleDiscard = () => {
    modal.showConfirm(
      'Descartar todas as alterações não salvas?',
      'Confirmar Descarte',
      () => {
        setTempSettings(settings);
      }
    );
  };

  // Função para detectar automaticamente impressora térmica
  const handleAutoDetectPrinter = async () => {
    try {
      console.log("🔍 Iniciando detecção automática de impressora térmica...");
      
      // Mostrar loading
      modal.showAlert('Detectando impressora térmica...', 'info');
      
      // Verificar se está no ambiente Electron
      const isElectron = typeof window !== 'undefined' && window.electronAPI;
      
      // Detectar sistema operacional
      const isWindows = navigator.platform.indexOf('Win') > -1;
      const isLinux = navigator.platform.indexOf('Linux') > -1;
      const isMac = navigator.platform.indexOf('Mac') > -1;
      
      // Verificar se está em modo PWA ou kiosk
      const isPWA = window.navigator.standalone || 
                   window.matchMedia('(display-mode: standalone)').matches ||
                   document.referrer.includes('android-app://');
      
      // Configuração otimizada baseada no ambiente
      let detectedConfig = {
        tipo: 'auto',
        nome: 'Generic / Text Only',
        largura_papel: 80,
        modo_impressao: 'auto',
        imprimir_automatico: true,
        auto_corte: true,
        modo_termica: true
      };
      
      // Ajustar configuração baseado no ambiente
      if (isElectron) {
        console.log("🖥️ Ambiente Electron detectado");
        detectedConfig.modo_impressao = 'thermal_direct';
        detectedConfig.tipo = 'termica';
      } else if (isPWA) {
        console.log("📱 Modo PWA detectado");
        detectedConfig.modo_impressao = 'thermal_direct';
        detectedConfig.tipo = 'termica';
      } else {
        console.log("🌐 Ambiente navegador detectado");
        detectedConfig.modo_impressao = 'auto';
      }
      
      // Verificar servidor de impressão local
      try {
        const response = await fetch('http://localhost:3001/status', {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.ok) {
          console.log("✅ Servidor de impressão local encontrado");
          detectedConfig.servidor_local = true;
          detectedConfig.modo_impressao = 'thermal_direct';
        }
      } catch (error) {
        console.log("⚠️ Servidor local não encontrado:", error.message);
        detectedConfig.servidor_local = false;
      }
      
      // Aplicar configurações detectadas
      const newSettings = {
        ...tempSettings,
        impressora: {
          ...tempSettings.impressora,
          ...detectedConfig
        }
      };
      
      setTempSettings(newSettings);
      
      // Mostrar resultado da detecção
      const environmentInfo = [
        `🖥️ Ambiente: ${isElectron ? 'Electron (Desktop)' : isPWA ? 'PWA (Aplicativo)' : 'Navegador Web'}`,
        `💻 Sistema: ${isWindows ? 'Windows' : isLinux ? 'Linux' : isMac ? 'macOS' : 'Desconhecido'}`,
        `🖨️ Modo: ${detectedConfig.modo_impressao}`,
        `📏 Papel: ${detectedConfig.largura_papel}mm`,
        `🔌 Servidor local: ${detectedConfig.servidor_local ? 'Ativo' : 'Inativo'}`
      ].join('\n');
      
      modal.showAlert(
        `Detecção concluída com sucesso!\n\n${environmentInfo}\n\n✅ Configuração otimizada aplicada`,
        'success'
      );
      
      console.log("✅ Detecção automática concluída:", detectedConfig);
      
    } catch (error) {
      console.error("❌ Erro na detecção automática:", error);
      modal.showAlert(
        `Erro na detecção automática: ${error.message}\n\nUsando configuração padrão para impressora térmica.`,
        'error'
      );
      
      // Configuração padrão em caso de erro
      const fallbackConfig = {
        tipo: 'termica',
        nome: 'Generic / Text Only',
        largura_papel: 80,
        modo_impressao: 'auto',
        imprimir_automatico: true,
        auto_corte: true,
        modo_termica: true
      };
      
      setTempSettings({
        ...tempSettings,
        impressora: {
          ...tempSettings.impressora,
          ...fallbackConfig
        }
      });
    }
  };

  const renderEmpresaSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Empresa *
          </label>
          <input
            type="text"
            value={tempSettings.empresa.nome}
            onChange={(e) => handleChange('empresa.nome', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nome da sua empresa"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNPJ
          </label>
          <input
            type="text"
            value={tempSettings.empresa.cnpj}
            onChange={(e) => handleChange('empresa.cnpj', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="00.000.000/0000-00"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço *
          </label>
          <input
            type="text"
            value={tempSettings.empresa.endereco}
            onChange={(e) => handleChange('empresa.endereco', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Rua, número, bairro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cidade
          </label>
          <input
            type="text"
            value={tempSettings.empresa.cidade}
            onChange={(e) => handleChange('empresa.cidade', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Cidade - UF"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <input
            type="text"
            value={tempSettings.empresa.cep}
            onChange={(e) => handleChange('empresa.cep', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="00000-000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone *
          </label>
          <input
            type="text"
            value={tempSettings.empresa.telefone}
            onChange={(e) => handleChange('empresa.telefone', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(85) 3333-4444"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={tempSettings.empresa.email}
            onChange={(e) => handleChange('empresa.email', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contato@empresa.com"
          />
        </div>
      </div>
    </div>
  );

  const renderSistemaSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tema
          </label>
          <select
            value={tempSettings.sistema.tema}
            onChange={(e) => handleChange('sistema.tema', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
            <option value="auto">Automático</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idioma
          </label>
          <select
            value={tempSettings.sistema.idioma}
            onChange={(e) => handleChange('sistema.idioma', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moeda
          </label>
          <select
            value={tempSettings.sistema.moeda}
            onChange={(e) => handleChange('sistema.moeda', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuso Horário
          </label>
          <select
            value={tempSettings.sistema.fuso_horario}
            onChange={(e) => handleChange('sistema.fuso_horario', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
            <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
            <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
            <option value="America/Manaus">Manaus (GMT-4)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Configurações Gerais</h4>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.sistema.auto_backup}
              onChange={(e) => handleChange('sistema.auto_backup', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Backup automático</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.sistema.som_notificacoes}
              onChange={(e) => handleChange('sistema.som_notificacoes', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Som das notificações</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.sistema.notificacoes_push}
              onChange={(e) => handleChange('sistema.notificacoes_push', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Notificações push</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderImpressoraSection = () => (
    <div className="space-y-6">
      {/* Seção de detecção automática */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Configuração Automática</h4>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Para impressoras térmicas, recomendamos a configuração automática que otimiza a impressão.
        </p>
        <button
          onClick={handleAutoDetectPrinter}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          🔍 Detectar Impressora Térmica
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Impressora
          </label>
          <select
            value={tempSettings.impressora.tipo}
            onChange={(e) => handleChange('impressora.tipo', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="auto">🔍 Detectar Automaticamente</option>
            <option value="termica">🔥 Térmica (80mm)</option>
            <option value="termica_58">🔥 Térmica (58mm)</option>
            <option value="comum">🖨️ Impressora Comum</option>
            <option value="laser">⚡ Laser</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Impressora
          </label>
          <input
            type="text"
            value={tempSettings.impressora.nome}
            onChange={(e) => handleChange('impressora.nome', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Generic / Text Only"
          />
          <p className="text-xs text-gray-500 mt-1">
            Para impressoras térmicas, geralmente é "Generic / Text Only"
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Largura do Papel (mm)
          </label>
          <select
            value={tempSettings.impressora.largura_papel}
            onChange={(e) => handleChange('impressora.largura_papel', parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="58">58mm (cupom pequeno)</option>
            <option value="80">80mm (cupom padrão)</option>
            <option value="210">210mm (A4)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modo de Impressão
          </label>
          <select
            value={tempSettings.impressora.modo_impressao || 'auto'}
            onChange={(e) => handleChange('impressora.modo_impressao', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="auto">🤖 Automático (Recomendado)</option>
            <option value="thermal_direct">🔥 Térmica Direta</option>
            <option value="browser_dialog">🌐 Diálogo do Navegador</option>
            <option value="download_txt">💾 Download TXT</option>
          </select>
        </div>
      </div>

      {/* Configuração automática térmica */}
      {tempSettings.impressora.tipo === 'termica' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">Impressora Térmica Configurada</h4>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>✅ Impressão direta ativada</p>
            <p>✅ Formatação otimizada para {tempSettings.impressora.largura_papel}mm</p>
            <p>✅ Modo automático habilitado</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Opções de Impressão</h4>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.impressora.auto_corte}
              onChange={(e) => handleChange('impressora.auto_corte', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Corte automático</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.impressora.logo_no_cupom}
              onChange={(e) => handleChange('impressora.logo_no_cupom', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Imprimir logo no cupom</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.impressora.informacoes_empresa}
              onChange={(e) => handleChange('impressora.informacoes_empresa', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Imprimir dados da empresa</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.impressora.imprimir_automatico}
              onChange={(e) => handleChange('impressora.imprimir_automatico', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Impressão automática</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.impressora.copia_cliente}
              onChange={(e) => handleChange('impressora.copia_cliente', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Imprimir cópia para cliente</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Personalização da Nota</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rodapé da Nota Fiscal
            </label>
            <textarea
              rows="3"
              value={tempSettings.impressora.rodape_nota}
              onChange={(e) => handleChange('impressora.rodape_nota', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Obrigado pela preferência!&#10;Fonte de Vida - Água Pura"
            />
            <p className="text-xs text-gray-500 mt-1">Use \n para quebras de linha</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem Adicional
            </label>
            <textarea
              rows="2"
              value={tempSettings.impressora.mensagem_adicional}
              onChange={(e) => handleChange('impressora.mensagem_adicional', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mensagem adicional (opcional)"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderVendasSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desconto Máximo (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={tempSettings.vendas.desconto_maximo}
            onChange={(e) => handleChange('vendas.desconto_maximo', parseFloat(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taxa de Entrega (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={tempSettings.vendas.taxa_entrega}
            onChange={(e) => handleChange('vendas.taxa_entrega', parseFloat(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tempo de Entrega Padrão (min)
          </label>
          <input
            type="number"
            min="0"
            value={tempSettings.vendas.tempo_entrega_padrao}
            onChange={(e) => handleChange('vendas.tempo_entrega_padrao', parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alerta Estoque Baixo
          </label>
          <input
            type="number"
            min="0"
            value={tempSettings.vendas.alerta_estoque_baixo}
            onChange={(e) => handleChange('vendas.alerta_estoque_baixo', parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Opções de Venda</h4>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.vendas.mostrar_estoque_zero}
              onChange={(e) => handleChange('vendas.mostrar_estoque_zero', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Mostrar produtos com estoque zero</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.vendas.permitir_venda_sem_estoque}
              onChange={(e) => handleChange('vendas.permitir_venda_sem_estoque', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Permitir venda sem estoque</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.vendas.calcular_troco}
              onChange={(e) => handleChange('vendas.calcular_troco', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Calcular troco automaticamente</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.seguranca.exigir_cliente}
              onChange={(e) => handleChange('seguranca.exigir_cliente', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Exigir seleção de cliente</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderRelatoriosSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-atualização (segundos)
          </label>
          <input
            type="number"
            min="0"
            max="3600"
            value={tempSettings.relatorios.auto_refresh}
            onChange={(e) => handleChange('relatorios.auto_refresh', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="300"
          />
          <p className="text-xs text-gray-500 mt-1">0 para desabilitar</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período Padrão
          </label>
          <select
            value={tempSettings.relatorios.periodo_padrao}
            onChange={(e) => handleChange('relatorios.periodo_padrao', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hoje">Hoje</option>
            <option value="semana_atual">Semana Atual</option>
            <option value="mes_atual">Mês Atual</option>
            <option value="ultimos_30_dias">Últimos 30 Dias</option>
            <option value="ano_atual">Ano Atual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formato de Exportação
          </label>
          <select
            value={tempSettings.relatorios.formato_exportacao}
            onChange={(e) => handleChange('relatorios.formato_exportacao', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nível de Detalhamento
          </label>
          <select
            value={tempSettings.relatorios.detalhamento}
            onChange={(e) => handleChange('relatorios.detalhamento', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="resumido">Resumido</option>
            <option value="completo">Completo</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Opções dos Relatórios</h4>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.relatorios.incluir_graficos}
              onChange={(e) => handleChange('relatorios.incluir_graficos', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Incluir gráficos</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tempSettings.relatorios.salvar_historico}
              onChange={(e) => handleChange('relatorios.salvar_historico', e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Salvar histórico de relatórios</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'empresa':
        return renderEmpresaSection();
      case 'sistema':
        return renderSistemaSection();
      case 'impressora':
        return renderImpressoraSection();
      case 'vendas':
        return renderVendasSection();
      case 'relatorios':
        return renderRelatoriosSection();
      default:
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Seção em desenvolvimento
            </h3>
            <p className="text-gray-600">
              Esta seção estará disponível em breve.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
          <p className="text-sm text-gray-500">
            {isElectron ? 'Modo Desktop' : 'Modo Web - Configurações salvas localmente'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors">
            <Upload className="h-4 w-4" />
            <span>Importar</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">Você tem alterações não salvas</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDiscard}
              className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !validation.valid}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {!validation.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <X className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Erros de validação:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm rounded-lg mr-6">
          <nav className="p-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{section.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {sections.find(s => s.id === activeSection)?.name}
            </h3>
            
            <button
              onClick={() => handleReset(activeSection)}
              className="text-gray-500 hover:text-gray-700 flex items-center space-x-2 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">Resetar</span>
            </button>
          </div>

          {renderSection()}
          
          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => handleReset()}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Resetar Tudo
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges || !validation.valid}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsTab;