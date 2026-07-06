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

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Voter ID", "Driving Licence", "Passport"];

export default function ArtistDocumentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, artists, updateArtistStatus, language } = useApp();
  const isHindi = language === "hi_IN";

  const [saving, setSaving] = useState(false);

  // Find current artist
  const currentArtist = useMemo(() => {
    return artists.find(a => a.phone === userProfile.phone);
  }, [artists, userProfile.phone]);

  const [idType, setIdType] = useState(currentArtist?.idType || "Aadhaar Card");
  const [idNumber, setIdNumber] = useState(currentArtist?.idNumber || "");
  const [idCardPhoto, setIdCardPhoto] = useState(currentArtist?.idCardPhoto || "");

  if (!currentArtist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text, fontFamily: "Poppins_600SemiBold" }}>
          {isHindi ? "आर्टिस्ट प्रोफ़ाइल नहीं मिली।" : "Artist profile not found."}
        </Text>
      </View>
    );
  }

  const handlePickIdCardPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need library permissions to upload your ID card.");
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        setIdCardPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      console.warn("Picker error:", e);
    }
  };

  const handleSaveDocuments = async () => {
    if (!idNumber.trim()) {
      Alert.alert("Error", "Please enter your ID number.");
      return;
    }
    if (!idCardPhoto) {
      Alert.alert("Error", "Please upload a photo of your ID Card document.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaving(true);

    try {
      const { updateArtist } = require("@/firebase/firestoreService");
      
      // Update local context & sync to Firestore — persist the ID type & number, not just the photo
      await updateArtist(currentArtist.id, {
        idType: idType,
        idNumber: idNumber.trim().toUpperCase(),
        idCardPhoto: idCardPhoto,
      });

      // Show alert & exit
      setSaving(false);
      Alert.alert(
        isHindi ? "दस्तावेज़ सफलतापूर्वक सहेजे गए! ✅" : "ID Card Updated ✅",
        isHindi
          ? "आपके सत्यापन दस्तावेज़ सफलतापूर्वक अपडेट कर दिए गए हैं।"
          : "Your verification ID card photo has been updated successfully."
      );
      router.back();
    } catch (e) {
      console.warn("Save documents error:", e);
      setSaving(false);
      Alert.alert("Error", "Unable to save document. Please try again.");
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
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.gold} />
            <Text style={styles.headerTitle}>{isHindi ? "सत्यापन दस्तावेज़" : "Verification Documents"}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{isHindi ? "सरकारी पहचान पत्र अपडेट करें" : "Update Government ID"}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isHindi 
            ? "अपना विवरण सत्यापित रखने और खाता सक्रिय रखने के लिए अपना वैध पहचान पत्र अपलोड करें।" 
            : "Keep your profile verified and clean by updating your identity documents below."}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Select ID Type</Text>
          <View style={styles.idTypeGrid}>
            {ID_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setIdType(type)}
                style={[styles.idChip, idType === type ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.secondary, borderColor: colors.border }]}
              >
                <Text style={{ color: idType === type ? "#fff" : colors.text, fontSize: 11, fontFamily: "Poppins_600SemiBold" }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>ID Number</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="Enter ID number"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>ID Photo Document</Text>
          {idCardPhoto ? (
            <View style={{ alignItems: "center", marginVertical: 8 }}>
              <Image source={{ uri: idCardPhoto }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.removeBtn}
                onPress={() => setIdCardPhoto("")}
              >
                <Ionicons name="trash-outline" size={14} color="#dc2626" />
                <Text style={styles.removeBtnText}>Remove & Reupload</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.uploadBox, { borderColor: colors.border }]}
              onPress={handlePickIdCardPhoto}
            >
              <Ionicons name="cloud-upload-outline" size={28} color={colors.gold} />
              <Text style={[styles.uploadTitle, { color: colors.text }]}>Upload ID Photo</Text>
              <Text style={styles.uploadSubtitle}>Tap to open phone library storage</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
          onPress={handleSaveDocuments}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{isHindi ? "सत्यापन सहेजें" : "Save ID Document"}</Text>
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
  idTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  idChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
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
