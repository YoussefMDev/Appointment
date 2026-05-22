// --- routes/doctorDashboardRoutes.js ---
const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, updateMyAvailability, getMyBookings, confirmBooking, cancelBookingByDoctor } = require('../controllers/doctorDashboardController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { updateDoctorProfileValidator, updateAvailabilityValidator } = require('../validators/doctorDashboardValidators');
const { bookingIdValidator } = require('../validators/bookingStatusValidators');

router.use(protect, authorize('doctor'));

router.get('/my-profile', getMyProfile);
console.log("Controller Function Check:", updateMyProfile);
router.patch('/my-profile', upload.array('gallery', 5), updateDoctorProfileValidator, updateMyProfile);
router.put('/my-availability', updateAvailabilityValidator, updateMyAvailability);
router.get('/my-bookings', getMyBookings);
router.patch('/my-bookings/:id/confirm', bookingIdValidator, confirmBooking);
router.patch('/my-bookings/:id/cancel', bookingIdValidator, cancelBookingByDoctor);

module.exports = router;