// --- validators/authValidators.js ---
const { body, validationResult } = require('express-validator');
const User = require('../models/userModel');

// 🚀 ميدياوير وسيط لجمع أخطاء الـ validation وتمرير الريكويست للـ Controller التالي
const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next(); // 🔴 السطر السحري اللي بيحل المشكلة وينقل الريكويست للـ Controller
};

// 1. Register Validator
exports.registerValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) return Promise.reject('E-mail already in use');
    }),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  validatorMiddleware // 👈 تشغيل ميدياوير جمع الأخطاء في النهاية
];

// 2. Login Validator
exports.loginValidator = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  
  validatorMiddleware // 👈 تشغيل ميدياوير جمع الأخطاء في النهاية
];

// 3. Forgot Password Validator
exports.forgotPasswordValidator = [
  body('email').isEmail().withMessage('Invalid email address'),
  
  validatorMiddleware // 👈 تشغيل ميدياوير جمع الأخطاء في النهاية
];

// 4. Reset Password Validator
exports.resetPasswordValidator = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  
  validatorMiddleware // 👈 تشغيل ميدياوير جمع الأخطاء في النهاية
];