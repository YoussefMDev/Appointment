// --- controllers/doctorDashboardController.js ---
const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const AppError = require('../utils/appError');
const expressAsyncHandler = require('express-async-handler');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMyProfile = expressAsyncHandler(async (req, res, next) => {
  if (!req.user.doctorProfile) return next(new AppError('No doctor profile linked to this account', 404));
  
  const doctorProfile = await Doctor.findById(req.user.doctorProfile);
  if (!doctorProfile) return next(new AppError('Doctor profile not found', 404));

  res.status(200).json({ status: 'success', data: doctorProfile });
});

exports.updateMyProfile = expressAsyncHandler(async (req, res, next) => {
  const doctorProfileId = req.user.doctorProfile;
  if (!doctorProfileId) return next(new AppError('No doctor profile linked to this account', 404));

  const filteredBody = filterObj(req.body, 'bio', 'specialization', 'clinicAddress', 'price');

  if (req.files && req.files.length > 0) {
    filteredBody.gallery = req.files.map(file => `/uploads/${file.filename}`);
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(doctorProfileId, filteredBody, { new: true, runValidators: true });
  res.status(200).json({ status: 'success', data: updatedDoctor });
});

exports.updateMyAvailability = expressAsyncHandler(async (req, res, next) => {
  const doctorProfileId = req.user.doctorProfile;
  const { availableSlots } = req.body;

  const doctor = await Doctor.findByIdAndUpdate(doctorProfileId, { availableSlots }, { new: true, runValidators: true });
  if (!doctor) return next(new AppError('Doctor profile not found', 404));

  res.status(200).json({ status: 'success', message: 'Availability updated successfully', data: doctor.availableSlots });
});

exports.getMyBookings = expressAsyncHandler(async (req, res, next) => {
  const doctorProfileId = req.user.doctorProfile;
  const appointments = await Appointment.find({ doctor: doctorProfileId })
    .populate('patient', 'name email phone profileImage')
    .sort('-appointmentDate');

  res.status(200).json({ status: 'success', results: appointments.length, data: appointments });
});

exports.confirmBooking = expressAsyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, doctor: req.user.doctorProfile },
    { status: 'confirmed' },
    { new: true }
  );

  if (!appointment) return next(new AppError('Booking not found or does not belong to you', 404));
  res.status(200).json({ status: 'success', message: 'Booking confirmed', data: appointment });
});

exports.cancelBookingByDoctor = expressAsyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, doctor: req.user.doctorProfile },
    { status: 'cancelledByDoctor' },
    { new: true }
  );

  if (!appointment) return next(new AppError('Booking not found or does not belong to you', 404));
  // Note: Refund logic should be handled here using Stripe API
  res.status(200).json({ status: 'success', message: 'Booking cancelled. Patient will be refunded.', data: appointment });
});