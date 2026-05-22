// --- middlewares/auth.js ---
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

exports.protect = expressAsyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next(new AppError('Not authorized, no token provided', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return next(new AppError('The user belonging to this token does no longer exist.', 401));
    next();
  } catch (error) {
    return next(new AppError('Not authorized, invalid token', 401));
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`User role (${req.user.role}) is not authorized to access this route`, 403));
    }
    next();
  };
};