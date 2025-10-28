const nodemailer = require('nodemailer');

// IONOS SMTP Setup
const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.com',
  port: 587, // Use 465 for SSL
  secure: false,
  auth: {
    user: 'm19u3l@sd-bcs.com',  // Your IONOS email
    pass: 'YOUR_IONOS_PASSWORD', // Your IONOS password or app password
  },
});

// Send email function
async function sendInvoiceEmail(to, subject, text, attachmentBuffer, filename) {
  const mailOptions = {
    from: '"Miguel" <m19u3l@sd-bcs.com>',
    to,
    subject,
    text,
    attachments: [
      { filename, content: attachmentBuffer },
    ],
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendInvoiceEmail };

