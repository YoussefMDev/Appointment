// --- models/doctorModel.js ---
const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  slotDurationMinutes: { type: Number, required: true, default: 30 },
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Doctor name is required'] },
  specialization: { type: String, required: [true, 'Specialization is required'] },
  qualifications: [{ type: String }],
  bio: { type: String },
  clinicAddress: { type: String },
  profilePicture: { type: String },
  gallery: [{ type: String }],
  price: { type: Number, required: [true, 'Consultation price is required'] },
  averageRating: { type: Number, default: 0 },
  numberOfReviews: { type: Number, default: 0 },
  availableSlots: [availabilitySchema]
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);