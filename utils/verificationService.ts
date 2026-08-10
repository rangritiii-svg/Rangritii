// Always use the production Vercel URL. Fall back to local IP only in dev
// when BACKEND_URL is explicitly not set (never in a production APK build).
const PROD_URL = "https://rangritii-api.vercel.app";
const BACKEND_URL = VERIFICATION_CONFIG.BACKEND_URL || PROD_URL;

/**
 * Sends a real verification code to the target email address via the local backend express server.
 * Gracefully falls back to simulated mode if the server is down.
 */
export async function sendEmailVerification(email: string, code: string, language: string): Promise<{ success: boolean; previewUrl?: string; isSimulated?: boolean; error?: string }> {
  if (!VERIFICATION_CONFIG.ENABLE_EMAIL_VERIFICATION) {
    console.log("Email verification disabled in config. Skipping API call.");
    return { success: true, isSimulated: true };
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/verify/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code, language }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return { 
        success: true, 
        previewUrl: data.previewUrl,
        isSimulated: data.isEthereal
      };
    } else {
      return { 
        success: false, 
        error: data.error || "Failed to send email verification." 
      };
    }
  } catch (err: any) {
    // Network error reaching the backend — silently fall back to simulation
    // so registration can still proceed. Do NOT show dev/IP details to users.
    console.warn("Email verification backend unreachable, using simulation:", err.message);
    return { success: true, isSimulated: true };
  }
}

