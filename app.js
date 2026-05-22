// --- app.js ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');

const connectDB = require('./config/database');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/error');
const { handleStripeWebhook } = require('./controllers/appointmentController');

dotenv.config();
connectDB();

const app = express();

app.post('/webhook-checkout', 
express.raw({ type: 'application/json' }), 
handleStripeWebhook
);

app.use(helmet());
app.use(cors());
//app.use(cors({ origin: 'https://your-frontend-domain.com' })); for specific domain in production

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json({ limit: '30kb' }));
app.use(xss());
app.use(hpp({ whitelist: ['specialization', 'averageRating', 'sort', 'fields'] }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/v1/auth', require('./Routes/authRoutes'));
app.use('/api/v1/users', require('./Routes/userRoutes'));
app.use('/api/v1/doctors', require('./Routes/doctorRoutes'));
app.use('/api/v1/appointments', require('./Routes/appointmentRoutes'));
app.use('/api/v1/reviews', require('./Routes/reviewRoutes'));
app.use('/api/v1/admin', require('./Routes/adminRoutes'));
app.use('/api/v1/doctor-dashboard', require('./Routes/doctorDashboardRoutes'));

// الحل البرنس: استخدام Regular Expression مباشرة
app.all(/.*/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}...`);
  });
}

module.exports = app;