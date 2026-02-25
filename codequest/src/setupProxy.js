const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/v2/execute',
    createProxyMiddleware({
      target: 'http://piston:2000',
      changeOrigin: true,
      proxyTimeout: 30000, // 30 seconds
      timeout: 30000,      // 30 seconds
    })
  );
};
