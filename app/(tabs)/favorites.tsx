import React from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArtistCard } from "@/components/ArtistCard";
import { useApp } from "@/context/AppContext";

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

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { artists, favorites, toggleFavorite } = useApp();

  // Filter artists that are in the favorites list
  const savedArtists = artists.filter((a) => favorites.includes(a.id));

  const handleExploreArtists = () => {
    router.push("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      {/* Header — RangRiti 2.0 dark maroon gradient */}
      <LinearGradient
        colors={[DARK, MAROON]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={[styles.headerInner, isWide && styles.wideConstraint]}>
          <View style={styles.titleRow}>
            <View style={styles.titleIconWrap}>
              <Ionicons name="heart" size={18} color={GOLD} />
            </View>
            <Text style={styles.title}>Saved Artists</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Grid List of Saved Artists */}
      <FlatList
        data={savedArtists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gridItemContainer}>
            <ArtistCard
              artist={item}
              onPress={() => router.push(`/artist/${item.id}`)}
              isFavorite={true}
              onToggleFavorite={() => toggleFavorite(item.id)}
              horizontal={false}
            />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.gridRowWrapper}
        contentContainerStyle={[styles.listContent, isWide && styles.wideConstraint]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="heart-outline" size={40} color={GOLD} />
            </View>
            <Text style={styles.emptyTitle}>No Saved Artists</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart icon on any Mehndi artist's card to save them to your list.
            </Text>

            <TouchableOpacity
              onPress={handleExploreArtists}
              style={styles.actionButtonShadow}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButton}>
                <MaterialCommunityIcons name="flower" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>
                  Explore Artists
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  headerInner: {
    width: "100%",
  },
  wideConstraint: {
    maxWidth: 900,
    width: "100%",
    alignSelf: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(201,147,47,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,147,47,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: CREAM_TEXT,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 100,
  },
  gridRowWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
    gap: 12,
  },
  gridItemContainer: {
    flex: 1,
    maxWidth: "48%",
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 100,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BLUSH,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: INK,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  actionButtonShadow: {
    borderRadius: 14,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
});
