// --- controllers/doctorController.js ---
const Doctor = require('../models/doctorModel');
const expressAsyncHandler = require('express-async-handler');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

// 1. Get all doctors (Read)
exports.getAllDoctors = expressAsyncHandler(async (req, res, next) => {
  
  const queryObj = { ...req.query };

  // 2) بناء الـ Query وتشغيل الميزات المتقدمة (Filtering, Sorting, Limiting, Pagination)
  const features = new APIFeatures(Doctor.find().populate('reviews'), queryObj)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // 3) تنفيذ الـ Query النهائي وجلب البيانات من قاعدة البيانات
  const doctors = await features.query;

  // 4) إرسال الـ Response بنجاح للمستخدم
  res.status(200).json({ 
    status: 'success', 
    results: doctors.length, 
    data: { doctors } 
  });
});
// 2. Get single doctor (Read)
exports.getDoctorById = expressAsyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).populate('reviews');
  if (!doctor) return next(new AppError('No doctor found with that ID', 404));
  res.status(200).json({ status: 'success', data: { doctor } });
});

// --- ADMIN CRUD OPERATIONS ---

// 3. Create doctor (Create - Admin)
exports.createDoctor = expressAsyncHandler(async (req, res, next) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({ status: 'success', data: { doctor } });
});

// 4. Update doctor (Update - Admin)
exports.updateDoctor = expressAsyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!doctor) return next(new AppError('No doctor found with that ID', 404));
  res.status(200).json({ status: 'success', data: { doctor } });
});

// 5. Delete doctor (Delete - Admin)
exports.deleteDoctor = expressAsyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) return next(new AppError('No doctor found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});