const nodemailer = require("nodemailer");

const sendMail = async (toEmail, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.APP_MAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.APP_MAIL,
    to: toEmail,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

module.exports = { sendMail };
