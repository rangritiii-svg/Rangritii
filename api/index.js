const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

// Health check — shown when visiting the URL in a browser
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Rangritii API</title>
        <style>
          body { font-family: Arial, sans-serif; background: #1A0A0E; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; }
          .card { background: #2A1018; border: 1px solid #C9932F; border-radius: 16px; padding: 40px 60px; text-align: center; }
          h1 { color: #C9932F; margin: 0 0 8px; font-size: 2rem; }
          p { color: rgba(255,255,255,0.7); margin: 4px 0; }
          .dot { display: inline-block; width: 10px; height: 10px; background: #10B981; border-radius: 50%; margin-right: 6px; }
          .status { margin-top: 20px; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🌿 Rangritii</h1>
          <p>India's Premier Mehndi Artist Marketplace</p>
          <div class="status"><span class="dot"></span>API Server is Live & Running</div>
          <p style="margin-top:16px; font-size:0.8rem; color:#C9932F;">POST /api/verify/email — Email verification endpoint</p>
        </div>
      </body>
    </html>
  `);
});

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

// =========================================================================
// 📱 CUSTOM SMS OTP ROUTES (FAST2SMS / SIMULATION)
// =========================================================================
//
// STATELESS DESIGN — IMPORTANT
// Vercel serverless functions are stateless: the instance that handles
// /api/otp/send is frequently NOT the one that handles /api/otp/verify, so an
// in-memory store (Map) loses the OTP between the two calls and verification
// fails randomly. Instead we issue a signed token: the server never stores the
// code, it sends the code by SMS and returns an HMAC signature of
// (phone + code + expiry). To verify, the client sends the code the user typed
// plus the token; the server recomputes the HMAC and checks it matches. No DB
// needed, and it works across any number of serverless instances.

// Secret used to sign OTP tokens. Set OTP_SECRET in Vercel env for production.
const OTP_SECRET = process.env.OTP_SECRET || 'rangriti-dev-otp-secret-change-me';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Helper to clean phone numbers to 10 digits
function getCleanPhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('91') && clean.length === 12) {
    clean = clean.substring(2);
  }
  return clean;
}

// Compute the HMAC signature binding a phone, code and expiry together.
function signOtp(cleanPhone, code, expiresAt) {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${cleanPhone}.${code}.${expiresAt}`)
    .digest('hex');
}

// Constant-time comparison to avoid timing attacks.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Route to send OTP
app.post('/api/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const cleanPhone = getCleanPhone(phone);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Invalid 10-digit mobile number' });
  }

  const expiresAt = Date.now() + OTP_TTL_MS;

  // Bypass sending real SMS for test/development credentials
  if (cleanPhone === '9999999999') {
    const code = '123456';
    const token = `${expiresAt}.${signOtp(cleanPhone, code, expiresAt)}`;
    console.log(`[TEST BYPASS] OTP for ${cleanPhone} is ${code}`);
    return res.json({ success: true, isSimulated: true, token, message: 'Test OTP generated.' });
  }

  // Generate a random 6-digit OTP and a signed token (code is NOT stored server-side)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = `${expiresAt}.${signOtp(cleanPhone, code, expiresAt)}`;

  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(`[SIMULATED SMS] Phone: +91${cleanPhone}, OTP: ${code}`);
    return res.json({
      success: true,
      isSimulated: true,
      token,
      code, // returned only in simulation mode so testers can see it
      message: 'Fast2SMS API Key not configured. Running in simulation mode.'
    });
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: code,
        numbers: cleanPhone
      })
    });

    const data = await response.json();
    if (response.ok && data.return === true) {
      return res.json({ success: true, isSimulated: false, token, message: 'SMS sent successfully.' });
    } else {
      console.error('Fast2SMS response error:', data);
      return res.status(500).json({ error: data.message || 'Fast2SMS failed to send SMS.' });
    }
  } catch (err) {
    console.error('Fast2SMS fetch error:', err);
    return res.status(500).json({ error: 'Failed to send OTP SMS: ' + err.message });
  }
});

// Route to verify OTP
app.post('/api/otp/verify', async (req, res) => {
  const { phone, otp, token } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone number and OTP code are required' });
  }
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return res.status(400).json({ error: 'Missing or invalid verification token. Please request a new OTP.' });
  }

  const cleanPhone = getCleanPhone(phone);
  const enteredCode = String(otp).trim();

  const dotIndex = token.indexOf('.');
  const expiresAt = parseInt(token.substring(0, dotIndex), 10);
  const providedSig = token.substring(dotIndex + 1);

  if (!expiresAt || Number.isNaN(expiresAt)) {
    return res.status(400).json({ error: 'Invalid verification token. Please request a new OTP.' });
  }

  if (Date.now() > expiresAt) {
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  const expectedSig = signOtp(cleanPhone, enteredCode, expiresAt);
  if (!safeEqual(expectedSig, providedSig)) {
    return res.status(400).json({ error: 'The verification code is incorrect' });
  }

  // OTP is valid!
  return res.json({ success: true });
});

// Export Express app as a Vercel serverless function
module.exports = app;
