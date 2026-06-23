import { VERIFICATION_CONFIG } from "@/constants/verificationConfig";
import Constants from "expo-constants";

// Try to use the Metro server IP dynamically so real devices can connect
const hostUri = Constants.expoConfig?.hostUri;
let DEV_LAN_IP = "10.254.51.206"; // default fallback
if (hostUri) {
  const ip = hostUri.split(":")[0];
  if (ip) {
    DEV_LAN_IP = ip;
  }
}

const BACKEND_URL = VERIFICATION_CONFIG.BACKEND_URL || `http://${DEV_LAN_IP}:3000`;

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
    console.warn("Backend server connection failed. Falling back to simulated verification. Error:", err.message);
    
    // Graceful fallback to simulation
    return {
      success: true,
      isSimulated: true,
      error: `Could not connect to local server on ${BACKEND_URL}. Using simulation mode.`
    };
  }
}

