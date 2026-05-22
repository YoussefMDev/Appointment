// --- routes/chatbotRoutes.js (في مشروع Node.js) ---
const express = require('express');
const router = express.Router();
const axios = require('axios'); // ستحتاج لتثبيت axios: npm install axios
const { protect } = require('../middlewares/auth');

router.post('/ask', protect, async (req, res, next) => {
  try {
    const { question } = req.body;

    // إرسال السؤال إلى سيرفر الـ Python (FastAPI) الذي يعمل على البورت 8000
    const response = await axios.post('http://localhost:8000/api/chat', {
      question: question
    });

    res.status(200).json({
      status: 'success',
      reply: response.data.reply
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'تعذر الاتصال بالمساعد الذكي حالياً.'
    });
  }
});

module.exports = router;