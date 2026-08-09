import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Modal, FlatList, ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { INDIAN_STATES_CITIES } from "@/constants/locations";
import { ensureMediaLibraryPermission, getCurrentCoordinates } from "@/utils/permissions";

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

const MEHNDI_TYPES = [
  "Bridal", "Arabic", "Traditional", "Marwari", "Modern Bridal", "Indo-Western",
  "Modern / Minimal", "Mughal", "South Indian", "Gujarati", "Pakistani"
];

const ID_TYPES = ["Aadhaar Card", "PAN Card", "Voter ID", "Driving Licence", "Passport"];

const STEPS = [
  { id: 1, title: "Personal Info", icon: "person-outline" },
  { id: 2, title: "Location", icon: "location-outline" },
  { id: 3, title: "Services", icon: "brush-outline" },
  { id: 4, title: "Work Photos", icon: "images-outline" },
  { id: 5, title: "Verification", icon: "shield-checkmark-outline" },
];

export default function ArtistRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { setUserProfile, registerNewArtist, language } = useApp();

  const params = useLocalSearchParams<{ phone?: string }>();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Dropdown Modal states
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Step 1 — Personal Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(params.phone ?? "");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  // Step 2 — Location
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [travelRadius, setTravelRadius] = useState("");

  // Geo-tagged location (captured from device GPS)
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

  // Step 3 — Services
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [minCharge, setMinCharge] = useState("");
  const [bridalRate, setBridalRate] = useState("");
  const [homeVisit, setHomeVisit] = useState(true);
  const [studioVisit, setStudioVisit] = useState(false);

  // Step 4 — Work Photos
  const [regPortfolioImages, setRegPortfolioImages] = useState<string[]>([]);

  // Step 5 — Verification
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [regIdCardImage, setRegIdCardImage] = useState("");
  const [regUpiQrImage, setRegUpiQrImage] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Image action modal — shown after a photo is picked
  // pendingField: which field the pending image belongs to
  type ImageField = "portfolio" | "idCard" | "upiQr";
  const [imageActionVisible, setImageActionVisible] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState("");
  const [pendingField, setPendingField] = useState<ImageField>("portfolio");
  const [pendingPortfolioIdx, setPendingPortfolioIdx] = useState<number | null>(null);

  const toggleStyle = (style: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const togglePhoto = (id: string) => {
    // Staging array setup
  };

  // Generic image launcher — opens gallery then shows the action modal
  const launchImagePicker = async (field: ImageField, replaceIdx?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    // Always confirm Storage/Photos permission BEFORE opening the gallery
    const granted = await ensureMediaLibraryPermission(language === "hi_IN");
    if (!granted) return;
    try {
      // allowsEditing lets the user do a basic crop inline before confirming
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: field !== "portfolio", // crop inline for ID / QR
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPendingImageUri(dataUrl);
        setPendingField(field);
        setPendingPortfolioIdx(replaceIdx ?? null);
        setImageActionVisible(true);
      }
    } catch (e) {
      console.warn("Picker error:", e);
    }
  };

  const handlePickPortfolioPhoto = (replaceIdx?: number) => launchImagePicker("portfolio", replaceIdx);
  const handlePickIdCardPhoto = () => launchImagePicker("idCard");
  const handlePickUpiQrPhoto = () => launchImagePicker("upiQr");

  // Called when the user taps "Save" in the image action modal
  const commitPendingImage = () => {
    if (pendingField === "portfolio") {
      setRegPortfolioImages(prev => {
        if (pendingPortfolioIdx !== null) {
          // Replace existing slot
          const next = [...prev];
          next[pendingPortfolioIdx] = pendingImageUri;
          return next;
        }
        return [...prev, pendingImageUri];
      });
    } else if (pendingField === "idCard") {
      setRegIdCardImage(pendingImageUri);
    } else if (pendingField === "upiQr") {
      setRegUpiQrImage(pendingImageUri);
    }
    setImageActionVisible(false);
    setPendingImageUri("");
  };

  // "Crop" — re-opens picker with editing forced on
  const reopenWithCrop = async () => {
    setImageActionVisible(false);
    await new Promise(r => setTimeout(r, 300)); // let modal close first
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPendingImageUri(dataUrl);
        setImageActionVisible(true);
      }
    } catch (e) {
      console.warn("Crop picker error:", e);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!fullName.trim()) { Alert.alert("Required", "Please enter your full name."); return false; }
      if (phone.length !== 10) { Alert.alert("Required", "Enter a valid 10-digit phone number."); return false; }
      if (!email.trim()) { Alert.alert("Required", "Please enter your email address."); return false; }
      if (!password.trim()) { Alert.alert("Required", "Please enter a password."); return false; }
    }
    if (step === 2) {
      if (!state.trim() || !city.trim() || !area.trim()) { Alert.alert("Required", "State, city and area are required."); return false; }
    }
    if (step === 3) {
      if (selectedStyles.length === 0) { Alert.alert("Required", "Select at least one Mehndi style."); return false; }
      if (!hourlyRate.trim()) { Alert.alert("Required", "Enter your hourly charge."); return false; }
    }
    if (step === 4) {
      if (regPortfolioImages.length === 0) {
        Alert.alert("Portfolio Required", "Please upload at least one portfolio image of your work from your phone gallery.");
        return false;
      }
    }
    if (step === 5) {
      if (!idType || !idNumber.trim()) { Alert.alert("Required", "Please provide ID type and number."); return false; }
      if (!regIdCardImage) {
        Alert.alert("ID Document Required", "Please upload a photo of your Government ID document.");
        return false;
      }
      if (!upiId.trim()) {
        Alert.alert("Required", "Please enter your UPI ID to receive payments.");
        return false;
      }
      if (!agreed) { Alert.alert("Terms Required", "Please agree to the Terms & Conditions."); return false; }
    }
    return true;
  };



  const handleNext = () => {
    if (!validateStep()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (step < 5) { setStep(step + 1); return; }
    // Final submit
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);

    const userPhone = `+91 ${phone}`;
    const userCity = city.trim();
    const userArea = area.trim();

    try {
      await registerNewArtist({
        name: fullName.trim(),
        phone: userPhone,
        password: password.trim(),
        city: userCity,
        state: state.trim(),
        area: userArea,
        styles: selectedStyles,
        minPrice: parseInt(minCharge) || 1000,
        maxPrice: parseInt(bridalRate) || 5000,
        hourlyRate: parseInt(hourlyRate) || 500,
        experience: parseInt(experience) || 1,
        verified: false,
        bio: bio.trim() || `Professional Mehndi artist specializing in ${selectedStyles.join(", ")}.`,
        bioHi: bio.trim() ? `पेशेवर मेहंदी कलाकार। ${bio.trim()}` : `${selectedStyles.join(", ")} में विशेषज्ञता रखने वाले पेशेवर मेहंदी कलाकार।`,
        availability: "Available",
        portfolioStyle: "bridal",
        specialization: `${selectedStyles[0] || "General"} Mehndi Specialist`,
        portfolioImages: regPortfolioImages,
        idCardPhoto: regIdCardImage,
        upiId: upiId.trim(),
        upiQrPhoto: regUpiQrImage,
        // Real GPS coordinates when the artist geo-tagged their location
        ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
      });

      await setUserProfile({
        role: "artist",
        name: fullName.trim(),
        city: userCity,
        phone: userPhone,
        area: userArea,
      });

      setLoading(false);
      Alert.alert(
        "🎉 Registration Submitted!",
        "Your artist profile is under review. We'll verify your details within 24 hours.",
        [{ text: "Got it!", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (err) {
      setLoading(false);
      console.error("Artist registration failed:", err);
      Alert.alert(
        "Registration Failed",
        "We couldn't save your registration. Please check your internet connection and try again.",
        [{ text: "Retry", onPress: handleSubmit }, { text: "Cancel", style: "cancel" }]
      );
    }
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Head>
        <title>Register as a Mehndi Artist — RangRiti | Free Artist Onboarding</title>
        <meta
          name="description"
          content="Join RangRiti as a verified mehndi artist — create your portfolio, set your hourly rate, geo-tag your service area and start receiving bookings from customers across Rajasthan."
        />
      </Head>
      {/* Header */}
      <LinearGradient
        colors={[DARK, MAROON, "#6E1830"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + 8, 36) }]}
      >
        <View style={[styles.headerInner, isWide && styles.headerInnerWide]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Artist Registration</Text>
            <Text style={styles.stepBadge}>{step}/{STEPS.length}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Step Indicators */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepsRow}>
            {STEPS.map(s => (
              <View key={s.id} style={styles.stepItem}>
                <View style={[styles.stepCircle, s.id <= step ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  {s.id < step
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Ionicons name={s.icon as any} size={14} color={s.id === step ? "#fff" : "rgba(255,248,240,0.45)"} />
                  }
                </View>
                <Text style={[styles.stepLabel, { color: s.id === step ? GOLD : "rgba(255,248,240,0.55)" }]}>{s.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.formInner, isWide && styles.formInnerWide]}>

        {/* ─── STEP 1: Personal Info ─── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>👤 Personal Information</Text>
            <Text style={styles.stepDesc}>Tell us about yourself</Text>

            <Field label="Full Name *" colors={colors}>
              <TextInput style={styles.input} placeholder="e.g. Priya Sharma" placeholderTextColor={MUTED} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            </Field>

            <Field label="Mobile Number *" colors={colors}>
              <Text style={styles.countryCode}>🇮🇳 +91</Text>
              <TextInput style={styles.input} placeholder="10-digit number" placeholderTextColor={MUTED} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
            </Field>

            <Field label="Email Address *" colors={colors}>
              <TextInput style={styles.input} placeholder="yourname@domain.com" placeholderTextColor={MUTED} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </Field>

            <Field label="Password *" colors={colors}>
              <TextInput
                style={styles.input}
                placeholder="Set password for your account"
                placeholderTextColor={MUTED}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </Field>

            <Field label="Years of Experience *" colors={colors}>
              <TextInput style={styles.input} placeholder="e.g. 5" placeholderTextColor={MUTED} value={experience} onChangeText={setExperience} keyboardType="number-pad" maxLength={2} />
            </Field>

            <Text style={styles.label}>About You / Bio</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your style, specialties and experience... (customers will see this)"
                placeholderTextColor={MUTED}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.charCount}>{bio.length}/300</Text>
            </View>

          </View>
        )}

        {/* ─── STEP 2: Location ─── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>📍 Location Details</Text>
            <Text style={styles.stepDesc}>Where do you provide your services?</Text>

            <Field label="State *" colors={colors}>
              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center" }} onPress={() => setStateModalVisible(true)}>
                <Ionicons name="map-outline" size={18} color={MUTED} style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: state ? INK : MUTED }}>
                  {state || "Select State"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={MUTED} />
              </TouchableOpacity>
            </Field>

            <Field label="City *" colors={colors}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: "row", alignItems: "center", opacity: state ? 1 : 0.6 }}
                onPress={() => {
                  if (!state) {
                    Alert.alert("Select State First", "Please select a state to view available cities.");
                    return;
                  }
                  setCityModalVisible(true);
                }}
              >
                <Ionicons name="business-outline" size={18} color={MUTED} style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: city ? INK : MUTED }}>
                  {city || "Select City"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={MUTED} />
              </TouchableOpacity>
            </Field>

            <Field label="Area / Locality *" colors={colors}>
              <TextInput style={styles.input} placeholder="e.g. Andheri West, Bandra" placeholderTextColor={MUTED} value={area} onChangeText={setArea} autoCapitalize="words" />
            </Field>

            <Field label="Pincode" colors={colors}>
              <TextInput style={styles.input} placeholder="6-digit pincode" placeholderTextColor={MUTED} value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
            </Field>

            <Field label="Travel Radius (km)" colors={colors}>
              <TextInput style={styles.input} placeholder="Max distance you'll travel (e.g. 15)" placeholderTextColor={MUTED} value={travelRadius} onChangeText={setTravelRadius} keyboardType="number-pad" maxLength={3} />
            </Field>

            {/* Geo-tag current location */}
            <Text style={styles.label}>📍 Geo-tag Your Location</Text>
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

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={GOLD_DARK} />
              <Text style={styles.infoBoxText}>
                Geo-tagging helps nearby customers find you. Your exact address stays private — customers only see your city and area.
              </Text>
            </View>
          </View>
        )}

        {/* ─── STEP 3: Services & Pricing ─── */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>✋ Services & Pricing</Text>
            <Text style={styles.stepDesc}>What styles do you offer and your rates?</Text>

            <Text style={styles.label}>Types of Mehndi You Offer * <Text style={{ color: MUTED, fontFamily: "Poppins_400Regular" }}>(select all that apply)</Text></Text>
            <View style={styles.stylesGrid}>
              {MEHNDI_TYPES.map(style => {
                const active = selectedStyles.includes(style);
                return (
                  <TouchableOpacity
                    key={style}
                    onPress={() => toggleStyle(style)}
                    style={[styles.styleChip, active ? styles.chipActive : styles.chipIdle]}
                  >
                    <Text style={[styles.styleChipText, { color: active ? "#fff" : INK }]}>{style}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.pricingCard}>
              <Text style={styles.pricingCardTitle}>💰 Your Charges</Text>

              <Text style={styles.label}>Hourly Rate (₹) *</Text>
              <Field label="" colors={colors}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput style={styles.input} placeholder="e.g. 500" placeholderTextColor={MUTED} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="number-pad" />
                <Text style={styles.perHr}>/ hour</Text>
              </Field>

              <Text style={styles.label}>Minimum Charge (₹)</Text>
              <Field label="" colors={colors}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput style={styles.input} placeholder="e.g. 1500" placeholderTextColor={MUTED} value={minCharge} onChangeText={setMinCharge} keyboardType="number-pad" />
              </Field>

              <Text style={styles.label}>Full Bridal Package (₹)</Text>
              <Field label="" colors={colors}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput style={styles.input} placeholder="e.g. 12000" placeholderTextColor={MUTED} value={bridalRate} onChangeText={setBridalRate} keyboardType="number-pad" />
              </Field>
            </View>

            <Text style={styles.label}>Service Mode</Text>
            <View style={styles.serviceToggleRow}>
              <TouchableOpacity
                style={[styles.serviceToggle, homeVisit ? styles.chipActive : styles.chipIdle]}
                onPress={() => setHomeVisit(!homeVisit)}
              >
                <Ionicons name="home-outline" size={16} color={homeVisit ? "#fff" : INK} />
                <Text style={[styles.serviceToggleText, { color: homeVisit ? "#fff" : INK }]}>Home Visit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.serviceToggle, studioVisit ? styles.chipActive : styles.chipIdle]}
                onPress={() => setStudioVisit(!studioVisit)}
              >
                <Ionicons name="storefront-outline" size={16} color={studioVisit ? "#fff" : INK} />
                <Text style={[styles.serviceToggleText, { color: studioVisit ? "#fff" : INK }]}>Studio / Parlour</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEP 4: Work Photos ─── */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>📸 Previous Work Photos</Text>
            <Text style={styles.stepDesc}>Showcase your best Mehndi designs to attract customers</Text>

            <TouchableOpacity
              style={styles.uploadHint}
              onPress={() => handlePickPortfolioPhoto()}
            >
              <Ionicons name="cloud-upload-outline" size={32} color={GOLD} />
              <Text style={styles.uploadHintTitle}>Upload Portfolio Photos</Text>
              <Text style={styles.uploadHintDesc}>
                Tap here to open your phone gallery and select work photos.
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 16 }]}>Uploaded Work Photos ({regPortfolioImages.length})</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {regPortfolioImages.map((img, idx) => (
                <View key={idx} style={{ width: 100, height: 100, borderRadius: 12, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: BORDER }}>
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  {/* Tap photo to replace it */}
                  <TouchableOpacity
                    style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" }}
                    onPress={() => handlePickPortfolioPhoto(idx)}
                  />
                  {/* Edit badge */}
                  <View style={{ position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(26,10,14,0.6)", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, color: "#fff", fontFamily: "Poppins_600SemiBold" }}>✎ Edit</Text>
                  </View>
                  {/* Remove button */}
                  <TouchableOpacity
                    style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(220,38,38,0.85)", justifyContent: "center", alignItems: "center" }}
                    onPress={() => setRegPortfolioImages(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add new photo tile */}
              <TouchableOpacity
                style={{ width: 100, height: 100, borderRadius: 12, borderStyle: "dashed", borderWidth: 1.5, borderColor: GOLD, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(201,147,47,0.06)" }}
                onPress={() => handlePickPortfolioPhoto()}
              >
                <Ionicons name="add" size={24} color={GOLD_DARK} />
                <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: GOLD_DARK, marginTop: 2 }}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.infoBox, { marginTop: 20 }]}>
              <Ionicons name="bulb-outline" size={18} color={GOLD_DARK} />
              <Text style={styles.infoBoxText}>
                Tip: Artists with 5+ portfolio photos get 3× more bookings. Tap any photo to replace it.
              </Text>
            </View>
          </View>
        )}

        {/* ─── STEP 5: Verification ─── */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeading}>🛡️ Identity Verification</Text>
            <Text style={styles.stepDesc}>Required to build trust with customers and receive payments</Text>

            <Text style={styles.label}>Government ID Type *</Text>
            <View style={styles.idTypeGrid}>
              {ID_TYPES.map(id => (
                <TouchableOpacity
                  key={id}
                  onPress={() => setIdType(id)}
                  style={[styles.idChip, idType === id ? styles.chipActive : styles.chipIdle]}
                >
                  <Text style={[styles.idChipText, { color: idType === id ? "#fff" : INK }]}>{id}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field label="ID Number *" colors={colors}>
              <TextInput style={styles.input} placeholder={idType || "Enter your ID number"} placeholderTextColor={MUTED} value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" />
            </Field>

            {/* Government ID Photo selection */}
            {regIdCardImage ? (
              <View style={{ alignItems: "center", marginVertical: 12 }}>
                <Image source={{ uri: regIdCardImage }} style={{ width: "100%", height: 180, borderRadius: 14, borderWidth: 1, borderColor: BORDER }} resizeMode="cover" />
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: "rgba(220,38,38,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                  onPress={() => setRegIdCardImage("")}
                >
                  <Ionicons name="trash-outline" size={14} color="#dc2626" />
                  <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "#dc2626" }}>Remove ID Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadHint, { paddingVertical: 14, marginVertical: 8 }]}
                onPress={handlePickIdCardPhoto}
              >
                <FontAwesome5 name="id-card" size={24} color={GOLD} />
                <Text style={[styles.uploadHintTitle, { fontSize: 14, marginTop: 4 }]}>Upload ID Document Photo</Text>
                <Text style={{ fontSize: 10, color: MUTED, textAlign: "center", marginTop: 2 }}>Tap to open phone library storage</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.pricingCard, { marginTop: 12 }]}>
              <Text style={styles.pricingCardTitle}>💸 UPI Payment Details</Text>
              <Text style={styles.bankNote}>Required to receive booking payments directly to your UPI account.</Text>

              {/* UPI ID input */}
              <Field label="Your UPI ID *" colors={colors}>
                <Ionicons name="at-outline" size={18} color={MUTED} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. yourname@upi or 9876543210@paytm"
                  placeholderTextColor={MUTED}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </Field>

              {/* UPI QR Code upload */}
              <Text style={[styles.label, { marginTop: 10 }]}>UPI QR Code Photo (Optional)</Text>
              <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: MUTED, marginBottom: 8 }}>
                Upload a screenshot of your UPI QR so customers can pay you directly.
              </Text>
              {regUpiQrImage ? (
                <View style={{ alignItems: "center", marginVertical: 8 }}>
                  <View style={{ width: 180, height: 180, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff" }}>
                    <Image source={{ uri: regUpiQrImage }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                  </View>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: BORDER }}
                      onPress={handlePickUpiQrPhoto}
                    >
                      <Ionicons name="refresh-outline" size={14} color={GOLD_DARK} />
                      <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: GOLD_DARK }}>Replace QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(220,38,38,0.08)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 }}
                      onPress={() => setRegUpiQrImage("")}
                    >
                      <Ionicons name="trash-outline" size={14} color="#dc2626" />
                      <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "#dc2626" }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ borderStyle: "dashed", borderWidth: 1.5, borderColor: GOLD, padding: 20, borderRadius: 16, alignItems: "center", backgroundColor: "rgba(201,147,47,0.06)", marginTop: 4, gap: 6 }}
                  onPress={handlePickUpiQrPhoto}
                >
                  <MaterialCommunityIcons name="qrcode-scan" size={32} color={GOLD} />
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: INK }}>Upload UPI QR Code</Text>
                  <Text style={{ fontSize: 10, color: MUTED, textAlign: "center" }}>Tap to select a QR code screenshot from your gallery</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 Registration Summary</Text>
              <SummaryRow label="Name" value={fullName || "—"} colors={colors} />
              <SummaryRow label="Phone" value={phone ? `+91 ${phone}` : "—"} colors={colors} />
              <SummaryRow label="Location" value={[area, city, state].filter(Boolean).join(", ") || "—"} colors={colors} />
              <SummaryRow label="Styles" value={selectedStyles.length > 0 ? selectedStyles.join(", ") : "—"} colors={colors} />
              <SummaryRow label="Hourly Rate" value={hourlyRate ? `₹${hourlyRate}/hr` : "—"} colors={colors} />
              <SummaryRow label="ID Type" value={idType || "—"} colors={colors} />
              <SummaryRow label="UPI ID" value={upiId || "—"} colors={colors} />
            </View>

            {/* Terms */}
            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
              <View style={[styles.checkbox, { borderColor: agreed ? GOLD : BORDER, backgroundColor: agreed ? GOLD : "#fff" }]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.termsText}>
                I agree to Rangritii's{" "}
                <Text style={{ color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }}>Terms of Service</Text>,{" "}
                <Text style={{ color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }}>Privacy Policy</Text>, and confirm all information provided is accurate.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {step > 1 && (
            <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(step - 1)}>
              <Ionicons name="chevron-back" size={18} color={INK} />
              <Text style={styles.prevBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtnShadow, { flex: step > 1 ? 2 : 1 }]}
            onPress={handleNext}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
              {loading ? (
                <Text style={styles.nextBtnText}>Submitting...</Text>
              ) : step === 5 ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.nextBtnText}>Submit Registration</Text>
                </>
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Next Step</Text>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
                    setCity("");
                    setStateModalVisible(false);
                  }}
                >
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
                  <Text style={[styles.modalItemText, city === item && { color: GOLD_DARK, fontFamily: "Poppins_600SemiBold" }]}>{item}</Text>
                  {city === item && <Ionicons name="checkmark" size={18} color={GOLD_DARK} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Image Action Modal ─────────────────────────────────────────── */}
      {/* Shown after any photo is picked. Lets the user Save, Crop, or pick another. */}
      <Modal
        visible={imageActionVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setImageActionVisible(false); setPendingImageUri(""); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageActionSheet}>
            {/* Handle pill */}
            <View style={styles.sheetHandle} />

            <Text style={styles.imageActionTitle}>
              {pendingField === "portfolio" ? "📷 Portfolio Photo" :
               pendingField === "idCard"   ? "🪪 ID Document Photo" :
                                             "📱 UPI QR Code Photo"}
            </Text>
            <Text style={styles.imageActionSubtitle}>
              Preview your selected photo below, then choose an action.
            </Text>

            {/* Image Preview */}
            {pendingImageUri ? (
              <View style={styles.imagePreviewWrapper}>
                <Image
                  source={{ uri: pendingImageUri }}
                  style={styles.imagePreview}
                  resizeMode={pendingField === "upiQr" ? "contain" : "cover"}
                />
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.imageActionBtnsCol}>
              {/* Save */}
              <TouchableOpacity
                style={styles.imageActionBtnShadow}
                onPress={commitPendingImage}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.imageActionBtn}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={[styles.imageActionBtnText, { color: "#fff" }]}>Save Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Crop */}
              <TouchableOpacity
                style={[styles.imageActionBtn, styles.imageActionBtnGhost]}
                onPress={reopenWithCrop}
                activeOpacity={0.85}
              >
                <Ionicons name="crop-outline" size={20} color={INK} />
                <Text style={[styles.imageActionBtnText, { color: INK }]}>Crop / Adjust</Text>
              </TouchableOpacity>

              {/* Select another */}
              <TouchableOpacity
                style={[styles.imageActionBtn, styles.imageActionBtnGhost]}
                onPress={() => {
                  setImageActionVisible(false);
                  setPendingImageUri("");
                  setTimeout(() => launchImagePicker(pendingField, pendingPortfolioIdx ?? undefined), 300);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="images-outline" size={20} color={INK} />
                <Text style={[styles.imageActionBtnText, { color: INK }]}>Select Another Photo</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                style={{ marginTop: 4, alignItems: "center", paddingVertical: 10 }}
                onPress={() => { setImageActionVisible(false); setPendingImageUri(""); }}
              >
                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: MUTED }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>

  );
}

// Helper components
function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  if (!label) {
    return (
      <View style={fieldStyles.row}>
        {children}
      </View>
    );
  }
  return (
    <>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        {children}
      </View>
    </>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: INK, marginBottom: 6, marginTop: 14 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 2 },
});

const summaryStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, gap: 10 },
  label: { fontSize: 12, fontFamily: "Poppins_400Regular", color: MUTED, flex: 1 },
  value: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: INK, flex: 2, textAlign: "right" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingBottom: 16, paddingHorizontal: 20 },
  headerInner: { width: "100%" },
  headerInnerWide: { maxWidth: 640, alignSelf: "center" },
  headerTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,248,240,0.12)", borderWidth: 1, borderColor: "rgba(255,248,240,0.25)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: CREAM, fontFamily: "Poppins_700Bold" },
  stepBadge: { fontSize: 13, color: GOLD, fontFamily: "Poppins_600SemiBold", backgroundColor: "rgba(201,147,47,0.15)", borderWidth: 1, borderColor: "rgba(201,147,47,0.45)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  progressBarBg: { height: 4, backgroundColor: "rgba(255,248,240,0.18)", borderRadius: 2, marginBottom: 14 },
  progressBarFill: { height: 4, backgroundColor: GOLD, borderRadius: 2 },
  stepsRow: { gap: 12, paddingBottom: 4 },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: GOLD, borderWidth: 1, borderColor: "rgba(255,248,240,0.35)" },
  stepCircleInactive: { backgroundColor: "rgba(255,248,240,0.12)" },
  stepLabel: { fontSize: 9, fontFamily: "Poppins_500Medium" },
  formScroll: { paddingBottom: 40 },
  formInner: { width: "100%" },
  formInnerWide: { maxWidth: 520, alignSelf: "center" },
  stepContent: { marginHorizontal: 20, marginTop: 20, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: BORDER, padding: 18 },
  stepHeading: { fontSize: 20, fontFamily: "Poppins_700Bold", color: INK, marginBottom: 4 },
  stepDesc: { fontSize: 13, fontFamily: "Poppins_400Regular", color: MUTED, marginBottom: 20 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: INK, marginBottom: 6, marginTop: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: INK },
  countryCode: { fontSize: 14, fontFamily: "Poppins_500Medium", color: INK },
  rupee: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: INK },
  perHr: { fontSize: 12, fontFamily: "Poppins_400Regular", color: MUTED },
  textAreaWrapper: { borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff", padding: 14, marginBottom: 2 },
  textArea: { fontSize: 13, fontFamily: "Poppins_400Regular", color: INK, minHeight: 90, lineHeight: 20 },
  charCount: { alignSelf: "flex-end", fontSize: 10, fontFamily: "Poppins_400Regular", color: MUTED, marginTop: 4 },
  geoBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, marginTop: 6 },
  geoBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  geoCoords: { fontSize: 11, fontFamily: "Poppins_400Regular", color: MUTED, marginTop: 2 },
  infoBox: { flexDirection: "row", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 14, marginTop: 14, alignItems: "flex-start" },
  infoBoxText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", color: INK, lineHeight: 18 },
  stylesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  styleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  styleChipText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  chipActive: { backgroundColor: GOLD, borderColor: GOLD, shadowColor: GOLD, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  chipIdle: { backgroundColor: "#fff", borderColor: BORDER },
  pricingCard: { borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 16, marginTop: 16 },
  pricingCardTitle: { fontSize: 11.5, fontFamily: "Poppins_700Bold", color: GOLD_DARK, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  bankNote: { fontSize: 11, fontFamily: "Poppins_400Regular", color: MUTED, marginBottom: 8 },
  serviceToggleRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  serviceToggle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12 },
  serviceToggleText: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  uploadHint: { borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 20, alignItems: "center", gap: 8, marginBottom: 16 },
  uploadHintTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", color: INK },
  uploadHintDesc: { fontSize: 12, fontFamily: "Poppins_400Regular", color: MUTED, textAlign: "center", lineHeight: 18 },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
  uploadBtnText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#fff" },
  photosGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  photoWrapper: { flex: 1, borderRadius: 12, overflow: "hidden", position: "relative" },
  photoThumb: { width: "100%", aspectRatio: 0.85 },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.1)", alignItems: "center", justifyContent: "center" },
  photoOverlaySelected: { backgroundColor: "rgba(249,170,191,0.6)" },
  photoLabelBg: { paddingHorizontal: 6, paddingVertical: 3 },
  photoLabel: { fontSize: 9, fontFamily: "Poppins_500Medium", textAlign: "center" },
  idTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  idChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  idChipText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  summaryCard: { borderRadius: 16, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 16, marginTop: 16 },
  summaryTitle: { fontSize: 11.5, fontFamily: "Poppins_700Bold", color: GOLD_DARK, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  termsRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 16, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  termsText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", color: INK, lineHeight: 18 },
  navButtons: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  prevBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1.5, borderColor: BORDER, backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14 },
  prevBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: INK },
  nextBtnShadow: { borderRadius: 14, shadowColor: GOLD, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  nextBtnText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },

  // Custom Modal Styles for Bottom Sheet picker
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,10,14,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "65%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: INK,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: INK,
  },

  // ── Image Action Bottom-Sheet ─────────────────────────────────────
  imageActionSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: "stretch",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(42,16,32,0.15)",
    alignSelf: "center",
    marginBottom: 18,
  },
  imageActionTitle: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: INK,
    textAlign: "center",
    marginBottom: 4,
  },
  imageActionSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: MUTED,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  imagePreviewWrapper: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    backgroundColor: DARK,
    borderWidth: 1,
    borderColor: BORDER,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageActionBtnsCol: {
    gap: 10,
  },
  imageActionBtnShadow: {
    borderRadius: 14,
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  imageActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
  },
  imageActionBtnGhost: {
    backgroundColor: BLUSH,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  imageActionBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});
