// Serviço de persistência para modo web usando LocalStorage
class WebStorageService {
  constructor() {
    this.storageKeys = {
      customers: "fonte_vida_customers",
      products: "fonte_vida_products",
      orders: "fonte_vida_orders",
      settings: "fonte_vida_settings",
    };

    // Inicializar dados padrão se não existirem
    this.initializeDefaultData();
  }

  // Inicializar dados padrão
  initializeDefaultData() {
    if (!this.getCustomers().length) {
      const defaultCustomers = [
        {
          id: 1,
          name: "Cliente Exemplo",
          phone: "(11) 99999-9999",
          address: "Rua Exemplo, 123",
          created_at: new Date().toISOString(),
        },
      ];
      this.saveToStorage(this.storageKeys.customers, defaultCustomers);
    }

    if (!this.getProducts().length) {
      const defaultProducts = [
        {
          id: 1,
          name: "Produto Exemplo",
          price: 10.0,
          description: "Produto de demonstração",
          category: "Geral",
          stock: 100,
          total_quantity_sold: 0,
          created_at: new Date().toISOString(),
        },
      ];
      this.saveToStorage(this.storageKeys.products, defaultProducts);
    }
  }

  // Salvar no localStorage
  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error);
      return false;
    }
  }

  // Carregar do localStorage
  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Erro ao carregar do localStorage:", error);
      return [];
    }
  }

  // Gerar ID único
  generateId(items) {
    return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  // =================== CUSTOMERS ===================
  getCustomers() {
    return this.loadFromStorage(this.storageKeys.customers);
  }

  addCustomer(customerData) {
    const customers = this.getCustomers();
    const newCustomer = {
      id: this.generateId(customers),
      ...customerData,
      created_at: new Date().toISOString(),
    };

    customers.push(newCustomer);
    this.saveToStorage(this.storageKeys.customers, customers);
    return newCustomer;
  }

  updateCustomer(id, customerData) {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);

    if (index !== -1) {
      customers[index] = { ...customers[index], ...customerData };
      this.saveToStorage(this.storageKeys.customers, customers);
      return customers[index];
    }

    throw new Error("Cliente não encontrado");
  }

  deleteCustomer(id) {
    const customers = this.getCustomers();
    const filteredCustomers = customers.filter((c) => c.id !== id);

    if (filteredCustomers.length < customers.length) {
      this.saveToStorage(this.storageKeys.customers, filteredCustomers);
      return true;
    }

    throw new Error("Cliente não encontrado");
  }

  // =================== PRODUCTS ===================
  getProducts() {
    return this.loadFromStorage(this.storageKeys.products);
  }

  addProduct(productData) {
    const products = this.getProducts();
    const newProduct = {
      id: this.generateId(products),
      ...productData,
      total_quantity_sold: 0,
      created_at: new Date().toISOString(),
    };

    products.push(newProduct);
    this.saveToStorage(this.storageKeys.products, products);
    return newProduct;
  }

  updateProduct(id, productData) {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);

    if (index !== -1) {
      products[index] = { ...products[index], ...productData };
      this.saveToStorage(this.storageKeys.products, products);
      return products[index];
    }

    throw new Error("Produto não encontrado");
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filteredProducts = products.filter((p) => p.id !== id);

    if (filteredProducts.length < products.length) {
      this.saveToStorage(this.storageKeys.products, filteredProducts);
      return true;
    }

    throw new Error("Produto não encontrado");
  }

  // =================== ORDERS ===================
  getOrders(limit = 50) {
    const orders = this.loadFromStorage(this.storageKeys.orders);
    return orders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  addOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      id: this.generateId(orders),
      ...orderData,
      status: "pendente",
      created_at: new Date().toISOString(),
    };

    orders.push(newOrder);
    this.saveToStorage(this.storageKeys.orders, orders);

    // Atualizar estatísticas dos produtos
    this.updateProductsStats(orderData.items);

    return newOrder;
  }

  updateOrderStatus(orderId, status) {
    const orders = this.loadFromStorage(this.storageKeys.orders);
    const index = orders.findIndex((o) => o.id === orderId);

    if (index !== -1) {
      orders[index].status = status;
      this.saveToStorage(this.storageKeys.orders, orders);
      return orders[index];
    }

    throw new Error("Pedido não encontrado");
  }

  deleteOrder(orderId) {
    const orders = this.loadFromStorage(this.storageKeys.orders);
    const filteredOrders = orders.filter((o) => o.id !== orderId);

    if (filteredOrders.length < orders.length) {
      this.saveToStorage(this.storageKeys.orders, filteredOrders);
      return true;
    }

    throw new Error("Pedido não encontrado");
  }

  // Atualizar estatísticas dos produtos quando pedidos são criados
  updateProductsStats(orderItems) {
    if (!orderItems || orderItems.length === 0) return;

    const products = this.getProducts();
    let hasChanges = false;

    orderItems.forEach((item) => {
      const product = products.find((p) => p.id === parseInt(item.product_id));
      if (product) {
        product.total_quantity_sold =
          (product.total_quantity_sold || 0) + parseInt(item.quantity || 0);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveToStorage(this.storageKeys.products, products);
      console.log("WebStorage: Estatísticas dos produtos atualizadas");
    }
  }

  // =================== REPORTS ===================
  getSalesReport(startDate, endDate) {
    const orders = this.loadFromStorage(this.storageKeys.orders);

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
  }

  getTopProducts(limit = 10) {
    const products = this.getProducts();

    // Usar diretamente o campo total_quantity_sold dos produtos
    return products
      .map((product) => ({
        name: product.name,
        category: product.category,
        price: product.price,
        total_sold: product.total_quantity_sold || 0,
        total_revenue: (product.total_quantity_sold || 0) * product.price,
      }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit);
  }

  // Limpar todos os dados (para desenvolvimento)
  clearAllData() {
    Object.values(this.storageKeys).forEach((key) => {
      localStorage.removeItem(key);
    });
    this.initializeDefaultData();
  }

  // Exportar dados para backup
  exportData() {
    const data = {};
    Object.entries(this.storageKeys).forEach(([key, storageKey]) => {
      data[key] = this.loadFromStorage(storageKey);
    });
    return data;
  }

  // Importar dados de backup
  importData(data) {
    Object.entries(data).forEach(([key, items]) => {
      if (this.storageKeys[key]) {
        this.saveToStorage(this.storageKeys[key], items);
      }
    });
  }
}

export default WebStorageService;
