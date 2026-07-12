import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ProximityMapProps {
  userCoords: { latitude: number; longitude: number } | null;
  nearbyArtists: any[];
  selectedArtistId: string | null;
  handlePinPress: (artistId: string) => void;
  cityColors: Record<string, string>;
  styles: any;
}

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
  );
}
