// app/sso-callback.tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirektuj na početnu stranicu nakon SSO callback-a
    router.replace("/(tabs)/home");
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
