const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

let pool;

if (process.env.DATABASE_URL) {
  // Railway production - Parse DATABASE_URL
  // Format: mysql://user:password@host:port/database
  const dbUrl = new URL(process.env.DATABASE_URL);
  pool = mysql.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.substring(1), // Remove leading '/'
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} else {
  // Local development
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management_uang',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
