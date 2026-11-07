const pool = require('../../config/database');
const jwt = require('jsonwebtoken');
const { generatePassportId, generateQRCode } = require('../../utils/passport');
const { sendOTP, verifyOTP } = require('../../utils/otp');
const { logAudit } = require('../../utils/audit');
const multer = require('multer');
const path = require('path');

// Multer config for evidence uploads with strict file restrictions
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/evidence/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|webp|pdf/;
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.test(ext)) {
    return cb(null, true);
  }
  cb(new Error('Only images (JPEG, PNG, WEBP) and PDF files are allowed for fitment evidence'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});
exports.upload = upload;

/**
 * Creates a new fitment passport.
 * SECURITY: NEVER awards credits here. Credits are strictly held pending customer OTP verification.
 * Prevents mechanics from using their own phone number as customer phone.
 */
exports.createFitment = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT mp.*, u.mobile_number as mechanic_mobile FROM mechanic_profiles mp JOIN users u ON mp.user_id = u.id WHERE mp.user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Complete your profile first' });

    const mechanic = profiles[0];
    const {
      customer_mobile,
      customer_name,
      vehicle_category,
      vehicle_model,
      tyre_brand,
      tyre_model,
      tyre_size,
      axle_position,
      installation_date,
      dealer_invoice_ref,
      notes,
    } = req.body;

    // Input Validation
    if (!customer_mobile || !/^[6-9]\d{9}$/.test(customer_mobile)) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit customer mobile number is required' });
    }

    if (!vehicle_category || !tyre_brand || !tyre_size || !axle_position || !installation_date) {
      return res.status(400).json({ success: false, message: 'Vehicle category, tyre brand, size, axle position, and installation date are required' });
    }

    // ANTI-FRAUD: Prevent mechanic from using their own phone as customer phone
    if (customer_mobile === mechanic.mechanic_mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mechanic mobile number cannot be used as the customer mobile number.',
      });
    }

    const passportId = generatePassportId();

    // Insert record with status 'submitted' and verification_level 0
    const [result] = await pool.query(`
      INSERT INTO fitment_records 
        (passport_id, mechanic_id, customer_mobile, customer_name, vehicle_category, vehicle_model, tyre_brand, tyre_model, tyre_size, axle_position, installation_date, dealer_invoice_ref, notes, verification_status, verification_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 0)
    `, [
      passportId,
      mechanic.id,
      customer_mobile,
      customer_name || 'Customer',
      vehicle_category,
      vehicle_model || null,
      tyre_brand,
      tyre_model || null,
      tyre_size,
      axle_position,
      installation_date,
      dealer_invoice_ref || null,
      notes || null,
    ]);

    // Send confirmation OTP to the customer
    let otpResult = { sent: false };
    try {
      otpResult = await sendOTP(customer_mobile, 'fitment_confirm');
    } catch (otpErr) {
      console.warn('[Fitment OTP Warning]:', otpErr.message);
    }

    const qrData = await generateQRCode(passportId, process.env.APP_BASE_URL || 'http://localhost:3000');

    await pool.query('INSERT INTO mechanic_activities (mechanic_id, activity_type, description) VALUES (?, ?, ?)',
      [mechanic.id, 'fitment_created', `Created fitment passport: ${passportId} (Awaiting customer verification)`]);

    await logAudit(req.user.id, 'CREATE_FITMENT', 'fitment_records', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Fitment passport created successfully. Customer confirmation OTP has been dispatched.',
      data: {
        passport_id: passportId,
        qr_code: qrData.qrDataUrl,
        qr_url: qrData.url,
        status: 'submitted',
        ...(otpResult.devOtp ? { devOtp: otpResult.devOtp } : {}),
      },
    });
  } catch (error) { next(error); }
};

exports.getMyFitments = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { page = 1, limit = 20, status, tyre_brand } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM fitment_records WHERE mechanic_id = ?';
    const params = [profiles[0].id];
    if (status) { query += ' AND verification_status = ?'; params.push(status); }
    if (tyre_brand) { query += ' AND tyre_brand = ?'; params.push(tyre_brand); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [fitments] = await pool.query(query, params);
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM fitment_records WHERE mechanic_id = ?', [profiles[0].id]);

    res.json({
      success: true,
      data: fitments,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) { next(error); }
};

/**
 * Fitment Passport Retrieval
 * SECURITY:
 * - Public viewers receive an allowlist response with masked phone and no private internal documents.
 * - Authenticated mechanic owners or administrators receive complete details including uploaded evidence.
 */
exports.getFitment = async (req, res, next) => {
  try {
    let authUser = req.user || null;
    if (!authUser && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [uRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [decoded.userId]);
        if (uRows.length) authUser = uRows[0];
      } catch (e) {
        // Public view
      }
    }

    const [fitments] = await pool.query(`
      SELECT fr.id, fr.passport_id, fr.vehicle_category, fr.vehicle_model, fr.tyre_brand, fr.tyre_model,
             fr.tyre_size, fr.axle_position, fr.installation_date, fr.verification_status,
             fr.verification_level, fr.customer_name, fr.customer_mobile, fr.dealer_invoice_ref,
             fr.notes, fr.created_at,
             mp.ustaad_id, mp.shop_name, mp.city, mp.state, u.full_name as mechanic_name,
             mp.user_id as mechanic_user_id
      FROM fitment_records fr
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      JOIN users u ON mp.user_id = u.id
      WHERE fr.passport_id = ?
    `, [req.params.passportId]);

    if (!fitments.length) {
      return res.status(404).json({ success: false, message: 'Fitment passport not found' });
    }

    const row = fitments[0];
    const qrData = await generateQRCode(req.params.passportId, process.env.APP_BASE_URL || 'http://localhost:3000');

    const isAuthorizedOwner = authUser && (authUser.id === row.mechanic_user_id || ['super_admin', 'regional_manager'].includes(authUser.role));

    // Sanitized Base Response
    const responseData = {
      id: row.id,
      passport_id: row.passport_id,
      customer_name: row.customer_name || 'Customer',
      customer_mobile_masked: row.customer_mobile ? `******${row.customer_mobile.slice(-4)}` : null,
      vehicle_category: row.vehicle_category,
      vehicle_model: row.vehicle_model,
      tyre_brand: row.tyre_brand,
      tyre_model: row.tyre_model,
      tyre_size: row.tyre_size,
      axle_position: row.axle_position,
      installation_date: row.installation_date,
      verification_status: row.verification_status,
      verification_level: row.verification_level,
      ustaad_id: row.ustaad_id,
      shop_name: row.shop_name,
      mechanic_name: row.mechanic_name,
      shop_location: [row.city, row.state].filter(Boolean).join(', '),
      qr_code: qrData.qrDataUrl,
      created_at: row.created_at,
    };

    if (isAuthorizedOwner) {
      const [evidence] = await pool.query('SELECT * FROM fitment_evidence WHERE fitment_id = ?', [row.id]);
      responseData.customer_mobile = row.customer_mobile;
      responseData.dealer_invoice_ref = row.dealer_invoice_ref;
      responseData.notes = row.notes;
      responseData.evidence = evidence || [];
    }

    res.json({ success: true, data: responseData });
  } catch (error) { next(error); }
};

/**
 * Customer Verification & Idempotent Reward Distribution
 * SECURITY FIX:
 * - Uses MySQL transaction with row lock.
 * - Enforces customer phone match.
 * - Prevents duplicate credit distribution via unique activity reference and status checks.
 * - Prevents mechanic self-verification.
 */
exports.verifyCustomerOtp = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { passport_id, otp, customer_mobile } = req.body;

    if (!passport_id || !otp || !customer_mobile) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Passport ID, mobile number, and OTP are required' });
    }

    await connection.beginTransaction();

    // Select fitment FOR UPDATE to lock row against concurrent verification requests
    const [fitments] = await connection.query(`
      SELECT fr.*, mp.id as mechanic_profile_id, mp.total_credits, u.mobile_number as mechanic_mobile
      FROM fitment_records fr
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      JOIN users u ON mp.user_id = u.id
      WHERE fr.passport_id = ? FOR UPDATE
    `, [passport_id]);

    if (!fitments.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Fitment passport not found' });
    }

    const fitment = fitments[0];

    // Phone match validation
    if (fitment.customer_mobile !== customer_mobile) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Mobile number does not match passport customer record' });
    }

    // ANTI-FRAUD: Mechanic self-verification prevention
    if (fitment.customer_mobile === fitment.mechanic_mobile) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Mechanic self-verification is not permitted' });
    }

    // Idempotency: If already confirmed or verified, do not re-issue credits!
    if (fitment.verification_status !== 'submitted') {
      await connection.rollback();
      connection.release();
      return res.json({
        success: true,
        message: 'Fitment has already been verified and credits previously issued.',
        data: { status: fitment.verification_status, already_confirmed: true },
      });
    }

    // Verify OTP using secure verification util
    const otpResult = await verifyOTP(customer_mobile, otp, 'fitment_confirm');
    if (!otpResult.valid) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: otpResult.message });
    }

    // 1. Update Fitment status to customer_confirmed
    await connection.query(`
      UPDATE fitment_records 
      SET verification_status = 'customer_confirmed', verification_level = 1, otp_verified_at = NOW()
      WHERE id = ?
    `, [fitment.id]);

    // 2. Distribute credits (5 credits for verified fitment) exactly once
    const activityRef = `FITMENT-${fitment.id}`;
    const [existingCredit] = await connection.query(`
      SELECT id FROM credit_transactions 
      WHERE mechanic_id = ? AND activity_type = 'fitment_record' AND activity_reference = ?
    `, [fitment.mechanic_profile_id, activityRef]);

    let newBalance = fitment.total_credits;
    if (!existingCredit.length) {
      newBalance = fitment.total_credits + 5;
      await connection.query(`
        INSERT INTO credit_transactions 
          (mechanic_id, transaction_type, credit_amount, balance_after, activity_type, activity_reference, description)
        VALUES (?, 'earned', 5, ?, 'fitment_record', ?, ?)
      `, [fitment.mechanic_profile_id, newBalance, activityRef, `Fitment verified: ${passport_id}`]);

      await connection.query('UPDATE mechanic_profiles SET total_credits = ? WHERE id = ?', [newBalance, fitment.mechanic_profile_id]);

      // Check level upgrades
      if (newBalance >= 300) {
        await connection.query('UPDATE mechanic_profiles SET level = "champion" WHERE id = ?', [fitment.mechanic_profile_id]);
      } else if (newBalance >= 100) {
        await connection.query('UPDATE mechanic_profiles SET level = "professional" WHERE id = ?', [fitment.mechanic_profile_id]);
      }

      // Check Fitment Star badge (first verified fitment)
      const [fitmentCount] = await connection.query(`
        SELECT COUNT(*) as cnt FROM fitment_records 
        WHERE mechanic_id = ? AND verification_status IN ('customer_confirmed', 'evidence_submitted', 'verified')
      `, [fitment.mechanic_profile_id]);

      if (fitmentCount[0].cnt === 1) {
        const [badge] = await connection.query('SELECT id FROM achievement_badges WHERE badge_name = ?', ['Fitment Star']);
        if (badge.length) {
          await connection.query('INSERT IGNORE INTO mechanic_badges (mechanic_id, badge_id) VALUES (?, ?)', [fitment.mechanic_profile_id, badge[0].id]);
        }
      }

      await connection.query('INSERT INTO mechanic_activities (mechanic_id, activity_type, description, reference_id) VALUES (?, ?, ?, ?)',
        [fitment.mechanic_profile_id, 'fitment_verified', `Fitment ${passport_id} customer confirmed (+5 credits)`, fitment.id]);
    }

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Tyre fitment verified successfully. 5 reward credits awarded to mechanic.',
      data: { passport_id, verification_status: 'customer_confirmed' },
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

exports.uploadEvidence = async (req, res, next) => {
  try {
    const [profiles] = await pool.query('SELECT id FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Profile not found' });

    const [fitments] = await pool.query('SELECT * FROM fitment_records WHERE passport_id = ? AND mechanic_id = ?', [req.params.passportId, profiles[0].id]);
    if (!fitments.length) return res.status(404).json({ success: false, message: 'Fitment not found' });

    const { evidence_type, evidence_reference } = req.body;
    const file_url = req.file ? `/uploads/evidence/${req.file.filename}` : null;

    if (!file_url && !evidence_reference) {
      return res.status(400).json({ success: false, message: 'Please provide an evidence file or reference' });
    }

    await pool.query(`
      INSERT INTO fitment_evidence (fitment_id, evidence_type, evidence_reference, file_url)
      VALUES (?, ?, ?, ?)
    `, [fitments[0].id, evidence_type || 'invoice', evidence_reference || null, file_url]);

    // Update status to evidence_submitted
    if (fitments[0].verification_status === 'customer_confirmed') {
      await pool.query('UPDATE fitment_records SET verification_status = "evidence_submitted", verification_level = 2 WHERE id = ?', [fitments[0].id]);
    }

    res.status(201).json({ success: true, message: 'Evidence uploaded successfully' });
  } catch (error) { next(error); }
};

exports.resendCustomerOtp = async (req, res, next) => {
  try {
    const [fitments] = await pool.query('SELECT * FROM fitment_records WHERE passport_id = ?', [req.params.passportId]);
    if (!fitments.length) return res.status(404).json({ success: false, message: 'Fitment not found' });

    if (!fitments[0].customer_mobile) {
      return res.status(400).json({ success: false, message: 'No customer mobile on record' });
    }

    const result = await sendOTP(fitments[0].customer_mobile, 'fitment_confirm');
    res.json({
      success: true,
      message: 'OTP sent to customer mobile',
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (error) { next(error); }
};
