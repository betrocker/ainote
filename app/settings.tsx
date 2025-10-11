// app/settings.tsx
import Header from "@/components/Header";
import LanguagePicker from "@/components/LanguagePicker";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenScroll from "@/components/ScreenScroll";
import { useTheme } from "@/context/ThemeContext";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Switch, Text, TouchableOpacity, View } from "react-native";

function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useTranslation("common");

  return (
    <View className="flex-row items-center justify-between py-3 px-6">
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center mr-3">
          <Ionicons name="color-palette-outline" size={18} color="white" />
        </View>
        <View>
          <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
            {t("appearance.darkMode.title")}
          </Text>
          <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
            {t("appearance.darkMode.subtitle")}
          </Text>
        </View>
      </View>

      <Switch
        value={isDark}
        onValueChange={(v) => setTheme(v ? "dark" : "light")}
        // iOS look
        trackColor={{
          false: "rgba(60,60,67,0.28)",
          true: "rgba(10,132,255,0.45)",
        }}
        thumbColor={isDark ? "#0A84FF" : "#FFFFFF"}
      />
    </View>
  );
}

/* ---------------- MAIN SETTINGS SCREEN ---------------- */
export default function Settings() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { ready } = useTheme();
  const { t } = useTranslation("common");

  const handleLogout = async () => {
    await signOut();
    router.replace("/"); // nazad na index.tsx → login
  };

  if (!ready) return null;

  return (
    <ScreenBackground variant="grouped">
      <Header
        title={t("screen.settings.title")}
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
      />

      <ScreenScroll
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 40, // ScreenScroll već dodaje top padding (Header + 16)
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* User info */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-semibold text-ios-label dark:text-iosd-label">
            {user?.fullName || t("user.fallbackName")}
          </Text>
          <Text className="text-ios-secondary dark:text-iosd-label2">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {/* Appearance (card with single toggle) */}
        <View className="mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <ThemeToggleRow />
        </View>

        {/* Language (card) */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <LanguagePicker />
        </View>

        {/* App settings */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-90"
            onPress={() => router.push("/notifications")}
          >
            <View className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center mr-3">
              <Ionicons name="notifications-outline" size={18} color="white" />
            </View>
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-base text-ios-label dark:text-iosd-label">
                {t("settings.sections.notifications")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-90"
            onPress={() => router.push("/privacy")}
          >
            <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center mr-3">
              <Ionicons name="lock-closed-outline" size={18} color="white" />
            </View>
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-base text-ios-label dark:text-iosd-label">
                {t("settings.sections.privacy")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>

          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-90"
            onPress={() => router.push("/about")}
          >
            <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center mr-3">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="white"
              />
            </View>
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-base text-ios-label dark:text-iosd-label">
                {t("settings.sections.about")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-90"
            onPress={handleLogout}
          >
            <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
              <Ionicons name="exit-outline" size={18} color="white" />
            </View>
            <Text className="text-base font-semibold text-red-500">
              {t("settings.logout")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View className="mt-8 items-center">
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
            {t("app.version", {
              version: Constants.expoConfig?.version || "1.0.0",
            })}
          </Text>
        </View>
      </ScreenScroll>
    </ScreenBackground>
  );
}
