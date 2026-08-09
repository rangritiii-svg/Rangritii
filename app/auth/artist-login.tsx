import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useState, useEffect } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { updateArtist, getArtistByPhone } from "@/firebase/firestoreService";

/* RangRiti 2.0 design tokens — kept in sync with app/onboarding.tsx */
const MAROON = "#4A1020";
const DARK = "#1A0A0E";
const GOLD = "#C9932F";
const GOLD_DARK = "#A87525";
const BLUSH = "#FDEDF3";
const CREAM = "#FFF8F0";
const INK = "#2A1020";
const MUTED = "#8A6070";
const BORDER = "#F5D0DC";

export default function ArtistLoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { setUserProfile, artists, language } = useApp();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginOrRegister = async () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (showPasswordInput && !password.trim()) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);

    try {
      const cleanPhone = `+91 ${phone}`;

      // Step 1: Check the in-memory list (fast, works when Firestore has loaded)
      let matchedArtist = artists.find((a) => a.phone === cleanPhone);

      // Step 2: Fallback — if not found in memory (Firestore still loading or
      // fresh session), query Firestore directly so login always works reliably.
      if (!matchedArtist) {
        matchedArtist = await getArtistByPhone(cleanPhone);
      }

      if (matchedArtist) {
        if (!showPasswordInput) {
          setLoading(false);
          setShowPasswordInput(true);
          return;
        }

        // Verify password
        if (matchedArtist.password) {
          if (matchedArtist.password !== password.trim()) {
            Alert.alert("Incorrect Password", "The password you entered is incorrect. Please try again.");
            setLoading(false);
            return;
          }
        } else {
          // Old account: save password entered on first login
          matchedArtist.password = password.trim();
          updateArtist(matchedArtist.id, { password: password.trim() }).catch((e) => console.warn(e));
        }

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
      console.error("Artist login error:", err);
      Alert.alert(
        "Authentication Failed",
        err?.message || "Please check your connection and try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Head>
        <title>Mehndi Artist Login — RangRiti | Grow Your Mehndi Business</title>
        <meta
          name="description"
          content="Artist login for RangRiti — manage your mehndi portfolio, hourly rates, bookings and earnings. Receive booking requests from customers across Rajasthan."
        />
      </Head>
      {/* Header */}
      <LinearGradient
        colors={[DARK, MAROON, "#6E1830"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + 10, 40) }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons name="flower" size={28} color={GOLD} />
          </View>
          <Text style={styles.headerTitle}>Mehndi Artist Login</Text>
          <Text style={styles.headerSubtitle}>Grow your business with RangRiti</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.formInner, isWide && styles.formInnerWide]}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information-outline" size={20} color={GOLD_DARK} />
          <Text style={styles.infoText}>
            Existing artists: Enter your registered number to login. New artists: You'll be redirected to complete your registration.
          </Text>
        </View>

        {/* Phone Input */}
        <Text style={styles.label}>Registered Mobile Number *</Text>
        <View style={styles.inputRow}>
          <Text style={styles.countryCode}>🇮🇳 +91</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={MUTED}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!showPasswordInput}
          />
          {showPasswordInput && (
            <TouchableOpacity onPress={() => { setShowPasswordInput(false); setPassword(""); }}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Password Input */}
        {showPasswordInput && (
          <>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={MUTED} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={MUTED}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </>
        )}

        {/* OTP Input — shown after SMS is sent */}
        {/* Action Button */}
        <TouchableOpacity
          style={styles.primaryBtnShadow}
          onPress={handleLoginOrRegister}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Continue</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* New Artist CTA */}
        {!showPasswordInput && (
          <View style={styles.newArtistBox}>
            <Text style={styles.newArtistTitle}>New to RangRiti?</Text>
            <Text style={styles.newArtistDesc}>
              Create your artist profile and start getting bookings today. Registration takes only 5 minutes.
            </Text>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push("/auth/artist-register")}
            >
              <MaterialCommunityIcons name="flower" size={16} color={GOLD_DARK} />
              <Text style={styles.registerBtnText}>Register as Artist →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>Why join RangRiti?</Text>
          {[
            "Get discovered by thousands of customers",
            "Receive bookings 24/7 — even while you sleep",
            "Showcase your portfolio to attract clients",
            "Set your own rates & availability",
            "Build verified reviews and reputation",
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color={GOLD} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.switchRole} onPress={() => router.replace("/auth/customer-login")}>
          <Text style={styles.switchRoleText}>
            Looking to book a Mehndi artist?{" "}
            <Text style={{ color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }}>Customer Login →</Text>
          </Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingBottom: 28, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,248,240,0.12)", borderWidth: 1, borderColor: "rgba(255,248,240,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  headerContent: { alignItems: "center" },
  headerIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(201,147,47,0.15)", borderWidth: 1.5, borderColor: "rgba(201,147,47,0.45)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: CREAM, fontFamily: "Poppins_700Bold" },
  headerSubtitle: { fontSize: 13, color: "rgba(253,248,241,0.8)", fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 4 },
  formContainer: { padding: 20, paddingBottom: 60 },
  formInner: { width: "100%", gap: 4 },
  formInnerWide: { maxWidth: 520, alignSelf: "center", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 24, marginTop: 12 },
  infoBanner: { flexDirection: "row", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 14, marginBottom: 16, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", color: INK, lineHeight: 18 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: INK, marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 4 },
  countryCode: { fontSize: 14, fontFamily: "Poppins_500Medium", color: INK },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: INK },
  changeLink: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: GOLD_DARK },
  otpHint: { fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 6, marginTop: 4 },
  primaryBtnShadow: { borderRadius: 16, marginTop: 20, marginBottom: 8, shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16 },
  primaryBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
  newArtistBox: { borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff", padding: 16, marginTop: 12, gap: 8 },
  newArtistTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", color: INK },
  newArtistDesc: { fontSize: 12, fontFamily: "Poppins_400Regular", color: MUTED, lineHeight: 18 },
  registerBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: GOLD, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: "flex-start", marginTop: 4, backgroundColor: "rgba(201,147,47,0.08)" },
  registerBtnText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: GOLD_DARK },
  featureBox: { borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 16, marginTop: 16, gap: 8 },
  featureTitle: { fontSize: 11.5, fontFamily: "Poppins_700Bold", color: GOLD_DARK, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: INK },
  switchRole: { alignItems: "center", paddingVertical: 16 },
  switchRoleText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: MUTED, textAlign: "center" },
});
