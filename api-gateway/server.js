/**
 * API Gateway - CampusConnect Microservices
 * Web Services & SOA Laboratory - Lab 7
 * Single Entry Point, Service Discovery (Config-based), Request Logging & Fault Handling
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const url = require('url');

// Optional require for http-proxy-middleware
let createProxyMiddleware = null;
try {
  const hpm = require('http-proxy-middleware');
  createProxyMiddleware = hpm.createProxyMiddleware;
} catch (e) {
  // Will use robust built-in native proxy fallback if dependency is not locally installed
  console.log('[API Gateway] http-proxy-middleware not found in local node_modules, using native reverse proxy fallback.');
}

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;

// ==============================================================================
// Part B: Configuration-Based Service Discovery Registry
// Externalize service locations into environment variables / configuration.
// No hard-coded URLs are placed in route-handling code.
// ==============================================================================
const SERVICE_REGISTRY = {
  userService: {
    name: 'user-service',
    url: (process.env.USER_SERVICE_URL || 'http://user-service:3001').replace(/\/+$/, ''),
    routePrefix: '/users'
  },
  productService: {
    name: 'product-service',
    url: (process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002').replace(/\/+$/, ''),
    routePrefix: '/products'
  },
  orderService: {
    name: 'order-service',
    url: (process.env.ORDER_SERVICE_URL || 'http://order-service:3003').replace(/\/+$/, ''),
    routePrefix: '/orders'
  }
};

// Global Middleware
app.use(cors());

// Global Request Logger Middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalEnd = res.end;

  res.end = function (...args) {
    const durationMs = Date.now() - startTime;
    // Log format: method, path, target service, response status
    const targetService = req.__targetService || (req.path === '/health' ? 'Self (API Gateway)' : 'Unknown');
    console.log(
      `[API Gateway] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} -> ${targetService} | Status: ${res.statusCode} (${durationMs}ms)`
    );
    return originalEnd.apply(this, args);
  };

  next();
});

// ==============================================================================
// Part A: Gateway Health Check Endpoint
// GET /health - Reports that the gateway is running, its active port,
// uptime, and current service discovery routing table.
// ==============================================================================
app.get('/health', (req, res) => {
  req.__targetService = 'Self (Health Check)';
  res.status(200).json({
    service: 'api-gateway',
    status: 'UP',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    serviceDiscovery: {
      mode: 'configuration-based',
      registry: {
        'user-service': SERVICE_REGISTRY.userService.url,
        'product-service': SERVICE_REGISTRY.productService.url,
        'order-service': SERVICE_REGISTRY.orderService.url
      }
    }
  });
});

// Centralized error responder for unreachable downstream services
function sendServiceError(res, serviceName, targetUrl, error) {
  if (res.headersSent) return;
  const isDownstreamTimeout = error && (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError');
  const statusCode = isDownstreamTimeout ? 504 : 503;

  res.status(statusCode).json({
    error: statusCode === 504 ? 'Gateway Timeout' : 'Service Unavailable',
    message: `Downstream service '${serviceName}' is unreachable at ${targetUrl}.`,
    targetService: serviceName,
    targetUrl: targetUrl,
    statusCode: statusCode,
    errorCode: (error && error.code) || 'ECONNREFUSED',
    timestamp: new Date().toISOString()
  });
}

// Built-in Native Reverse Proxy implementation (zero-dependency guarantee)
function nativeProxy(serviceConfig) {
  return (req, res) => {
    req.__targetService = serviceConfig.name;
    const targetBase = serviceConfig.url;
    const targetParsed = new url.URL(targetBase);
    const isHttps = targetParsed.protocol === 'https:';
    const transport = isHttps ? https : http;

    const options = {
      protocol: targetParsed.protocol,
      hostname: targetParsed.hostname,
      port: targetParsed.port || (isHttps ? 443 : 80),
      method: req.method,
      path: req.originalUrl,
      headers: {
        ...req.headers,
        host: targetParsed.host,
        'x-forwarded-for': req.ip || req.connection.remoteAddress,
        'x-forwarded-host': req.headers.host || '',
        'x-forwarded-proto': req.protocol || 'http',
        'x-gateway-source': 'api-gateway'
      },
      timeout: 5000
    };

    const proxyReq = transport.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy(new Error('Connection timed out'));
    });

    proxyReq.on('error', (err) => {
      console.error(`[API Gateway] Native proxy error forwarding to ${serviceConfig.name} (${targetBase}): ${err.message}`);
      sendServiceError(res, serviceConfig.name, targetBase, err);
    });

    req.pipe(proxyReq);
  };
}

// Build Proxy Handler: Use http-proxy-middleware if available, else nativeProxy
function buildServiceProxy(serviceConfig) {
  if (!createProxyMiddleware) {
    return nativeProxy(serviceConfig);
  }

  const target = serviceConfig.url;
  const errorHandler = (err, req, res) => {
    console.error(`[API Gateway] Proxy error for ${serviceConfig.name} (${target}): ${err.message}`);
    sendServiceError(res, serviceConfig.name, target, err);
  };

  const proxyOptions = {
    target: target,
    changeOrigin: true,
    ws: false,
    xfwd: true,
    proxyTimeout: 5000,
    timeout: 5000,
    onError: errorHandler,
    onProxyReq: (proxyReq, req, res) => {
      req.__targetService = serviceConfig.name;
      proxyReq.setHeader('x-gateway-source', 'api-gateway');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Headers handled automatically
    },
    // Modern v3 style hooks
    on: {
      error: errorHandler,
      proxyReq: (proxyReq, req, res) => {
        req.__targetService = serviceConfig.name;
        proxyReq.setHeader('x-gateway-source', 'api-gateway');
      }
    }
  };

  return createProxyMiddleware(proxyOptions);
}

// ==============================================================================
// Register Config-Driven Routes
// The gateway references the configuration values, not hard-coded strings.
// ==============================================================================
Object.values(SERVICE_REGISTRY).forEach((serviceConfig) => {
  const proxyHandler = buildServiceProxy(serviceConfig);

  // Mark target service on match
  app.use(serviceConfig.routePrefix, (req, res, next) => {
    req.__targetService = serviceConfig.name;
    next();
  });

  // Proxy all requests matching the service route prefix
  app.use(serviceConfig.routePrefix, proxyHandler);
});

// Fallback 404 Route for Unmatched Gateway Paths
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Gateway path '${req.originalUrl}' does not match any registered service route.`,
    availableRoutes: Object.values(SERVICE_REGISTRY).map(s => s.routePrefix),
    healthCheck: '/health',
    timestamp: new Date().toISOString()
  });
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('[API Gateway] Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Gateway Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`======================================================================`);
  console.log(` CampusConnect API Gateway running on port ${PORT}`);
  console.log(` Service Discovery Routing Table (Config-based):`);
  console.log(`   * /users    -> ${SERVICE_REGISTRY.userService.url} (${SERVICE_REGISTRY.userService.name})`);
  console.log(`   * /products -> ${SERVICE_REGISTRY.productService.url} (${SERVICE_REGISTRY.productService.name})`);
  console.log(`   * /orders   -> ${SERVICE_REGISTRY.orderService.url} (${SERVICE_REGISTRY.orderService.name})`);
  console.log(` Gateway Health: http://0.0.0.0:${PORT}/health`);
  console.log(`======================================================================`);
});

module.exports = app;
