import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import app from "@/firebase/config";
import { sendPhoneOtp, verifyPhoneOtp } from "@/firebase/authService";
import type { ConfirmationResult } from "firebase/auth";

export default function ArtistLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserProfile, artists, language } = useApp();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // reCAPTCHA verifier ref — required by Firebase Phone Auth on React Native
  const recaptchaVerifier = useRef<any>(null);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      const result = await sendPhoneOtp(fullPhone, recaptchaVerifier.current);
      setConfirmationResult(result);
      setOtpSent(true);
      setTimer(30);
      setOtp("");
      setLoading(false);
      Alert.alert(
        "OTP Sent ✅",
        `A 6-digit verification code has been sent to +91 ${phone} via SMS.`
      );
    } catch (err: any) {
      setLoading(false);
      console.error("sendPhoneOtp error:", err);
      Alert.alert(
        "Failed to Send OTP",
        err?.message?.includes("auth/invalid-phone-number")
          ? "The phone number you entered is invalid. Please check and try again."
          : err?.message?.includes("auth/too-many-requests")
          ? "Too many attempts. Please wait a few minutes before trying again."
          : "Could not send OTP. Please check your internet connection and try again."
      );
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      Alert.alert("Invalid OTP", "Please enter the complete 6-digit OTP.");
      return;
    }
    if (!confirmationResult) {
      Alert.alert("Error", "Please request an OTP first.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLoading(true);
    try {
      await verifyPhoneOtp(confirmationResult, otp);

      const cleanPhone = `+91 ${phone}`;
      const matchedArtist = artists.find((a) => a.phone === cleanPhone);

      if (matchedArtist) {
        await setUserProfile({
          role: "artist",
          name: matchedArtist.name,
          phone: cleanPhone,
          city: matchedArtist.city,
          area: matchedArtist.area,
        });
        setLoading(false);
        router.replace("/(tabs)");
      } else {
        setLoading(false);
        router.push({
          pathname: "/auth/artist-register",
          params: { phone },
        });
      }
    } catch (err: any) {
      setLoading(false);
      console.error("verifyPhoneOtp error:", err);
      Alert.alert(
        "Verification Failed",
        err?.message?.includes("auth/invalid-verification-code")
          ? "The OTP you entered is incorrect. Please check the SMS and try again."
          : err?.message?.includes("auth/code-expired")
          ? "This OTP has expired. Please tap 'Resend OTP' to get a new one."
          : "Verification failed. Please try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Firebase reCAPTCHA — invisible, required for Phone Auth on React Native */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
      />

      {/* Header */}
      <LinearGradient colors={["#C9932F", "#A87525"]} style={[styles.header, { paddingTop: Math.max(insets.top + 10, 40) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons name="flower" size={28} color="#C9932F" />
          </View>
          <Text style={styles.headerTitle}>Mehndi Artist Login</Text>
          <Text style={styles.headerSubtitle}>Grow your business with RangRiti</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.gold} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Existing artists: Enter your registered number to login. New artists: You'll be redirected to complete your registration.
          </Text>
        </View>

        {/* Phone Input */}
        <Text style={[styles.label, { color: colors.text }]}>Registered Mobile Number *</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.countryCode, { color: colors.text }]}>🇮🇳 +91</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!otpSent}
          />
          {otpSent && (
            <TouchableOpacity onPress={() => { setOtpSent(false); setConfirmationResult(null); }}>
              <Text style={[styles.changeLink, { color: colors.gold }]}>Change</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* OTP Input — shown after SMS is sent */}
        {otpSent && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>
                {language === "hi_IN" ? "OTP दर्ज करें" : "Enter OTP"}
              </Text>
              {timer > 0 ? (
                <Text style={{ fontSize: 12, color: colors.gold, fontFamily: "Poppins_600SemiBold" }}>
                  {language === "hi_IN" ? `${timer}s में पुनः भेजें` : `Resend in ${timer}s`}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                  <Text style={{ fontSize: 12, color: colors.gold, fontFamily: "Poppins_700Bold" }}>
                    {language === "hi_IN" ? "OTP पुनः भेजें" : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.otpHint, { color: colors.mutedForeground }]}>
              {language === "hi_IN"
                ? `6-अंकीय OTP +91 ${phone} पर भेज दिया गया है`
                : `A 6-digit OTP has been sent to +91 ${phone}`}
            </Text>

            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text, letterSpacing: 6, fontSize: 20 }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.mutedForeground}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
          </>
        )}

        {/* Action Button */}
        {!otpSent ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
            onPress={handleSendOtp}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.primaryBtnText, { color: "#fff" }]}>Send OTP via SMS</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
            onPress={handleVerify}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={[styles.primaryBtnText, { color: "#fff" }]}>Verify & Continue</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* New Artist CTA */}
        <View style={[styles.newArtistBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.newArtistTitle, { color: colors.text }]}>New to RangRiti?</Text>
          <Text style={[styles.newArtistDesc, { color: colors.mutedForeground }]}>
            Create your artist profile and start getting bookings today. Registration takes only 5 minutes.
          </Text>
          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: colors.gold }]}
            onPress={() => router.push("/auth/artist-register")}
          >
            <MaterialCommunityIcons name="flower" size={16} color={colors.gold} />
            <Text style={[styles.registerBtnText, { color: colors.gold }]}>Register as Artist →</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <View style={[styles.featureBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>Why join RangRiti?</Text>
          {[
            "Get discovered by thousands of customers",
            "Receive bookings 24/7 — even while you sleep",
            "Showcase your portfolio to attract clients",
            "Set your own rates & availability",
            "Build verified reviews and reputation",
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color={colors.gold} />
              <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.switchRole} onPress={() => router.replace("/auth/customer-login")}>
          <Text style={[styles.switchRoleText, { color: colors.mutedForeground }]}>
            Looking to book a Mehndi artist?{" "}
            <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>Customer Login →</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 28, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  headerContent: { alignItems: "center" },
  headerIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#fff", fontFamily: "Poppins_700Bold" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 4 },
  formContainer: { padding: 20, gap: 4, paddingBottom: 60 },
  infoBanner: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 4 },
  countryCode: { fontSize: 14, fontFamily: "Poppins_500Medium" },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular" },
  changeLink: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  otpHint: { fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 6, marginTop: 4 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 20, marginBottom: 8 },
  primaryBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  newArtistBox: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12, gap: 8 },
  newArtistTitle: { fontSize: 15, fontFamily: "Poppins_700Bold" },
  newArtistDesc: { fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },
  registerBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: "flex-start", marginTop: 4 },
  registerBtnText: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  featureBox: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16, gap: 8 },
  featureTitle: { fontSize: 14, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  switchRole: { alignItems: "center", paddingVertical: 16 },
  switchRoleText: { fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center" },
});
