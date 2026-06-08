import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Animated
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArtistCard } from "@/components/ArtistCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const SERVICE_FILTERS = ["All", "Bridal", "Arabic", "Traditional", "Modern", "Rajasthani", "Indo-Western", "Minimal"];
const GRADIENT_SETS: Record<string, [string, string]> = {
  bridal: ["#F9AABF", "#C9932F"],
  arabic: ["#1A4A2E", "#2E7D52"],
  traditional: ["#4A2080", "#8B4FC7"],
  modern: ["#1A3A5C", "#2E6EA6"],
};

// Mock map pin positions (relative % of map area)
const PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  a1: { x: 0.72, y: 0.55 }, // Mumbai
  a2: { x: 0.50, y: 0.25 }, // Delhi
  a3: { x: 0.42, y: 0.35 }, // Jaipur
  a4: { x: 0.55, y: 0.65 }, // Hyderabad
  a5: { x: 0.52, y: 0.72 }, // Bangalore
  a6: { x: 0.55, y: 0.33 }, // Lucknow
  a7: { x: 0.57, y: 0.78 }, // Chennai
  a8: { x: 0.40, y: 0.52 }, // Ahmedabad
};

const CITY_COLORS: Record<string, string> = {
  Mumbai: "#F9AABF", Delhi: "#A78BFA", Jaipur: "#FBBF24",
  Hyderabad: "#34D399", Bangalore: "#60A5FA", Lucknow: "#F87171",
  Chennai: "#FB923C", Ahmedabad: "#A3E635",
};

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { artists, favorites, toggleFavorite, userProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return artists.filter(a => {
      const isApprovedActive = a.status === "Approved" && a.isActive;
      const matchesFilter = selectedFilter === "All" || a.styles.some(s => s.toLowerCase().includes(selectedFilter.toLowerCase()));
      const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.city.toLowerCase().includes(searchQuery.toLowerCase()) || a.styles.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) || a.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      return isApprovedActive && matchesFilter && matchesSearch;
    });
  }, [artists, selectedFilter, searchQuery]);

  const nearbyArtists = useMemo(() => {
    if (!userProfile.city) return filtered;
    const sameCity = filtered.filter(a => a.city.toLowerCase() === userProfile.city.toLowerCase());
    const otherCity = filtered.filter(a => a.city.toLowerCase() !== userProfile.city.toLowerCase());
    return [...sameCity, ...otherCity];
  }, [filtered, userProfile.city]);

  const selectedArtist = selectedArtistId ? artists.find(a => a.id === selectedArtistId) : null;

  const handlePinPress = (artistId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedArtistId(prev => prev === artistId ? null : artistId);
  };

  const MAP_H = height * 0.42;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <LinearGradient colors={["#F9AABF", "#FDEDF3"]} style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarInner}>
          <View style={styles.greetingRow}>
            <MaterialCommunityIcons name="flower" size={20} color="#C9932F" />
            <Text style={styles.greeting}>
              {userProfile.name ? `Hi ${userProfile.name.split(" ")[0]}` : "Discover"}
            </Text>
            {userProfile.city ? (
              <View style={styles.locationPill}>
                <Ionicons name="location" size={12} color="#F9AABF" />
                <Text style={styles.locationPillText}>{userProfile.city}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity style={[styles.viewToggleBtn, viewMode === "map" && { backgroundColor: "#F9AABF" }]} onPress={() => setViewMode("map")}>
              <Ionicons name="map-outline" size={16} color={viewMode === "map" ? "#fff" : "#A07888"} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.viewToggleBtn, viewMode === "list" && { backgroundColor: "#F9AABF" }]} onPress={() => setViewMode("list")}>
              <Feather name="list" size={16} color={viewMode === "list" ? "#fff" : "#A07888"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: "#fff" }]}>
          <Feather name="search" size={18} color="#A07888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artist, city, service type..."
            placeholderTextColor="#A07888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#A07888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Service Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {SERVICE_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedFilter(f); }}
              style={[styles.filterChip, selectedFilter === f ? styles.filterChipActive : styles.filterChipInactive]}
            >
              <Text style={[styles.filterChipText, { color: selectedFilter === f ? "#fff" : "#7A3050" }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Results count */}
      <View style={[styles.resultsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.resultsText, { color: colors.mutedForeground }]}>
          <Text style={{ fontFamily: "Poppins_700Bold", color: colors.text }}>{nearbyArtists.length}</Text> artists found
          {selectedFilter !== "All" ? ` · ${selectedFilter}` : ""}
          {userProfile.city ? ` near ${userProfile.city}` : " across India"}
        </Text>
      </View>

      {/* ─── MAP VIEW ─── */}
      {viewMode === "map" && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* India Map Background */}
          <View style={[styles.mapContainer, { height: MAP_H, backgroundColor: "#E8F4F8" }]}>
            {/* Map background gradient */}
            <LinearGradient
              colors={["#D4EAF7", "#B8DFF5", "#C5E8C5"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />

            {/* Decorative grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map(p => (
              <View key={`h${p}`} style={[styles.gridLineH, { top: `${p * 100}%` as any }]} />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map(p => (
              <View key={`v${p}`} style={[styles.gridLineV, { left: `${p * 100}%` as any }]} />
            ))}

            {/* Map Label */}
            <View style={styles.mapLabel}>
              <Ionicons name="map" size={12} color="#5B8DB8" />
              <Text style={styles.mapLabelText}>India · {nearbyArtists.length} Artists</Text>
            </View>

            {/* Artist Pins */}
            {nearbyArtists.map(artist => {
              const pos = PIN_POSITIONS[artist.id];
              if (!pos) return null;
              const pinColor = CITY_COLORS[artist.city] || "#F9AABF";
              const isSelected = selectedArtistId === artist.id;
              const isInFiltered = filtered.some(a => a.id === artist.id);
              if (!isInFiltered) return null;

              return (
                <TouchableOpacity
                  key={artist.id}
                  style={[styles.mapPin, { left: pos.x * (width - 32), top: pos.y * MAP_H - 36, zIndex: isSelected ? 10 : 1 }]}
                  onPress={() => handlePinPress(artist.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pinBubble, isSelected && styles.pinBubbleSelected, { backgroundColor: isSelected ? "#F9AABF" : pinColor }]}>
                    <MaterialCommunityIcons name="flower" size={isSelected ? 14 : 11} color="#fff" />
                  </View>
                  <View style={[styles.pinTail, { borderTopColor: isSelected ? "#F9AABF" : pinColor }]} />
                  {isSelected && (
                    <View style={[styles.pinLabel, { backgroundColor: "#fff" }]}>
                      <Text style={styles.pinLabelText} numberOfLines={1}>{artist.name}</Text>
                    </View>
                  )}
                  {artist.availability === "Busy" && (
                    <View style={styles.busyDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Artist Card */}
          {selectedArtist && (
            <TouchableOpacity
              style={[styles.selectedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/artist/${selectedArtist.id}`)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={GRADIENT_SETS[selectedArtist.portfolioStyle] || GRADIENT_SETS.bridal}
                style={styles.selectedCardGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.selectedCardInitials}>
                  {selectedArtist.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </LinearGradient>
              <View style={styles.selectedCardInfo}>
                <View style={styles.selectedCardNameRow}>
                  <Text style={[styles.selectedCardName, { color: colors.text }]} numberOfLines={1}>{selectedArtist.name}</Text>
                  {selectedArtist.verified && <Ionicons name="checkmark-circle" size={14} color={colors.gold} />}
                </View>
                <Text style={[styles.selectedCardSpec, { color: colors.mutedForeground }]} numberOfLines={1}>{selectedArtist.specialization}</Text>
                <View style={styles.selectedCardMeta}>
                  <Ionicons name="location-outline" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.selectedCardMetaText, { color: colors.mutedForeground }]}>{selectedArtist.area}, {selectedArtist.city}</Text>
                  <View style={styles.dot} />
                  <Text style={[styles.selectedCardMetaText, { color: colors.gold }]}>₹{selectedArtist.hourlyRate}/hr</Text>
                </View>
                <View style={[styles.availBadge, { backgroundColor: selectedArtist.availability === "Available" ? "#DCFCE7" : "#FEE2E2" }]}>
                  <View style={[styles.availDot, { backgroundColor: selectedArtist.availability === "Available" ? "#16A34A" : "#DC2626" }]} />
                  <Text style={[styles.availText, { color: selectedArtist.availability === "Available" ? "#16A34A" : "#DC2626" }]}>{selectedArtist.availability}</Text>
                </View>
              </View>
              <View style={[styles.viewProfileBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.viewProfileText}>View</Text>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Near You Section */}
          <View style={styles.nearYouSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {userProfile.city ? `📍 Near ${userProfile.city}` : "🌏 All Artists"}
            </Text>
            {nearbyArtists.map(artist => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                horizontal
                isFavorite={favorites.includes(artist.id)}
                onToggleFavorite={() => toggleFavorite(artist.id)}
                onPress={() => router.push(`/artist/${artist.id}`)}
              />
            ))}
            {nearbyArtists.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="flower-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No artists found for "{searchQuery}"</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === "list" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {nearbyArtists.map(artist => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              horizontal
              isFavorite={favorites.includes(artist.id)}
              onToggleFavorite={() => toggleFavorite(artist.id)}
              onPress={() => router.push(`/artist/${artist.id}`)}
            />
          ))}
          {nearbyArtists.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name="flower-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No artists found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingBottom: 12 },
  topBarInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  greeting: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#4A1020" },
  locationPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  locationPillText: { fontSize: 11, fontFamily: "Poppins_500Medium", color: "#7A3050" },
  viewToggle: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 10, padding: 3, gap: 3 },
  viewToggleBtn: { padding: 6, borderRadius: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular", color: "#1A0A0E" },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  filterChipActive: { backgroundColor: "#C9932F" },
  filterChipInactive: { backgroundColor: "rgba(255,255,255,0.6)" },
  filterChipText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  resultsBar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  resultsText: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  mapContainer: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: "hidden", position: "relative" },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(91,141,184,0.15)" },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(91,141,184,0.15)" },
  mapLabel: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.8)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  mapLabelText: { fontSize: 10, fontFamily: "Poppins_500Medium", color: "#5B8DB8" },
  mapPin: { position: "absolute", alignItems: "center" },
  pinBubble: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
  pinBubbleSelected: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: "#fff" },
  pinTail: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: "transparent", borderRightColor: "transparent", marginTop: -1 },
  pinLabel: { position: "absolute", bottom: -22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, minWidth: 80, alignItems: "center" },
  pinLabelText: { fontSize: 9, fontFamily: "Poppins_600SemiBold", color: "#1A0A0E" },
  busyDot: { position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },
  selectedCard: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 12, gap: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  selectedCardGradient: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  selectedCardInitials: { fontSize: 18, fontWeight: "700", color: "#fff", fontFamily: "Poppins_700Bold" },
  selectedCardInfo: { flex: 1, gap: 2 },
  selectedCardNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  selectedCardName: { fontSize: 14, fontFamily: "Poppins_700Bold", flex: 1 },
  selectedCardSpec: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  selectedCardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  selectedCardMetaText: { fontSize: 10, fontFamily: "Poppins_400Regular" },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#D1D5DB" },
  availBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, alignSelf: "flex-start", marginTop: 2 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 10, fontFamily: "Poppins_600SemiBold" },
  viewProfileBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  viewProfileText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#fff" },
  nearYouSection: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },
  sectionTitle: { fontSize: 16, fontFamily: "Poppins_700Bold", marginBottom: 14 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },
  emptyState: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center" },
});
