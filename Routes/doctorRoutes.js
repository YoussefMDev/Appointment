// --- routes/doctorRoutes.js ---
const express = require('express');
const router = express.Router();
const { 
  getAllDoctors, getDoctorById, 
  createDoctor, updateDoctor, deleteDoctor 
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.route('/')
  .get(getAllDoctors);

router.route('/:id')
  .get(getDoctorById);

// Admin only routes (CRUD)
router.use(protect, authorize('admin'));

router.route('/')
  .post(createDoctor);

router.route('/:id')
  .patch(updateDoctor)
  .delete(deleteDoctor);

module.exports = router;