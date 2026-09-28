/**
 * Product Microservice - CampusConnect
 * Lab 6: Docker & Microservices
 * Port: 3002
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PRODUCT_SERVICE_PORT || process.env.PORT || 3002;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');

app.use(cors());
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Seed data
const defaultProducts = [
  { id: 501, name: "Laptop Pro", price: 1200, category: "Electronics", stock: 15 },
  { id: 502, name: "Wireless Mouse", price: 25, category: "Accessories", stock: 50 },
  { id: 503, name: "Operating Systems Textbook", price: 85, category: "Books", stock: 30 }
];

// Initialize database file
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultProducts, null, 2));
  }
}

function readProducts() {
  try {
    initDB();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading products:', err.message);
    return [];
  }
}

function writeProducts(products) {
  initDB();
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

initDB();

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'product-service',
    status: 'UP',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// GET /products - Retrieve all products
app.get('/products', (req, res) => {
  const products = readProducts();
  res.json(products);
});

// GET /products/:id - Retrieve product by ID
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const products = readProducts();
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({
      error: 'Product Not Found',
      message: `Product with id ${id} does not exist.`
    });
  }
  res.json(product);
});

// POST /products - Create new product
app.post('/products', (req, res) => {
  const { name, price, category, stock } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Both name and price are required fields.'
    });
  }

  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice) || numericPrice < 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Price must be a valid positive number.'
    });
  }

  const products = readProducts();
  const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 501;
  const newProduct = {
    id: nextId,
    name,
    price: numericPrice,
    category: category || 'General',
    stock: stock !== undefined ? parseInt(stock, 10) : 10,
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  writeProducts(products);

  res.status(201).json(newProduct);
});

// PUT /products/:id - Update existing product
app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, price, category, stock } = req.body;
  const products = readProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Product Not Found',
      message: `Product with id ${id} does not exist.`
    });
  }

  products[index] = {
    ...products[index],
    ...(name && { name }),
    ...(price !== undefined && { price: parseFloat(price) }),
    ...(category && { category }),
    ...(stock !== undefined && { stock: parseInt(stock, 10) }),
    updatedAt: new Date().toISOString()
  };

  writeProducts(products);
  res.json(products[index]);
});

// DELETE /products/:id - Delete product
app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const products = readProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Product Not Found',
      message: `Product with id ${id} does not exist.`
    });
  }

  const deletedProduct = products.splice(index, 1)[0];
  writeProducts(products);
  res.json({
    message: `Product with id ${id} deleted successfully.`,
    product: deletedProduct
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Product Service] running on port ${PORT}`);
});
