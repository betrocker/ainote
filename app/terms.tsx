// app/terms.tsx
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

export default function Terms() {
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
        title={t("terms.title")}
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
            {t("terms.intro")}
          </Text>
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2 mt-4">
            {t("terms.lastUpdated")}
          </Text>
        </View>

        {/* Acceptance */}
        <Section
          icon="checkmark-circle"
          iconColor="bg-green-500"
          title={t("terms.sections.acceptance.title")}
          content={t("terms.sections.acceptance.content")}
        />

        {/* User Account */}
        <Section
          icon="person"
          iconColor="bg-ios-blue"
          title={t("terms.sections.account.title")}
          content={t("terms.sections.account.content")}
        />

        {/* License */}
        <Section
          icon="key"
          iconColor="bg-purple-500"
          title={t("terms.sections.license.title")}
          content={t("terms.sections.license.content")}
        />

        {/* User Content */}
        <Section
          icon="document"
          iconColor="bg-orange-500"
          title={t("terms.sections.userContent.title")}
          content={t("terms.sections.userContent.content")}
        />

        {/* Prohibited Use */}
        <Section
          icon="ban"
          iconColor="bg-red-500"
          title={t("terms.sections.prohibited.title")}
          content={t("terms.sections.prohibited.content")}
        />

        {/* Subscriptions */}
        <Section
          icon="diamond"
          iconColor="bg-yellow-500"
          title={t("terms.sections.subscriptions.title")}
          content={t("terms.sections.subscriptions.content")}
        />

        {/* Termination */}
        <Section
          icon="close-circle"
          iconColor="bg-pink-500"
          title={t("terms.sections.termination.title")}
          content={t("terms.sections.termination.content")}
        />

        {/* Disclaimer */}
        <Section
          icon="information-circle"
          iconColor="bg-indigo-500"
          title={t("terms.sections.disclaimer.title")}
          content={t("terms.sections.disclaimer.content")}
        />

        {/* Changes */}
        <Section
          icon="refresh"
          iconColor="bg-teal-500"
          title={t("terms.sections.changes.title")}
          content={t("terms.sections.changes.content")}
        />

        {/* Contact */}
        <View className="mx-4 mb-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10">
          <TouchableOpacity
            className="p-6 active:opacity-70"
            onPress={() => {
              Linking.openURL("mailto:legal@ainote.app");
            }}
          >
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 rounded-full bg-cyan-500 items-center justify-center mr-3">
                <Ionicons name="mail" size={20} color="white" />
              </View>
              <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label flex-1">
                {t("terms.contact.title")}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
            <Text className="text-base text-ios-secondary dark:text-iosd-label2 leading-6 ml-13">
              {t("terms.contact.content")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenScroll>
    </ScreenBackground>
  );
}
