const express = require('express');
const cors = require('cors');
const patientRoutes = require('./src/routes/patientRoutes');

const app = express();
const PORT = 3001; // 使用3001端口，避免和前端冲突

app.use(cors()); // 允许所有跨域请求
app.use(express.json());

// API 路由
app.use('/api/patients', patientRoutes);

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
}); 