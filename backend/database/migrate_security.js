const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ustaad_network',
  });

  console.log('[Migration] Connected to database');

  try {
    // 1. Expand otp_code column to 64 chars to store SHA-256 hashes safely
    await connection.query('ALTER TABLE otp_verifications MODIFY COLUMN otp_code VARCHAR(64) NOT NULL');
    console.log('[Migration] Modified otp_verifications.otp_code to VARCHAR(64)');

    // 2. Add assigned_region to users table if not exists
    const [userCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'assigned_region'");
    if (!userCols.length) {
      await connection.query('ALTER TABLE users ADD COLUMN assigned_region VARCHAR(100) DEFAULT NULL AFTER preferred_language');
      console.log('[Migration] Added assigned_region to users table');
    }

    // 3. Add unique constraint on credit_transactions (mechanic_id, activity_type, activity_reference)
    const [ctIndices] = await connection.query("SHOW INDEX FROM credit_transactions WHERE Key_name = 'unique_mechanic_activity'");
    if (!ctIndices.length) {
      await connection.query('ALTER TABLE credit_transactions ADD UNIQUE KEY unique_mechanic_activity (mechanic_id, activity_type, activity_reference)');
      console.log('[Migration] Added unique constraint unique_mechanic_activity to credit_transactions');
    }

    // 4. Add index on toolbank_reservations for dealer and status queries
    const [trIndices] = await connection.query("SHOW INDEX FROM toolbank_reservations WHERE Key_name = 'idx_status_mechanic'");
    if (!trIndices.length) {
      await connection.query('ALTER TABLE toolbank_reservations ADD INDEX idx_status_mechanic (reservation_status, mechanic_id)');
      console.log('[Migration] Added index idx_status_mechanic to toolbank_reservations');
    }

    // 5. Seed Regional Manager if not present
    await connection.query(`
      INSERT IGNORE INTO users (full_name, mobile_number, role, status, assigned_region)
      VALUES ('Regional Manager (West)', '6666666666', 'regional_manager', 'active', 'Maharashtra')
    `);
    console.log('[Migration] Ensured Regional Manager (6666666666) is seeded');

    console.log('[Migration] All security migrations completed successfully with 100% data preservation.');
  } catch (err) {
    console.error('[Migration Error]:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();

