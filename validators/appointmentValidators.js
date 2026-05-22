// --- validators/appointmentValidators.js ---
const { body, param } = require('express-validator');
const moment = require('moment');

exports.createCheckoutSessionValidator = [
  param('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('appointmentDate').isISO8601().withMessage('Invalid date format (YYYY-MM-DD)')
    .custom((value) => {
      if (!moment(value).isAfter(moment().startOf('day'))) throw new Error('Appointment date must be in the future');
      return true;
    }),
  body('timeSlot').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format (HH:MM)'),
];