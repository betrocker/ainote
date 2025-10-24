// app/(auth)/register.tsx
import SocialLogins from "@/components/SocialLogins";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Register() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-ios-bg dark:bg-iosd-bg">
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  if (isSignedIn) return <Redirect href="/(tabs)/home" />;

  const handleRegister = async () => {
    if (!isLoaded || !signUp) return;

    setError("");
    setLoading(true);

    try {
      console.log("📝 [Register] Creating account for:", email);

      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      console.log("✅ [Register] Verification email sent");
      setPendingVerification(true);
    } catch (err: any) {
      console.error("❌ [Register] Error:", err);

      const errorMsg =
        err.errors?.[0]?.message || "Registration failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !signUp) return;

    setError("");
    setLoading(true);

    try {
      console.log("🔐 [Register] Verifying email...");

      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        console.log("🎉 [Register] Account created successfully!");
        router.replace("/(tabs)/home");
      }
    } catch (err: any) {
      console.error("❌ [Register] Verification error:", err);
      setError(err.errors?.[0]?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-ios-bg dark:bg-iosd-bg"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center items-center px-6 py-12">
            {/* Logo/Icon */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 rounded-3xl bg-purple-500 items-center justify-center mb-4 shadow-lg">
                <Ionicons name="sparkles" size={40} color="#FFF" />
              </View>

              {!pendingVerification ? (
                <>
                  <Text className="text-3xl font-bold text-ios-label dark:text-iosd-label mb-2">
                    Create Account
                  </Text>
                  <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center">
                    Start capturing ideas with AI
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-3xl font-bold text-ios-label dark:text-iosd-label mb-2">
                    Verify Email
                  </Text>
                  <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center px-8">
                    Enter the code we sent to {email}
                  </Text>
                </>
              )}
            </View>

            {/* Form */}
            <View className="w-full max-w-md">
              {!pendingVerification ? (
                <>
                  <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    editable={!loading}
                  />

                  <Input
                    placeholder="Password (min. 8 characters)"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError("");
                    }}
                    secureTextEntry
                    autoComplete="password-new"
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    editable={!loading}
                  />

                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <View className="mb-4">
                      <View className="flex-row items-center">
                        <View
                          className={`flex-1 h-1 rounded-full mr-1 ${
                            password.length >= 8
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                        <View
                          className={`flex-1 h-1 rounded-full mr-1 ${
                            password.length >= 12
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                        <View
                          className={`flex-1 h-1 rounded-full ${
                            password.length >= 16
                              ? "bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                      </View>
                      <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-1">
                        {password.length < 8
                          ? "Weak"
                          : password.length < 12
                            ? "Good"
                            : "Strong"}
                      </Text>
                    </View>
                  )}

                  {error ? (
                    <View className="flex-row items-center bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                      <Ionicons name="alert-circle" size={20} color="#EF4444" />
                      <Text className="text-red-500 ml-2 flex-1 text-sm">
                        {error}
                      </Text>
                    </View>
                  ) : null}

                  <Button
                    title="Create Account"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleRegister}
                    disabled={loading || !email || password.length < 8}
                    loading={loading}
                    className="mb-3"
                  />

                  <Button
                    title="Already have an account? Login"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={() => router.push("/(auth)/login")}
                    disabled={loading}
                  />

                  {/* Divider */}
                  <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-ios-sep dark:bg-iosd-sep" />
                    <Text className="mx-4 text-sm text-ios-secondary dark:text-iosd-label2">
                      or continue with
                    </Text>
                    <View className="flex-1 h-px bg-ios-sep dark:bg-iosd-sep" />
                  </View>

                  <SocialLogins />

                  {/* Terms */}
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2 text-center mt-6 leading-5">
                    By creating an account, you agree to our Terms of Service
                    and Privacy Policy
                  </Text>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Verification Code"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      setError("");
                    }}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                    maxLength={6}
                    autoFocus
                    editable={!loading}
                  />

                  {error ? (
                    <View className="flex-row items-center bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                      <Ionicons name="alert-circle" size={20} color="#EF4444" />
                      <Text className="text-red-500 ml-2 flex-1 text-sm">
                        {error}
                      </Text>
                    </View>
                  ) : null}

                  <Button
                    title="Verify & Continue"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleVerify}
                    disabled={loading || !code}
                    loading={loading}
                    className="mb-3"
                  />

                  <Button
                    title="Back to Registration"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={() => {
                      setPendingVerification(false);
                      setCode("");
                      setError("");
                    }}
                    disabled={loading}
                    className="mb-3"
                  />

                  {/* Resend code */}
                  <TouchableOpacity
                    onPress={async () => {
                      if (!loading && signUp) {
                        try {
                          await signUp.prepareEmailAddressVerification({
                            strategy: "email_code",
                          });
                          setError("");
                        } catch (err: any) {
                          setError("Failed to resend code");
                        }
                      }
                    }}
                    disabled={loading}
                    className="py-3 items-center"
                  >
                    <Text className="text-ios-blue text-sm font-medium">
                      Didn't receive code? Resend
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
