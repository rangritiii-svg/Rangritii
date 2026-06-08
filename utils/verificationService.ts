import { VERIFICATION_CONFIG } from "@/constants/verificationConfig";

// Try to use the dev machine's active LAN IP so real devices on the same Wi-Fi can connect
// Fallback to localhost for simulators
const DEV_LAN_IP = "10.254.51.206"; 
const BACKEND_URL = `http://${DEV_LAN_IP}:3000`;

/**
 * Sends a real verification code to the target email address via the local backend express server.
 */
export async function sendEmailVerification(email: string, code: string, language: string): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  if (!VERIFICATION_CONFIG.ENABLE_EMAIL_VERIFICATION) {
    console.log("Email verification disabled in config. Skipping API call.");
    return { success: true };
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
        previewUrl: data.previewUrl 
      };
    } else {
      return { 
        success: false, 
        error: data.error || "Failed to send email verification." 
      };
    }
  } catch (err: any) {
    console.warn("Backend server connection failed. Make sure 'npm run server' is running in another terminal. Error:", err.message);
    
    // Developer helper alert
    return {
      success: false,
      error: `Could not connect to the local mail server on ${BACKEND_URL}. Please run 'npm run server' in a second terminal to enable real email verification.`,
    };
  }
}
