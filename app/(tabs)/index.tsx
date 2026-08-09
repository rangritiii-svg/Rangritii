import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  Dimensions, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Animated,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProximityMap from "@/components/ProximityMap";
import { ArtistCard } from "@/components/ArtistCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getCurrentCoordinates, getDistanceKm } from "@/utils/permissions";

const { width, height } = Dimensions.get("window");

/* RangRiti 2.0 design language (see app/onboarding.tsx) */
const MAROON = "#4A1020";
const DARK = "#1A0A0E";
const GOLD = "#C9932F";
const GOLD_DARK = "#A87525";
const CREAM = "#FFF8F0";
const CREAM_TEXT = "#FDF8F1";
const INK = "#2A1020";
const MUTED = "#8A6070";
const CARD_BORDER = "#F5D0DC";

const SERVICE_FILTERS = ["All", "Bridal", "Arabic", "Traditional", "Marwari", "Modern Bridal", "Indo-Western", "Minimal"];

const FILTER_TRANSLATIONS: Record<string, { en: string; hi: string }> = {
  "All": { en: "All", hi: "सभी" },
  "Bridal": { en: "Bridal", hi: "दुल्हन" },
  "Arabic": { en: "Arabic", hi: "अरेबिक" },
  "Traditional": { en: "Traditional", hi: "पारंपरिक" },
  "Marwari": { en: "Marwari", hi: "मारवाड़ी" },
  "Modern Bridal": { en: "Modern Bridal", hi: "मॉडर्न ब्राइडल" },
  "Indo-Western": { en: "Indo-Western", hi: "इन्डो-वेस्टर्न" },
  "Minimal": { en: "Minimal", hi: "न्यूनतम" },
};

const getFilterLabel = (filter: string, lang: string) => {
  const translation = FILTER_TRANSLATIONS[filter];
  if (!translation) return filter;
  return lang === "hi_IN" ? translation.hi : translation.en;
};

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
  const { width: winWidth } = useWindowDimensions();
  const isWide = winWidth >= 900;
  const { artists, favorites, toggleFavorite, userProfile, language } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      if (userProfile.latitude != null && userProfile.longitude != null) {
        setUserCoords({
          latitude: userProfile.latitude,
          longitude: userProfile.longitude,
        });
        return;
      }

      setLoadingLocation(true);
      const coords = await getCurrentCoordinates(language === "hi_IN");
      if (coords) {
        setUserCoords({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      } else {
        const cityLower = (userProfile.city || "").toLowerCase();
        if (cityLower.includes("jaipur")) {
          setUserCoords({ latitude: 26.9124, longitude: 75.7873 });
        } else if (cityLower.includes("mumbai")) {
          setUserCoords({ latitude: 19.0760, longitude: 72.8777 });
        } else if (cityLower.includes("delhi")) {
          setUserCoords({ latitude: 28.6139, longitude: 77.2090 });
        } else if (cityLower.includes("bangalore") || cityLower.includes("bengaluru")) {
          setUserCoords({ latitude: 12.9716, longitude: 77.5946 });
        } else if (cityLower.includes("hyderabad")) {
          setUserCoords({ latitude: 17.3850, longitude: 78.4867 });
        } else {
          setUserCoords({ latitude: 26.9124, longitude: 75.7873 });
        }
      }
      setLoadingLocation(false);
    };

    fetchLocation();
  }, [userProfile.latitude, userProfile.longitude, userProfile.city]);

  const filtered = useMemo(() => {
    return artists.filter(a => {
      const isApprovedActive = a.status === "Approved" && a.isActive;
      const matchesFilter = selectedFilter === "All" || a.styles.some(s => s.toLowerCase().includes(selectedFilter.toLowerCase()));
      const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.city.toLowerCase().includes(searchQuery.toLowerCase()) || a.styles.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) || a.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      return isApprovedActive && matchesFilter && matchesSearch;
    });
  }, [artists, selectedFilter, searchQuery]);

  const nearbyArtists = useMemo(() => {
    if (!userCoords) {
      return filtered.map(a => ({ ...a, distance: undefined }));
    }

    const withDistance = filtered.map(a => {
      let distance: number | undefined = undefined;
      if (a.latitude != null && a.longitude != null) {
        distance = getDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          a.latitude,
          a.longitude
        );
      }
      return { ...a, distance };
    });

    return withDistance.sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  }, [filtered, userCoords]);

  const selectedArtist = selectedArtistId ? nearbyArtists.find(a => a.id === selectedArtistId) : null;

  const handlePinPress = (artistId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedArtistId(prev => prev === artistId ? null : artistId);
  };

  const MAP_H = height * 0.42;

  return (
    <View style={[styles.container, { backgroundColor: CREAM }]}>
      {/* Top Bar */}
      <LinearGradient colors={[DARK, MAROON]} style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <View style={styles.topBarInner}>
            <View style={styles.greetingRow}>
              <MaterialCommunityIcons name="flower" size={20} color={GOLD} />
              <Text style={styles.greeting}>
                {userProfile.name ? `Hi ${userProfile.name.split(" ")[0]}` : "Discover"}
              </Text>
              {userProfile.city ? (
                <View style={styles.locationPill}>
                  <Ionicons name="location" size={12} color={GOLD} />
                  <Text style={styles.locationPillText}>{userProfile.city}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.viewToggle}>
              <TouchableOpacity style={[styles.viewToggleBtn, viewMode === "map" && { backgroundColor: GOLD }]} onPress={() => setViewMode("map")}>
                <Ionicons name="map-outline" size={16} color={viewMode === "map" ? "#fff" : "rgba(253,248,241,0.65)"} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.viewToggleBtn, viewMode === "list" && { backgroundColor: GOLD }]} onPress={() => setViewMode("list")}>
                <Feather name="list" size={16} color={viewMode === "list" ? "#fff" : "rgba(253,248,241,0.65)"} />
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
                <Text style={[styles.filterChipText, { color: selectedFilter === f ? "#fff" : CREAM_TEXT }]}>
                  {getFilterLabel(f, language)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Results count */}
      <View style={[styles.resultsBar, { backgroundColor: CREAM, borderBottomColor: CARD_BORDER }]}>
        <Text style={[styles.resultsText, { color: MUTED }]}>
          {language === "hi_IN" ? (
            <>
              <Text style={{ fontFamily: "Poppins_700Bold", color: INK }}>{nearbyArtists.length}</Text> कलाकार मिले
              {selectedFilter !== "All" ? ` · ${getFilterLabel(selectedFilter, language)}` : ""}
              {userProfile.city ? ` (${userProfile.city} के पास)` : " (संपूर्ण भारत)"}
            </>
          ) : (
            <>
              <Text style={{ fontFamily: "Poppins_700Bold", color: INK }}>{nearbyArtists.length}</Text> artists found
              {selectedFilter !== "All" ? ` · ${getFilterLabel(selectedFilter, language)}` : ""}
              {userProfile.city ? ` near ${userProfile.city}` : " across India"}
            </>
          )}
        </Text>
      </View>

      {/* ─── MAP VIEW ─── */}
      {viewMode === "map" && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={isWide ? styles.scrollWide : undefined}>
          {/* Real Native MapView (or Web Grid Mockup) */}
          <View style={[styles.mapContainer, { height: MAP_H, backgroundColor: "#E8F4F8" }]}>
            {userCoords && (
              <ProximityMap
                userCoords={userCoords}
                nearbyArtists={nearbyArtists}
                selectedArtistId={selectedArtistId}
                handlePinPress={handlePinPress}
                cityColors={CITY_COLORS}
                styles={styles}
              />
            )}

            {/* Map Label */}
            <View style={styles.mapLabel}>
              <Ionicons name="map" size={12} color={GOLD} />
              <Text style={styles.mapLabelText}>
                {userProfile.city || "Nearby"} · {nearbyArtists.length} Artists
              </Text>
            </View>
          </View>

          {/* Selected Artist Card */}
          {selectedArtist && (
            <TouchableOpacity
              style={[styles.selectedCard, { backgroundColor: "#FFFFFF", borderColor: CARD_BORDER }]}
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
                  <Text style={[styles.selectedCardName, { color: INK }]} numberOfLines={1}>{selectedArtist.name}</Text>
                  {selectedArtist.verified && <Ionicons name="checkmark-circle" size={14} color={GOLD} />}
                </View>
                <Text style={[styles.selectedCardSpec, { color: MUTED }]} numberOfLines={1}>{selectedArtist.specialization}</Text>
                <View style={styles.selectedCardMeta}>
                  <Ionicons name="location-outline" size={11} color={MUTED} />
                  <Text style={[styles.selectedCardMetaText, { color: MUTED }]} numberOfLines={1}>
                    {selectedArtist.area}, {selectedArtist.city}
                    {selectedArtist.distance != null && ` • ${selectedArtist.distance.toFixed(1)} km`}
                  </Text>
                  <View style={styles.dot} />
                  <Text style={[styles.selectedCardMetaText, { color: GOLD_DARK }]}>₹{selectedArtist.hourlyRate}/hr</Text>
                </View>
                <View style={[styles.availBadge, { backgroundColor: selectedArtist.availability === "Available" ? "#DCFCE7" : "#FEE2E2" }]}>
                  <View style={[styles.availDot, { backgroundColor: selectedArtist.availability === "Available" ? "#16A34A" : "#DC2626" }]} />
                  <Text style={[styles.availText, { color: selectedArtist.availability === "Available" ? "#16A34A" : "#DC2626" }]}>{selectedArtist.availability}</Text>
                </View>
              </View>
              <LinearGradient colors={[GOLD, GOLD_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.viewProfileBtn}>
                <Text style={styles.viewProfileText}>View</Text>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Near You Section */}
          <View style={styles.nearYouSection}>
            <Text style={[styles.sectionTitle, { color: INK }]}>
              {userProfile.city ? `📍 Near ${userProfile.city}` : "🌏 All Artists"}
            </Text>
            <View style={isWide ? styles.cardsGridWide : undefined}>
              {nearbyArtists.map(artist => (
                <View key={artist.id} style={isWide ? styles.gridItemWide : undefined}>
                  <ArtistCard
                    artist={artist}
                    horizontal
                    distance={artist.distance}
                    isFavorite={favorites.includes(artist.id)}
                    onToggleFavorite={() => toggleFavorite(artist.id)}
                    onPress={() => router.push(`/artist/${artist.id}`)}
                  />
                </View>
              ))}
            </View>
            {nearbyArtists.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: "#FFFFFF", borderColor: CARD_BORDER }]}>
                <MaterialCommunityIcons name="flower-outline" size={40} color={MUTED} />
                <Text style={[styles.emptyText, { color: MUTED }]}>No artists found for "{searchQuery}"</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ─── LIST VIEW ─── */}
      {viewMode === "list" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.listContent, isWide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
          <View style={isWide ? styles.cardsGridWide : undefined}>
            {nearbyArtists.map(artist => (
              <View key={artist.id} style={isWide ? styles.gridItemWide : undefined}>
                <ArtistCard
                  artist={artist}
                  horizontal
                  distance={artist.distance}
                  isFavorite={favorites.includes(artist.id)}
                  onToggleFavorite={() => toggleFavorite(artist.id)}
                  onPress={() => router.push(`/artist/${artist.id}`)}
                />
              </View>
            ))}
          </View>
          {nearbyArtists.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: "#FFFFFF", borderColor: CARD_BORDER }]}>
              <MaterialCommunityIcons name="flower-outline" size={40} color={MUTED} />
              <Text style={[styles.emptyText, { color: MUTED }]}>No artists found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingBottom: 14 },
  headerInner: { width: "100%", maxWidth: 1120, alignSelf: "center" },
  topBarInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  greeting: { fontSize: 18, fontFamily: "Poppins_700Bold", color: CREAM_TEXT },
  locationPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,248,240,0.12)", borderWidth: 1, borderColor: "rgba(201,147,47,0.4)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  locationPillText: { fontSize: 11, fontFamily: "Poppins_500Medium", color: CREAM_TEXT },
  viewToggle: { flexDirection: "row", backgroundColor: "rgba(255,248,240,0.12)", borderRadius: 10, padding: 3, gap: 3 },
  viewToggleBtn: { padding: 6, borderRadius: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "Poppins_400Regular", color: "#1A0A0E" },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  filterChipInactive: { backgroundColor: "rgba(255,248,240,0.12)", borderColor: "rgba(255,248,240,0.22)" },
  filterChipText: { fontSize: 12, fontFamily: "Poppins_600SemiBold" },
  resultsBar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  resultsText: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  mapContainer: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: "hidden", position: "relative", borderWidth: 1.5, borderColor: "rgba(201,147,47,0.35)" },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(91,141,184,0.15)" },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(91,141,184,0.15)" },
  mapLabel: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(26,10,14,0.7)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  mapLabelText: { fontSize: 10, fontFamily: "Poppins_500Medium", color: CREAM_TEXT },
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
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: "Poppins_400Regular", textAlign: "center" },
  /* Wide-web layout */
  scrollWide: { width: "100%", maxWidth: 1120, alignSelf: "center" },
  cardsGridWide: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItemWide: { width: "48.8%" },
});
