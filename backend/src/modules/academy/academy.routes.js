const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl = require('./academy.controller');

router.use(authenticate);
router.get('/', ctrl.getCourses);
router.get('/mechanic/progress', authorize('mechanic'), ctrl.getProgress);
router.get('/:id', ctrl.getCourse);
router.post('/:id/enrol', authorize('mechanic'), ctrl.enrolCourse);
router.post('/:id/assessment', authorize('mechanic'), ctrl.submitAssessment);

module.exports = router;

