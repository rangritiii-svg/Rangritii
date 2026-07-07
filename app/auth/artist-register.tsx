import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Modal, FlatList
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const INDIAN_STATES_CITIES: Record<string, string[]> = {
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
  "Delhi": ["Delhi", "New Delhi", "Noida", "Gurugram"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"]
};

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
  const { setUserProfile, registerNewArtist, language } = useApp();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);



  // Dropdown Modal states
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Step 1 — Personal Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  // Step 2 — Location
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [travelRadius, setTravelRadius] = useState("");

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow library access to upload photos.");
      return;
    }
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <LinearGradient colors={["#C9932F", "#8B6914"]} style={[styles.header, { paddingTop: Math.max(insets.top + 8, 36) }]}>
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
                  : <Ionicons name={s.icon as any} size={14} color={s.id === step ? "#C9932F" : "rgba(255,255,255,0.4)"} />
                }
              </View>
              <Text style={[styles.stepLabel, { color: s.id === step ? "#fff" : "rgba(255,255,255,0.5)" }]}>{s.title}</Text>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">

        {/* ─── STEP 1: Personal Info ─── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.text }]}>👤 Personal Information</Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>Tell us about yourself</Text>

            <Field label="Full Name *" colors={colors}>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. Priya Sharma" placeholderTextColor={colors.mutedForeground} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
            </Field>

            <Field label="Mobile Number *" colors={colors}>
              <Text style={[styles.countryCode, { color: colors.text }]}>🇮🇳 +91</Text>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="10-digit number" placeholderTextColor={colors.mutedForeground} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
            </Field>

            <Field label="Email Address *" colors={colors}>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="yourname@domain.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </Field>

            <Field label="Years of Experience *" colors={colors}>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. 5" placeholderTextColor={colors.mutedForeground} value={experience} onChangeText={setExperience} keyboardType="number-pad" maxLength={2} />
            </Field>

            <Text style={[styles.label, { color: colors.text }]}>About You / Bio</Text>
            <View style={[styles.textAreaWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder="Describe your style, specialties and experience... (customers will see this)"
                placeholderTextColor={colors.mutedForeground}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{bio.length}/300</Text>
            </View>

          </View>
        )}

        {/* ─── STEP 2: Location ─── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.text }]}>📍 Location Details</Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>Where do you provide your services?</Text>

            <Field label="State *" colors={colors}>
              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center" }} onPress={() => setStateModalVisible(true)}>
                <Ionicons name="map-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: state ? colors.text : colors.mutedForeground }}>
                  {state || "Select State"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
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
                <Ionicons name="business-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular", color: city ? colors.text : colors.mutedForeground }}>
                  {city || "Select City"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </Field>

            <Field label="Area / Locality *" colors={colors}>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. Andheri West, Bandra" placeholderTextColor={colors.mutedForeground} value={area} onChangeText={setArea} autoCapitalize="words" />
            </Field>

            <Field label="Pincode" colors={colors}>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="6-digit pincode" placeholderTextColor={colors.mutedForeground} value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
            </Field>

            <Field label="Travel Radius (km)" colors={colors}>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Max distance you'll travel (e.g. 15)" placeholderTextColor={colors.mutedForeground} value={travelRadius} onChangeText={setTravelRadius} keyboardType="number-pad" maxLength={3} />
            </Field>

            <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.gold} />
              <Text style={[styles.infoBoxText, { color: colors.text }]}>
                Your exact address is kept private. Customers only see your city and area.
              </Text>
            </View>
          </View>
        )}

        {/* ─── STEP 3: Services & Pricing ─── */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.text }]}>✋ Services & Pricing</Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>What styles do you offer and your rates?</Text>

            <Text style={[styles.label, { color: colors.text }]}>Types of Mehndi You Offer * <Text style={{ color: colors.mutedForeground, fontFamily: "Poppins_400Regular" }}>(select all that apply)</Text></Text>
            <View style={styles.stylesGrid}>
              {MEHNDI_TYPES.map(style => {
                const active = selectedStyles.includes(style);
                return (
                  <TouchableOpacity
                    key={style}
                    onPress={() => toggleStyle(style)}
                    style={[styles.styleChip, active ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.styleChipText, { color: active ? colors.primaryForeground : colors.text }]}>{style}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.pricingCardTitle, { color: colors.text }]}>💰 Your Charges</Text>

              <Text style={[styles.label, { color: colors.text }]}>Hourly Rate (₹) *</Text>
              <Field label="" colors={colors}>
                <Text style={[styles.rupee, { color: colors.text }]}>₹</Text>
                <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. 500" placeholderTextColor={colors.mutedForeground} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="number-pad" />
                <Text style={[styles.perHr, { color: colors.mutedForeground }]}>/ hour</Text>
              </Field>

              <Text style={[styles.label, { color: colors.text }]}>Minimum Charge (₹)</Text>
              <Field label="" colors={colors}>
                <Text style={[styles.rupee, { color: colors.text }]}>₹</Text>
                <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. 1500" placeholderTextColor={colors.mutedForeground} value={minCharge} onChangeText={setMinCharge} keyboardType="number-pad" />
              </Field>

              <Text style={[styles.label, { color: colors.text }]}>Full Bridal Package (₹)</Text>
              <Field label="" colors={colors}>
                <Text style={[styles.rupee, { color: colors.text }]}>₹</Text>
                <TextInput style={[styles.input, { color: colors.text }]} placeholder="e.g. 12000" placeholderTextColor={colors.mutedForeground} value={bridalRate} onChangeText={setBridalRate} keyboardType="number-pad" />
              </Field>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Service Mode</Text>
            <View style={styles.serviceToggleRow}>
              <TouchableOpacity
                style={[styles.serviceToggle, homeVisit ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setHomeVisit(!homeVisit)}
              >
                <Ionicons name="home-outline" size={16} color={homeVisit ? colors.primaryForeground : colors.text} />
                <Text style={[styles.serviceToggleText, { color: homeVisit ? colors.primaryForeground : colors.text }]}>Home Visit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.serviceToggle, studioVisit ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setStudioVisit(!studioVisit)}
              >
                <Ionicons name="storefront-outline" size={16} color={studioVisit ? colors.primaryForeground : colors.text} />
                <Text style={[styles.serviceToggleText, { color: studioVisit ? colors.primaryForeground : colors.text }]}>Studio / Parlour</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── STEP 4: Work Photos ─── */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.text }]}>📸 Previous Work Photos</Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>Showcase your best Mehndi designs to attract customers</Text>

            <TouchableOpacity
              style={[styles.uploadHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => handlePickPortfolioPhoto()}
            >
              <Ionicons name="cloud-upload-outline" size={32} color={colors.gold} />
              <Text style={[styles.uploadHintTitle, { color: colors.text }]}>Upload Portfolio Photos</Text>
              <Text style={[styles.uploadHintDesc, { color: colors.mutedForeground }]}>
                Tap here to open your phone gallery and select work photos.
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Uploaded Work Photos ({regPortfolioImages.length})</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {regPortfolioImages.map((img, idx) => (
                <View key={idx} style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", position: "relative" }}>
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  {/* Tap photo to replace it */}
                  <TouchableOpacity
                    style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "transparent" }}
                    onPress={() => handlePickPortfolioPhoto(idx)}
                  />
                  {/* Edit badge */}
                  <View style={{ position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 }}>
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
                style={{ width: 100, height: 100, borderRadius: 8, borderStyle: "dashed", borderWidth: 1.5, borderColor: colors.border, justifyContent: "center", alignItems: "center", backgroundColor: colors.card }}
                onPress={() => handlePickPortfolioPhoto()}
              >
                <Ionicons name="add" size={24} color={colors.gold} />
                <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: colors.gold, marginTop: 2 }}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.border, marginTop: 20 }]}>
              <Ionicons name="bulb-outline" size={18} color={colors.gold} />
              <Text style={[styles.infoBoxText, { color: colors.text }]}>
                Tip: Artists with 5+ portfolio photos get 3× more bookings. Tap any photo to replace it.
              </Text>
            </View>
          </View>
        )}

        {/* ─── STEP 5: Verification ─── */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepHeading, { color: colors.text }]}>🛡️ Identity Verification</Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>Required to build trust with customers and receive payments</Text>

            <Text style={[styles.label, { color: colors.text }]}>Government ID Type *</Text>
            <View style={styles.idTypeGrid}>
              {ID_TYPES.map(id => (
                <TouchableOpacity
                  key={id}
                  onPress={() => setIdType(id)}
                  style={[styles.idChip, idType === id ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.idChipText, { color: idType === id ? colors.primaryForeground : colors.text }]}>{id}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field label="ID Number *" colors={colors}>
              <TextInput style={[styles.input, { color: colors.text }]} placeholder={idType || "Enter your ID number"} placeholderTextColor={colors.mutedForeground} value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" />
            </Field>

            {/* Government ID Photo selection */}
            {regIdCardImage ? (
              <View style={{ alignItems: "center", marginVertical: 12 }}>
                <Image source={{ uri: regIdCardImage }} style={{ width: "100%", height: 180, borderRadius: 12 }} resizeMode="cover" />
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
                style={[styles.uploadHint, { backgroundColor: colors.secondary, borderColor: colors.border, paddingVertical: 14, marginVertical: 8 }]}
                onPress={handlePickIdCardPhoto}
              >
                <FontAwesome5 name="id-card" size={24} color={colors.gold} />
                <Text style={[styles.uploadHintTitle, { color: colors.text, fontSize: 14, marginTop: 4 }]}>Upload ID Document Photo</Text>
                <Text style={{ fontSize: 10, color: colors.mutedForeground, textAlign: "center", marginTop: 2 }}>Tap to open phone library storage</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
              <Text style={[styles.pricingCardTitle, { color: colors.text }]}>💸 UPI Payment Details</Text>
              <Text style={[styles.bankNote, { color: colors.mutedForeground }]}>Required to receive booking payments directly to your UPI account.</Text>

              {/* UPI ID input */}
              <Field label="Your UPI ID *" colors={colors}>
                <Ionicons name="at-outline" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. yourname@upi or 9876543210@paytm"
                  placeholderTextColor={colors.mutedForeground}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </Field>

              {/* UPI QR Code upload */}
              <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>UPI QR Code Photo (Optional)</Text>
              <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: colors.mutedForeground, marginBottom: 8 }}>
                Upload a screenshot of your UPI QR so customers can pay you directly.
              </Text>
              {regUpiQrImage ? (
                <View style={{ alignItems: "center", marginVertical: 8 }}>
                  <View style={{ width: 180, height: 180, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
                    <Image source={{ uri: regUpiQrImage }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                  </View>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.secondary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
                      onPress={handlePickUpiQrPhoto}
                    >
                      <Ionicons name="refresh-outline" size={14} color={colors.gold} />
                      <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: colors.gold }}>Replace QR</Text>
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
                  style={{ borderStyle: "dashed", borderWidth: 1.5, borderColor: colors.border, padding: 20, borderRadius: 16, alignItems: "center", backgroundColor: colors.secondary, marginTop: 4, gap: 6 }}
                  onPress={handlePickUpiQrPhoto}
                >
                  <MaterialCommunityIcons name="qrcode-scan" size={32} color={colors.gold} />
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: colors.text }}>Upload UPI QR Code</Text>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, textAlign: "center" }}>Tap to select a QR code screenshot from your gallery</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>📋 Registration Summary</Text>
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
              <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: agreed ? colors.primary : colors.card }]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={[styles.termsText, { color: colors.text }]}>
                I agree to Rangritii's{" "}
                <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>Terms of Service</Text>,{" "}
                <Text style={{ color: colors.primary, fontFamily: "Poppins_600SemiBold" }}>Privacy Policy</Text>, and confirm all information provided is accurate.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {step > 1 && (
            <TouchableOpacity style={[styles.prevBtn, { borderColor: colors.border }]} onPress={() => setStep(step - 1)}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
              <Text style={[styles.prevBtnText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.gold, flex: step > 1 ? 2 : 1 }]}
            onPress={handleNext}
            disabled={loading}
            activeOpacity={0.85}
          >
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
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* State Selector Modal */}
      <Modal visible={stateModalVisible} animationType="slide" transparent={true} onRequestClose={() => setStateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={Object.keys(INDIAN_STATES_CITIES)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setState(item);
                    setCity("");
                    setStateModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }, state === item && { color: colors.primary, fontFamily: "Poppins_600SemiBold" }]}>{item}</Text>
                  {state === item && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* City Selector Modal */}
      <Modal visible={cityModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCityModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select City</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={state ? INDIAN_STATES_CITIES[state] : []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setCity(item);
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }, city === item && { color: colors.primary, fontFamily: "Poppins_600SemiBold" }]}>{item}</Text>
                  {city === item && <Ionicons name="checkmark" size={18} color={colors.primary} />}
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
          <View style={[styles.imageActionSheet, { backgroundColor: colors.card }]}>
            {/* Handle pill */}
            <View style={styles.sheetHandle} />

            <Text style={[styles.imageActionTitle, { color: colors.text }]}>
              {pendingField === "portfolio" ? "📷 Portfolio Photo" :
               pendingField === "idCard"   ? "🪪 ID Document Photo" :
                                             "📱 UPI QR Code Photo"}
            </Text>
            <Text style={[styles.imageActionSubtitle, { color: colors.mutedForeground }]}>
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
                style={[styles.imageActionBtn, { backgroundColor: colors.gold }]}
                onPress={commitPendingImage}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={[styles.imageActionBtnText, { color: "#fff" }]}>Save Photo</Text>
              </TouchableOpacity>

              {/* Crop */}
              <TouchableOpacity
                style={[styles.imageActionBtn, { backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.border }]}
                onPress={reopenWithCrop}
                activeOpacity={0.85}
              >
                <Ionicons name="crop-outline" size={20} color={colors.text} />
                <Text style={[styles.imageActionBtnText, { color: colors.text }]}>Crop / Adjust</Text>
              </TouchableOpacity>

              {/* Select another */}
              <TouchableOpacity
                style={[styles.imageActionBtn, { backgroundColor: colors.secondary, borderWidth: 1.5, borderColor: colors.border }]}
                onPress={() => {
                  setImageActionVisible(false);
                  setPendingImageUri("");
                  setTimeout(() => launchImagePicker(pendingField, pendingPortfolioIdx ?? undefined), 300);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="images-outline" size={20} color={colors.text} />
                <Text style={[styles.imageActionBtnText, { color: colors.text }]}>Select Another Photo</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                style={{ marginTop: 4, alignItems: "center", paddingVertical: 10 }}
                onPress={() => { setImageActionVisible(false); setPendingImageUri(""); }}
              >
                <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: colors.mutedForeground }}>Cancel</Text>
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
      <View style={[fieldStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    );
  }
  return (
    <>
      <Text style={[fieldStyles.label, { color: colors.text }]}>{label}</Text>
      <View style={[fieldStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </>
  );
}

function SummaryRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={[summaryStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[summaryStyles.value, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 6, marginTop: 14 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 2 },
});

const summaryStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, gap: 10 },
  label: { fontSize: 12, fontFamily: "Poppins_400Regular", flex: 1 },
  value: { fontSize: 12, fontFamily: "Poppins_600SemiBold", flex: 2, textAlign: "right" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 16, paddingHorizontal: 20 },
  headerTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#fff", fontFamily: "Poppins_700Bold" },
  stepBadge: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Poppins_600SemiBold", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  progressBarBg: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, marginBottom: 14 },
  progressBarFill: { height: 4, backgroundColor: "#fff", borderRadius: 2 },
  stepsRow: { gap: 12, paddingBottom: 4 },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: "#fff" },
  stepCircleInactive: { backgroundColor: "rgba(255,255,255,0.15)" },
  stepLabel: { fontSize: 9, fontFamily: "Poppins_500Medium" },
  formScroll: { paddingBottom: 40 },
  stepContent: { paddingHorizontal: 20, paddingTop: 20 },
  stepHeading: { fontSize: 20, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  stepDesc: { fontSize: 13, fontFamily: "Poppins_400Regular", marginBottom: 20 },
  label: { fontSize: 13, fontFamily: "Poppins_600SemiBold", marginBottom: 6, marginTop: 14 },
  input: { flex: 1, fontSize: 14, fontFamily: "Poppins_400Regular" },
  countryCode: { fontSize: 14, fontFamily: "Poppins_500Medium" },
  rupee: { fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  perHr: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  textAreaWrapper: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 2 },
  textArea: { fontSize: 13, fontFamily: "Poppins_400Regular", minHeight: 90, lineHeight: 20 },
  charCount: { alignSelf: "flex-end", fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 4 },
  infoBox: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 14, alignItems: "flex-start" },
  infoBoxText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },
  stylesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  styleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  styleChipText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  pricingCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  pricingCardTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  bankNote: { fontSize: 11, fontFamily: "Poppins_400Regular", marginBottom: 8 },
  serviceToggleRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  serviceToggle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12 },
  serviceToggleText: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  uploadHint: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8, marginBottom: 16 },
  uploadHintTitle: { fontSize: 15, fontFamily: "Poppins_700Bold" },
  uploadHintDesc: { fontSize: 12, fontFamily: "Poppins_400Regular", textAlign: "center", lineHeight: 18 },
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
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  summaryTitle: { fontSize: 14, fontFamily: "Poppins_700Bold", marginBottom: 12 },
  termsRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 16, marginBottom: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  termsText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },
  navButtons: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  prevBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14 },
  prevBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  nextBtnText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },

  // Custom Modal Styles for Bottom Sheet picker
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
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
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },

  // ── Image Action Bottom-Sheet ─────────────────────────────────────
  imageActionSheet: {
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
    backgroundColor: "rgba(0,0,0,0.15)",
    alignSelf: "center",
    marginBottom: 18,
  },
  imageActionTitle: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  imageActionSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
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
    backgroundColor: "#000",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageActionBtnsCol: {
    gap: 10,
  },
  imageActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
  },
  imageActionBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});
