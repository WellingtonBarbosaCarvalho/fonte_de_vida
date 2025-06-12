import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Download,
  Users,
  Package,
  ShoppingCart,
  RefreshCw,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import MockDatabaseService from '../services/MockDatabaseService';

const RelatoriosTab = ({ orders, customers, products, onReload }) => {
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Detectar se está no Electron ou modo web
  const isElectron = window.electronAPI !== undefined;

  // Cores para gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

  const loadReportsData = async () => {
    try {
      setLoading(true);

      if (isElectron) {
        // Modo Electron - tentar usar IPC
        try {
          const salesResult = await window.electronAPI.reports.getSales(dateRange.startDate, dateRange.endDate);
          if (salesResult?.success) {
            setSalesData(salesResult.data);
          } else {
            setSalesData(processOrdersForSalesReport());
          }

          const productsResult = await window.electronAPI.reports.getTopProducts(10);
          if (productsResult?.success) {
            setTopProducts(productsResult.data);
          } else {
            setTopProducts(processProductsForReport());
          }
        } catch (error) {
          console.log('IPC falhou, usando dados locais:', error);
          setSalesData(processOrdersForSalesReport());
          setTopProducts(processProductsForReport());
        }
      } else {
        // Modo Web - usar dados locais passados como props
        console.log('Modo Web: Usando dados locais dos props');
        setSalesData(processOrdersForSalesReport());
        setTopProducts(processProductsForReport());
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      // Fallback para dados locais
      setSalesData(processOrdersForSalesReport());
      setTopProducts(processProductsForReport());
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Processar pedidos para relatório de vendas (fallback)
  const processOrdersForSalesReport = () => {
    if (!orders || orders.length === 0) return [];

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    });

    const salesByDate = filteredOrders.reduce((acc, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          total_orders: 0,
          total_sales: 0
        };
      }
      acc[date].total_orders += 1;
      acc[date].total_sales += parseFloat(order.total || 0);
      return acc;
    }, {});

    return Object.values(salesByDate).map(day => ({
      ...day,
      avg_order_value: day.total_orders > 0 ? day.total_sales / day.total_orders : 0
    }));
  };

  // Processar produtos para relatório (fallback)
  const processProductsForReport = () => {
    if (!products || products.length === 0) return [];

    return products
      .map(product => ({
        name: product.name,
        category: product.category,
        price: product.price,
        total_sold: product.total_quantity_sold || 0,
        total_revenue: (product.total_quantity_sold || 0) * product.price
      }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 10);
  };

  useEffect(() => {
    loadReportsData();
  }, [dateRange.startDate, dateRange.endDate, orders, products, isElectron]);

  // Auto-refresh dos relatórios
  useEffect(() => {
    let refreshInterval;
    let countdownInterval;
    
    // Obter configuração de auto refresh do localStorage
    try {
      const settings = JSON.parse(localStorage.getItem('fontevida_settings') || '{}');
      const autoRefreshSeconds = settings.relatorios?.auto_refresh || 300; // 5 minutos padrão
      
      if (autoRefreshSeconds > 0) {
        setAutoRefreshEnabled(true);
        
        refreshInterval = setInterval(() => {
          console.log('🔄 Auto-refresh dos relatórios...');
          if (onReload) onReload(); // Recarregar dados principais
          loadReportsData(); // Recarregar relatórios específicos
        }, autoRefreshSeconds * 1000);
        
        // Contador regressivo opcional
        let countdown = autoRefreshSeconds;
        countdownInterval = setInterval(() => {
          countdown--;
          setNextRefreshIn(countdown);
          if (countdown <= 0) {
            countdown = autoRefreshSeconds;
          }
        }, 1000);
      } else {
        setAutoRefreshEnabled(false);
      }
    } catch (error) {
      console.warn('Erro ao configurar auto-refresh:', error);
      setAutoRefreshEnabled(false);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [onReload]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = async () => {
    console.log('🔄 Atualizando relatórios manualmente...');
    if (onReload) await onReload(); // Recarregar dados principais
    await loadReportsData(); // Recarregar relatórios específicos
  };

  // Estatísticas gerais
  const totalSales = salesData.reduce((sum, day) => sum + parseFloat(day.total_sales || 0), 0);
  const totalOrders = salesData.reduce((sum, day) => sum + parseInt(day.total_orders || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const salesGrowth = salesData.length > 1 
    ? ((parseFloat(salesData[0]?.total_sales || 0) - parseFloat(salesData[salesData.length - 1]?.total_sales || 0)) / parseFloat(salesData[salesData.length - 1]?.total_sales || 1)) * 100 
    : 0;

  // Preparar dados para gráfico de vendas por dia
  const chartSalesData = salesData.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    vendas: parseFloat(day.total_sales || 0),
    pedidos: parseInt(day.total_orders || 0),
    ticket_medio: parseFloat(day.avg_order_value || 0)
  })).reverse();

  // Preparar dados para gráfico de produtos
  const chartProductsData = topProducts.slice(0, 8).map(product => ({
    name: product.name && product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name || 'Produto',
    vendas: parseInt(product.total_sold || 0),
    receita: parseFloat(product.total_revenue || 0)
  }));

  // Preparar dados para pizza de categorias
  const categoryData = topProducts.reduce((acc, product) => {
    const category = product.category || 'Outros';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, receita: 0 };
    }
    acc[category].value += parseInt(product.total_sold || 0);
    acc[category].receita += parseFloat(product.total_revenue || 0);
    return acc;
  }, {});

  const pieData = Object.values(categoryData);

  const exportReport = () => {
    const reportData = {
      periodo: `${dateRange.startDate} até ${dateRange.endDate}`,
      modo: isElectron ? 'Desktop' : 'Web',
      resumo: {
        totalVendas: totalSales,
        totalPedidos: totalOrders,
        ticketMedio: avgOrderValue,
        crescimento: salesGrowth
      },
      vendasPorDia: salesData,
      produtosMaisVendidos: topProducts,
      categorias: pieData,
      clientesAtivos: customers?.length || 0,
      produtosCadastrados: products?.length || 0
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_vendas_${dateRange.startDate}_${dateRange.endDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios e Análises</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-gray-500">
              {isElectron ? 'Modo Desktop' : 'Modo Web - Dados simulados'}
            </p>
            {autoRefreshEnabled && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600">Auto-atualização ativa</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={exportReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-700">Período:</span>
          <div className="flex gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data Inicial</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data Final</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {totalSales.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {avgOrderValue.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Crescimento</p>
              <p className={`text-2xl font-bold ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${salesGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`h-6 w-6 ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Dia</h3>
          {chartSalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'vendas' ? `R$ ${value.toFixed(2)}` : value,
                    name === 'vendas' ? 'Vendas' : name === 'pedidos' ? 'Pedidos' : 'Ticket Médio'
                  ]}
                />
                <Legend />
                <Line type="monotone" dataKey="vendas" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="pedidos" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Nenhum dado de vendas para o período selecionado
            </div>
          )}
        </div>

        {/* Products Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          {chartProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartProductsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [value, 'Unidades Vendidas']} />
                <Bar dataKey="vendas" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Nenhum produto vendido no período
            </div>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Categoria</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Nenhuma categoria com vendas no período
            </div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Produtos</h3>
          <div className="overflow-y-auto max-h-[300px]">
            {topProducts.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium text-gray-700">#</th>
                    <th className="text-left p-2 font-medium text-gray-700">Produto</th>
                    <th className="text-right p-2 font-medium text-gray-700">Vendidos</th>
                    <th className="text-right p-2 font-medium text-gray-700">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 10).map((product, index) => (
                    <tr key={product.name || index} className="border-b border-gray-100">
                      <td className="p-2 font-medium text-gray-900">{index + 1}</td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {product.name || 'Produto sem nome'}
                          </div>
                          <div className="text-xs text-gray-500">{product.category || 'Sem categoria'}</div>
                        </div>
                      </td>
                      <td className="p-2 text-right font-medium">
                        {product.total_sold || 0} un
                      </td>
                      <td className="p-2 text-right font-medium text-green-600">
                        R$ {parseFloat(product.total_revenue || 0).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum produto encontrado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Dia com Mais Vendas</p>
              <p className="text-xl font-bold">
                {salesData.length > 0 
                  ? new Date(salesData.reduce((max, day) => 
                      parseFloat(day.total_sales) > parseFloat(max.total_sales) ? day : max
                    ).date).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-blue-100">
                {salesData.length > 0 
                  ? `R$ ${salesData.reduce((max, day) => 
                      parseFloat(day.total_sales) > parseFloat(max.total_sales) ? day : max
                    ).total_sales}`
                  : 'R$ 0,00'
                }
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Produto Mais Vendido</p>
              <p className="text-xl font-bold line-clamp-1">
                {topProducts.length > 0 ? topProducts[0].name : 'N/A'}
              </p>
              <p className="text-sm text-green-100">
                {topProducts.length > 0 ? `${topProducts[0].total_sold} unidades` : '0 unidades'}
              </p>
            </div>
            <Package className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Categoria Líder</p>
              <p className="text-xl font-bold">
                {pieData.length > 0 
                  ? pieData.reduce((max, cat) => cat.value > max.value ? cat : max).name
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-purple-100">
                {pieData.length > 0 
                  ? `${pieData.reduce((max, cat) => cat.value > max.value ? cat : max).value} unidades`
                  : '0 unidades'
                }
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {salesData.length === 0 && topProducts.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum dado encontrado
          </h3>
          <p className="text-gray-600">
            Não há vendas registradas no período selecionado.
          </p>
        </div>
      )}
    </div>
  );
};

export default RelatoriosTab;
