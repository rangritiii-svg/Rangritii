import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { getCurrentCoordinates } from "@/utils/permissions";
import { updateArtist } from "@/firebase/firestoreService";
import { clearAdminSession } from "@/utils/adminAuth";

/* RangRiti 2.0 palette */
const MAROON = "#4A1020";
const DARK = "#1A0A0E";
const GOLD = "#C9932F";
const GOLD_DARK = "#A87525";
const BLUSH = "#FDEDF3";
const CREAM = "#FFF8F0";
const CREAM_TEXT = "#FDF8F1";
const INK = "#2A1020";
const MUTED = "#8A6070";
const CARD_BORDER = "#F5D0DC";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { userProfile, setUserProfile, bookings, favorites, adminStats, language, setLanguage, adminPhone, adminEmail, artists } = useApp();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const isHindi = language === "hi_IN";

  // Artist: re-capture GPS coordinates and save them to the artist profile
  const handleUpdateMyLocation = async () => {
    if (updatingLocation) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}

    const currentArtist = artists.find(a => a.phone === userProfile.phone);
    if (!currentArtist) {
      Alert.alert(
        isHindi ? "प्रोफ़ाइल नहीं मिली" : "Profile Not Found",
        isHindi
          ? "आपकी आर्टिस्ट प्रोफ़ाइल नहीं मिली। कृपया पुनः लॉगिन करें।"
          : "We couldn't find your artist profile. Please log in again."
      );
      return;
    }

    setUpdatingLocation(true);
    // Asks for Location permission first, then reads GPS coordinates
    const coords = await getCurrentCoordinates(isHindi);
    if (!coords) { setUpdatingLocation(false); return; }

    try {
      await updateArtist(currentArtist.id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      // Keep the signed-in profile in sync too
      await setUserProfile({ latitude: coords.latitude, longitude: coords.longitude });
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
      Alert.alert(
        isHindi ? "स्थान अपडेट हो गया ✅" : "Location Updated ✅",
        isHindi
          ? `आपका नया स्थान सहेज दिया गया है (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})। अब आस-पास के ग्राहक आपको आसानी से ढूँढ पाएँगे।`
          : `Your new location has been saved (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}). Nearby customers can now find you more easily.`
      );
    } catch (e) {
      console.warn("Update location error:", e);
      Alert.alert(
        isHindi ? "त्रुटि" : "Error",
        isHindi ? "स्थान सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।" : "Could not save your location. Please try again."
      );
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleToggleLanguage = async () => {
    try { Haptics.selectionAsync().catch(() => {}); } catch (_e) {}
    const nextLang = language === "en_IN" ? "hi_IN" : "en_IN";
    await setLanguage(nextLang);
  };

  const completedCount = bookings.filter((b) => b.status === "Completed").length;
  const bookingsCount = bookings.length;
  const favoritesCount = favorites.length;

  const initials = (userProfile.name || "Customer")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ME";

  // Long-press on the avatar opens the server-verified admin login screen.
  // (The old client-side passcode was readable by anyone in Firestore — removed.)
  const handleAvatarLongPress = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); } catch (_e) {}
    router.push("/admin/login");
  };

  // Only the admin can leave their mode (back to the customer view).
  // Customer ↔ artist switching is intentionally BLOCKED: they are separate
  // accounts — the same person logs into each through its own login screen.
  const handleExitAdmin = () => {
    const performSwitch = async () => {
      await clearAdminSession();
      await setUserProfile({ role: "customer" });
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm("Exit the admin dashboard and return to customer view?");
      if (confirm) performSwitch();
    } else {
      Alert.alert(
        "Exit Admin Dashboard",
        "Return to the customer interface view?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: performSwitch },
        ]
      );
    }
  };

  const handleSignOut = async () => {
    const performSignOut = async () => {
      await clearAdminSession();
      await setUserProfile({ role: null });
      router.replace("/onboarding");
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm("Are you sure you want to sign out?");
      if (confirm) performSignOut();
    } else {
      Alert.alert("Sign Out", "Are you sure you want to log out of Rangritii?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: performSignOut },
      ]);
    }
  };

  const isCustomer = userProfile.role === "customer";
  const isAdmin = userProfile.role === "admin";

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, isWide && styles.wideConstraint]}
    >
      {/* Dark maroon gradient header — RangRiti 2.0 */}
      <LinearGradient
        colors={[DARK, MAROON]}
        style={[styles.header, { paddingTop: topPad + 24 }, isWide && styles.headerWide]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          onLongPress={handleAvatarLongPress}
          delayLongPress={1500}
          activeOpacity={0.9}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{isAdmin ? "Admin" : isCustomer ? "Customer" : "Artist"}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{isAdmin ? "Platform Admin" : userProfile.name}</Text>
        <Text style={styles.userLocation}>
          <Ionicons name="location-outline" size={13} color={GOLD} /> {userProfile.city || "Mumbai"}, India
        </Text>
      </LinearGradient>

      {/* Stats Board */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {isAdmin ? adminStats.totalBookings : bookingsCount}
          </Text>
          <Text style={styles.statLabel}>
            {isAdmin ? "Platform Bookings" : "Bookings"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {isAdmin ? `₹${adminStats.totalRevenue.toLocaleString("en-IN")}` : favoritesCount}
          </Text>
          <Text style={styles.statLabel}>
            {isAdmin ? "Revenue" : "Saved"}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {isAdmin ? `₹${adminStats.totalCommission.toLocaleString("en-IN")}` : completedCount}
          </Text>
          <Text style={styles.statLabel}>
            {isAdmin ? "Commission" : "Completed"}
          </Text>
        </View>
      </View>

      {/* Admin: exit card. Customer/Artist: separate-accounts info card
          (role switching is blocked — each role is its own account). */}
      <View style={styles.sectionContainer}>
        {isAdmin ? (
          <TouchableOpacity style={styles.switchCard} onPress={handleExitAdmin} activeOpacity={0.85}>
            <View style={styles.switchIconWrap}>
              <MaterialCommunityIcons name="swap-horizontal" size={22} color={GOLD_DARK} />
            </View>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Exit Admin Dashboard</Text>
              <Text style={styles.switchSubtitle}>Return to customer interface view</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.switchCard}
            onPress={() => {
              try { Haptics.selectionAsync().catch(() => {}); } catch (_e) {}
              router.push(isCustomer ? "/auth/artist-login" : "/auth/customer-login");
            }}
            activeOpacity={0.85}
          >
            <View style={styles.switchIconWrap}>
              <MaterialCommunityIcons name={isCustomer ? "palette-outline" : "account-outline"} size={22} color={GOLD_DARK} />
            </View>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>
                {isCustomer
                  ? (isHindi ? "क्या आप मेहंदी आर्टिस्ट भी हैं?" : "Are you also a mehndi artist?")
                  : (isHindi ? "ग्राहक के तौर पर बुक करना है?" : "Want to book as a customer?")}
              </Text>
              <Text style={styles.switchSubtitle}>
                {isCustomer
                  ? (isHindi ? "आर्टिस्ट अकाउंट अलग होता है — आर्टिस्ट लॉगिन से साइन इन करें" : "Artist accounts are separate — sign in via Artist Login")
                  : (isHindi ? "ग्राहक अकाउंट अलग होता है — ग्राहक लॉगिन से साइन इन करें" : "Customer accounts are separate — sign in via Customer Login")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Menu options based on role */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>ACCOUNT SETTINGS</Text>

        <View style={styles.menuList}>
          {isAdmin ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin")}>
                <MaterialCommunityIcons name="shield-crown" size={20} color={GOLD} />
                <Text style={[styles.menuText, { fontFamily: "Poppins_600SemiBold" }]}>Go to Admin Dashboard</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin")}>
                <Ionicons name="cash-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Commission Payments</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin")}>
                <Ionicons name="people-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Manage Registered Artists</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
            </>
          ) : isCustomer ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/bookings")}>
                <Ionicons name="calendar-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>My Bookings</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/favorites")}>
                <Ionicons name="heart-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Saved Artists</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="card-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Payment Methods</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
                  router.push("/artist/portfolio");
                }}
              >
                <Ionicons name="images-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>My Portfolio</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
                  router.push("/artist/earnings");
                }}
              >
                <Ionicons name="analytics-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Earnings Dashboard</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
                  router.push("/artist/rates");
                }}
              >
                <Ionicons name="list-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Service Rates</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
                  router.push("/artist/documents");
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Verification ID Card</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
                  router.push("/artist/bank");
                }}
              >
                <Ionicons name="card-outline" size={20} color={MUTED} />
                <Text style={styles.menuText}>Bank Account Settings</Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleUpdateMyLocation}
                disabled={updatingLocation}
              >
                <Ionicons name="location-outline" size={20} color={updatingLocation ? CARD_BORDER : MUTED} />
                <Text style={styles.menuText}>
                  {updatingLocation
                    ? (isHindi ? "स्थान प्राप्त हो रहा है…" : "Getting your location…")
                    : (isHindi ? "मेरा स्थान अपडेट करें (GPS)" : "Update My Location (GPS)")}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
              </TouchableOpacity>
            </>
          )}

          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowHelpModal(true)}>
            <Ionicons name="help-circle-outline" size={20} color={MUTED} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacyModal(true)}>
            <Ionicons name="shield-checkmark-outline" size={20} color={MUTED} />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={16} color={CARD_BORDER} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Log Out */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.85}>
          <Feather name="log-out" size={18} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Help & Support Modal */}
      <Modal visible={showHelpModal} animationType="slide" transparent={true} onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color={INK} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Contact Us</Text>
              <Text style={styles.modalBodyText}>📞 Call: {adminPhone}</Text>
              <Text style={styles.modalBodyText}>✉️ Email: {adminEmail}</Text>
              <Text style={styles.modalBodyText}>⏰ Hours: Mon-Sat, 9:00 AM - 7:00 PM</Text>

              <View style={{ height: 16 }} />
              <Text style={styles.modalSectionTitle}>Frequently Asked Questions</Text>

              <Text style={styles.faqQuestion}>Q: How do I book an artist?</Text>
              <Text style={styles.faqAnswer}>A: Browse artists on the Discover home screen, select your favorite artist, select a slot/package, and tap "Book Now".</Text>

              <Text style={styles.faqQuestion}>Q: What is the cancellation policy?</Text>
              <Text style={styles.faqAnswer}>A: You get a full refund if you cancel at least 24 hours before the session. Cancellations within 24 hours are subject to standard tiered fees.</Text>

              <Text style={styles.faqQuestion}>Q: How do I pay?</Text>
              <Text style={styles.faqAnswer}>A: Payments are processed securely via Online UPI QR code or checkout links generated by the admin.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy & Security Modal */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent={true} onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy & Security</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={24} color={INK} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Data Protection Guidelines</Text>
              <Text style={styles.modalBodyText}>• We secure your profile information, phone numbers, and bookings under strict encryption policies.</Text>
              <Text style={styles.modalBodyText}>• Customer exact location details are never shared with anyone. Artists only see your general city and area.</Text>
              <Text style={styles.modalBodyText}>• Payment security is managed directly through banking grade UPI transfer gateways.</Text>

              <View style={{ height: 16 }} />
              <Text style={styles.modalSectionTitle}>Account Security & Controls</Text>
              <Text style={styles.modalBodyText}>• Admin access is protected by server-verified credentials and an authorized Google account allowlist — configured privately by the platform owner.</Text>
              <Text style={styles.modalBodyText}>• You have the right to request account data deletion or export by contacting our support desk.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  wideConstraint: {
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerWide: {
    borderRadius: 28,
    marginTop: 16,
    marginHorizontal: 4,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: CREAM,
    borderWidth: 2,
    borderColor: "rgba(201,147,47,0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: MAROON,
  },
  roleBadge: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    backgroundColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: CREAM,
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: CREAM_TEXT,
    fontFamily: "Poppins_700Bold",
  },
  userLocation: {
    fontSize: 13,
    color: "rgba(253,248,241,0.8)",
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingVertical: 16,
    marginTop: -20,
    shadowColor: MAROON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: INK,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: MUTED,
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: "60%",
    alignSelf: "center",
    backgroundColor: CARD_BORDER,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    gap: 12,
  },
  switchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(201,147,47,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: INK,
  },
  switchSubtitle: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: MUTED,
    marginTop: 2,
    lineHeight: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: GOLD_DARK,
    marginBottom: 8,
    paddingLeft: 4,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  menuList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: INK,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: BLUSH,
  },
  signOutContainer: {
    marginHorizontal: 20,
    marginTop: 32,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    gap: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: "#DC2626",
  },
  bottomModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,10,14,0.5)",
    justifyContent: "flex-end",
  },
  bottomModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    height: "60%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: CARD_BORDER,
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: INK,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: GOLD_DARK,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 12,
  },
  modalBodyText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: INK,
    lineHeight: 18,
    marginBottom: 6,
  },
  faqQuestion: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: INK,
    marginTop: 10,
  },
  faqAnswer: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: MUTED,
    lineHeight: 16,
    marginBottom: 10,
  },
});
