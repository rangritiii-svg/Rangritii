import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArtistCard } from "@/components/ArtistCard";
import { SearchBar } from "@/components/SearchBar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CITIES = ["All Cities", "Mumbai", "Delhi", "Jaipur", "Hyderabad", "Bangalore", "Lucknow", "Chennai", "Ahmedabad"];
const STYLES = ["All Styles", "Bridal", "Arabic", "Traditional", "Modern", "Minimal", "Indo-Western"];
const BUDGETS = ["Any Budget", "Under ₹2,000", "₹2,000-5,000", "₹5,000-10,000", "₹10,000+"];
const SORTS = [
  { id: "rating", label: "Top Rated ⭐" },
  { id: "price", label: "Price: Low to High 💰" }
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { artists, favorites, toggleFavorite } = useApp();

  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedStyle, setSelectedStyle] = useState("All Styles");
  const [selectedBudget, setSelectedBudget] = useState("Any Budget");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

  // Filters logic
  const filtered = artists.filter((a) => {
    const matchStatus = a.status === "Approved" && a.isActive;

    const matchQuery =
      query === "" ||
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.city.toLowerCase().includes(query.toLowerCase()) ||
      a.specialization.toLowerCase().includes(query.toLowerCase());

    const matchCity = selectedCity === "All Cities" || a.city === selectedCity;

    const matchStyle =
      selectedStyle === "All Styles" || a.styles.includes(selectedStyle);

    const matchBudget =
      selectedBudget === "Any Budget" ||
      (selectedBudget === "Under ₹2,000" && a.minPrice < 2000) ||
      (selectedBudget === "₹2,000-5,000" && a.minPrice >= 2000 && a.minPrice <= 5000) ||
      (selectedBudget === "₹5,000-10,000" && a.minPrice >= 5000 && a.minPrice <= 10000) ||
      (selectedBudget === "₹10,000+" && a.minPrice > 10000);

    return matchStatus && matchQuery && matchCity && matchStyle && matchBudget;
  }).sort((a, b) => {
    if (sortBy === "rating") {
      return b.rating - a.rating;
    } else {
      return a.minPrice - b.minPrice;
    }
  });

  const handleClearAll = () => {
    setQuery("");
    setSelectedCity("All Cities");
    setSelectedStyle("All Styles");
    setSelectedBudget("Any Budget");
    setSortBy("rating");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      {/* Search Header Row */}
      <View style={[styles.searchHeaderRow, isWide && styles.wideConstraint]}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search artists, cities..."
            autoFocus={false}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterToggleBtn,
            {
              backgroundColor: showFilters ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={showFilters ? colors.primaryForeground : colors.secondaryForeground}
          />
        </TouchableOpacity>
      </View>

      {/* Expandable Advanced Filters Panel */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }, isWide && styles.wideConstraint]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Filter Section: City */}
            <Text style={[styles.filterHeading, { color: colors.text }]}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  onPress={() => setSelectedCity(city)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedCity === city ? colors.gold : "transparent",
                      borderColor: selectedCity === city ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedCity === city ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filter Section: Style */}
            <Text style={[styles.filterHeading, { color: colors.text }]}>Mehndi Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
              {STYLES.map((style) => (
                <TouchableOpacity
                  key={style}
                  onPress={() => setSelectedStyle(style)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedStyle === style ? colors.gold : "transparent",
                      borderColor: selectedStyle === style ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedStyle === style ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {style}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filter Section: Budget */}
            <Text style={[styles.filterHeading, { color: colors.text }]}>Starting Budget</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
              {BUDGETS.map((budget) => (
                <TouchableOpacity
                  key={budget}
                  onPress={() => setSelectedBudget(budget)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selectedBudget === budget ? colors.gold : "transparent",
                      borderColor: selectedBudget === budget ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedBudget === budget ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {budget}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Filter Section: Sort By */}
            <Text style={[styles.filterHeading, { color: colors.text }]}>Sort By</Text>
            <View style={styles.filterChipsRow}>
              {SORTS.map((sort) => (
                <TouchableOpacity
                  key={sort.id}
                  onPress={() => setSortBy(sort.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: sortBy === sort.id ? colors.gold : "transparent",
                      borderColor: sortBy === sort.id ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: sortBy === sort.id ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reset Button */}
            <TouchableOpacity onPress={handleClearAll} style={styles.resetButton}>
              <Ionicons name="refresh-outline" size={14} color={colors.secondaryForeground} />
              <Text style={[styles.resetButtonText, { color: colors.secondaryForeground }]}>Clear All Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Dynamic Results Counter */}
      <View style={[styles.resultsCounterRow, isWide && styles.wideConstraint]}>
        <Text style={[styles.counterText, { color: colors.mutedForeground }]}>
          Found {filtered.length} {filtered.length === 1 ? "artist" : "artists"} matching filters
        </Text>
      </View>

      {/* Results Grid list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gridItemContainer}>
            <ArtistCard
              artist={item}
              onPress={() => router.push(`/artist/${item.id}`)}
              isFavorite={favorites.includes(item.id)}
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
            <Ionicons name="search-outline" size={64} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Artists Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Try adjusting your query, city, budget, or styles options.
            </Text>
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.emptyActionText, { color: colors.primaryForeground }]}>Reset All Filters</Text>
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
  wideConstraint: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
  },
  searchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
    marginVertical: 4,
  },
  searchContainer: {
    flex: 1,
  },
  filterToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filtersPanel: {
    maxHeight: 280,
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  filtersScroll: {
    flex: 1,
  },
  filterHeading: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterChipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 16,
    marginBottom: 8,
    gap: 6,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
  resultsCounterRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  counterText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
});
