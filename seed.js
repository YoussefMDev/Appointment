const mongoose = require('mongoose');
const dotenv = require('dotenv');
// استدعاء الموديل بتاعك (تأكد من المسار الصحيح)
const Doctor = require('./models/doctorModel'); 

dotenv.config();

const sampleDoctors = [
  {
    name: "أحمد علي",
    specialization: "قلب وأوعية دموية",
    price: 500,
    bio: "خبير في جراحات القلب والقسطرة، خبرة 20 عاماً.",
    availableSlots: ["الأحد 10:00 صباحاً", "الثلاثاء 02:00 ظهراً"]
  },
  {
    name: "سارة محمود",
    specialization: "جلدية وتجميل",
    price: 350,
    bio: "متخصصة في علاج الأمراض الجلدية وجراحات الليزر.",
    availableSlots: ["الاثنين 11:00 صباحاً", "الأربعاء 04:00 عصراً"]
  },
  {
    name: "ياسين حسن",
    specialization: "عظام",
    price: 400,
    bio: "استشاري جراحة العظام والمفاصل الصناعية.",
    availableSlots: ["السبت 09:00 صباحاً", "الخميس 01:00 ظهراً"]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ متصل بالداتابيز للبدء في رفع البيانات...");

    // مسح الداتا القديمة عشان ميتكررش
    await Doctor.deleteMany({});
    
    // إدخال الداتا الجديدة
    await Doctor.insertMany(sampleDoctors);
    
    console.log("🚀 تم رفع بيانات الدكاترة بنجاح!");
    process.exit();
  } catch (err) {
    console.error("❌ فشل في رفع البيانات:", err);
    process.exit(1);
  }
};

seedDB();