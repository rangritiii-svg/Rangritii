import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, setUserProfile, bookings, favorites, adminStats, language, setLanguage, adminPasscode } = useApp();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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

  const handleAvatarLongPress = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); } catch (_e) {}
    setShowPinModal(true);
  };

  const handlePinChange = async (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setPinCode(cleanText);
    setPinError("");

    if (cleanText.length === 6) {
      if (cleanText === adminPasscode) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
        setShowPinModal(false);
        setPinCode("");
        await setUserProfile({ role: "admin" });
        Alert.alert("Access Granted", "Logged in as Platform Administrator.");
      } else {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); } catch (_e) {}
        setPinError("Incorrect PIN code");
        setTimeout(() => {
          setPinCode("");
          setPinError("");
        }, 1200);
      }
    }
  };

  const handleSwitchRole = () => {
    const isAdminMode = userProfile.role === "admin";
    const nextRole = isAdminMode ? "customer" : (userProfile.role === "customer" ? "artist" : "customer");
    const roleLabel = nextRole === "artist" ? "Mehndi Artist" : "Customer";

    const performSwitch = async () => {
      await setUserProfile({ role: nextRole });
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm(`Are you sure you want to switch to ${roleLabel} mode?`);
      if (confirm) performSwitch();
    } else {
      Alert.alert(
        "Switch Profile Mode",
        `Do you want to switch to ${roleLabel} mode?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Switch", onPress: performSwitch },
        ]
      );
    }
  };

  const handleSignOut = async () => {
    const performSignOut = async () => {
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Pink Gradient Header */}
      <LinearGradient colors={["#F9AABF", "#E8849E"]} style={[styles.header, { paddingTop: topPad + 24 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onLongPress={handleAvatarLongPress}
          delayLongPress={1500}
          activeOpacity={0.9}
        >
          <View style={[styles.avatar, { backgroundColor: colors.card }]}>
            <Text style={[styles.avatarText, { color: colors.secondaryForeground }]}>{initials}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: colors.gold }]}>
            <Text style={styles.roleBadgeText}>{isAdmin ? "Admin" : isCustomer ? "Customer" : "Artist"}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{isAdmin ? "Platform Admin" : userProfile.name}</Text>
        <Text style={styles.userLocation}>
          <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" /> {userProfile.city || "Mumbai"}, India
        </Text>
      </LinearGradient>

      {/* Stats Board */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.secondaryForeground }]}>
            {isAdmin ? adminStats.totalBookings : bookingsCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {isAdmin ? "Platform Bookings" : "Bookings"}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.secondaryForeground }]}>
            {isAdmin ? `₹${adminStats.totalRevenue.toLocaleString("en-IN")}` : favoritesCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {isAdmin ? "Revenue" : "Saved"}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: colors.secondaryForeground }]}>
            {isAdmin ? `₹${adminStats.totalCommission.toLocaleString("en-IN")}` : completedCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {isAdmin ? "Commission" : "Completed"}
          </Text>
        </View>
      </View>

      {/* Switch Role Card */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity style={[styles.switchCard, { backgroundColor: colors.secondary, borderColor: colors.border }]} onPress={handleSwitchRole} activeOpacity={0.85}>
          <MaterialCommunityIcons name="swap-horizontal" size={24} color={colors.secondaryForeground} />
          <View style={styles.switchTextContainer}>
            <Text style={[styles.switchTitle, { color: colors.secondaryForeground }]}>
              {isAdmin ? "Exit Admin Dashboard" : `Switch to ${isCustomer ? "Artist Dashboard" : "Customer Mode"}`}
            </Text>
            <Text style={[styles.switchSubtitle, { color: colors.mutedForeground }]}>
              {isAdmin ? "Return to customer interface view" : isCustomer ? "Offer your Mehndi services & accept bookings" : "Browse artists and book services for celebrations"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.secondaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Profile Menu options based on role */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionHeading, { color: colors.mutedForeground }]}>ACCOUNT SETTINGS</Text>

        <View style={[styles.menuList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isAdmin ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin")}>
                <MaterialCommunityIcons name="shield-crown" size={20} color={colors.gold} />
                <Text style={[styles.menuText, { color: colors.text, fontFamily: "Poppins_600SemiBold" }]}>Go to Admin Dashboard</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin")}>
                <Ionicons name="cash-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>Commission Payments</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/admin")}>
                <Ionicons name="people-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>Manage Registered Artists</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            </>
          ) : isCustomer ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/bookings")}>
                <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>My Bookings</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/favorites")}>
                <Ionicons name="heart-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>Saved Artists</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="card-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>Payment Methods</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="images-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>My Portfolio</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
                  router.push("/artist/earnings");
                }}
              >
                <Ionicons name="analytics-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>Earnings Dashboard</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="list-outline" size={20} color={colors.mutedForeground} />
                <Text style={[styles.menuText, { color: colors.text }]}>Service Rates</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            </>
          )}

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.menuItem} onPress={handleToggleLanguage}>
            <Ionicons name="language-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.menuText, { color: colors.text, flex: 1 }]}>
              {language === "en_IN" ? "Language Settings" : "भाषा सेटिंग्स"}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: colors.gold, marginRight: 6 }}>
              {language === "en_IN" ? "हिंदी" : "English"}
            </Text>
            <Ionicons name="swap-horizontal" size={14} color={colors.gold} />
          </TouchableOpacity>
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowHelpModal(true)}>
            <Ionicons name="help-circle-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.menuText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacyModal(true)}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.menuText, { color: colors.text }]}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Log Out */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={[styles.signOutButton, { borderColor: colors.border }]} onPress={handleSignOut} activeOpacity={0.85}>
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* PIN Verification Modal */}
      <Modal
        visible={showPinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPinModal(false);
          setPinCode("");
          setPinError("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="shield-crown" size={38} color={colors.gold} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Admin Passcode</Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                Enter the 6-digit administration code to unlock the admin dashboard.
              </Text>
            </View>

            <View style={styles.pinContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const digit = pinCode[index];
                const hasValue = digit !== undefined;
                return (
                  <View
                    key={index}
                    style={[
                      styles.pinDot,
                      {
                        borderColor: pinError ? colors.destructive : hasValue ? colors.gold : colors.border,
                        backgroundColor: pinError ? colors.destructive + "15" : hasValue ? colors.gold + "15" : "transparent"
                      }
                    ]}
                  >
                    {hasValue && (
                      <View style={[styles.pinDotInner, { backgroundColor: pinError ? colors.destructive : colors.gold }]} />
                    )}
                  </View>
                );
              })}
            </View>

            {pinError ? (
              <Text style={[styles.pinErrorText, { color: colors.destructive }]}>{pinError}</Text>
            ) : null}

            {/* Hidden overlay TextInput */}
            <TextInput
              style={styles.hiddenInput}
              keyboardType="number-pad"
              maxLength={6}
              value={pinCode}
              onChangeText={handlePinChange}
              autoFocus={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setShowPinModal(false);
                  setPinCode("");
                  setPinError("");
                }}
              >
                <Text style={{ color: colors.mutedForeground, fontFamily: "Poppins_600SemiBold", fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal visible={showHelpModal} animationType="slide" transparent={true} onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.bottomModalOverlay}>
          <View style={[styles.bottomModalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSectionTitle, { color: colors.primary }]}>Contact Us</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>📞 Call: +91 99999 88888</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>✉️ Email: support@rangritii.com</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>⏰ Hours: Mon-Sat, 9:00 AM - 7:00 PM</Text>
              
              <View style={{ height: 16 }} />
              <Text style={[styles.modalSectionTitle, { color: colors.primary }]}>Frequently Asked Questions</Text>
              
              <Text style={[styles.faqQuestion, { color: colors.text }]}>Q: How do I book an artist?</Text>
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>A: Browse artists on the Discover home screen, select your favorite artist, select a slot/package, and tap "Book Now".</Text>
              
              <Text style={[styles.faqQuestion, { color: colors.text }]}>Q: What is the cancellation policy?</Text>
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>A: You get a full refund if you cancel at least 24 hours before the session. Cancellations within 24 hours are subject to standard tiered fees.</Text>

              <Text style={[styles.faqQuestion, { color: colors.text }]}>Q: How do I pay?</Text>
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>A: Payments are processed securely via Online UPI QR code or checkout links generated by the admin.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy & Security Modal */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent={true} onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.bottomModalOverlay}>
          <View style={[styles.bottomModalContent, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy & Security</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSectionTitle, { color: colors.primary }]}>Data Protection Guidelines</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>• We secure your profile information, phone numbers, and bookings under strict encryption policies.</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>• Customer exact location details are never shared with anyone. Artists only see your general city and area.</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>• Payment security is managed directly through banking grade UPI transfer gateways.</Text>
              
              <View style={{ height: 16 }} />
              <Text style={[styles.modalSectionTitle, { color: colors.primary }]}>Account Security & Controls</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>• Admin access is protected by a custom security passcode, which can be modified directly from the admin panel dashboard.</Text>
              <Text style={[styles.modalBodyText, { color: colors.text }]}>• You have the right to request account data deletion or export by contacting our support desk.</Text>
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
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  roleBadge: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
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
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },
  userLocation: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: "60%",
    alignSelf: "center",
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  switchSubtitle: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
    lineHeight: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    paddingLeft: 4,
    letterSpacing: 0.5,
  },
  menuList: {
    borderRadius: 16,
    borderWidth: 1,
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
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  signOutContainer: {
    marginHorizontal: 20,
    marginTop: 32,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
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
  bottomModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  bottomModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    height: "60%",
  },
  modalSectionTitle: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    marginTop: 12,
  },
  modalBodyText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
    marginBottom: 6,
  },
  faqQuestion: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 10,
  },
  faqAnswer: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    lineHeight: 16,
    marginBottom: 10,
  },
});
