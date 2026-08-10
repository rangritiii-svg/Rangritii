import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Head from "expo-router/head";
import React, { useState } from "react";
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

/* RangRiti 2.0 design tokens */
const MAROON = "#4A1020";
const DARK = "#1A0A0E";
const GOLD = "#C9932F";
const GOLD_DARK = "#A87525";
const BLUSH = "#FDEDF3";
const CREAM = "#FFF8F0";
const INK = "#2A1020";
const MUTED = "#8A6070";
const BORDER = "#F5D0DC";

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { userProfile, setUserProfile, addCustomer, customers, language } = useApp();

  const [name, setName] = useState(userProfile.name || "");
  const [phone, setPhone] = useState(userProfile.phone?.replace("+91 ", "") || "");
  const [state, setState] = useState(userProfile.state || "Rajasthan");
  const [city, setCity] = useState(userProfile.city || "Jaipur");
  const [area, setArea] = useState(userProfile.area || "");
  const [loading, setLoading] = useState(false);

  // Dropdown Modal states
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Geo-tagged location
  const [latitude, setLatitude] = useState<number | null>(userProfile.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(userProfile.longitude ?? null);
  const [locating, setLocating] = useState(false);

  const handleCaptureLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLocating(true);
    const coords = await getCurrentCoordinates(language === "hi_IN");
    setLocating(false);
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }
    if (!state) {
      Alert.alert("Required", "Please select your state.");
      return;
    }
    if (!city) {
      Alert.alert("Required", "Please select your city.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);

    const userPhone = phone.trim() ? `+91 ${phone.trim()}` : "";
    const userName = name.trim();
    const userCity = city.trim();
    const userState = state.trim();
    const userArea = area.trim();

    try {
      // Find existing customer doc by email or phone
      const existing = customers.find(
        (c) =>
          (userProfile.email && c.email?.toLowerCase() === userProfile.email.toLowerCase()) ||
          (userPhone && c.phone === userPhone)
      );

      if (existing) {
        await updateCustomer(existing.id, {
          name: userName,
          state: userState,
          city: userCity,
          area: userArea,
          ...(userPhone ? { phone: userPhone } : {}),
          ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
        });
      } else {
        addCustomer({
          name: userName,
          phone: userPhone,
          state: userState,
          city: userCity,
          area: userArea,
          email: userProfile.email || "",
          ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
        });
      }

      await setUserProfile({
        role: "customer",
        name: userName,
        phone: userPhone || userProfile.phone,
        state: userState,
        city: userCity,
        area: userArea,
        ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
      });

      setLoading(false);
      router.replace("/(tabs)");
    } catch (err: any) {
      setLoading(false);
      console.error("Save profile error:", err);
      // Even if Firestore update errors out offline, update local userProfile & navigate
      await setUserProfile({
        role: "customer",
        name: userName,
        phone: userPhone || userProfile.phone,
        state: userState,
        city: userCity,
        area: userArea,
      });
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Head>
        <title>Complete Your Profile — RangRiti</title>
      </Head>

      <LinearGradient
        colors={[DARK, MAROON, "#6E1830"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + 14, 40) }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="location" size={28} color={GOLD} />
          </View>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
          <Text style={styles.headerSubtitle}>Set your location to see verified Mehndi artists near you</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.formInner, isWide && styles.formInnerWide]}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color={MUTED} />
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={MUTED}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>State *</Text>
          <TouchableOpacity style={styles.inputRow} onPress={() => setStateModalVisible(true)}>
            <Ionicons name="map-outline" size={18} color={MUTED} />
            <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: state ? INK : MUTED }}>
              {state || "Select State"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={MUTED} />
          </TouchableOpacity>

          <Text style={styles.label}>City / District *</Text>
          <TouchableOpacity
            style={[styles.inputRow, { opacity: state ? 1 : 0.6 }]}
            onPress={() => {
              if (!state) {
                Alert.alert("Select State First", "Please select a state to view cities.");
                return;
              }
              setCityModalVisible(true);
            }}
          >
            <Ionicons name="business-outline" size={18} color={MUTED} />
            <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: city ? INK : MUTED }}>
              {city || "Select City"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={MUTED} />
          </TouchableOpacity>

          <Text style={styles.label}>Area / Locality (Optional)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color={MUTED} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Vaishali Nagar, Malviya Nagar"
              placeholderTextColor={MUTED}
              value={area}
              onChangeText={setArea}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Mobile Number (Optional)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.countryCode}>🇮🇳 +91</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number (for SMS updates)"
              placeholderTextColor={MUTED}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.label}>📍 Geo-tag Location (Optional)</Text>
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

          <TouchableOpacity style={styles.primaryBtnShadow} onPress={handleSaveProfile} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.primaryBtnText}>Save & Start Exploring</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* State Selector Modal */}
      <Modal visible={stateModalVisible} animationType="slide" transparent={true} onRequestClose={() => setStateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)}>
                <Ionicons name="close" size={24} color={INK} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={Object.keys(INDIAN_STATES_CITIES)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setState(item);
                    setCity(INDIAN_STATES_CITIES[item]?.[0] || "");
                    setStateModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, state === item && { color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }]}>
                    {item}
                  </Text>
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
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close" size={24} color={INK} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={state ? INDIAN_STATES_CITIES[state] : []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCity(item);
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, city === item && { color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }]}>
                    {item}
                  </Text>
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
  headerContent: { alignItems: "center" },
  headerIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(201,147,47,0.15)", borderWidth: 1.5, borderColor: "rgba(201,147,47,0.45)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: CREAM, fontFamily: "Poppins_700Bold" },
  headerSubtitle: { fontSize: 13, color: "rgba(253,248,241,0.8)", fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 4 },
  formContainer: { padding: 20, paddingBottom: 60 },
  formInner: { width: "100%", gap: 4 },
  formInnerWide: { maxWidth: 520, alignSelf: "center", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 24, marginTop: 12 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: INK, marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  countryCode: { fontSize: 14, fontFamily: "Poppins_500Medium", color: INK },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: INK },
  geoBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, marginTop: 4 },
  geoBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  geoCoords: { fontSize: 11, fontFamily: "Poppins_400Regular", color: MUTED, marginTop: 2 },
  primaryBtnShadow: { borderRadius: 16, marginTop: 24, marginBottom: 8, shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 16 },
  primaryBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(26,10,14,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: "65%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: INK },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  modalItemText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: INK },
});
