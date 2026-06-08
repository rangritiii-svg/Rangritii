import React from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ArtistCard } from "@/components/ArtistCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { artists, favorites, toggleFavorite } = useApp();

  // Filter artists that are in the favorites list
  const savedArtists = artists.filter((a) => favorites.includes(a.id));

  const handleExploreArtists = () => {
    router.push("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Saved Artists</Text>
      </View>

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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.secondary }]}>
              <Ionicons name="heart-outline" size={40} color={colors.secondaryForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Artists</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Tap the heart icon on any Mehndi artist's card to save them to your list.
            </Text>

            <TouchableOpacity
              onPress={handleExploreArtists}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>
                Explore Artists
              </Text>
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
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  listContent: {
    paddingHorizontal: 10,
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
});
