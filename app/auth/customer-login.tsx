import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useState, useEffect } from "react";
import {
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, FlatList,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { INDIAN_STATES_CITIES } from "@/constants/locations";
import { getCurrentCoordinates } from "@/utils/permissions";
import { updateCustomer } from "@/firebase/firestoreService";
import { signInWithGoogle } from "@/utils/googleAuth";

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

export default function CustomerLoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { setUserProfile, addCustomer, language, customers } = useApp();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Dropdown Modal states
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Geo-tagged location (optional, captured from device GPS during sign up)
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  const handleCaptureLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLocating(true);
    // Asks for Location permission first, then reads GPS coordinates
    const coords = await getCurrentCoordinates(language === "hi_IN");
    setLocating(false);
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const handleLoginOrSignup = async () => {
    if (!isLogin && !name.trim()) { Alert.alert("Required", "Please enter your full name."); return; }
    if (phone.length !== 10) { Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number."); return; }
    if (!isLogin && !state) { Alert.alert("Required", "Please select your state."); return; }
    if (!isLogin && !city) { Alert.alert("Required", "Please select your city."); return; }
    if (!password.trim()) { Alert.alert("Required", "Please enter your password."); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);

    const userPhone = `+91 ${phone}`;

    try {
      if (isLogin) {
        // Find existing customer
        const existingCustomer = customers.find(c => c.phone === userPhone);
        if (!existingCustomer) {
          Alert.alert(
            "Not Registered",
            "This mobile number is not registered. Please switch to 'Sign Up' to create an account."
          );
          setLoading(false);
          return;
        }

        // Verify password
        if (existingCustomer.password) {
          if (existingCustomer.password !== password.trim()) {
            Alert.alert("Incorrect Password", "The password you entered is incorrect. Please try again.");
            setLoading(false);
            return;
          }
        } else {
          // Old account: save password entered on first login
          existingCustomer.password = password.trim();
          updateCustomer(existingCustomer.id, { password: password.trim() }).catch((e: any) => console.warn(e));
        }

        await setUserProfile({
          role: "customer",
          name: existingCustomer.name,
          phone: userPhone,
          state: existingCustomer.state,
          city: existingCustomer.city,
          area: existingCustomer.area,
          ...(existingCustomer.latitude != null && existingCustomer.longitude != null
            ? { latitude: existingCustomer.latitude, longitude: existingCustomer.longitude }
            : {}),
        });
      } else {
        // Sign Up Mode: check duplicates
        const registered = customers.some(c => c.phone === userPhone);
        if (registered) {
          Alert.alert(
            "Already Registered",
            "This mobile number is already registered. Please switch to 'Login' to sign in."
          );
          setLoading(false);
          return;
        }

        const userName = name.trim();
        const userCity = city.trim();
        const userState = state.trim();
        const userArea = area.trim();

        addCustomer({
          name: userName,
          phone: userPhone,
          state: userState,
          city: userCity,
          area: userArea,
          password: password.trim(),
          ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
        });

        await setUserProfile({
          role: "customer",
          name: userName,
          phone: userPhone,
          state: userState,
          city: userCity,
          area: userArea,
          ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
        });
      }

      setLoading(false);
      router.replace("/(tabs)");
    } catch (err: any) {
      setLoading(false);
      console.error("Login/Signup error:", err);
      Alert.alert(
        "Authentication Failed",
        err?.message || "Please check your connection and try again."
      );
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setGoogleLoading(true);
    try {
      const gUser = await signInWithGoogle();

      // Returning Google user → log straight in with their saved details
      const existing = customers.find(
        (c) => c.email && c.email.toLowerCase() === gUser.email
      );

      let needsProfileCompletion = false;

      if (existing) {
        await setUserProfile({
          role: "customer",
          name: existing.name,
          phone: existing.phone,
          state: existing.state,
          city: existing.city,
          area: existing.area,
          email: gUser.email,
          ...(gUser.photoUrl ? { photoUrl: gUser.photoUrl } : {}),
          ...(existing.latitude != null && existing.longitude != null
            ? { latitude: existing.latitude, longitude: existing.longitude }
            : {}),
        });
        if (!existing.city || !existing.state) {
          needsProfileCompletion = true;
        }
      } else {
        // First Google sign-in → create the customer account record with basic details
        addCustomer({
          name: gUser.name,
          phone: "",
          state: state.trim(),
          city: city.trim(),
          area: area.trim(),
          email: gUser.email,
          ...(gUser.photoUrl ? { photoUrl: gUser.photoUrl } : {}),
          ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
        });

        await setUserProfile({
          role: "customer",
          name: gUser.name,
          phone: "",
          state: state.trim(),
          city: city.trim(),
          area: area.trim(),
          email: gUser.email,
          ...(gUser.photoUrl ? { photoUrl: gUser.photoUrl } : {}),
          ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
        });
        needsProfileCompletion = true;
      }

      setGoogleLoading(false);
      if (needsProfileCompletion) {
        router.replace("/auth/complete-profile");
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setGoogleLoading(false);
      // Don't show an error alert when the user simply closed the popup
      if (!/cancelled/i.test(err?.message || "")) {
        Alert.alert("Google Sign-In", err?.message || "Google sign-in failed. Please try again.");
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Head>
        <title>Customer Login & Sign Up — RangRiti | Book Mehndi Artists Online</title>
        <meta
          name="description"
          content="Login or create your free RangRiti customer account — with your mobile number or Google account — to browse verified mehndi artists near you in Rajasthan and book online."
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
            <Ionicons name="person" size={28} color={GOLD} />
          </View>
          <Text style={styles.headerTitle}>Customer {isLogin ? "Login" : "Sign Up"}</Text>
          <Text style={styles.headerSubtitle}>Find & book the best Mehndi artists near you</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.formInner, isWide && styles.formInnerWide]}>
        {/* Login / Sign Up toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]} onPress={() => { setIsLogin(true); }}>
            <Text style={[styles.toggleText, { color: isLogin ? "#fff" : MUTED }]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]} onPress={() => { setIsLogin(false); }}>
            <Text style={[styles.toggleText, { color: !isLogin ? "#fff" : MUTED }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up extra fields */}
        {!isLogin && (
          <>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={MUTED} />
              <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor={MUTED} value={name} onChangeText={setName} autoCapitalize="words" />
            </View>

            <Text style={styles.label}>State *</Text>
            <TouchableOpacity style={styles.inputRow} onPress={() => setStateModalVisible(true)}>
              <Ionicons name="map-outline" size={18} color={MUTED} />
              <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: state ? INK : MUTED }}>{state || "Select State"}</Text>
              <Ionicons name="chevron-down" size={18} color={MUTED} />
            </TouchableOpacity>

            <Text style={styles.label}>City *</Text>
            <TouchableOpacity style={[styles.inputRow, { opacity: state ? 1 : 0.6 }]} onPress={() => { if (!state) { Alert.alert("Select State First", "Please select a state to view cities."); return; } setCityModalVisible(true); }}>
              <Ionicons name="business-outline" size={18} color={MUTED} />
              <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: city ? INK : MUTED }}>{city || "Select City"}</Text>
              <Ionicons name="chevron-down" size={18} color={MUTED} />
            </TouchableOpacity>

            <Text style={styles.label}>Area / Locality</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={18} color={MUTED} />
              <TextInput style={styles.input} placeholder="e.g. Andheri West, Bandra" placeholderTextColor={MUTED} value={area} onChangeText={setArea} autoCapitalize="words" />
            </View>

            {/* Optional geo-tag — helps show artists near the customer */}
            <Text style={styles.label}>📍 Geo-tag Your Location (Optional)</Text>
            <TouchableOpacity
              style={[
                styles.geoBtn,
                {
                  backgroundColor: latitude != null ? "rgba(16,185,129,0.1)" : "#fff",
                  borderColor: latitude != null ? "#10B981" : BORDER,
                },
              ]}
              onPress={handleCaptureLocation}
              disabled={locating}
              activeOpacity={0.85}
            >
              {locating ? (
                <>
                  <ActivityIndicator size="small" color={GOLD} />
                  <Text style={[styles.geoBtnText, { color: INK }]}>Getting your location…</Text>
                </>
              ) : latitude != null && longitude != null ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.geoBtnText, { color: "#10B981" }]}>Location Tagged ✓</Text>
                    <Text style={styles.geoCoords}>
                      {latitude.toFixed(5)}, {longitude.toFixed(5)} · Tap to update
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="location" size={20} color={GOLD} />
                  <Text style={[styles.geoBtnText, { color: INK }]}>Capture Current Location (GPS)</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Mobile Number */}
        <Text style={styles.label}>Mobile Number *</Text>
        <View style={styles.inputRow}>
          <Text style={styles.countryCode}>🇮🇳 +91</Text>
          <TextInput style={styles.input} placeholder="10-digit mobile number" placeholderTextColor={MUTED} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
        </View>

        {/* Password */}
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

        {/* Action Button */}
        <TouchableOpacity style={styles.primaryBtnShadow} onPress={handleLoginOrSignup} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>
                  {isLogin ? "Login" : "Complete Signup"}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue with Google */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
          activeOpacity={0.85}
        >
          {googleLoading ? (
            <ActivityIndicator color={INK} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Benefits */}
        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>🗺️ After Login You Can:</Text>
          {[
            "See all registered Mehndi artists on a map",
            "Search artists by service type (Bridal, Arabic etc.)",
            "View artist portfolio, ratings & hourly rates",
            "Send booking requests with your preferred time slot",
            "Pay online via UPI or choose Cash payment",
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color={GOLD} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.switchRole} onPress={() => router.replace("/auth/artist-login")}>
          <Text style={styles.switchRoleText}>
            Are you a Mehndi Artist?{" "}
            <Text style={{ color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }}>Artist Login →</Text>
          </Text>
        </TouchableOpacity>
        </View>
      </ScrollView>

      {/* State Selector Modal */}
      <Modal visible={stateModalVisible} animationType="slide" transparent={true} onRequestClose={() => setStateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)}><Ionicons name="close" size={24} color={INK} /></TouchableOpacity>
            </View>
            <FlatList
              data={Object.keys(INDIAN_STATES_CITIES)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setState(item); setCity(""); setStateModalVisible(false); }}>
                  <Text style={[styles.modalItemText, state === item && { color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }]}>{item}</Text>
                  {state === item && <Ionicons name="checkmark" size={18} color={GOLD_DARK} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* City Selector Modal */}
      <Modal visible={cityModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCityModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}><Ionicons name="close" size={24} color={INK} /></TouchableOpacity>
            </View>
            <FlatList
              data={state ? INDIAN_STATES_CITIES[state] : []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => { setCity(item); setCityModalVisible(false); }}>
                  <Text style={[styles.modalItemText, city === item && { color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }]}>{item}</Text>
                  {city === item && <Ionicons name="checkmark" size={18} color={GOLD_DARK} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  toggleRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  toggleBtnActive: { backgroundColor: GOLD, shadowColor: GOLD, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  toggleText: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: INK, marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  countryCode: { fontSize: 14, fontFamily: "Poppins_500Medium", color: INK },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: INK },
  changeLink: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  otpHint: { fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 6, marginTop: 4 },
  geoBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14 },
  geoBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  geoCoords: { fontSize: 11, fontFamily: "Poppins_400Regular", color: MUTED, marginTop: 2 },
  primaryBtnShadow: { borderRadius: 16, marginTop: 20, marginBottom: 8, shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16 },
  primaryBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: MUTED, letterSpacing: 1 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER, backgroundColor: "#fff", paddingVertical: 14 },
  googleBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: INK },
  featureBox: { borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 16, marginTop: 24, gap: 8 },
  featureTitle: { fontSize: 11.5, fontFamily: "Poppins_700Bold", color: GOLD_DARK, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: INK },
  switchRole: { alignItems: "center", paddingVertical: 16 },
  switchRoleText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: MUTED, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(26,10,14,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: "65%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: INK },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  modalItemText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: INK },
});
