import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, Booking } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getTranslation } from "@/constants/locale";

const { width } = Dimensions.get("window");

const STATUS_COLORS: Record<string, string> = {
  Pending: "#F59E0B",
  Confirmed: "#10B981",
  Completed: "#3B82F6",
  Cancelled: "#EF4444",
};

export default function ArtistEarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userProfile, artists, bookings, language } = useApp();
  const isHindi = language === "hi_IN";

  // Find current artist from context
  const currentArtist = useMemo(() => {
    return artists.find(a => a.phone === userProfile.phone);
  }, [artists, userProfile.phone]);

  // Fetch bookings belonging to this artist
  const artistBookings = useMemo(() => {
    if (!currentArtist) return [];
    return bookings.filter(b => b.artistId === currentArtist.id);
  }, [bookings, currentArtist]);

  const [activeFilter, setActiveFilter] = useState<"All" | "Completed" | "Cancelled" | "Pending">("All");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Earnings calculations
  const stats = useMemo(() => {
    const completed = artistBookings.filter(b => b.status === "Completed");
    const gross = completed.reduce((sum, b) => sum + b.price, 0);
    const commission = completed.reduce((sum, b) => sum + b.commissionAmount, 0);
    const net = gross - commission;

    return {
      gross,
      commission,
      net,
      completedCount: completed.length,
      cancelledCount: artistBookings.filter(b => b.status === "Cancelled").length,
      pendingCount: artistBookings.filter(b => b.status === "Pending").length,
    };
  }, [artistBookings]);

  // Filtered bookings list
  const filteredBookings = useMemo(() => {
    if (activeFilter === "All") return artistBookings;
    return artistBookings.filter(b => b.status === activeFilter);
  }, [artistBookings, activeFilter]);

  const handleCallCustomer = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Unable to place call on this device.");
    });
  };

  const handleBookingPress = (booking: Booking) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedBooking(booking);
  };

  if (!currentArtist) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text, fontFamily: "Poppins_600SemiBold" }}>
          {isHindi ? "आर्टिस्ट प्रोफ़ाइल नहीं मिली।" : "Artist profile not found."}
        </Text>
      </View>
    );
  }

  const initials = currentArtist.name
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ME";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={["#1A0A0E", "#4A1020"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#C9932F" />
            <Text style={styles.headerTitle}>{isHindi ? "कमाई और बुकिंग इतिहास" : "Earnings & Bookings"}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.artistProfileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.artistName}>{currentArtist.name}</Text>
            <Text style={[styles.artistLoc, { color: colors.mutedForeground }]}>{currentArtist.city}, {currentArtist.state}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Statistics Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient colors={["#D1FAE5", "#A7F3D0"]} style={styles.statCardLarge}>
            <MaterialCommunityIcons name="cash-check" size={28} color="#065F46" />
            <Text style={[styles.statValueLarge, { color: "#065F46" }]}>₹{stats.net.toLocaleString("en-IN")}</Text>
            <Text style={[styles.statLabelLarge, { color: "#065F46" }]}>{isHindi ? "शुद्ध कमाई (पैसे मिले)" : "Net Earnings Received"}</Text>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={[styles.statCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="currency-inr" size={20} color={colors.gold} />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>₹{stats.gross.toLocaleString("en-IN")}</Text>
              <Text style={[styles.statLabelSmall, { color: colors.mutedForeground }]}>{isHindi ? "कुल बुकिंग राशि" : "Gross Revenue"}</Text>
            </View>
            <View style={[styles.statCardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="percent" size={18} color="#E8849E" />
              <Text style={[styles.statValueSmall, { color: colors.text }]}>₹{stats.commission.toLocaleString("en-IN")}</Text>
              <Text style={[styles.statLabelSmall, { color: colors.mutedForeground }]}>{isHindi ? "प्लेटफ़ॉर्म फीस" : "Commission Fee"}</Text>
            </View>
          </View>
        </View>

        {/* Filters and Booking Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{isHindi ? "बुकिंग विवरण" : "Booking Records"}</Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{artistBookings.length} {isHindi ? "कुल" : "total"}</Text>
        </View>

        {/* Filter Scroll Row */}
        <View style={styles.filtersRow}>
          {(["All", "Pending", "Completed", "Cancelled"] as const).map(filter => {
            const isActive = activeFilter === filter;
            let label: string = filter;
            if (isHindi) {
              if (filter === "All") label = "सभी";
              if (filter === "Pending") label = "लंबित";
              if (filter === "Completed") label = "पूर्ण";
              if (filter === "Cancelled") label = "रद्द";
            }
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  { backgroundColor: isActive ? colors.primary : colors.secondary }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveFilter(filter);
                }}
              >
                <Text style={[styles.filterTabText, { color: isActive ? "#fff" : colors.text }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="calendar-blank" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {isHindi ? "कोई बुकिंग रिकॉर्ड नहीं मिला।" : "No booking records found."}
            </Text>
          </View>
        ) : (
          filteredBookings.map(b => {
            const statusCol = STATUS_COLORS[b.status] || colors.mutedForeground;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.bookingItemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleBookingPress(b)}
              >
                <View style={styles.bookingRowHeader}>
                  <Text style={[styles.occasionText, { color: colors.text }]}>{b.occasion}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusCol + "20" }]}>
                    <Text style={[styles.statusText, { color: statusCol }]}>
                      {isHindi 
                        ? (b.status === "Pending" ? "लंबित" : b.status === "Confirmed" ? "स्वीकृत" : b.status === "Completed" ? "पूर्ण" : "रद्द") 
                        : b.status}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.customerNameText, { color: colors.mutedForeground }]}>
                  {isHindi ? "ग्राहक:" : "Customer:"} <Text style={{ color: colors.text, fontFamily: "Poppins_500Medium" }}>{b.customerName}</Text>
                </Text>
                
                <View style={styles.bookingDetailsMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.gold} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{b.date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.gold} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{b.startTime}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{isHindi ? "सत्र मूल्य" : "Session Price"}</Text>
                  <Text style={[styles.priceValue, { color: colors.primary }]}>₹{b.price.toLocaleString("en-IN")}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          visible={!!selectedBooking}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedBooking(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{isHindi ? "बुकिंग विवरण" : "Booking Details"}</Text>
                <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView contentContainerStyle={styles.modalScroll}>
                {/* Occasion & Status */}
                <View style={styles.modalMetaSection}>
                  <Text style={[styles.modalOccasion, { color: colors.text }]}>{selectedBooking.occasion}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[selectedBooking.status] || "#777") + "20" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[selectedBooking.status] || "#777" }]}>
                      {isHindi 
                        ? (selectedBooking.status === "Pending" ? "लंबित" : selectedBooking.status === "Confirmed" ? "स्वीकृत" : selectedBooking.status === "Completed" ? "पूर्ण" : "रद्द") 
                        : selectedBooking.status}
                    </Text>
                  </View>
                </View>

                {/* Customer Details Box */}
                <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardSectionTitle, { color: colors.gold }]}>{isHindi ? "ग्राहक जानकारी" : "Customer Info"}</Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "नाम" : "Name"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedBooking.customerName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "मोबाइल नंबर" : "Phone"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedBooking.customerPhone}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.callBtn, { backgroundColor: colors.primary + "15" }]}
                    onPress={() => handleCallCustomer(selectedBooking.customerPhone)}
                  >
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={[styles.callBtnText, { color: colors.primary }]}>{isHindi ? "ग्राहक को कॉल करें" : "Call Customer"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Session details */}
                <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
                  <Text style={[styles.cardSectionTitle, { color: colors.gold }]}>{isHindi ? "सत्र विवरण" : "Session Schedule"}</Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "तिथि" : "Date"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedBooking.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "समय" : "Time"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedBooking.startTime} – {selectedBooking.endTime}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "सत्र समय सीमा" : "Duration"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedBooking.duration} {isHindi ? "घंटे" : "hrs"}</Text>
                  </View>
                  {selectedBooking.notes ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "अनुरोध टिप्पणियाँ" : "Special Requests"}</Text>
                      <Text style={[styles.notesText, { color: colors.text, backgroundColor: colors.secondary }]}>{selectedBooking.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Financial details */}
                <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
                  <Text style={[styles.cardSectionTitle, { color: colors.gold }]}>{isHindi ? "भुगतान विवरण" : "Financial Details"}</Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "कुल मूल्य" : "Total Price"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>₹{selectedBooking.price.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "प्लेटफ़ॉर्म फीस (कमीशन)" : "Platform Commission"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>- ₹{selectedBooking.commissionAmount.toLocaleString("en-IN")} ({selectedBooking.commissionPercentApplied}%)</Text>
                  </View>
                  <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 }]}>
                    <Text style={[styles.detailLabel, { color: colors.text, fontFamily: "Poppins_600SemiBold" }]}>{isHindi ? "आपकी कमाई (नेट)" : "Your Net Earnings"}</Text>
                    <Text style={[styles.detailValue, { color: colors.primary, fontFamily: "Poppins_700Bold", fontSize: 16 }]}>
                      ₹{(selectedBooking.price - selectedBooking.commissionAmount).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "भुगतान प्रकार" : "Payment Method"}</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {selectedBooking.paymentMethod === "online" 
                        ? (isHindi ? "ऑनलाइन (UPI)" : "Online (UPI)") 
                        : selectedBooking.paymentMethod === "cash" 
                        ? (isHindi ? "नकद (Cash)" : "Cash") 
                        : (isHindi ? "लंबित" : "Pending")}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{isHindi ? "भुगतान की स्थिति" : "Payment Status"}</Text>
                    <Text style={[styles.detailValue, { color: selectedBooking.paymentStatus === "paid" ? "#10B981" : "#EF4444", fontFamily: "Poppins_600SemiBold" }]}>
                      {selectedBooking.paymentStatus === "paid" 
                        ? (isHindi ? "सफल" : "Paid") 
                        : (isHindi ? "लंबित/अवैतनिक" : "Unpaid")}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  artistProfileHeader: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_700Bold" },
  artistName: { color: "#fff", fontSize: 16, fontFamily: "Poppins_700Bold" },
  artistLoc: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 2 },
  scrollContent: { padding: 16 },
  statsGrid: { gap: 12 },
  statCardLarge: { padding: 20, borderRadius: 16, alignItems: "center", gap: 4 },
  statValueLarge: { fontSize: 32, fontFamily: "Poppins_700Bold", marginTop: 4 },
  statLabelLarge: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  statsRow: { flexDirection: "row", gap: 12 },
  statCardSmall: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 2 },
  statValueSmall: { fontSize: 18, fontFamily: "Poppins_700Bold", marginTop: 2 },
  statLabelSmall: { fontSize: 10, fontFamily: "Poppins_500Medium" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24 },
  sectionTitle: { fontSize: 15, fontFamily: "Poppins_700Bold" },
  sectionCount: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  filtersRow: { flexDirection: "row", gap: 8, marginVertical: 12 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterTabText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  emptyCard: { borderRadius: 16, borderStyle: "dashed", borderWidth: 1, padding: 40, alignItems: "center", justifyContent: "center", marginTop: 12, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  bookingItemCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  bookingRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  occasionText: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontFamily: "Poppins_700Bold" },
  customerNameText: { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 6 },
  bookingDetailsMeta: { flexDirection: "row", gap: 12, marginTop: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, fontFamily: "Poppins_500Medium" },
  divider: { height: 1, marginVertical: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  priceValue: { fontSize: 15, fontFamily: "Poppins_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { height: "80%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  modalScroll: { padding: 16 },
  modalMetaSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalOccasion: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  detailsCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
  cardSectionTitle: { fontSize: 13, fontFamily: "Poppins_700Bold", marginBottom: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 },
  detailLabel: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  detailValue: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  callBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 8, marginTop: 12 },
  callBtnText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  notesText: { fontSize: 11, padding: 8, borderRadius: 8, fontFamily: "Poppins_400Regular", marginTop: 4, lineHeight: 16 },
});
