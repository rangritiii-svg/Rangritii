/**
 * authService.ts
 * Firebase Phone Authentication helpers for RangRiti.
 *
 * Uses @react-native-firebase/auth (native SDK) which handles Android
 * app attestation (SafetyNet / Play Integrity) automatically — no
 * reCAPTCHA or ApplicationVerifier needed.
 */

import auth from "@react-native-firebase/auth";

export type NativeConfirmationResult = Awaited<
  ReturnType<typeof auth>["signInWithPhoneNumber"]
>;

/**
 * Sends a real OTP SMS to the given phone number via Firebase Phone Auth.
 * @param phoneNumber  Full E.164 number, e.g. "+919876543210"
 * @returns ConfirmationResult — call .confirm(code) to verify the OTP
 */
export async function sendPhoneOtp(
  phoneNumber: string
): Promise<NativeConfirmationResult> {
  return auth().signInWithPhoneNumber(phoneNumber);
}

/**
 * Verifies the OTP code that the user typed in.
 * @param confirmationResult  Returned from sendPhoneOtp()
 * @param code  6-digit code entered by the user
 * @returns Firebase UserCredential on success
 * @throws  FirebaseError with code "auth/invalid-verification-code" if wrong
 */
export async function verifyPhoneOtp(
  confirmationResult: NativeConfirmationResult,
  code: string
) {
  return confirmationResult.confirm(code);
}
