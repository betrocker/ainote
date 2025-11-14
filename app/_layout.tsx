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

// 🧩 Automatski koristi pravi Clerk ključ
const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
};

// Spreči automatsko skrivanje native splash-a dok se ne pripremi app
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
    "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
    "MonaSans-Black": require("../assets/fonts/MonaSans-Black.ttf"),
  });

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  const [appReady, setAppReady] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasViewedOnboarding, setHasViewedOnboarding] = useState(false);

  // ⭐ IZMENA: Sakrij native splash samo nakon AnimatedSplash
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  // 🔍 Proveri da li je onboarding odrađen
  useEffect(() => {
    (async () => {
      try {
        const viewed = await AsyncStorage.getItem("@viewedOnboarding");
        setHasViewedOnboarding(viewed === "true");
      } catch (error) {
        console.error("❌ Error checking onboarding:", error);
        setHasViewedOnboarding(true);
      } finally {
        setIsCheckingOnboarding(false);
      }
    })();
  }, []);

  // 🔔 Inicijalizuj notifikacije
  useEffect(() => {
    registerForPushNotifications().catch((err) => {
      console.error("❌ Notification registration error:", err);
    });
  }, []);

  // 📬 Ako je notifikacija tapnuta → otvori belešku
  useEffect(() => {
    if (lastNotificationResponse) {
      const noteId = lastNotificationResponse.notification.request.content.data
        ?.noteId as string | undefined;
      if (noteId) {
        setTimeout(() => {
          router.push(`/note/${noteId}` as any);
        }, 100);
      }
    }
  }, [lastNotificationResponse]);

  const handleSplashFinish = () => {
    setAppReady(true);
  };

  // ⭐ PRVO: Dok fonts i onboarding nisu ready - vrati null (native splash ostaje)
  if (!fontsLoaded || isCheckingOnboarding) {
    return null;
  }

  // ⭐ DRUGO: Prikaži AnimatedSplash (native splash još uvek vidljiv u pozadini)
  if (!appReady) {
    return <AnimatedSplash onFinish={handleSplashFinish} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ClerkProvider
          publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          tokenCache={tokenCache}
          telemetry={false}
        >
          <PremiumProvider>
            <PrivateProvider>
              <NotesProvider>
                <TabProvider>
                  <ModalProvider>
                    <SafeAreaProvider>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen
                          name="onboarding"
                          options={{
                            gestureEnabled: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="settings" />
                      </Stack>
                    </SafeAreaProvider>
                  </ModalProvider>
                </TabProvider>
              </NotesProvider>
            </PrivateProvider>
          </PremiumProvider>
        </ClerkProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
