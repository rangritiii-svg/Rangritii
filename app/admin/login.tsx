import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { adminLoginWithGoogle, adminLoginWithPassword } from "@/utils/adminAuth";
import { signInWithGoogle } from "@/utils/googleAuth";

/**
 * Administrator login.
 *
 * Access is verified SERVER-SIDE: credentials are checked against environment
 * variables on the backend (never stored in the app or Firestore), and the
 * dashboard only opens with a valid signed session token. Regular customers
 * and artists cannot reach the dashboard without these owner-only credentials.
 */
export default function AdminLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserProfile } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finishLogin = async (adminEmail: string) => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
    await setUserProfile({ role: "admin", email: adminEmail });
    router.replace("/admin");
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter both the admin email and password.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);
    try {
      const adminEmail = await adminLoginWithPassword(email.trim(), password);
      setLoading(false);
      await finishLogin(adminEmail);
    } catch (err: any) {
      setLoading(false);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); } catch (_e) {}
      Alert.alert("Access Denied", err?.message || "Admin login failed.");
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setGoogleLoading(true);
    try {
      const gUser = await signInWithGoogle();
      if (!gUser.idToken) {
        throw new Error("Could not obtain a Google ID token. Please use email & password instead.");
      }
      const adminEmail = await adminLoginWithGoogle(gUser.idToken);
      setGoogleLoading(false);
      await finishLogin(adminEmail);
    } catch (err: any) {
      setGoogleLoading(false);
      if (!/cancelled/i.test(err?.message || "")) {
        Alert.alert("Access Denied", err?.message || "This Google account is not authorized for admin access.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Head>
        <title>Admin Login — RangRiti</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Header */}
      <LinearGradient colors={["#1A0A0E", "#4A1020"]} style={[styles.header, { paddingTop: Math.max(insets.top + 10, 40) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/onboarding"))}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconCircle}>
            <MaterialCommunityIcons name="shield-crown" size={30} color="#C9932F" />
          </View>
          <Text style={styles.headerTitle}>Administrator Login</Text>
          <Text style={styles.headerSubtitle}>Restricted area — authorized platform owner only</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: colors.text }]}>Admin Email *</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="admin@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Admin Password *</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter admin password"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: "#4A1020" }]}
          onPress={handlePasswordLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="shield-lock" size={20} color="#C9932F" />
              <Text style={styles.primaryBtnText}>Unlock Admin Dashboard</Text>
            </>
          )}
        </TouchableOpacity>

        {/* OR divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Google sign-in for allow-listed admin accounts */}
        <TouchableOpacity
          style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
          activeOpacity={0.85}
        >
          {googleLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={[styles.googleBtnText, { color: colors.text }]}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.noteBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Admin credentials are configured privately by the platform owner on the server.
            Only the owner's registered Google account or email/password combination can open this dashboard.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 28, paddingHorizontal: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  headerContent: { alignItems: "center" },
  headerIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(201,147,47,0.15)", borderWidth: 1.5, borderColor: "rgba(201,147,47,0.5)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff", fontFamily: "Poppins_700Bold" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 4 },
  formContainer: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 20, marginBottom: 8 },
  primaryBtnText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", letterSpacing: 1 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, borderWidth: 1.5, paddingVertical: 14 },
  googleBtnText: { fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  noteBox: { flexDirection: "row", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 24, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },
});
