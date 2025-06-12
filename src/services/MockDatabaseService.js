// MockDatabaseService.js - Versão web com localStorage
class MockDatabaseService {
  constructor() {
    this.storagePrefix = "fontevida_";
    this.initializeData();
  }

  initializeData() {
    // Inicializar com dados de exemplo se não existirem
    if (!this.getFromStorage("customers")) {
      this.setToStorage("customers", [
        {
          id: 1,
          name: "João Silva",
          phone: "(85) 99999-9999",
          address: "Rua das Flores, 123",
        },
        {
          id: 2,
          name: "Maria Santos",
          phone: "(85) 88888-8888",
          address: "Av. Principal, 456",
        },
      ]);
    }

    if (!this.getFromStorage("products")) {
      this.setToStorage("products", [
        {
          id: 1,
          name: "Açaí 500ml",
          category: "Bebidas",
          price: 8.5,
          stock: 50,
        },
        {
          id: 2,
          name: "Vitamina de Banana",
          category: "Vitaminas",
          price: 6.0,
          stock: 30,
        },
        {
          id: 3,
          name: "Sanduíche Natural",
          category: "Lanches",
          price: 12.0,
          stock: 20,
        },
      ]);
    }

    if (!this.getFromStorage("orders")) {
      this.setToStorage("orders", []);
    }

    if (!this.getFromStorage("nextId")) {
      this.setToStorage("nextId", { customers: 3, products: 4, orders: 1 });
    }
  }

  getFromStorage(key) {
    try {
      const data = localStorage.getItem(this.storagePrefix + key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erro ao ler localStorage:", error);
      return null;
    }
  }

  setToStorage(key, data) {
    try {
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao salvar localStorage:", error);
    }
  }

  getNextId(type) {
    const nextIds = this.getFromStorage("nextId") || {
      customers: 1,
      products: 1,
      orders: 1,
    };
    const nextId = nextIds[type] || 1;
    nextIds[type] = nextId + 1;
    this.setToStorage("nextId", nextIds);
    return nextId;
  }

  // =================== CUSTOMERS ===================
  getCustomers() {
    return this.getFromStorage("customers") || [];
  }

  addCustomer(customer) {
    const customers = this.getCustomers();
    const newCustomer = {
      id: this.getNextId("customers"),
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      created_at: new Date().toISOString(),
      total_orders: 0,
      total_spent: 0,
    };

    customers.push(newCustomer);
    this.setToStorage("customers", customers);

    console.log("Mock DB: Cliente adicionado:", newCustomer);
    return newCustomer;
  }

  updateCustomer(id, customer) {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === parseInt(id));

    if (index === -1) {
      throw new Error("Cliente não encontrado");
    }

    customers[index] = {
      ...customers[index],
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      updated_at: new Date().toISOString(),
    };

    this.setToStorage("customers", customers);

    console.log("Mock DB: Cliente atualizado:", customers[index]);
    return customers[index];
  }

  deleteCustomer(id) {
    const customers = this.getCustomers();
    const filteredCustomers = customers.filter((c) => c.id !== parseInt(id));

    if (customers.length === filteredCustomers.length) {
      throw new Error("Cliente não encontrado");
    }

    this.setToStorage("customers", filteredCustomers);
    console.log("Mock DB: Cliente deletado ID:", id);
    return true;
  }

  // =================== PRODUCTS ===================
  getProducts() {
    return this.getFromStorage("products") || [];
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProduct = {
      id: this.getNextId("products"),
      name: product.name,
      category: product.category || "Geral",
      price: parseFloat(product.price) || 0,
      stock: parseInt(product.stock) || 0,
      description: product.description || "",
      created_at: new Date().toISOString(),
      total_quantity_sold: 0,
    };

    products.push(newProduct);
    this.setToStorage("products", products);

    console.log("Mock DB: Produto adicionado:", newProduct);
    return newProduct;
  }

  updateProduct(id, product) {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === parseInt(id));

    if (index === -1) {
      throw new Error("Produto não encontrado");
    }

    products[index] = {
      ...products[index],
      name: product.name,
      category: product.category || "Geral",
      price: parseFloat(product.price) || 0,
      stock: parseInt(product.stock) || 0,
      description: product.description || "",
      updated_at: new Date().toISOString(),
    };

    this.setToStorage("products", products);

    console.log("Mock DB: Produto atualizado:", products[index]);
    return products[index];
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filteredProducts = products.filter((p) => p.id !== parseInt(id));

    if (products.length === filteredProducts.length) {
      throw new Error("Produto não encontrado");
    }

    this.setToStorage("products", filteredProducts);
    console.log("Mock DB: Produto deletado ID:", id);
    return true;
  }

  // =================== ORDERS ===================
  getOrders(limit = 50) {
    const orders = this.getFromStorage("orders") || [];
    return orders
      .slice(0, limit)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  addOrder(orderData) {
    const orders = this.getOrders();
    const orderId = this.getNextId("orders");

    const newOrder = {
      id: orderId,
      customer_id: orderData.customer_id,
      customer_name: orderData.customer_name || "Cliente sem nome",
      items: orderData.items || [],
      subtotal: parseFloat(orderData.subtotal) || 0,
      discount: parseFloat(orderData.discount) || 0,
      total: parseFloat(orderData.total) || 0,
      status: orderData.status || "pending",
      created_at: new Date().toISOString(),
      notes: orderData.notes || "",
    };

    orders.push(newOrder);
    this.setToStorage("orders", orders);

    // Atualizar estatísticas do cliente
    this.updateCustomerStats(orderData.customer_id, newOrder.total);

    // Atualizar estatísticas dos produtos
    this.updateProductsStats(orderData.items);

    console.log("Mock DB: Pedido adicionado:", newOrder);
    return orderId;
  }

  updateCustomerStats(customerId, orderTotal) {
    if (!customerId) return;

    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === parseInt(customerId));

    if (customer) {
      customer.total_orders = (customer.total_orders || 0) + 1;
      customer.total_spent = (customer.total_spent || 0) + orderTotal;
      this.setToStorage("customers", customers);
    }
  }

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
      this.setToStorage("products", products);
      console.log("Mock DB: Estatísticas dos produtos atualizadas");
    }
  }

  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === parseInt(orderId));

    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      this.setToStorage("orders", orders);
    }
  }

  deleteOrder(orderId) {
    const orders = this.getOrders();
    const filteredOrders = orders.filter((o) => o.id !== parseInt(orderId));
    this.setToStorage("orders", filteredOrders);
    return true;
  }

  // =================== REPORTS ===================
  getSalesReport(startDate, endDate) {
    const orders = this.getOrders();
    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at).toISOString().split("T")[0];
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Agrupar por data
    const salesByDate = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          total_orders: 0,
          total_sales: 0,
        };
      }
      salesByDate[date].total_orders += 1;
      salesByDate[date].total_sales += order.total;
    });

    return Object.values(salesByDate).map((day) => ({
      ...day,
      avg_order_value:
        day.total_orders > 0 ? day.total_sales / day.total_orders : 0,
    }));
  }

  getTopProducts(limit = 10) {
    const products = this.getProducts();
    return products
      .map((product) => ({
        ...product,
        total_sold: product.total_quantity_sold || 0,
        total_revenue: (product.total_quantity_sold || 0) * product.price,
      }))
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit);
  }

  // =================== UTILITY ===================
  backup() {
    console.log("Mock DB: Backup realizado (dados em localStorage)");
  }

  close() {
    console.log("Mock DB: Conexão fechada");
  }

  clearData() {
    ["customers", "products", "orders", "nextId"].forEach((key) => {
      localStorage.removeItem(this.storagePrefix + key);
    });
    this.initializeData();
  }
}

// Exportar instância singleton
const mockDatabaseService = new MockDatabaseService();
export default mockDatabaseService;
