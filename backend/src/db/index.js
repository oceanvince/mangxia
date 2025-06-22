const { Pool } = require('pg');

// 数据库连接池
const pool = new Pool({
    user: process.env.DB_USER || 'chupengdai',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mangxia_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
});

// 添加连接池事件监听
pool.on('connect', () => {
    console.log('[Database] New client connected to the pool');
});

pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client:', err);
});

// 移除连接日志，避免过多输出
// const originalConnect = pool.connect.bind(pool);
// pool.connect = async () => {
//     console.log('[Database] Requesting database connection');
//     try {
//         const client = await originalConnect();
//         console.log('[Database] Successfully acquired database connection');
//         return client;
//     } catch (error) {
//         console.error('[Database] Failed to acquire database connection:', error);
//         throw error;
//     }
// };

// 查询方法，添加超时处理
const query = async (text, params) => {
    try {
        // 设置查询超时
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('查询超时')), 10000);
        });
        
        const queryPromise = pool.query(text, params);
        const result = await Promise.race([queryPromise, timeoutPromise]);
        return result;
    } catch (error) {
        console.error('数据库查询错误:', error);
        throw error;
    }
};

// 获取客户端连接（用于事务）
const getClient = async () => {
    try {
        const client = await pool.connect();
        return client;
    } catch (error) {
        console.error('获取数据库连接失败:', error);
        throw error;
    }
};

// 关闭连接池
const close = async () => {
    await pool.end();
};

module.exports = {
    query,
    getClient,
    close
}; 