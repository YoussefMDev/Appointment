// --- routes/appointmentRoutes.js ---
const express = require('express');
const router = express.Router();
const { 
  createAppointmentCheckoutSession, 
  getAllAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment ,bookAppointment
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// User booking routes
// router.post('/checkout-session/:doctorId', authorize('user'), createAppointmentCheckoutSession);
router.post('/book', authorize('user'), bookAppointment);
// Admin CRUD routes
router.use(authorize('admin'));

router.route('/')
  .get(getAllAppointments)
  .post(createAppointment);

router.route('/:id')
  .get(getAppointment)
  .patch(updateAppointment)
  .delete(deleteAppointment);

module.exports = router;