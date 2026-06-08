import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { userProfile } = useApp();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userProfile.role === null) {
        router.replace("/onboarding");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [userProfile.role]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="auth/customer-login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/artist-login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="auth/artist-register" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="artist/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="book/[artistid]" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
      <Stack.Screen name="chat/[artistid]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="payment/[bookingid]" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
      <Stack.Screen name="admin/index" options={{ animation: "slide_from_right" }} />
    </Stack>
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
