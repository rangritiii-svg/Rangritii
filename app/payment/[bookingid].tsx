import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Image, Clipboard, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { getTranslation } from "@/constants/locale";

/* RangRiti 2.0 design language */
const MAROON = "#4A1020";
const DARK = "#1A0A0E";
const GOLD = "#C9932F";
const GOLD_DARK = "#A87525";
const BLUSH = "#FDEDF3";
const CREAM = "#FFF8F0";
const INK = "#2A1020";
const MUTED = "#8A6070";
const BORDER = "#F5D0DC";
const MAROON_TEXT = "#7A3050";
const CREAM_ON_DARK = "#FDF8F1";

const GOLD_GRAD = [GOLD, GOLD_DARK] as [string, string];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { bookingid } = useLocalSearchParams<{ bookingid: string }>();
  const { getBookingById, updateBookingStatus, updatePaymentStatus, getArtistById, language, adminUpiId, adminQrCodeUrl } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<"online" | "cash" | null>("online");
  const [paid, setPaid] = useState(false);
  const isHindi = language === "hi_IN";

  const booking = getBookingById(bookingid ?? "");
  const artist = booking ? getArtistById(booking.artistId) : undefined;

  if (!booking) return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ color: INK }}>Booking not found</Text>
    </View>
  );

  const serviceAmount = booking.price; // service amount
  const platformFee = booking.commissionAmount; // platform commission fee
  const totalPayable = serviceAmount + platformFee; // total payable amount
  const commPercent = booking.commissionPercentApplied;

  // Resolve link: either custom admin link or fallback default UPI link
  const payUrl = booking.paymentLink || `upi://pay?pa=${adminUpiId}&pn=Rangritii&am=${totalPayable}&cu=INR&tn=Booking_${booking.id.slice(0, 8)}`;

  // Dynamic QR Code API URL or Custom QR Code URL uploaded by admin
  const qrCodeUrl = adminQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payUrl)}`;

  const handleOnlinePay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const isHttp = payUrl.startsWith("http");
      if (isHttp) {
        await Linking.openURL(payUrl);
        Alert.alert(
          isHindi ? "भुगतान लिंक खोला गया" : "Payment Link Opened",
          isHindi ? "हमने एडमिन का कस्टम भुगतान चेकआउट लिंक खोल दिया है। क्या आपने भुगतान पूरा किया?" : "We opened the admin's custom payment checkout link. Did you complete the transaction?",
          [
            { text: isHindi ? "हाँ, पुष्टि करें" : "Yes, Mark Confirmed", onPress: handleConfirmPaid },
            { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
          ]
        );
      } else {
        const supported = await Linking.canOpenURL(payUrl);
        if (supported) {
          await Linking.openURL(payUrl);
        } else {
          Alert.alert(
            isHindi ? "UPI के माध्यम से भुगतान करें" : "Pay via UPI",
            isHindi
              ? `UPI आईडी पर ₹${totalPayable.toLocaleString("en-IN")} ट्रांसफर करें:\n\nUPI आईडी: ${adminUpiId}\nनाम: Rangritii Admin\n\nविवरण (Ref): ${booking.id.slice(0, 8)}`
              : `Transfer ₹${totalPayable.toLocaleString("en-IN")} to:\n\nUPI ID: ${adminUpiId}\nName: Rangritii Admin\n\nUse Ref: ${booking.id.slice(0, 8)}`,
            [
              { text: isHindi ? "भुगतान की पुष्टि करें" : "Mark as Paid", onPress: handleConfirmPaid },
              { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
            ]
          );
        }
      }
    } catch {
      Alert.alert(
        isHindi ? "लिंक खोलने में त्रुटि" : "Error Opening Link",
        isHindi ? `कृपया ₹${totalPayable} का भुगतान इस UPI ID पर करें: ${adminUpiId}` : `Please complete payment of ₹${totalPayable} to:\nUPI ID: ${adminUpiId}`
      );
    }
  };

  const copyUpiId = () => {
    Clipboard.setString(adminUpiId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(isHindi ? "कॉपी किया गया!" : "Copied!", isHindi ? "UPI आईडी क्लिपबोर्ड पर कॉपी हो गई है।" : "UPI ID has been copied to your clipboard.");
  };

  const handleConfirmPaid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    updatePaymentStatus(booking.id, "pending_admin_approval");
    updateBookingStatus(booking.id, "Pending", "online");
    setPaid(true);
  };

  const handleCashSelection = () => {
    Alert.alert(
      isHindi ? "नकद भुगतान" : "Cash Payment",
      isHindi
        ? `आपने सत्र के दिन सीधे ${booking.artistName} को ₹${serviceAmount.toLocaleString("en-IN")} नकद भुगतान करने का विकल्प चुना है।\n\nरंगरीति द्वारा प्लेटफ़ॉर्म कमीशन ₹${platformFee.toLocaleString("en-IN")} अलग से एकत्र किया जाएगा।`
        : `You've selected to pay ₹${serviceAmount.toLocaleString("en-IN")} in cash directly to ${booking.artistName} on the day of your session.\n\nThe platform commission of ₹${platformFee.toLocaleString("en-IN")} will be collected by Rangritii separately.`,
      [
        { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
        {
          text: isHindi ? "नकद की पुष्टि करें" : "Confirm Cash",
          onPress: () => {
            updateBookingStatus(booking.id, "Confirmed", "cash");
            updatePaymentStatus(booking.id, "unpaid");
            setSelectedMethod("cash");
            setPaid(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  if (paid) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#D1FAE5", "#A7F3D0"]} style={[styles.successScreen, { paddingTop: insets.top + 40 }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color="#059669" />
          </View>
          <Text style={styles.successTitle}>
            {isHindi ? "भुगतान सबमिट किया गया! ⏳" : "Payment Submitted! ⏳"}
          </Text>
          <Text style={styles.successSubtitle}>
            {isHindi
              ? `भुगतान का विवरण सत्यापन के लिए एडमिन के पास भेज दिया गया है। एडमिन द्वारा पुष्टि होने पर बुकिंग सक्रिय हो जाएगी।`
              : `Your payment of ₹${totalPayable.toLocaleString("en-IN")} is pending admin verification. Once verified, your booking will be confirmed.`}
          </Text>
          <View style={styles.successDetails}>
            <SuccessRow label={isHindi ? "आर्टिस्ट" : "Artist"} value={booking.artistName} />
            <SuccessRow label={isHindi ? "तिथि" : "Date"} value={booking.date} />
            <SuccessRow label={isHindi ? "सत्र समय" : "Session"} value={`${booking.startTime} – ${booking.endTime}`} />
            <SuccessRow label={isHindi ? "भुगतान राशि" : "Amount Paid"} value={`₹${selectedMethod === "cash" ? 0 : totalPayable.toLocaleString("en-IN")}`} />
            {selectedMethod === "cash" && <SuccessRow label={isHindi ? "आर्टिस्ट को नकद" : "Cash to Artist"} value={`₹${serviceAmount.toLocaleString("en-IN")}`} />}
          </View>
          <TouchableOpacity style={styles.successBtn} onPress={() => { if (router.canDismiss()) router.dismiss(); router.push("/(tabs)/bookings"); }}>
            <Text style={styles.successBtnText}>{getTranslation(language, "view_my_bookings")}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[DARK, MAROON, "#6E1830"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={CREAM_ON_DARK} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getTranslation(language, "complete_payment")}</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 {getTranslation(language, "booking_summary")}</Text>
          <SummaryRow label={isHindi ? "कलाकार" : "Artist"} value={booking.artistName} />
          <SummaryRow label={isHindi ? "अवसर" : "Occasion"} value={booking.occasion} />
          <SummaryRow label={isHindi ? "तिथि" : "Date"} value={booking.date} />
          <SummaryRow label={isHindi ? "सत्र समय" : "Session"} value={`${booking.startTime} → ${booking.endTime}`} />
          <SummaryRow label={isHindi ? "अवधि" : "Duration"} value={`${booking.duration} ${booking.duration === 1 ? (isHindi ? "घंटा" : "hour") : (isHindi ? "घंटे" : "hours")}`} />
          <View style={styles.summaryDivider} />
          <SummaryRow label={getTranslation(language, "service_amount")} value={`₹${serviceAmount.toLocaleString("en-IN")}`} bold />
          <SummaryRow label={`${getTranslation(language, "platform_fee")} (${commPercent}%)`} value={`₹${platformFee.toLocaleString("en-IN")}`} />
          <View style={styles.summaryDivider} />
          <SummaryRow label={getTranslation(language, "total_payable")} value={`₹${totalPayable.toLocaleString("en-IN")}`} bold highlight />
        </View>

        {/* Payment Method Selection */}
        <Text style={styles.sectionTitle}>{getTranslation(language, "choose_payment")}</Text>

        {/* Online UPI */}
        <TouchableOpacity
          style={[styles.paymentOption, selectedMethod === "online" && styles.paymentOptionSelected, { borderColor: selectedMethod === "online" ? GOLD : BORDER }]}
          onPress={() => setSelectedMethod("online")}
          activeOpacity={0.8}
        >
          <View style={styles.paymentOptionIcon}>
            <MaterialCommunityIcons name="contactless-payment" size={28} color={MAROON_TEXT} />
          </View>
          <View style={styles.paymentOptionInfo}>
            <Text style={styles.paymentOptionTitle}>{getTranslation(language, "online_upi")}</Text>
            <Text style={styles.paymentOptionDesc}>
              {getTranslation(language, "online_upi_desc")}
            </Text>
            <View style={styles.upiApps}>
              {["PhonePe", "GPay", "Paytm", "BHIM"].map(app => (
                <View key={app} style={styles.upiAppChip}>
                  <Text style={styles.upiAppText}>{app}</Text>
                </View>
              ))}
            </View>
          </View>
          {selectedMethod === "online" && <Ionicons name="checkmark-circle" size={22} color={GOLD} />}
        </TouchableOpacity>



        {/* Interactive QR Code scan card for Online Payment */}
        {selectedMethod === "online" && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>{isHindi ? "स्कैन करके भुगतान करें" : "Scan to Pay Securely"}</Text>
            <Text style={styles.qrSubtitle}>
              {isHindi
                ? `किसी भी यूपीआई ऐप से यह क्यूआर कोड स्कैन करें और ₹${totalPayable.toLocaleString("en-IN")} का भुगतान करें`
                : `Scan this QR Code using any UPI App to transfer ₹${totalPayable.toLocaleString("en-IN")}`}
            </Text>

            <View style={styles.qrFrame}>
              <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} resizeMode="contain" />
              <View style={styles.qrOverlayCornerTL} />
              <View style={styles.qrOverlayCornerTR} />
              <View style={styles.qrOverlayCornerBL} />
              <View style={styles.qrOverlayCornerBR} />
            </View>

            <View style={styles.upiDetailsContainer}>
              <Text style={styles.upiDetailsLabel}>{isHindi ? "एडमिन यूपीआई आईडी" : "Admin UPI ID"}</Text>
              <View style={styles.upiIdRow}>
                <Text style={styles.upiIdText}>{adminUpiId}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyUpiId}>
                  <Ionicons name="copy-outline" size={16} color={GOLD_DARK} />
                  <Text style={styles.copyBtnText}>{isHindi ? "कॉपी" : "Copy"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Dynamic Payment Admin Info Banner */}
        {selectedMethod === "online" && (
          <View style={styles.adminUpiCard}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color={GOLD} />
            <View style={{ flex: 1 }}>
              <Text style={styles.adminUpiTitle}>{isHindi ? "रंगरीति सुरक्षित गेटवे" : "Rangritii Secure Gateway"}</Text>
              <Text style={styles.adminUpiNote}>
                {isHindi
                  ? "सभी ऑनलाइन भुगतान सीधे रंगरीति एडमिन के बैंक खाते में स्थानांतरित किए जाते हैं। भुगतान के बाद नीचे दिए गए पुष्टिकरण बटन पर क्लिक करें।"
                  : "All online payments go directly to the Rangritii Administrator account. Once paid, click the confirm button below."}
              </Text>
            </View>
          </View>
        )}

        {/* Pay / Confirm Button */}
        {selectedMethod === "online" && (
          <View style={{ gap: 10 }}>
            {/* Native App Launcher */}
            <TouchableOpacity
              style={styles.payBtnWrap}
              onPress={handleOnlinePay}
              activeOpacity={0.85}
            >
              <LinearGradient colors={GOLD_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtn}>
                <MaterialCommunityIcons name="launch" size={20} color="#fff" />
                <Text style={styles.payBtnText}>
                  {isHindi ? `UPI ऐप के जरिए भुगतान करें` : `Open Installed UPI App`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Confirm Payment Done */}
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: "#10B981" }]}
              onPress={handleConfirmPaid}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done-circle-outline" size={22} color="#fff" />
              <Text style={styles.payBtnText}>
                {isHindi ? "मैंने भुगतान कर दिया है (Confirm)" : "Confirm Payment Done"}
              </Text>
            </TouchableOpacity>
          </View>
        )}



        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SummaryRow({ label, value, bold, highlight }: any) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: highlight ? GOLD : INK, fontFamily: bold ? "Poppins_700Bold" : "Poppins_500Medium" }]}>{value}</Text>
    </View>
  );
}

function SuccessRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.successRow}>
      <Text style={styles.successRowLabel}>{label}</Text>
      <Text style={styles.successRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerInner: { width: "100%", maxWidth: 560, alignSelf: "center" },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,248,240,0.10)", borderWidth: 1, borderColor: "rgba(253,248,241,0.25)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Poppins_700Bold", color: CREAM_ON_DARK, textAlign: "center" },
  scrollContent: { padding: 16, gap: 12, width: "100%", maxWidth: 560, alignSelf: "center" },
  summaryCard: { borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF", padding: 16, gap: 8 },
  summaryTitle: { fontSize: 12, fontFamily: "Poppins_700Bold", color: GOLD_DARK, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 12, fontFamily: "Poppins_400Regular", color: MUTED },
  summaryValue: { fontSize: 12 },
  summaryDivider: { height: 1, marginVertical: 4, backgroundColor: BORDER },
  sectionTitle: { fontSize: 12, fontFamily: "Poppins_700Bold", color: GOLD_DARK, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 4 },
  paymentOption: { borderRadius: 16, borderWidth: 1.5, backgroundColor: "#FFFFFF", padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  paymentOptionSelected: { borderWidth: 2, shadowColor: GOLD, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  paymentOptionIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: BLUSH, alignItems: "center", justifyContent: "center" },
  paymentOptionInfo: { flex: 1, gap: 4 },
  paymentOptionTitle: { fontSize: 14, fontFamily: "Poppins_700Bold", color: INK },
  paymentOptionDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16, color: MUTED },
  upiApps: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  upiAppChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: BLUSH },
  upiAppText: { fontSize: 10, fontFamily: "Poppins_500Medium", color: MAROON_TEXT },
  adminUpiCard: { borderRadius: 14, borderWidth: 1, borderColor: BORDER, backgroundColor: BLUSH, padding: 14, flexDirection: "row", gap: 10 },
  adminUpiTitle: { fontSize: 12, fontFamily: "Poppins_700Bold", color: MAROON_TEXT },
  adminUpiNote: { fontSize: 10, fontFamily: "Poppins_400Regular", color: MUTED, marginTop: 2, lineHeight: 14 },
  payBtnWrap: { borderRadius: 16, marginTop: 4, shadowColor: GOLD, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 16 },
  payBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
  successScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: "#059669", textAlign: "center" },
  successSubtitle: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#065F46", textAlign: "center", lineHeight: 20 },
  successDetails: { backgroundColor: "#fff", borderRadius: 16, padding: 16, width: "100%", maxWidth: 480, alignSelf: "center", gap: 8, marginTop: 8 },
  successRow: { flexDirection: "row", justifyContent: "space-between" },
  successRowLabel: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "#6B7280" },
  successRowValue: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#1A0A0E" },
  successBtn: { backgroundColor: "#059669", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  successBtnText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },

  // QR Code visual styling
  qrContainer: { borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF", padding: 20, alignItems: "center", gap: 10 },
  qrTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", color: INK },
  qrSubtitle: { fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "center", color: MUTED, paddingHorizontal: 10 },
  qrFrame: { width: 190, height: 190, backgroundColor: "#fff", borderRadius: 16, padding: 10, position: "relative", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: BORDER, marginVertical: 8 },
  qrCodeImage: { width: "100%", height: "100%" },
  qrOverlayCornerTL: { position: "absolute", top: -2, left: -2, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderColor: GOLD },
  qrOverlayCornerTR: { position: "absolute", top: -2, right: -2, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderColor: GOLD },
  qrOverlayCornerBL: { position: "absolute", bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: GOLD },
  qrOverlayCornerBR: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderColor: GOLD },
  upiDetailsContainer: { width: "100%", alignItems: "center", marginTop: 8 },
  upiDetailsLabel: { fontSize: 11, fontFamily: "Poppins_500Medium", color: MUTED },
  upiIdRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  upiIdText: { fontSize: 13, fontFamily: "Poppins_700Bold", color: INK },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: BLUSH },
  copyBtnText: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: GOLD_DARK },
});
