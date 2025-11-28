// app/privacy.tsx
import LargeHeader from "@/components/LargeHeader";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenScroll from "@/components/ScreenScroll";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Privacy() {
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();

  const Section = ({
    icon,
    iconColor,
    title,
    content,
  }: {
    icon: string;
    iconColor: string;
    title: string;
    content: string;
  }) => (
    <View className="mx-4 mb-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
      <View className="p-6">
        <View className="flex-row items-center mb-3">
          <View
            className={`w-10 h-10 rounded-full ${iconColor} items-center justify-center mr-3`}
          >
            <Ionicons name={icon as any} size={20} color="white" />
          </View>
          <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label flex-1">
            {title}
          </Text>
        </View>
        <Text className="text-base text-ios-secondary dark:text-iosd-label2 leading-6">
          {content}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("privacy.title")}
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
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-base text-ios-secondary dark:text-iosd-label2 leading-6">
            {t("privacy.intro")}
          </Text>
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2 mt-4">
            {t("privacy.lastUpdated")}
          </Text>
        </View>

        {/* Data Collection */}
        <Section
          icon="document-text"
          iconColor="bg-ios-blue"
          title={t("privacy.sections.dataCollection.title")}
          content={t("privacy.sections.dataCollection.content")}
        />

        {/* How We Use Data */}
        <Section
          icon="shield-checkmark"
          iconColor="bg-green-500"
          title={t("privacy.sections.dataUsage.title")}
          content={t("privacy.sections.dataUsage.content")}
        />

        {/* AI Processing */}
        <Section
          icon="sparkles"
          iconColor="bg-purple-500"
          title={t("privacy.sections.aiProcessing.title")}
          content={t("privacy.sections.aiProcessing.content")}
        />

        {/* Data Storage */}
        <Section
          icon="server"
          iconColor="bg-orange-500"
          title={t("privacy.sections.dataStorage.title")}
          content={t("privacy.sections.dataStorage.content")}
        />

        {/* Your Rights */}
        <Section
          icon="hand-right"
          iconColor="bg-red-500"
          title={t("privacy.sections.yourRights.title")}
          content={t("privacy.sections.yourRights.content")}
        />

        {/* Third Party Services */}
        <Section
          icon="link"
          iconColor="bg-indigo-500"
          title={t("privacy.sections.thirdParty.title")}
          content={t("privacy.sections.thirdParty.content")}
        />

        {/* Contact */}
        <View className="mx-4 mb-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="p-6 active:opacity-70"
            onPress={() => {
              Linking.openURL("mailto:office@aenoteapp.com");
            }}
          >
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 rounded-full bg-yellow-500 items-center justify-center mr-3">
                <Ionicons name="mail" size={20} color="white" />
              </View>
              <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label flex-1">
                {t("privacy.contact.title")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
            <Text className="text-base text-ios-secondary dark:text-iosd-label2 leading-6 ml-13">
              {t("privacy.contact.content")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenScroll>
    </ScreenBackground>
  );
}
