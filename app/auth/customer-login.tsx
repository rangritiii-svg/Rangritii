import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Linking
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { sendEmailVerification } from "@/utils/verificationService";

export default function CustomerLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserProfile, addCustomer, language } = useApp();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email verification states
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState("");
  const [emailPreviewUrl, setEmailPreviewUrl] = useState("");

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
    if (!isLogin && !name.trim()) { Alert.alert("Required", "Please enter your full name."); return; }
    if (phone.length !== 10) { Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number."); return; }
    if (!isLogin && !email.trim()) { Alert.alert("Required", "Please enter your email address."); return; }
    if (!isLogin && !city.trim()) { Alert.alert("Required", "Please enter your city."); return; }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);

    setTimeout(async () => {
      // 1. Generate SMS Code
      const smsCode = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(smsCode);

      // 2. Generate Email Code (if in Sign Up mode)
      let emailCode = "";
      if (!isLogin) {
        emailCode = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedEmailOtp(emailCode);
        
        const res = await sendEmailVerification(email.trim(), emailCode, language);
        if (!res.success) {
          setLoading(false);
          Alert.alert("Verification Email Failed", res.error);
          return;
        }
        if (res.previewUrl) {
          setEmailPreviewUrl(res.previewUrl);
        } else {
          setEmailPreviewUrl("");
        }
      }

      setLoading(false);
      setOtpSent(true);
      setTimer(30);
      setOtp("");
      setEmailOtp("");

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
    if (otp.length < 4) { Alert.alert("Invalid OTP", "Enter the 4-digit SMS OTP."); return; }
    if (otp !== generatedOtp) { Alert.alert("Invalid OTP", "The SMS OTP you entered is incorrect. Tap the notification banner to copy."); return; }
    
    // Check email OTP if registering
    if (!isLogin) {
      if (emailOtp.length < 4) { Alert.alert("Invalid Code", "Enter the 4-digit Email verification code."); return; }
      if (emailOtp !== generatedEmailOtp) { Alert.alert("Invalid Code", "The Email verification code you entered is incorrect. Please check your inbox."); return; }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLoading(true);

    const userPhone = `+91 ${phone}`;
    const userCity = city.trim() || "India";
    const userArea = area.trim();
    const userName = isLogin ? "Customer" : name.trim();

    if (!isLogin) {
      addCustomer({
        name: userName,
        phone: userPhone,
        city: userCity,
        area: userArea
      });
    }

    await setUserProfile({
      role: "customer",
      name: userName,
      phone: userPhone,
      city: userCity,
      area: userArea,
    });
    setTimeout(() => { setLoading(false); router.replace("/(tabs)"); }, 600);
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Dynamic Simulated SMS Notification */}
      {smsVisible && (
        <Animated.View style={[styles.smsToastContainer, { transform: [{ translateY }], top: Math.max(insets.top + 10, 20) }]}>
          <TouchableOpacity style={[styles.smsToastContent, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSmsPress} activeOpacity={0.95}>
            <View style={styles.smsHeader}>
              <View style={[styles.smsIconBg, { backgroundColor: colors.primary }]}>
                <Ionicons name="chatbubble" size={12} color="#fff" />
              </View>
              <Text style={[styles.smsTitle, { color: colors.mutedForeground }]}>
                {language === "hi_IN" ? "संदेश • अभी" : "MESSAGES • now"}
              </Text>
            </View>
            <Text style={[styles.smsSender, { color: colors.text }]}>Rangritii Security</Text>
            <Text style={[styles.smsText, { color: colors.text }]}>
              {language === "hi_IN"
                ? `रंगरीति के लिए आपका ओटीपी कोड ${generatedOtp} है। ऑटो-फिल करने के लिए यहाँ दबाएं।`
                : `Your Rangritii verification code is ${generatedOtp}. Tap here to auto-fill.`}
            </Text>
            <View style={styles.smsTapHint}>
              <Text style={[styles.smsTapHintText, { color: colors.primary }]}>
                {language === "hi_IN" ? "⚡ ऑटो-फिल करने के लिए स्पर्श करें" : "⚡ Tap to auto-fill automatically"}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Header */}
      <LinearGradient colors={["#F9AABF", "#E8849E"]} style={[styles.header, { paddingTop: Math.max(insets.top + 10, 40) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="person" size={28} color="#F9AABF" />
          </View>
          <Text style={styles.headerTitle}>Customer {isLogin ? "Login" : "Sign Up"}</Text>
          <Text style={styles.headerSubtitle}>Find & book the best Mehndi artists near you</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        {/* Toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.toggleBtn, isLogin && { backgroundColor: colors.primary }]} onPress={() => { setIsLogin(true); setOtpSent(false); }}>
            <Text style={[styles.toggleText, { color: isLogin ? colors.primaryForeground : colors.mutedForeground }]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, !isLogin && { backgroundColor: colors.primary }]} onPress={() => { setIsLogin(false); setOtpSent(false); }}>
            <Text style={[styles.toggleText, { color: !isLogin ? colors.primaryForeground : colors.mutedForeground }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Fields */}
        {!isLogin && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={18} color={colors.mutedForeground} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Your full name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} autoCapitalize="words" />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Email Address *</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="yourname@domain.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>City *</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={18} color={colors.mutedForeground} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. Mumbai, Delhi, Jaipur" placeholderTextColor={colors.mutedForeground} value={city} onChangeText={setCity} autoCapitalize="words" />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Area / Locality</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. Andheri West, Bandra" placeholderTextColor={colors.mutedForeground} value={area} onChangeText={setArea} autoCapitalize="words" />
            </View>
          </>
        )}

        {/* Mobile */}
        <Text style={[styles.label, { color: colors.text }]}>Mobile Number *</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.countryCode, { color: colors.text }]}>🇮🇳 +91</Text>
          <TextInput style={[styles.input, { color: colors.text }]} placeholder="10-digit mobile number" placeholderTextColor={colors.mutedForeground} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} editable={!otpSent} />
          {otpSent && <TouchableOpacity onPress={() => setOtpSent(false)}><Text style={[styles.changeLink, { color: colors.primary }]}>Change</Text></TouchableOpacity>}
        </View>

        {/* OTP */}
        {otpSent && (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>SMS OTP Verification</Text>
              {timer > 0 ? (
                <Text style={{ fontSize: 12, color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>
                  {language === "hi_IN" ? `${timer}s में पुनः भेजें` : `Resend in ${timer}s`}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleSendOtp}>
                  <Text style={{ fontSize: 12, color: colors.primary, fontFamily: "Poppins_700Bold" }}>
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
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Enter 4-digit SMS OTP" placeholderTextColor={colors.mutedForeground} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={4} />
            </View>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4, fontStyle: "italic" }}>
              {language === "hi_IN" 
                ? "💡 परीक्षण के लिए: स्क्रीन के शीर्ष पर आए संदेश अधिसूचना पर टैप करें।" 
                : "💡 For testing: Tap the SMS notification toast at the top of the screen to auto-fill."}
            </Text>

            {/* Email OTP Field (Sign Up Only) */}
            {!isLogin && (
              <>
                <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  {language === "hi_IN" ? "ईमेल सत्यापन कोड" : "Email Verification Code"}
                </Text>
                <Text style={[styles.otpHint, { color: colors.mutedForeground, marginBottom: 6 }]}>
                  {language === "hi_IN" ? `सत्यापन कोड ${email} पर भेजा गया है` : `Verification code has been sent to ${email}`}
                </Text>
                <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
                  <TextInput style={[styles.input, { color: colors.text }]} placeholder="Enter 4-digit Email code" placeholderTextColor={colors.mutedForeground} value={emailOtp} onChangeText={setEmailOtp} keyboardType="number-pad" maxLength={4} />
                </View>

                {/* Ethereal Inbox Preview Helper (Real-time Developer Assistant) */}
                {emailPreviewUrl ? (
                  <TouchableOpacity 
                    style={{ 
                      marginTop: 10, 
                      padding: 12, 
                      backgroundColor: "#FFF8F0", 
                      borderWidth: 1.5, 
                      borderColor: colors.primary, 
                      borderRadius: 10,
                      alignItems: "center" 
                    }} 
                    onPress={() => Linking.openURL(emailPreviewUrl)}
                  >
                    <Text style={{ fontSize: 12, color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>
                      {language === "hi_IN" ? "✉️ परीक्षण ईमेल देखने के लिए यहाँ टैप करें" : "✉️ Tap to Open Test Email Inbox"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4, fontStyle: "italic" }}>
                    {language === "hi_IN" ? "💡 वास्तविक ईमेल डिलीवरी सक्षम करने के लिए constants/verificationConfig.ts में क्रेडेंशियल्स दर्ज करें।" : "💡 To receive email directly, configure SMTP details in constants/verificationConfig.ts"}
                  </Text>
                )}
              </>
            )}
          </>
        )}

        {/* Button */}
        {!otpSent ? (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>{loading ? "Sending Code..." : "Send Verification Code"}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primaryForeground} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>{loading ? "Verifying..." : "Verify & Complete Signup"}</Text>
          </TouchableOpacity>
        )}

        {/* What you'll see */}
        <View style={[styles.featureBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>🗺️ After Login You Can:</Text>
          {[
            "See all registered Mehndi artists on a map",
            "Search artists by service type (Bridal, Arabic etc.)",
            "View artist portfolio, ratings & hourly rates",
            "Send booking requests with your preferred time slot",
            "Pay online via UPI or choose Cash payment",
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.switchRole} onPress={() => router.replace("/auth/artist-login")}>
          <Text style={[styles.switchRoleText, { color: colors.mutedForeground }]}>
            Are you a Mehndi Artist? <Text style={{ color: colors.gold, fontFamily: "Poppins_600SemiBold" }}>Artist Login →</Text>
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
  toggleRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  toggleText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  countryCode: { fontSize: 14, fontFamily: "Poppins_500Medium" },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular" },
  changeLink: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  otpHint: { fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 6 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 20, marginBottom: 8 },
  primaryBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  featureBox: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 24, gap: 8 },
  featureTitle: { fontSize: 14, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  switchRole: { alignItems: "center", paddingVertical: 16 },
  switchRoleText: { fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center" },
});
