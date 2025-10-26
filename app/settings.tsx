// app/settings.tsx
import CustomPaywall from "@/components/CustomPaywall";
import LanguagePicker from "@/components/LanguagePicker";
import LargeHeader from "@/components/LargeHeader";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenScroll from "@/components/ScreenScroll";
import { usePremium } from "@/context/PremiumContext";
import { useTheme } from "@/context/ThemeContext";
import { haptics } from "@/utils/haptics";
import { registerForPushNotifications } from "@/utils/notifications";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation("common");
  const isDark = theme === "dark";

  const handleToggle = (value: boolean) => {
    setTheme(value ? "dark" : "light");
    haptics.light();
  };

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
        onValueChange={handleToggle}
        trackColor={{
          false:
            colorScheme === "dark"
              ? "rgba(120, 120, 128, 0.32)"
              : "rgba(120, 120, 128, 0.16)",
          true: "#34C759",
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={
          colorScheme === "dark"
            ? "rgba(120, 120, 128, 0.32)"
            : "rgba(120, 120, 128, 0.16)"
        }
      />
    </View>
  );
}

function PremiumSettings() {
  const { isPremium, loading, checkPremiumStatus } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useTranslation("common");

  const handleManageSubscription = useCallback(() => {
    const isExpoGo = Constants.appOwnership === "expo";

    if (isExpoGo) {
      // Development mode
      Alert.alert(
        "💎 Premium Features",
        "Premium subscription will be available in the production build.\n\nFor testing, you can grant premium access via RevenueCat Dashboard.",
        [
          {
            text: "Refresh Status",
            onPress: async () => {
              await checkPremiumStatus();
              haptics.light();
            },
          },
          { text: "OK", style: "cancel" },
        ]
      );
    } else {
      // Production - open custom paywall
      setShowPaywall(true);
    }
  }, [checkPremiumStatus]);

  if (loading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <View className="py-3 px-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                isPremium ? "bg-yellow-500" : "bg-gray-400"
              }`}
            >
              <Ionicons
                name={isPremium ? "star" : "star-outline"}
                size={18}
                color="white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                {t("settings.premium.status")}
              </Text>
              <Text
                className={`text-[12px] mt-0.5 ${
                  isPremium
                    ? "text-green-600 dark:text-green-400"
                    : "text-ios-secondary dark:text-iosd-label2"
                }`}
              >
                {isPremium
                  ? t("settings.premium.active")
                  : t("settings.premium.inactive")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

      <TouchableOpacity
        className="flex-row items-center py-3 px-6 active:opacity-70"
        onPress={handleManageSubscription}
      >
        <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center mr-3">
          <Ionicons name="diamond" size={18} color="white" />
        </View>
        <View className="flex-1 flex-row justify-between items-center">
          <View>
            <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
              {isPremium
                ? t("settings.premium.manage")
                : t("settings.premium.upgrade")}
            </Text>
            <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
              {isPremium
                ? t("settings.premium.manageSubtitle")
                : t("settings.premium.upgradeSubtitle")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      {!isPremium && (
        <>
          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />
          <View className="py-3 px-6">
            <Text className="text-[11px] uppercase font-semibold text-ios-secondary dark:text-iosd-label2 mb-2">
              {t("settings.premium.benefits.title")}
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("settings.premium.benefits.transcriptions")}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("settings.premium.benefits.analysis")}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("settings.premium.benefits.sync")}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("settings.premium.benefits.search")}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Custom Paywall */}
      <CustomPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={async () => {
          await checkPremiumStatus();
          haptics.success();
        }}
      />
    </>
  );
}

function NotificationSettings() {
  const { t } = useTranslation("common");
  const { colorScheme } = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const isDark = colorScheme === "dark";

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem("notifications_enabled");
      setNotificationsEnabled(enabled === "true");
    } catch (error) {
      console.error("❌ [Notifications] Error loading settings:", error);
    }
  };

  const handleToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    haptics.light();

    try {
      if (value) {
        const granted = await registerForPushNotifications();

        if (granted) {
          await AsyncStorage.setItem("notifications_enabled", "true");
        } else {
          setNotificationsEnabled(false);
          await AsyncStorage.setItem("notifications_enabled", "false");
        }
      } else {
        await AsyncStorage.setItem("notifications_enabled", "false");
      }
    } catch (error) {
      console.error("❌ [Notifications] Error:", error);
      setNotificationsEnabled(!value);
    }
  };

  return (
    <View className="flex-row items-center justify-between py-3 px-6">
      <View className="flex-row items-center flex-1">
        <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
          <Ionicons name="notifications" size={18} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
            {t("settings.notifications.title")}
          </Text>
          <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
            {t("settings.notifications.subtitle")}
          </Text>
        </View>
      </View>
      <Switch
        value={notificationsEnabled}
        onValueChange={handleToggle}
        trackColor={{
          false: isDark
            ? "rgba(120, 120, 128, 0.32)"
            : "rgba(120, 120, 128, 0.16)",
          true: "#34C759",
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={
          isDark ? "rgba(120, 120, 128, 0.32)" : "rgba(120, 120, 128, 0.16)"
        }
      />
    </View>
  );
}

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { ready } = useTheme();
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("settings.logout.confirm.title"),
      t("settings.logout.confirm.message"),
      [
        {
          text: t("settings.logout.confirm.cancel"),
          style: "cancel",
        },
        {
          text: t("settings.logout.confirm.confirm"),
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/");
          },
        },
      ]
    );
  }, [signOut, t]);

  if (!ready) return null;

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("screen.settings.title")}
        rightButtons={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-ios-blue text-base font-medium">
              {t("settings.done")}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScreenScroll
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 20, 40),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 mb-8">
          <Text className="text-xl font-semibold text-ios-label dark:text-iosd-label">
            {user?.fullName || t("user.fallbackName")}
          </Text>
          <Text className="text-ios-secondary dark:text-iosd-label2">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        {/* Premium */}
        <View className="mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <PremiumSettings />
        </View>

        {/* Theme */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <ThemeToggleRow />
        </View>

        {/* Language */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <LanguagePicker />
        </View>

        {/* Notifications */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <NotificationSettings />
        </View>

        {/* About */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={() => router.push("/about")}
          >
            <View className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center mr-3">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="white"
              />
            </View>
            <View className="flex-1 flex-row justify-between items-center">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                {t("settings.sections.about")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={handleLogout}
          >
            <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
              <Ionicons name="exit-outline" size={18} color="white" />
            </View>
            <Text className="text-base font-semibold text-red-500">
              {t("settings.logout.button")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
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
