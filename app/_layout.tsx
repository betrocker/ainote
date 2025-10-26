// app/_layout.tsx
import { ModalProvider } from "@/context/ModalContext";
import { NotesProvider } from "@/context/NotesContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { TabProvider } from "@/context/TabContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "@/i18n";
import { registerForPushNotifications } from "@/utils/notifications";
import { ClerkProvider } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import "../utils/rc-init";

const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY =
  "pk_test_dmVyaWZpZWQtYW50ZWxvcGUtNS5jbGVyay5hY2NvdW50cy5kZXYk";

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
};

export default function RootLayout() {
  const router = useRouter();

  // ⭐ Hook za handling notification tap
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    // ⭐ Register notifications
    registerForPushNotifications().catch((err) => {
      console.error("❌ Notification registration error:", err);
    });
  }, []);

  useEffect(() => {
    if (lastNotificationResponse) {
      console.log("📬 Notification tapped!");
      console.log(
        "📦 Response data:",
        lastNotificationResponse.notification.request.content.data
      );

      const noteId = lastNotificationResponse.notification.request.content.data
        ?.noteId as string | undefined;

      if (noteId) {
        console.log("📝 Navigating to note:", noteId);
        router.push(`/note/[id]`);

        setTimeout(() => {
          router.push(`/note/${noteId}`);
        }, 100);
      }
    }
  }, [lastNotificationResponse]);

  const [fontsLoaded] = useFonts({
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
    "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
    "MonaSans-Black": require("../assets/fonts/MonaSans-Black.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-ios-surface dark:bg-iosd-surface">
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ClerkProvider
          publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
          telemetry={false}
        >
          {/* ⭐ PremiumProvider sada interno konfiguriše RevenueCat */}
          <PremiumProvider>
            <NotesProvider>
              <TabProvider>
                <ModalProvider>
                  <SafeAreaProvider>
                    <Stack screenOptions={{ headerShown: false }}>
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
        </ClerkProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
