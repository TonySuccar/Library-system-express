const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./.env" });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(toEmail, subject, text) {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: toEmail,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${toEmail}: ${info.response}`);
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error.message);
  }
}

module.exports = { sendEmail };
