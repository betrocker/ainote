import {useAuth, useSignUp} from "@clerk/clerk-expo";
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

export default function Register() {
    const {isSignedIn, isLoaded: authLoaded} = useAuth();
    const {isLoaded, signUp, setActive} = useSignUp();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [error, setError] = useState("");

    if (!authLoaded) return null;
    if (isSignedIn) return <Redirect href="/(tabs)/home"/>;

    const handleRegister = async () => {
        if (!isLoaded || !signUp) return;
        try {
            await signUp.create({emailAddress: email, password});
            await signUp.prepareEmailAddressVerification({strategy: "email_code"});
            setPendingVerification(true);
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Registration error");
        }
    };

    const handleVerify = async () => {
        if (!isLoaded || !signUp) return;
        try {
            const result = await signUp.attemptEmailAddressVerification({code});
            if (result.status === "complete") {
                await setActive!({session: result.createdSessionId});
                router.replace("/(tabs)/home");
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || "Verification failed");
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="flex-1 justify-center items-center bg-white/80 dark:bg-black/70 px-6">
                <Text className="text-3xl font-bold mb-8 text-ios-label dark:text-iosd-label">
                    Create Account
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

                        <Button onPress={handleRegister}>Sign Up</Button>

                        <Button
                            variant="secondary"
                            onPress={() => router.push("/(auth)/login")}
                            className="mt-4"
                        >
                            Already have an account? Login
                        </Button>

                        <SocialLogins/>
                    </>
                ) : (
                    <>
                        <Text className="text-lg text-ios-label dark:text-iosd-label mb-4">
                            Enter the code we sent to your email
                        </Text>

                        <Input
                            placeholder="Verification Code"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="number-pad"
                            returnKeyType="done"
                        />

                        {error ? <Text className="text-red-500 mb-3">{error}</Text> : null}

                        <Button onPress={handleVerify}>Verify Email</Button>
                    </>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}
