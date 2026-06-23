import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarRating } from "@/components/StarRating";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getTranslation } from "@/constants/locale";

const { width } = Dimensions.get("window");
const PORTFOLIO_THUMBNAILS = [
  require("@/assets/images/bridal_style.png"),
  require("@/assets/images/arabic_style.png"),
  require("@/assets/images/hero_banner.png"),
  require("@/assets/images/bridal_style.png"),
  require("@/assets/images/arabic_style.png"),
  require("@/assets/images/hero_banner.png"),
];

const GRADIENT_SETS = {
  bridal: ["#F9AABF", "#C9932F"] as [string, string],
  arabic: ["#1A4A2E", "#2E7D52"] as [string, string],
  traditional: ["#4A2080", "#8B4FC7"] as [string, string],
  modern: ["#1A3A5C", "#2E6EA6"] as [string, string],
};

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getArtistById, favorites, toggleFavorite, language } = useApp();

  const artist = getArtistById(id as string);
  const t = (key: any) => getTranslation(language, key);

  const getStyleDisplayName = (style: string) => {
    if (style.toLowerCase() === "rajasthani") return "Marwari";
    return style;
  };

  const getStyleStartingRate = (styleName: string) => {
    if (!artist) return 0;
    const s = styleName.toLowerCase();
    if (s.includes("bridal")) {
      return artist.maxPrice;
    }
    if (s.includes("minimal") || s.includes("simple") || s.includes("festival")) {
      return artist.minPrice;
    }
    const mid = Math.round((artist.minPrice + artist.maxPrice) / 2);
    return Math.round(mid / 100) * 100;
  };

  if (!artist) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.text }]}>Artist not found.</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: colors.primaryForeground, fontFamily: "Poppins_600SemiBold" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFav = favorites.includes(artist.id);
  const initials = artist.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const gradientColors = GRADIENT_SETS[artist.portfolioStyle] || GRADIENT_SETS.bridal;
  const isBusy = artist.availability === "Busy";

  const handleBookPress = () => {
    if (!isBusy) {
      router.push(`/book/${artist.id}`);
    }
  };

  const handleChatPress = () => {
    router.push(`/chat/${artist.id}`);
  };

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Header Banner */}
        <LinearGradient colors={gradientColors} style={[styles.coverHeader, { paddingTop: topPad + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerNavRow}>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => toggleFavorite(artist.id)}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? colors.destructive : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
          <View style={styles.coverInitialsContainer}>
            <Text style={styles.coverInitials}>{initials}</Text>
          </View>
        </LinearGradient>

        {/* Basic Details Panel */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.artistName, { color: colors.text }]}>{artist.name}</Text>
            {artist.verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.gold }]}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={[styles.specialization, { color: colors.secondaryForeground }]}>{artist.specialization}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{artist.city}, {artist.state}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="briefcase-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{artist.experience} Years Exp</Text>
            </View>
          </View>

          {/* Availability Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: isBusy ? colors.destructive : "#1A7A4A" }]} />
            <Text style={[styles.statusText, { color: isBusy ? colors.destructive : "#1A7A4A" }]}>
              {isBusy ? "Busy - Fully Booked" : "Available to Book"}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Ratings Summary */}
          <View style={styles.ratingsSummaryRow}>
            <StarRating rating={artist.rating} size={18} showCount={true} reviewCount={artist.reviewCount} />
          </View>

          {/* Styles Tags */}
          <View style={styles.stylesRow}>
            {artist.styles.map((style, idx) => (
              <View key={idx} style={[styles.stylePill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.stylePillText, { color: colors.secondaryForeground }]}>{getStyleDisplayName(style)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pricing Card / Styles starting rates list */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === "en_IN" ? "Specialized Style Rates" : "विशेष शैलियों की दरें"}
          </Text>
          <View style={{ gap: 12, marginTop: 8 }}>
            {artist.styles.map((style) => (
              <View key={style} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="brush-outline" size={16} color={colors.primary} />
                  <Text style={{ fontFamily: "Poppins_500Medium", color: colors.text }}>{getStyleDisplayName(style)}</Text>
                </View>
                <Text style={{ fontFamily: "Poppins_700Bold", color: colors.secondaryForeground }}>
                  ₹{getStyleStartingRate(style)}
                </Text>
              </View>
            ))}

            {/* Also include Full Day Package highlight */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="calendar-outline" size={16} color={colors.gold} />
                <Text style={{ fontFamily: "Poppins_600SemiBold", color: colors.text }}>
                  {language === "en_IN" ? "Full Day Package (8 hrs)" : "पूरे दिन का पैकेज (8 घंटे)"}
                </Text>
              </View>
              <Text style={{ fontFamily: "Poppins_700Bold", color: colors.gold }}>
                ₹{artist.hourlyRate * 8}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("bio")}</Text>
          <Text style={[styles.bioText, { color: colors.text }]}>{(language === "hi_IN" && artist.bioHi) ? artist.bioHi : artist.bio}</Text>
        </View>

        {/* Packages */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === "en_IN" ? "Mehndi Packages" : "मेहंदी पैकेज"}
          </Text>
          {artist.packages && artist.packages.length > 0 ? (
            artist.packages.map((pkg) => (
              <View key={pkg.id} style={[styles.packageCard, { borderColor: colors.border }]}>
                <View style={styles.packageHeader}>
                  <Text style={[styles.packageName, { color: colors.text }]}>
                    {language === "en_IN" ? pkg.nameEn : pkg.nameHi}
                  </Text>
                  <Text style={styles.packagePrice}>₹{pkg.price}</Text>
                </View>
                <Text style={[styles.packageDesc, { color: colors.mutedForeground }]}>
                  {language === "en_IN" ? pkg.descriptionEn : pkg.descriptionHi}
                </Text>
                <View style={styles.packageDurationRow}>
                  <Ionicons name="time-outline" size={12} color={colors.gold} />
                  <Text style={[styles.packageDurationText, { color: colors.gold }]}>
                    {pkg.durationHours} {language === "en_IN" ? "hours" : "घंटे"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noPackagesText, { color: colors.mutedForeground }]}>
              {language === "en_IN" ? "No packages listed." : "कोई पैकेज सूचीबद्ध नहीं है।"}
            </Text>
          )}
        </View>

        {/* Portfolio Gallery */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === "en_IN" ? "Portfolio" : "पोर्टफोलियो"}</Text>
          <View style={styles.galleryGrid}>
            {PORTFOLIO_THUMBNAILS.map((img, idx) => (
              <View key={idx} style={styles.galleryImageWrapper}>
                <Image source={img} style={styles.galleryImage} resizeMode="cover" />
              </View>
            ))}
          </View>
        </View>

        {/* Reviews List */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("reviews")} ({artist.reviews.length})</Text>
          {artist.reviews.length > 0 ? (
            artist.reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewUserRow}>
                  <View style={[styles.reviewAvatar, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.reviewAvatarText, { color: colors.secondaryForeground }]}>
                      {rev.userName.slice(0, 1)}
                    </Text>
                  </View>
                  <View style={styles.reviewUserMeta}>
                    <Text style={[styles.reviewUserName, { color: colors.text }]}>{rev.userName}</Text>
                    <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                      {rev.date} • {rev.occasion}
                    </Text>
                  </View>
                  <StarRating rating={rev.rating} size={11} />
                </View>
                <Text style={[styles.reviewComment, { color: colors.text }]}>{rev.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noReviewsText, { color: colors.mutedForeground }]}>
              No reviews yet. Be the first to book and write a review!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(16, insets.bottom) }]}>
        <TouchableOpacity
          style={[
            styles.bookBtn,
            {
              backgroundColor: isBusy ? colors.muted : colors.primary,
              flex: 1,
            },
          ]}
          onPress={handleBookPress}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          <Text style={[styles.bookBtnText, { color: isBusy ? colors.mutedForeground : colors.primaryForeground }]}>
            {isBusy ? (language === "en_IN" ? "Busy" : "व्यस्त") : t("book_now")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  coverHeader: {
    height: 180,
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInitialsContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  coverInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1,
  },
  detailsCard: {
    marginHorizontal: 20,
    marginTop: 46,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  artistName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  specialization: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    marginTop: 2,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 14,
  },
  ratingsSummaryRow: {
    marginBottom: 10,
  },
  stylesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  stylePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stylePillText: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Poppins_500Medium",
  },
  sectionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
  },
  priceColumn: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  priceDivider: {
    width: 1,
    height: "80%",
    alignSelf: "center",
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Poppins_400Regular",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  galleryImageWrapper: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewUserRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  reviewUserMeta: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  reviewComment: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins_400Regular",
    marginTop: 6,
    paddingLeft: 42,
  },
  noReviewsText: {
    fontSize: 12,
    fontStyle: "italic",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    paddingVertical: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    height: 52,
    gap: 6,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  bookBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    height: 52,
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  packageCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  packageName: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    flex: 1,
  },
  packagePrice: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#C85C00",
  },
  packageDesc: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    lineHeight: 16,
  },
  packageDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  packageDurationText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  noPackagesText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
  },
});
