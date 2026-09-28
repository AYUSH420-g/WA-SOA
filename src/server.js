/**
 * Server Entry Point
 * Lab 4 - RESTful Web Services API (Express.js + MongoDB Mongoose + CORS)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const setupSwagger = require('./config/swagger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas (or dummy URI)
connectDB();

// Enable Cross-Origin Resource Sharing (CORS) for React web client & mobile clients
app.use(cors({
  origin: '*', // Allow all origins for dev/lab testing
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware for JSON request payloads
app.use(express.json());

// Root Redirect to Swagger Documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Setup Swagger / OpenAPI Interactive Documentation UI
setupSwagger(app);

// Mount Student Resource REST Endpoints
app.use('/students', studentRoutes);

// Handling non-existent routes (404)
app.use(notFoundHandler);

// Global Error Handler Middleware (400, 404, 500)
app.use(errorHandler);

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Student REST API Server running on port ${PORT}`);
    console.log(`📚 OpenAPI / Swagger UI: http://localhost:${PORT}/api-docs`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
