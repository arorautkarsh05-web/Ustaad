const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./mechanics.controller');

router.use(authenticate, authorize('mechanic'));
router.get('/profile', ctrl.getProfile);
router.post('/profile', ctrl.createProfile);
router.put('/profile', ctrl.updateProfile);
router.get('/dashboard', ctrl.getDashboard);
router.get('/activities', ctrl.getActivities);
router.get('/credits', ctrl.getCredits);

module.exports = router;

