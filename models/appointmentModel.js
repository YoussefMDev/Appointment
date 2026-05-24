// --- models/appointmentModel.js ---
const mongoose = require('mongoose');
// ✅ التعديل الصحيح والسليم للسكيما
const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentDate: { type: Date, required: [true, 'Appointment date is required'] },
  timeSlot: { type: String, required: [true, 'Time slot is required'] }, // 👈 ده إجباري!
  price: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paymentIntentId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelledByUser', 'cancelledByDoctor'],
    default: 'pending'
  }, // 👈 القوس اتقفل هنا بالظبط لـ status
  paymentMethod: { // 👈 حقل مستقل لوحده تماماً
    type: String,
    enum: ['cash', 'card'],
    default: 'cash'
  }
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);