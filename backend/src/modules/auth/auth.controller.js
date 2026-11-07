const jwt = require('jsonwebtoken');
const pool = require('../../config/database');
const { sendOTP, verifyOTP } = require('../../utils/otp');
const { generateUstaadId } = require('../../utils/ustaadId');
const { logAudit } = require('../../utils/audit');

exports.sendOtp = async (req, res, next) => {
  try {
    const { mobile_number, purpose = 'login' } = req.body;
    if (!mobile_number || !/^[6-9]\d{9}$/.test(mobile_number)) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number. Must be 10 digits starting with 6-9.' });
    }
    const result = await sendOTP(mobile_number, purpose);
    res.json({
      success: true,
      message: result.message || 'OTP sent successfully',
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (error) { next(error); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { mobile_number, otp, purpose = 'login', role: requestedRole, full_name } = req.body;

    if (!mobile_number || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required.' });
    }

    const result = await verifyOTP(mobile_number, otp, purpose);
    if (!result.valid) return res.status(400).json({ success: false, message: result.message });

    let [users] = await pool.query('SELECT * FROM users WHERE mobile_number = ?', [mobile_number]);
    let user = users[0];
    let isNew = false;

    if (!user) {
      // SECURITY: Restrict public self-registration roles.
      // Disallow client from requesting 'super_admin', 'regional_manager', or 'dealer'.
      const allowedPublicRoles = ['mechanic', 'customer'];
      const safeRole = allowedPublicRoles.includes(requestedRole) ? requestedRole : 'mechanic';

      const assignedName = full_name?.trim() || `Ustaad Mechanic (${mobile_number.slice(-4)})`;
      const [insertResult] = await pool.query(
        'INSERT INTO users (full_name, mobile_number, role, status) VALUES (?, ?, ?, ?)',
        [assignedName, mobile_number, safeRole, 'active']
      );
      const [newUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
      user = newUsers[0];
      isNew = true;

      // Auto-create mechanic profile if role is mechanic
      if (user.role === 'mechanic') {
        const ustaadId = await generateUstaadId('Maharashtra');
        await pool.query(
          `INSERT INTO mechanic_profiles 
            (user_id, ustaad_id, shop_name, shop_address, city, state, pincode, shop_category, experience_years, stocking_status, verification_status, total_credits, profile_completion, level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, ustaadId, 'My Garage Workshop', '', 'Pune', 'Maharashtra', '', 'motorcycle_repair', 1, 'planning_to_stock', 'verified', 25, 75, 'beginner']
        );
      }
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    if (user.status === 'pending' && user.role === 'mechanic') {
      await pool.query('UPDATE users SET status = ? WHERE id = ?', ['active', user.id]);
      user.status = 'active';
    }

    // Get mechanic profile if applicable
    let mechanicProfile = null;
    if (user.role === 'mechanic') {
      const [profiles] = await pool.query('SELECT * FROM mechanic_profiles WHERE user_id = ?', [user.id]);
      mechanicProfile = profiles[0] || null;
    } else if (user.role === 'dealer') {
      const [dealers] = await pool.query('SELECT * FROM dealers WHERE user_id = ?', [user.id]);
      mechanicProfile = dealers[0] || null;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, assignedRegion: user.assigned_region || null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await logAudit(user.id, 'LOGIN', 'users', user.id);

    res.json({
      success: true,
      message: isNew ? 'Registration successful' : 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          mobile_number: user.mobile_number,
          role: user.role,
          status: user.status,
          assigned_region: user.assigned_region || null,
        },
        mechanicProfile,
        isNew,
      },
    });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, mobile_number, role, status, preferred_language, assigned_region, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!users.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    let profile = null;
    if (req.user.role === 'mechanic') {
      const [profiles] = await pool.query('SELECT * FROM mechanic_profiles WHERE user_id = ?', [req.user.id]);
      profile = profiles[0] || null;
    } else if (req.user.role === 'dealer') {
      const [profiles] = await pool.query('SELECT * FROM dealers WHERE user_id = ?', [req.user.id]);
      profile = profiles[0] || null;
    }
    res.json({ success: true, data: { user: users[0], profile } });
  } catch (error) { next(error); }
};

exports.logout = async (req, res) => {
  if (req.user) {
    await logAudit(req.user.id, 'LOGOUT', 'users', req.user.id);
  }
  res.json({ success: true, message: 'Logged out successfully' });
};
