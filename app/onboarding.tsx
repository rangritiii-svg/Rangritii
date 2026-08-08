import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useRef, useState } from "react";
import { Alert, Animated, Dimensions, Image, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getTranslation } from "@/constants/locale";

const { height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setUserProfile, language, setLanguage } = useApp();

  const [showLanguageSelect, setShowLanguageSelect] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCustomer = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch (_e) {}
    router.push("/auth/customer-login");
  };

  const handleArtist = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch (_e) {}
    router.push("/auth/artist-login");
  };

  // Removed admin login from onboarding

  const t = (key: any) => getTranslation(language, key);
  const webTop = Platform.OS === "web" ? 67 : insets.top;

  if (showLanguageSelect) {
    return (
      <LinearGradient colors={["#FFF8F0", "#FDEDF3", "#F9AABF"]} style={styles.langContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.langContent}>
          <MaterialCommunityIcons name="flower" size={72} color="#7C3F00" style={{ alignSelf: "center", marginBottom: 24 }} />
          <Text style={styles.langTitle}>Select Language</Text>
          <Text style={styles.langSubtitle}>भाषा चुनें</Text>
          
          <TouchableOpacity 
            style={[styles.langBtn, { backgroundColor: "#7C3F00" }]} 
            onPress={async () => {
              await setLanguage("en_IN");
              setShowLanguageSelect(false);
            }}
          >
            <Text style={styles.langBtnText}>English</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.langBtn, { backgroundColor: "#C85C00", marginTop: 16 }]} 
            onPress={async () => {
              await setLanguage("hi_IN");
              setShowLanguageSelect(false);
            }}
          >
            <Text style={styles.langBtnText}>हिंदी</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#E8849E", "#F9AABF", "#C9932F"]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Head>
        <title>RangRiti — Book Verified Mehndi Artists in Rajasthan | रंगरीति</title>
        <meta
          name="description"
          content="Welcome to RangRiti — connect with talented, verified mehndi artists for weddings, festivals and special occasions across Rajasthan. Login as a customer or artist to get started."
        />
      </Head>
      <View style={[styles.overlay, { paddingTop: webTop + 20 }]}>
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="flower" size={42} color="#C9932F" />
          </View>
          <Text style={styles.appName}>RangRiti</Text>
          <Text style={styles.tagline}>{t("app_tagline")}</Text>
          <View style={styles.imageContainer}>
            <Image source={require("@/assets/images/hero_banner.png")} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient colors={["transparent", "rgba(74,10,30,0.9)"]} style={StyleSheet.absoluteFill} />
          </View>
          <Text style={styles.subtitle}>Connect with talented Mehndi artists for weddings, festivals & special occasions</Text>
        </Animated.View>

        <Animated.View style={[styles.bottomSection, { opacity: fadeAnim, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}>
          <Text style={styles.chooseLabel}>{language === "en_IN" ? "I am a..." : "मैं हूँ..."}</Text>

          <TouchableOpacity style={styles.roleButton} onPress={handleCustomer} activeOpacity={0.85}>
            <LinearGradient colors={["#C9932F", "#A87525"]} style={styles.roleGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.roleIconCircle}>
                <Ionicons name="person" size={22} color="#C9932F" />
              </View>
              <View style={styles.roleTextGroup}>
                <Text style={styles.roleTitle}>{t("customer_login_title")}</Text>
                <Text style={styles.roleDesc}>{t("role_customer")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.roleButton, styles.artistButton]} onPress={handleArtist} activeOpacity={0.85}>
            <View style={styles.roleGradientAlt}>
              <View style={styles.roleIconCircleAlt}>
                <MaterialCommunityIcons name="flower" size={22} color="#FDF8F1" />
              </View>
              <View style={styles.roleTextGroup}>
                <Text style={[styles.roleTitle, { color: "#FDF8F1" }]}>{t("artist_login_title")}</Text>
                <Text style={[styles.roleDesc, { color: "rgba(253,248,241,0.7)" }]}>{t("role_artist")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(253,248,241,0.5)" />
            </View>
          </TouchableOpacity>

          <Text style={styles.termsText}>By continuing, you agree to our Terms of Service & Privacy Policy</Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1 },
  heroSection: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  logoContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(201,147,47,0.15)", borderWidth: 1.5, borderColor: "rgba(201,147,47,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  appName: { fontSize: 38, fontWeight: "700", color: "#FDF8F1", letterSpacing: 2, marginBottom: 6, fontFamily: "Poppins_700Bold" },
  tagline: { fontSize: 13, color: "rgba(253,248,241,0.7)", marginBottom: 24, letterSpacing: 1, fontFamily: "Poppins_400Regular" },
  imageContainer: { width: "100%", height: height * 0.3, borderRadius: 24, overflow: "hidden", marginBottom: 24 },
  heroImage: { width: "100%", height: "100%" },
  subtitle: { fontSize: 15, color: "rgba(253,248,241,0.85)", textAlign: "center", lineHeight: 22, fontFamily: "Poppins_400Regular" },
  bottomSection: { paddingHorizontal: 24, gap: 12 },
  chooseLabel: { fontSize: 16, color: "rgba(253,248,241,0.7)", fontFamily: "Poppins_500Medium", textAlign: "center" },
  roleButton: { borderRadius: 16, overflow: "hidden" },
  artistButton: { borderWidth: 1.5, borderColor: "rgba(201,147,47,0.4)", borderRadius: 16 },
  roleGradient: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, gap: 14 },
  roleGradientAlt: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, gap: 14, backgroundColor: "rgba(255,255,255,0.07)" },
  roleIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  roleIconCircleAlt: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(201,147,47,0.3)", alignItems: "center", justifyContent: "center" },
  roleTextGroup: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Poppins_700Bold" },
  roleDesc: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_400Regular" },
  termsText: { fontSize: 11, color: "rgba(253,248,241,0.4)", textAlign: "center", fontFamily: "Poppins_400Regular" },
  
  adminPortalBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  adminPortalText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "rgba(253,248,241,0.6)",
    textDecorationLine: "underline",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    marginTop: 10,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  pinContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  pinErrorText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginBottom: 8,
    textAlign: "center",
  },
  modalActions: {
    width: "100%",
    marginTop: 12,
  },
  modalBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  langContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  langContent: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: "#FFF8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(124, 63, 0, 0.1)",
  },
  langTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: "#7C3F00",
    textAlign: "center",
    marginBottom: 4,
  },
  langSubtitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: "#C85C00",
    textAlign: "center",
    marginBottom: 36,
  },
  langBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  langBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#FFF8F0",
  },
});
