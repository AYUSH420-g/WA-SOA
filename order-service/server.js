/**
 * Order Microservice - CampusConnect
 * Lab 6: Docker & Microservices
 * Port: 3003
 * Demonstrates Service-to-Service Communication (Order -> User & Order -> Product)
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || process.env.PORT || 3003;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 3000;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');

app.use(cors());
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Seed data
const defaultOrders = [
  {
    id: 1001,
    userId: 101,
    productId: 501,
    quantity: 1,
    unitPrice: 1200,
    totalAmount: 1200,
    status: "CONFIRMED",
    createdAt: "2026-09-28T09:00:00.000Z",
    userSnapshot: { id: 101, name: "Alice Smith", email: "alice@campus.edu", role: "student" },
    productSnapshot: { id: 501, name: "Laptop Pro", price: 1200, category: "Electronics" }
  }
];

// Initialize database file
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultOrders, null, 2));
  }
}

function readOrders() {
  try {
    initDB();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading orders:', err.message);
    return [];
  }
}

function writeOrders(orders) {
  initDB();
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

initDB();

// Robust downstream fetch helper with timeout and clear error isolation
async function callDownstreamService(serviceName, url) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (response.status === 404) {
      return { status: 404, error: `${serviceName} returned 404 Not Found` };
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return {
        status: 503,
        error: `${serviceName} returned error status ${response.status}`,
        details: errBody
      };
    }

    const data = await response.json();
    return { status: 200, data };
  } catch (err) {
    console.error(`[Order Service -> ${serviceName}] Communication failure at ${url}:`, err.message);
    return {
      status: 503,
      error: `Service Unavailable: Failed to communicate with ${serviceName}`,
      details: err.message
    };
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'order-service',
    status: 'UP',
    port: PORT,
    dependencies: {
      userServiceUrl: USER_SERVICE_URL,
      productServiceUrl: PRODUCT_SERVICE_URL
    },
    timestamp: new Date().toISOString()
  });
});

// GET /orders - Retrieve all orders
app.get('/orders', (req, res) => {
  const orders = readOrders();
  res.json(orders);
});

// GET /orders/:id - Retrieve order by ID
app.get('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const orders = readOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({
      error: 'Order Not Found',
      message: `Order with id ${id} does not exist.`
    });
  }
  res.json(order);
});

// POST /orders - Create and validate new order via User and Product microservices
app.post('/orders', async (req, res) => {
  const { userId, productId, quantity = 1 } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Both userId and productId are required in the request body.'
    });
  }

  const orderQty = parseInt(quantity, 10);
  if (isNaN(orderQty) || orderQty <= 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Quantity must be a positive integer.'
    });
  }

  // 1. Service-to-Service: Query User Service
  const userResult = await callDownstreamService('User Service', `${USER_SERVICE_URL}/users/${userId}`);
  if (userResult.status === 503) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: `User Service is unavailable at ${USER_SERVICE_URL}. Cannot complete order creation.`,
      dependency: 'user-service',
      details: userResult.details
    });
  }
  if (userResult.status === 404) {
    return res.status(404).json({
      error: 'User Not Found',
      message: `User with id ${userId} does not exist in User Service.`
    });
  }
  const user = userResult.data;

  // 2. Service-to-Service: Query Product Service
  const productResult = await callDownstreamService('Product Service', `${PRODUCT_SERVICE_URL}/products/${productId}`);
  if (productResult.status === 503) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: `Product Service is unavailable at ${PRODUCT_SERVICE_URL}. Cannot complete order creation.`,
      dependency: 'product-service',
      details: productResult.details
    });
  }
  if (productResult.status === 404) {
    return res.status(404).json({
      error: 'Product Not Found',
      message: `Product with id ${productId} does not exist in Product Service.`
    });
  }
  const product = productResult.data;

  // 3. Stock Availability Check
  if (product.stock !== undefined && product.stock < orderQty) {
    return res.status(400).json({
      error: 'Insufficient Stock',
      message: `Requested quantity (${orderQty}) exceeds available stock (${product.stock}) for product '${product.name}'.`
    });
  }

  // 4. Calculate total amount & assemble order record
  const unitPrice = Number(product.price);
  const totalAmount = unitPrice * orderQty;

  const orders = readOrders();
  const nextId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;

  const newOrder = {
    id: nextId,
    userId: user.id,
    productId: product.id,
    quantity: orderQty,
    unitPrice: unitPrice,
    totalAmount: totalAmount,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    userSnapshot: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    productSnapshot: {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category
    }
  };

  orders.push(newOrder);
  writeOrders(orders);

  console.log(`[Order Service] Order #${newOrder.id} successfully created for user ${user.name} (Product: ${product.name})`);
  return res.status(201).json(newOrder);
});

// DELETE /orders/:id - Cancel/Delete order
app.delete('/orders/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const orders = readOrders();
  const index = orders.findIndex(o => o.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Order Not Found',
      message: `Order with id ${id} does not exist.`
    });
  }

  const deletedOrder = orders.splice(index, 1)[0];
  writeOrders(orders);
  res.json({
    message: `Order with id ${id} deleted successfully.`,
    order: deletedOrder
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Order Microservice running on port ${PORT}`);
  console.log(`🔗 User Service URL:    ${USER_SERVICE_URL}`);
  console.log(`🔗 Product Service URL: ${PRODUCT_SERVICE_URL}`);
  console.log(`=======================================================`);
});
