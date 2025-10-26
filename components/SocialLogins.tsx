// components/SocialLogins.tsx
import Button from "@/components/ui/Button";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function SocialLogins() {
  const apple = useOAuth({ strategy: "oauth_apple" });
  const google = useOAuth({ strategy: "oauth_google" });

  const handleApple = async () => {
    if (!apple || !apple.startOAuthFlow) return;
    try {
      const { createdSessionId, setActive } = await apple.startOAuthFlow();
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      }
    } catch (err) {
      console.log("Apple login error", err);
    }
  };

  const handleGoogle = async () => {
    if (!google || !google.startOAuthFlow) return;
    try {
      const { createdSessionId, setActive } = await google.startOAuthFlow();
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
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
        disabled={!apple || !apple.startOAuthFlow}
        variant="secondary"
        size="md"
        fullWidth
        className="mb-3"
      />

      <Button
        title="Sign in with Google"
        onPress={handleGoogle}
        disabled={!google || !google.startOAuthFlow}
        variant="secondary"
        size="md"
        fullWidth
      />
    </View>
  );
}
