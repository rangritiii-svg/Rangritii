import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, ArtistPackage } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getTranslation } from "@/constants/locale";

export default function ArtistRatesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, artists, updateArtistPackages, updateArtistStatus, language } = useApp();
  const isHindi = language === "hi_IN";

  // Find current artist
  const currentArtist = useMemo(() => {
    return artists.find(a => a.phone === userProfile.phone);
  }, [artists, userProfile.phone]);

  if (!currentArtist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text, fontFamily: "Poppins_600SemiBold" }}>
          {isHindi ? "आर्टिस्ट प्रोफ़ाइल नहीं मिली।" : "Artist profile not found."}
        </Text>
      </View>
    );
  }

  // Local state for Hourly Rate
  const [hourlyRate, setHourlyRate] = useState(currentArtist.hourlyRate.toString());

  // Local state for Packages
  const [packages, setPackages] = useState<ArtistPackage[]>(
    currentArtist.packages && currentArtist.packages.length > 0
      ? currentArtist.packages
      : [
          {
            id: `p_${currentArtist.id}_1`,
            nameEn: "Bridal Full Hands",
            nameHi: "दुल्हन पूरे हाथ",
            descriptionEn: "Intricate bridal mehndi up to elbows",
            descriptionHi: "कोहनी तक सुंदर और विस्तृत दुल्हन मेहंदी",
            price: currentArtist.hourlyRate * 4,
            durationHours: 4
          },
          {
            id: `p_${currentArtist.id}_2`,
            nameEn: "Arabic Minimalist",
            nameHi: "अरेबिक न्यूनतम",
            descriptionEn: "Elegant back hand trailing patterns",
            descriptionHi: "हाथ के पीछे सुंदर अरेबिक डिज़ाइन बेल",
            price: currentArtist.hourlyRate * 2,
            durationHours: 2
          },
          {
            id: `p_${currentArtist.id}_3`,
            nameEn: "Full Day Package",
            nameHi: "पूरे दिन का पैकेज",
            descriptionEn: "Complete day booking for large functions/weddings (up to 8 hours)",
            descriptionHi: "बड़े कार्यक्रमों/शादियों के लिए पूरे दिन की बुकिंग (8 घंटे तक)",
            price: currentArtist.hourlyRate * 8,
            durationHours: 8
          }
        ]
  );

  const handleUpdatePackagePrice = (index: number, val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setPackages(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], price: parseInt(numeric) || 0 };
      return copy;
    });
  };

  const handleUpdatePackageDuration = (index: number, val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    setPackages(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], durationHours: parseInt(numeric) || 0 };
      return copy;
    });
  };

  const handleSaveRates = async () => {
    const parsedHourly = parseInt(hourlyRate.replace(/[^0-9]/g, ""));
    if (!parsedHourly || parsedHourly <= 0) {
      Alert.alert(isHindi ? "त्रुटि" : "Error", isHindi ? "कृपया एक मान्य प्रति घंटा दर दर्ज करें।" : "Please enter a valid hourly rate.");
      return;
    }

    // Validate package entries
    for (const p of packages) {
      if (p.price <= 0 || p.durationHours <= 0) {
        Alert.alert(
          isHindi ? "त्रुटि" : "Error",
          isHindi 
            ? "पैकेज मूल्य और अवधि 0 से अधिक होनी चाहिए।"
            : "Package price and duration must be greater than 0."
        );
        return;
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      // Update packages list & hourly rate on the artist document
      updateArtistPackages(currentArtist.id, packages);
      
      // Update hourly rate inside artist list
      updateArtistStatus(currentArtist.id, currentArtist.status); // Keep status, but update local fields in DB
      
      // Save other fields to database via the direct update function
      const { updateArtist } = require("@/firebase/firestoreService");
      await updateArtist(currentArtist.id, {
        hourlyRate: parsedHourly,
        packages: packages
      });

      Alert.alert(
        isHindi ? "सफलतापूर्वक सहेजा गया! ✅" : "Rates Saved ✅",
        isHindi
          ? "आपके सेवा शुल्क और पैकेज सफलतापूर्वक अपडेट कर दिए गए हैं।"
          : "Your service rates and packages have been updated successfully."
      );
      router.back();
    } catch (e) {
      console.warn("Save rates error:", e);
      Alert.alert("Error", "Unable to save rates. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <LinearGradient colors={["#1A0A0E", "#4A1020"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="currency-inr" size={20} color={colors.gold} />
            <Text style={styles.headerTitle}>{isHindi ? "सेवा शुल्क (रेट)" : "Service Rates"}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hourly Rate Input Card */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>⏱️ {isHindi ? "प्रति घंटा शुल्क" : "Hourly Base Rate"}</Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
            {isHindi ? "अपने सामान्य प्रति घंटा काम के लिए मूल दर सेट करें।" : "Set your base charge rate per hour of mehndi service."}
          </Text>

          <View style={styles.inputRow}>
            <Text style={[styles.currencyPrefix, { color: colors.text }]}>₹</Text>
            <TextInput
              style={[styles.rateInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
              keyboardType="numeric"
              value={hourlyRate}
              onChangeText={val => setHourlyRate(val.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 500"
            />
            <Text style={[styles.unitText, { color: colors.mutedForeground }]}>/ {isHindi ? "घंटा" : "hr"}</Text>
          </View>
        </View>

        {/* Packages Customization Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📦 {isHindi ? "मेहंदी पैकेज सेटिंग्स" : "Mehndi Packages Settings"}</Text>

        {packages.map((pkg, idx) => (
          <View key={pkg.id} style={[styles.packageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.packageHeader}>
              <MaterialCommunityIcons name="flower" size={18} color={colors.primary} />
              <Text style={[styles.packageName, { color: colors.text }]}>{isHindi ? pkg.nameHi : pkg.nameEn}</Text>
            </View>
            <Text style={[styles.packageDesc, { color: colors.mutedForeground }]}>{isHindi ? pkg.descriptionHi : pkg.descriptionEn}</Text>

            <View style={styles.packageInputsRow}>
              <View style={styles.packageInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{isHindi ? "मूल्य (₹)" : "Price (₹)"}</Text>
                <TextInput
                  style={[styles.smallInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                  keyboardType="numeric"
                  value={pkg.price.toString()}
                  onChangeText={val => handleUpdatePackagePrice(idx, val)}
                  placeholder="e.g. 2000"
                />
              </View>

              <View style={styles.packageInputContainer}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{isHindi ? "अवधि (घंटे)" : "Duration (hrs)"}</Text>
                <TextInput
                  style={[styles.smallInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                  keyboardType="numeric"
                  value={pkg.durationHours.toString()}
                  onChangeText={val => handleUpdatePackageDuration(idx, val)}
                  placeholder="e.g. 4"
                  maxLength={2}
                />
              </View>
            </View>
          </View>
        ))}

        {/* Save button */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveRates}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{isHindi ? "शुल्क अपडेट सहेजें" : "Save Rates & Packages"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#fff" },
  scrollContent: { padding: 16 },
  settingsCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  cardDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 4, lineHeight: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 10 },
  currencyPrefix: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  rateInput: { height: 44, width: 120, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  unitText: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  sectionTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", marginTop: 24, marginBottom: 12 },
  packageCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  packageHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  packageName: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  packageDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 4, lineHeight: 16 },
  packageInputsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  packageInputContainer: { flex: 1 },
  inputLabel: { fontSize: 11, fontFamily: "Poppins_500Medium", marginBottom: 4 },
  smallInput: { height: 38, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 24, marginTop: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Poppins_700Bold" },
});
