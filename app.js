// --- app.js ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

const connectDB = require('./config/database');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/error');
const { handleStripeWebhook } = require('./controllers/appointmentController');

// 1) Initializations
dotenv.config();
connectDB();

const app = express();

// 2) Vercel/Proxy Settings (لازم فوق خالص)
app.set('trust proxy', 1);

// 3) الـ Stripe Webhook (مكانها الصح هنا قبل الـ JSON Parsers عشان الـ Raw Body)
app.post('/webhook-checkout', express.raw({ type: 'application/json' }), handleStripeWebhook);

// 4) Global Parsers (للـ APIs العادية)
app.use(express.json({ limit: '30kb' }));
app.use(express.urlencoded({ extended: true, limit: '30kb' }));

// 5) Security Middlewares
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // شغل المورجان لوكال بس عشان النظافة
}

// 6) Rate Limiting & Parameter Pollution
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);
app.use(hpp({ whitelist: ['specialization', 'averageRating', 'sort', 'fields'] }));

// 7) Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 8) Routes Mapping (تأكد من الحروف الكبيرة والصغيرة في اسم فولدر Routes)
app.use('/api/v1/auth', require('./Routes/authRoutes'));
app.use('/api/v1/users', require('./Routes/userRoutes'));
app.use('/api/v1/doctors', require('./Routes/doctorRoutes'));
app.use('/api/v1/appointments', require('./Routes/appointmentRoutes'));
app.use('/api/v1/reviews', require('./Routes/reviewRoutes'));
app.use('/api/v1/admin', require('./Routes/adminRoutes'));
app.use('/api/v1/doctor-dashboard', require('./Routes/doctorDashboardRoutes'));

// 9) Handling Unhandled Routes
app.all(/.*/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 10) Global Error Handler (آخر ميدياوير تماماً)
app.use(globalErrorHandler);

// 11) Local Server Environment Only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}...`);
  });
}

module.exports = app;