// --- models/reviewModel.js ---
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: true });

reviewSchema.statics.calculateAverageRating = async function (doctorId) {
  const stats = await this.aggregate([
    { $match: { doctor: doctorId } },
    { $group: { _id: '$doctor', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
  ]);
  if (stats.length > 0) {
    await mongoose.model('Doctor').findByIdAndUpdate(doctorId, {
      numberOfReviews: stats[0].nRating,
      averageRating: stats[0].avgRating.toFixed(1)
    });
  } else {
    await mongoose.model('Doctor').findByIdAndUpdate(doctorId, { numberOfReviews: 0, averageRating: 0 });
  }
};

reviewSchema.post('save', function () { this.constructor.calculateAverageRating(this.doctor); });
reviewSchema.post('remove', function () { this.constructor.calculateAverageRating(this.doctor); });

module.exports = mongoose.model('Review', reviewSchema);