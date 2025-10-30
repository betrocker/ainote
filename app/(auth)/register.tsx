// app/(auth)/register.tsx
import SocialLogins from "@/components/SocialLogins";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth, useSignUp } from "@clerk/clerk-expo";
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
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Register() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
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
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!authLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-ios-bg dark:bg-iosd-bg">
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  if (isSignedIn) return <Redirect href="/(tabs)/home" />;

  const getPasswordStrength = () => {
    if (password.length < 8) return 0;
    if (password.length < 12) return 1;
    return 2;
  };

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
        err.errors?.[0]?.message ||
        t("auth.register.errors.registrationFailed");
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
      setError(
        err.errors?.[0]?.message || t("auth.register.errors.invalidCode")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!loading && signUp && resendCooldown === 0) {
      try {
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setError("");
      } catch (err: any) {
        setError(t("auth.register.errors.resendFailed"));
      }
    }
  };

  const passwordStrength = getPasswordStrength();
  const strengthLabels = [
    t("auth.register.passwordStrength.weak"),
    t("auth.register.passwordStrength.good"),
    t("auth.register.passwordStrength.strong"),
  ];

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
                  <Text className="text-3xl font-monaBold text-ios-label dark:text-iosd-label mb-2">
                    {t("auth.register.title")}
                  </Text>
                  <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center">
                    {t("auth.register.subtitle")}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-3xl font-monaBold text-ios-label dark:text-iosd-label mb-2">
                    {t("auth.register.verifyTitle")}
                  </Text>
                  <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center px-8">
                    {t("auth.register.verifySubtitle", { email })}
                  </Text>
                </>
              )}
            </View>

            {/* Form */}
            <View className="w-full max-w-md">
              {!pendingVerification ? (
                <>
                  <Input
                    placeholder={t("auth.register.emailPlaceholder")}
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
                      placeholder={t("auth.register.passwordPlaceholder")}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError("");
                      }}
                      secureTextEntry={!showPassword}
                      autoComplete="password-new"
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
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

                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <View className="mb-4">
                      <View className="flex-row items-center gap-1">
                        {[0, 1, 2].map((index) => (
                          <View
                            key={index}
                            className={`flex-1 h-1 rounded-full ${
                              index <= passwordStrength
                                ? index === 0
                                  ? "bg-red-500"
                                  : index === 1
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          />
                        ))}
                      </View>
                      <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-1">
                        {strengthLabels[passwordStrength]}
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
                    title={t("auth.register.createAccountButton")}
                    variant="primary"
                    size="md"
                    fullWidth
                    onPress={handleRegister}
                    disabled={loading || !email || password.length < 8}
                    loading={loading}
                    className="mb-3"
                  />

                  <Button
                    title={t("auth.register.haveAccount")}
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={() => router.push("/(auth)/login")}
                    disabled={loading}
                  />

                  {/* Divider */}
                  <View className="flex-row items-center my-6">
                    <View className="flex-1 h-px bg-ios-sep dark:bg-iosd-sep" />
                    <Text className="mx-4 text-sm text-ios-secondary dark:text-iosd-label2">
                      {t("auth.register.orContinueWith")}
                    </Text>
                    <View className="flex-1 h-px bg-ios-sep dark:bg-iosd-sep" />
                  </View>

                  <SocialLogins />

                  {/* Terms */}
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2 text-center mt-6 leading-5">
                    {t("auth.register.terms")}
                  </Text>
                </>
              ) : (
                <>
                  <Input
                    placeholder={t("auth.register.verificationCodePlaceholder")}
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
                    title={t("auth.register.verifyButton")}
                    variant="primary"
                    size="md"
                    fullWidth
                    onPress={handleVerify}
                    disabled={loading || !code || code.length !== 6}
                    loading={loading}
                    className="mb-3"
                  />

                  <Button
                    title={t("auth.register.backToRegister")}
                    variant="secondary"
                    size="md"
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
                    onPress={handleResendCode}
                    disabled={loading || resendCooldown > 0}
                    className="py-3 items-center"
                  >
                    <Text
                      className={`text-sm font-medium ${
                        resendCooldown > 0
                          ? "text-ios-secondary dark:text-iosd-label2"
                          : "text-ios-blue"
                      }`}
                    >
                      {resendCooldown > 0
                        ? `${t(
                            "auth.register.resendCode"
                          )} (${resendCooldown}s)`
                        : t("auth.register.resendCode")}
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
