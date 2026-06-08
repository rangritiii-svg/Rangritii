import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface StarRatingProps {
  rating: number;
  size?: number;
  showCount?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 16, showCount = false, reviewCount }: StarRatingProps) {
  const colors = useColors();
  const stars = [];

  // Generate stars based on rating
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // Full Star
      stars.push(<Ionicons key={i} name="star" size={size} color={colors.gold} />);
    } else if (rating > i - 1 && rating < i) {
      // Half Star
      stars.push(<Ionicons key={i} name="star-half" size={size} color={colors.gold} />);
    } else {
      // Empty Star
      stars.push(<Ionicons key={i} name="star-outline" size={size} color={colors.gold} />);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{stars}</View>
      {showCount && (
        <View style={styles.textRow}>
          <Text style={[styles.ratingVal, { color: colors.text }]}>{rating.toFixed(1)}</Text>
          {reviewCount !== undefined && (
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              ({reviewCount})
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  countText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
});
