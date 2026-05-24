// --- controllers/reviewController.js ---
const Review = require('../models/reviewModel');
const expressAsyncHandler = require('express-async-handler');
const AppError = require('../utils/appError');

// 1. Get all reviews (Read)
exports.getAllReviews = expressAsyncHandler(async (req, res, next) => {
  let filter = {};
  if (req.params.doctorId) filter = { doctor: req.params.doctorId };
  
  const reviews = await Review.find(filter).populate('patient', 'name profileImage');
  res.status(200).json({ status: 'success', results: reviews.length, data: { reviews } });
});

// 2. Get single review (Read)
exports.getReview = expressAsyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('No review found with that ID', 404));
  res.status(200).json({ status: 'success', data: { review } });
});

// 3. Create review (Create)
exports.createReview = expressAsyncHandler(async (req, res, next) => {
  if (!req.body.doctor) req.body.doctor = req.params.doctorId;
  if (!req.body.patient) req.body.patient = req.user.id;

  const existingReview = await Review.findOne({ doctor: req.body.doctor, patient: req.body.patient });
  if (existingReview) return next(new AppError('You have already reviewed this doctor', 400));

  const review = await Review.create(req.body);
  res.status(201).json({ status: 'success', data: { review } });
});

// 4. Update review (Update)
exports.updateReview = expressAsyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('No review found with that ID', 404));

  // Check ownership
  if (review.patient.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this review', 403));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ status: 'success', data: { review } });
});

// 5. Delete review (Delete)
exports.deleteReview = expressAsyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('No review found with that ID', 404));

  // Check ownership
  if (review.patient.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this review', 403));
  }

  await review.deleteOne();
  res.status(204).json({ status: 'success', data: null });
});