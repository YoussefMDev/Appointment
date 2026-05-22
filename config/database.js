const mongoose = require('mongoose');

// تعريف الدالة اللي السيرفر بيدور عليها
const connectDB = async () => {
  try {
    // التأكد إن الرابط موجود في الـ env
    const conn = await mongoose.connect(process.env.DB_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    
    process.exit(1);
  }
};

// عمل export للدالة عشان app.js يشوفها
module.exports = connectDB;