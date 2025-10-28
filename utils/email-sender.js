// utils/email-sender.js

import nodemailer from 'nodemailer';

/**
 * Sends an email with a PDF attachment.
 * @param {string} to - Recipient's email address.
 * @param {string} subject - Email subject line.
 * @param {string} text - Plain text body of the email.
 * @param {Buffer} pdfBuffer - The buffer containing the PDF invoice data.
 * @param {string} fileName - The name for the attached PDF file.
 * @returns {Promise<object>} - Nodemailer's sendMail response.
 */
async function sendInvoiceEmail(to, subject, text, pdfBuffer, fileName) {
    // 1. Create a transporter using environment variables
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // Use TLS (true for 465, false for 587)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // 2. Define mail options
    const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: to,
        subject: subject,
        text: text,
        // Optional: include HTML body if you want
        // html: '<b>Hello world?</b>', 
        attachments: [
            {
                filename: fileName,
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ],
    };

    // 3. Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw new Error('Failed to send email via SMTP.');
    }
}

export { sendInvoiceEmail };

