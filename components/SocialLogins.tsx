// components/SocialLogins.tsx
import Button from "@/components/ui/Button";
import { useSSO } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function SocialLogins() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const handleApple = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_apple",
        redirectUrl: "ainote://sso-callback", // koristi tačan URL iz dashboard-a
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)/home"); // ili tvoja početna stranica
      }
    } catch (err) {
      console.log("Apple login error", err);
    }
  };

  const handleGoogle = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: "ainote://sso-callback", // koristi tačan URL iz dashboard-a
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)/home"); // ili tvoja početna stranica
      }
    } catch (err) {
      console.log("Google login error", err);
    }
  };

  return (
    <View className="w-full">
      <Button
        title="Sign in with Apple"
        onPress={handleApple}
        variant="secondary"
        size="md"
        fullWidth
        className="mb-3"
      />

      <Button
        title="Sign in with Google"
        onPress={handleGoogle}
        variant="secondary"
        size="md"
        fullWidth
      />
    </View>
  );
}
