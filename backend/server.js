// backend/server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = './inventory.db';
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        db.serialize(() => {
            // Products Table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                quantity INTEGER DEFAULT 0,
                price REAL DEFAULT 0.0,
                cost REAL DEFAULT 0.0
            )`, (err) => {
                if (err) console.error("Error creating products table:", err.message);
            });

            // Customers Table
            db.run(`CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                address TEXT
            )`, (err) => {
                if (err) console.error("Error creating customers table:", err.message);
            });

            // Sales Table
            db.run(`CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customerId INTEGER,
                saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                totalAmount REAL NOT NULL,
                totalCost REAL,
                amountPaid REAL DEFAULT 0.0, 
                paymentStatus TEXT DEFAULT 'unpaid', 
                FOREIGN KEY (customerId) REFERENCES customers(id)
            )`, (err) => {
                if (err) console.error("Error creating/altering sales table:", err.message);
            });

            // Sale Items Table
            db.run(`CREATE TABLE IF NOT EXISTS sale_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                saleId INTEGER,
                productId INTEGER,
                quantity INTEGER,
                priceAtSale REAL,
                costAtSale REAL,
                FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY (productId) REFERENCES products(id)
            )`, (err) => {
                if (err) console.error("Error creating sale_items table:", err.message);
            });
            if (!err) console.log("All database tables checked/created successfully (if they didn't exist).");
        });
    }
});

// --- API Routes ---

// == PRODUCTS API ==
// ... (โค้ด Products API เดิมทั้งหมดของคุณ) ...
app.post('/api/products', (req, res) => {
    const { name, quantity, price, cost } = req.body;
    if (name === undefined || name.trim() === '' || quantity === undefined || price === undefined || cost === undefined) {
        return res.status(400).json({ error: "Name, quantity, price, and cost are required and name cannot be empty." });
    }
    const sql = `INSERT INTO products (name, quantity, price, cost) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, Number(quantity), Number(price), Number(cost)], function(err) {
        if (err) {
            console.error("Error inserting product:", err.message);
            return res.status(500).json({ error: "Could not add product: " + err.message });
        }
        res.status(201).json({ id: this.lastID, name, quantity: Number(quantity), price: Number(price), cost: Number(cost) });
    });
});

app.get('/api/products', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limitQuery = req.query.limit;
    let limit = parseInt(limitQuery) || 10;
    const fetchAll = limitQuery && limitQuery.toLowerCase() === 'all';


    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || ''; 

    let countSql = `SELECT COUNT(*) as count FROM products`;
    let dataSql = `SELECT * FROM products`;
    const paramsForData = [];
    const paramsForCount = [];

    if (searchTerm.trim() !== '') {
        const searchPattern = `%${searchTerm.trim()}%`;
        countSql += ` WHERE name LIKE ?`;
        dataSql += ` WHERE name LIKE ?`;
        paramsForData.push(searchPattern);
        paramsForCount.push(searchPattern);
    }

    dataSql += ` ORDER BY name`; 
    if (!fetchAll) {
        dataSql += ` LIMIT ? OFFSET ?`;
        paramsForData.push(limit, offset);
    }


    db.get(countSql, paramsForCount, (err, row) => {
        if (err) {
            console.error("Error counting products:", err.message);
            return res.status(500).json({ error: "Could not count products: " + err.message });
        }

        const totalItems = row.count;
        const totalPages = fetchAll ? 1 : Math.ceil(totalItems / limit);
        if (fetchAll) limit = totalItems; 

        db.all(dataSql, paramsForData, (err, rows) => {
            if (err) {
                console.error("Error fetching products with pagination/search:", err.message);
                return res.status(500).json({ error: "Could not retrieve products: " + err.message });
            }
            res.json({
                data: rows,
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: limit 
            });
        });
    });
});

app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM products WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error(`Error fetching product ${id}:`, err.message);
            return res.status(500).json({ error: `Could not retrieve product: ${err.message}` });
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Product not found" });
        }
    });
});

app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, quantity, price, cost } = req.body;
    if (name === undefined || name.trim() === '' || quantity === undefined || price === undefined || cost === undefined) {
        return res.status(400).json({ error: "Name, quantity, price and cost are required and name cannot be empty." });
    }
    const sql = `UPDATE products SET name = ?, quantity = ?, price = ?, cost = ? WHERE id = ?`;
    db.run(sql, [name, Number(quantity), Number(price), Number(cost), id], function(err) {
        if (err) {
            console.error(`Error updating product ${id}:`, err.message);
            return res.status(500).json({ error: `Could not update product: ${err.message}` });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Product not found or no changes made" });
        }
        res.json({ message: "Product updated successfully", id: Number(id), name, quantity: Number(quantity), price: Number(price), cost: Number(cost) });
    });
});

app.post('/api/products/:id/receive', (req, res) => {
    const { id } = req.params;
    const { quantityReceived } = req.body;
    if (quantityReceived === undefined || Number(quantityReceived) <= 0) {
        return res.status(400).json({ error: "Quantity received must be a positive number." });
    }
    const sql = `UPDATE products SET quantity = quantity + ? WHERE id = ?`;
    db.run(sql, [Number(quantityReceived), id], function(err) {
        if (err) {
            console.error("Error receiving stock for product " + id + ":", err.message);
            return res.status(500).json({ error: "Could not update stock: " + err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Product not found or stock not updated." });
        }
        db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, row) => {
            if (err) {
                 console.error("Error retrieving updated product after stock receive:", err.message);
                return res.status(500).json({ error: "Failed to retrieve updated product."});
            }
            res.json({ message: "Stock received successfully", product: row });
        });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM products WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            console.error(`Error deleting product ${id}:`, err.message);
            return res.status(500).json({ error: `Could not delete product: ${err.message}` });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ message: "Product deleted successfully", id: Number(id) });
    });
});


// == CUSTOMERS API ==
// ... (โค้ด Customers API เดิมทั้งหมดของคุณ) ...
app.post('/api/customers', (req, res) => {
    const { name, phone, address } = req.body;
    if (name === undefined || name.trim() === '') {
        return res.status(400).json({ error: "Name is required for a customer." });
    }
    const sql = `INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)`;
    db.run(sql, [name, phone || null, address || null], function(err) {
        if (err) {
            console.error("Error inserting customer:", err.message);
            return res.status(500).json({ error: "Could not add customer: " + err.message });
        }
        res.status(201).json({ id: this.lastID, name, phone, address });
    });
});

app.get('/api/customers', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limitQuery = req.query.limit;
    let limit = parseInt(limitQuery) || 10;
    const fetchAll = limitQuery && limitQuery.toLowerCase() === 'all';

    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    let countSql = `SELECT COUNT(*) as count FROM customers`;
    let dataSql = `SELECT * FROM customers`;
    const paramsForData = [];
    const paramsForCount = [];

    if (searchTerm.trim() !== '') {
        const searchPattern = `%${searchTerm.trim()}%`;
        countSql += ` WHERE name LIKE ? OR phone LIKE ?`;
        dataSql += ` WHERE name LIKE ? OR phone LIKE ?`;
        paramsForData.push(searchPattern, searchPattern);
        paramsForCount.push(searchPattern, searchPattern);
    }
    
    dataSql += ` ORDER BY name`;
    if (!fetchAll) {
        dataSql += ` LIMIT ? OFFSET ?`;
        paramsForData.push(limit, offset);
    }

    db.get(countSql, paramsForCount, (err, row) => {
        if (err) {
            console.error("Error counting customers:", err.message);
            return res.status(500).json({ error: "Could not count customers: " + err.message });
        }
        const totalItems = row.count;
        const totalPages = fetchAll ? 1 : Math.ceil(totalItems / limit);
        if (fetchAll) limit = totalItems;

        db.all(dataSql, paramsForData, (err, rows) => {
            if (err) {
                console.error("Error fetching customers:", err.message);
                return res.status(500).json({ error: "Could not retrieve customers: " + err.message });
            }
            if (fetchAll) {
                res.json(rows); 
            } else {
                res.json({
                    data: rows,
                    currentPage: page,
                    totalPages: totalPages,
                    totalItems: totalItems,
                    itemsPerPage: limit
                });
            }
        });
    });
});

app.get('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM customers WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error(`Error fetching customer ${id}:`, err.message);
            return res.status(500).json({ error: `Could not retrieve customer: ${err.message}` });
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: "Customer not found" });
        }
    });
});

app.get('/api/customers/:customerId/sales', async (req, res) => {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; 
    const offset = (page - 1) * limit;

    try {
        const customerSql = `SELECT id as customerId, name as customerName, phone as customerPhone, address as customerAddress FROM customers WHERE id = ?`;
        const customer = await new Promise((resolve, reject) => {
            db.get(customerSql, [customerId], (err, row) => (err ? reject(err) : resolve(row)));
        });

        if (!customer) return res.status(404).json({ error: "Customer not found" });

        const countSalesSql = `SELECT COUNT(*) as count FROM sales WHERE customerId = ?`;
        const salesCountRow = await new Promise((resolve, reject) => {
            db.get(countSalesSql, [customerId], (err, row) => (err ? reject(err) : resolve(row)));
        });
        const totalItems = salesCountRow.count;
        const totalPages = Math.ceil(totalItems / limit);

        const salesSql = `
            SELECT s.id as saleId, strftime('%Y-%m-%dT%H:%M:%SZ', s.saleDate) as saleDate,
                   s.totalAmount, s.amountPaid, s.paymentStatus, s.totalCost, (s.totalAmount - s.totalCost) as profit
            FROM sales s WHERE s.customerId = ? ORDER BY s.saleDate DESC LIMIT ? OFFSET ? `;
        const salesRows = await new Promise((resolve, reject) => {
            db.all(salesSql, [customerId, limit, offset], (err, rows) => (err ? reject(err) : resolve(rows)));
        });

        const salesWithItems = await Promise.all(
            salesRows.map(async (sale) => {
                const itemsSql = `
                    SELECT si.quantity, si.priceAtSale, si.costAtSale, (si.quantity * si.priceAtSale) as subtotal,
                           p.name as productName
                    FROM sale_items si JOIN products p ON si.productId = p.id WHERE si.saleId = ? `;
                const items = await new Promise((resolve, reject) => {
                    db.all(itemsSql, [sale.saleId], (err, itemRows) => (err ? reject(err) : resolve(itemRows)));
                });
                return { ...sale, items: items || [] };
            })
        );
        res.json({ customer, sales: salesWithItems, currentPage: page, totalPages, totalItems });
    } catch (err) {
        console.error(`Error fetching sales history for customer ${customerId}:`, err.message);
        res.status(500).json({ error: `Could not retrieve sales history: ${err.message}` });
    }
});


app.put('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, address } = req.body;
    if (name === undefined || name.trim() === '') {
        return res.status(400).json({ error: "Name is required." });
    }
    const sql = `UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?`;
    db.run(sql, [name, phone || null, address || null, id], function(err) {
        if (err) {
            console.error(`Error updating customer ${id}:`, err.message);
            return res.status(500).json({ error: `Could not update customer: ${err.message}` });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Customer not found or no changes made" });
        }
        res.json({ message: "Customer updated successfully", id: Number(id), name, phone, address });
    });
});

app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM customers WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            console.error(`Error deleting customer ${id}:`, err.message);
            return res.status(500).json({ error: `Could not delete customer: ${err.message}` });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json({ message: "Customer deleted successfully", id: Number(id) });
    });
});

// == SALES API ==
// ... (โค้ด Sales API เดิมส่วนใหญ่ของคุณ รวมถึง POST /api/sales และ POST /api/sales/:saleId/record-payment) ...
app.post('/api/sales', (req, res) => {
    const { customerId, items, totalAmount, amountPaid = 0 } = req.body; 

    if (!customerId || !items || items.length === 0 || totalAmount === undefined) {
        return res.status(400).json({ error: "Customer, items, and total amount are required." });
    }

    const parsedTotalAmount = Number(totalAmount);
    const parsedAmountPaid = Number(amountPaid); 

    let paymentStatus = 'unpaid';
    if (parsedAmountPaid >= parsedTotalAmount) { 
        paymentStatus = 'paid'; 
    } else if (parsedAmountPaid > 0 && parsedAmountPaid < parsedTotalAmount) { 
        paymentStatus = 'partial'; 
    }
    
    const totalCost = items.reduce((sum, item) => sum + (Number(item.costAtSale) * Number(item.quantity)), 0);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const saleSql = `INSERT INTO sales (customerId, totalAmount, totalCost, amountPaid, paymentStatus) VALUES (?, ?, ?, ?, ?)`;
        db.run(saleSql, [Number(customerId), parsedTotalAmount, Number(totalCost), parsedAmountPaid, paymentStatus], function(err) {
            if (err) { 
                db.run("ROLLBACK"); 
                console.error("Error creating sale record:", err.message); 
                return res.status(500).json({ error: "Failed to create sale record: " + err.message }); 
            }
            const saleId = this.lastID;
            const itemSql = `INSERT INTO sale_items (saleId, productId, quantity, priceAtSale, costAtSale) VALUES (?, ?, ?, ?, ?)`;
            const productUpdateSql = `UPDATE products SET quantity = quantity - ? WHERE id = ?`;
            
            let itemPromises = items.map(item => {
                return new Promise((resolve, reject) => {
                    db.run(itemSql, [saleId, item.productId, Number(item.quantity), Number(item.priceAtSale), Number(item.costAtSale)], (itemErr) => {
                        if (itemErr) { 
                            console.error("Error inserting sale item:", itemErr.message); 
                            return reject(itemErr); 
                        }
                        db.run(productUpdateSql, [Number(item.quantity), item.productId], function(updateErr) {
                            if (updateErr) { 
                                console.error("Error updating product stock:", updateErr.message); 
                                return reject(updateErr); 
                            }
                            if (this.changes === 0) {
                                console.warn(`Stock update for product ID ${item.productId} affected 0 rows. This could indicate an issue if stock was expected to decrease.`);
                            }
                            resolve();
                        });
                    });
                });
            });
            
            Promise.all(itemPromises)
                .then(() => { 
                    db.run("COMMIT"); 
                    res.status(201).json({ 
                        message: "Sale created successfully", 
                        saleId: saleId, 
                        totalAmount: parsedTotalAmount, 
                        totalCost: Number(totalCost), 
                        amountPaid: parsedAmountPaid, 
                        paymentStatus: paymentStatus 
                    }); 
                })
                .catch(error => { 
                    db.run("ROLLBACK"); 
                    console.error("Transaction failed for sale processing:", error.message); 
                    res.status(500).json({ error: "Failed to process sale items or update stock: " + error.message }); 
                });
        });
    });
});

app.post('/api/sales/:saleId/record-payment', (req, res) => {
    const { saleId } = req.params;
    const { amountReceived } = req.body;

    if (amountReceived === undefined || isNaN(Number(amountReceived)) || Number(amountReceived) <= 0) {
        return res.status(400).json({ error: "Valid amountReceived is required and must be greater than 0." });
    }

    const receivedAmount = Number(amountReceived);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const getSaleSql = `SELECT id as saleId, totalAmount, amountPaid, paymentStatus FROM sales WHERE id = ?`;
        db.get(getSaleSql, [saleId], (err, sale) => {
            if (err) { 
                db.run("ROLLBACK"); 
                console.error("Error fetching sale for payment recording:", err.message); 
                return res.status(500).json({ error: "Failed to fetch sale data." }); 
            }
            if (!sale) { 
                db.run("ROLLBACK"); 
                return res.status(404).json({ error: "Sale not found." }); 
            }
            if (sale.paymentStatus === 'paid') { 
                db.run("ROLLBACK"); 
                return res.status(400).json({ error: "This sale is already fully paid." }); 
            }

            const currentAmountPaid = sale.amountPaid || 0;
            let newAmountPaid = currentAmountPaid + receivedAmount;
            const totalAmount = sale.totalAmount;
            let newPaymentStatus = sale.paymentStatus; 

            if (newAmountPaid >= totalAmount) { 
                newPaymentStatus = 'paid'; 
                newAmountPaid = totalAmount; 
            } else if (newAmountPaid > 0) { 
                newPaymentStatus = 'partial'; 
            }
            
            const updateSaleSql = `UPDATE sales SET amountPaid = ?, paymentStatus = ? WHERE id = ?`;
            db.run(updateSaleSql, [newAmountPaid, newPaymentStatus, saleId], function(updateErr) {
                if (updateErr) { 
                    db.run("ROLLBACK"); 
                    console.error("Error updating sale with new payment:", updateErr.message); 
                    return res.status(500).json({ error: "Failed to record payment." }); 
                }
                if (this.changes === 0) { 
                    db.run("ROLLBACK"); 
                    return res.status(404).json({ error: "Sale not found or not updated during payment recording." }); 
                }
                
                db.run("COMMIT");
                db.get(`SELECT s.id as saleId, strftime('%Y-%m-%dT%H:%M:%SZ', s.saleDate) as saleDate, s.totalAmount, s.amountPaid, s.paymentStatus, s.totalCost, (s.totalAmount - s.totalCost) as profit, c.name as customerName FROM sales s LEFT JOIN customers c ON s.customerId = c.id WHERE s.id = ?`, [saleId], (fetchErr, updatedSale) => {
                    if(fetchErr){ 
                        console.error("Error fetching updated sale details after payment:", fetchErr.message); 
                        return res.status(200).json({ 
                            message: "Payment recorded successfully, but failed to fetch updated sale details immediately.", 
                            saleId: Number(saleId), 
                            newAmountPaid, 
                            newPaymentStatus 
                        }); 
                    }
                    res.status(200).json({ message: "Payment recorded successfully.", sale: updatedSale });
                });
            });
        });
    });
});

// --- NEW API: Get Recent Sales for Dashboard ---
app.get('/api/sales/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 5; // ดึง 5 รายการล่าสุด (ปรับได้)
    const sql = `
        SELECT 
            s.id as saleId, 
            strftime('%Y-%m-%dT%H:%M:%SZ', s.saleDate) as saleDate,
            s.totalAmount,
            c.name as customerName
        FROM sales s
        LEFT JOIN customers c ON s.customerId = c.id
        ORDER BY s.saleDate DESC
        LIMIT ?
    `;
    db.all(sql, [limit], (err, rows) => {
        if (err) {
            console.error("Error fetching recent sales:", err.message);
            return res.status(500).json({ error: "Could not retrieve recent sales: " + err.message });
        }
        res.json(rows);
    });
});
// --- END OF NEW API ---


// == REPORTS API ==
// ... (โค้ด Reports API เดิมทั้งหมดของคุณ) ...
app.get('/api/reports/sales-summary', (req, res) => {
    const { startDate, endDate, customerId } = req.query;
    let sql = `
        SELECT s.id AS saleId, strftime('%Y-%m-%dT%H:%M:%SZ', s.saleDate) AS saleDate,
               c.name AS customerName, s.totalAmount, s.amountPaid, s.paymentStatus, s.totalCost, (s.totalAmount - s.totalCost) AS profit,
               GROUP_CONCAT(p.name || ' (จำนวน: ' || si.quantity || ', ราคาขาย: ' || si.priceAtSale || ' บาท, ราคาทุน: ' || si.costAtSale || ' บาท)') AS itemsSoldFormatted
        FROM sales s
        LEFT JOIN customers c ON s.customerId = c.id
        LEFT JOIN sale_items si ON si.saleId = s.id
        LEFT JOIN products p ON si.productId = p.id `;
    const params = [];
    const conditions = [];
    if (startDate) { conditions.push(`DATE(s.saleDate) >= DATE(?)`); params.push(startDate); }
    if (endDate) { conditions.push(`DATE(s.saleDate) <= DATE(?)`); params.push(endDate); }
    if (customerId && customerId !== 'all' && customerId !== '') { conditions.push(`s.customerId = ?`); params.push(customerId); }
    
    if (conditions.length > 0) { sql += ` WHERE ` + conditions.join(' AND '); }
    sql += ` GROUP BY s.id ORDER BY s.saleDate DESC;`;

    db.all(sql, params, (err, rows) => {
        if (err) { 
            console.error("Error fetching sales summary:", err.message); 
            return res.status(500).json({ error: "Could not retrieve sales summary: " + err.message }); 
        }
        res.json(rows);
    });
});

app.get('/api/reports/sales-by-product', (req, res) => {
    const { startDate, endDate } = req.query;
    let sql = `
        SELECT p.id as productId, p.name as productName, SUM(si.quantity) as totalQuantitySold,
               SUM(si.quantity * si.priceAtSale) as totalRevenue, SUM(si.quantity * si.costAtSale) as totalCostOfGoodsSold,
               (SUM(si.quantity * si.priceAtSale) - SUM(si.quantity * si.costAtSale)) as totalProfit
        FROM sale_items si JOIN products p ON si.productId = p.id JOIN sales s ON si.saleId = s.id `;
    const params = [];
    const conditions = [];
    if (startDate) { conditions.push(`DATE(s.saleDate) >= DATE(?)`); params.push(startDate); }
    if (endDate) { conditions.push(`DATE(s.saleDate) <= DATE(?)`); params.push(endDate); }
    if (conditions.length > 0) { sql += ` WHERE ` + conditions.join(' AND '); }
    sql += ` GROUP BY p.id, p.name ORDER BY totalProfit DESC, totalQuantitySold DESC `;
    db.all(sql, params, (err, rows) => {
        if (err) { 
            console.error("Error fetching sales by product report:", err.message); 
            return res.status(500).json({ error: "Could not retrieve sales by product report: " + err.message }); 
        }
        res.json(rows);
    });
});

app.get('/api/reports/sales-by-customer', (req, res) => {
    const { startDate, endDate } = req.query;
    let sql = `
        SELECT c.id as customerId, c.name as customerName, c.phone as customerPhone,
               COUNT(s.id) as totalOrders, SUM(s.totalAmount) as totalSalesAmount,
               SUM(s.totalCost) as totalSalesCost, (SUM(s.totalAmount) - SUM(s.totalCost)) as totalProfit
        FROM sales s JOIN customers c ON s.customerId = c.id `;
    const params = [];
    const conditions = [];
    if (startDate) { conditions.push(`DATE(s.saleDate) >= DATE(?)`); params.push(startDate); }
    if (endDate) { conditions.push(`DATE(s.saleDate) <= DATE(?)`); params.push(endDate); }
    if (conditions.length > 0) { sql += ` WHERE ` + conditions.join(' AND '); }
    sql += ` GROUP BY c.id, c.name, c.phone ORDER BY totalSalesAmount DESC, totalOrders DESC `;
    db.all(sql, params, (err, rows) => {
        if (err) { 
            console.error("Error fetching sales by customer report:", err.message); 
            return res.status(500).json({ error: "Could not retrieve sales by customer report: " + err.message }); 
        }
        res.json(rows);
    });
});

// --- DASHBOARD APIs ---
// ... (โค้ด Dashboard APIs เดิมของคุณ รวมถึง /api/customers/outstanding/count) ...
app.get('/api/reports/sales-today-summary', (req, res) => {
    const todayDate = new Date().toISOString().split('T')[0]; 
    const sql = ` SELECT SUM(totalAmount) as totalSalesAmount FROM sales WHERE DATE(saleDate) = DATE(?) `;
    db.get(sql, [todayDate], (err, row) => {
        if (err) { 
            console.error("Error fetching today's sales summary:", err.message); 
            return res.status(500).json({ error: "Could not retrieve today's sales summary: " + err.message }); 
        }
        res.json({ totalSalesAmount: row ? row.totalSalesAmount || 0 : 0 });
    });
});

app.get('/api/products/low-stock/count', (req, res) => {
    const threshold = parseInt(req.query.threshold) || 10; 
    const sql = `SELECT COUNT(*) as count FROM products WHERE quantity < ?`;
    db.get(sql, [threshold], (err, row) => {
        if (err) { 
            console.error("Error fetching low stock count:", err.message); 
            return res.status(500).json({ error: "Could not retrieve low stock count: " + err.message }); 
        }
        res.json({ count: row ? row.count || 0 : 0 });
    });
});

app.get('/api/reports/weekly-sales-chart', (req, res) => {
    const dates = [];
    for (let i = 6; i >= 0; i--) { 
        const d = new Date(); 
        d.setDate(d.getDate() - i); 
        dates.push(d.toISOString().split('T')[0]); 
    }
    const startDate = dates[0];
    const endDate = dates[dates.length -1];
    
    const sql = ` 
        SELECT DATE(saleDate) as saleDay, SUM(totalAmount) as dailySales 
        FROM sales 
        WHERE DATE(saleDate) BETWEEN DATE(?) AND DATE(?) 
        GROUP BY DATE(saleDay) 
        ORDER BY DATE(saleDay) ASC 
    `;
    db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) { 
            console.error("Error fetching weekly sales chart data:", err.message); 
            return res.status(500).json({ error: "Could not retrieve weekly sales data: " + err.message }); 
        }
        const chartData = dates.map(dateStr => {
            const foundSale = rows.find(row => row.saleDay === dateStr);
            return { 
                date: dateStr, 
                sales: foundSale ? foundSale.dailySales : 0,
            };
        });
        res.json(chartData);
    });
});

app.get('/api/customers/outstanding/count', (req, res) => {
  const sql = `
    SELECT COUNT(DISTINCT customerId) as count 
    FROM sales 
    WHERE paymentStatus = 'unpaid' OR paymentStatus = 'partial'
  `;
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error("Error counting outstanding customers:", err.message);
      return res.status(500).json({ error: "Could not count outstanding customers: " + err.message });
    }
    res.json({ count: row ? row.count || 0 : 0 });
  });
});


// --- AUTHENTICATION API ---
// ... (โค้ด Authentication API เดิมของคุณ) ...
const mockUsers = [ 
  { id: 1, username: 'admin', password: 'password123', name: 'Admin User' },
  { id: 2, username: 'user', password: 'password123', name: 'Regular User' }
];
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for username: ${username}`);
  if (!username || !password) { 
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }); 
  }
  const user = mockUsers.find(u => u.username === username && u.password === password); 
  if (user) { 
    console.log(`User ${username} logged in successfully.`); 
    res.json({ 
        success: true, 
        message: 'เข้าสู่ระบบสำเร็จ!', 
        user: { id: user.id, username: user.username, name: user.name } 
    });
  } else { 
    console.log(`Login failed for username: ${username}. Invalid credentials.`); 
    res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }); 
  }
});

// --- SALES HISTORY API ---
// ... (โค้ด Sales History API เดิมทั้งหมดของคุณ) ...
app.get('/api/sales-history', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { customerId, startDate, endDate } = req.query;

    let conditions = [];
    const params = []; 
    
    if (customerId && customerId !== 'all' && customerId !== '') { 
        conditions.push(`s.customerId = ?`); 
        params.push(customerId); 
    }
    if (startDate) { 
        conditions.push(`DATE(s.saleDate) >= DATE(?)`); 
        params.push(startDate); 
    }
    if (endDate) { 
        conditions.push(`DATE(s.saleDate) <= DATE(?)`); 
        params.push(endDate); 
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countSql = `SELECT COUNT(*) as count FROM sales s ${whereClause}`;
    const dataParamsForQuery = [...params]; 
    
    let dataSql = `
        SELECT 
            s.id as saleId, strftime('%Y-%m-%dT%H:%M:%SZ', s.saleDate) as saleDate, 
            s.totalAmount, s.amountPaid, s.paymentStatus, s.totalCost, (s.totalAmount - s.totalCost) as profit,
            c.name as customerName 
        FROM sales s LEFT JOIN customers c ON s.customerId = c.id
        ${whereClause} ORDER BY s.saleDate DESC`;

    dataSql += ` LIMIT ? OFFSET ?`;
    dataParamsForQuery.push(limit, offset);

    db.get(countSql, params, (err, row) => { 
        if (err) { 
            console.error("Error counting sales history:", err.message); 
            return res.status(500).json({ error: "Could not count sales history: " + err.message }); 
        }
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);

        db.all(dataSql, dataParamsForQuery, (err, rows) => {
            if (err) { 
                console.error("Error fetching sales history:", err.message); 
                return res.status(500).json({ error: "Could not retrieve sales history: " + err.message }); 
            }
            res.json({ 
                data: rows, 
                currentPage: page, 
                totalPages: totalPages, 
                totalItems: totalItems,
                itemsPerPage: limit
            });
        });
    });
});

app.get('/api/sales-history/:saleId', (req, res) => {
    const { saleId } = req.params;
    const saleDetailSql = `
        SELECT s.id as saleId, strftime('%Y-%m-%dT%H:%M:%SZ', s.saleDate) as saleDate,
               s.totalAmount, s.amountPaid, s.paymentStatus, s.totalCost, (s.totalAmount - s.totalCost) as profit,
               c.id as customerId, c.name as customerName, c.phone as customerPhone, c.address as customerAddress
        FROM sales s LEFT JOIN customers c ON s.customerId = c.id WHERE s.id = ? `;
    const saleItemsSql = `
        SELECT si.id as saleItemId, si.quantity, si.priceAtSale, si.costAtSale,
               (si.quantity * si.priceAtSale) as subtotal,
               p.id as productId, p.name as productName
        FROM sale_items si JOIN products p ON si.productId = p.id WHERE si.saleId = ? `;
    
    db.get(saleDetailSql, [saleId], (err, saleRow) => {
        if (err) { 
            console.error(`Error fetching sale detail for saleId ${saleId}:`, err.message); 
            return res.status(500).json({ error: `Could not retrieve sale detail: ${err.message}` }); 
        }
        if (!saleRow) { 
            return res.status(404).json({ error: "Sale not found" }); 
        }
        db.all(saleItemsSql, [saleId], (itemErr, itemRows) => {
            if (itemErr) { 
                console.error(`Error fetching sale items for saleId ${saleId}:`, itemErr.message); 
                return res.status(500).json({ error: `Could not retrieve sale items: ${itemErr.message}` }); 
            }
            res.json({ ...saleRow, items: itemRows || [] });
        });
    });
});

// --- API FOR OUTSTANDING SALES (DEBTORS) ---
// ... (โค้ด Outstanding Sales API เดิมของคุณ) ...
app.get('/api/outstanding-sales', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) as count FROM sales WHERE paymentStatus = 'unpaid' OR paymentStatus = 'partial'`;
    const dataSql = `
        SELECT 
            s.id as saleId, strftime('%Y-%m-%dT%H:%M:%SZ', s.saleDate) as saleDate,
            s.totalAmount, s.amountPaid, (s.totalAmount - s.amountPaid) as balanceDue,
            s.paymentStatus, c.name as customerName, c.id as customerId
        FROM sales s LEFT JOIN customers c ON s.customerId = c.id
        WHERE s.paymentStatus = 'unpaid' OR s.paymentStatus = 'partial'
        ORDER BY s.saleDate DESC LIMIT ? OFFSET ? `;
    
    db.get(countSql, [], (err, row) => {
        if (err) { 
            console.error("Error counting outstanding sales:", err.message); 
            return res.status(500).json({ error: "Could not count outstanding sales: " + err.message }); 
        }
        const totalItems = row.count;
        const totalPages = Math.ceil(totalItems / limit);
        db.all(dataSql, [limit, offset], (dataErr, rows) => {
            if (dataErr) { 
                console.error("Error fetching outstanding sales:", dataErr.message); 
                return res.status(500).json({ error: "Could not retrieve outstanding sales: " + dataErr.message }); 
            }
            res.json({ 
                data: rows, 
                currentPage: page, 
                totalPages: totalPages, 
                totalItems: totalItems,
                itemsPerPage: limit
            });
        });
    });
});


// Start server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error("Closed database connection with error: " + err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});
