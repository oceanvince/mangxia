const express = require('express');
const cors = require('cors');

// 导入路由
const patientRoutes = require('./routes/patientRoutes');

const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/patients', patientRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 简单错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: `API路径 ${req.originalUrl} 不存在` 
  });
});

module.exports = app; 