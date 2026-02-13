const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

let pool;

if (process.env.DATABASE_URL) {
  // Railway production
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  // Local development
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management_uang',
  });
}

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Database connected successfully');
  connection.release();
});

module.exports = pool.promise();
