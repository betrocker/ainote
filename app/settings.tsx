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
      Alert.alert(
        t("settings.profile.error.title"),
        t("settings.profile.error.message")
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
              {t("settings.profile.cancel")}
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
            {t("settings.profile.edit")}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-ios-blue text-base font-medium">
                {t("settings.profile.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="p-6">
          <View className="mb-4">
            <Text className="text-sm font-medium text-ios-label dark:text-iosd-label mb-2">
              {t("settings.profile.firstName")}
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t("settings.profile.firstNamePlaceholder")}
              className="bg-white dark:bg-white/10 rounded-xl px-4 py-3 text-base text-ios-label dark:text-iosd-label border border-black/10 dark:border-white/10"
              placeholderTextColor="#999"
              editable={!loading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-ios-label dark:text-iosd-label mb-2">
              {t("settings.profile.lastName")}
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder={t("settings.profile.lastNamePlaceholder")}
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
          t("settings.profile.permission.title"),
          t("settings.profile.permission.message")
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
              Alert.alert(
                t("settings.profile.error.title"),
                t("settings.profile.imageUpload.error")
              );
            } finally {
              setUploadingImage(false);
            }
          };

          reader.readAsDataURL(blob);
        } catch (error) {
          Alert.alert(
            t("settings.profile.error.title"),
            t("settings.profile.imageProcess.error")
          );
          setUploadingImage(false);
        }
      }
    } catch (error) {
      Alert.alert(
        t("settings.profile.error.title"),
        t("settings.profile.imagePick.error")
      );
      setUploadingImage(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat(t("locale") || "sr-RS", {
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
                  {user?.fullName || user?.firstName || t("user.fallbackName")}
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

        <View className="bg-white/80 dark:bg-white/10 rounded-2xl p-4 border border-black/10 dark:border-white/10">
          <View className="flex-row items-center mb-3">
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <Text className="text-[13px] text-ios-secondary dark:text-iosd-label2">
              {t("settings.profile.memberSince")}:{" "}
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
                {t("settings.profile.lastSignIn")}:{" "}
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

// Premium Settings Component
function PremiumSettings() {
  const { isPremium, loading, checkPremiumStatus } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useTranslation("common");

  const handleManageSubscription = useCallback(() => {
    setShowPaywall(true);
  }, []);

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
            <Text className="text-[11px] uppercase font-monaBold text-ios-secondary dark:text-iosd-label2 mb-3">
              {t("settings.premium.benefits.title")}
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.transcription.title")}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.ocr.title")}
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.ai.title")}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#FF9500" />
                <Text className="text-[13px] text-ios-label dark:text-iosd-label ml-2">
                  {t("paywall.benefits.private.title")}
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
      // Silent fail
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

// Delete Account Component
function DeleteAccountSection() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { t } = useTranslation("common");

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t("settings.deleteAccount.confirm.title"),
      t("settings.deleteAccount.confirm.message"),
      [
        {
          text: t("settings.deleteAccount.confirm.cancel"),
          style: "cancel",
        },
        {
          text: t("settings.deleteAccount.confirm.confirm"),
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t("settings.deleteAccount.finalConfirm.title"),
              t("settings.deleteAccount.finalConfirm.message"),
              [
                {
                  text: t("settings.deleteAccount.finalConfirm.cancel"),
                  style: "cancel",
                },
                {
                  text: t("settings.deleteAccount.finalConfirm.confirm"),
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
                      Alert.alert(
                        t("settings.deleteAccount.error.title"),
                        t("settings.deleteAccount.error.message")
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
            {t("settings.deleteAccount.button")}
          </Text>
          <Text className="text-[12px] mt-0.5 text-red-500/70">
            {t("settings.deleteAccount.subtitle")}
          </Text>
        </View>
      </TouchableOpacity>
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
