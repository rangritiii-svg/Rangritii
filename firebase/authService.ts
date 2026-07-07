/**
 * authService.ts
 * Firebase Phone Authentication helpers for RangRiti.
 *
 * Uses the Firebase JS SDK v9+ modular API with expo-firebase-recaptcha
 * for the reCAPTCHA verifier required on React Native / Expo.
 */

import { signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { auth } from "./config";

/**
 * Sends a real OTP SMS to the given phone number via Firebase Phone Auth.
 * @param phoneNumber  Full E.164 number, e.g. "+919876543210"
 * @param recaptchaVerifier  ApplicationVerifier from expo-firebase-recaptcha
 * @returns ConfirmationResult — call .confirm(code) to verify the OTP
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  recaptchaVerifier: any
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
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
