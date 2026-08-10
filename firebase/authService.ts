/**
 * authService.ts
 * Custom Phone Authentication helpers for RangRiti.
 * Replaces Firebase Phone Auth with our custom Express/Vercel backend.
 */

import { VERIFICATION_CONFIG } from "@/constants/verificationConfig";
import Constants from "expo-constants";
import { Alert } from "react-native";

// Always point at the production Vercel API. The local-IP fallback was only
// useful during early development and caused confusing errors in production APKs.
const PROD_URL = "https://rangritii-api.vercel.app";
const BACKEND_URL = VERIFICATION_CONFIG.BACKEND_URL || PROD_URL;

/**
 * The opaque challenge returned by sendPhoneOtp and passed back to
 * verifyPhoneOtp. Holds the phone number and the server-signed token that
 * proves which code was issued (the code itself never leaves the SMS/device).
 */
export interface NativeConfirmationResult {
  phone: string;
  token: string;
}

/**
 * Sends a custom OTP SMS via the backend.
 * @param phoneNumber Full number, e.g. "+919876543210" or "9876543210"
 * @returns A challenge object to be passed to verifyPhoneOtp
 */
export async function sendPhoneOtp(
  phoneNumber: string
): Promise<NativeConfirmationResult> {
  const response = await fetch(`${BACKEND_URL}/api/otp/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone: phoneNumber }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to send verification SMS");
  }

  if (!data.token) {
    throw new Error("Server did not return a verification token. Please try again.");
  }

  // If in simulation mode, alert developer/user with the code so they don't get stuck
  if (data.isSimulated && data.code) {
    Alert.alert(
      "Simulated OTP 📲",
      `Fast2SMS key not set. Your simulated OTP is: ${data.code}`
    );
  }

  return { phone: phoneNumber, token: data.token };
}

/**
 * Verifies the custom OTP via the backend.
 * @param challenge The confirmationResult returned by sendPhoneOtp
 * @param code The 6-digit verification code the user entered
 */
export async function verifyPhoneOtp(
  challenge: NativeConfirmationResult,
  code: string
) {
  const response = await fetch(`${BACKEND_URL}/api/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone: challenge.phone, otp: code, token: challenge.token }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Verification failed");
  }

  return { success: true };
}
