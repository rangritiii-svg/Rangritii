import React, { useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Artist } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { StarRating } from "./StarRating";

const GRADIENT_SETS = {
  bridal: ["#F9AABF", "#C9932F"] as [string, string],
  arabic: ["#1A4A2E", "#2E7D52"] as [string, string],
  traditional: ["#4A2080", "#8B4FC7"] as [string, string],
  modern: ["#1A3A5C", "#2E6EA6"] as [string, string],
};

interface ArtistCardProps {
  artist: Artist;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  horizontal?: boolean;
}

export function ArtistCard({
  artist,
  onPress,
  isFavorite = false,
  onToggleFavorite,
  horizontal = false,
}: ArtistCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite?.();
  };

  const initials = artist.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const gradientColors = GRADIENT_SETS[artist.portfolioStyle] || GRADIENT_SETS.bridal;

  if (horizontal) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <Animated.View
          style={[
            styles.cardHorizontal,
            { transform: [{ scale }] },
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Left: Avatar container */}
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>

            {artist.verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.gold }]}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            )}

            {artist.availability === "Busy" && (
              <View style={[styles.busyBadge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.busyText}>Busy</Text>
              </View>
            )}
          </View>

          {/* Right: Info container */}
          <View style={styles.infoWrapper}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {artist.name}
              </Text>
              {onToggleFavorite && (
                <TouchableOpacity
                  onPress={handleFavoritePress}
                  style={styles.heartButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={20}
                    color={isFavorite ? colors.destructive : colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.specialization, { color: colors.mutedForeground }]}>
              {artist.specialization}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
              <Text style={[styles.location, { color: colors.mutedForeground }]}>
                {artist.city}, {artist.state}
              </Text>
            </View>

            <View style={styles.ratingRow}>
              <StarRating rating={artist.rating} size={13} showCount={true} reviewCount={artist.reviewCount} />
            </View>

            <View style={styles.footerRow}>
              <View style={styles.pillsRow}>
                {artist.styles.slice(0, 2).map((style, idx) => (
                  <View key={idx} style={[styles.pill, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.pillText, { color: colors.secondaryForeground }]}>
                      {style}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.priceText, { color: colors.text }]}>
                from <Text style={[styles.priceVal, { color: colors.secondaryForeground }]}>₹{artist.minPrice}</Text>
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  // Vertical (Grid / Search Result) layout
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <Animated.View
        style={[
          styles.cardVertical,
          { transform: [{ scale }] },
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.topSectionVertical}>
          {/* Avatar Gradient Panel */}
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradientVertical}
          >
            <Text style={styles.avatarTextVertical}>{initials}</Text>
            {artist.availability === "Busy" && (
              <View style={[styles.busyBadgeVertical, { backgroundColor: colors.destructive }]}>
                <Text style={styles.busyTextVertical}>Busy</Text>
              </View>
            )}
          </LinearGradient>

          {/* verified check top right */}
          {artist.verified && (
            <View style={[styles.verifiedBadgeVertical, { backgroundColor: colors.gold }]}>
              <MaterialCommunityIcons name="decagram" size={20} color="#FFFFFF" />
            </View>
          )}

          {/* heart toggle */}
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={handleFavoritePress}
              style={[styles.heartButtonVertical, { backgroundColor: "rgba(255, 255, 255, 0.85)" }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={18}
                color={isFavorite ? colors.destructive : colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSectionVertical}>
          <Text style={[styles.nameVertical, { color: colors.text }]} numberOfLines={1}>
            {artist.name}
          </Text>
          
          <Text style={[styles.specVertical, { color: colors.mutedForeground }]} numberOfLines={1}>
            {artist.specialization}
          </Text>

          <View style={styles.locVertical}>
            <Ionicons name="location-outline" size={11} color={colors.mutedForeground} />
            <Text style={[styles.locTextVertical, { color: colors.mutedForeground }]} numberOfLines={1}>
              {artist.city} • {artist.experience} Yrs Exp
            </Text>
          </View>

          <View style={styles.ratingVertical}>
            <StarRating rating={artist.rating} size={11} showCount={true} reviewCount={artist.reviewCount} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.priceRowVertical}>
            <Text style={[styles.priceLabelVertical, { color: colors.mutedForeground }]}>Onwards</Text>
            <Text style={[styles.priceValVertical, { color: colors.secondaryForeground }]}>₹{artist.minPrice}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardHorizontal: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1,
  },
  verifiedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  busyBadge: {
    position: "absolute",
    bottom: -2,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  busyText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
  },
  infoWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    flex: 1,
    marginRight: 4,
  },
  heartButton: {
    padding: 2,
  },
  specialization: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  ratingRow: {
    marginTop: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: "Poppins_500Medium",
  },
  priceText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  priceVal: {
    fontWeight: "700",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  // Vertical Grid layout
  cardVertical: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  topSectionVertical: {
    height: 110,
    position: "relative",
  },
  avatarGradientVertical: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextVertical: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1,
  },
  busyBadgeVertical: {
    position: "absolute",
    bottom: 6,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  busyTextVertical: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
  },
  verifiedBadgeVertical: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  heartButtonVertical: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSectionVertical: {
    padding: 12,
  },
  nameVertical: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  specVertical: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  locVertical: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  locTextVertical: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  ratingVertical: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  priceRowVertical: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabelVertical: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },
  priceValVertical: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
});
