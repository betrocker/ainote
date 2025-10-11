import * as WebBrowser from "expo-web-browser";
import {useOAuth} from "@clerk/clerk-expo";
import {View} from "react-native";
import Button from "@/components/ui/Button";

WebBrowser.maybeCompleteAuthSession();

export default function SocialLogins() {
    const apple = useOAuth({strategy: "oauth_apple"});
    const google = useOAuth({strategy: "oauth_google"});

    const handleApple = async () => {
        if (!apple || !apple.startOAuthFlow) return;
        try {
            const {createdSessionId, setActive} = await apple.startOAuthFlow();
            if (createdSessionId) {
                await setActive!({session: createdSessionId});
            }
        } catch (err) {
            console.log("Apple login error", err);
        }
    };

    const handleGoogle = async () => {
        if (!google || !google.startOAuthFlow) return;
        try {
            const {createdSessionId, setActive} = await google.startOAuthFlow();
            if (createdSessionId) {
                await setActive!({session: createdSessionId});
            }
        } catch (err) {
            console.log("Google login error", err);
        }
    };

    return (
        <View className="mt-12 w-full space-y-3">
            <Button
                onPress={handleApple}
                disabled={!apple || !apple.startOAuthFlow}
                variant="secondary"
                className="mb-3"
            >
                Sign in with Apple
            </Button>

            <Button
                onPress={handleGoogle}
                disabled={!google || !google.startOAuthFlow}
                variant="danger"
            >
                Sign in with Google
            </Button>
        </View>
    );
}
