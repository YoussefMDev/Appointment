// --- routes/userRoutes.js ---
const express = require('express');
const router = express.Router();
const { 
  updateMe, deleteMe, getMe, getUser, 
  getAllUsers, createUser, updateUser, deleteUser 
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// 🔐 1) ميدياوير الحماية لجميع المسارات القادمة
router.use(protect);

// 👤 2) المسارات الثابتة الخاصة بالمستخدم الحالي (Static Routes First 🌟)
router.get('/me', getMe, getUser);
router.patch('/update-me', upload.single('profileImage'), updateMe); // 👈 التزم بالـ Dash دي في بوستمان
router.delete('/delete-me', deleteMe);

// 👑 3) مسارات لوحة تحكم الأدمن فقط (Admin CRUD Operations)
router.use(authorize('admin'));

router.route('/')
  .get(getAllUsers)
  .post(createUser);

// ⏬ المسارات المتغيرة (Dynamic Parametric Routes) تحت خالص دائماً لمنع الـ CastError
router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;