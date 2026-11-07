const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./toolbank.controller');

router.use(authenticate);
router.get('/items', ctrl.getItems);
router.get('/items/:id', ctrl.getItem);
router.post('/reservations', authorize('mechanic'), ctrl.createReservation);
router.get('/reservations/my', authorize('mechanic'), ctrl.getMyReservations);
router.patch('/reservations/:id/cancel', authorize('mechanic'), ctrl.cancelReservation);
router.get('/reservations/dealer', authorize('dealer', 'regional_manager', 'super_admin'), ctrl.getDealerReservations);
router.patch('/reservations/:id/status', authorize('dealer', 'regional_manager', 'super_admin'), ctrl.updateReservationStatus);

module.exports = router;

