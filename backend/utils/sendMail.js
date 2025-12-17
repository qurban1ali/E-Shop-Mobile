const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true only for port 465
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // remove in production
    },
  });

  const mailOptions = {
    from: `"Your App Name" <${process.env.SMTP_MAIL}>`, // looks professional
    to: options.email,
    subject: options.subject,
    text: options.text || "Your verification code is attached.", // fallback plain text
    html: options.message, // THIS IS THE FIX
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;