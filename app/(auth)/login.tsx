// app/(auth)/login.tsx
import SocialLogins from "@/components/SocialLogins";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth, useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Login() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation("common");
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!authLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-ios-bg dark:bg-iosd-bg">
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  if (isSignedIn) return <Redirect href="/(tabs)/home" />;

  const handleLogin = async () => {
    if (!isLoaded || !signIn) return;

    setError("");
    setLoading(true);

    try {
      console.log("🔐 [Login] Attempting login for:", email);

      const result = await signIn.create({ identifier: email, password });

      console.log("✅ [Login] Login result status:", result.status);

      if (
        result.status === "needs_first_factor" ||
        result.status === "needs_second_factor"
      ) {
        setPendingVerification(true);
      } else if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        console.log("🎉 [Login] Login complete!");
      }
    } catch (err: any) {
      console.error("❌ [Login] Error:", err);
      setError(err.errors?.[0]?.message || t("auth.login.errors.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || !signIn) return;

    setError("");
    setLoading(true);

    try {
      console.log("🔐 [Login] Verifying code...");

      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        console.log("🎉 [Login] Verification complete!");
      }
    } catch (err: any) {
      console.error("❌ [Login] Verification error:", err);
      setError(err.errors?.[0]?.message || t("auth.login.errors.invalidCode"));
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
                <Ionicons name="book" size={40} color="#FFF" />
              </View>

              {!pendingVerification ? (
                <>
                  <Text className="text-3xl font-monaBold text-ios-label dark:text-iosd-label mb-2">
                    {t("auth.login.title")}
                  </Text>
                  <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center">
                    {t("auth.login.subtitle")}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-3xl font-monaBold text-ios-label dark:text-iosd-label mb-2">
                    {t("auth.login.verifyTitle")}
                  </Text>
                  <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center px-8">
                    {t("auth.login.verifySubtitle", { email })}
                  </Text>
                </>
              )}
            </View>

            {/* Form */}
            <View className="w-full max-w-md">
              {!pendingVerification ? (
                <>
                  <Input
                    placeholder={t("auth.login.emailPlaceholder")}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text.trim());
                      setError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    editable={!loading}
                  />

                  <View className="relative">
                    <Input
                      placeholder={t("auth.login.passwordPlaceholder")}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError("");
                      }}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      editable={!loading}
                    />
                    <TouchableWithoutFeedback
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <View className="absolute right-4 top-4">
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={22}
                          color={isDark ? "#8E8E93" : "#C7C7CC"}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </View>

                  {error ? (
                    <View className="flex-row items-center bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                      <Ionicons name="alert-circle" size={20} color="#EF4444" />
                      <Text className="text-red-500 ml-2 flex-1 text-sm">
                        {error}
                      </Text>
                    </View>
                  ) : null}

                  <Button
                    title={t("auth.login.signInButton")}
                    variant="primary"
                    size="md"
                    fullWidth
                    onPress={handleLogin}
                    disabled={loading || !email || !password}
                    loading={loading}
                    className="mb-3"
                  />

                  <Button
                    title={t("auth.login.noAccount")}
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={() => router.push("/(auth)/register")}
                    disabled={loading}
                  />

                  {/* Divider */}
                  <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-ios-sep dark:bg-iosd-sep" />
                    <Text className="mx-4 text-sm text-ios-secondary dark:text-iosd-label2">
                      {t("auth.login.orContinueWith")}
                    </Text>
                    <View className="flex-1 h-px bg-ios-sep dark:bg-iosd-sep" />
                  </View>

                  <SocialLogins />
                </>
              ) : (
                <>
                  <Input
                    placeholder={t("auth.login.verificationCodePlaceholder")}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      setError("");
                    }}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                    maxLength={6}
                    editable={!loading}
                    autoFocus
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
                    title={t("auth.login.verifyButton")}
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleVerify}
                    disabled={loading || !code || code.length !== 6}
                    loading={loading}
                    className="mb-3"
                  />

                  <Button
                    title={t("auth.login.backToLogin")}
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={() => {
                      setPendingVerification(false);
                      setCode("");
                      setError("");
                    }}
                    disabled={loading}
                  />
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
