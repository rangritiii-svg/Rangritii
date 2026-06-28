import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getTranslation } from "@/constants/locale";

const OCCASIONS = ["Wedding", "Engagement", "Festival", "Party", "Birthday", "Baby Shower", "Cultural Event", "Other"];
const OCCASION_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  "Wedding": { en: "Wedding", hi: "शादी" },
  "Engagement": { en: "Engagement", hi: "सगाई" },
  "Festival": { en: "Festival", hi: "त्यौहार" },
  "Party": { en: "Party", hi: "पार्टी" },
  "Birthday": { en: "Birthday", hi: "जन्मदिन" },
  "Baby Shower": { en: "Baby Shower", hi: "गोद भराई (Baby Shower)" },
  "Cultural Event": { en: "Cultural Event", hi: "सांस्कृतिक कार्यक्रम" },
  "Other": { en: "Other", hi: "अन्य" },
};

const DURATIONS = [
  { label: "1 Hour", value: 1 },
  { label: "2 Hours", value: 2 },
  { label: "3 Hours", value: 3 },
  { label: "4 Hours", value: 4 },
  { label: "Half Day (5h)", value: 5 },
  { label: "Full Day (8h)", value: 8 },
];
const DURATION_TRANSLATIONS: Record<number, { en: string; hi: string }> = {
  1: { en: "1 Hour", hi: "1 घंटा" },
  2: { en: "2 Hours", hi: "2 घंटे" },
  3: { en: "3 Hours", hi: "3 घंटे" },
  4: { en: "4 Hours", hi: "4 घंटे" },
  5: { en: "Half Day (5h)", hi: "आधा दिन (5 घंटे)" },
  8: { en: "Full Day (8h)", hi: "पूरा दिन (8 घंटे)" },
};

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_HI = ["जन", "फर", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टू", "नव", "दिस"];

function addTime(start: string, hours: number): string {
  const [time, period] = start.split(" ");
  const [h, m] = time.split(":").map(Number);
  let totalH = (period === "PM" && h !== 12) ? h + 12 : (period === "AM" && h === 12) ? 0 : h;
  totalH += hours;
  const newPeriod = totalH >= 12 ? "PM" : "AM";
  const displayH = totalH > 12 ? totalH - 12 : totalH === 0 ? 12 : totalH;
  return `${displayH}:${m.toString().padStart(2, "0")} ${newPeriod}`;
}

export default function BookArtistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { artistid } = useLocalSearchParams<{ artistid: string }>();
  const { getArtistById, addBooking, userProfile, commissionPercent, cancellationPolicy, language } = useApp();

  const artist = getArtistById(artistid ?? "");
  const today = new Date();
  const isHindi = language === "hi_IN";

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate next 30 days
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    const dayName = isHindi 
      ? ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"][d.getDay()]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    const monthName = isHindi ? MONTHS_HI[d.getMonth()] : MONTHS_EN[d.getMonth()];
    return {
      label: `${d.getDate()} ${monthName}`,
      day: dayName,
      value: d.toISOString().split("T")[0],
    };
  });

  const endTime = selectedStartTime ? addTime(selectedStartTime, selectedDuration) : "";
  const price = artist ? artist.hourlyRate * selectedDuration : 0;
  const commission = Math.round(price * (commissionPercent / 100));
  const totalPayable = price + commission;

  const handleSubmit = () => {
    if (!selectedDate) { Alert.alert(isHindi ? "आवश्यक" : "Required", isHindi ? "कृपया तिथि चुनें।" : "Please select a date."); return; }
    if (!selectedStartTime) { Alert.alert(isHindi ? "आवश्यक" : "Required", isHindi ? "कृपया प्रारंभ समय चुनें।" : "Please select a start time."); return; }
    if (!selectedOccasion) { Alert.alert(isHindi ? "आवश्यक" : "Required", isHindi ? "कृपया अवसर चुनें।" : "Please select an occasion."); return; }
    if (!artist) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLoading(true);

    addBooking({
      artistId: artist.id,
      artistName: artist.name,
      customerName: userProfile.name || "Customer",
      customerPhone: userProfile.phone || "",
      date: selectedDate,
      startTime: selectedStartTime,
      endTime,
      duration: selectedDuration,
      occasion: selectedOccasion,
      price,
      status: "Pending",
      paymentMethod: "pending",
      paymentStatus: "unpaid",
      notes,
    });

    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        getTranslation(language, "request_sent_title"),
        isHindi 
          ? `बुकिंग के लिए धन्यवाद! आपका बुकिंग अनुरोध भेज दिया गया है। ${artist.name} के पुष्टि करने पर आपको सूचित किया जाएगा। कृपया पुष्टि होने तक भुगतान न करें।`
          : `Thank you for booking! Your booking request has been sent to ${artist.name}. You'll be notified once they confirm. Please do not make payment until confirmed.`,
        [
          {
            text: getTranslation(language, "view_my_bookings"),
            onPress: () => {
              router.dismiss();
              router.push("/(tabs)/bookings");
            },
          },
          { text: isHindi ? "बंद करें" : "Close", style: "cancel", onPress: () => router.dismiss() },
        ]
      );
    }, 1000);
  };

  if (!artist) return (
    <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
      <Text style={{ color: colors.text }}>Artist not found</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <LinearGradient colors={["#C9932F", "#A87525"]} style={[styles.header, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.dismiss()}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getTranslation(language, "book_title")} - {artist.name}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.artistMeta}>
          <View style={styles.artistMetaLeft}>
            <LinearGradient colors={["#F9AABF", "#C9932F"]} style={styles.artistAvatar}>
              <Text style={styles.artistAvatarText}>{artist.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.artistMetaName}>{artist.name}</Text>
              <Text style={styles.artistMetaSpec}>{artist.specialization}</Text>
              <View style={styles.artistMetaRate}>
                <Text style={styles.artistMetaRateText}>₹{artist.hourlyRate}/hr</Text>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={10} color="#FCD34D" />
                  <Text style={styles.ratingPillText}>{artist.rating}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">

        {/* Request Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.secondary, borderColor: "#F9AABF" }]}>
          <Ionicons name="information-circle-outline" size={20} color="#C9932F" />
          <Text style={[styles.infoBannerText, { color: colors.text }]}>
            {isHindi 
              ? `यह ${artist.name} को एक बुकिंग अनुरोध भेजता है। भुगतान केवल आर्टिस्ट द्वारा अनुरोध की पुष्टि करने के बाद किया जाना है।`
              : `This sends a booking request to ${artist.name}. Payment is only made after the artist confirms your request.`
            }
          </Text>
        </View>

        {/* Date Selection */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>📅 {getTranslation(language, "select_date")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {dateOptions.map(d => (
            <TouchableOpacity
              key={d.value}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedDate(d.value); }}
              style={[styles.dateCard, selectedDate === d.value ? { backgroundColor: colors.gold, borderColor: colors.gold } : { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.dateCardDay, { color: selectedDate === d.value ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>{d.day}</Text>
              <Text style={[styles.dateCardDate, { color: selectedDate === d.value ? "#fff" : colors.text }]}>{d.label.split(" ")[0]}</Text>
              <Text style={[styles.dateCardMonth, { color: selectedDate === d.value ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>{d.label.split(" ")[1]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time Selection */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>⏰ {getTranslation(language, "select_time")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
          {TIME_SLOTS.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedStartTime(t); }}
              style={[styles.timeChip, selectedStartTime === t ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.timeChipText, { color: selectedStartTime === t ? colors.primaryForeground : colors.text }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Duration */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>⏳ {getTranslation(language, "select_duration")}</Text>
        <View style={styles.durationGrid}>
          {DURATIONS.map(d => (
            <TouchableOpacity
              key={d.value}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedDuration(d.value); }}
              style={[styles.durationChip, selectedDuration === d.value ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.durationChipText, { color: selectedDuration === d.value ? colors.primaryForeground : colors.text }]}>
                {DURATION_TRANSLATIONS[d.value] ? DURATION_TRANSLATIONS[d.value][isHindi ? "hi" : "en"] : d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Session Summary */}
        {selectedStartTime && (
          <View style={[styles.sessionSummary, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={styles.sessionRow}>
              <Ionicons name="time-outline" size={16} color={colors.gold} />
              <Text style={[styles.sessionText, { color: colors.text }]}>
                {isHindi ? "सत्र" : "Session"}: <Text style={{ fontFamily: "Poppins_700Bold" }}>{selectedStartTime} → {endTime}</Text>
              </Text>
            </View>
            <View style={styles.sessionRow}>
              <Ionicons name="hourglass-outline" size={16} color={colors.gold} />
              <Text style={[styles.sessionText, { color: colors.text }]}>
                {isHindi ? "अवधि" : "Duration"}: <Text style={{ fontFamily: "Poppins_700Bold" }}>
                  {selectedDuration} {selectedDuration === 1 ? (isHindi ? "घंटा" : "Hour") : (isHindi ? "घंटे" : "Hours")}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Occasion */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>🎉 {getTranslation(language, "select_occasion")}</Text>
        <View style={styles.occasionGrid}>
          {OCCASIONS.map(o => (
            <TouchableOpacity
              key={o}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedOccasion(o); }}
              style={[styles.occasionChip, selectedOccasion === o ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.occasionChipText, { color: selectedOccasion === o ? colors.primaryForeground : colors.text }]}>
                {OCCASION_TRANSLATIONS[o] ? OCCASION_TRANSLATIONS[o][isHindi ? "hi" : "en"] : o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>📝 {getTranslation(language, "special_requests")}</Text>
        <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.text }]}
            placeholder={isHindi ? "कोई विशिष्ट डिज़ाइन, रंग वरीयताएँ, या आवश्यकताएँ..." : "Any specific design, colour preferences, or requirements..."}
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
          />
        </View>

        {/* Price Breakdown */}
        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.priceCardTitle, { color: colors.text }]}>💰 {getTranslation(language, "price_estimate")}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{isHindi ? "कलाकार दर" : "Artist Rate"}</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>₹{artist.hourlyRate} × {selectedDuration}h</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{getTranslation(language, "service_amount")}</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>₹{price.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{getTranslation(language, "platform_fee")} ({commissionPercent}%)</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>₹{commission.toLocaleString("en-IN")}</Text>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.priceTotal, { color: colors.text }]}>{getTranslation(language, "total_payable")}</Text>
            <Text style={[styles.priceTotalValue, { color: colors.gold }]}>₹{totalPayable.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        {/* Cancellation Policy Section */}
        <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.priceCardTitle, { color: colors.text }]}>🛡️ {getTranslation(language, "cancellation_policy_title")}</Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 18, fontFamily: "Poppins_400Regular" }}>
            {isHindi 
              ? `• ${cancellationPolicy.tier1Hours}+ घंटे पहले रद्द करें → 100% रिफंड\n• ${cancellationPolicy.tier2Hours}-${cancellationPolicy.tier1Hours} घंटे पहले → ${cancellationPolicy.tier2RefundPercent}% रिफंड (${cancellationPolicy.tier2ArtistCompPercent}% कलाकार हर्जाना)\n• ${cancellationPolicy.tier2Hours} घंटे से कम → ${cancellationPolicy.tier3RefundPercent}% रिफंड (${cancellationPolicy.tier3ArtistCompPercent}% कलाकार हर्जाना)`
              : `• Cancel ${cancellationPolicy.tier1Hours}+ hours before → 100% refund\n• Cancel ${cancellationPolicy.tier2Hours}–${cancellationPolicy.tier1Hours} hrs → ${cancellationPolicy.tier2RefundPercent}% refund (${cancellationPolicy.tier2ArtistCompPercent}% artist comp)\n• Cancel under ${cancellationPolicy.tier2Hours} hrs → ${cancellationPolicy.tier3RefundPercent}% refund (${cancellationPolicy.tier3ArtistCompPercent}% artist comp)`
            }
          </Text>
        </View>

        {/* Payment Note */}
        <View style={[styles.paymentNote, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color="#C9932F" />
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentNoteTitle}>{isHindi ? "पुष्टि के बाद ही भुगतान करें" : "Payment After Confirmation Only"}</Text>
            <Text style={styles.paymentNoteText}>
              {isHindi 
                ? `आर्टिस्ट द्वारा पुष्टि करने के बाद रंगरीति के UPI QR/लिंक के माध्यम से भुगतान करें, या सत्र के दिन सीधे आर्टिस्ट को नकद (Cash) भुगतान करें।`
                : `Pay via Rangritii's UPI link/QR (shared after artist confirms) or choose cash payment directly to the artist.`
              }
            </Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: price > 0 && selectedDate && selectedStartTime && selectedOccasion ? colors.primary : colors.muted }]}
          onPress={handleSubmit}
          disabled={loading || !(price > 0 && selectedDate && selectedStartTime && selectedOccasion)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="send-outline" size={20} color="#fff" />
          <Text style={styles.submitBtnText}>
            {loading ? (isHindi ? "अनुरोध भेजा जा रहा है..." : "Sending Request...") : getTranslation(language, "send_request")}
          </Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
  artistMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  artistMetaLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  artistAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  artistAvatarText: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Poppins_700Bold" },
  artistMetaName: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },
  artistMetaSpec: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_400Regular" },
  artistMetaRate: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  artistMetaRateText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#FFF" },
  ratingPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  ratingPillText: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: "#fff" },
  formScroll: { padding: 16, gap: 4 },
  infoBanner: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 8, alignItems: "flex-start" },
  infoBannerText: { flex: 1, fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 18 },
  sectionLabel: { fontSize: 14, fontFamily: "Poppins_700Bold", marginTop: 16, marginBottom: 10 },
  dateRow: { gap: 8, paddingBottom: 4 },
  dateCard: { width: 58, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  dateCardDay: { fontSize: 9, fontFamily: "Poppins_500Medium" },
  dateCardDate: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  dateCardMonth: { fontSize: 9, fontFamily: "Poppins_500Medium" },
  timeRow: { gap: 8, paddingBottom: 4 },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  timeChipText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  durationChipText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  sessionSummary: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6, marginTop: 8 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sessionText: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  occasionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  occasionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  occasionChipText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  notesBox: { borderRadius: 14, borderWidth: 1, padding: 14 },
  notesInput: { fontSize: 13, fontFamily: "Poppins_400Regular", minHeight: 80, lineHeight: 20 },
  priceCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 12, gap: 8 },
  priceCardTitle: { fontSize: 14, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  priceValue: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  priceDivider: { height: 1, marginVertical: 4 },
  priceTotal: { fontSize: 15, fontFamily: "Poppins_700Bold" },
  priceTotalValue: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  priceNote: { fontSize: 10, fontFamily: "Poppins_400Regular", marginTop: 4 },
  paymentNote: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 8, alignItems: "flex-start" },
  paymentNoteTitle: { fontSize: 12, fontFamily: "Poppins_700Bold", color: "#C9932F", marginBottom: 2 },
  paymentNoteText: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#92400E", lineHeight: 16 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 16, marginTop: 20 },
  submitBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#fff" },
});
