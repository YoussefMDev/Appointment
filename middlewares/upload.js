// --- middlewares/upload.js ---
const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

// 1. Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be saved in the 'uploads' directory at the root of your project
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: fieldname-timestamp-random.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// 2. File Filter (Validation)
const multerFilter = (req, file, cb) => {
  // Allow only images and basic video formats
  const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image or supported video! Please upload only valid media files.', 400), false);
  }
};

// 3. Initialize Multer
const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 1024 * 1024 * 50 // Limit file size to 50MB
  }
});

module.exports = upload;