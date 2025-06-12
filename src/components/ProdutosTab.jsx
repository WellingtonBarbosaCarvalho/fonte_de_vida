import React, { useState } from 'react';
import { 
  Plus, 
  Package, 
  DollarSign, 
  Edit, 
  Trash2, 
  Search,
  PackagePlus,
  ShoppingCart,
  Tag,
  AlertCircle
} from 'lucide-react';
import MockDatabaseService from '../services/MockDatabaseService';

const ProductModal = ({ isOpen, onClose, onSave, product, title }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    price: product?.price || '',
    stock: product?.stock || '',
    description: product?.description || ''
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);

  // Carregar categorias
  const loadCategories = () => {
    try {
      const stored = localStorage.getItem('fontevida_categories');
      if (stored) {
        setCategories(JSON.parse(stored));
      } else {
        // Categorias padrão se não existirem
        setCategories([
          { id: 1, name: 'Águas Minerais' },
          { id: 2, name: 'Bebidas' },
          { id: 3, name: 'Acessórios' }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategories([]);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price || '',
        stock: product.stock || '',
        description: product.description || ''
      });
    } else {
      setFormData({ name: '', category: '', price: '', stock: '', description: '' });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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

    if (!formData.category.trim()) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Estoque deve ser zero ou maior';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            {title}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome do produto"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <div className="flex gap-2">
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecionar categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <button
                  type="button"
                  onClick={() => modal.showAlert('Vá até a aba "Categorias" para criar sua primeira categoria!', 'info')}
                  className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm whitespace-nowrap"
                  title="Criar categoria"
                >
                  + Categoria
                </button>
              )}
            </div>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.category}
              </p>
            )}
            {categories.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  <span>
                    <strong>Nenhuma categoria encontrada!</strong>
                    <br />
                    Vá até a aba "Categorias" para criar categorias primeiro.
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descrição do produto"
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
              {product ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProdutosTab = ({ products, onReload, modal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Detectar se está no Electron ou modo web
  const isElectron = window.electronAPI !== undefined;

  // Carregar categorias disponíveis
  React.useEffect(() => {
    const loadCategories = () => {
      try {
        const stored = localStorage.getItem('fontevida_categories');
        if (stored) {
          const categories = JSON.parse(stored);
          setAvailableCategories(categories.map(cat => cat.name));
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };

    loadCategories();

    // Listener para mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'fontevida_categories') {
        loadCategories();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Listener customizado para mudanças na mesma aba
    const handleCategoriesUpdate = () => {
      loadCategories();
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, []);

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Obter categorias únicas dos produtos (fallback se não há categorias gerenciadas)
  const categories = availableCategories.length > 0 
    ? availableCategories 
    : [...new Set(products.map(p => p.category))];

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      setLoading(true);
      
      let result;
      
      if (isElectron) {
        // Modo Electron - usar IPC
        if (selectedProduct) {
          result = await window.electronAPI.products.update(selectedProduct.id, productData);
        } else {
          result = await window.electronAPI.products.add(productData);
        }
      } else {
        // Modo Web - usar WebStorageService
        const WebStorageService = (await import('../services/WebStorageService.js')).default;
        const webStorage = new WebStorageService();
        
        if (selectedProduct) {
          const updatedProduct = webStorage.updateProduct(selectedProduct.id, productData);
          result = { success: true, data: updatedProduct };
        } else {
          const newProduct = webStorage.addProduct(productData);
          result = { success: true, data: newProduct };
        }
      }

      if (result?.success) {
        await onReload();
        setShowModal(false);
        modal.showAlert(`Produto ${selectedProduct ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
      } else {
        throw new Error(result?.error || 'Erro ao salvar produto');
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      modal.showAlert(`Erro ao salvar produto: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    modal.showConfirm(
      `Tem certeza que deseja excluir o produto "${product.name}"?`,
      'Confirmar Exclusão',
      async () => {
        try {
          setLoading(true);
          
          let result;
          
          if (isElectron) {
            // Modo Electron - usar IPC
            result = await window.electronAPI.products.delete(product.id);
          } else {
            // Modo Web - usar MockDatabase
            MockDatabaseService.deleteProduct(product.id);
            result = { success: true };
          }
          
          if (result?.success) {
            await onReload();
            modal.showAlert('Produto excluído com sucesso!', 'success');
          } else {
            throw new Error(result?.error || 'Erro ao excluir produto');
          }
        } catch (error) {
          console.error('Erro ao excluir produto:', error);
          modal.showAlert(`Erro ao excluir produto: ${error.message}`, 'error');
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
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h2>
          <p className="text-sm text-gray-500">
            {isElectron ? 'Modo Desktop' : 'Modo Web - Dados salvos localmente'}
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{products.length}</h3>
              <p className="text-gray-600">Total de Produtos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                R$ {products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0).toFixed(2)}
              </h3>
              <p className="text-gray-600">Valor Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {products.reduce((sum, p) => sum + parseInt(p.stock || 0), 0)}
              </h3>
              <p className="text-gray-600">Estoque Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{categories.length}</h3>
              <p className="text-gray-600">Categorias</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar produtos por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    availableCategories.includes(product.category) 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.category}
                    {!availableCategories.includes(product.category) && (
                      <span className="ml-1" title="Categoria não encontrada">⚠️</span>
                    )}
                  </span>
                </div>
                
                <div className="flex space-x-1 ml-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    disabled={loading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Editar produto"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Excluir produto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Preço:</span>
                  <span className="text-xl font-bold text-green-600">
                    R$ {parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estoque:</span>
                  <span className={`font-medium ${
                    product.stock === 0 ? 'text-red-600' : 
                    product.stock < 10 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {product.stock} un
                  </span>
                </div>
                
                {product.total_quantity_sold > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vendido:</span>
                    <span className="font-medium text-blue-600">
                      {product.total_quantity_sold} un
                    </span>
                  </div>
                )}
              </div>

              {product.stock === 0 && (
                <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 text-center font-medium">
                    Produto em falta
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || categoryFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || categoryFilter
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece adicionando seu primeiro produto'
            }
          </p>
          {!searchTerm && !categoryFilter && (
            <button
              onClick={handleAddProduct}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg transition-all"
            >
              Adicionar Primeiro Produto
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
        title={selectedProduct ? 'Editar Produto' : 'Novo Produto'}
      />
    </div>
  );
};

export default ProdutosTab;