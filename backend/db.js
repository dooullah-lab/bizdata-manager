const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // Required for AWS RDS
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const initializeDatabase = async () => {
  const conn = await pool.getConnection();
  try {
    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id          VARCHAR(36)  PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        role        ENUM('admin','manager','viewer') NOT NULL DEFAULT 'viewer',
        status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
        last_login  DATETIME     NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Audit log table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id     VARCHAR(36)  NULL,
        user_email  VARCHAR(150) NULL,
        action      VARCHAR(100) NOT NULL,
        resource    VARCHAR(100) NULL,
        details     TEXT         NULL,
        ip_address  VARCHAR(45)  NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Business records table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS business_records (
        id          VARCHAR(36)   PRIMARY KEY,
        title       VARCHAR(200)  NOT NULL,
        category    VARCHAR(100)  NOT NULL,
        description TEXT          NULL,
        value       DECIMAL(15,2) NULL,
        status      ENUM('active','archived','pending') NOT NULL DEFAULT 'active',
        tags        JSON          NULL,
        created_by  VARCHAR(36)   NOT NULL,
        updated_by  VARCHAR(36)   NULL,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_status (status),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create default admin if no users exist
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0) {
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      const hashedPassword = await bcrypt.hash('Admin@1234!', 12);
      await conn.execute(
        `INSERT INTO users (id, name, email, password, role, status)
         VALUES (?, ?, ?, ?, 'admin', 'active')`,
        [uuidv4(), 'System Administrator', 'admin@bizdata.local', hashedPassword]
      );
      console.log('✅ Default admin created: admin@bizdata.local / Admin@1234!');
      console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY after first login.');
    }

    console.log('✅ Database initialized successfully');
  } finally {
    conn.release();
  }
};

module.exports = { pool, initializeDatabase };
