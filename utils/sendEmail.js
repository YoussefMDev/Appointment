// --- utils/sendEmail.js ---
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.Email_Host,
    port: process.env.Email_Port,
    auth: {
      user: process.env.Email_Username,
      pass: process.env.Email_Password,
    },
  });

  const mailOptions = {
    from: process.env.Email_Username,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;