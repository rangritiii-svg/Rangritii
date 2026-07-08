/**
 * authService.ts
 * Firebase Phone Authentication helpers for RangRiti.
 *
 * Uses the Firebase JS SDK v9+ modular API.
 * On React Native / Expo, signInWithPhoneNumber does NOT require a
 * RecaptchaVerifier — passing undefined is correct for the native client.
 */

import { signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { auth } from "./config";

/**
 * Sends a real OTP SMS to the given phone number via Firebase Phone Auth.
 * @param phoneNumber  Full E.164 number, e.g. "+919876543210"
 * @returns ConfirmationResult — call .confirm(code) to verify the OTP
 */
export async function sendPhoneOtp(
  phoneNumber: string
): Promise<ConfirmationResult> {
  // On React Native (non-web) Firebase does not require a RecaptchaVerifier.
  // Passing undefined is intentional and correct.
  return signInWithPhoneNumber(auth, phoneNumber);
}

/**
 * Verifies the OTP code that the user typed in.
 * @param confirmationResult  Returned from sendPhoneOtp()
 * @param code  6-digit code entered by the user
 * @returns Firebase UserCredential on success
 * @throws  FirebaseError with code "auth/invalid-verification-code" if wrong
 */
export async function verifyPhoneOtp(
  confirmationResult: ConfirmationResult,
  code: string
) {
  return confirmationResult.confirm(code);
}
