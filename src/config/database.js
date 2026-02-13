const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Support both DATABASE_URL (Railway format) and individual env vars
const dbConfig = process.env.DATABASE_URL 
  ? {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'management_uang',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Database connected successfully');
  connection.release();
});

// Export promise-based pool
const promisePool = pool.promise();

module.exports = promisePool;
