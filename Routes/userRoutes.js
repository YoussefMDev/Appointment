// --- routes/userRoutes.js ---
const express = require('express');
const router = express.Router();
const { 
  updateMe, deleteMe, getMe, getUser, 
  getAllUsers, createUser, updateUser, deleteUser 
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Protect all routes after this middleware
router.use(protect);

// User specific routes
router.get('/me', getMe, getUser);
router.patch('/update-me', upload.single('profileImage'), updateMe);
router.delete('/delete-me', deleteMe);

// Admin specific routes (CRUD)
router.use(authorize('admin'));

router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;