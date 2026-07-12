import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

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
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={["#D4EAF7", "#B8DFF5", "#C5E8C5"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Decorative grid lines */}
      {[0.2, 0.4, 0.6, 0.8].map((p, idx) => (
        <View key={`h${idx}`} style={[styles.gridLineH, { top: `${p * 100}%` as any }]} />
      ))}
      {[0.2, 0.4, 0.6, 0.8].map((p, idx) => (
        <View key={`v${idx}`} style={[styles.gridLineV, { left: `${p * 100}%` as any }]} />
      ))}

      {/* Web Info Overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(26,10,14,0.15)",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.92)",
            borderRadius: 16,
            padding: 16,
            alignItems: "center",
            maxWidth: 320,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Ionicons name="phone-portrait-outline" size={32} color="#C9932F" />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#1A0A0E",
              marginTop: 8,
              textAlign: "center",
              fontFamily: "Poppins_700Bold",
            }}
          >
            Native Maps Available in App
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: "#7A3050",
              marginTop: 4,
              textAlign: "center",
              fontFamily: "Poppins_400Regular",
              lineHeight: 16,
            }}
          >
            Please download the native Android APK to access real-time location tracking, GPS geo-tagging, and proximity map pins!
          </Text>
        </View>
      </View>
    </View>
  );
}
