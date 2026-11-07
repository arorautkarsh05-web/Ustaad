const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const authController = require('./auth.controller');

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

module.exports = router;

