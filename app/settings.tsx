// app/settings.tsx
import LanguagePicker from "@/components/LanguagePicker";
import LargeHeader from "@/components/LargeHeader";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenScroll from "@/components/ScreenScroll";
import { usePremium } from "@/context/PremiumContext";
import { useTheme } from "@/context/ThemeContext";
import { haptics } from "@/utils/haptics";
import {
  getAllScheduledNotifications,
  registerForPushNotifications,
  scheduleDailyDigest,
} from "@/utils/notifications";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RevenueCatUI from "react-native-purchases-ui";

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
        trackColor={{
          false: "rgba(60,60,67,0.28)",
          true: "rgba(10,132,255,0.45)",
        }}
        thumbColor={isDark ? "#0A84FF" : "#FFFFFF"}
      />
    </View>
  );
}

// ⭐ Premium Settings Component
function PremiumSettings() {
  const { isPremium, loading, checkPremiumStatus } = usePremium();
  const [presentingPaywall, setPresentingPaywall] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await checkPremiumStatus();
      haptics.light();
      console.log("🔄 [Settings] Premium status refreshed:", isPremium);
    } catch (error) {
      console.error("❌ [Settings] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (presentingPaywall) return;

    setPresentingPaywall(true);
    try {
      console.log(
        "🎯 [Settings] Opening subscription info, current premium status:",
        isPremium
      );

      // ⭐ Detektuj Expo Go
      const isExpoGo = Constants.appOwnership === "expo";

      if (isExpoGo) {
        // ⭐ Test Store mode - pokaži instrukcije
        Alert.alert(
          "💎 Test Store Mode",
          "You're running in Expo Go with Test Store.\n\n" +
            "To test premium:\n" +
            "1. Check console for your Customer ID\n" +
            "2. Go to RevenueCat Dashboard → Customers\n" +
            "3. Search for your Customer ID\n" +
            '4. Click "Grant Promotional Entitlement"\n' +
            '5. Select "premium" entitlement\n' +
            '6. Tap "Refresh Status" below\n\n' +
            "Premium features will work normally in production build.",
          [
            {
              text: "Refresh Status",
              onPress: handleRefreshStatus,
            },
            { text: "OK", style: "cancel" },
          ]
        );
      } else {
        // ⭐ Production build - prikaži pravi paywall
        const result = await RevenueCatUI.presentPaywall();

        console.log("💳 [Settings] Paywall result:", result);

        if (result === "PURCHASED" || result === "RESTORED") {
          await checkPremiumStatus();
          haptics.success();
          Alert.alert(
            "🎉 Success!",
            "Welcome to AInote Premium! Enjoy unlimited AI features."
          );
        }
      }
    } catch (error) {
      console.error("❌ [Settings] Error:", error);
      Alert.alert(
        "Info",
        "Premium features will be available in the production build"
      );
    } finally {
      setPresentingPaywall(false);
    }
  };

  if (loading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      {/* Premium Status */}
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
                Premium Status
              </Text>
              <Text
                className={`text-[12px] mt-0.5 ${
                  isPremium
                    ? "text-green-600 dark:text-green-400"
                    : "text-ios-secondary dark:text-iosd-label2"
                }`}
              >
                {isPremium ? "✅ Active" : "❌ Not Active"}
              </Text>
            </View>
          </View>

          {/* ⭐ Refresh button */}
          <TouchableOpacity
            onPress={handleRefreshStatus}
            disabled={refreshing}
            className="ml-2 p-2 rounded-full bg-ios-blue/10 dark:bg-ios-blue/20"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0A84FF" />
            ) : (
              <Ionicons name="refresh" size={16} color="#0A84FF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

      {/* Manage/Upgrade Button */}
      <TouchableOpacity
        className="flex-row items-center py-3 px-6 active:opacity-90"
        onPress={handleManageSubscription}
        disabled={presentingPaywall}
      >
        <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center mr-3">
          <Ionicons name="diamond" size={18} color="white" />
        </View>
        <View className="flex-1 flex-row justify-between items-center">
          <View>
            <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
              {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
            </Text>
            <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
              {isPremium
                ? "View plans and billing"
                : "Unlock unlimited AI features"}
            </Text>
          </View>
          {presentingPaywall ? (
            <ActivityIndicator size="small" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#999" />
          )}
        </View>
      </TouchableOpacity>

      {!isPremium && (
        <>
          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

          {/* Premium Benefits */}
          <View className="py-3 px-6">
            <Text className="text-[11px] uppercase font-semibold text-ios-secondary dark:text-iosd-label2 mb-2">
              Premium Benefits
            </Text>

            <View className="space-y-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  Unlimited AI transcriptions
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  Audio & video note analysis
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  Cloud sync across devices
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  Advanced search & organization
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </>
  );
}

// ⭐ Notification Settings Component
function NotificationSettings() {
  const { t } = useTranslation("common");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem("notifications_enabled");
      setNotificationsEnabled(enabled === "true");

      const scheduled = await getAllScheduledNotifications();
      setScheduledCount(scheduled.length);

      const hasDigest = scheduled.some(
        (n) => n.content.data?.type === "daily_digest"
      );
      setDailyDigestEnabled(hasDigest);

      console.log("🔔 [Settings] Loaded notification settings:", {
        enabled,
        scheduled: scheduled.length,
        hasDigest,
      });
    } catch (error) {
      console.error("🔔 [Settings] Error loading settings:", error);
    }
  };

  const handleEnableNotifications = async (value: boolean) => {
    if (loading) return;

    setLoading(true);
    try {
      if (value) {
        const granted = await registerForPushNotifications();
        if (granted) {
          await AsyncStorage.setItem("notifications_enabled", "true");
          setNotificationsEnabled(true);
          Alert.alert(
            "✅ Notifications Enabled",
            "You'll receive reminders for your notes with due dates"
          );
        } else {
          Alert.alert(
            "❌ Permission Denied",
            "Please enable notifications in your device Settings"
          );
        }
      } else {
        await AsyncStorage.setItem("notifications_enabled", "false");
        setNotificationsEnabled(false);
        setDailyDigestEnabled(false);
        Alert.alert(
          "🔕 Notifications Disabled",
          "You won't receive any notifications"
        );
      }
    } catch (error) {
      console.error("🔔 [Settings] Error toggling notifications:", error);
      Alert.alert("❌ Error", "Failed to update notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDailyDigest = async (value: boolean) => {
    if (loading || !notificationsEnabled) return;

    setLoading(true);
    try {
      if (value) {
        await scheduleDailyDigest();
        setDailyDigestEnabled(true);
        Alert.alert(
          "✅ Daily Digest Enabled",
          "You'll receive a summary at 9 AM every day"
        );
      } else {
        const scheduled = await getAllScheduledNotifications();
        const digest = scheduled.find(
          (n) => n.content.data?.type === "daily_digest"
        );
        if (digest) {
          await Notifications.cancelScheduledNotificationAsync(
            digest.identifier
          );
        }
        setDailyDigestEnabled(false);
        Alert.alert("🔕 Daily Digest Disabled", "Daily summaries turned off");
      }

      await loadNotificationSettings();
    } catch (error) {
      console.error("🔔 [Settings] Error toggling daily digest:", error);
      Alert.alert("❌ Error", "Failed to update daily digest setting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Enable Notifications */}
      <View className="flex-row items-center justify-between py-3 px-6">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
            <Ionicons name="notifications" size={18} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
              Push Notifications
            </Text>
            <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
              Reminders for due dates
            </Text>
          </View>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleEnableNotifications}
          disabled={loading}
          trackColor={{
            false: "rgba(60,60,67,0.28)",
            true: "rgba(10,132,255,0.45)",
          }}
          thumbColor={notificationsEnabled ? "#0A84FF" : "#FFFFFF"}
        />
      </View>

      <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

      {/* Daily Digest */}
      <View className="flex-row items-center justify-between py-3 px-6">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center mr-3">
            <Ionicons name="sunny" size={18} color="white" />
          </View>
          <View className="flex-1">
            <Text
              className={`text-base font-medium ${
                notificationsEnabled
                  ? "text-ios-label dark:text-iosd-label"
                  : "text-ios-secondary dark:text-iosd-label2"
              }`}
            >
              Daily Digest
            </Text>
            <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
              9 AM summary of today's notes
            </Text>
          </View>
        </View>
        <Switch
          value={dailyDigestEnabled}
          onValueChange={handleDailyDigest}
          disabled={!notificationsEnabled || loading}
          trackColor={{
            false: "rgba(60,60,67,0.28)",
            true: "rgba(10,132,255,0.45)",
          }}
          thumbColor={dailyDigestEnabled ? "#0A84FF" : "#FFFFFF"}
        />
      </View>

      <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

      {/* Scheduled Count */}
      <TouchableOpacity
        className="flex-row items-center py-3 px-6 active:opacity-90"
        onPress={async () => {
          await loadNotificationSettings();
          haptics.light();

          const scheduled = await getAllScheduledNotifications();
          Alert.alert(
            "🔔 Scheduled Notifications",
            `You have ${scheduled.length} scheduled notification${
              scheduled.length === 1 ? "" : "s"
            }`,
            [
              {
                text: "OK",
                style: "default",
              },
              {
                text: "View Details",
                onPress: () => {
                  console.log("📋 Scheduled notifications:", scheduled);
                  scheduled.forEach((n, i) => {
                    console.log(`${i + 1}. ${n.content.title}`, n.content.data);
                  });
                },
              },
            ]
          );
        }}
      >
        <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center mr-3">
          <Ionicons name="time" size={18} color="white" />
        </View>
        <View className="flex-1 flex-row justify-between items-center">
          <View>
            <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
              Scheduled Notifications
            </Text>
            <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
              Tap to refresh
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-base text-ios-secondary dark:text-iosd-label2 mr-2">
              {scheduledCount}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </View>
      </TouchableOpacity>

      <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

      {/* Test Notification */}
      <TouchableOpacity
        className="flex-row items-center py-3 px-6 active:opacity-90"
        onPress={async () => {
          try {
            const { scheduleTestNotification } = await import(
              "@/utils/notifications"
            );
            await scheduleTestNotification(5);
            haptics.success();
            Alert.alert(
              "✅ Test Scheduled",
              "You'll receive a notification in 5 seconds"
            );
          } catch (error) {
            Alert.alert("❌ Error", String(error));
          }
        }}
      >
        <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mr-3">
          <Ionicons name="flask" size={18} color="white" />
        </View>
        <View className="flex-1 flex-row justify-between items-center">
          <View>
            <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
              Test Notification
            </Text>
            <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
              Trigger in 5 seconds
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

      {/* Cancel All Notifications */}
      <TouchableOpacity
        className="flex-row items-center py-3 px-6 active:opacity-90"
        onPress={async () => {
          const scheduled = await getAllScheduledNotifications();
          Alert.alert(
            "Cancel All?",
            `This will cancel all ${scheduled.length} scheduled notifications`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete All",
                style: "destructive",
                onPress: async () => {
                  await Notifications.cancelAllScheduledNotificationsAsync();
                  await loadNotificationSettings();
                  haptics.heavy();
                  Alert.alert("✅ Cleared", "All notifications cancelled");
                },
              },
            ]
          );
        }}
      >
        <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
          <Ionicons name="trash" size={18} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-base text-red-500 font-medium">
            Cancel All Notifications
          </Text>
          <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
            Clear all scheduled notifications
          </Text>
        </View>
      </TouchableOpacity>
    </>
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
    router.replace("/");
  };

  if (!ready) return null;

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("screen.settings.title")}
        rightButtons={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-ios-blue text-base font-medium">Done</Text>
          </TouchableOpacity>
        }
      />

      <ScreenScroll
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 40,
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

        {/* ⭐ Premium Section - First! */}
        <View className="mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <PremiumSettings />
        </View>

        {/* Appearance */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <ThemeToggleRow />
        </View>

        {/* Language */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <LanguagePicker />
        </View>

        {/* ⭐ Notifications Section */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <NotificationSettings />
        </View>

        {/* App settings */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
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
            <View className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center mr-3">
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
