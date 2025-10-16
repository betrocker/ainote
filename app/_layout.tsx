import { ModalProvider } from "@/context/ModalContext";
import { NotesProvider } from "@/context/NotesContext";
import { SemanticNotesProvider } from "@/context/SemanticNotesContext";
import { TabProvider } from "@/context/TabContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "@/i18n";
import { ClerkProvider } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY =
  "pk_test_dmVyaWZpZWQtYW50ZWxvcGUtNS5jbGVyay5hY2NvdW50cy5kZXYk";

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
    "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
    "MonaSans-Black": require("../assets/fonts/MonaSans-Black.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-ios-surface dark:bg-iosd-surface">
        <ActivityIndicator />
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
          <NotesProvider>
            <SemanticNotesProvider>
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
            </SemanticNotesProvider>
          </NotesProvider>
        </ClerkProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
