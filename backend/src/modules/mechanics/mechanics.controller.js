const pool = require('../../config/database');
const { generateUstaadId } = require('../../utils/ustaadId');
const { logAudit } = require('../../utils/audit');

exports.getProfile = async (req, res, next) => {
  try {
    const [profiles] = await pool.query(`
      SELECT mp.*, u.full_name, u.mobile_number, u.preferred_language, u.created_at as registered_at
      FROM mechanic_profiles mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.user_id = ?
    `, [req.user.id]);

    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found. Please complete your registration.' });
    
    const [badges] = await pool.query(`
      SELECT ab.* FROM mechanic_badges mb
      JOIN achievement_badges ab ON mb.badge_id = ab.id
      WHERE mb.mechanic_id = ?
    `, [profiles[0].id]);

    res.json({ success: true, data: { ...profiles[0], badges } });
  } catch (error) { next(error); }
};

exports.createProfile = async (req, res, next) => {
  try {
    const { shop_name, shop_address, city, state, pincode, shop_category, experience_years, stocking_status } = req.body;
    
    const [existing] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Profile already exists. Use PUT to update.' });

    const ustaadId = await generateUstaadId(state || 'XX');
    
    const [result] = await pool.query(`
      INSERT INTO mechanic_profiles (user_id, ustaad_id, shop_name, shop_address, city, state, pincode, shop_category, experience_years, stocking_status, profile_completion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 70)
    `, [req.user.id, ustaadId, shop_name, shop_address, city, state, pincode, shop_category || 'motorcycle_repair', experience_years || 0, stocking_status || 'does_not_stock']);

    // Credit for profile completion
    await pool.query(`
      INSERT INTO credit_transactions (mechanic_id, transaction_type, credit_amount, balance_after, activity_type, activity_reference, description)
      VALUES (?, 'earned', 25, 25, 'profile_complete', 'PROFILE-INIT', 'Profile creation bonus')
    `, [result.insertId]);

    await pool.query('UPDATE mechanic_profiles SET total_credits = 25 WHERE id = ?', [result.insertId]);

    // Award Profile Pioneer badge
    const [badges] = await pool.query('SELECT id FROM achievement_badges WHERE badge_name = ?', ['Profile Pioneer']);
    if (badges.length) {
      await pool.query('INSERT IGNORE INTO mechanic_badges (mechanic_id, badge_id) VALUES (?, ?)', [result.insertId, badges[0].id]);
    }

    await logAudit(req.user.id, 'CREATE_PROFILE', 'mechanic_profiles', result.insertId);

    const [profiles] = await pool.query('SELECT * FROM mechanic_profiles WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: `Welcome to Ustaad Network! Your Ustaad ID is ${ustaadId}`, data: profiles[0] });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { shop_name, shop_address, city, state, pincode, shop_category, experience_years, stocking_status } = req.body;
    const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    await pool.query(`
      UPDATE mechanic_profiles SET shop_name=?, shop_address=?, city=?, state=?, pincode=?, shop_category=?, experience_years=?, stocking_status=?, profile_completion=90
      WHERE user_id=?
    `, [shop_name, shop_address, city, state, pincode, shop_category, experience_years, stocking_status, req.user.id]);

    await logAudit(req.user.id, 'UPDATE_PROFILE', 'mechanic_profiles', profiles[0].id, null, req.body);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) { next(error); }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT * FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });
    
    const mechanic = profiles[0];
    
    const [courseStats] = await pool.query(`
      SELECT COUNT(*) as total_enrolled, 
             SUM(CASE WHEN completion_status='completed' THEN 1 ELSE 0 END) as completed
      FROM course_progress WHERE mechanic_id = ?
    `, [mechanic.id]);

    const [fitmentStats] = await pool.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN tyre_brand='Eurogrip' THEN 1 ELSE 0 END) as eurogrip_count,
             SUM(CASE WHEN verification_status IN ('customer_confirmed','evidence_submitted','verified') THEN 1 ELSE 0 END) as confirmed
      FROM fitment_records WHERE mechanic_id = ?
    `, [mechanic.id]);

    const [reservationStats] = await pool.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN reservation_status IN ('pending','approved') THEN 1 ELSE 0 END) as active
      FROM toolbank_reservations WHERE mechanic_id = ?
    `, [mechanic.id]);

    const [recentFitments] = await pool.query(`
      SELECT passport_id, vehicle_model, tyre_brand, tyre_model, installation_date, verification_status
      FROM fitment_records WHERE mechanic_id = ? ORDER BY created_at DESC LIMIT 5
    `, [mechanic.id]);

    const [announcements] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );

    const [badges] = await pool.query(`
      SELECT ab.* FROM mechanic_badges mb
      JOIN achievement_badges ab ON mb.badge_id = ab.id
      WHERE mb.mechanic_id = ?
    `, [mechanic.id]);

    res.json({
      success: true,
      data: {
        mechanic,
        stats: {
          courses: courseStats[0],
          fitments: fitmentStats[0],
          reservations: reservationStats[0],
          credits: mechanic.total_credits,
        },
        recentFitments,
        announcements,
        badges,
      }
    });
  } catch (error) { next(error); }
};

exports.getActivities = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [activities] = await pool.query(
      'SELECT * FROM mechanic_activities WHERE mechanic_id = ? ORDER BY created_at DESC LIMIT 20',
      [profiles[0].id]
    );
    res.json({ success: true, data: activities });
  } catch (error) { next(error); }
};

exports.getCredits = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT id, total_credits, level FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [transactions] = await pool.query(
      'SELECT * FROM credit_transactions WHERE mechanic_id = ? ORDER BY created_at DESC LIMIT 50',
      [profiles[0].id]
    );
    res.json({ success: true, data: { balance: profiles[0].total_credits, level: profiles[0].level, transactions } });
  } catch (error) { next(error); }
};

