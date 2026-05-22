// --- routes/reviewRoutes.js ---
const express = require('express');
// mergeParams to allow access to doctorId from nested routes
const router = express.Router({ mergeParams: true }); 
const { 
  getAllReviews, getReview, createReview, updateReview, deleteReview 
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(getAllReviews)
  .post(protect, authorize('user'), createReview);

router.route('/:id')
  .get(getReview)
  .patch(protect, authorize('user', 'admin'), updateReview)
  .delete(protect, authorize('user', 'admin'), deleteReview);

module.exports = router;