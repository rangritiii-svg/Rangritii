import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

interface ProximityMapProps {
  userCoords: { latitude: number; longitude: number } | null;
  nearbyArtists: any[];
  selectedArtistId: string | null;
  handlePinPress: (artistId: string) => void;
  cityColors: Record<string, string>;
  styles: any;
}

// ── Error boundary so a Maps crash (missing API key, Play Services issue, etc.)
// shows a graceful fallback instead of crashing the entire app ────────────────
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error, info: ErrorInfo) { console.warn("MapView error:", e, info); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={fallbackStyles.container}>
          <Ionicons name="map-outline" size={36} color="#C9932F" />
          <Text style={fallbackStyles.title}>Map unavailable</Text>
          <Text style={fallbackStyles.subtitle}>
            Could not load Google Maps.{"\n"}Switch to List view to browse artists.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const fallbackStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A0A0E",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: 24,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#FFF8F0", textAlign: "center" },
  subtitle: { fontSize: 12, color: "rgba(255,248,240,0.6)", textAlign: "center", lineHeight: 18 },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function ProximityMap({
  userCoords,
  nearbyArtists,
  selectedArtistId,
  handlePinPress,
  cityColors,
  styles,
}: ProximityMapProps) {
  if (!userCoords) return null;

  return (
    <MapErrorBoundary>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.09,
          longitudeDelta: 0.09,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {nearbyArtists.map((artist) => {
          if (artist.latitude == null || artist.longitude == null) return null;
          const isSelected = selectedArtistId === artist.id;
          const pinColor = cityColors[artist.city] || "#F9AABF";

          return (
            <Marker
              key={artist.id}
              coordinate={{
                latitude: artist.latitude,
                longitude: artist.longitude,
              }}
              onPress={() => handlePinPress(artist.id)}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={[
                    styles.pinBubble,
                    isSelected && styles.pinBubbleSelected,
                    { backgroundColor: isSelected ? "#F9AABF" : pinColor },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="flower"
                    size={isSelected ? 14 : 11}
                    color="#fff"
                  />
                </View>
                <View
                  style={[
                    styles.pinTail,
                    { borderTopColor: isSelected ? "#F9AABF" : pinColor },
                  ]}
                />
                {artist.availability === "Busy" && (
                  <View style={styles.busyDot} />
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>
    </MapErrorBoundary>
  );
}
