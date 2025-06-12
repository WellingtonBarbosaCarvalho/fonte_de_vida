const fs = require("fs");
const Database = require("better-sqlite3");
const { join } = require("path");
const { app } = require("electron");

class DatabaseService {
  constructor() {
    // Dados ficam na pasta userData do usuário
    const userDataPath = app.getPath("userData");
    const dbPath = join(userDataPath, "fontevida.db");

    console.log("Database path:", dbPath);

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL"); // Melhor performance
    this.initTables();
  }

  initTables() {
    console.log("Inicializando tabelas...");

    // Criar tabelas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      );

      -- Índices para performance
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
    `);

    this.seedData();
  }

  seedData() {
    const productCount = this.db
      .prepare("SELECT COUNT(*) as count FROM products")
      .get();

    if (productCount.count === 0) {
      console.log("Inserindo produtos padrão...");

      const insertProduct = this.db.prepare(`
        INSERT INTO products (name, price, category) VALUES (?, ?, ?)
      `);

      const defaultProducts = [
        ["Água Mineral 500ml", 2.5, "Bebidas"],
        ["Água Mineral 1L", 4.0, "Bebidas"],
        ["Água Galão 20L", 18.0, "Bebidas"],
        ["Refrigerante Coca-Cola 350ml", 5.0, "Refrigerantes"],
        ["Refrigerante Coca-Cola 2L", 12.0, "Refrigerantes"],
        ["Refrigerante Guaraná 350ml", 4.5, "Refrigerantes"],
        ["Refrigerante Guaraná 2L", 10.0, "Refrigerantes"],
        ["Suco Natural Laranja 500ml", 8.0, "Sucos"],
        ["Suco Natural Acerola 500ml", 8.5, "Sucos"],
        ["Energético Red Bull", 12.0, "Energéticos"],
        ["Cerveja Heineken 350ml", 8.0, "Alcoólicas"],
        ["Cerveja Skol 350ml", 6.0, "Alcoólicas"],
      ];

      const transaction = this.db.transaction(() => {
        defaultProducts.forEach((product) => {
          insertProduct.run(...product);
        });
      });

      transaction();
      console.log(`${defaultProducts.length} produtos inseridos.`);
    }
  }

  // =================== CUSTOMERS ===================
  getCustomers() {
    try {
      return this.db
        .prepare(
          `
        SELECT *, 
               COUNT(o.id) as total_orders,
               COALESCE(SUM(o.total), 0) as total_spent
        FROM customers c 
        LEFT JOIN orders o ON c.id = o.customer_id 
        GROUP BY c.id 
        ORDER BY c.name
      `
        )
        .all();
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      return [];
    }
  }

  addCustomer(customer) {
    try {
      console.log("DB: Adicionando cliente:", customer);

      const stmt = this.db.prepare(`
        INSERT INTO customers (name, phone, address) 
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(
        customer.name,
        customer.phone || "",
        customer.address || ""
      );

      console.log("DB: Cliente inserido com ID:", result.lastInsertRowid);

      // Retornar o cliente criado
      const newCustomer = this.db
        .prepare("SELECT * FROM customers WHERE id = ?")
        .get(result.lastInsertRowid);
      console.log("DB: Cliente retornado:", newCustomer);
      return newCustomer;
    } catch (error) {
      console.error("DB Error - addCustomer:", error);
      throw error;
    }
  }

  updateCustomer(id, customer) {
    try {
      console.log("DB: Atualizando cliente ID:", id, "com dados:", customer);

      const stmt = this.db.prepare(`
        UPDATE customers 
        SET name = ?, phone = ?, address = ? 
        WHERE id = ?
      `);
      const result = stmt.run(
        customer.name,
        customer.phone || "",
        customer.address || "",
        id
      );

      console.log("DB: Cliente atualizado, linhas afetadas:", result.changes);

      if (result.changes === 0) {
        throw new Error("Cliente não encontrado para atualização");
      }

      // Retornar o cliente atualizado
      const updatedCustomer = this.db
        .prepare("SELECT * FROM customers WHERE id = ?")
        .get(id);
      console.log("DB: Cliente atualizado retornado:", updatedCustomer);
      return updatedCustomer;
    } catch (error) {
      console.error("DB Error - updateCustomer:", error);
      throw error;
    }
  }

  deleteCustomer(id) {
    try {
      // Verificar se tem pedidos
      const hasOrders = this.db
        .prepare("SELECT COUNT(*) as count FROM orders WHERE customer_id = ?")
        .get(id);

      if (hasOrders.count > 0) {
        throw new Error("Não é possível excluir cliente com pedidos.");
      }

      const stmt = this.db.prepare("DELETE FROM customers WHERE id = ?");
      return stmt.run(id);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      throw error;
    }
  }

  // =================== PRODUCTS ===================
  getProducts() {
    try {
      return this.db
        .prepare(
          `
        SELECT p.*, 
               COUNT(oi.id) as times_sold,
               COALESCE(SUM(oi.quantity), 0) as total_quantity_sold
        FROM products p 
        LEFT JOIN order_items oi ON p.id = oi.product_id 
        WHERE p.active = 1 
        GROUP BY p.id 
        ORDER BY p.category, p.name
      `
        )
        .all();
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return [];
    }
  }

  addProduct(product) {
    try {
      console.log("Adicionando produto:", product);

      const stmt = this.db.prepare(`
        INSERT INTO products (name, price, category) 
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(
        product.name,
        product.price,
        product.category || "Geral"
      );

      console.log("Produto adicionado com ID:", result.lastInsertRowid);

      // Retornar o produto criado
      const newProduct = this.db
        .prepare("SELECT * FROM products WHERE id = ?")
        .get(result.lastInsertRowid);
      return newProduct;
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      throw error;
    }
  }

  updateProduct(id, product) {
    try {
      console.log("Atualizando produto ID:", id, "com dados:", product);

      const stmt = this.db.prepare(`
        UPDATE products 
        SET name = ?, price = ?, category = ? 
        WHERE id = ?
      `);
      const result = stmt.run(
        product.name,
        product.price,
        product.category || "Geral",
        id
      );

      console.log("Produto atualizado, linhas afetadas:", result.changes);

      if (result.changes === 0) {
        throw new Error("Produto não encontrado para atualização");
      }

      // Retornar o produto atualizado
      const updatedProduct = this.db
        .prepare("SELECT * FROM products WHERE id = ?")
        .get(id);
      return updatedProduct;
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      throw error;
    }
  }

  deleteProduct(id) {
    try {
      // Soft delete - marca como inativo
      const stmt = this.db.prepare(
        "UPDATE products SET active = 0 WHERE id = ?"
      );
      return stmt.run(id);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      throw error;
    }
  }

  // =================== ORDERS ===================
  getOrders(limit = 100) {
    try {
      return this.db
        .prepare(
          `
        SELECT o.*, 
               c.name as customer_name,
               c.phone as customer_phone,
               COUNT(oi.id) as total_items,
               GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as items_summary
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id 
        ORDER BY o.created_at DESC 
        LIMIT ?
      `
        )
        .all(limit);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      return [];
    }
  }

  getOrderDetails(orderId) {
    try {
      const order = this.db
        .prepare(
          `
        SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = ?
      `
        )
        .get(orderId);

      if (!order) return null;

      const items = this.db
        .prepare(
          `
        SELECT oi.*, p.name as product_name, p.category as product_category
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `
        )
        .all(orderId);

      return { ...order, items };
    } catch (error) {
      console.error("Erro ao buscar detalhes do pedido:", error);
      return null;
    }
  }

  addOrder(orderData) {
    const transaction = this.db.transaction(() => {
      try {
        // Inserir pedido
        const orderStmt = this.db.prepare(`
          INSERT INTO orders (customer_id, total, notes) 
          VALUES (?, ?, ?)
        `);

        const orderResult = orderStmt.run(
          orderData.customer_id,
          orderData.total,
          orderData.notes || ""
        );

        const orderId = orderResult.lastInsertRowid;

        // Inserir itens
        const itemStmt = this.db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?)
        `);

        orderData.items.forEach((item) => {
          itemStmt.run(orderId, item.product_id, item.quantity, item.price);
        });

        return orderId;
      } catch (error) {
        console.error("Erro na transação de pedido:", error);
        throw error;
      }
    });

    return transaction();
  }

  updateOrderStatus(orderId, status) {
    try {
      const stmt = this.db.prepare("UPDATE orders SET status = ? WHERE id = ?");
      return stmt.run(status, orderId);
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      throw error;
    }
  }

  deleteOrder(orderId) {
    const transaction = this.db.transaction(() => {
      try {
        // Excluir itens primeiro (foreign key)
        this.db
          .prepare("DELETE FROM order_items WHERE order_id = ?")
          .run(orderId);

        // Excluir pedido
        this.db.prepare("DELETE FROM orders WHERE id = ?").run(orderId);

        return true;
      } catch (error) {
        console.error("Erro ao excluir pedido:", error);
        throw error;
      }
    });

    return transaction();
  }

  // =================== RELATÓRIOS ===================
  getSalesReport(startDate, endDate) {
    try {
      return this.db
        .prepare(
          `
        SELECT 
          DATE(o.created_at) as date,
          COUNT(o.id) as total_orders,
          SUM(o.total) as total_sales,
          AVG(o.total) as avg_order_value
        FROM orders o 
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY DATE(o.created_at)
        ORDER BY date DESC
      `
        )
        .all(startDate, endDate);
    } catch (error) {
      console.error("Erro no relatório de vendas:", error);
      return [];
    }
  }

  getTopProducts(limit = 10) {
    try {
      return this.db
        .prepare(
          `
        SELECT p.name, p.category, p.price,
               SUM(oi.quantity) as total_sold,
               SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        GROUP BY p.id 
        ORDER BY total_sold DESC 
        LIMIT ?
      `
        )
        .all(limit);
    } catch (error) {
      console.error("Erro no relatório de produtos:", error);
      return [];
    }
  }

  // =================== BACKUP/RESTORE ===================
  backup() {
    try {
      const userDataPath = app.getPath("userData");
      const backupPath = join(
        userDataPath,
        "backups",
        `backup-${Date.now()}.db`
      );

      // Garantir que o diretório de backups existe
      const backupsDir = join(userDataPath, "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir);
      }

      const backup = this.db.backup(backupPath);
      backup.step(-1); // Faz backup completo
      return backupPath;
    } catch (error) {
      console.error("Erro no backup:", error);
      return null;
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();
