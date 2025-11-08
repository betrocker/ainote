// app/[...unmatched].tsx
import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text, View } from "react-native";

const AUTH_REDIRECT_PATHS = [
  "oauth-callback",
  "oauthredirect",
  "expo-auth-session",
];

export default function Unmatched() {
  const router = useRouter();
  const pathName = usePathname();
  const { t } = useTranslation("common");

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      AUTH_REDIRECT_PATHS.some((path) => pathName.includes(path))
    ) {
      router.replace("/(tabs)/home"); // ili tvoja početna ruta
    }
  }, [pathName]);

  return (
    <View className="flex-1 items-center justify-center">
      <Text>{t("auth.login.unmatched")}</Text>
    </View>
  );
}
