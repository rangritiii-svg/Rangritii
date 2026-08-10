import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getTranslation } from "@/constants/locale";
import { ensureMediaLibraryPermission } from "@/utils/permissions";

import { updateArtist } from "@/firebase/firestoreService";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 3;

export default function ArtistPortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, artists, language } = useApp();
  const isHindi = language === "hi_IN";

  const [uploading, setUploading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Find current artist
  const currentArtist = useMemo(() => {
    return artists.find(a => a.phone === userProfile.phone);
  }, [artists, userProfile.phone]);

  const [images, setImages] = useState<string[]>(
    currentArtist?.portfolioImages || []
  );

  // Sync state when currentArtist finishes loading from Firestore
  React.useEffect(() => {
    if (currentArtist && !hasInitialized) {
      if (currentArtist.portfolioImages && currentArtist.portfolioImages.length > 0) {
        setImages(currentArtist.portfolioImages);
      }
      setHasInitialized(true);
    }
  }, [currentArtist, hasInitialized]);

  if (!currentArtist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text, fontFamily: "Poppins_600SemiBold" }}>
          {isHindi ? "आर्टिस्ट प्रोफ़ाइल नहीं मिली।" : "Artist profile not found."}
        </Text>
      </View>
    );
  }

  const handleAddPhoto = async () => {
    if (images.length >= 12) {
      Alert.alert(
        isHindi ? "अधिकतम सीमा पहुँच गई" : "Limit Reached",
        isHindi
          ? "आप एक पोर्टफोलियो में अधिकतम 12 तस्वीरें जोड़ सकते हैं।"
          : "You can add up to 12 portfolio photos."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Confirm Storage/Photos permission BEFORE opening the gallery
    const granted = await ensureMediaLibraryPermission(isHindi);
    if (!granted) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setUploading(true);
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImages(prev => [...prev, dataUrl]);
        setUploading(false);
      }
    } catch (e) {
      console.warn("Image picker error:", e);
      setUploading(false);
      Alert.alert("Error", "Failed to select photo.");
    }
  };

  const handleDeletePhoto = (index: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      isHindi ? "तस्वीर हटाएं?" : "Delete Photo?",
      isHindi 
        ? "क्या आप वाकई इस तस्वीर को अपने पोर्टफोलियो से हटाना चाहते हैं?" 
        : "Are you sure you want to remove this photo from your portfolio?",
      [
        { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
        { 
          text: isHindi ? "हटाएं" : "Delete", 
          style: "destructive", 
          onPress: () => {
            setImages(prev => prev.filter((_, idx) => idx !== index));
          } 
        }
      ]
    );
  };

  const handleSavePortfolio = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setUploading(true);

    try {
      // Update local context & sync to Firestore
      await updateArtist(currentArtist.id, {
        portfolioImages: images
      });

      // Show alert & exit
      setUploading(false);
      Alert.alert(
        isHindi ? "सफलतापूर्वक सहेजा गया! ✅" : "Portfolio Updated ✅",
        isHindi
          ? "आपके पोर्टफोलियो की तस्वीरें सफलतापूर्वक अपडेट कर दी गई हैं।"
          : "Your portfolio gallery photos have been saved successfully."
      );
      router.back();
    } catch (e) {
      console.warn("Save portfolio error:", e);
      setUploading(false);
      Alert.alert("Error", "Unable to save portfolio changes. Please try again.");
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
            <Ionicons name="images-outline" size={20} color={colors.gold} />
            <Text style={styles.headerTitle}>{isHindi ? "पोर्टफोलियो प्रबंधन" : "My Portfolio"}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{isHindi ? "अपना पोर्टफोलियो अपडेट करें" : "Manage Portfolio Photos"}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isHindi 
            ? "ग्राहकों को आकर्षित करने के लिए अपने बेहतरीन मेहंदी डिज़ाइनों की तस्वीरें अपलोड करें।" 
            : "Upload pictures of your best mehndi designs to attract clients. Tap on any photo to remove it."}
        </Text>

        {/* Gallery Grid */}
        <View style={styles.grid}>
          {images.map((img, index) => (
            <View key={index} style={[styles.imageWrapper, { width: CARD_SIZE, height: CARD_SIZE }]}>
              <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.deleteOverlay}
                onPress={() => handleDeletePhoto(index)}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Photo Button Card */}
          <TouchableOpacity 
            style={[styles.addCard, { width: CARD_SIZE, height: CARD_SIZE, borderColor: colors.border }]}
            onPress={handleAddPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="add" size={28} color={colors.primary} />
                <Text style={[styles.addCardText, { color: colors.primary }]}>{isHindi ? "जोड़ें" : "Add Photo"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
          onPress={handleSavePortfolio}
          disabled={uploading}
        >
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{isHindi ? "पोर्टफोलियो सहेजें" : "Save Changes"}</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imageWrapper: { borderRadius: 12, overflow: "hidden", position: "relative" },
  image: { width: "100%", height: "100%" },
  deleteOverlay: { position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(239, 68, 68, 0.85)", justifyContent: "center", alignItems: "center" },
  addCard: { borderStyle: "dashed", borderWidth: 1.5, borderRadius: 12, justifyContent: "center", alignItems: "center", gap: 4 },
  addCardText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 24, marginTop: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Poppins_700Bold" },
});
