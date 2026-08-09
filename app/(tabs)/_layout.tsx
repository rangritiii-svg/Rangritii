import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* RangRiti 2.0 palette */
const DARK = "#1A0A0E";
const GOLD = "#C9932F";
const INACTIVE = "rgba(253,248,241,0.45)";
const GOLD_BORDER = "rgba(201,147,47,0.35)";

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Poppins_500Medium", marginBottom: 2 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : DARK,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: GOLD_BORDER,
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          height: Platform.OS === "android" ? 64 + safeAreaInsets.bottom : 60 + safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <View style={StyleSheet.absoluteFill}>
              <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(26,10,14,0.88)", borderTopWidth: 1, borderTopColor: GOLD_BORDER }]} />
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: DARK, borderTopWidth: 1, borderTopColor: GOLD_BORDER }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
