import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { ensureMediaLibraryPermission } from "@/utils/permissions";

export default function ArtistBankScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, artists, language } = useApp();
  const isHindi = language === "hi_IN";

  const [saving, setSaving] = useState(false);

  // Find current artist
  const currentArtist = useMemo(() => {
    return artists.find(a => a.phone === userProfile.phone);
  }, [artists, userProfile.phone]);

  const [accountNumber, setAccountNumber] = useState(currentArtist?.bankAccountNumber || "");
  const [ifscCode, setIfscCode] = useState(currentArtist?.bankIfsc || "");
  const [bankDetailsPhoto, setBankDetailsPhoto] = useState(currentArtist?.bankDetailsPhoto || "");
  const [upiId, setUpiId] = useState(currentArtist?.upiId || "");
  const [upiQrPhoto, setUpiQrPhoto] = useState(currentArtist?.upiQrPhoto || "");

  if (!currentArtist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text, fontFamily: "Poppins_600SemiBold" }}>
          {isHindi ? "आर्टिस्ट प्रोफ़ाइल नहीं मिली।" : "Artist profile not found."}
        </Text>
      </View>
    );
  }

  const handlePickBankPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const granted = await ensureMediaLibraryPermission(isHindi);
    if (!granted) return;
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        setBankDetailsPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      console.warn("Picker error:", e);
    }
  };

  const handlePickQrPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const granted = await ensureMediaLibraryPermission(isHindi);
    if (!granted) return;
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        setUpiQrPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      console.warn("QR picker error:", e);
    }
  };

  const handleSaveBankDetails = async () => {
    const bankComplete = !!(accountNumber.trim() && ifscCode.trim() && bankDetailsPhoto);
    const bankPartial = !!(accountNumber.trim() || ifscCode.trim() || bankDetailsPhoto);
    const hasUpi = !!upiId.trim();

    // Allow saving with EITHER complete bank details OR a UPI ID (QR optional).
    if (!bankComplete && !hasUpi) {
      Alert.alert(
        "Add a payout method",
        "Please add your bank details (account number, IFSC and passbook/cheque photo) OR your UPI ID so you can receive payments."
      );
      return;
    }
    // If bank was partially filled, ask to complete it (keeps records consistent).
    if (bankPartial && !bankComplete) {
      Alert.alert(
        "Complete your bank details",
        "Please fill the account number, IFSC and upload the passbook/cheque photo — or clear those fields and use only UPI."
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaving(true);

    try {
      const { updateArtist } = require("@/firebase/firestoreService");
      
      // Update local context & sync to Firestore — persist ALL entered fields
      await updateArtist(currentArtist.id, {
        bankAccountNumber: accountNumber.trim(),
        bankIfsc: ifscCode.trim().toUpperCase(),
        bankDetailsPhoto: bankDetailsPhoto,
        upiId: upiId.trim(),
        upiQrPhoto: upiQrPhoto,
      });

      // Show alert & exit
      setSaving(false);
      Alert.alert(
        isHindi ? "बैंक विवरण सफलतापूर्वक सहेजे गए! ✅" : "Bank Details Updated ✅",
        isHindi
          ? "आपके भुगतान बैंक विवरण सफलतापूर्वक अपडेट कर दिए गए हैं।"
          : "Your payment bank details and documents have been updated successfully."
      );
      router.back();
    } catch (e) {
      console.warn("Save bank details error:", e);
      setSaving(false);
      Alert.alert("Error", "Unable to save bank details. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={["#1A0A0E", "#4A1020"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="card-outline" size={20} color={colors.gold} />
            <Text style={styles.headerTitle}>{isHindi ? "बैंक खाते का विवरण" : "Bank Account Settings"}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{isHindi ? "भुगतान बैंक खाता विवरण" : "Update Bank Details"}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isHindi 
            ? "ग्राहकों से अपनी बुकिंग का भुगतान सीधे अपने बैंक खाते में प्राप्त करने के लिए अपना सही बैंक विवरण अपडेट करें।" 
            : "Update your bank account information to securely receive direct booking payments from customers."}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Bank Account Number</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Account number"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            secureTextEntry
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>IFSC Code</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
            value={ifscCode}
            onChangeText={setIfscCode}
            placeholder="e.g. SBIN0001234"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Passbook / Cancelled Cheque Photo</Text>
          {bankDetailsPhoto ? (
            <View style={{ alignItems: "center", marginVertical: 8 }}>
              <Image source={{ uri: bankDetailsPhoto }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.removeBtn}
                onPress={() => setBankDetailsPhoto("")}
              >
                <Ionicons name="trash-outline" size={14} color="#dc2626" />
                <Text style={styles.removeBtnText}>Remove & Reupload</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.uploadBox, { borderColor: colors.border }]}
              onPress={handlePickBankPhoto}
            >
              <Ionicons name="cloud-upload-outline" size={28} color={colors.gold} />
              <Text style={[styles.uploadTitle, { color: colors.text }]}>Upload Cheque / Passbook Copy</Text>
              <Text style={styles.uploadSubtitle}>Tap to open phone library storage</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* UPI Payment Details Card */}
        <Text style={[styles.title, { color: colors.text, marginTop: 24 }]}>{isHindi ? "UPI भुगतान विवरण" : "UPI Payment Details"}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isHindi
            ? "अपनी UPI आईडी और भुगतान QR कोड जोड़ें ताकि व्यवस्थापक आपको सीधे आपकी कमाई का भुगतान कर सके।"
            : "Add your UPI ID and payment QR code so the admin can pay your earnings directly to you."}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>{isHindi ? "UPI आईडी" : "UPI ID"}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
            value={upiId}
            onChangeText={setUpiId}
            placeholder="e.g. yourname@upi"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>{isHindi ? "भुगतान QR कोड" : "Payment QR Code"}</Text>
          {upiQrPhoto ? (
            <View style={{ alignItems: "center", marginVertical: 8 }}>
              <Image source={{ uri: upiQrPhoto }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setUpiQrPhoto("")}
              >
                <Ionicons name="trash-outline" size={14} color="#dc2626" />
                <Text style={styles.removeBtnText}>Remove & Reupload</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, { borderColor: colors.border }]}
              onPress={handlePickQrPhoto}
            >
              <Ionicons name="qr-code-outline" size={28} color={colors.gold} />
              <Text style={[styles.uploadTitle, { color: colors.text }]}>Upload Your Payment QR</Text>
              <Text style={styles.uploadSubtitle}>Tap to open phone library storage</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSaveBankDetails}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{isHindi ? "बैंक विवरण सहेजें" : "Save Bank Details"}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  title: { fontSize: 16, fontFamily: "Poppins_700Bold", marginTop: 8 },
  subtitle: { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 4, lineHeight: 18, marginBottom: 20 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  label: { fontSize: 12, fontFamily: "Poppins_600SemiBold", marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, fontFamily: "Poppins_500Medium" },
  previewImage: { width: "100%", height: 180, borderRadius: 12, marginTop: 4 },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "rgba(220,38,38,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  removeBtnText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "#dc2626" },
  uploadBox: { borderStyle: "dashed", borderWidth: 1.5, borderRadius: 12, padding: 24, alignItems: "center", backgroundColor: "rgba(0,0,0,0.02)", marginTop: 4 },
  uploadTitle: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginTop: 6 },
  uploadSubtitle: { fontSize: 10, color: "gray", marginTop: 2 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 24, marginTop: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Poppins_700Bold" },
});
