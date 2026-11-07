const pool = require('../../config/database');
const { logAudit } = require('../../utils/audit');

// =================== OVERVIEW DASHBOARD ===================

exports.getDashboardOverview = async (req, res, next) => {
  try {
    const isRegional = req.user.role === 'regional_manager' && req.user.assigned_region;
    const region = req.user.assigned_region;

    let mechanicQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN verification_status = 'unverified' THEN 1 ELSE 0 END) as unverified,
        SUM(CASE WHEN level = 'champion' THEN 1 ELSE 0 END) as champions,
        SUM(CASE WHEN level = 'professional' THEN 1 ELSE 0 END) as professionals,
        SUM(CASE WHEN stocking_status = 'stocks_eurogrip' THEN 1 ELSE 0 END) as stocking_eurogrip,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_last_30_days
      FROM mechanic_profiles
    `;
    const mechanicParams = [];
    if (isRegional) {
      mechanicQuery += ' WHERE state = ?';
      mechanicParams.push(region);
    }
    const [mechanicStats] = await pool.query(mechanicQuery, mechanicParams);

    let fitmentQuery = `
      SELECT 
        COUNT(fr.id) as total,
        SUM(CASE WHEN fr.tyre_brand = 'Eurogrip' THEN 1 ELSE 0 END) as eurogrip,
        SUM(CASE WHEN fr.verification_status IN ('customer_confirmed', 'verified') THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN fr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as last_30_days
      FROM fitment_records fr
    `;
    const fitmentParams = [];
    if (isRegional) {
      fitmentQuery += ' JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id WHERE mp.state = ?';
      fitmentParams.push(region);
    }
    const [fitmentStats] = await pool.query(fitmentQuery, fitmentParams);

    const [courseStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_enrollments,
        SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completions
      FROM course_progress
    `);

    const [toolbankStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN reservation_status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM toolbank_reservations
    `);

    const [creditStats] = await pool.query(`
      SELECT 
        SUM(CASE WHEN transaction_type = 'earned' THEN credit_amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN transaction_type = 'redeemed' THEN credit_amount ELSE 0 END) as total_redeemed
      FROM credit_transactions
    `);

    res.json({
      success: true,
      data: {
        mechanics: mechanicStats[0],
        fitments: fitmentStats[0],
        courses: courseStats[0],
        toolbank: toolbankStats[0],
        credits: creditStats[0],
        scoped_region: isRegional ? region : 'All Regions (National)',
      },
    });
  } catch (error) { next(error); }
};

// =================== MECHANICS ===================

exports.getMechanics = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, city, state, verification_status, level, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT mp.*, u.full_name, u.mobile_number, u.status as account_status, u.created_at as registered_at
      FROM mechanic_profiles mp
      JOIN users u ON mp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Regional Manager scope enforcement
    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      query += ' AND mp.state = ?';
      params.push(req.user.assigned_region);
    } else if (state) {
      query += ' AND mp.state = ?';
      params.push(state);
    }

    if (city) { query += ' AND mp.city = ?'; params.push(city); }
    if (verification_status) { query += ' AND mp.verification_status = ?'; params.push(verification_status); }
    if (level) { query += ' AND mp.level = ?'; params.push(level); }
    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.mobile_number LIKE ? OR mp.ustaad_id LIKE ? OR mp.shop_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const countQuery = query.replace('SELECT mp.*, u.full_name, u.mobile_number, u.status as account_status, u.created_at as registered_at', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    
    query += ' ORDER BY mp.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [mechanics] = await pool.query(query, params);

    res.json({
      success: true,
      data: mechanics,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) { next(error); }
};

exports.getMechanic = async (req, res, next) => {
  try {
    const [profiles] = await pool.query(`
      SELECT mp.*, u.full_name, u.mobile_number, u.status as account_status, u.preferred_language, u.created_at as registered_at
      FROM mechanic_profiles mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.id = ?
    `, [req.params.id]);

    if (!profiles.length) return res.status(404).json({ success: false, message: 'Mechanic not found' });

    // Regional Manager Scope Check
    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      if (profiles[0].state !== req.user.assigned_region) {
        return res.status(403).json({ success: false, message: 'Forbidden: Mechanic is outside your assigned geographical region.' });
      }
    }

    const [badges] = await pool.query(`SELECT ab.* FROM mechanic_badges mb JOIN achievement_badges ab ON mb.badge_id = ab.id WHERE mb.mechanic_id = ?`, [req.params.id]);
    const [fitments] = await pool.query('SELECT * FROM fitment_records WHERE mechanic_id = ? ORDER BY created_at DESC LIMIT 10', [req.params.id]);
    const [credits] = await pool.query('SELECT * FROM credit_transactions WHERE mechanic_id = ? ORDER BY created_at DESC LIMIT 20', [req.params.id]);
    const [courses] = await pool.query(`
      SELECT cp.*, c.title FROM course_progress cp JOIN courses c ON cp.course_id = c.id WHERE cp.mechanic_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...profiles[0], badges, fitments, credits, courses } });
  } catch (error) { next(error); }
};

exports.verifyMechanic = async (req, res, next) => {
  try {
    const { verification_status } = req.body;
    if (!['verified', 'unverified', 'rejected'].includes(verification_status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const [profiles] = await pool.query('SELECT * FROM mechanic_profiles WHERE id = ?', [req.params.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Mechanic not found' });

    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      if (profiles[0].state !== req.user.assigned_region) {
        return res.status(403).json({ success: false, message: 'Forbidden: Mechanic is outside your assigned region.' });
      }
    }

    await pool.query('UPDATE mechanic_profiles SET verification_status = ? WHERE id = ?', [verification_status, req.params.id]);
    await logAudit(req.user.id, 'VERIFY_MECHANIC', 'mechanic_profiles', req.params.id, { old: profiles[0].verification_status }, { new: verification_status });

    // Notify mechanic
    await pool.query('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [profiles[0].user_id, 'Profile Verification Update', `Your mechanic profile has been ${verification_status}.`, verification_status === 'verified' ? 'success' : 'warning']);

    res.json({ success: true, message: `Mechanic ${verification_status} successfully` });
  } catch (error) { next(error); }
};

/**
 * Adjust mechanic reward credits with strict validation, reason enforcement, and database transaction.
 */
exports.adjustCredits = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { amount, description } = req.body;
    
    // Strict input validation
    if (typeof amount !== 'number' || isNaN(amount) || amount === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'A non-zero numeric credit adjustment amount is required.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 3) {
      connection.release();
      return res.status(400).json({ success: false, message: 'A clear reason/description is required for administrative credit adjustments.' });
    }

    await connection.beginTransaction();

    const [profiles] = await connection.query('SELECT * FROM mechanic_profiles WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!profiles.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Mechanic not found' });
    }

    const mechanic = profiles[0];

    // Regional Manager scope check
    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      if (mechanic.state !== req.user.assigned_region) {
        await connection.rollback();
        connection.release();
        return res.status(403).json({ success: false, message: 'Forbidden: Mechanic is outside your assigned region.' });
      }
    }

    const newBalance = Math.max(0, mechanic.total_credits + amount);
    const transType = amount > 0 ? 'earned' : 'adjusted';
    const adjRef = `ADJ-${Date.now()}`;

    await connection.query(`
      INSERT INTO credit_transactions (mechanic_id, transaction_type, credit_amount, balance_after, activity_type, activity_reference, description)
      VALUES (?, ?, ?, ?, 'admin_adjustment', ?, ?)
    `, [mechanic.id, transType, Math.abs(amount), newBalance, adjRef, description.trim()]);

    await connection.query('UPDATE mechanic_profiles SET total_credits = ? WHERE id = ?', [newBalance, mechanic.id]);

    await connection.commit();
    connection.release();

    await logAudit(req.user.id, 'ADJUST_CREDITS', 'mechanic_profiles', mechanic.id,
      { old_credits: mechanic.total_credits }, { new_credits: newBalance, amount, reason: description });

    res.json({
      success: true,
      message: 'Credits adjusted successfully',
      data: { previous_balance: mechanic.total_credits, new_balance: newBalance, adjustment: amount },
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

// =================== FITMENTS ===================

exports.getFitments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, verification_status, tyre_brand, state, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT fr.*, mp.ustaad_id, mp.shop_name, mp.city, mp.state as shop_state, u.full_name as mechanic_name, u.mobile_number as mechanic_mobile
      FROM fitment_records fr
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      JOIN users u ON mp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Regional Manager Scope
    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      query += ' AND mp.state = ?';
      params.push(req.user.assigned_region);
    } else if (state) {
      query += ' AND mp.state = ?';
      params.push(state);
    }

    if (verification_status) { query += ' AND fr.verification_status = ?'; params.push(verification_status); }
    if (tyre_brand) { query += ' AND fr.tyre_brand = ?'; params.push(tyre_brand); }
    if (date_from) { query += ' AND fr.installation_date >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND fr.installation_date <= ?'; params.push(date_to); }

    const countQuery = query.replace('SELECT fr.*, mp.ustaad_id, mp.shop_name, mp.city, mp.state as shop_state, u.full_name as mechanic_name, u.mobile_number as mechanic_mobile', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);

    query += ' ORDER BY fr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const [fitments] = await pool.query(query, params);

    res.json({
      success: true,
      data: fitments,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) { next(error); }
};

exports.verifyFitment = async (req, res, next) => {
  try {
    const { verification_status } = req.body;
    if (!['customer_confirmed', 'evidence_submitted', 'verified', 'rejected'].includes(verification_status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const [fitments] = await pool.query(`
      SELECT fr.*, mp.state as mechanic_state
      FROM fitment_records fr
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      WHERE fr.id = ?
    `, [req.params.id]);

    if (!fitments.length) return res.status(404).json({ success: false, message: 'Fitment not found' });

    // Regional Manager Scope
    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      if (fitments[0].mechanic_state !== req.user.assigned_region) {
        return res.status(403).json({ success: false, message: 'Forbidden: Fitment is outside your assigned region.' });
      }
    }

    const verificationLevel = verification_status === 'verified' ? 3 : (verification_status === 'rejected' ? 0 : 2);
    await pool.query('UPDATE fitment_records SET verification_status = ?, verification_level = ? WHERE id = ?',
      [verification_status, verificationLevel, req.params.id]);
    
    await logAudit(req.user.id, 'VERIFY_FITMENT', 'fitment_records', req.params.id,
      { old_status: fitments[0].verification_status }, { new_status: verification_status });

    res.json({ success: true, message: `Fitment updated to '${verification_status}'` });
  } catch (error) { next(error); }
};

// =================== COURSES (Admin CRUD) ===================

exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, category, content_url, thumbnail_url, difficulty, duration_minutes, credit_reward, status, sort_order } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }
    const [result] = await pool.query(`
      INSERT INTO courses (title, description, category, content_url, thumbnail_url, difficulty, duration_minutes, credit_reward, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, category, content_url, thumbnail_url, difficulty || 'beginner', duration_minutes || 30, credit_reward || 15, status || 'draft', sort_order || 0]);
    
    res.status(201).json({ success: true, message: 'Course created', data: { id: result.insertId } });
  } catch (error) { next(error); }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { title, description, category, content_url, thumbnail_url, difficulty, duration_minutes, credit_reward, status, sort_order } = req.body;
    await pool.query(`
      UPDATE courses SET title=?, description=?, category=?, content_url=?, thumbnail_url=?, difficulty=?, duration_minutes=?, credit_reward=?, status=?, sort_order=?
      WHERE id=?
    `, [title, description, category, content_url, thumbnail_url, difficulty, duration_minutes, credit_reward, status, sort_order, req.params.id]);
    res.json({ success: true, message: 'Course updated' });
  } catch (error) { next(error); }
};

exports.addCourseQuestion = async (req, res, next) => {
  try {
    const { question_text, option_a, option_b, option_c, option_d, correct_option, sort_order } = req.body;
    if (!question_text || !option_a || !option_b || !correct_option) {
      return res.status(400).json({ success: false, message: 'Question text, option A, option B, and correct option are required' });
    }
    await pool.query(`
      INSERT INTO course_questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_option, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.params.id, question_text, option_a, option_b, option_c || null, option_d || null, correct_option, sort_order || 0]);
    res.status(201).json({ success: true, message: 'Question added' });
  } catch (error) { next(error); }
};

// =================== ANALYTICS ===================

exports.getRegistrationTrends = async (req, res, next) => {
  try {
    const [trends] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as registrations
      FROM mechanic_profiles
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `);
    res.json({ success: true, data: trends });
  } catch (error) { next(error); }
};

exports.getFitmentTrends = async (req, res, next) => {
  try {
    const [trends] = await pool.query(`
      SELECT DATE_FORMAT(installation_date, '%Y-%m') as month, 
             COUNT(*) as total,
             SUM(CASE WHEN tyre_brand='Eurogrip' THEN 1 ELSE 0 END) as eurogrip
      FROM fitment_records
      GROUP BY DATE_FORMAT(installation_date, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `);
    res.json({ success: true, data: trends });
  } catch (error) { next(error); }
};

exports.getStateWiseStats = async (req, res, next) => {
  try {
    const [stats] = await pool.query(`
      SELECT mp.state, COUNT(DISTINCT mp.id) as mechanic_count, 
             SUM(mp.total_credits) as total_credits,
             COUNT(fr.id) as fitment_count,
             SUM(CASE WHEN fr.tyre_brand='Eurogrip' THEN 1 ELSE 0 END) as eurogrip_fitments
      FROM mechanic_profiles mp
      LEFT JOIN fitment_records fr ON mp.id = fr.mechanic_id
      GROUP BY mp.state
      ORDER BY mechanic_count DESC
    `);
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};

// =================== CSV EXPORT ===================

exports.exportMechanics = async (req, res, next) => {
  try {
    const { Parser } = require('json2csv');
    const { state, verification_status } = req.query;
    
    let query = `
      SELECT mp.ustaad_id, u.full_name, u.mobile_number, mp.shop_name, mp.city, mp.state, 
             mp.pincode, mp.shop_category, mp.experience_years, mp.stocking_status,
             mp.verification_status, mp.total_credits, mp.level, mp.profile_completion,
             u.created_at as registered_at
      FROM mechanic_profiles mp JOIN users u ON mp.user_id = u.id WHERE 1=1
    `;
    const params = [];
    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      query += ' AND mp.state = ?';
      params.push(req.user.assigned_region);
    } else if (state) {
      query += ' AND mp.state = ?';
      params.push(state);
    }
    if (verification_status) { query += ' AND mp.verification_status = ?'; params.push(verification_status); }
    
    const [mechanics] = await pool.query(query, params);
    
    const fields = ['ustaad_id', 'full_name', 'mobile_number', 'shop_name', 'city', 'state', 'pincode', 'shop_category', 'experience_years', 'stocking_status', 'verification_status', 'total_credits', 'level', 'profile_completion', 'registered_at'];
    const parser = new Parser({ fields });
    const csv = parser.parse(mechanics);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('mechanics.csv');
    res.send(csv);
  } catch (error) { next(error); }
};

exports.exportFitments = async (req, res, next) => {
  try {
    const { Parser } = require('json2csv');
    const { date_from, date_to, tyre_brand, state } = req.query;
    
    let query = `
      SELECT fr.passport_id, u.full_name as mechanic_name, mp.ustaad_id, mp.city, mp.state,
             fr.customer_name, fr.customer_mobile, fr.vehicle_category, fr.vehicle_model,
             fr.tyre_brand, fr.tyre_model, fr.tyre_size, fr.axle_position, fr.installation_date,
             fr.verification_status, fr.created_at
      FROM fitment_records fr
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      JOIN users u ON mp.user_id = u.id WHERE 1=1
    `;
    const params = [];
    if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      query += ' AND mp.state = ?';
      params.push(req.user.assigned_region);
    } else if (state) {
      query += ' AND mp.state = ?';
      params.push(state);
    }
    if (tyre_brand) { query += ' AND fr.tyre_brand = ?'; params.push(tyre_brand); }
    if (date_from) { query += ' AND fr.installation_date >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND fr.installation_date <= ?'; params.push(date_to); }

    const [fitments] = await pool.query(query, params);
    const parser = new Parser();
    const csv = parser.parse(fitments);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('fitments.csv');
    res.send(csv);
  } catch (error) { next(error); }
};

// =================== TOOLBANK ADMIN ===================

exports.createToolbankItem = async (req, res, next) => {
  try {
    const { item_name, category, description, credit_requirement, total_quantity, access_type, max_reservation_days } = req.body;
    if (!item_name || !category) {
      return res.status(400).json({ success: false, message: 'Item name and category are required' });
    }
    const [result] = await pool.query(`
      INSERT INTO toolbank_items (item_name, category, description, credit_requirement, total_quantity, available_quantity, access_type, max_reservation_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [item_name, category, description, credit_requirement || 0, total_quantity || 1, total_quantity || 1, access_type || 'individual', max_reservation_days || 7]);
    res.status(201).json({ success: true, message: 'ToolBank item created', data: { id: result.insertId } });
  } catch (error) { next(error); }
};

exports.updateToolbankItem = async (req, res, next) => {
  try {
    const { item_name, category, description, credit_requirement, total_quantity, access_type, max_reservation_days, status } = req.body;
    await pool.query(`
      UPDATE toolbank_items SET item_name=?, category=?, description=?, credit_requirement=?, total_quantity=?, access_type=?, max_reservation_days=?, status=?
      WHERE id=?
    `, [item_name, category, description, credit_requirement, total_quantity, access_type, max_reservation_days, status, req.params.id]);
    res.json({ success: true, message: 'ToolBank item updated' });
  } catch (error) { next(error); }
};

// =================== NOTIFICATIONS ===================

exports.sendNotification = async (req, res, next) => {
  try {
    const { user_id, title, message, type, target } = req.body;
    
    if (target === 'all_mechanics') {
      const [mechanics] = await pool.query('SELECT user_id FROM mechanic_profiles');
      const values = mechanics.map(m => [m.user_id, title, message, type || 'info']);
      if (values.length > 0) {
        await pool.query('INSERT INTO notifications (user_id, title, message, type) VALUES ?', [values]);
      }
      return res.json({ success: true, message: `Notification sent to ${values.length} mechanics` });
    }

    await pool.query('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [user_id, title, message, type || 'info']);
    res.status(201).json({ success: true, message: 'Notification sent' });
  } catch (error) { next(error); }
};

// =================== USERS MANAGEMENT ===================

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    let query = 'SELECT id, full_name, mobile_number, role, status, assigned_region, created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const [users] = await pool.query(query, params);
    res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    await logAudit(req.user.id, 'UPDATE_USER_STATUS', 'users', req.params.id, null, { status });
    res.json({ success: true, message: 'User status updated' });
  } catch (error) { next(error); }
};
