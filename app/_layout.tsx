import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { userProfile, globalNotification } = useApp();
  const insets = useSafeAreaInsets();
  const toastY = useRef(new Animated.Value(-150)).current;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userProfile.role === null) {
        router.replace("/onboarding");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [userProfile.role]);

  useEffect(() => {
    if (globalNotification?.visible) {
      Animated.spring(toastY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    } else {
      Animated.timing(toastY, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [globalNotification?.visible]);

  const typeColors = {
    success: { bg: "#D1FAE5", border: "#10B981", text: "#065F46", icon: "checkmark-circle" },
    warning: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B", icon: "warning" },
    info: { bg: "#EFF6FF", border: "#3B82F6", text: "#1E3A8A", icon: "information-circle" },
  };

  const scheme = typeColors[globalNotification?.type || "info"];

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        <Stack.Screen name="auth/customer-login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="auth/artist-login" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="auth/artist-register" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="artist/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="artist/earnings" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="artist/rates" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="book/[artistid]" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
        <Stack.Screen name="chat/[artistid]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="payment/[bookingid]" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
        <Stack.Screen name="admin/index" options={{ animation: "slide_from_right" }} />
      </Stack>

      {/* Global Notification Banner */}
      <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastY }], top: insets.top + 10 }]}>
        <View style={[styles.toastContent, { backgroundColor: scheme.bg, borderColor: scheme.border }]}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name={scheme.icon as any} size={22} color={scheme.text} />
            <View style={{ flex: 1 }}>
              {globalNotification.title ? <Text style={[styles.toastTitle, { color: scheme.text }]}>{globalNotification.title}</Text> : null}
              {globalNotification.body ? <Text style={[styles.toastBody, { color: scheme.text }]}>{globalNotification.body}</Text> : null}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <RootLayoutNav />
          </AppProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 99999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  toastContent: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  toastTitle: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  toastBody: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
});
