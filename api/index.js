const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// Enable CORS for Expo clients
app.use(cors());
app.use(express.json());

// =========================================================================
// ✉️ SMTP EMAIL CONFIGURATION (100% FREE)
// =========================================================================
// Fill in your Gmail details to send emails to real inboxes 24/7 in the cloud.
// It is recommended to set these as Vercel Environment Variables: SMTP_USER and SMTP_PASS.
const SMTP_USER = process.env.SMTP_USER || ""; // e.g. "yourname@gmail.com"
const SMTP_PASS = process.env.SMTP_PASS || ""; // e.g. "abcd efgh ijkl mnop" (Google App Password)
// =========================================================================

app.post('/api/verify/email', async (req, res) => {
  const { email, code, language } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  let transporter;
  let isEthereal = false;

  try {
    if (SMTP_USER && SMTP_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    } else {
      isEthereal = true;
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const isHindi = language === 'hi_IN';
    const subject = isHindi 
      ? 'रंगरीति सुरक्षा सत्यापन कोड' 
      : 'Rangritii Security Verification Code';

    const textContent = isHindi
      ? `नमस्ते,\n\nरंगरीति में आपका स्वागत है! आपका ईमेल सत्यापन कोड है: ${code}\n\nयह कोड 10 मिनट के लिए वैध है। कृपया इसे किसी के साथ साझा न करें।\n\nसादर,\nरंगरीति टीम`
      : `Hello,\n\nWelcome to Rangritii! Your email security verification code is: ${code}\n\nThis code is valid for 10 minutes. Please do not share it with anyone.\n\nBest regards,\nRangritii Team`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #7C3F00; text-align: center;">Rangritii</h2>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 16px; color: #333;">
          ${isHindi ? 'नमस्ते,' : 'Hello,'}
        </p>
        <p style="font-size: 15px; color: #555; line-height: 24px;">
          ${isHindi 
            ? 'रंगरीति में आपका स्वागत है! अपने ईमेल पते को सत्यापित करने के लिए कृपया नीचे दिए गए 4-अंकीय सत्यापन कोड का उपयोग करें:' 
            : 'Welcome to Rangritii! To verify your email address, please use the 4-digit verification code below:'}
        </p>
        <div style="background-color: #FFF8F0; border: 1px dashed #C85C00; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #7C3F00; font-family: monospace;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #888;">
          ${isHindi 
            ? 'यह कोड 10 मिनट के लिए वैध है। यदि आपने इसका अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।' 
            : 'This code is valid for 10 minutes. If you did not request this, please ignore this email.'}
        </p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          © ${new Date().getFullYear()} Rangritii. All rights reserved.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: SMTP_USER ? `"Rangritii" <${SMTP_USER}>` : '"Rangritii Admin" <no-reply@rangritii.com>',
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      return res.json({ 
        success: true, 
        isEthereal: true,
        previewUrl: previewUrl,
        message: 'Mail sent to temporary test inbox.'
      });
    } else {
      return res.json({ 
        success: true, 
        isEthereal: false,
        message: 'Mail successfully delivered.'
      });
    }

  } catch (err) {
    return res.status(500).json({ error: 'Failed to send verification email: ' + err.message });
  }
});

// Export Express app as a Vercel serverless function
module.exports = app;
