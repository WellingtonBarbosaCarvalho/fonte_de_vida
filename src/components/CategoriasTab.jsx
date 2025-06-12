import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertCircle,
  Save,
  X,
  Hash,
  Tag
} from 'lucide-react';

const CategoryModal = ({ isOpen, onClose, onSave, category = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
          color: category.color || '#3B82F6'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: '#3B82F6'
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
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
      newErrors.name = 'Nome da categoria é obrigatório';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim()
      });
    }
  };

  if (!isOpen) return null;

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Águas Minerais"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descrição da categoria..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor da Categoria
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleChange('color', color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.color === color 
                      ? 'border-gray-700 scale-110' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {category ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoriasTab = ({ onReload, modal }) => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsCount, setProductsCount] = useState({});

  // Detectar se está no Electron ou modo web
  const isElectron = window.electronAPI !== undefined;

  // Carregar contagem de produtos por categoria
  const loadProductsCount = () => {
    try {
      const productsData = localStorage.getItem('fontevida_products');
      if (productsData) {
        const products = JSON.parse(productsData);
        const counts = products.reduce((acc, product) => {
          const category = product.category || 'Sem categoria';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
        setProductsCount(counts);
      }
    } catch (error) {
      console.error('Erro ao carregar contagem de produtos:', error);
      setProductsCount({});
    }
  };

  // Carregar categorias
  const loadCategories = async () => {
    try {
      setLoading(true);
      
      if (isElectron) {
        // Modo Electron - usar IPC se disponível
        try {
          const result = await window.electronAPI.categories?.getAll();
          if (result?.success) {
            setCategories(result.data);
          } else {
            // Fallback para localStorage
            await loadCategoriesFromStorage();
          }
        } catch (error) {
          console.log('IPC falhou, usando localStorage:', error);
          await loadCategoriesFromStorage();
        }
      } else {
        // Modo Web - usar localStorage
        await loadCategoriesFromStorage();
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesFromStorage = async () => {
    try {
      const stored = localStorage.getItem('fontevida_categories');
      if (stored) {
        setCategories(JSON.parse(stored));
      } else {
        // Criar categorias padrão se não existirem
        const defaultCategories = [
          {
            id: 1,
            name: 'Águas Minerais',
            description: 'Águas minerais e galões',
            color: '#3B82F6',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Bebidas',
            description: 'Refrigerantes e sucos',
            color: '#10B981',
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            name: 'Acessórios',
            description: 'Bombas, suportes e outros acessórios',
            color: '#F59E0B',
            created_at: new Date().toISOString()
          }
        ];
        setCategories(defaultCategories);
        localStorage.setItem('fontevida_categories', JSON.stringify(defaultCategories));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias do localStorage:', error);
      setCategories([]);
    }
  };

  // Salvar categorias no localStorage
  const saveCategoriesStorage = (updatedCategories) => {
    try {
      localStorage.setItem('fontevida_categories', JSON.stringify(updatedCategories));
      // Disparar evento customizado para notificar outras abas
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (error) {
      console.error('Erro ao salvar categorias:', error);
    }
  };

  // Filtrar categorias
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Carregar categorias ao inicializar
  useEffect(() => {
    loadCategories();
    loadProductsCount();
  }, []);

  // Recarregar contagem quando categorias mudarem
  useEffect(() => {
    loadProductsCount();
  }, [categories]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      setLoading(true);
      
      let updatedCategories;
      
      if (selectedCategory) {
        // Atualizar categoria existente
        updatedCategories = categories.map(cat => 
          cat.id === selectedCategory.id 
            ? { ...selectedCategory, ...categoryData, updated_at: new Date().toISOString() }
            : cat
        );
      } else {
        // Adicionar nova categoria
        const newCategory = {
          id: Date.now(), // ID simples baseado em timestamp
          ...categoryData,
          created_at: new Date().toISOString()
        };
        updatedCategories = [...categories, newCategory];
      }

      setCategories(updatedCategories);
      saveCategoriesStorage(updatedCategories);
      loadProductsCount(); // Atualizar contagem
      
      if (onReload) {
        await onReload(); // Recarregar produtos para atualizar referências
      }
      
      setShowModal(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      modal.showAlert('Erro ao salvar categoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    // Verificar se há produtos usando esta categoria
    let productsUsingCategory = 0;
    try {
      const productsData = localStorage.getItem('fontevida_products');
      if (productsData) {
        const products = JSON.parse(productsData);
        productsUsingCategory = products.filter(p => p.category === category.name).length;
      }
    } catch (error) {
      console.error('Erro ao verificar produtos:', error);
    }

    let confirmMessage = `Tem certeza que deseja excluir a categoria "${category.name}"?`;
    if (productsUsingCategory > 0) {
      confirmMessage += `\n\nExistem ${productsUsingCategory} produto(s) usando esta categoria. Eles serão movidos para a categoria "Sem categoria".`;
    }
    confirmMessage += '\n\nEsta ação não pode ser desfeita.';

    modal.showConfirm(
      confirmMessage,
      'Confirmar Exclusão',
      async () => {
        try {
          setLoading(true);
          
          // Atualizar produtos que usam esta categoria
          if (productsUsingCategory > 0) {
            try {
              const productsData = localStorage.getItem('fontevida_products');
              if (productsData) {
                const products = JSON.parse(productsData);
                const updatedProducts = products.map(product => {
                  if (product.category === category.name) {
                    return { ...product, category: 'Sem categoria' };
                  }
                  return product;
                });
                localStorage.setItem('fontevida_products', JSON.stringify(updatedProducts));
              }
            } catch (error) {
              console.error('Erro ao atualizar produtos:', error);
            }
          }
          
          // Remover categoria
          const updatedCategories = categories.filter(cat => cat.id !== category.id);
          setCategories(updatedCategories);
          saveCategoriesStorage(updatedCategories);
          loadProductsCount(); // Atualizar contagem
          
          if (onReload) {
            await onReload(); // Recarregar produtos para atualizar referências
          }

          modal.showAlert(`Categoria "${category.name}" excluída com sucesso!` + 
                (productsUsingCategory > 0 ? ` ${productsUsingCategory} produto(s) foram movidos para "Sem categoria".` : ''), 'success');
        } catch (error) {
          console.error('Erro ao excluir categoria:', error);
          modal.showAlert('Erro ao excluir categoria', 'error');
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
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Categorias</h2>
          <p className="text-sm text-gray-500">
            Organize seus produtos em categorias para melhor controle
          </p>
        </div>
        <button
          onClick={handleAddCategory}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total de Categorias</p>
              <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Categorias Ativas</p>
              <p className="text-2xl font-bold text-green-600">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Hash className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Filtradas</p>
              <p className="text-2xl font-bold text-purple-600">{filteredCategories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map(category => (
          <div key={category.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div 
              className="h-4 rounded-t-xl"
              style={{ backgroundColor: category.color }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Criada em {new Date(category.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {productsCount[category.name] || 0} produto(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Tag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Tente alterar os termos da busca' 
              : 'Comece criando sua primeira categoria de produtos'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={handleAddCategory}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Criar Primeira Categoria</span>
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando categorias...</p>
        </div>
      )}

      {/* Modal */}
      <CategoryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCategory(null);
        }}
        onSave={handleSaveCategory}
        category={selectedCategory}
      />
    </div>
  );
};

export default CategoriasTab;
