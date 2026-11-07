const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./admin.controller');

const adminAccess = [authenticate, authorize('regional_manager', 'super_admin')];
const superAdminOnly = [authenticate, authorize('super_admin')];

// Overview
router.get('/dashboard', ...adminAccess, ctrl.getDashboardOverview);

// Mechanics
router.get('/mechanics', ...adminAccess, ctrl.getMechanics);
router.get('/mechanics/:id', ...adminAccess, ctrl.getMechanic);
router.patch('/mechanics/:id/verify', ...adminAccess, ctrl.verifyMechanic);
router.post('/mechanics/:id/credits', ...adminAccess, ctrl.adjustCredits);

// Fitments
router.get('/fitments', ...adminAccess, ctrl.getFitments);
router.patch('/fitments/:id/verify', ...adminAccess, ctrl.verifyFitment);

// Courses
router.post('/courses', ...adminAccess, ctrl.createCourse);
router.put('/courses/:id', ...adminAccess, ctrl.updateCourse);
router.post('/courses/:id/questions', ...adminAccess, ctrl.addCourseQuestion);

// Analytics
router.get('/analytics/registration-trends', ...adminAccess, ctrl.getRegistrationTrends);
router.get('/analytics/fitment-trends', ...adminAccess, ctrl.getFitmentTrends);
router.get('/analytics/state-wise', ...adminAccess, ctrl.getStateWiseStats);

// Exports
router.get('/export/mechanics', ...adminAccess, ctrl.exportMechanics);
router.get('/export/fitments', ...adminAccess, ctrl.exportFitments);

// ToolBank Admin
router.post('/toolbank/items', ...adminAccess, ctrl.createToolbankItem);
router.put('/toolbank/items/:id', ...adminAccess, ctrl.updateToolbankItem);

// Notifications
router.post('/notifications', ...adminAccess, ctrl.sendNotification);

// User management
router.get('/users', ...superAdminOnly, ctrl.getUsers);
router.patch('/users/:id/status', ...superAdminOnly, ctrl.updateUserStatus);

module.exports = router;

