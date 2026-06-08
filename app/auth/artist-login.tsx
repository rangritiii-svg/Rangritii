import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ArtistLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserProfile, artists, language } = useApp();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP System States
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [smsVisible, setSmsVisible] = useState(false);
  const [timer, setTimer] = useState(0);
  const translateY = useRef(new Animated.Value(-150)).current;

  // Countdown timer effect
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);

    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setLoading(false);
      setOtpSent(true);
      setTimer(30);
      setOtp("");

      // Show SMS notification with animation
      setSmsVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7
      }).start();

      // Auto hide SMS after 8 seconds
      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true
        }).start(() => setSmsVisible(false));
      }, 8000);
    }, 1200);
  };

  const handleSmsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setOtp(generatedOtp);
    // Slide up SMS
    Animated.timing(translateY, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true
    }).start(() => setSmsVisible(false));
  };

  const handleVerify = async () => {
    if (otp.length < 4) {
      Alert.alert("Invalid OTP", "Please enter the 4-digit OTP.");
      return;
    }
    if (otp !== generatedOtp) {
      Alert.alert("Invalid OTP", "The OTP you entered is incorrect. Tap the notification banner to copy.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLoading(true);

    const cleanPhone = `+91 ${phone}`;
    const matchedArtist = artists.find((a) => a.phone === cleanPhone);

    if (matchedArtist) {
      // Login existing artist
      await setUserProfile({
        role: "artist",
        name: matchedArtist.name,
        phone: cleanPhone,
        city: matchedArtist.city,
        area: matchedArtist.area,
      });
      setTimeout(() => {
        setLoading(false);
        router.replace("/(tabs)");
      }, 600);
    } else {
      // Redirect to registration for new artists
      setTimeout(() => {
        setLoading(false);
        router.push({
          pathname: "/auth/artist-register",
          params: { phone },
        });
      }, 600);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Dynamic Simulated SMS Notification */}
      {smsVisible && (
        <Animated.View style={[styles.smsToastContainer, { transform: [{ translateY }], top: Math.max(insets.top + 10, 20) }]}>
          <TouchableOpacity style={[styles.smsToastContent, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSmsPress} activeOpacity={0.95}>
            <View style={styles.smsHeader}>
              <View style={[styles.smsIconBg, { backgroundColor: colors.gold }]}>
                <Ionicons name="chatbubble" size={12} color="#fff" />
              </View>
              <Text style={[styles.smsTitle, { color: colors.mutedForeground }]}>
                {language === "hi_IN" ? "संदेश • अभी" : "MESSAGES • now"}
              </Text>
            </View>
            <Text style={[styles.smsSender, { color: colors.text }]}>Rangritii Artist Secure Auth</Text>
            <Text style={[styles.smsText, { color: colors.text }]}>
              {language === "hi_IN"
                ? `रंगरीति आर्टिस्ट लॉगिन कोड: ${generatedOtp} है। ऑटो-फिल करने के लिए यहाँ दबाएं।`
                : `Your Rangritii artist verification code is ${generatedOtp}. Tap here to auto-fill.`}
            </Text>
            <View style={styles.smsTapHint}>
              <Text style={[styles.smsTapHintText, { color: colors.gold }]}>
                {language === "hi_IN" ? "⚡ ऑटो-फिल करने के लिए स्पर्श करें" : "⚡ Tap to auto-fill automatically"}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

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
          <Text style={styles.headerSubtitle}>Grow your business with Rangritii</Text>
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

        {/* Phone */}
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
            <TouchableOpacity onPress={() => setOtpSent(false)}>
              <Text style={[styles.changeLink, { color: colors.gold }]}>Change</Text>
            </TouchableOpacity>
          )}
        </View>

        {otpSent && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>Enter OTP</Text>
              {timer > 0 ? (
                <Text style={{ fontSize: 12, color: colors.gold, fontFamily: "Poppins_600SemiBold" }}>
                  {language === "hi_IN" ? `${timer}s में पुनः भेजें` : `Resend in ${timer}s`}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleSendOtp}>
                  <Text style={{ fontSize: 12, color: colors.gold, fontFamily: "Poppins_700Bold" }}>
                    {language === "hi_IN" ? "ओटीपी पुनः भेजें" : "Resend OTP"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.otpHint, { color: colors.mutedForeground, marginBottom: 6 }]}>
              {language === "hi_IN" ? `ओटीपी +91 ${phone} पर भेज दिया गया है` : `OTP has been sent to +91 ${phone}`}
            </Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="4-digit OTP"
                placeholderTextColor={colors.mutedForeground}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4, fontStyle: "italic" }}>
              {language === "hi_IN" 
                ? "💡 परीक्षण के लिए: स्क्रीन के शीर्ष पर आए संदेश अधिसूचना पर टैप करें।" 
                : "💡 For testing: Tap the SMS notification toast at the top of the screen to auto-fill."}
            </Text>
          </>
        )}

        {!otpSent ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
            onPress={handleSendOtp}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={[styles.primaryBtnText, { color: "#fff" }]}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
            onPress={handleVerify}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={[styles.primaryBtnText, { color: "#fff" }]}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </Text>
          </TouchableOpacity>
        )}

        {/* New Artist CTA */}
        <View style={[styles.newArtistBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.newArtistTitle, { color: colors.text }]}>New to Rangritii?</Text>
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
          <Text style={[styles.featureTitle, { color: colors.text }]}>Why join Rangritii?</Text>
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
  smsToastContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  smsToastContent: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  smsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  smsIconBg: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  smsTitle: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  smsSender: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    marginBottom: 2,
  },
  smsText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
    marginBottom: 6,
  },
  smsTapHint: {
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 6,
    marginTop: 2,
  },
  smsTapHintText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "right",
  },
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
  otpHint: { fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 6 },
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
