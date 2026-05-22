// --- routes/adminRoutes.js ---
const express = require('express');
const router = express.Router();
const { getAllUsers, manageDoctorProfile } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('admin'));
router.get('/users', getAllUsers);
router.put('/doctors/:id', manageDoctorProfile);

module.exports = router;