// --- controllers/adminController.js ---
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const expressAsyncHandler = require('express-async-handler');
const AppError = require('../utils/appError');

exports.getAllUsers = expressAsyncHandler(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({ status: 'success', results: users.length, data: users });
});

exports.manageDoctorProfile = expressAsyncHandler(async (req, res, next) => {
  const updatedData = { ...req.body };
  if (req.file) updatedData.profilePicture = `/uploads/${req.file.filename}`;

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
  if (!doctor) return next(new AppError('No doctor found with that ID', 404));

  res.status(200).json({ status: 'success', data: doctor });
});