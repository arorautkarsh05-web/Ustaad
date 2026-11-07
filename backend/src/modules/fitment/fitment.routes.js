const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./fitment.controller');

// 1. Authenticated mechanic operations (MUST BE DEFINED BEFORE /:passportId WILDCARD!)
router.get('/my', authenticate, authorize('mechanic'), ctrl.getMyFitments);
router.post('/', authenticate, authorize('mechanic'), ctrl.createFitment);
router.post('/:passportId/evidence', authenticate, authorize('mechanic'), ctrl.upload.single('file'), ctrl.uploadEvidence);

// 2. Customer verification endpoints (public)
router.post('/verify-customer', ctrl.verifyCustomerOtp);
router.post('/:passportId/resend-otp', ctrl.resendCustomerOtp);

// 3. Dynamic Passport detail route (handles both public customer view & authenticated mechanic view)
router.get('/:passportId', ctrl.getFitment);

module.exports = router;
