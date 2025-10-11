import {useAuth, useSignIn} from "@clerk/clerk-expo";
import {Redirect, router} from "expo-router";
import {
    View,
    Text,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import {useState} from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SocialLogins from "@/components/SocialLogins";

export default function Login() {
    const {isSignedIn, isLoaded: authLoaded} = useAuth();
    const {isLoaded, signIn, setActive} = useSignIn();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [error, setError] = useState("");

    if (!authLoaded) return null;
    if (isSignedIn) return <Redirect href="/(tabs)/home"/>;

    const handleLogin = async () => {
        if (!isLoaded || !signIn) return;
        try {
            const result = await signIn.create({identifier: email, password});
            if (
                result.status === "needs_first_factor" ||
                result.status === "needs_second_factor"
            ) {
                setPendingVerification(true);
            } else if (result.status === "complete") {
                await setActive!({session: result.createdSessionId});
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Login error");
        }
    };

    const handleVerify = async () => {
        if (!isLoaded || !signIn) return;
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "email_code",
                code,
            });
            if (result.status === "complete") {
                await setActive!({session: result.createdSessionId});
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Verification failed");
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="flex-1 justify-center items-center bg-white/80 dark:bg-black/70">
                <Text className="text-3xl font-bold mb-8 text-ios-label dark:text-iosd-label">
                    Welcome Back
                </Text>

                {!pendingVerification ? (
                    <>
                        <Input
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            returnKeyType="next"
                        />

                        <Input
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            returnKeyType="done"
                        />

                        {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

                        <Button onPress={handleLogin}>Sign In</Button>

                        <Button
                            variant="secondary"
                            onPress={() => router.push("/(auth)/register")}
                            className="mt-4"
                        >
                            Don’t have an account? Register
                        </Button>

                        <SocialLogins/>
                    </>
                ) : (
                    <>
                        <Text className="text-lg text-ios-label dark:text-iosd-label mb-4">
                            Enter the code sent to your email
                        </Text>

                        <Input
                            placeholder="Verification Code"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            returnKeyType="done"
                        />

                        {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

                        <Button onPress={handleVerify}>Verify</Button>
                    </>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}
