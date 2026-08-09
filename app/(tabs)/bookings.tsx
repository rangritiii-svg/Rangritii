import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, Booking } from "@/context/AppContext";
import { getTranslation } from "@/constants/locale";
import { parseBookingDateTime } from "@/utils/dateUtils";

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

const STATUS_COLORS: Record<string, string> = {
  Pending: "#F59E0B",
  Confirmed: "#10B981",
  Completed: "#6B7280",
  Cancelled: "#EF4444",
};

const STATUS_BG: Record<string, string> = {
  Pending: "#FEF3C7",
  Confirmed: "#D1FAE5",
  Completed: "#F3F4F6",
  Cancelled: "#FEE2E2",
};

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { bookings, userProfile, updateBookingStatus, updatePaymentStatus, cancelBooking, raiseBookingDispute, language } = useApp();
  const [activeTab, setActiveTab] = useState<"pending_artist" | "pending_payment" | "confirmed">("pending_artist");
  const isHindi = language === "hi_IN";

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeBookingId, setDisputeBookingId] = useState("");
  const [disputeInput, setDisputeInput] = useState("");

  const isArtist = userProfile.role === "artist";

  // Scope bookings to the signed-in user. The booking listener in AppContext already
  // filters server-side (artists by artistId, customers by phone). For customers we also
  // filter defensively here so no user ever sees another customer's details.
  const myBookings = isArtist
    ? bookings
    : bookings.filter(b => b.customerPhone === userProfile.phone);

  const filtered = myBookings.filter(b => {
    if (activeTab === "pending_artist") return b.status === "Pending";
    if (activeTab === "pending_payment") return b.status === "Confirmed" && (b.paymentStatus === "unpaid" || b.paymentStatus === "pending_admin_approval");
    if (activeTab === "confirmed") return (b.status === "Confirmed" && (b.paymentStatus === "paid_to_admin" || b.paymentStatus === "paid_to_artist")) || b.status === "Completed";
    return true;
  });

  const handleConfirm = (bookingId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      isHindi ? "बुकिंग स्वीकार करें?" : "Confirm Booking?",
      isHindi ? "यह ग्राहक को सूचित करेगा और बुकिंग की पुष्टि करेगा।" : "This will notify the customer and confirm their booking.",
      [
        { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
        {
          text: isHindi ? "पुष्टि करें" : "Confirm",
          onPress: () => {
            updateBookingStatus(bookingId, "Confirmed");
            Alert.alert(
              isHindi ? "✅ बुकिंग की पुष्टि हो गई!" : "✅ Booking Confirmed!",
              isHindi ? "ग्राहक को सूचित कर दिया गया है। भुगतान करने के लिए पेमेंट स्क्रीन पर जाएँ।" : "The customer has been notified. Go to the payment screen to pay."
            );
          },
        },
      ]
    );
  };

  const handleDecline = (bookingId: string) => {
    Alert.alert(
      isHindi ? "बुकिंग अस्वीकार करें?" : "Decline Booking?",
      isHindi ? "यह ग्राहक के अनुरोध को रद्द कर देगा।" : "This will cancel the customer's request.",
      [
        { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
        {
          text: isHindi ? "अस्वीकार करें" : "Decline",
          style: "destructive",
          onPress: () => {
            updateBookingStatus(bookingId, "Cancelled");
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          },
        },
      ]
    );
  };

  const handleMarkComplete = (bookingId: string) => {
    const booking = myBookings.find(b => b.id === bookingId);
    if (!booking) return;
    Alert.alert(
      isHindi ? "सत्र पूरा मार्क करें?" : "Mark as Completed?",
      isHindi ? "पुष्टि करें कि यह मेहंदी सत्र पूरा हो गया है।" : "Confirm this session is done. Commission will be calculated.",
      [
        { text: isHindi ? "रद्द करें" : "Cancel", style: "cancel" },
        {
          text: isHindi ? "हाँ, पूरा हुआ" : "Mark Complete",
          onPress: () => {
            updateBookingStatus(bookingId, "Completed");
            updatePaymentStatus(bookingId, "commission_due");
            Alert.alert(
              isHindi ? "✅ सत्र पूरा हुआ!" : "✅ Session Complete!",
              isHindi
                ? `कृपया रंगरीति को ${booking.commissionPercentApplied}% कमीशन (₹${booking.commissionAmount}) का भुगतान करें।`
                : `Please pay the ${booking.commissionPercentApplied}% commission of ₹${booking.commissionAmount} to Rangritii.`
            );
          },
        },
      ]
    );
  };

  const previewCancellation = (booking: Booking) => {
    if (booking.status === "Pending") {
      Alert.alert(
        isHindi ? "बुकिंग रद्द करें?" : "Cancel Booking?",
        isHindi ? "क्या आप इस बुकिंग अनुरोध को रद्द करना चाहते हैं? अभी तक कोई भुगतान नहीं किया गया है।" : "Are you sure you want to cancel this booking request? No payment has been made yet.",
        [
          { text: isHindi ? "नहीं" : "No", style: "cancel" },
          {
            text: isHindi ? "हाँ, रद्द करें" : "Yes, Cancel",
            style: "destructive",
            onPress: () => {
              cancelBooking(booking.id, "customer");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
          }
        ]
      );
      return;
    }

    // Confirmed booking cancellation refund preview (robust date parsing — see utils/dateUtils)
    const bookingDate = parseBookingDateTime(booking.date, booking.startTime);
    const diffHours = bookingDate ? (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY;
    const policy = booking.policyApplied;

    let refund = booking.price;
    let artistComp = 0;
    let tierText = "";

    if (diffHours >= policy.tier1Hours) {
      refund = booking.price + booking.commissionAmount; // total paid refund
      artistComp = 0;
      tierText = isHindi
        ? `${policy.tier1Hours}+ घंटे पहले (Tier 1)\nआपको पूरा ₹${refund} रिफंड मिलेगा।`
        : `${policy.tier1Hours}+ hours before (Tier 1)\nYou will receive a full refund of ₹${refund}.`;
    } else if (diffHours >= policy.tier2Hours) {
      refund = Math.round(booking.price * (policy.tier2RefundPercent / 100));
      artistComp = Math.round(booking.price * (policy.tier2ArtistCompPercent / 100));
      tierText = isHindi
        ? `${policy.tier2Hours}-${policy.tier1Hours} घंटे पहले (Tier 2)\n• आपको ₹${refund} रिफंड मिलेगा (${policy.tier2RefundPercent}%)\n• आर्टिस्ट को ₹${artistComp} हर्जाना मिलेगा (${policy.tier2ArtistCompPercent}%)\n• प्लेटफ़ॉर्म कमीशन वापस नहीं होगा।`
        : `${policy.tier2Hours}–${policy.tier1Hours} hours before (Tier 2)\n• You will receive ₹${refund} refund (${policy.tier2RefundPercent}%)\n• Artist will receive ₹${artistComp} compensation (${policy.tier2ArtistCompPercent}%)\n• Platform fee is non-refundable.`;
    } else {
      refund = Math.round(booking.price * (policy.tier3RefundPercent / 100));
      artistComp = Math.round(booking.price * (policy.tier3ArtistCompPercent / 100));
      tierText = isHindi
        ? `${policy.tier2Hours} घंटे से कम पहले (Tier 3)\n• आपको कोई रिफंड नहीं मिलेगा (${policy.tier3RefundPercent}%)\n• आर्टिस्ट को ₹${artistComp} हर्जाना मिलेगा (${policy.tier3ArtistCompPercent}%)\n• प्लेटफ़ॉर्म कमीशन वापस नहीं होगा।`
        : `Under ${policy.tier2Hours} hours before (Tier 3)\n• You will receive ₹${refund} refund (${policy.tier3RefundPercent}%)\n• Artist will receive ₹${artistComp} compensation (${policy.tier3ArtistCompPercent}%)\n• Platform fee is non-refundable.`;
    }

    Alert.alert(
      isHindi ? "बुकिंग रद्द करें?" : "Cancel Booking?",
      (isHindi
        ? `क्या आप इस बुकिंग को रद्द करना चाहते हैं?\n\nरद्दीकरण समय: ${tierText}`
        : `Are you sure you want to cancel this booking?\n\nCancellation Window: ${tierText}`),
      [
        { text: isHindi ? "नहीं" : "No", style: "cancel" },
        {
          text: isHindi ? "हाँ, रद्द करें" : "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelBooking(booking.id, "customer");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
        }
      ]
    );
  };

  const handleArtistCancel = (booking: Booking) => {
    Alert.alert(
      isHindi ? "बुकिंग रद्द करें?" : "Cancel Booking?",
      isHindi
        ? `क्या आप इस बुकिंग को रद्द करना चाहते हैं? इससे ग्राहक को 100% रिफंड मिलेगा।\n\nचेतावनी: इससे आपकी स्ट्राइक बढ़ जाएगी। 3 स्ट्राइक पर खाता निलंबित हो जाएगा।`
        : `Are you sure you want to cancel this booking? The customer will receive a 100% refund.\n\nWarning: This will add a cancellation strike to your account. 3 strikes lead to suspension.`,
      [
        { text: isHindi ? "नहीं" : "No", style: "cancel" },
        {
          text: isHindi ? "हाँ, रद्द करें" : "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelBooking(booking.id, "artist");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
        }
      ]
    );
  };

  const handleOpenDispute = (bookingId: string) => {
    setDisputeBookingId(bookingId);
    setDisputeInput("");
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = () => {
    if (!disputeInput.trim()) {
      Alert.alert(isHindi ? "त्रुटि" : "Error", isHindi ? "कृपया विवाद का विवरण दर्ज करें।" : "Please enter the dispute reason.");
      return;
    }
    raiseBookingDispute(disputeBookingId, disputeInput.trim());
    setShowDisputeModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      isHindi ? "विवाद दर्ज किया गया" : "Dispute Raised",
      isHindi ? "आपका विवाद समीक्षा के लिए एडमिन को भेज दिया गया है।" : "Your dispute has been sent to the administrator for review."
    );
  };

  const handlePayNow = (booking: Booking) => {
    router.push(`/payment/${booking.id}` as any);
  };

  const pendingCount = myBookings.filter(b => b.status === "Pending").length;

  return (
    <View style={styles.container}>
      {/* Header — RangRiti 2.0 dark maroon gradient */}
      <LinearGradient
        colors={[DARK, MAROON]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={[styles.headerInner, isWide && styles.wideConstraint]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>{isArtist ? (isHindi ? "📋 बुकिंग अनुरोध" : "📋 Booking Requests") : (isHindi ? "📅 मेरी बुकिंग्स" : "📅 My Bookings")}</Text>
              <Text style={styles.headerSubtitle}>
                {isArtist
                  ? (isHindi ? `${pendingCount} लंबित अनुरोध` : `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""}`)
                  : (isHindi ? `कुल ${myBookings.length} बुकिंग्स` : `${myBookings.length} total booking${myBookings.length !== 1 ? "s" : ""}`)}
              </Text>
            </View>
            {pendingCount > 0 && (
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {(["pending_artist", "pending_payment", "confirmed"] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === "pending_artist"
                    ? (isHindi ? "⏳ लंबित आर्टिस्ट" : "⏳ Pending Artist")
                    : tab === "pending_payment"
                      ? (isHindi ? "💳 लंबित भुगतान" : "💳 Pending Payment")
                      : (isHindi ? "✅ स्वीकृत" : "✅ Confirmed")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.listContent, isWide && styles.wideConstraint]} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={GOLD} />
            </View>
            <Text style={styles.emptyTitle}>{isHindi ? "कोई बुकिंग नहीं" : "No Bookings Yet"}</Text>
            <Text style={styles.emptyDesc}>
              {isArtist
                ? (isHindi ? "ग्राहकों से आने वाले बुकिंग अनुरोध यहाँ दिखाई देंगे।" : "Booking requests from customers will appear here.")
                : (isHindi ? "शुरू करने के लिए आर्टिस्ट देखें और बुकिंग अनुरोध भेजें!" : "Browse artists and send a booking request to get started!")}
            </Text>
            {!isArtist && (
              <TouchableOpacity style={styles.goldCtaShadow} onPress={() => router.push("/(tabs)")} activeOpacity={0.9}>
                <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.browseCta}>
                  <Text style={styles.browseCtaText}>{isHindi ? "कलाकार खोजें" : "Browse Artists"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(booking => <BookingCard
            key={booking.id}
            booking={booking}
            isArtist={isArtist}
            isHindi={isHindi}
            language={language}
            onConfirm={() => handleConfirm(booking.id)}
            onDecline={() => handleDecline(booking.id)}
            onMarkComplete={() => handleMarkComplete(booking.id)}
            onCancel={() => isArtist ? handleArtistCancel(booking) : previewCancellation(booking)}
            onPayNow={() => handlePayNow(booking)}
            onRaiseDispute={handleOpenDispute}
          />)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Raise Dispute Modal overlay */}
      <Modal
        visible={showDisputeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isHindi ? "⚠️ विवाद दर्ज करें" : "⚠️ Raise Booking Dispute"}</Text>
            <Text style={styles.modalSubtitle}>
              {isHindi
                ? "कृपया विवाद का कारण और समस्या का विवरण लिखें। एडमिन इसकी समीक्षा करेगा।"
                : "Please describe the issue with this booking. The administrator will review and intervene."}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder={isHindi ? "जैसे: आर्टिस्ट समय पर नहीं आया, या अधूरा काम किया..." : "e.g. Artist did not show up on time, or charged extra money..."}
              placeholderTextColor={MUTED}
              value={disputeInput}
              onChangeText={setDisputeInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setShowDisputeModal(false)}>
                <Text style={[styles.modalBtnText, { color: MUTED }]}>{isHindi ? "रद्द करें" : "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#EF4444", borderColor: "#EF4444" }]} onPress={handleSubmitDispute}>
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>{isHindi ? "दर्ज करें" : "Submit Dispute"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BookingCard({
  booking, isArtist, isHindi, language, onConfirm, onDecline, onMarkComplete, onCancel, onPayNow, onRaiseDispute,
}: {
  booking: Booking; isArtist: boolean; isHindi: boolean; language: any;
  onConfirm: () => void; onDecline: () => void; onMarkComplete: () => void; onCancel: () => void; onPayNow: () => void; onRaiseDispute: (id: string) => void;
}) {
  const statusColor = STATUS_COLORS[booking.status] || "#6B7280";
  const statusBg = STATUS_BG[booking.status] || "#F3F4F6";

  const displayStatus = isHindi
    ? (booking.status === "Pending" ? "लंबित" : booking.status === "Confirmed" ? "पुष्टि की गई" : booking.status === "Completed" ? "पूर्ण" : "रद्द")
    : booking.status;

  const displayPayment = (booking.paymentStatus === "paid_to_admin" || booking.paymentStatus === "paid_to_artist")
    ? (isHindi ? "✅ Paid to Admin" : "✅ Paid to Admin")
    : booking.paymentStatus === "pending_admin_approval"
      ? (isHindi ? "⏳ सत्यापन लंबित" : "⏳ Pending Approval")
      : booking.paymentMethod === "cash"
        ? (isHindi ? "💵 नकद" : "💵 Cash")
        : booking.paymentStatus === "commission_due"
          ? (isHindi ? "⚠️ कमीशन देय" : "⚠️ Fee Due")
          : (isHindi ? "⏳ लंबित" : "⏳ Pending");

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <LinearGradient colors={[GOLD, GOLD_DARK]} style={styles.cardAvatar}>
            <Text style={styles.cardAvatarText}>
              {isArtist ? booking.customerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : booking.artistName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardName}>
              {isArtist ? booking.customerName : booking.artistName}
            </Text>
            <Text style={styles.cardOccasion}>{booking.occasion}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text>
        </View>
      </View>

      {/* Date/Time Row */}
      <View style={styles.cardMeta}>
        <View style={styles.cardMetaItem}>
          <Ionicons name="calendar-outline" size={14} color={GOLD_DARK} />
          <Text style={styles.cardMetaText}>{booking.date}</Text>
        </View>
        <View style={styles.cardMetaDivider} />
        <View style={styles.cardMetaItem}>
          <Ionicons name="time-outline" size={14} color={GOLD_DARK} />
          <Text style={styles.cardMetaText}>{booking.startTime} – {booking.endTime}</Text>
        </View>
        <View style={styles.cardMetaDivider} />
        <View style={styles.cardMetaItem}>
          <Ionicons name="hourglass-outline" size={14} color={GOLD_DARK} />
          <Text style={styles.cardMetaText}>{booking.duration}h</Text>
        </View>
      </View>

      {/* Price & Commission Row */}
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.priceLabel}>{isHindi ? "बुक मूल्य" : "Booking Value"}</Text>
          <Text style={styles.priceValue}>₹{booking.price.toLocaleString("en-IN")}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.priceLabel}>{isHindi ? "कमीशन" : "Commission"} ({booking.commissionPercentApplied}%)</Text>
          <Text style={[styles.priceValue, { color: GOLD_DARK }]}>₹{booking.commissionAmount.toLocaleString("en-IN")}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.priceLabel}>{isHindi ? "भुगतान" : "Payment"}</Text>
          <Text style={[styles.paymentMethod, {
            color: (booking.paymentStatus === "paid_to_admin" || booking.paymentStatus === "paid_to_artist") ? "#10B981" : booking.paymentStatus === "pending_admin_approval" ? "#F59E0B" : booking.paymentMethod === "cash" ? "#C9932F" : "#EF4444"
          }]}>
            {displayPayment}
          </Text>
        </View>
      </View>

      {/* Cancellation metadata display */}
      {booking.status === "Cancelled" && (
        <View style={[styles.notesRow, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1 }]}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: "#EF4444" }}>
              {isHindi ? "बुकिंग रद्द कर दी गई है" : "Booking Cancelled"}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: "Poppins_400Regular", color: "#B91C1C", marginTop: 2, lineHeight: 14 }}>
              {isHindi
                ? `• रद्दकर्ता: ${booking.cancellationInitiator === "customer" ? "ग्राहक" : "कलाकार"}\n• ग्राहक रिफंड राशि: ₹${booking.cancellationRefundAmount ?? 0}\n• कलाकार हर्जाना: ₹${booking.cancellationArtistComp ?? 0}`
                : `• Cancelled by: ${booking.cancellationInitiator === "customer" ? "Customer" : "Artist"}\n• Customer Refund: ₹${booking.cancellationRefundAmount ?? 0}\n• Artist Compensation: ₹${booking.cancellationArtistComp ?? 0}`
              }
            </Text>
          </View>
        </View>
      )}

      {/* Dispute details display */}
      {booking.disputeStatus && (
        <View style={[styles.notesRow, { backgroundColor: booking.disputeStatus === "Open" ? "#FFFBEB" : "#F0FDF4", borderColor: booking.disputeStatus === "Open" ? "#FCD34D" : "#86EFAC", borderWidth: 1 }]}>
          <Ionicons name="alert-circle" size={14} color={booking.disputeStatus === "Open" ? "#D97706" : "#16A34A"} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: booking.disputeStatus === "Open" ? "#D97706" : "#16A34A" }}>
              {booking.disputeStatus === "Open"
                ? (isHindi ? "⚠️ विवाद लंबित (Open)" : "⚠️ Dispute Open")
                : (isHindi ? "✅ विवाद सुलझाया गया (Resolved)" : "✅ Dispute Resolved")}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: "Poppins_400Regular", color: INK, marginTop: 2 }}>
              {isHindi ? "विवरण: " : "Issue: "}"{booking.disputeReason}"
            </Text>
            {booking.disputeRefundAmount !== undefined && booking.disputeRefundAmount > 0 && (
              <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: "#16A34A", marginTop: 2 }}>
                {isHindi
                  ? `• एडमिन रिफंड: ₹${booking.disputeRefundAmount} (सफलतापूर्वक वापस किया गया)`
                  : `• Admin Refund: ₹${booking.disputeRefundAmount} (Refunded successfully)`}
              </Text>
            )}
          </View>
        </View>
      )}

      {booking.notes ? (
        <View style={styles.notesRow}>
          <Ionicons name="document-text-outline" size={13} color={MUTED} />
          <Text style={styles.notesText} numberOfLines={2}>{booking.notes}</Text>
        </View>
      ) : null}

      {/* Customer contact for Artist */}
      {isArtist && booking.status === "Confirmed" && (
        <View style={[styles.customerContact, { backgroundColor: "#F0FDF4", borderColor: "#A7F3D0" }]}>
          <Ionicons name="call-outline" size={14} color="#059669" />
          <Text style={[styles.customerContactText, { color: "#059669" }]}>{isHindi ? "ग्राहक" : "Customer"}: {booking.customerName} · {booking.customerPhone || "No phone"}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Artist: Pending → Confirm/Decline */}
        {isArtist && booking.status === "Pending" && (
          <>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#D1FAE5", borderColor: "#A7F3D0" }]} onPress={onConfirm}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
              <Text style={[styles.actionBtnText, { color: "#059669" }]}>{getTranslation(language, "accept_btn")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]} onPress={onDecline}>
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>{getTranslation(language, "decline_btn")}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Artist: Confirmed → Mark Complete & Cancel */}
        {isArtist && booking.status === "Confirmed" && (
          <View style={{ flex: 1, gap: 8 }}>
            <TouchableOpacity style={styles.goldCtaShadow} onPress={onMarkComplete} activeOpacity={0.9}>
              <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goldBtn}>
                <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>{getTranslation(language, "mark_completed")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnFull, { backgroundColor: "#FEE2E2", borderColor: "#FECACA", borderWidth: 1 }]} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>{isHindi ? "बुकिंग रद्द करें" : "Cancel Booking"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Customer: Pending/Confirmed/Completed → Pay Now & Cancel & Raise Dispute */}
        {!isArtist && (
          <View style={{ flex: 1, gap: 8 }}>
            {/* Pay Now (Customer Confirmed Unpaid) */}
            {booking.status === "Confirmed" && booking.paymentStatus === "unpaid" && booking.paymentMethod !== "cash" && (
              <TouchableOpacity style={styles.goldCtaShadow} onPress={onPayNow} activeOpacity={0.9}>
                <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.goldBtn}>
                  <Ionicons name="card-outline" size={16} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>{isHindi ? "भुगतान करें" : "Pay Now"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              {/* Cancel Button (Customer Pending/Confirmed) */}
              {(booking.status === "Pending" || booking.status === "Confirmed") && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]} onPress={onCancel}>
                  <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                  <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>{isHindi ? "रद्द करें" : "Cancel"}</Text>
                </TouchableOpacity>
              )}

              {/* Dispute Button (Customer Confirmed/Completed and no Dispute open yet) */}
              {(booking.status === "Confirmed" || booking.status === "Completed") && !booking.disputeStatus && (
                <TouchableOpacity style={[styles.actionBtn, { borderColor: "#EF4444", backgroundColor: "#FEF2F2" }]} onPress={() => onRaiseDispute(booking.id)}>
                  <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
                  <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>{isHindi ? "विवाद" : "Dispute"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerInner: { width: "100%" },
  wideConstraint: { maxWidth: 900, width: "100%", alignSelf: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  headerTitle: { fontSize: 20, fontFamily: "Poppins_700Bold", color: CREAM_TEXT },
  headerSubtitle: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "rgba(253,248,241,0.72)" },
  badgeCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD, borderWidth: 1, borderColor: "rgba(255,248,240,0.4)", alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 14, fontFamily: "Poppins_700Bold", color: "#fff" },
  tabRow: { flexDirection: "row", gap: 4, paddingBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", backgroundColor: "rgba(255,248,240,0.1)", borderWidth: 1, borderColor: "rgba(255,248,240,0.14)" },
  tabActive: { backgroundColor: GOLD, borderColor: GOLD },
  tabText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "rgba(253,248,241,0.65)" },
  tabTextActive: { color: "#fff", fontFamily: "Poppins_700Bold" },
  listContent: { padding: 16, gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: CARD_BORDER, padding: 14, gap: 10, shadowColor: MAROON, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  cardAvatarText: { fontSize: 14, fontFamily: "Poppins_700Bold", color: "#fff" },
  cardHeaderInfo: { gap: 1 },
  cardName: { fontSize: 14, fontFamily: "Poppins_700Bold", color: INK },
  cardOccasion: { fontSize: 11, fontFamily: "Poppins_400Regular", color: MUTED },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  cardMeta: { flexDirection: "row", borderRadius: 10, borderWidth: 1, borderColor: CARD_BORDER, backgroundColor: BLUSH, overflow: "hidden" },
  cardMetaItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8 },
  cardMetaText: { fontSize: 10, fontFamily: "Poppins_500Medium", color: INK },
  cardMetaDivider: { width: 1, backgroundColor: CARD_BORDER },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 10, fontFamily: "Poppins_400Regular", color: MUTED, marginBottom: 2 },
  priceValue: { fontSize: 14, fontFamily: "Poppins_700Bold", color: INK },
  paymentMethod: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  notesRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderRadius: 8, padding: 8, backgroundColor: BLUSH },
  notesText: { flex: 1, fontSize: 11, fontFamily: "Poppins_400Regular", color: MUTED },
  customerContact: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, padding: 8 },
  customerContactText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  actionBtnFull: { borderWidth: 0 },
  actionBtnText: { fontSize: 12, fontFamily: "Poppins_700Bold" },
  goldCtaShadow: { borderRadius: 10, shadowColor: GOLD, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  goldBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 10 },
  emptyState: { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: CARD_BORDER, padding: 36, alignItems: "center", gap: 12, marginTop: 20 },
  emptyIconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: BLUSH, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: INK },
  emptyDesc: { fontSize: 13, fontFamily: "Poppins_400Regular", color: MUTED, textAlign: "center", lineHeight: 20 },
  browseCta: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 4 },
  browseCtaText: { fontSize: 14, fontFamily: "Poppins_700Bold", color: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(26,10,14,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 320, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: CARD_BORDER, padding: 20, shadowColor: DARK, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Poppins_700Bold", color: INK, marginBottom: 8 },
  modalSubtitle: { fontSize: 12, fontFamily: "Poppins_400Regular", color: MUTED, lineHeight: 16, marginBottom: 12 },
  modalInput: { borderRadius: 12, borderWidth: 1, borderColor: CARD_BORDER, backgroundColor: CREAM, color: INK, padding: 12, fontSize: 13, fontFamily: "Poppins_400Regular", minHeight: 80, marginBottom: 16 },
  modalActionsRow: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: CARD_BORDER },
  modalBtnText: { fontSize: 13, fontWeight: "700", fontFamily: "Poppins_700Bold" },
});
