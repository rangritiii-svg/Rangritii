export const VERIFICATION_CONFIG = {
  // --- SMTP Gmail Configuration (100% Free) ---
  // To send real emails to your customers/artists:
  // 1. Enter your Gmail address below.
  // 2. Generate a 16-character "App Password" from your Google Account settings
  //    (Security > 2-Step Verification > App Passwords) and enter it below.
  SMTP_USER: "", // e.g. "yourname@gmail.com"
  SMTP_PASS: "", // e.g. "abcd efgh ijkl mnop"

  // --- Backend URL ---
  // When running locally, the mobile app sends requests to the server.
  // Replace this with your active Ngrok/Tunnel URL or LAN IP for phone testing.
  BACKEND_URL: "http://localhost:3000",
  
  // Set to true to verify email addresses (runs verification code)
  ENABLE_EMAIL_VERIFICATION: true,
};
