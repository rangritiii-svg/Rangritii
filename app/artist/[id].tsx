import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarRating } from "@/components/StarRating";
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
const DISABLED_GRAD = ["#EADFD2", "#EADFD2"] as [string, string];

const PORTFOLIO_THUMBNAILS = [
  require("@/assets/images/bridal_style.png"),
  require("@/assets/images/arabic_style.png"),
  require("@/assets/images/hero_banner.png"),
  require("@/assets/images/bridal_style.png"),
  require("@/assets/images/arabic_style.png"),
  require("@/assets/images/hero_banner.png"),
];

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getArtistById, favorites, toggleFavorite, language } = useApp();

  const artist = getArtistById(id as string);
  const t = (key: any) => getTranslation(language, key);

  const contentW = Math.min(width, 900);
  const galleryItemSize = (contentW - 96) / 3;

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
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Artist not found.</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85}>
          <LinearGradient colors={GOLD_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.backBtn}>
            <Text style={{ color: "#FFFFFF", fontFamily: "Poppins_700Bold" }}>Go Back</Text>
          </LinearGradient>
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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Header Banner */}
        <LinearGradient colors={[DARK, MAROON, "#6E1830"]} style={[styles.coverHeader, { paddingTop: topPad + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <MaterialCommunityIcons name="flower" size={130} color="rgba(201,147,47,0.12)" style={styles.coverDeco} />
          <View style={styles.headerNavRow}>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={CREAM_ON_DARK} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => toggleFavorite(artist.id)}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? "#EF4444" : CREAM_ON_DARK} />
            </TouchableOpacity>
          </View>
          <View style={styles.coverInitialsContainer}>
            <Text style={styles.coverInitials}>{initials}</Text>
          </View>
        </LinearGradient>

        <View style={styles.pageBody}>
          {/* Basic Details Panel */}
          <View style={styles.detailsCard}>
            <View style={styles.titleRow}>
              <Text style={styles.artistName}>{artist.name}</Text>
              {artist.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.specialization}>{artist.specialization}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={MUTED} />
                <Text style={styles.metaText}>{artist.city}, {artist.state}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="briefcase-outline" size={14} color={MUTED} />
                <Text style={styles.metaText}>{artist.experience} Years Exp</Text>
              </View>
            </View>

            {/* Availability Status */}
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: isBusy ? "#EF4444" : "#1A7A4A" }]} />
              <Text style={[styles.statusText, { color: isBusy ? "#EF4444" : "#1A7A4A" }]}>
                {isBusy ? "Busy - Fully Booked" : "Available to Book"}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Ratings Summary */}
            <View style={styles.ratingsSummaryRow}>
              <StarRating rating={artist.rating} size={18} showCount={true} reviewCount={artist.reviewCount} />
            </View>

            {/* Styles Tags */}
            <View style={styles.stylesRow}>
              {artist.styles.map((style, idx) => (
                <View key={idx} style={styles.stylePill}>
                  <Text style={styles.stylePillText}>{getStyleDisplayName(style)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing Card / Styles starting rates list */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {language === "en_IN" ? "Specialized Style Rates" : "विशेष शैलियों की दरें"}
            </Text>
            <View style={{ gap: 12, marginTop: 8 }}>
              {artist.styles.map((style) => (
                <View key={style} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="brush-outline" size={16} color={GOLD} />
                    <Text style={{ fontFamily: "Poppins_500Medium", color: INK }}>{getStyleDisplayName(style)}</Text>
                  </View>
                  <Text style={{ fontFamily: "Poppins_700Bold", color: GOLD }}>
                    ₹{getStyleStartingRate(style)}
                  </Text>
                </View>
              ))}

              {/* Also include Full Day Package highlight */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12, marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="calendar-outline" size={16} color={GOLD} />
                  <Text style={{ fontFamily: "Poppins_600SemiBold", color: INK }}>
                    {language === "en_IN" ? "Full Day Package (8 hrs)" : "पूरे दिन का पैकेज (8 घंटे)"}
                  </Text>
                </View>
                <Text style={{ fontFamily: "Poppins_700Bold", color: GOLD }}>
                  ₹{artist.hourlyRate * 8}
                </Text>
              </View>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t("bio")}</Text>
            <Text style={styles.bioText}>{(language === "hi_IN" && artist.bioHi) ? artist.bioHi : artist.bio}</Text>
          </View>

          {/* Packages */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              {language === "en_IN" ? "Mehndi Packages" : "मेहंदी पैकेज"}
            </Text>
            {artist.packages && artist.packages.length > 0 ? (
              artist.packages.map((pkg) => (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageName}>
                      {language === "en_IN" ? pkg.nameEn : pkg.nameHi}
                    </Text>
                    <Text style={styles.packagePrice}>₹{pkg.price}</Text>
                  </View>
                  <Text style={styles.packageDesc}>
                    {language === "en_IN" ? pkg.descriptionEn : pkg.descriptionHi}
                  </Text>
                  <View style={styles.packageDurationRow}>
                    <Ionicons name="time-outline" size={12} color={GOLD} />
                    <Text style={styles.packageDurationText}>
                      {pkg.durationHours} {language === "en_IN" ? "hours" : "घंटे"}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noPackagesText}>
                {language === "en_IN" ? "No packages listed." : "कोई पैकेज सूचीबद्ध नहीं है।"}
              </Text>
            )}
          </View>

          {/* Portfolio Gallery */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{language === "en_IN" ? "Portfolio" : "पोर्टफोलियो"}</Text>
            <View style={styles.galleryGrid}>
              {((artist.portfolioImages && artist.portfolioImages.length > 0) ? artist.portfolioImages : PORTFOLIO_THUMBNAILS).map((img, idx) => {
                const isUri = typeof img === "string";
                return (
                  <View key={idx} style={[styles.galleryImageWrapper, { width: galleryItemSize, height: galleryItemSize }]}>
                    <Image source={isUri ? { uri: img } : img} style={styles.galleryImage} resizeMode="cover" />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Reviews List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t("reviews")} ({artist.reviews.length})</Text>
            {artist.reviews.length > 0 ? (
              artist.reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewUserRow}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>
                        {rev.userName.slice(0, 1)}
                      </Text>
                    </View>
                    <View style={styles.reviewUserMeta}>
                      <Text style={styles.reviewUserName}>{rev.userName}</Text>
                      <Text style={styles.reviewDate}>
                        {rev.date} • {rev.occasion}
                      </Text>
                    </View>
                    <StarRating rating={rev.rating} size={11} />
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to book and write a review!
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={[styles.bookBtnWrap, !isBusy && styles.bookBtnShadow]}
            onPress={handleBookPress}
            disabled={isBusy}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isBusy ? DISABLED_GRAD : GOLD_GRAD}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtn}
            >
              <Text style={[styles.bookBtnText, { color: isBusy ? MUTED : "#FFFFFF" }]}>
                {isBusy ? (language === "en_IN" ? "Busy" : "व्यस्त") : t("book_now")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  pageBody: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
    backgroundColor: CREAM,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: INK,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  coverHeader: {
    height: 190,
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  coverDeco: {
    position: "absolute",
    top: 12,
    right: 16,
  },
  headerNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,248,240,0.10)",
    borderWidth: 1,
    borderColor: "rgba(253,248,241,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInitialsContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(201,147,47,0.20)",
    borderWidth: 2.5,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: -30,
    alignSelf: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  coverInitials: {
    fontSize: 32,
    fontWeight: "700",
    color: CREAM_ON_DARK,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1,
  },
  detailsCard: {
    marginHorizontal: 20,
    marginTop: 46,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    shadowColor: MAROON,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    color: INK,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  specialization: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    marginTop: 2,
    textAlign: "center",
    color: MAROON_TEXT,
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
    color: MUTED,
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
    backgroundColor: BORDER,
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: BLUSH,
  },
  stylePillText: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Poppins_500Medium",
    color: MAROON_TEXT,
  },
  sectionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    padding: 18,
    shadowColor: MAROON,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: GOLD_DARK,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Poppins_400Regular",
    color: INK,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  galleryImageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: BLUSH,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: MAROON_TEXT,
  },
  reviewUserMeta: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: INK,
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: MUTED,
  },
  reviewComment: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins_400Regular",
    marginTop: 6,
    paddingLeft: 42,
    color: INK,
  },
  noReviewsText: {
    fontSize: 12,
    fontStyle: "italic",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    paddingVertical: 12,
    color: MUTED,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  bottomBarInner: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  bookBtnWrap: {
    flex: 1,
    borderRadius: 16,
  },
  bookBtnShadow: {
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bookBtn: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
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
    borderColor: BORDER,
    backgroundColor: "#FFFDF9",
    borderRadius: 14,
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
    color: INK,
  },
  packagePrice: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: GOLD,
  },
  packageDesc: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    lineHeight: 16,
    color: MUTED,
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
    color: GOLD,
  },
  noPackagesText: {
    fontSize: 12.5,
    fontFamily: "Poppins_400Regular",
    color: MUTED,
    textAlign: "center",
    paddingVertical: 10,
  },
});
