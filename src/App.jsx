import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  User, 
  MapPin, 
  Phone, 
  ShoppingCart, 
  Printer, 
  BarChart3, 
  Package, 
  Settings,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Tag,
  Search,
  Download,
  Calendar
} from 'lucide-react';

// Importar os componentes das outras abas
import ClientesTab from './components/ClientesTab.jsx';
import ProdutosTab from './components/ProdutosTab.jsx';
import CategoriasTab from './components/CategoriasTab.jsx';
import RelatoriosTab from './components/RelatoriosTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import PWAInstallPrompt, { PWAInstallButton } from './components/PWAInstallPrompt.jsx';
import Modal, { useModal } from './components/Modal.jsx';
import appSettings from './services/AppSettings.js';
import PDFReportService from './services/PDFReportService.js';


// Função para formatar telefone
const formatPhone = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara (85) 99999-9999
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  }
};

// Função para formatar CNPJ
const formatCNPJ = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').trim();
};

// Função para formatar CPF
const formatCPF = (value) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').trim();
};

// Função para formatar moeda
const formatCurrency = (value) => {
  const numbers = value.replace(/\D/g, '');
  const amount = parseFloat(numbers) / 100;
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const parseCurrency = (value) => {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
};

const NewOrderModal = ({ isOpen, onClose, onSave, customers, products }) => {
  const { modal: orderModal, showAlert } = useModal();
  
  // Estados separados para evitar re-render desnecessário
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Estado para filtro de clientes
  const [customerFilter, setCustomerFilter] = useState('');
  
  // Estados para novo cliente com máscaras
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCustomer(null);
      setShowNewCustomer(false);
      setOrderItems([]);
      setNotes('');
      setNewCustomer({ name: '', phone: '', address: '' });
      setCustomerFilter('');
    }
  }, [isOpen]);

  const handleCustomerChange = (e) => {
    const customerId = parseInt(e.target.value);
    const customer = customers.find(c => c.id === customerId);
    setSelectedCustomer(customer);
    setShowNewCustomer(false);
  };

  const handleNewCustomerChange = (field, value) => {
    let formattedValue = value;
    
    // Aplicar máscara conforme o campo
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setNewCustomer(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const addItem = () => {
    setOrderItems(prev => [...prev, { 
      product: null, 
      quantity: 1, 
      price: 0 
    }]);
  };

  const removeItem = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setOrderItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      
      if (field === 'product') {
        const product = products.find(p => p.id === parseInt(value));
        return {
          ...item,
          product,
          price: product ? product.price : 0  // Pega o preço do banco
        };
      } else if (field === 'quantity') {
        return {
          ...item,
          quantity: Math.max(1, parseInt(value) || 1)
        };
      } else if (field === 'price') {
        return {
          ...item,
          price: Math.max(0, parseFloat(value) || 0)
        };
      }
      
      return item;
    }));
  };

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    const searchTerm = customerFilter.toLowerCase();
    return customer.name.toLowerCase().includes(searchTerm) ||
           (customer.address && customer.address.toLowerCase().includes(searchTerm));
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!selectedCustomer && !showNewCustomer) {
      showAlert('Selecione um cliente ou cadastre um novo', 'warning');
      return;
    }
    
    if (showNewCustomer && (!newCustomer.name.trim() || !newCustomer.phone.trim())) {
      showAlert('Preencha nome e telefone do novo cliente', 'warning');
      return;
    }
    
    if (orderItems.length === 0) {
      showAlert('Adicione pelo menos um produto', 'warning');
      return;
    }
    
    const hasInvalidItems = orderItems.some(item => !item.product || item.quantity <= 0);
    if (hasInvalidItems) {
      showAlert('Verifique os produtos e quantidades', 'warning');
      return;
    }

    try {
      let customerToUse = selectedCustomer;
      
      // Criar novo cliente se necessário
      if (showNewCustomer) {
        const result = await window.electronAPI?.customers.add(newCustomer);
        if (result?.success) {
          customerToUse = result.data;
        } else {
          showAlert('Erro ao criar cliente: ' + (result?.error || 'Erro desconhecido'), 'error');
          return;
        }
      }

      // Preparar dados do pedido
      const orderData = {
        customer: customerToUse,
        items: orderItems,
        notes: notes.trim()
      };

      await onSave(orderData);
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      showAlert('Erro ao salvar pedido: ' + error.message, 'error');
    }
  };

  const total = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Novo Pedido
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* CLIENTE */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerFilter}
                      onChange={(e) => setCustomerFilter(e.target.value)}
                      placeholder="Pesquisar por nome ou endereço..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={showNewCustomer}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={handleCustomerChange}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={showNewCustomer}
                >
                  <option value="">Selecione um cliente existente</option>
                  {filteredCustomers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone} {customer.address ? `- ${customer.address}` : ''}
                    </option>
                  ))}
                </select>
                
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showNewCustomer 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {showNewCustomer ? 'Cancelar' : 'Novo Cliente'}
                </button>
              </div>

              {showNewCustomer && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => handleNewCustomerChange('name', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.phone}
                      onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(85) 99999-9999"
                      maxLength={15}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={newCustomer.address}
                      onChange={(e) => handleNewCustomerChange('address', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Endereço completo"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PRODUTOS */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Produtos
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adicionar Item
              </button>
            </div>

            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Produto
                    </label>
                    <select
                      value={item.product?.id || ''}
                      onChange={(e) => updateItem(index, 'product', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um produto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Unit. (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtotal
                    </label>
                    <div className="p-3 bg-gray-100 rounded-lg font-semibold text-gray-700">
                      R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors"
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}

              {orderItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações do pedido..."
              rows={3}
            />
          </div>

          {/* TOTAL */}
          {orderItems.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total do Pedido:</span>
                <span className="text-2xl font-bold text-green-600">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          {/* BOTÕES */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Criar Pedido
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal específico do NewOrderModal */}
      {orderModal && <Modal modal={orderModal} />}
    </div>
  );
};

const App = () => {
  const [currentTab, setCurrentTab] = useState('pedidos');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  // Modal hook para substituir alert/confirm nativos
  const { modal, showAlert, showConfirm, showPrompt } = useModal();

  // Estado para dados do banco
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtros
  const [orderFilter, setOrderFilter] = useState('');

  // Função para calcular dados do dia atual
  const getTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Filtrar pedidos do dia
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === today;
    });

    // Calcular estatísticas do dia
    const todayStats = {
      totalOrders: todayOrders.length,
      totalSales: todayOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0),
      activeCustomers: new Set(todayOrders.map(order => order.customer_id)).size,
      products: products.length
    };

    return { todayOrders, todayStats };
  };

  // Função para gerar relatório de fechamento de caixa em PDF
  const generateDailyReport = async () => {
    try {
      showAlert('Gerando relatório de fechamento de caixa...', 'info');
      
      // Coletar dados do dia usando o serviço
      const dadosDia = await PDFReportService.coletarDadosDia();
      
      // Gerar e baixar o PDF
      PDFReportService.downloadFechamentoCaixa(dadosDia);
      
      // Mostrar confirmação
      showAlert(
        `Relatório de fechamento de caixa gerado com sucesso!\n\nResumo do dia:\n• Vendas: R$ ${dadosDia.vendasDia.toFixed(2).replace('.', ',')}\n• Pedidos: ${dadosDia.pedidosDia}\n• Clientes atendidos: ${dadosDia.clientesAtivos}\n• Produtos vendidos: ${dadosDia.produtosVendidos}\n\nO relatório foi salvo em PDF.`,
        'success'
      );
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      showAlert('Erro ao gerar relatório de fechamento de caixa: ' + error.message, 'error');
    }
  };

  // Função para recarregar dados
  const loadData = async () => {
  try {
    console.log('App: Carregando dados...');
    
    // Detectar se está no Electron ou modo web
    const isElectron = window.electronAPI !== undefined;
    
    if (isElectron) {
      console.log('App: Modo Electron detectado');
      
      // Carregar clientes
      console.log('App: Carregando clientes...');
      const customersResult = await window.electronAPI.customers.getAll();
      console.log('App: Resultado clientes:', customersResult);
      if (customersResult?.success) {
        setCustomers(customersResult.data);
        console.log('App: Clientes carregados:', customersResult.data.length);
      } else {
        console.error('Erro ao carregar clientes:', customersResult?.error);
      }

      // Carregar produtos
      console.log('App: Carregando produtos...');
      const productsResult = await window.electronAPI.products.getAll();
      console.log('App: Resultado produtos:', productsResult);
      if (productsResult?.success) {
        setProducts(productsResult.data);
        console.log('App: Produtos carregados:', productsResult.data.length);
      } else {
        console.error('Erro ao carregar produtos:', productsResult?.error);
      }

      // Carregar pedidos
      console.log('App: Carregando pedidos...');
      const ordersResult = await window.electronAPI.orders.getAll(50);
      console.log('App: Resultado pedidos:', ordersResult);
      if (ordersResult?.success) {
        setOrders(ordersResult.data);
        console.log('App: Pedidos carregados:', ordersResult.data.length);
      } else {
        console.error('Erro ao carregar pedidos:', ordersResult?.error);
      }
    } else {
      console.log('App: Modo Web detectado - usando WebStorageService');
      
      // Importar WebStorageService
      const WebStorageService = (await import('./services/WebStorageService.js')).default;
      const webStorage = new WebStorageService();
      
      // Carregar dados do WebStorage
      const customers = webStorage.getCustomers();
      const products = webStorage.getProducts();
      const orders = webStorage.getOrders(50);
      
      setCustomers(customers);
      setProducts(products);
      setOrders(orders);
      
      console.log('App: Dados carregados do WebStorage:', {
        customers: customers.length,
        products: products.length,
        orders: orders.length
      });
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showAlert('Erro ao carregar dados: ' + error.message, 'error');
  }
};

  // Carregar dados do banco ao inicializar
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };

    initializeData();
  }, []);

  const handleNewOrder = async (orderData) => {
  try {
    const total = orderData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    const isElectron = window.electronAPI !== undefined;
    
    if (isElectron) {
      // Modo Electron - usar IPC
      const dbOrderData = {
        customer_id: orderData.customer.id,
        total: total,
        notes: orderData.notes || '',
        items: orderData.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const result = await window.electronAPI.orders.add(dbOrderData);
      
      if (result?.success) {
        await loadData();
        
        await handlePrintOrder({
          ...orderData,
          id: result.data.id,
          total: total
        });
        
        setShowNewOrderModal(false);
        showAlert('Pedido criado com sucesso!', 'alert', 'success');
      } else {
        throw new Error(result?.error || 'Erro ao criar pedido');
      }
    } else {
      // Modo web - usar WebStorageService
      const WebStorageService = (await import('./services/WebStorageService.js')).default;
      const webStorage = new WebStorageService();
      
      const dbOrderData = {
        customer_id: orderData.customer.id,
        customer_name: orderData.customer.name,
        total: total,
        notes: orderData.notes || '',
        items: orderData.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.price
        }))
      };

      const result = webStorage.addOrder(dbOrderData);
      
      if (result) {
        await loadData();
        
        console.log('Pedido criado no modo web:', {
          id: result.id,
          customer: orderData.customer.name,
          total: total
        });
        
        setShowNewOrderModal(false);
        showAlert('Pedido criado com sucesso!', 'success');
      } else {
        throw new Error('Erro ao criar pedido no WebStorage');
      }
    }
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    showAlert(`Erro ao criar pedido: ${error.message}`, 'error');
  }
};

const handlePrintOrder = async (order) => {
  try {
    // Importar dinamicamente o PrinterAdapter
    const PrinterAdapter = (await import('./services/PrinterAdapter.js')).default;
    
    // Buscar dados necessários
    const customer = customers.find(c => c.id === order.customer_id);
    
    console.log('🖨️ Iniciando impressão:', {
      order: order.id,
      customer: customer?.name,
      mode: PrinterAdapter.getMode()
    });
    
    const result = await PrinterAdapter.printOrder(order, customer, products);
    
    if (result?.success) {
      console.log('✅ Pedido impresso com sucesso');
      showAlert('Pedido enviado para impressão!', 'success');
    } else {
      console.error('❌ Erro na impressão:', result?.error);
      showAlert(`Erro na impressão: ${result?.error || 'Erro desconhecido'}`, 'error');
    }
  } catch (error) {
    console.error('❌ Erro ao imprimir:', error);
    showAlert('Erro ao conectar com o sistema de impressão', 'error');
  }
};

  const tabs = [
    { id: 'pedidos', name: 'Pedidos', icon: ShoppingCart },
    { id: 'clientes', name: 'Clientes', icon: User },
    { id: 'produtos', name: 'Produtos', icon: Package },
    { id: 'categorias', name: 'Categorias', icon: Tag },
    { id: 'relatorios', name: 'Relatórios', icon: BarChart3 },
    { id: 'configuracoes', name: 'Configurações', icon: Settings }
  ];

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    if (!orderFilter) return true;
    
    const searchTerm = orderFilter.toLowerCase();
    const customerName = order.customer_name?.toLowerCase() || '';
    
    // Buscar o cliente pelo ID para pegar o endereço
    const customer = customers.find(c => c.id === order.customer_id);
    const customerAddress = customer?.address?.toLowerCase() || '';
    
    return customerName.includes(searchTerm) || customerAddress.includes(searchTerm);
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-xl shadow-md">
                <img 
                  src="/logo_site.png" 
                  alt="Logo Fonte de Vida" 
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    // Fallback para o ícone se a imagem não carregar
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-xl" style={{display: 'none'}}>
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fonte de Vida</h1>
                <p className="text-gray-600">Sistema de Gerenciamento de Pedidos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <PWAInstallButton />
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    currentTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentTab === 'pedidos' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-gray-900">Gerenciar Pedidos</h2>
                  <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <Calendar className="h-4 w-4" />
                    <span>Dados de hoje: {new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={generateDailyReport}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Download className="h-5 w-5" />
                    <span>Fechar Caixa</span>
                  </button>
                  <button
                    onClick={() => setShowNewOrderModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Novo Pedido</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              {(() => {
                const { todayStats } = getTodayData();
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{todayStats.totalOrders}</h3>
                          <p className="text-gray-600">Pedidos do Dia</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{todayStats.activeCustomers}</h3>
                          <p className="text-gray-600">Clientes Atendidos</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Package className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{todayStats.products}</h3>
                          <p className="text-gray-600">Produtos Cadastrados</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            R$ {todayStats.totalSales.toFixed(2).replace('.', ',')}
                          </h3>
                          <p className="text-gray-600">Vendas do Dia</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Orders Table */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h3>
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                        placeholder="Filtrar por cliente ou endereço..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pedido
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.map((order) => {
                        const customer = customers.find(c => c.id === order.customer_id);
                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {order.customer_name || 'Cliente não encontrado'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {order.customer_phone || customer?.phone || ''}
                                  </div>
                                  {customer?.address && (
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {customer.address}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            R$ {parseFloat(order.total || 0).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'completed' ? 'Concluído' : 
                               order.status === 'pending' ? 'Pendente' : 'Processando'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handlePrintOrder(order)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Nenhum pedido encontrado</p>
                    <p className="text-gray-400">Crie seu primeiro pedido clicando no botão acima</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Nenhum pedido encontrado para este filtro</p>
                    <p className="text-gray-400">Tente buscar por outro nome ou endereço</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* CLIENTES TAB */}
          {currentTab === 'clientes' && (
            <ClientesTab 
              customers={customers}
              onReload={loadData}
              modal={{ showAlert, showConfirm, showPrompt }}
            />
          )}

          {/* PRODUTOS TAB */}
          {currentTab === 'produtos' && (
            <ProdutosTab 
              products={products}
              onReload={loadData}
              modal={{ showAlert, showConfirm, showPrompt }}
            />
          )}

          {/* CATEGORIAS TAB */}
          {currentTab === 'categorias' && (
            <CategoriasTab 
              onReload={loadData}
              modal={{ showAlert, showConfirm, showPrompt }}
            />
          )}

          {/* RELATÓRIOS TAB */}
          {currentTab === 'relatorios' && (
            <RelatoriosTab 
              orders={orders}
              customers={customers}
              products={products}
              onReload={loadData}
            />
          )}

          {/* CONFIGURAÇÕES TAB */}
          {currentTab === 'configuracoes' && (
            <SettingsTab 
              modal={{ showAlert, showConfirm, showPrompt }}
            />
          )}
        </div>
      </main>

      {/* Modal */}
      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSave={handleNewOrder}
        customers={customers}
        products={products}
      />

      {/* Sistema de Modais */}
      {modal && <Modal {...modal} />}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default App;