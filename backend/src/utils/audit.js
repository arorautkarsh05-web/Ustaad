const pool = require('../config/database');

const logAudit = async (userId, action, entityType, entityId, oldValue = null, newValue = null, ip = null) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, action, entityType, entityId, JSON.stringify(oldValue), JSON.stringify(newValue), ip]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAudit };

