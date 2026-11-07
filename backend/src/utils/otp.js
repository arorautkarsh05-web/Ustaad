const crypto = require('crypto');
const pool = require('../config/database');
const { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } = require('../config/constants');

const OTP_RESEND_COOLDOWN_SECONDS = 30; // 30 seconds cooldown between resends

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

/**
 * Cryptographically secure 6-digit OTP generator using Node.js crypto.randomInt
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Dispatches real SMS through configured SMS provider (Fast2SMS / Twilio)
 * Never leaks OTPs in production logs.
 */
const dispatchSMS = async (mobile, otp, purpose) => {
  const messageText = `Your Eurogrip Ustaad Network verification code is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this OTP with anyone.`;

  // 1. Fast2SMS (India Provider)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: mobile,
        }),
      });
      const data = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SMS-Fast2SMS] Dispatched to ${mobile}:`, data.message || data);
      }
      return { sent: true, provider: 'Fast2SMS' };
    } catch (err) {
      console.error('[SMS-Fast2SMS] Error sending SMS:', err.message);
      return { sent: false, provider: 'Fast2SMS', error: err.message };
    }
  }

  // 2. Twilio (Global Provider)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams({
        To: `+91${mobile}`,
        From: process.env.TWILIO_PHONE_NUMBER,
        Body: messageText,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );
      const data = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SMS-Twilio] Dispatched to +91${mobile}: SID ${data.sid}`);
      }
      return { sent: true, provider: 'Twilio' };
    } catch (err) {
      console.error('[SMS-Twilio] Error sending SMS via Twilio:', err.message);
      return { sent: false, provider: 'Twilio', error: err.message };
    }
  }

  // 3. Development Mode Simulation (Only printed in non-production environments)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`📱 [SECURE SMS DISPATCH TO +91 ${mobile}]`);
    console.log(`💬 Purpose: ${purpose}`);
    console.log(`🔑 Verification Code: [ ${otp} ] (Hash: ${hashOtp(otp).slice(0, 16)}...)`);
    console.log(`======================================================\n`);
  }

  return { sent: false, provider: 'console' };
};

const sendOTP = async (mobile, purpose = 'login') => {
  // Cooldown check: prevent SMS bombing / spam
  const [recent] = await pool.query(
    'SELECT created_at FROM otp_verifications WHERE mobile_number = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1',
    [mobile, purpose]
  );

  if (recent.length) {
    const secondsSinceLast = (Date.now() - new Date(recent[0].created_at).getTime()) / 1000;
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      const err = new Error(`Please wait ${waitTime} seconds before requesting a new OTP.`);
      err.statusCode = 429;
      throw err;
    }
  }

  const otp = generateOTP();
  const hashedOtp = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate previous active OTPs for this mobile & purpose
  await pool.query(
    'UPDATE otp_verifications SET is_used = 1 WHERE mobile_number = ? AND purpose = ? AND is_used = 0',
    [mobile, purpose]
  );

  await pool.query(
    'INSERT INTO otp_verifications (mobile_number, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [mobile, hashedOtp, purpose, expiresAt]
  );

  const smsResult = await dispatchSMS(mobile, otp, purpose);

  return {
    success: true,
    message: smsResult.sent ? 'OTP sent via SMS successfully' : 'OTP sent successfully',
    // In development mode, provide devOtp for instant local testing
    ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
  };
};

const verifyOTP = async (mobile, otp, purpose = 'login') => {
  if (!mobile || !otp) {
    return { valid: false, message: 'Mobile number and OTP are required.' };
  }

  const [records] = await pool.query(
    'SELECT * FROM otp_verifications WHERE mobile_number = ? AND purpose = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
    [mobile, purpose]
  );

  if (!records.length) {
    return { valid: false, message: 'No active OTP found. Please request a new OTP.' };
  }

  const record = records[0];

  // Check attempt limit
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await pool.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);
    return { valid: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
  }

  // Check expiry
  if (new Date() > new Date(record.expires_at)) {
    await pool.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  // Increment attempts counter
  await pool.query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [record.id]);

  const hashedInput = hashOtp(otp);
  let matches = false;

  if (record.otp_code.length === 64) {
    // Constant time comparison for hashed OTPs to defeat timing attacks
    const bufA = Buffer.from(hashedInput, 'hex');
    const bufB = Buffer.from(record.otp_code, 'hex');
    matches = (bufA.length === bufB.length) && crypto.timingSafeEqual(bufA, bufB);
  } else {
    // Backward compatibility for legacy plaintext records
    matches = (record.otp_code === String(otp));
  }

  if (!matches) {
    const remaining = OTP_MAX_ATTEMPTS - (record.attempts + 1);
    if (remaining <= 0) {
      await pool.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);
      return { valid: false, message: 'Invalid OTP. Maximum attempts exceeded. Please request a new OTP.' };
    }
    return { valid: false, message: `Invalid OTP. You have ${remaining} attempt(s) remaining.` };
  }

  // Consume OTP (one-time use)
  await pool.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);
  return { valid: true };
};

module.exports = { sendOTP, verifyOTP, generateOTP, hashOtp };
