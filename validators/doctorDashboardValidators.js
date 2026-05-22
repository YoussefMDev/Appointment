const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }
  next();
};

exports.updateDoctorProfileValidator = [
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('specialization').optional().notEmpty().withMessage('Specialization cannot be empty'),
  validate
];

exports.updateAvailabilityValidator = [
  body('availableSlots').isArray().withMessage('Available slots must be an array'),
  validate
];