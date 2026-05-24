// --- routes/appointmentRoutes.js ---
const express = require('express');
const router = express.Router();
const { 
  createAppointmentCheckoutSession, 
  getAllAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment ,bookAppointment,getMyAppointments,
  cancelAppointmentByPatient,
  updateAppointmentDateTime
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// 1. حجز موعد جديد
router.post('/book', bookAppointment);

// 2. رؤية المريض لحجوزاته
router.get('/my-appointments', getMyAppointments);

// 3. إلغاء الحجز بالـ ID
router.patch('/:id/cancel', cancelAppointmentByPatient);

// 4. تعديل الميعاد بالـ ID
router.patch('/:id/reschedule', updateAppointmentDateTime);

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