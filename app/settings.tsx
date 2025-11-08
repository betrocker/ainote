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
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Edit Profile Modal Component
function EditProfileModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();
  const { t } = useTranslation("common");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await user.reload();
      haptics.success();
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert(
        t("settings.profile.error.title") || "Error",
        t("settings.profile.error.message") || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-ios-bg dark:bg-iosd-bg">
        <View className="flex-row items-center justify-between px-6 pt-16 pb-4 border-b border-ios-sep dark:border-iosd-sep">
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Text className="text-ios-blue text-base">
              {t("settings.profile.cancel") || "Cancel"}
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
            {t("settings.profile.edit") || "Edit Profile"}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-ios-blue text-base font-medium">
                {t("settings.profile.save") || "Save"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="p-6">
          <View className="mb-4">
            <Text className="text-sm font-medium text-ios-label dark:text-iosd-label mb-2">
              {t("settings.profile.firstName") || "First Name"}
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder={
                t("settings.profile.firstNamePlaceholder") || "Enter first name"
              }
              className="bg-white dark:bg-white/10 rounded-xl px-4 py-3 text-base text-ios-label dark:text-iosd-label border border-black/10 dark:border-white/10"
              placeholderTextColor="#999"
              editable={!loading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-ios-label dark:text-iosd-label mb-2">
              {t("settings.profile.lastName") || "Last Name"}
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder={
                t("settings.profile.lastNamePlaceholder") || "Enter last name"
              }
              className="bg-white dark:bg-white/10 rounded-xl px-4 py-3 text-base text-ios-label dark:text-iosd-label border border-black/10 dark:border-white/10"
              placeholderTextColor="#999"
              editable={!loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// User Profile Header Component
function UserProfileHeader() {
  const { user } = useUser();
  const { t } = useTranslation("common");
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImagePick = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          t("settings.profile.permission.title") || "Permission Required",
          t("settings.profile.permission.message") ||
            "Please allow access to your photo library to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && user) {
        setUploadingImage(true);

        try {
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          const reader = new FileReader();

          reader.onloadend = async () => {
            try {
              const base64data = reader.result as string;
              await user.setProfileImage({ file: base64data });
              await user.reload();
              haptics.success();
            } catch (error) {
              console.error("Error setting profile image:", error);
              Alert.alert(
                "Error",
                "Failed to upload profile image. Please try again."
              );
            } finally {
              setUploadingImage(false);
            }
          };

          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error processing image:", error);
          Alert.alert("Error", "Failed to process image. Please try again.");
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
      setUploadingImage(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("sr-RS", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return "?";
  };

  return (
    <>
      <View className="px-6 mb-6">
        {/* Avatar & Name */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={handleImagePick}
            className="relative"
            disabled={uploadingImage}
            activeOpacity={0.7}
          >
            {uploadingImage ? (
              <View className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center">
                <ActivityIndicator />
              </View>
            ) : user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-ios-blue items-center justify-center">
                <Text className="text-3xl text-white font-monaBold">
                  {getInitials()}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-ios-blue items-center justify-center border-2 border-white dark:border-black">
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>

          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-monaBold text-ios-label dark:text-iosd-label">
                  {user?.fullName ||
                    user?.firstName ||
                    t("user.fallbackName") ||
                    "User"}
                </Text>
                <Text className="text-sm text-ios-secondary dark:text-iosd-label2 mt-1">
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
                className="ml-2"
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 rounded-full bg-ios-blue/10 dark:bg-ios-blue/20 items-center justify-center">
                  <Ionicons name="pencil" size={16} color="#007AFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View className="bg-white/80 dark:bg-white/10 rounded-2xl p-4 border border-black/10 dark:border-white/10">
          <View className="flex-row items-center mb-3">
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <Text className="text-[13px] text-ios-secondary dark:text-iosd-label2">
              {t("settings.profile.memberSince") || "Member since"}:{" "}
              <Text className="text-ios-label dark:text-iosd-label font-medium">
                {formatDate(user?.createdAt || null)}
              </Text>
            </Text>
          </View>
          {user?.lastSignInAt && (
            <View className="flex-row items-center">
              <Ionicons
                name="time-outline"
                size={16}
                color="#999"
                style={{ marginRight: 8 }}
              />
              <Text className="text-[13px] text-ios-secondary dark:text-iosd-label2">
                {t("settings.profile.lastSignIn") || "Last sign in"}:{" "}
                <Text className="text-ios-label dark:text-iosd-label font-medium">
                  {formatDate(user.lastSignInAt)}
                </Text>
              </Text>
            </View>
          )}
        </View>
      </View>

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
}

// Theme Toggle Row Component
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
            {t("appearance.darkMode.title") || "Dark Mode"}
          </Text>
          <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
            {t("appearance.darkMode.subtitle") || "Change app appearance"}
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

// Premium Settings Component
function PremiumSettings() {
  const { isPremium, loading, checkPremiumStatus } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useTranslation("common");

  const handleManageSubscription = useCallback(() => {
    const isExpoGo = Constants.appOwnership === "expo";

    if (isExpoGo) {
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
                {t("settings.premium.status") || "Premium Status"}
              </Text>
              <Text
                className={`text-[12px] mt-0.5 ${
                  isPremium
                    ? "text-green-600 dark:text-green-400"
                    : "text-ios-secondary dark:text-iosd-label2"
                }`}
              >
                {isPremium
                  ? t("settings.premium.active") || "Active"
                  : t("settings.premium.inactive") || "Inactive"}
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
                ? t("settings.premium.manage") || "Manage Subscription"
                : t("settings.premium.upgrade") || "Upgrade to Premium"}
            </Text>
            <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
              {isPremium
                ? t("settings.premium.manageSubtitle") ||
                  "Manage your subscription"
                : t("settings.premium.upgradeSubtitle") ||
                  "Unlock all features"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      {!isPremium && (
        <>
          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />
          <View className="py-3 px-6">
            <Text className="text-[11px] uppercase font-monaBold text-ios-secondary dark:text-iosd-label2 mb-3">
              {t("settings.premium.benefits.title") || "Premium Benefits"}
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.transcription.title") ||
                    "Audio transkripcija"}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.ocr.title") || "OCR za slike"}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.ai.title") || "AI asistent"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.private.title") || "Privatni folder"}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

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

// Notification Settings Component
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
            {t("settings.notifications.title") || "Notifications"}
          </Text>
          <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
            {t("settings.notifications.subtitle") ||
              "Enable push notifications"}
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

// Main Settings Screen
export default function Settings() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { ready } = useTheme();
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();

  // Delete Account Component
  function DeleteAccountSection() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const { t } = useTranslation("common");

    const handleDeleteAccount = useCallback(() => {
      Alert.alert(
        t("settings.deleteAccount.confirm.title") || "Delete Account",
        t("settings.deleteAccount.confirm.message") ||
          "Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.",
        [
          {
            text: t("settings.deleteAccount.confirm.cancel") || "Cancel",
            style: "cancel",
          },
          {
            text: t("settings.deleteAccount.confirm.confirm") || "Delete",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                t("settings.deleteAccount.finalConfirm.title") ||
                  "Final Confirmation",
                t("settings.deleteAccount.finalConfirm.message") ||
                  "This is your last chance. Type your email to confirm deletion.",
                [
                  {
                    text:
                      t("settings.deleteAccount.finalConfirm.cancel") ||
                      "Cancel",
                    style: "cancel",
                  },
                  {
                    text:
                      t("settings.deleteAccount.finalConfirm.confirm") ||
                      "I Understand, Delete",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        if (user) {
                          await user.delete();
                          await signOut();
                          router.replace("/");
                          haptics.success();
                        }
                      } catch (error) {
                        console.error("Error deleting account:", error);
                        Alert.alert(
                          t("settings.deleteAccount.error.title") || "Error",
                          t("settings.deleteAccount.error.message") ||
                            "Failed to delete account. Please try again or contact support."
                        );
                      }
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    }, [user, signOut, t]);

    return (
      <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-red-500/30 dark:border-red-500/30 bg-white/80 dark:bg-white/10">
        <TouchableOpacity
          className="flex-row items-center py-3 px-6 active:opacity-70"
          onPress={handleDeleteAccount}
        >
          <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
            <Ionicons name="trash-outline" size={18} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-monaBold text-red-500">
              {t("settings.deleteAccount.button") || "Delete Account"}
            </Text>
            <Text className="text-[12px] mt-0.5 text-red-500/70">
              {t("settings.deleteAccount.subtitle") ||
                "Permanently delete your account and all data"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLogout = useCallback(() => {
    Alert.alert(
      t("settings.logout.confirm.title") || "Logout",
      t("settings.logout.confirm.message") ||
        "Are you sure you want to logout?",
      [
        {
          text: t("settings.logout.confirm.cancel") || "Cancel",
          style: "cancel",
        },
        {
          text: t("settings.logout.confirm.confirm") || "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/");
          },
        },
      ]
    );
  }, [signOut, t]);

  const handleResetOnboarding = useCallback(() => {
    Alert.alert(
      "Reset Onboarding",
      "Da li želiš da ponovo vidiš onboarding ekrane pri sledećem pokretanju?",
      [
        {
          text: "Otkaži",
          style: "cancel",
        },
        {
          text: "Resetuj",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("@viewedOnboarding");
            haptics.success();
            Alert.alert(
              "✅ Gotovo",
              "Onboarding će se prikazati pri sledećem pokretanju aplikacije.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.replace("/onboarding");
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, []);

  if (!ready) return null;

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("screen.settings.title") || "Settings"}
        rightButtons={
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-ios-blue text-base font-medium">
              {t("settings.done") || "Done"}
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
        <UserProfileHeader />

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

        {/* Reset Onboarding */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={handleResetOnboarding}
          >
            <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center mr-3">
              <Ionicons name="reload-outline" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                Resetuj Onboarding
              </Text>
              <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
                Prikaži uvodni vodič ponovo
              </Text>
            </View>
          </TouchableOpacity>
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
                {t("settings.sections.about") || "About"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        <DeleteAccountSection />

        {/* Logout */}
        <View className="mt-6 mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={handleLogout}
          >
            <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
              <Ionicons name="exit-outline" size={18} color="white" />
            </View>
            <Text className="text-base font-monaBold text-red-500">
              {t("settings.logout.button") || "Logout"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View className="mt-8 items-center">
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
            {t("app.version", {
              version: Constants.expoConfig?.version || "1.0.0",
            }) || `Version ${Constants.expoConfig?.version || "1.0.0"}`}
          </Text>
        </View>
      </ScreenScroll>
    </ScreenBackground>
  );
}
