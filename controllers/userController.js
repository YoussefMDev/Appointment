// --- controllers/userController.js ---
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

// 1. Get current logged in user (Read - Self)
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// 2. Update current logged in user (Update - Self)
exports.updateMe = expressAsyncHandler(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /reset-password.', 400));
  }
  const filteredBody = filterObj(req.body, 'name', 'phone');
  if (req.file) filteredBody.profileImage = `/uploads/${req.file.filename}`;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

// 3. Deactivate current user account (Delete - Self)
exports.deleteMe = expressAsyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: 'success', data: null });
});

// --- ADMIN CRUD OPERATIONS ---

// 4. Get all users (Read - Admin)
exports.getAllUsers = expressAsyncHandler(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({ status: 'success', results: users.length, data: { users } });
});

// 5. Get single user (Read - Admin)
exports.getUser = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));
  res.status(200).json({ status: 'success', data: { user } });
});

// 6. Create user (Create - Admin)
exports.createUser = expressAsyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);
  res.status(201).json({ status: 'success', data: { user } });
});

// 7. Update user (Update - Admin)
exports.updateUser = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!user) return next(new AppError('No user found with that ID', 404));
  res.status(200).json({ status: 'success', data: { user } });
});

// 8. Delete user (Delete - Admin)
exports.deleteUser = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});