// --- controllers/appointmentController.js ---
const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');
const AppError = require('../utils/appError');
const expressAsyncHandler = require('express-async-handler');


// 1. Get all appointments (Read - Admin)
exports.getAllAppointments = expressAsyncHandler(async (req, res, next) => {
  const appointments = await Appointment.find().populate('doctor patient');
  res.status(200).json({ status: 'success', results: appointments.length, data: { appointments } });
});

// 2. Get single appointment (Read)
exports.getAppointment = expressAsyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id).populate('doctor patient');
  if (!appointment) return next(new AppError('No appointment found with that ID', 404));
  res.status(200).json({ status: 'success', data: { appointment } });
});

// 3. Create appointment manually (Create - Admin Card or Cash payment)
exports.createAppointment = expressAsyncHandler(async (req, res, next) => {
  const appointment = await Appointment.create(req.body);
  res.status(201).json({ status: 'success', data: { appointment } });
});

// 4. Update appointment (Update - Admin)
exports.updateAppointment = expressAsyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!appointment) return next(new AppError('No appointment found with that ID', 404));
  res.status(200).json({ status: 'success', data: { appointment } });
});

// 5. Delete appointment (Delete - Admin)
exports.deleteAppointment = expressAsyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) return next(new AppError('No appointment found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});

// 6-User Endpoint: Book an appointment (Handles both Cash and Card)
exports.bookAppointment = expressAsyncHandler(async (req, res, next) => {
  const { doctorId, appointmentDate, timeSlot, paymentMethod } = req.body;

  // 1. Get doctor details
  const doctor = await Doctor.findById(req.body.doctor).lean();
  console.log("Mongoose Found Doctor:", doctor);
  if (!doctor) return next(new AppError('Doctor not found', 404));
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // 2. Check Availability (Is the doctor working on this day/time?)
  const dayName = new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long' });
  const availability = doctor.availableSlots.find(slot => slot.dayOfWeek === dayName);
  
  if (!availability || timeSlot < availability.startTime || timeSlot >= availability.endTime) {
    return next(new AppError('Doctor is not available at this time', 400));
  }

  // 3. Check if the slot is already booked
  const existingAppt = await Appointment.findOne({ 
    doctor: doctorId, 
    appointmentDate, 
    timeSlot, 
    status: { $in: ['pending', 'confirmed'] } 
  });
  if (existingAppt) return next(new AppError('This time slot is already booked', 409));

  // ==========================================
  // 4. BRANCHING BASED ON PAYMENT METHOD
  // ==========================================

  // --- Scenario A: Cash Payment ---
  if (paymentMethod === 'cash') {
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: req.body.doctor,
      appointmentDate,
      timeSlot,
      price: doctor.price,
      paymentMethod: 'cash',
      isPaid: false,
      status: 'pending' // Will be confirmed later by doctor
    });

    return res.status(201).json({ 
      status: 'success', 
      message: 'Appointment booked successfully with cash payment.',
      data: { appointment } 
    });
  }

  // --- Scenario B: Card Payment (Stripe) ---
  if (paymentMethod === 'card') {
    // Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/my-bookings?success=true`,
      cancel_url: `${req.protocol}://${req.get('host')}/doctor/${doctorId}?canceled=true`,
      customer_email: req.user.email,
      client_reference_id: doctorId, // Pass doctor ID
      metadata: { 
        patientId: req.user.id.toString(), 
        appointmentDate: appointmentDate.toString(), 
        timeSlot: timeSlot.toString(),
        paymentMethod: 'card'
      },
      mode: 'payment',
      line_items: [{
        price_data: { 
          currency: 'egp', // يفضل تخليها بجنيه لو شغال في مصر أو usd براحتك
          unit_amount: doctor.price * 100, // Stripe expects amount in cents
          product_data: { name: `استشارة دكتور: ${doctor.name}` } 
        },
        quantity: 1,
      }],
    });

    return res.status(200).json({ 
      status: 'success', 
      message: 'Please complete the payment using the provided session URL.',
      sessionUrl: session.url,
      appointmentId: appointment._id 
    });
  }

  return next(new AppError('Invalid payment method. Choose cash or card.', 400));
});


// ============================================================
//  HELPER FUNCTION TO CREATE APPOINTMENT (ASYNC & BACKGROUND)
// ============================================================
const createCardAppointment = async (session) => {
  try {
    const doctorId = session.client_reference_id;
    const { patientId, appointmentDate, timeSlot } = session.metadata;
    const pricePaid = session.amount_total / 100; // حساب السعر الحقيقي المدفوع من سترايب

    // تأكيد عدم تكرار الحجز عند وصول أكتر من إشعار
    const existing = await Appointment.findOne({ doctor: doctorId, appointmentDate, timeSlot });
    if (existing) return;

    await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      price: pricePaid,
      paymentMethod: 'card',
      isPaid: true,
      status: 'confirmed'
    });

    // زيادة عدد حجوزات الدكتور
    await Doctor.findByIdAndUpdate(doctorId, { $inc: { numberOfAppointments: 1 } });
    console.log(`🎉 Appointment Created Successfully for Patient: ${patientId}`);
  } catch (err) {
    console.error('❌ Error in createCardAppointment background task:', err.message);
  }
};

// ============================================================
// 7. STRIPE WEBHOOK HANDLER
// ============================================================
exports.handleStripeWebhook = expressAsyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  try {
    // تأكد إن req.body واصل كـ Raw Buffer في ملف app.js عشان الـ constructEvent يشتغل صح
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('💳 Payment successful! Processing appointment...');
    
    // استدعاء الدالة لتسجيل البيانات في الخلفية
    await createCardAppointment(session);
  }

  // الرد على سيرفر سترايب فوراً وبشكل منفرد
  res.status(200).json({ received: true });
});

// 🔹 1) جلب الحجوزات الخاصة بالمريض الحالي
exports.getMyAppointments = expressAsyncHandler(async (req, res, next) => {
  // بنجيب الحجوزات اللي فيها الـ patient بيساوي الـ ID بتاع المريض المسجل دخول
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate('doctor', 'name specialization price') // بنعمل populate لبيانات الدكتور عشان تظهر للمريض
    .sort('-appointmentDate'); // الترتيب من الأحدث للأقدم

  res.status(200).json({
    status: 'success',
    results: appointments.length,
    data: { appointments }
  });
});

// 🔹 2) إلغاء الحجز من طرف المريض
exports.cancelAppointmentByPatient = expressAsyncHandler(async (req, res, next) => {
  // بنبص على الحجز بالـ ID بتاعه، ولازم يكون تبع المريض الحالي
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patient: req.user._id
  });

  if (!appointment) {
    return next(new AppError('No appointment found with this ID or you do not have permission', 404));
  }

  // حماية: لو الحجز مخلص أو ملغي قبل كدة ميتلغيش تاني
  if (['completed', 'cancelledByUser', 'cancelledByDoctor'].includes(appointment.status)) {
    return next(new AppError(`Cannot cancel an appointment that is already ${appointment.status}`, 400));
  }

  // تغيير الحالة لـ ملغي بواسطة المستخدم
  appointment.status = 'cancelledByUser';
  await appointment.save();

  // 💡 هنا مستقبلاً لو الدفع كارت (Stripe) بتنادي دالة الـ Refund الـ أنت مجهزها

  res.status(200).json({
    status: 'success',
    message: 'Appointment cancelled successfully',
    data: { appointment }
  });
});

// 🔹 3) تعديل موعد الحجز (تغيير التاريخ أو الـ Time Slot)
exports.updateAppointmentDateTime = expressAsyncHandler(async (req, res, next) => {
  const { appointmentDate, timeSlot } = req.body;

  if (!appointmentDate || !timeSlot) {
    return next(new AppError('Please provide a new appointment date and time slot', 400));
  }

  // البحث عن الحجز والتأكد إنه يخص المريض الحالي
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patient: req.user._id
  });

  if (!appointment) {
    return next(new AppError('No appointment found with this ID or you do not have permission', 404));
  }

  // حماية: ميعاد الحجز ميتعدلش لو اتلغى أو خلص
  if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
    return next(new AppError('Cannot reschedule a completed or cancelled appointment', 400));
  }

  // حماية لمنع التعارض (نفس الدكتور ونفس الوقت):
  const conflict = await Appointment.findOne({
    doctor: appointment.doctor,
    appointmentDate: new Date(appointmentDate),
    timeSlot: timeSlot,
    status: { $in: ['pending', 'confirmed'] } // التعارض يحصل لو فيه حجز قائم فعلاً
  });

  if (conflict) {
    return next(new AppError('This time slot is already booked for this doctor. Choose another one.', 400));
  }

  // تحديث البيانات
  appointment.appointmentDate = appointmentDate;
  appointment.timeSlot = timeSlot;
  await appointment.save();

  res.status(200).json({
    status: 'success',
    message: 'Appointment rescheduled successfully',
    data: { appointment }
  });
});

// // 7. Stripe Checkout Session (Online Payment)
// exports.createAppointmentCheckoutSession = expressAsyncHandler(async (req, res, next) => {
//   
//   const { doctorId } = req.params;
//   const { appointmentDate, timeSlot } = req.body;

//   const doctor = await Doctor.findById(doctorId);
//   if (!doctor) return next(new AppError('Doctor not found', 404));

//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     success_url: `${req.protocol}://${req.get('host')}/my-bookings?success=true`,
//     cancel_url: `${req.protocol}://${req.get('host')}/doctor/${doctorId}?canceled=true`,
//     customer_email: req.user.email,
//     client_reference_id: doctorId,
//     metadata: { patientId: req.user.id.toString(), appointmentDate, timeSlot },
//     mode: 'payment',
//     line_items: [{
//       price_data: { currency: 'usd', unit_amount: doctor.price * 100, product_data: { name: `${doctor.name} Consultation` } },
//       quantity: 1,
//     }],
//   });

//   res.status(200).json({ status: 'success', session });
// });