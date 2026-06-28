import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Alert, Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#F59E0B", Confirmed: "#10B981", Completed: "#6B7280", Cancelled: "#EF4444",
};

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { 
    bookings, artists, customers, adminStats, 
    updateArtistStatus, toggleUserActiveStatus, updateBookingPaymentLink,
    commissionPercent, commissionLogs, cancellationPolicy, policyLogs,
    updateCommissionPercent, updateCancellationPolicy, resolveBookingDispute,
    adminPasscode, updateAdminPasscode, updateBookingStatus,
    adminUpiId, adminQrCodeUrl, updateAdminUpiId, updateAdminQrCodeUrl
  } = useApp();

  const [tab, setTab] = useState<"overview" | "users" | "applications" | "bookings" | "payments" | "settings">("overview");
  const [usersSubTab, setUsersSubTab] = useState<"customers" | "artists">("customers");
  
  // Document request modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [docRequestReason, setDocRequestReason] = useState("");

  // Payment link modal state
  const [showPayLinkModal, setShowPayLinkModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [payLinkInput, setPayLinkInput] = useState("");

  // Settings tab input states
  const [commInput, setCommInput] = useState(commissionPercent.toString());
  const [policyTier1, setPolicyTier1] = useState(cancellationPolicy.tier1Hours.toString());
  const [policyTier2, setPolicyTier2] = useState(cancellationPolicy.tier2Hours.toString());
  const [policyTier2Refund, setPolicyTier2Refund] = useState(cancellationPolicy.tier2RefundPercent.toString());
  const [policyTier2Comp, setPolicyTier2Comp] = useState(cancellationPolicy.tier2ArtistCompPercent.toString());
  const [policyTier3Refund, setPolicyTier3Refund] = useState(cancellationPolicy.tier3RefundPercent.toString());
  const [policyTier3Comp, setPolicyTier3Comp] = useState(cancellationPolicy.tier3ArtistCompPercent.toString());
  const [passcodeInput, setPasscodeInput] = useState(adminPasscode);
  const [upiInput, setUpiInput] = useState(adminUpiId);
  const [qrInput, setQrInput] = useState(adminQrCodeUrl);

  // Keep settings inputs synchronized with context changes
  useEffect(() => {
    setCommInput(commissionPercent.toString());
    setPolicyTier1(cancellationPolicy.tier1Hours.toString());
    setPolicyTier2(cancellationPolicy.tier2Hours.toString());
    setPolicyTier2Refund(cancellationPolicy.tier2RefundPercent.toString());
    setPolicyTier2Comp(cancellationPolicy.tier2ArtistCompPercent.toString());
    setPolicyTier3Refund(cancellationPolicy.tier3RefundPercent.toString());
    setPolicyTier3Comp(cancellationPolicy.tier3ArtistCompPercent.toString());
    setPasscodeInput(adminPasscode);
    setUpiInput(adminUpiId);
    setQrInput(adminQrCodeUrl);
  }, [commissionPercent, cancellationPolicy, adminPasscode, adminUpiId, adminQrCodeUrl]);

  const handleSaveUpiDetails = async () => {
    if (!upiInput.trim()) {
      Alert.alert("Invalid Input", "UPI ID cannot be blank.");
      return;
    }
    await updateAdminUpiId(upiInput.trim());
    await updateAdminQrCodeUrl(qrInput.trim());
    Alert.alert("Settings Saved ✅", "Admin UPI ID and QR Code URL updated successfully.");
  };

  const handleSavePasscode = () => {
    if (passcodeInput.length !== 6) {
      Alert.alert("Invalid Passcode", "The administrator security passcode must be exactly 6 digits.");
      return;
    }

    Alert.alert(
      "Update Security Passcode?",
      "Are you sure you want to change the admin dashboard passcode?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update Passcode", 
          onPress: async () => {
            await updateAdminPasscode(passcodeInput);
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
            Alert.alert("Passcode Updated ✅", "The administrator security passcode has been updated successfully.");
          }
        }
      ]
    );
  };

  const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pendingCommission = bookings.filter(b => b.paymentStatus === "commission_due");

  // Onboarding applications
  const onboardingApplications = artists.filter(a => a.status === "Pending" || a.status === "NeedsDocuments");

  const handleApproveArtist = (id: string) => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
    updateArtistStatus(id, "Approved");
    Alert.alert("Approved ✅", "Mehndi artist has been successfully onboarded and is now live!");
  };

  const handleRejectArtist = (id: string) => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); } catch (_e) {}
    Alert.alert(
      "Reject Onboarding", 
      "Are you sure you want to reject this artist application?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reject", 
          style: "destructive",
          onPress: () => {
            updateArtistStatus(id, "Rejected");
            Alert.alert("Rejected ❌", "Artist application has been rejected.");
          } 
        }
      ]
    );
  };

  const handleRequestDocs = (id: string) => {
    setSelectedArtistId(id);
    setDocRequestReason("");
    setShowDocModal(true);
  };

  const submitDocRequest = () => {
    if (!docRequestReason.trim()) {
      Alert.alert("Error", "Please enter a message or documents list.");
      return;
    }
    updateArtistStatus(selectedArtistId, "NeedsDocuments", docRequestReason.trim());
    setShowDocModal(false);
    Alert.alert("Request Sent 📝", "The artist has been notified of the document requirement.");
  };

  const handleOpenPayLinkModal = (bookingId: string, currentLink?: string) => {
    setSelectedBookingId(bookingId);
    setPayLinkInput(currentLink || "");
    setShowPayLinkModal(true);
  };

  const submitPayLink = () => {
    if (!payLinkInput.trim()) {
      Alert.alert("Error", "Please enter a payment URL.");
      return;
    }
    updateBookingPaymentLink(selectedBookingId, payLinkInput.trim());
    setShowPayLinkModal(false);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
    Alert.alert("Payment Link Saved ✅", "The payment link has been saved and shared with the customer!");
  };

  const handleToggleBlockArtist = (id: string, currentStatus: string) => {
    const isBlocked = currentStatus === "Blocked";
    const actionLabel = isBlocked ? "Unblock & Reset Strikes" : "Block / Revoke Access";
    const nextStatus = isBlocked ? "Approved" : "Blocked";

    Alert.alert(
      `${actionLabel}?`, 
      `Are you sure you want to ${isBlocked ? "restore access and clear strikes for" : "block"} this artist?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: isBlocked ? "Unblock" : "Block", 
          style: isBlocked ? "default" : "destructive",
          onPress: () => {
            updateArtistStatus(id, nextStatus);
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch (_e) {}
            Alert.alert(isBlocked ? "Artist Restored ✅" : "Artist Blocked 🚫", `Artist access has been ${isBlocked ? "restored and strikes reset to 0" : "revoked"}.`);
          } 
        }
      ]
    );
  };

  const handleSaveCommission = () => {
    const val = parseInt(commInput);
    if (isNaN(val) || val < 0 || val > 100) {
      Alert.alert("Invalid Input", "Platform commission must be a percentage between 0 and 100.");
      return;
    }
    
    Alert.alert(
      "Update Commission Rate?",
      `Are you sure you want to change the platform commission rate from ${commissionPercent}% to ${val}%?\n\nThis will apply to all future bookings.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update Rate", 
          onPress: async () => {
            await updateCommissionPercent(val);
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
            Alert.alert("Success ✅", "Platform commission rate updated successfully.");
          }
        }
      ]
    );
  };

  const handleSavePolicy = () => {
    const t1 = parseInt(policyTier1);
    const t2 = parseInt(policyTier2);
    const t2Ref = parseInt(policyTier2Refund);
    const t2Comp = parseInt(policyTier2Comp);
    const t3Ref = parseInt(policyTier3Refund);
    const t3Comp = parseInt(policyTier3Comp);

    if (isNaN(t1) || isNaN(t2) || isNaN(t2Ref) || isNaN(t2Comp) || isNaN(t3Ref) || isNaN(t3Comp)) {
      Alert.alert("Invalid Input", "Please ensure all values are valid numbers.");
      return;
    }

    if (t2Ref + t2Comp > 100 || t3Ref + t3Comp > 100) {
      Alert.alert("Invalid Rules", "Sum of customer refund % and artist comp % cannot exceed 100% per tier.");
      return;
    }

    Alert.alert(
      "Update Cancellation Policy?",
      "Are you sure you want to update the cancellation thresholds and refund rules? Past bookings will preserve their old policy version.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update Policy",
          onPress: async () => {
            await updateCancellationPolicy({
              version: cancellationPolicy.version, // context increments version
              tier1Hours: t1,
              tier2Hours: t2,
              tier2RefundPercent: t2Ref,
              tier2ArtistCompPercent: t2Comp,
              tier3RefundPercent: t3Ref,
              tier3ArtistCompPercent: t3Comp,
            });
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
            Alert.alert("Success ✅", "Cancellation policy updated successfully.");
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={["#1A0A0E", "#4A1020"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="shield-crown" size={20} color="#C9932F" />
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.adminInfo}>
          <Text style={styles.adminSubtitle}>UPI: {adminUpiId}</Text>
          <Text style={styles.adminSubtitle}>Commission: {commissionPercent}%</Text>
        </View>

        {/* Admin Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {([
            { id: "overview", label: "📊 Overview" },
            { id: "users", label: "👥 Users" },
            { id: "applications", label: "📥 Applications" },
            { id: "bookings", label: "📋 Bookings" },
            { id: "payments", label: "💰 Payments" },
            { id: "settings", label: "⚙️ Settings" }
          ] as const).map(t => (
            <TouchableOpacity key={t.id} style={[styles.adminTab, tab === t.id && styles.adminTabActive]} onPress={() => setTab(t.id)}>
              <Text style={[styles.adminTabText, tab === t.id && styles.adminTabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Financials & Bookings</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="calendar-check" label="Total Bookings" value={adminStats.totalBookings.toString()} color="#6366F1" colors={colors} onPress={() => setTab("bookings")} />
              <StatCard icon="clock-outline" label="Pending" value={adminStats.pendingBookings.toString()} color="#F59E0B" colors={colors} onPress={() => setTab("bookings")} />
              <StatCard icon="check-circle-outline" label="Confirmed" value={adminStats.confirmedBookings.toString()} color="#10B981" colors={colors} onPress={() => setTab("bookings")} />
              <StatCard icon="cash" label="Total Revenue" value={`₹${adminStats.totalRevenue.toLocaleString("en-IN")}`} color="#C9932F" colors={colors} onPress={() => setTab("payments")} />
              <StatCard icon="percent" label="Commission Earned" value={`₹${adminStats.totalCommission.toLocaleString("en-IN")}`} color="#F9AABF" colors={colors} onPress={() => setTab("payments")} />
              <StatCard icon="alert-circle-outline" label="Commission Pending" value={`₹${adminStats.pendingCommission.toLocaleString("en-IN")}`} color="#EF4444" colors={colors} onPress={() => setTab("payments")} />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>👥 Platform Members</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="account-group" label="Total Customers" value={adminStats.totalCustomers.toString()} color="#10B981" colors={colors} onPress={() => { setTab("users"); setUsersSubTab("customers"); }} />
              <StatCard icon="palette" label="Total Artists" value={adminStats.totalArtists.toString()} color="#C9932F" colors={colors} onPress={() => { setTab("users"); setUsersSubTab("artists"); }} />
              <StatCard icon="folder-download" label="Pending Onboarding" value={adminStats.pendingApprovals.toString()} color="#F59E0B" colors={colors} onPress={() => setTab("applications")} />
            </View>
          </>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <>
            <View style={[styles.subTabsContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.subTabButton, usersSubTab === "customers" && { backgroundColor: colors.primary }]}
                onPress={() => setUsersSubTab("customers")}
              >
                <Text style={[styles.subTabText, { color: usersSubTab === "customers" ? colors.primaryForeground : colors.text }]}>Customers ({customers.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabButton, usersSubTab === "artists" && { backgroundColor: colors.primary }]}
                onPress={() => setUsersSubTab("artists")}
              >
                <Text style={[styles.subTabText, { color: usersSubTab === "artists" ? colors.primaryForeground : colors.text }]}>Mehndi Artists ({artists.length})</Text>
              </TouchableOpacity>
            </View>

            {/* Customers Listing */}
            {usersSubTab === "customers" ? (
              <View style={styles.listingContainer}>
                {customers.map(c => (
                  <View key={c.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.userCardHeader}>
                      <View style={styles.userInfoLeft}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
                          <Text style={[styles.avatarCircleText, { color: colors.secondaryForeground }]}>{c.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={[styles.userNameText, { color: colors.text }]}>{c.name}</Text>
                          <Text style={[styles.userSubText, { color: colors.mutedForeground }]}>{c.phone}</Text>
                          <Text style={[styles.userSubText, { color: colors.mutedForeground }]}>📍 {c.area || "Area Not Set"}, {c.city}</Text>
                        </View>
                      </View>
                      <View style={styles.userCardRight}>
                        <View style={[styles.statusIndicatorLabel, { backgroundColor: c.isActive ? "#D1FAE5" : "#FEE2E2" }]}>
                          <Text style={[styles.statusIndicatorText, { color: c.isActive ? "#059669" : "#DC2626" }]}>
                            {c.isActive ? "Active" : "Deactivated"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { borderColor: c.isActive ? colors.destructive : colors.primary }]} 
                        onPress={() => {
                          toggleUserActiveStatus(c.id, false);
                          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch (_e) {}
                        }}
                      >
                        <Text style={[styles.actionButtonText, { color: c.isActive ? colors.destructive : colors.secondaryForeground }]}>
                          {c.isActive ? "Deactivate Customer" : "Activate Customer"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {customers.length === 0 && <EmptyCard message="No registered customers found." colors={colors} />}
              </View>
            ) : (
              /* Approved / Registered Artists Listing */
              <View style={styles.listingContainer}>
                {artists.map(a => (
                  <View key={a.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.userCardHeader}>
                      <View style={styles.userInfoLeft}>
                        <View style={[styles.avatarCircle, { backgroundColor: "#FFF7ED" }]}>
                          <Text style={[styles.avatarCircleText, { color: "#C9932F" }]}>{a.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View>
                          <View style={styles.rowAlign}>
                            <Text style={[styles.userNameText, { color: colors.text }]}>{a.name}</Text>
                            {a.status === "Blocked" && (
                              <View style={[styles.statusIndicatorLabel, { backgroundColor: "#EF4444", paddingHorizontal: 6, marginLeft: 6 }]}>
                                <Text style={[styles.statusIndicatorText, { color: "#fff", fontSize: 9 }]}>Blocked</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.userSubText, { color: colors.mutedForeground }]}>{a.phone || "No phone"}</Text>
                          <Text style={[styles.userSubText, { color: colors.mutedForeground }]}>📍 {a.area}, {a.city}</Text>
                          <Text style={[styles.userSubText, { color: colors.gold, fontFamily: "Poppins_600SemiBold" }]}>₹{a.hourlyRate}/hr · Exp: {a.experience} yrs</Text>
                          <Text style={[styles.userSubText, { color: (a.strikes || 0) >= 3 ? "#EF4444" : "#D97706", fontFamily: "Poppins_600SemiBold", marginTop: 2 }]}>
                            ⚠️ Cancellation Strikes: {a.strikes || 0} / 3
                          </Text>
                        </View>
                      </View>
                      <View style={styles.userCardRight}>
                        <View style={[styles.statusIndicatorLabel, { backgroundColor: a.isActive ? "#D1FAE5" : "#FEE2E2" }]}>
                          <Text style={[styles.statusIndicatorText, { color: a.isActive ? "#059669" : "#DC2626" }]}>
                            {a.isActive ? "Active" : "Inactive"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { borderColor: colors.border, marginRight: 8 }]} 
                        onPress={() => toggleUserActiveStatus(a.id, true)}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>
                          Toggle Active/Inactive
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, { borderColor: colors.destructive }]} 
                        onPress={() => handleToggleBlockArtist(a.id, a.status)}
                      >
                        <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                          {a.status === "Blocked" ? "Unblock & Clear Strikes" : "Block / Revoke Access"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {artists.length === 0 && <EmptyCard message="No Mehndi artists found." colors={colors} />}
              </View>
            )}
          </>
        )}

        {/* ── APPLICATIONS ── */}
        {tab === "applications" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📥 Artist Onboarding ({onboardingApplications.length})</Text>
            {onboardingApplications.length === 0 ? (
              <EmptyCard message="No pending onboarding applications at this time." colors={colors} />
            ) : (
              onboardingApplications.map(a => (
                <View key={a.id} style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Title & Status */}
                  <View style={styles.appCardHeader}>
                    <View>
                      <Text style={[styles.appCardTitle, { color: colors.text }]}>{a.name}</Text>
                      <Text style={[styles.appCardSubtitle, { color: colors.mutedForeground }]}>Applied: {a.specialization} · Exp: {a.experience} Yrs</Text>
                    </View>
                    <View style={[styles.statusIndicatorLabel, { backgroundColor: a.status === "Pending" ? "#FEF3C7" : "#DBEAFE" }]}>
                      <Text style={[styles.statusIndicatorText, { color: a.status === "Pending" ? "#D97706" : "#2563EB" }]}>
                        {a.status === "Pending" ? "Pending Onboarding" : "Awaiting Docs"}
                      </Text>
                    </View>
                  </View>

                  {/* Document Request Reason (if needs docs) */}
                  {a.status === "NeedsDocuments" && a.missingDocsReason && (
                    <View style={styles.reasonBox}>
                      <Ionicons name="document-text" size={14} color="#2563EB" />
                      <Text style={styles.reasonBoxText}>Requested: "{a.missingDocsReason}"</Text>
                    </View>
                  )}

                  {/* Details summary */}
                  <View style={[styles.appDetails, { backgroundColor: colors.secondary }]}>
                    <DetailRow label="Location" value={`${a.area}, ${a.city}, ${a.state}`} colors={colors} />
                    <DetailRow label="Styles Offered" value={a.styles.join(", ")} colors={colors} />
                    <DetailRow label="Contact Phone" value={a.phone || "No phone"} colors={colors} />
                    <DetailRow label="Hourly Charge" value={`₹${a.hourlyRate}/hour`} colors={colors} />
                    <DetailRow label="Bridal Package" value={`₹${a.maxPrice}`} colors={colors} />
                    <DetailRow label="Verification ID" value="Provided (Awaiting approval)" colors={colors} />
                    <View style={styles.detailTextWrapper}>
                      <Text style={[styles.detailRowLabel, { color: colors.mutedForeground }]}>Bio:</Text>
                      <Text style={[styles.detailRowValue, { color: colors.text }]} numberOfLines={3}>"{a.bio}"</Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.appActionsRow}>
                    <TouchableOpacity style={[styles.appActionBtn, styles.btnApprove]} onPress={() => handleApproveArtist(a.id)}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.appActionBtnText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.appActionBtn, styles.btnAskDocs]} onPress={() => handleRequestDocs(a.id)}>
                      <Ionicons name="document-outline" size={16} color="#2563EB" />
                      <Text style={[styles.appActionBtnText, { color: "#2563EB" }]}>Ask Docs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.appActionBtn, styles.btnReject]} onPress={() => handleRejectArtist(a.id)}>
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={[styles.appActionBtnText, { color: "#DC2626" }]}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── BOOKINGS ── */}
        {tab === "bookings" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>All Booking Requests ({sortedBookings.length})</Text>
            {sortedBookings.length === 0 ? (
              <EmptyCard message="No bookings yet. They'll appear here once customers start booking." colors={colors} />
            ) : (
              sortedBookings.map(b => (
                <View key={b.id} style={[styles.bookingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.bookingRowHeader}>
                    <Text style={[styles.bookingRowTitle, { color: colors.text }]}>{b.customerName} → {b.artistName}</Text>
                    <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[b.status] + "22" }]}>
                      <Text style={[styles.statusPillText, { color: STATUS_COLORS[b.status] }]}>{b.status}</Text>
                    </View>
                  </View>
                  <View style={styles.bookingRowMeta}>
                    <Text style={[styles.bookingMetaText, { color: colors.mutedForeground }]}>📅 {b.date} · ⏰ {b.startTime}–{b.endTime} ({b.duration}h)</Text>
                  </View>
                  <View style={styles.bookingRowMeta}>
                    <Text style={[styles.bookingMetaText, { color: colors.mutedForeground }]}>🎉 {b.occasion}</Text>
                  </View>
                  <View style={styles.bookingAmountRow}>
                    <View>
                      <Text style={[styles.bookingAmountLabel, { color: colors.mutedForeground }]}>Booking Value</Text>
                      <Text style={[styles.bookingAmountValue, { color: colors.text }]}>₹{b.price.toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.bookingAmountLabel, { color: colors.mutedForeground }]}>Commission ({b.commissionPercentApplied}%)</Text>
                      <Text style={[styles.bookingAmountValue, { color: colors.gold }]}>₹{b.commissionAmount.toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.bookingAmountLabel, { color: colors.mutedForeground }]}>Payment</Text>
                      <Text style={[styles.bookingPaymentStatus, { color: b.paymentStatus === "paid" ? "#10B981" : b.paymentMethod === "cash" ? "#C9932F" : "#6B7280" }]}>
                        {b.paymentStatus === "paid" ? "✅ Online Paid" : b.paymentMethod === "cash" ? "💵 Cash" : "⏳ Pending"}
                      </Text>
                    </View>
                  </View>

                  {/* Accept/Decline Actions for Pending Bookings */}
                  {b.status === "Pending" && (
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: "#10B981", borderRadius: 10, paddingVertical: 8, alignItems: "center", justifyContent: "center" }}
                        onPress={() => {
                          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (_e) {}
                          updateBookingStatus(b.id, "Confirmed");
                          Alert.alert("Booking Confirmed ✅", "The booking request has been confirmed.");
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Poppins_700Bold" }}>Accept Booking</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, borderColor: colors.destructive, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center", justifyContent: "center" }}
                        onPress={() => {
                          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); } catch (_e) {}
                          Alert.alert(
                            "Decline Booking?",
                            "Are you sure you want to decline this booking request?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Decline",
                                style: "destructive",
                                onPress: () => {
                                  updateBookingStatus(b.id, "Cancelled");
                                  Alert.alert("Booking Declined ❌", "The booking request has been cancelled.");
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: "Poppins_700Bold" }}>Decline Booking</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Payment Link Section for Admin */}
                  {b.paymentMethod !== "cash" && b.status !== "Cancelled" && (
                    <View style={[styles.adminPayLinkSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 8 }]}>
                      {b.paymentLink ? (
                        <View style={styles.payLinkTextRow}>
                          <Text style={[styles.payLinkLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                            Link: <Text style={{ color: colors.primary, fontFamily: "Poppins_500Medium" }}>{b.paymentLink}</Text>
                          </Text>
                          <TouchableOpacity 
                            style={[styles.payLinkBtnMini, { borderColor: colors.border }]} 
                            onPress={() => handleOpenPayLinkModal(b.id, b.paymentLink)}
                          >
                            <Text style={[styles.payLinkBtnMiniText, { color: colors.text }]}>Edit</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.payLinkActionRow}>
                          <Text style={[styles.payLinkWarning, { color: colors.destructive }]}>⚠️ No Payment Link Given</Text>
                          <TouchableOpacity 
                            style={[styles.payLinkBtn, { backgroundColor: colors.primary }]} 
                            onPress={() => handleOpenPayLinkModal(b.id)}
                          >
                            <Ionicons name="link-outline" size={14} color="#fff" />
                            <Text style={styles.payLinkBtnText}>Set Payment Link</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* ── PAYMENTS ── */}
        {tab === "payments" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>

            <View style={[styles.revenueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={["#C9932F", "#A87525"]} style={styles.revenueCardGradient}>
                <Text style={styles.revenueTitle}>Total Platform Commission</Text>
                <Text style={styles.revenueAmount}>₹{adminStats.totalCommission.toLocaleString("en-IN")}</Text>
                <Text style={styles.revenueSubtitle}>from {adminStats.confirmedBookings} confirmed bookings</Text>
              </LinearGradient>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>💵 Cash Bookings (Commission Due)</Text>
            {pendingCommission.length === 0 ? (
              <EmptyCard message="No pending commission collections." colors={colors} />
            ) : (
              pendingCommission.map(b => (
                <View key={b.id} style={[styles.commissionRow, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
                  <View style={styles.commissionLeft}>
                    <MaterialCommunityIcons name="cash-clock" size={20} color="#C9932F" />
                    <View>
                      <Text style={[styles.commissionName, { color: "#1A0A0E" }]}>{b.artistName}</Text>
                      <Text style={styles.commissionDate}>{b.date} · {b.occasion}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.commissionAmount}>₹{b.commissionAmount.toLocaleString("en-IN")}</Text>
                    <Text style={styles.commissionDue}>Commission Due</Text>
                  </View>
                </View>
              ))
            )}

            <View style={[styles.upiBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="qrcode" size={24} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.upiBoxTitle, { color: colors.text }]}>Admin Payment Collection</Text>
                <Text style={[styles.upiBoxId, { color: colors.gold }]}>{adminUpiId}</Text>
                <Text style={[styles.upiBoxNote, { color: colors.mutedForeground }]}>Share this UPI ID with customers for online bookings. Artists pay platform commission here for cash bookings.</Text>
              </View>
            </View>
          </>
        )}

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <View style={styles.settingsContainer}>
            {/* Commission Settings Card */}
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.settingsCardTitle, { color: colors.text }]}>💰 Platform Commission Fee</Text>
              <Text style={[styles.settingsCardDesc, { color: colors.mutedForeground }]}>
                Set the percentage rate taken from bookings. Current rate: {commissionPercent}%
              </Text>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.settingsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                  keyboardType="numeric"
                  value={commInput}
                  onChangeText={setCommInput}
                  maxLength={3}
                />
                <Text style={[styles.inputUnitText, { color: colors.text }]}>%</Text>
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveCommission}>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save Commission Rate</Text>
              </TouchableOpacity>
            </View>

            {/* Admin Payment Collection Settings Card */}
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
              <Text style={[styles.settingsCardTitle, { color: colors.text }]}>💳 Admin UPI & QR Code Settings</Text>
              <Text style={[styles.settingsCardDesc, { color: colors.mutedForeground }]}>
                Configure the UPI ID and custom QR Code Image URL displayed to customers for completing bookings online.
              </Text>
              
              <Text style={{ color: colors.text, marginTop: 10, fontSize: 13, fontFamily: "Poppins_600SemiBold" }}>UPI ID</Text>
              <TextInput
                style={[styles.settingsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary, width: "100%", marginTop: 4, height: 42, paddingHorizontal: 12, borderRadius: 8 }]}
                value={upiInput}
                onChangeText={setUpiInput}
                placeholder="e.g. yourname@upi"
                autoCapitalize="none"
              />

              <Text style={{ color: colors.text, marginTop: 12, fontSize: 13, fontFamily: "Poppins_600SemiBold" }}>Custom QR Code Image URL (Optional)</Text>
              <TextInput
                style={[styles.settingsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary, width: "100%", marginTop: 4, height: 42, paddingHorizontal: 12, borderRadius: 8 }]}
                value={qrInput}
                onChangeText={setQrInput}
                placeholder="e.g. https://domain.com/qr.png"
                autoCapitalize="none"
              />
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>
                Leave empty to dynamically generate the QR Code using your UPI ID.
              </Text>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={handleSaveUpiDetails}>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save Payment Details</Text>
              </TouchableOpacity>
            </View>

            {/* Cancellation Policy Card */}
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
              <Text style={[styles.settingsCardTitle, { color: colors.text }]}>🛡️ 3-Tier Cancellation Policy (v{cancellationPolicy.version})</Text>
              <Text style={[styles.settingsCardDesc, { color: colors.mutedForeground }]}>
                Configure refund tiers and artist compensation percentages based on cancellation hours remaining.
              </Text>

              {/* Tier 1 */}
              <View style={styles.policyTierSection}>
                <Text style={[styles.policyTierTitle, { color: colors.gold }]}>Tier 1 (Full Refund Window)</Text>
                <View style={styles.policyInputGroup}>
                  <Text style={[styles.policyInputLabel, { color: colors.text }]}>Hours Remaining &gt;=</Text>
                  <TextInput
                    style={[styles.policyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    keyboardType="numeric"
                    value={policyTier1}
                    onChangeText={setPolicyTier1}
                  />
                  <Text style={[styles.policyUnitText, { color: colors.mutedForeground }]}>hrs</Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>• Customer Refund: 100% | Artist Comp: 0% (Fixed)</Text>
              </View>

              {/* Tier 2 */}
              <View style={[styles.policyTierSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }]}>
                <Text style={[styles.policyTierTitle, { color: colors.gold }]}>Tier 2 (Partial Refund Window)</Text>
                <View style={styles.policyInputGroup}>
                  <Text style={[styles.policyInputLabel, { color: colors.text }]}>Hours Remaining &gt;=</Text>
                  <TextInput
                    style={[styles.policyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    keyboardType="numeric"
                    value={policyTier2}
                    onChangeText={setPolicyTier2}
                  />
                  <Text style={[styles.policyUnitText, { color: colors.mutedForeground }]}>hrs</Text>
                </View>
                <View style={[styles.policyInputGroup, { marginTop: 6 }]}>
                  <Text style={[styles.policyInputLabel, { color: colors.text }]}>Customer Refund %</Text>
                  <TextInput
                    style={[styles.policyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    keyboardType="numeric"
                    value={policyTier2Refund}
                    onChangeText={setPolicyTier2Refund}
                  />
                  <Text style={[styles.policyUnitText, { color: colors.mutedForeground }]}>%</Text>
                </View>
                <View style={[styles.policyInputGroup, { marginTop: 6 }]}>
                  <Text style={[styles.policyInputLabel, { color: colors.text }]}>Artist Comp %</Text>
                  <TextInput
                    style={[styles.policyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    keyboardType="numeric"
                    value={policyTier2Comp}
                    onChangeText={setPolicyTier2Comp}
                  />
                  <Text style={[styles.policyUnitText, { color: colors.mutedForeground }]}>%</Text>
                </View>
              </View>

              {/* Tier 3 */}
              <View style={[styles.policyTierSection, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }]}>
                <Text style={[styles.policyTierTitle, { color: colors.gold }]}>Tier 3 (Late Cancellation Window)</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 6 }}>Triggered when hours remaining &lt; Tier 2 Hours ({policyTier2}h)</Text>
                
                <View style={styles.policyInputGroup}>
                  <Text style={[styles.policyInputLabel, { color: colors.text }]}>Customer Refund %</Text>
                  <TextInput
                    style={[styles.policyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    keyboardType="numeric"
                    value={policyTier3Refund}
                    onChangeText={setPolicyTier3Refund}
                  />
                  <Text style={[styles.policyUnitText, { color: colors.mutedForeground }]}>%</Text>
                </View>
                <View style={[styles.policyInputGroup, { marginTop: 6 }]}>
                  <Text style={[styles.policyInputLabel, { color: colors.text }]}>Artist Comp %</Text>
                  <TextInput
                    style={[styles.policyInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
                    keyboardType="numeric"
                    value={policyTier3Comp}
                    onChangeText={setPolicyTier3Comp}
                  />
                  <Text style={[styles.policyUnitText, { color: colors.mutedForeground }]}>%</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 14 }]} onPress={handleSavePolicy}>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save Cancellation Policy</Text>
              </TouchableOpacity>
            </View>

            {/* Admin Security Passcode Card */}
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
              <Text style={[styles.settingsCardTitle, { color: colors.text }]}>🔑 Admin Security Passcode</Text>
              <Text style={[styles.settingsCardDesc, { color: colors.mutedForeground }]}>
                Change the 6-digit passcode used to access the Administrator Dashboard.
              </Text>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.settingsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary, width: 140 }]}
                  keyboardType="numeric"
                  value={passcodeInput}
                  onChangeText={setPasscodeInput}
                  maxLength={6}
                  secureTextEntry={false}
                  placeholder="6-digit code"
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSavePasscode}>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Update Security Passcode</Text>
              </TouchableOpacity>
            </View>

            {/* Active Disputes Monitoring section */}
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Customer Disputes</Text>
              {bookings.filter(b => b.disputeStatus).length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.secondary, marginTop: 8 }]}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>No customer disputes reported.</Text>
                </View>
              ) : (
                bookings.filter(b => b.disputeStatus).map(b => (
                  <View key={b.id} style={[styles.disputeCard, { backgroundColor: colors.card, borderColor: b.disputeStatus === "Open" ? "#FCD34D" : colors.border, borderWidth: 1, padding: 14, borderRadius: 12, marginTop: 8 }]}>
                    <View style={styles.disputeHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontFamily: "Poppins_700Bold", color: colors.text }}>Booking #{b.id.slice(0, 8)}</Text>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>Customer: {b.customerName} | Artist: {b.artistName}</Text>
                      </View>
                      <View style={[styles.statusIndicatorLabel, { backgroundColor: b.disputeStatus === "Open" ? "#FFFBEB" : "#D1FAE5" }]}>
                        <Text style={[styles.statusIndicatorText, { color: b.disputeStatus === "Open" ? "#D97706" : "#059669" }]}>
                          {b.disputeStatus === "Open" ? "Dispute Open" : "Resolved"}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.disputeReasonBox, { backgroundColor: colors.secondary, padding: 10, borderRadius: 8, marginTop: 8 }]}>
                      <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: colors.text }}>
                        "Dispute Reason: {b.disputeReason}"
                      </Text>
                    </View>

                    {b.disputeStatus === "Open" ? (
                      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                        <TouchableOpacity 
                          style={[styles.disputeResolveBtn, { backgroundColor: "#10B981" }]}
                          onPress={() => {
                            Alert.alert(
                              "Resolve with Refund",
                              `Are you sure you want to resolve this dispute and trigger a full refund of ₹${b.price + b.commissionAmount} to ${b.customerName}?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                { 
                                  text: "Resolve & Refund", 
                                  onPress: () => {
                                    resolveBookingDispute(b.id, true);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                                    Alert.alert("Resolved ✅", "Dispute resolved and refund triggered successfully.");
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Poppins_700Bold" }}>Refund Customer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.disputeResolveBtn, { borderColor: colors.border, borderWidth: 1 }]}
                          onPress={() => {
                            Alert.alert(
                              "Resolve without Refund",
                              `Are you sure you want to resolve this dispute WITHOUT triggering a customer refund?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                { 
                                  text: "Resolve No Refund", 
                                  onPress: () => {
                                    resolveBookingDispute(b.id, false);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                                    Alert.alert("Resolved ✅", "Dispute resolved without refund.");
                                  }
                                }
                              ]
                            );
                          }}
                        >
                          <Text style={{ color: colors.text, fontSize: 11, fontFamily: "Poppins_700Bold" }}>Dismiss Dispute</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "#059669" }}>
                          ✓ Resolved. Customer Refund: ₹{b.disputeRefundAmount ?? 0}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Change History Logs Cards */}
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📜 Settings Change History</Text>

              {/* Commission change logs */}
              <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 }]}>
                <Text style={{ fontSize: 12, fontFamily: "Poppins_700Bold", color: colors.text, marginBottom: 6 }}>💰 Commission Update History</Text>
                {commissionLogs.length === 0 ? (
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>No changes logged yet.</Text>
                ) : (
                  commissionLogs.map(l => (
                    <View key={l.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: colors.text }}>
                        Commission: {l.oldPercent}% → {l.newPercent}%
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2 }}>
                        📅 {new Date(l.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* Policy change logs */}
              <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
                <Text style={{ fontSize: 12, fontFamily: "Poppins_700Bold", color: colors.text, marginBottom: 6 }}>🛡️ Cancellation Policy History</Text>
                {policyLogs.length === 0 ? (
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>No changes logged yet.</Text>
                ) : (
                  policyLogs.map(l => (
                    <View key={l.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: colors.text }}>
                        Policy Version: v{l.policy.version}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2, lineHeight: 14 }}>
                        • Tier 1: &gt;={l.policy.tier1Hours}h (100% refund){"\n"}• Tier 2: &gt;={l.policy.tier2Hours}h ({l.policy.tier2RefundPercent}% customer refund, {l.policy.tier2ArtistCompPercent}% artist comp){"\n"}• Tier 3: &lt;{l.policy.tier2Hours}h ({l.policy.tier3RefundPercent}% customer refund, {l.policy.tier3ArtistCompPercent}% artist comp)
                      </Text>
                      <Text style={{ fontSize: 9, color: colors.mutedForeground, marginTop: 2 }}>
                        📅 {new Date(l.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Document Request Modal overlay */}
      <Modal
        visible={showDocModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDocModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>📝 Request other documents</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Enter message or files list you require the artist to submit (e.g. GSTIN, Address Proof):
            </Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary }]}
              placeholder="e.g. Please upload GST Registration Certificate and Shop Act License"
              placeholderTextColor={colors.mutedForeground}
              value={docRequestReason}
              onChangeText={setDocRequestReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setShowDocModal(false)}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#2563EB", borderColor: "#2563EB" }]} onPress={submitDocRequest}>
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Link Modal overlay */}
      <Modal
        visible={showPayLinkModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPayLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>🔗 Set Payment Link</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Enter the UPI checkout or payment link given by admin (e.g. Razorpay, Paytm, GPay request URL):
            </Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.secondary, minHeight: 60 }]}
              placeholder="e.g. https://rzp.io/l/rangritii-booking-123"
              placeholderTextColor={colors.mutedForeground}
              value={payLinkInput}
              onChangeText={setPayLinkInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => setShowPayLinkModal(false)}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={submitPayLink}>
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Save Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ icon, label, value, color, colors, onPress }: any) {
  const CardContainer = onPress ? TouchableOpacity : View;
  return (
    <CardContainer 
      style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </CardContainer>
  );
}

function EmptyCard({ message, colors }: { message: string; colors: any }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.emptyCardText, { color: colors.mutedForeground }]}>{message}</Text>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailRowLabel, { color: colors.mutedForeground }]}>{label}:</Text>
      <Text style={[styles.detailRowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#fff" },
  adminInfo: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 12 },
  adminSubtitle: { fontSize: 10, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.6)" },
  tabsRow: { gap: 8, paddingBottom: 12 },
  adminTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)" },
  adminTabActive: { backgroundColor: "#C9932F" },
  adminTabText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "rgba(255,255,255,0.6)" },
  adminTabTextActive: { color: "#fff" },
  content: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  statValue: { fontSize: 18, fontFamily: "Poppins_700Bold", marginTop: 6 },
  statLabel: { fontSize: 10, fontFamily: "Poppins_400Regular" },
  
  subTabsContainer: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 4 },
  subTabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  subTabText: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  listingContainer: { gap: 12 },
  userCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  userCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  userInfoLeft: { flexDirection: "row", gap: 12, flex: 1 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarCircleText: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  userNameText: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  userSubText: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 1 },
  userCardRight: {},
  statusIndicatorLabel: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusIndicatorText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  cardActionsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)", paddingTop: 12 },
  actionButton: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center", justifyContent: "center" },
  actionButtonText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  
  appCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  appCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  appCardTitle: { fontSize: 15, fontFamily: "Poppins_700Bold" },
  appCardSubtitle: { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 1 },
  reasonBox: { flexDirection: "row", gap: 6, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 10, alignItems: "center" },
  reasonBoxText: { flex: 1, fontSize: 11, fontFamily: "Poppins_500Medium", color: "#1D4ED8" },
  appDetails: { borderRadius: 12, padding: 12, gap: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailRowLabel: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  detailRowValue: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  detailTextWrapper: { marginTop: 4 },
  appActionsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  appActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  btnApprove: { backgroundColor: "#10B981", borderColor: "#10B981" },
  btnReject: { borderColor: "#EF4444" },
  btnAskDocs: { borderColor: "#3B82F6" },
  appActionBtnText: { fontSize: 12, fontFamily: "Poppins_700Bold", color: "#fff" },
  
  bookingRow: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  bookingRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookingRowTitle: { fontSize: 13, fontFamily: "Poppins_700Bold", flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  bookingRowMeta: {},
  bookingMetaText: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  bookingAmountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  bookingAmountLabel: { fontSize: 10, fontFamily: "Poppins_400Regular" },
  bookingAmountValue: { fontSize: 13, fontFamily: "Poppins_700Bold" },
  bookingPaymentStatus: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  
  revenueCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  revenueCardGradient: { padding: 20, alignItems: "center" },
  revenueTitle: { fontSize: 13, fontFamily: "Poppins_500Medium", color: "rgba(255,255,255,0.8)" },
  revenueAmount: { fontSize: 32, fontFamily: "Poppins_700Bold", color: "#fff", marginTop: 4 },
  revenueSubtitle: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 2 },
  commissionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  commissionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  commissionName: { fontSize: 13, fontFamily: "Poppins_700Bold" },
  commissionDate: { fontSize: 11, fontFamily: "Poppins_400Regular", color: "#C9932F" },
  commissionAmount: { fontSize: 16, fontFamily: "Poppins_700Bold", color: "#C9932F" },
  commissionDue: { fontSize: 10, fontFamily: "Poppins_500Medium", color: "#92400E" },
  upiBox: { flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  upiBoxTitle: { fontSize: 13, fontFamily: "Poppins_700Bold" },
  upiBoxId: { fontSize: 12, fontFamily: "Poppins_600SemiBold", marginTop: 2 },
  upiBoxNote: { fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16, marginTop: 4 },
  emptyCard: { borderRadius: 14, padding: 20, alignItems: "center" },
  emptyCardText: { fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center" },
  
  rowAlign: { flexDirection: "row", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 320, borderRadius: 24, borderWidth: 1, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Poppins_700Bold", marginBottom: 8 },
  modalSubtitle: { fontSize: 12, fontFamily: "Poppins_400Regular", lineHeight: 16, marginBottom: 12 },
  modalInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 13, fontFamily: "Poppins_400Regular", minHeight: 80, marginBottom: 16 },
  modalActionsRow: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  modalBtnText: { fontSize: 13, fontWeight: "700", fontFamily: "Poppins_700Bold" },
  
  adminPayLinkSection: { flexDirection: "column", gap: 6 },
  payLinkTextRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  payLinkLabel: { fontSize: 11, fontFamily: "Poppins_400Regular", flex: 1 },
  payLinkBtnMini: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  payLinkBtnMiniText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  payLinkActionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  payLinkWarning: { fontSize: 11, fontFamily: "Poppins_500Medium" },
  payLinkBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  payLinkBtnText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: "#fff" },

  // Settings screen styles
  settingsContainer: { gap: 16 },
  settingsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  settingsCardTitle: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  settingsCardDesc: { fontSize: 11, fontFamily: "Poppins_400Regular", lineHeight: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsInput: { width: 80, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: "Poppins_600SemiBold", textAlign: "center" },
  inputUnitText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12 },
  saveBtnText: { fontSize: 13, fontFamily: "Poppins_700Bold", color: "#fff" },
  policyTierSection: { gap: 6 },
  policyTierTitle: { fontSize: 12, fontFamily: "Poppins_700Bold" },
  policyInputGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  policyInputLabel: { fontSize: 11, fontFamily: "Poppins_500Medium", width: 140 },
  policyInput: { width: 60, borderRadius: 8, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 12, fontFamily: "Poppins_600SemiBold", textAlign: "center" },
  policyUnitText: { fontSize: 11, fontFamily: "Poppins_400Regular" },

  // Dispute cards styles
  disputeCard: { gap: 8 },
  disputeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  disputeReasonBox: { borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  disputeResolveBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
});
