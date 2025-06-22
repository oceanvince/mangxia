const app = require('./app');

const port = process.env.PORT || 3001;

// 启动服务器
const server = app.listen(port, () => {
  console.log(`🚀 服务器运行在 http://localhost:${port}`);
  console.log(`📊 健康检查: http://localhost:${port}/health`);
  console.log(`📁 环境: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
const gracefulShutdown = (signal) => {
  console.log(`收到${signal}信号，正在关闭服务器...`);
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未处理的错误
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
}); 