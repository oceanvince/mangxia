const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'chupengdai',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mangxia_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

module.exports = {
    pool,
}; 