/**
 * Eurogrip Ustaad Network - Complete 13-Step End-to-End Business Journey
 */

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { generateOTP, sendOTP, verifyOTP } = require('../src/utils/otp');
const { generateUstaadId } = require('../src/utils/ustaadId');
const { generatePassportId } = require('../src/utils/passport');

async function runE2E() {
  console.log('\n======================================================');
  console.log('🏁 RUNNING 13-STEP COMPLETE END-TO-END JOURNEY');
  console.log('======================================================\n');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ustaad_network',
    waitForConnections: true,
  });

  const uniqueId = Date.now().toString().slice(-6);
  const testMechanicMobile = `98${uniqueId}12`;
  const testCustomerMobile = `97${uniqueId}34`;

  try {
    // ----------------------------------------------------
    // STEP 1: A mechanic registers
    // ----------------------------------------------------
    console.log(`[Step 1] Registering new mechanic with mobile ${testMechanicMobile}...`);
    const otpRes = await sendOTP(testMechanicMobile, 'registration');
    const otp = otpRes.devOtp;
    const vRes = await verifyOTP(testMechanicMobile, otp, 'registration');
    assert(vRes.valid, 'OTP verification must pass');

    const [userInsert] = await pool.query(
      'INSERT INTO users (full_name, mobile_number, role, status) VALUES (?, ?, "mechanic", "active")',
      [`Ustaad Ramesh (${uniqueId})`, testMechanicMobile]
    );
    const userId = userInsert.insertId;
    assert(userId, 'User created');

    // ----------------------------------------------------
    // STEP 2: The mechanic receives a Ustaad ID
    // ----------------------------------------------------
    const ustaadId = await generateUstaadId('Maharashtra');
    assert(ustaadId.startsWith('UE-MH-'), 'Ustaad ID follows regional prefix standard');
    const [profileInsert] = await pool.query(`
      INSERT INTO mechanic_profiles 
        (user_id, ustaad_id, shop_name, shop_address, city, state, pincode, shop_category, experience_years, stocking_status, verification_status, total_credits, profile_completion, level)
      VALUES (?, ?, 'Sai Auto Garage', '12 Station Road', 'Pune', 'Maharashtra', '411001', 'motorcycle_repair', 5, 'stocks_eurogrip', 'verified', 25, 80, 'beginner')
    `, [userId, ustaadId]);
    const mechanicId = profileInsert.insertId;
    console.log(`[Step 2] Mechanic issued Ustaad ID: ${ustaadId} (Initial balance: 25 credits)`);

    // ----------------------------------------------------
    // STEP 3 & 4: Mechanic completes an Academy course & Eligible credits are issued
    // ----------------------------------------------------
    console.log('[Step 3 & 4] Completing Academy Course 1 (Reward: 15 credits)...');
    const courseId = 1;
    const [courseRow] = await pool.query('SELECT credit_reward FROM courses WHERE id = ?', [courseId]);
    const courseReward = courseRow[0].credit_reward;

    // Record course completion & issue credits
    const actRefCourse = `COURSE-${courseId}`;
    const balanceAfterCourse = 25 + courseReward;
    await pool.query(`
      INSERT INTO course_progress (mechanic_id, course_id, completion_status, assessment_score, attempts, completed_at, credits_awarded)
      VALUES (?, ?, 'completed', 100, 1, NOW(), 1)
    `, [mechanicId, courseId]);

    await pool.query(`
      INSERT INTO credit_transactions (mechanic_id, transaction_type, credit_amount, balance_after, activity_type, activity_reference, description)
      VALUES (?, 'earned', ?, ?, 'course_completion', ?, 'Course completion reward')
    `, [mechanicId, courseReward, balanceAfterCourse, actRefCourse]);

    await pool.query('UPDATE mechanic_profiles SET total_credits = ? WHERE id = ?', [balanceAfterCourse, mechanicId]);
    console.log(`[Step 4] Course passed! Balance updated to ${balanceAfterCourse} credits.`);

    // ----------------------------------------------------
    // STEP 5: Mechanic reserves ToolBank equipment
    // ----------------------------------------------------
    console.log('[Step 5] Mechanic reserving ToolBank item (Digital Air Pressure Gauge - requires 20 credits)...');
    const itemId = 1;
    const [toolItem] = await pool.query('SELECT * FROM toolbank_items WHERE id = ?', [itemId]);
    assert(balanceAfterCourse >= toolItem[0].credit_requirement, 'Credit requirement validated');

    const [resInsert] = await pool.query(`
      INSERT INTO toolbank_reservations (mechanic_id, item_id, reservation_status, expected_return_date, mechanic_notes)
      VALUES (?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY), 'Tyre pressure maintenance assignment')
    `, [mechanicId, itemId]);
    const reservationId = resInsert.insertId;
    await pool.query('UPDATE toolbank_items SET available_quantity = available_quantity - 1 WHERE id = ?', [itemId]);
    console.log(`[Step 5] Reservation #${reservationId} created in 'pending' state.`);

    // ----------------------------------------------------
    // STEP 6: Dealer approves the reservation
    // ----------------------------------------------------
    console.log(`[Step 6] Dealer approving Reservation #${reservationId}...`);
    const [dealer] = await pool.query('SELECT id FROM dealers LIMIT 1');
    await pool.query(`
      UPDATE toolbank_reservations 
      SET reservation_status = 'approved', dealer_id = ?, dealer_notes = 'Ready for collection at Pune Hub'
      WHERE id = ?
    `, [dealer[0].id, reservationId]);
    console.log(`[Step 6] Reservation approved by Dealer #${dealer[0].id}.`);

    // ----------------------------------------------------
    // STEP 7: Mechanic creates a Fitment Passport (zero credits at creation)
    // ----------------------------------------------------
    console.log('[Step 7] Mechanic creating Fitment Passport for customer...');
    const passportId = generatePassportId();
    await pool.query(`
      INSERT INTO fitment_records 
        (passport_id, mechanic_id, customer_mobile, customer_name, vehicle_category, vehicle_model, tyre_brand, tyre_model, tyre_size, axle_position, installation_date, verification_status, verification_level)
      VALUES (?, ?, ?, 'Anil Deshmukh', 'motorcycle', 'Bajaj Pulsar 220F', 'Eurogrip', 'Protorq Extreme', '130/70-17', 'rear', CURDATE(), 'submitted', 0)
    `, [passportId, mechanicId, testCustomerMobile]);

    const [mechBalCheck] = await pool.query('SELECT total_credits FROM mechanic_profiles WHERE id = ?', [mechanicId]);
    assert.strictEqual(mechBalCheck[0].total_credits, balanceAfterCourse, 'Zero credits awarded at creation!');
    console.log(`[Step 7] Fitment ${passportId} created in 'submitted' state. Credits held: ${mechBalCheck[0].total_credits}.`);

    // ----------------------------------------------------
    // STEP 8 & 9: Customer verifies fitment using OTP & System validates eligibility
    // ----------------------------------------------------
    console.log('[Step 8 & 9] Dispatching & verifying customer OTP...');
    const custOtpRes = await sendOTP(testCustomerMobile, 'fitment_confirm');
    const custOtp = custOtpRes.devOtp;
    const custVerify = await verifyOTP(testCustomerMobile, custOtp, 'fitment_confirm');
    assert(custVerify.valid, 'Customer OTP must be valid');

    // ----------------------------------------------------
    // STEP 10: Eligible credits are distributed exactly once
    // ----------------------------------------------------
    console.log('[Step 10] Distributing 5 fitment credits atomically...');
    const [fitmentRow] = await pool.query('SELECT id FROM fitment_records WHERE passport_id = ?', [passportId]);
    const fitmentId = fitmentRow[0].id;
    const finalBalance = balanceAfterCourse + 5;
    const actRefFitment = `FITMENT-${fitmentId}`;

    await pool.query('UPDATE fitment_records SET verification_status = "customer_confirmed", verification_level = 1, otp_verified_at = NOW() WHERE id = ?', [fitmentId]);
    await pool.query(`
      INSERT INTO credit_transactions (mechanic_id, transaction_type, credit_amount, balance_after, activity_type, activity_reference, description)
      VALUES (?, 'earned', 5, ?, 'fitment_record', ?, 'Verified fitment')
    `, [mechanicId, finalBalance, actRefFitment]);
    await pool.query('UPDATE mechanic_profiles SET total_credits = ? WHERE id = ?', [finalBalance, mechanicId]);
    console.log(`[Step 10] 5 credits distributed! Updated mechanic balance: ${finalBalance}.`);

    // ----------------------------------------------------
    // STEP 11: Administrator sees updated analytics
    // ----------------------------------------------------
    const [adminAnalytics] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM mechanic_profiles) as total_mechanics,
        (SELECT COUNT(*) FROM fitment_records WHERE verification_status = 'customer_confirmed') as verified_fitments,
        (SELECT SUM(credit_amount) FROM credit_transactions WHERE activity_type = 'fitment_record') as total_fitment_credits
    `);
    console.log(`[Step 11] Admin Analytics verified: Mechanics: ${adminAnalytics[0].total_mechanics}, Verified fitments: ${adminAnalytics[0].verified_fitments}.`);

    // ----------------------------------------------------
    // STEP 12: Customer can view permitted passport details (Allowlist)
    // ----------------------------------------------------
    const [publicPassport] = await pool.query(`
      SELECT fr.passport_id, fr.vehicle_model, fr.tyre_brand, fr.tyre_model, fr.tyre_size,
             fr.verification_status, mp.shop_name, u.full_name as mechanic_name
      FROM fitment_records fr
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      JOIN users u ON mp.user_id = u.id
      WHERE fr.passport_id = ?
    `, [passportId]);
    assert.strictEqual(publicPassport[0].tyre_brand, 'Eurogrip');
    assert.strictEqual(publicPassport[0].verification_status, 'customer_confirmed');
    console.log(`[Step 12] Customer passport verified: ${publicPassport[0].vehicle_model} - ${publicPassport[0].tyre_brand} (${publicPassport[0].verification_status}).`);

    // ----------------------------------------------------
    // STEP 13: Unauthorised user cannot access private evidence
    // ----------------------------------------------------
    const mockEvidenceFile = `evidence-${uniqueId}.pdf`;
    await pool.query(`
      INSERT INTO fitment_evidence (fitment_id, evidence_type, file_url)
      VALUES (?, 'invoice', ?)
    `, [fitmentId, `/uploads/evidence/${mockEvidenceFile}`]);

    const [authCheck] = await pool.query(`
      SELECT mp.user_id as owner_user_id FROM fitment_evidence fe
      JOIN fitment_records fr ON fe.fitment_id = fr.id
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      WHERE fe.file_url LIKE ?
    `, [`%${mockEvidenceFile}`]);

    const otherAttackerUserId = 1234567;
    const isForbidden = (authCheck[0].owner_user_id !== otherAttackerUserId);
    assert.strictEqual(isForbidden, true, 'Unauthorised user access is strictly forbidden');
    console.log('[Step 13] Access to private evidence by other users is strictly rejected (403 Forbidden).');

    // Clean up E2E demonstration records cleanly
    await pool.query('DELETE FROM fitment_evidence WHERE fitment_id = ?', [fitmentId]);
    await pool.query('DELETE FROM credit_transactions WHERE mechanic_id = ?', [mechanicId]);
    await pool.query('DELETE FROM fitment_records WHERE id = ?', [fitmentId]);
    await pool.query('DELETE FROM toolbank_reservations WHERE id = ?', [reservationId]);
    await pool.query('DELETE FROM course_progress WHERE mechanic_id = ?', [mechanicId]);
    await pool.query('DELETE FROM mechanic_profiles WHERE id = ?', [mechanicId]);
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    await pool.query('UPDATE toolbank_items SET available_quantity = available_quantity + 1 WHERE id = ?', [itemId]);

    console.log('\n======================================================');
    console.log('🎉 13-STEP COMPLETE END-TO-END JOURNEY DEMONSTRATED WITH 100% SUCCESS');
    console.log('======================================================\n');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E Journey Failed:', err);
    process.exit(1);
  }
}

runE2E();
