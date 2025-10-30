// app/about.tsx
import LargeHeader from "@/components/LargeHeader";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenScroll from "@/components/ScreenScroll";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function About() {
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version || "1.0.0";
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ||
    Constants.expoConfig?.android?.versionCode ||
    "1";

  const handleLink = (url: string, title: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t("about.error.title"), t("about.error.message"));
    });
  };

  const handleEmail = () => {
    const email = "denis.djordjevic@gmail.com"; // Zameni sa svojim email-om
    const subject = `AInote ${t("about.feedback")} - v${version}`;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url);
  };

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("about.title")}
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
          paddingBottom: Math.max(insets.bottom + 20, 40), // Dynamic bottom padding
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* App Icon & Name */}
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-3xl bg-purple-500 items-center justify-center mb-4 shadow-lg">
            <Ionicons name="book" size={48} color="#FFF" />
          </View>
          <Text className="text-2xl font-monaBold text-ios-label dark:text-iosd-label">
            AInote
          </Text>
          <Text className="text-base text-ios-secondary dark:text-iosd-label2 mt-1">
            {t("about.tagline")}
          </Text>
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2 mt-2">
            {t("about.version", { version, buildNumber })}
          </Text>
        </View>

        {/* Description */}
        <View className="mx-4 mb-6 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <Text className="text-base text-ios-label dark:text-iosd-label leading-6">
            {t("about.description")}
          </Text>
        </View>

        {/* Links Section */}
        <View className="mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 mb-6">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={() => router.push("/privacy")}
          >
            <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center mr-3">
              <Ionicons name="shield-checkmark" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                {t("about.links.privacy")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={() => router.push("/terms")}
          >
            <View className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center mr-3">
              <Ionicons name="document-text" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                {t("about.links.terms")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={() =>
              handleLink("https://ainote.app", t("about.links.website"))
            }
          >
            <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mr-3">
              <Ionicons name="globe" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                {t("about.links.website")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Contact Section */}
        <View className="mx-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 mb-6">
          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={handleEmail}
          >
            <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3">
              <Ionicons name="mail" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                {t("about.contact.email")}
              </Text>
              <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
                {t("about.contact.emailSubtitle")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View className="h-px bg-ios-sep dark:bg-iosd-sep ml-14" />

          <TouchableOpacity
            className="flex-row items-center py-3 px-6 active:opacity-70"
            onPress={() => {
              const url = Platform.select({
                ios: `itms-apps://itunes.apple.com/app/id123456789`, // Zameni sa svojim App Store ID-em
                android: `market://details?id=com.denis.ainote`, // Zameni sa svojim package name-om
              });
              if (url) Linking.openURL(url);
            }}
          >
            <View className="w-8 h-8 rounded-full bg-yellow-500 items-center justify-center mr-3">
              <Ionicons name="star" size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base text-ios-label dark:text-iosd-label font-medium">
                {t("about.contact.rate")}
              </Text>
              <Text className="text-[12px] mt-0.5 text-ios-secondary dark:text-iosd-label2">
                {t("about.contact.rateSubtitle")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Developer Info */}
        <View className="mx-4 mb-6 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <Text className="text-xs text-ios-secondary dark:text-iosd-label2 text-center leading-5">
            {t("about.madeWith")}
          </Text>
          <Text className="text-xs text-ios-secondary dark:text-iosd-label2 text-center mt-2">
            © 2025 AInote. {t("about.rights")}
          </Text>
        </View>

        {/* Debug Info (only in dev) */}
        {__DEV__ && (
          <View className="mx-4 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
            <Text className="text-xs text-ios-secondary dark:text-iosd-label2 font-mono">
              Build: {Platform.OS} • {Platform.Version}
            </Text>
            <Text className="text-xs text-ios-secondary dark:text-iosd-label2 font-mono">
              Expo: {Constants.expoConfig?.sdkVersion}
            </Text>
          </View>
        )}
      </ScreenScroll>
    </ScreenBackground>
  );
}
