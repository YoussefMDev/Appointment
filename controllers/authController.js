// --- controllers/authController.js ---
const User = require('../models/userModel');
const Doctor = require('../models/doctorModel');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const expressAsyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const AppError = require('../utils/appError');

exports.registerUser = expressAsyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  
  // 1) تكريت المستخدم في كوليكشن الـ Users
  const user = await User.create({ name, email, password, role });
  
  // 🩺 2) لو الـ Role اللي مبعوتة هي doctor، بنكريت له بروفايل دكتور فوراً
  if (role === 'doctor') {
    const newDoctorProfile = await Doctor.create({
      user: user._id,
      name: user.name, // بنمرر الاسم المبدئي
      specialization: 'General', // قيمة افتراضية لحد ما يعدلها
      price: 100 // قيمة افتراضية
    });

    // نربط الـ Profile ID اللي اتكريت جوه مستند الـ User
    user.doctorProfile = newDoctorProfile._id;
    await user.save({ validateBeforeSave: false });
  }
  
  res.status(201).json({ 
    status: 'success', 
    token: generateToken(user._id), 
    data: { user } 
  });
});

exports.loginUser = expressAsyncHandler(async (req, res, next) => {
  

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  res.status(200).json({ status: 'success', token: generateToken(user._id), data: { user } });
});

exports.forgotPassword = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(200).json({ status: 'success', message: 'Token sent to email!' });

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({ to: user.email, subject: 'Your password reset token (valid for 10 min)', text: message });
    res.status(200).json({ status: 'success', message: 'Token sent to email!' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

exports.resetPassword = expressAsyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({ status: 'success', token: generateToken(user._id) });
});