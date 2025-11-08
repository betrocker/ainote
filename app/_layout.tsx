// app/_layout.tsx
import AnimatedSplash from "@/components/AnimatedSplash";
import { ModalProvider } from "@/context/ModalContext";
import { NotesProvider } from "@/context/NotesContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { PrivateProvider } from "@/context/PrivateContext";
import { TabProvider } from "@/context/TabContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { registerForPushNotifications } from "@/utils/notifications";
import { ClerkProvider } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import "../i18n";
import "../utils/rc-init";

const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY =
  "pk_test_dmVyaWZpZWQtYW50ZWxvcGUtNS5jbGVyay5hY2NvdW50cy5kZXYk";

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
};

// Prevent auto-hide of native splash
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // ✅ SVI HOOKS NA VRHU - UVEK SE POZIVAJU
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
    "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
    "MonaSans-Black": require("../assets/fonts/MonaSans-Black.ttf"),
  });

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // 🆕 Splash & onboarding states
  const [appReady, setAppReady] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasViewedOnboarding, setHasViewedOnboarding] = useState(false);

  // Hide native splash immediately when component mounts
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // 🆕 Check onboarding status
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const viewed = await AsyncStorage.getItem("@viewedOnboarding");
        setHasViewedOnboarding(viewed === "true");
      } catch (error) {
        console.error("❌ Error checking onboarding:", error);
        setHasViewedOnboarding(true); // Fallback - skip onboarding on error
      } finally {
        setIsCheckingOnboarding(false);
      }
    }

    checkOnboarding();
  }, []);

  useEffect(() => {
    registerForPushNotifications().catch((err) => {
      console.error("❌ Notification registration error:", err);
    });
  }, []);

  useEffect(() => {
    if (lastNotificationResponse) {
      console.log("📬 Notification tapped!");
      const noteId = lastNotificationResponse.notification.request.content.data
        ?.noteId as string | undefined;

      if (noteId) {
        console.log("📝 Navigating to note:", noteId);
        setTimeout(() => {
          router.push(`/note/${noteId}` as any);
        }, 100);
      }
    }
  }, [lastNotificationResponse]);

  const handleSplashFinish = () => {
    setAppReady(true);
  };

  // ✅ Show animated splash while loading fonts or checking onboarding
  if (!fontsLoaded || isCheckingOnboarding || !appReady) {
    return <AnimatedSplash onFinish={handleSplashFinish} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ClerkProvider
          publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
          telemetry={false}
        >
          <PrivateProvider>
            <PremiumProvider>
              <NotesProvider>
                <TabProvider>
                  <ModalProvider>
                    <SafeAreaProvider>
                      <Stack screenOptions={{ headerShown: false }}>
                        {/* 🆕 Conditional initial route */}
                        {!hasViewedOnboarding && (
                          <Stack.Screen
                            name="onboarding"
                            options={{
                              gestureEnabled: false,
                              animation: "fade",
                            }}
                          />
                        )}
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="settings" />
                      </Stack>
                    </SafeAreaProvider>
                  </ModalProvider>
                </TabProvider>
              </NotesProvider>
            </PremiumProvider>
          </PrivateProvider>
        </ClerkProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
