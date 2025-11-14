import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const [hasViewedOnboarding, setHasViewedOnboarding] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    (async () => {
      const viewed = await AsyncStorage.getItem("@viewedOnboarding");
      setHasViewedOnboarding(viewed === "true");
    })();
  }, []);

  // 🔄 Prikaz loadinga dok se state ne učita
  if (!isLoaded || hasViewedOnboarding === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🎯 Jedan return sa logikom redirecta
  if (!hasViewedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
