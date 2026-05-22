const { param, validationResult } = require('express-validator');

// ميديا وير عشان يجمع الأخطاء ويبعتها لو موجودة
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }
  next();
};

exports.bookingIdValidator = [
  param('id').isMongoId().withMessage('Invalid Booking ID format'),
  validate
];