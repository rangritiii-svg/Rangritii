import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Booking } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG = {
  Pending: { color: "#F59E0B", bg: "#FFFBEB", icon: "time-outline" as const },
  Confirmed: { color: "#C9932F", bg: "#FFF8EC", icon: "checkmark-circle-outline" as const },
  Completed: { color: "#1A7A4A", bg: "#EBF7F1", icon: "checkmark-circle-outline" as const },
  Cancelled: { color: "#EF4444", bg: "#FEF2F2", icon: "close-circle-outline" as const },
};

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const colors = useColors();
  const status = booking.status || "Pending";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top section: Artist & Status badge */}
      <View style={styles.topRow}>
        <View style={styles.artistGroup}>
          <Ionicons name="person-outline" size={16} color={colors.secondaryForeground} />
          <Text style={[styles.artistName, { color: colors.text }]}>{booking.artistName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={12} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{status}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Middle section: Booking Details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="sparkles-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.text }]}>{booking.occasion}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.text }]}>{booking.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.text }]}>{booking.startTime}–{booking.endTime}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.priceText, { color: colors.secondaryForeground }]}>₹{booking.price}</Text>
        </View>
      </View>

      {/* Bottom section: Notes (if any) */}
      {booking.notes && booking.notes.trim().length > 0 && (
        <View style={[styles.notesContainer, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.notesLabel, { color: colors.secondaryForeground }]}>Note:</Text>
          <Text style={[styles.notesText, { color: colors.text }]} numberOfLines={1}>
            "{booking.notes}"
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  artistGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  notesText: {
    fontSize: 11,
    fontStyle: "italic",
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
});
