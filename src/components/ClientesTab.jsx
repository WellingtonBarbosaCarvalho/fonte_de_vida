import React, { useState } from 'react';
import { 
  Plus, 
  User, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2, 
  Search,
  UserPlus,
  ShoppingCart
} from 'lucide-react';
import MockDatabaseService from '../services/MockDatabaseService.js';

// Função para formatar telefone
const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  }
};

const CustomerModal = ({ isOpen, onClose, onSave, customer, title }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || ''
  });

  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || ''
      });
    } else {
      setFormData({ name: '', phone: '', address: '' });
    }
    setErrors({});
  }, [customer, isOpen]);

  const handleChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome completo do cliente"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="(85) 99999-9999"
              maxLength={15}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Endereço completo"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg transition-all"
            >
              {customer ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientesTab = ({ customers, onReload, modal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Detectar se está no Electron ou modo web
  const isElectron = window.electronAPI !== undefined;

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      setLoading(true);
      
      let result;
      
      if (isElectron) {
        // Modo Electron - usar IPC
        if (selectedCustomer) {
          result = await window.electronAPI.customers.update(selectedCustomer.id, customerData);
        } else {
          result = await window.electronAPI.customers.add(customerData);
        }
      } else {
        // Modo Web - usar WebStorageService
        const WebStorageService = (await import('../services/WebStorageService.js')).default;
        const webStorage = new WebStorageService();
        
        if (selectedCustomer) {
          const updatedCustomer = webStorage.updateCustomer(selectedCustomer.id, customerData);
          result = { success: true, data: updatedCustomer };
        } else {
          const newCustomer = webStorage.addCustomer(customerData);
          result = { success: true, data: newCustomer };
        }
      }

      if (result?.success) {
        await onReload();
        setShowModal(false);
        modal.showAlert(`Cliente ${selectedCustomer ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
      } else {
        throw new Error(result?.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      modal.showAlert(`Erro ao salvar cliente: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    modal.showConfirm(
      `Tem certeza que deseja excluir o cliente "${customer.name}"?`,
      'Confirmar Exclusão',
      async () => {
        try {
          setLoading(true);
          
          let result;
      
          if (isElectron) {
            // Modo Electron - usar IPC
            result = await window.electronAPI.customers.delete(customer.id);
          } else {
            // Modo Web - usar MockDatabase
            MockDatabaseService.deleteCustomer(customer.id);
            result = { success: true };
          }
          
          if (result?.success) {
            await onReload();
            modal.showAlert('Cliente excluído com sucesso!', 'success');
          } else {
            throw new Error(result?.error || 'Erro ao excluir cliente');
          }
        } catch (error) {
          console.error('Erro ao excluir cliente:', error);
          modal.showAlert(`Erro ao excluir cliente: ${error.message}`, 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Clientes</h2>
          <p className="text-sm text-gray-500">
            {isElectron ? 'Modo Desktop' : 'Modo Web - Dados salvos localmente'}
          </p>
        </div>
        <button
          onClick={handleAddCustomer}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{customers.length}</h3>
              <p className="text-gray-600">Total de Clientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)}
              </h3>
              <p className="text-gray-600">Pedidos Totais</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                R$ {customers.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0).toFixed(2).replace('.', ',')}
              </h3>
              <p className="text-gray-600">Total Faturado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar clientes por nome, telefone ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {customer.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Cliente #{customer.id}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    disabled={loading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Editar cliente"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Excluir cliente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {customer.phone || 'Sem telefone'}
                </div>
                
                {customer.address && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pedidos:</span>
                  <span className="font-medium text-gray-900">
                    {customer.total_orders || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Total gasto:</span>
                  <span className="font-medium text-green-600">
                    R$ {parseFloat(customer.total_spent || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Comece adicionando seu primeiro cliente'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddCustomer}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg transition-all"
            >
              Adicionar Primeiro Cliente
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <CustomerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCustomer}
        customer={selectedCustomer}
        title={selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}
      />
    </div>
  );
};

export default ClientesTab;