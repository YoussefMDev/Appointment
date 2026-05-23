// --- models/userModel.js ---
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  phone: { type: String },
  role: { type: String, enum: ['user', 'doctor', 'admin'], default: 'user' },
  profileImage: { type: String },
  doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  passwordResetToken: String,
  passwordResetExpires: Date,
}, { timestamps: true });

userSchema.pre('save', async function() {
  // لو الباسورد متعدلش، اخرج فوراً من الدالة (Mongoose هيفهم لوحده وينقل على الخطوة اللي بعدها)
  if (!this.isModified('password')) return;
  
  // تشفير الباسورد
  const bcrypt = require('bcryptjs'); // أو حسب المكتبة اللي مستخدمها
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);