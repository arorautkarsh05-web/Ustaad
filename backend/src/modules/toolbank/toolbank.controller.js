const pool = require('../../config/database');
const { logAudit } = require('../../utils/audit');

exports.getItems = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM toolbank_items WHERE status = "active"';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY category, item_name';
    const [items] = await pool.query(query, params);
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
};

exports.getItem = async (req, res, next) => {
  try {
    const [items] = await pool.query('SELECT * FROM toolbank_items WHERE id = ?', [req.params.id]);
    if (!items.length) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: items[0] });
  } catch (error) { next(error); }
};

/**
 * Creates a ToolBank equipment reservation.
 * SECURITY:
 * - Uses MySQL transaction with row-level lock (`FOR UPDATE`) to defeat race conditions.
 * - Prevents double reservations / negative quantities.
 * - Validates credit eligibility strictly on server-side.
 */
exports.createReservation = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const [profiles] = await connection.query('SELECT * FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Complete your profile first' });
    }
    
    const mechanic = profiles[0];
    const { item_id, dealer_id, mechanic_notes } = req.body;

    if (!item_id) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Item ID is required' });
    }

    await connection.beginTransaction();

    // Lock item row FOR UPDATE to prevent concurrent race condition over-reservations
    const [items] = await connection.query('SELECT * FROM toolbank_items WHERE id = ? AND status = "active" FOR UPDATE', [item_id]);
    if (!items.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Item not found or currently inactive' });
    }
    
    const item = items[0];
    
    if (item.available_quantity <= 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Equipment is currently out of stock or fully reserved.' });
    }
    
    if (mechanic.total_credits < item.credit_requirement) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You need ${item.credit_requirement} credits (current balance: ${mechanic.total_credits}).`,
      });
    }

    // Check no active reservation for same item
    const [existing] = await connection.query(`
      SELECT id FROM toolbank_reservations 
      WHERE mechanic_id = ? AND item_id = ? AND reservation_status IN ('pending', 'approved', 'collected')
    `, [mechanic.id, item_id]);

    if (existing.length) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'You already have an active reservation for this equipment.' });
    }

    const expectedReturn = item.max_reservation_days > 0 
      ? new Date(Date.now() + item.max_reservation_days * 24 * 60 * 60 * 1000)
      : null;

    const [result] = await connection.query(`
      INSERT INTO toolbank_reservations (mechanic_id, dealer_id, item_id, expected_return_date, mechanic_notes, reservation_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [mechanic.id, dealer_id || null, item_id, expectedReturn, mechanic_notes || null]);

    // Atomic decrement of available quantity
    const [updateResult] = await connection.query(
      'UPDATE toolbank_items SET available_quantity = available_quantity - 1 WHERE id = ? AND available_quantity > 0',
      [item_id]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Equipment is no longer available.' });
    }

    // Award ToolBank User badge (first reservation)
    const [reservationCount] = await connection.query('SELECT COUNT(*) as cnt FROM toolbank_reservations WHERE mechanic_id = ?', [mechanic.id]);
    if (reservationCount[0].cnt === 1) {
      const [badge] = await connection.query('SELECT id FROM achievement_badges WHERE badge_name = ?', ['ToolBank User']);
      if (badge.length) {
        await connection.query('INSERT IGNORE INTO mechanic_badges (mechanic_id, badge_id) VALUES (?, ?)', [mechanic.id, badge[0].id]);
      }
    }

    await connection.query('INSERT INTO mechanic_activities (mechanic_id, activity_type, description, reference_id) VALUES (?, ?, ?, ?)',
      [mechanic.id, 'toolbank_reservation', `Reserved: ${item.item_name}`, result.insertId]);

    await connection.commit();
    connection.release();

    await logAudit(req.user.id, 'CREATE_RESERVATION', 'toolbank_reservations', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Reservation request submitted successfully. Awaiting dealer confirmation.',
      data: { reservation_id: result.insertId },
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

exports.getMyReservations = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [reservations] = await pool.query(`
      SELECT tr.*, ti.item_name, ti.category, ti.image_url, ti.access_type,
             d.dealer_name, d.city as dealer_city
      FROM toolbank_reservations tr
      JOIN toolbank_items ti ON tr.item_id = ti.id
      LEFT JOIN dealers d ON tr.dealer_id = d.id
      WHERE tr.mechanic_id = ?
      ORDER BY tr.created_at DESC
    `, [profiles[0].id]);

    res.json({ success: true, data: reservations });
  } catch (error) { next(error); }
};

exports.cancelReservation = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const [profiles] = await connection.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await connection.beginTransaction();

    const [reservations] = await connection.query(
      'SELECT * FROM toolbank_reservations WHERE id = ? AND mechanic_id = ? FOR UPDATE',
      [req.params.id, profiles[0].id]
    );

    if (!reservations.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const reservation = reservations[0];
    if (!['pending', 'approved'].includes(reservation.reservation_status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: `Cannot cancel a reservation in '${reservation.reservation_status}' state.` });
    }

    await connection.query('UPDATE toolbank_reservations SET reservation_status = "cancelled" WHERE id = ?', [req.params.id]);
    await connection.query('UPDATE toolbank_items SET available_quantity = available_quantity + 1 WHERE id = ?', [reservation.item_id]);

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Reservation cancelled successfully.' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

/**
 * Dealer Reservations Retrieval
 * SECURITY FIX: Restricts records to assigned dealer or regional scope.
 */
exports.getDealerReservations = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT tr.*, ti.item_name, ti.category, ti.access_type,
             u.full_name as mechanic_name, u.mobile_number as mechanic_mobile,
             mp.ustaad_id, mp.shop_name, mp.city as mechanic_city
      FROM toolbank_reservations tr
      JOIN toolbank_items ti ON tr.item_id = ti.id
      JOIN mechanic_profiles mp ON tr.mechanic_id = mp.id
      JOIN users u ON mp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based scope enforcement
    if (req.user.role === 'dealer') {
      const [dealerRows] = await pool.query('SELECT id, assigned_region FROM dealers WHERE user_id = ?', [req.user.id]);
      if (dealerRows.length) {
        query += ' AND (tr.dealer_id = ? OR tr.dealer_id IS NULL)';
        params.push(dealerRows[0].id);
      }
    } else if (req.user.role === 'regional_manager' && req.user.assigned_region) {
      query += ' AND mp.state = ?';
      params.push(req.user.assigned_region);
    }

    if (status) {
      query += ' AND tr.reservation_status = ?';
      params.push(status);
    }

    query += ' ORDER BY tr.created_at DESC';

    const [reservations] = await pool.query(query, params);
    res.json({ success: true, data: reservations });
  } catch (error) { next(error); }
};

/**
 * Updates ToolBank reservation status.
 * SECURITY FIX: Strict state machine validation preventing double-returns or arbitrary status flips.
 */
exports.updateReservationStatus = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { reservation_status, dealer_notes, equipment_condition_on_return } = req.body;
    const validTargetStatuses = ['approved', 'rejected', 'collected', 'returned'];
    
    if (!validTargetStatuses.includes(reservation_status)) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Invalid target reservation status' });
    }

    await connection.beginTransaction();

    const [reservations] = await connection.query('SELECT * FROM toolbank_reservations WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!reservations.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const currentReservation = reservations[0];
    const currentStatus = currentReservation.reservation_status;

    // Terminal state protection
    if (['returned', 'cancelled', 'rejected'].includes(currentStatus)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Reservation is already in terminal state '${currentStatus}' and cannot be modified further.`,
      });
    }

    // State transition rules:
    // pending -> approved, rejected
    // approved -> collected, rejected
    // collected -> returned
    const validTransitions = {
      pending: ['approved', 'rejected'],
      approved: ['collected', 'rejected'],
      collected: ['returned'],
    };

    if (!validTransitions[currentStatus]?.includes(reservation_status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot transition from '${currentStatus}' to '${reservation_status}'.`,
      });
    }

    const updateData = {
      reservation_status,
      dealer_notes: dealer_notes || currentReservation.dealer_notes,
    };

    if (reservation_status === 'collected') {
      updateData.collection_date = new Date();
    }

    if (reservation_status === 'returned') {
      updateData.actual_return_date = new Date();
      updateData.equipment_condition_on_return = equipment_condition_on_return || 'good';
      // Restore equipment inventory exactly once
      await connection.query('UPDATE toolbank_items SET available_quantity = available_quantity + 1 WHERE id = ?', [currentReservation.item_id]);
    }

    if (reservation_status === 'rejected') {
      // Restore equipment inventory on rejection
      await connection.query('UPDATE toolbank_items SET available_quantity = available_quantity + 1 WHERE id = ?', [currentReservation.item_id]);
    }

    // Attach dealer ID if dealer is acting
    if (req.user.role === 'dealer') {
      const [dealers] = await connection.query('SELECT id FROM dealers WHERE user_id = ?', [req.user.id]);
      if (dealers.length) updateData.dealer_id = dealers[0].id;
    }

    await connection.query('UPDATE toolbank_reservations SET ? WHERE id = ?', [updateData, req.params.id]);

    await connection.commit();
    connection.release();

    await logAudit(req.user.id, 'UPDATE_RESERVATION', 'toolbank_reservations', req.params.id,
      { old: currentStatus }, { new: reservation_status });

    res.json({
      success: true,
      message: `Reservation successfully transitioned from '${currentStatus}' to '${reservation_status}'.`,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};
