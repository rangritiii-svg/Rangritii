import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Image, Clipboard, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, ADMIN_UPI_ID } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getTranslation } from "@/constants/locale";

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookingid } = useLocalSearchParams<{ bookingid: string }>();
  const { getBookingById, updateBookingStatus, updatePaymentStatus, getArtistById, language } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<"online" | "cash" | null>("online");
  const [paid, setPaid] = useState(false);
  const isHindi = language === "hi_IN";

  const booking = getBookingById(bookingid ?? "");
  const artist = booking ? getArtistById(booking.artistId) : undefined;

  if (!booking) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ color: colors.text }}>Booking not found</Text>
    </View>
  );

  const serviceAmount = booking.price; // service amount
  const platformFee = booking.commissionAmount; // platform commission fee
  const totalPayable = serviceAmount + platformFee; // total payable amount
  const commPercent = booking.commissionPercentApplied;

  // Resolve link: either custom admin link or fallback default UPI link
  const payUrl = booking.paymentLink || `upi://pay?pa=${ADMIN_UPI_ID}&pn=Rangritii&am=${totalPayable}&cu=INR&tn=Booking_${booking.id.slice(0, 8)}`;
  
  // Dynamic QR Code API URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payUrl)}`;

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
              ? `UPI आईडी पर ₹${totalPayable.toLocaleString("en-IN")} ट्रांसफर करें:\n\nUPI आईडी: ${ADMIN_UPI_ID}\nनाम: Rangritii Admin\n\nविवरण (Ref): ${booking.id.slice(0, 8)}`
              : `Transfer ₹${totalPayable.toLocaleString("en-IN")} to:\n\nUPI ID: ${ADMIN_UPI_ID}\nName: Rangritii Admin\n\nUse Ref: ${booking.id.slice(0, 8)}`,
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
        isHindi ? `कृपया ₹${totalPayable} का भुगतान इस UPI ID पर करें: ${ADMIN_UPI_ID}` : `Please complete payment of ₹${totalPayable} to:\nUPI ID: ${ADMIN_UPI_ID}`
      );
    }
  };

  const copyUpiId = () => {
    Clipboard.setString(ADMIN_UPI_ID);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(isHindi ? "कॉपी किया गया!" : "Copied!", isHindi ? "UPI आईडी क्लिपबोर्ड पर कॉपी हो गई है।" : "UPI ID has been copied to your clipboard.");
  };

  const handleConfirmPaid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    updatePaymentStatus(booking.id, "paid");
    updateBookingStatus(booking.id, "Confirmed", "online");
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={["#D1FAE5", "#A7F3D0"]} style={[styles.successScreen, { paddingTop: insets.top + 40 }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color="#059669" />
          </View>
          <Text style={styles.successTitle}>
            {selectedMethod === "cash" 
              ? (isHindi ? "बुकिंग के लिए धन्यवाद! 💖" : "Thank You for Booking! 💖") 
              : (isHindi ? "भुगतान और बुकिंग की पुष्टि! 🎉" : "Payment & Booking Confirmed! 🎉")}
          </Text>
          <Text style={styles.successSubtitle}>
            {selectedMethod === "cash"
              ? (isHindi ? `सत्र के दिन ${booking.artistName} को ₹${serviceAmount.toLocaleString("en-IN")} नकद भुगतान करें।` : `Please pay ₹${serviceAmount.toLocaleString("en-IN")} cash to ${booking.artistName} on the session day.`)
              : (isHindi ? `बुकिंग के लिए धन्यवाद! ₹${totalPayable.toLocaleString("en-IN")} रंगरीति को सफलतापूर्वक भुगतान कर दिया गया है।` : `Thank you for booking! ₹${totalPayable.toLocaleString("en-IN")} paid successfully to Rangritii.`)}
          </Text>
          <View style={styles.successDetails}>
            <SuccessRow label={isHindi ? "आर्टिस्ट" : "Artist"} value={booking.artistName} />
            <SuccessRow label={isHindi ? "तिथि" : "Date"} value={booking.date} />
            <SuccessRow label={isHindi ? "सत्र समय" : "Session"} value={`${booking.startTime} – ${booking.endTime}`} />
            <SuccessRow label={isHindi ? "भुगतान राशि" : "Amount Paid"} value={`₹${selectedMethod === "cash" ? 0 : totalPayable.toLocaleString("en-IN")}`} />
            {selectedMethod === "cash" && <SuccessRow label={isHindi ? "आर्टिस्ट को नकद" : "Cash to Artist"} value={`₹${serviceAmount.toLocaleString("en-IN")}`} />}
          </View>
          <TouchableOpacity style={styles.successBtn} onPress={() => { router.dismiss(); router.push("/(tabs)/bookings"); }}>
            <Text style={styles.successBtnText}>{getTranslation(language, "view_my_bookings")}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={["#F9AABF", "#E8849E"]} style={[styles.header, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getTranslation(language, "complete_payment")}</Text>
          <View style={{ width: 36 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>📋 {getTranslation(language, "booking_summary")}</Text>
          <SummaryRow label={isHindi ? "कलाकार" : "Artist"} value={booking.artistName} colors={colors} />
          <SummaryRow label={isHindi ? "अवसर" : "Occasion"} value={booking.occasion} colors={colors} />
          <SummaryRow label={isHindi ? "तिथि" : "Date"} value={booking.date} colors={colors} />
          <SummaryRow label={isHindi ? "सत्र समय" : "Session"} value={`${booking.startTime} → ${booking.endTime}`} colors={colors} />
          <SummaryRow label={isHindi ? "अवधि" : "Duration"} value={`${booking.duration} ${booking.duration === 1 ? (isHindi ? "घंटा" : "hour") : (isHindi ? "घंटे" : "hours")}`} colors={colors} />
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <SummaryRow label={getTranslation(language, "service_amount")} value={`₹${serviceAmount.toLocaleString("en-IN")}`} colors={colors} bold />
          <SummaryRow label={`${getTranslation(language, "platform_fee")} (${commPercent}%)`} value={`₹${platformFee.toLocaleString("en-IN")}`} colors={colors} />
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <SummaryRow label={getTranslation(language, "total_payable")} value={`₹${totalPayable.toLocaleString("en-IN")}`} colors={colors} bold highlight />
        </View>

        {/* Payment Method Selection */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{getTranslation(language, "choose_payment")}</Text>

        {/* Online UPI */}
        <TouchableOpacity
          style={[styles.paymentOption, selectedMethod === "online" && styles.paymentOptionSelected, { backgroundColor: colors.card, borderColor: selectedMethod === "online" ? colors.primary : colors.border }]}
          onPress={() => setSelectedMethod("online")}
          activeOpacity={0.8}
        >
          <View style={[styles.paymentOptionIcon, { backgroundColor: "#EFF6FF" }]}>
            <MaterialCommunityIcons name="contactless-payment" size={28} color="#3B82F6" />
          </View>
          <View style={styles.paymentOptionInfo}>
            <Text style={[styles.paymentOptionTitle, { color: colors.text }]}>{getTranslation(language, "online_upi")}</Text>
            <Text style={[styles.paymentOptionDesc, { color: colors.mutedForeground }]}>
              {getTranslation(language, "online_upi_desc")}
            </Text>
            <View style={styles.upiApps}>
              {["PhonePe", "GPay", "Paytm", "BHIM"].map(app => (
                <View key={app} style={[styles.upiAppChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.upiAppText, { color: colors.text }]}>{app}</Text>
                </View>
              ))}
            </View>
          </View>
          {selectedMethod === "online" && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
        </TouchableOpacity>



        {/* Interactive QR Code scan card for Online Payment */}
        {selectedMethod === "online" && (
          <View style={[styles.qrContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
              <Text style={[styles.upiDetailsLabel, { color: colors.mutedForeground }]}>{isHindi ? "एडमिन यूपीआई आईडी" : "Admin UPI ID"}</Text>
              <View style={styles.upiIdRow}>
                <Text style={[styles.upiIdText, { color: colors.text }]}>{ADMIN_UPI_ID}</Text>
                <TouchableOpacity style={styles.copyBtn} onPress={copyUpiId}>
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>{isHindi ? "कॉपी" : "Copy"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Dynamic Payment Admin Info Banner */}
        {selectedMethod === "online" && (
          <View style={[styles.adminUpiCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#1D4ED8" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.adminUpiTitle, { color: "#1D4ED8" }]}>{isHindi ? "रंगरीति सुरक्षित गेटवे" : "Rangritii Secure Gateway"}</Text>
              <Text style={[styles.adminUpiNote, { color: "#1E40AF" }]}>
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
              style={[styles.payBtn, { backgroundColor: "#3B82F6" }]} 
              onPress={handleOnlinePay} 
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="launch" size={20} color="#fff" />
              <Text style={styles.payBtnText}>
                {isHindi ? `UPI ऐप के जरिए भुगतान करें` : `Open Installed UPI App`}
              </Text>
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

function SummaryRow({ label, value, colors, bold, highlight }: any) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: highlight ? colors.gold : colors.text, fontFamily: bold ? "Poppins_700Bold" : "Poppins_500Medium" }]}>{value}</Text>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Poppins_700Bold", color: "#fff", textAlign: "center" },
  scrollContent: { padding: 16, gap: 12 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  summaryTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  summaryValue: { fontSize: 12 },
  summaryDivider: { height: 1, marginVertical: 4 },
  sectionTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", marginTop: 4 },
  paymentOption: { borderRadius: 16, borderWidth: 1.5, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  paymentOptionSelected: { borderWidth: 2 },
  paymentOptionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  paymentOptionInfo: { flex: 1, gap: 4 },
  paymentOptionTitle: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  paymentOptionDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16 },
  upiApps: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  upiAppChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  upiAppText: { fontSize: 10, fontFamily: "Poppins_500Medium" },
  adminUpiCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", gap: 10 },
  adminUpiTitle: { fontSize: 12, fontFamily: "Poppins_700Bold", color: "#C9932F" },
  adminUpiNote: { fontSize: 10, fontFamily: "Poppins_400Regular", color: "#92400E", marginTop: 2, lineHeight: 14 },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 16, marginTop: 4 },
  payBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
  successScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: "#059669", textAlign: "center" },
  successSubtitle: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#065F46", textAlign: "center", lineHeight: 20 },
  successDetails: { backgroundColor: "#fff", borderRadius: 16, padding: 16, width: "100%", gap: 8, marginTop: 8 },
  successRow: { flexDirection: "row", justifyContent: "space-between" },
  successRowLabel: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "#6B7280" },
  successRowValue: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#1A0A0E" },
  successBtn: { backgroundColor: "#059669", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  successBtnText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },
  
  // QR Code visual styling
  qrContainer: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  qrTitle: { fontSize: 15, fontFamily: "Poppins_700Bold" },
  qrSubtitle: { fontSize: 11, fontFamily: "Poppins_400Regular", textAlign: "center", color: "#6B7280", paddingHorizontal: 10 },
  qrFrame: { width: 190, height: 190, backgroundColor: "#fff", borderRadius: 16, padding: 10, position: "relative", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", marginVertical: 8 },
  qrCodeImage: { width: "100%", height: "100%" },
  qrOverlayCornerTL: { position: "absolute", top: -2, left: -2, width: 20, height: 20, borderTopWidth: 4, borderLeftWidth: 4, borderColor: "#C9932F" },
  qrOverlayCornerTR: { position: "absolute", top: -2, right: -2, width: 20, height: 20, borderTopWidth: 4, borderRightWidth: 4, borderColor: "#C9932F" },
  qrOverlayCornerBL: { position: "absolute", bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: "#C9932F" },
  qrOverlayCornerBR: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 4, borderRightWidth: 4, borderColor: "#C9932F" },
  upiDetailsContainer: { width: "100%", alignItems: "center", marginTop: 8 },
  upiDetailsLabel: { fontSize: 11, fontFamily: "Poppins_500Medium" },
  upiIdRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  upiIdText: { fontSize: 13, fontFamily: "Poppins_700Bold" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#EFF6FF" },
  copyBtnText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
});
