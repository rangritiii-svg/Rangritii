/**
 * Local development server.
 *
 * Serves the EXACT same Express app that runs on Vercel (api/index.js) —
 * email verification, SMS OTP and admin auth endpoints — so local testing
 * (`npm run server`) always matches production.
 *
 * Env vars honoured (same as Vercel): SMTP_USER, SMTP_PASS, OTP_SECRET,
 * FAST2SMS_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_EMAILS, ADMIN_SECRET.
 */

const app = require('./api/index.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🌿 Rangritii API running locally on http://localhost:${PORT}`);
  console.log('   Endpoints: /api/verify/email · /api/otp/send · /api/otp/verify');
  console.log('              /api/admin/login · /api/admin/google · /api/admin/session\n');
});
