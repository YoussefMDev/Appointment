// --- controllers/doctorDashboardController.js ---
const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');
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
  // 1) تجهيز البيانات النصية
  const updateData = {
    name: req.body.name,
    bio: req.body.bio,
    specialization: req.body.specialization,
    price: req.body.price,
  };

  // 📸 لو الدكتور رفع صور في الـ gallery، بنحول مسارها ونخزنها في مصفوفة
  if (req.files && req.files.length > 0) {
    updateData.gallery = req.files.map(file => file.path || file.filename);
  }

  let updatedDoctor;

  // 2) السيناريو الأول: الدكتور معندوش بروفايل أصلاً (null) -> هنكاريته لأول مرة
  if (!req.user.doctorProfile) {
    updatedDoctor = await Doctor.create({
      user: req.user._id,
      ...updateData
    });

    // تحديث مستند الـ User (دلوقتي هيشتغل لأننا عملنا require فوق)
    await User.findByIdAndUpdate(req.user._id, {
      doctorProfile: updatedDoctor._id
    });

  } else {
    // 3) السيناريو الثاني: الدكتور عنده بروفايل فعلاً -> هنعمل Update طبيعي
    updatedDoctor = await Doctor.findByIdAndUpdate(
      req.user.doctorProfile,
      updateData,
      { new: true, runValidators: true }
    );
  }

  // 4) الـ Response الناجح
  res.status(200).json({
    status: 'success',
    data: {
      doctor: updatedDoctor
    }
  });
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