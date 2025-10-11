import ScreenScroll from "@/components/ScreenScroll";
import { useAuth } from "@clerk/clerk-expo";
import Header from "@components/Header";
import ScreenBackground from "@components/ScreenBackground";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function AssistantScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  // ista visina kao u Header.tsx

  return (
    <ScreenBackground variant="plain">
      {/* Header fiksiran na vrhu */}
      <Header
        title={t("screen.assistant.title")}
        rightIcon="settings-outline"
        onRightPress={() => router.push("/settings")}
      />

      {/* Skrolujući sadržaj */}
      <ScreenScroll
        contentContainerStyle={{
           // 👈 gura sadržaj ispod hedera
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} className="mb-6">
            <Text className="h1 mb-2 text-white">Section {i + 1}</Text>
            <Text className="section-title mb-1 text-white/80">{t("assistant.today")}</Text>
            <Text className="body mb-3 text-white/70">
              You have 3 new notes
            </Text>
            <Text className="h2 text-white">{t("assistant.askAnything")}</Text>
            <Text className="caption mt-1 text-white/80">{t("assistant.powered")}</Text>
          </View>
        ))}
      </ScreenScroll>
    </ScreenBackground>
  );
}