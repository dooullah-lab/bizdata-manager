const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    if (rows[0].status === 'inactive') {
      return res.status(403).json({ message: 'Account is deactivated. Contact your administrator.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions for this action.' });
  }
  next();
};

const auditLog = (action, resource = null) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400) {
      try {
        await pool.execute(
          `INSERT INTO audit_logs (user_id, user_email, action, resource, ip_address)
           VALUES (?, ?, ?, ?, ?)`,
          [
            req.user?.id || null,
            req.user?.email || null,
            action,
            resource,
            req.ip || req.connection.remoteAddress,
          ]
        );
      } catch (_) { /* non-blocking */ }
    }
  });
  next();
};

module.exports = { authenticate, requireRole, auditLog };
