const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text }) {
  // Настройки берём из .env
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 2525,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    }
  });

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@example.com',
    to,
    subject,
    text,
  });

  console.log('Email sent:', info.messageId);
  return info;
}

module.exports = sendEmail;
