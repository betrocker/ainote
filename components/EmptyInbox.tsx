// components/EmptyInbox.tsx
import { useTab } from "@/context/TabContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

type Props = {
  title?: string;
  message?: string;
  onAdd?: () => void;
};

export default function EmptyInbox({ title, message, onAdd }: Props) {
  const { setMenuOpen } = useTab();
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation("common");

  // Tematske boje za SVG
  const isDark = colorScheme === "dark";
  const primaryStart = isDark ? "#0A84FF" : "#007AFF";
  const primaryEnd = isDark ? "#5AC8FA" : "#34C759";

  const Action = ({
    icon,
    label,
    onPress,
    bg,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    bg: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`flex-1 h-24 mr-3 last:mr-0 rounded-2xl ${bg} items-center justify-center border border-black/10 dark:border-white/10`}
    >
      <Ionicons name={icon} size={22} color="#fff" />
      <Text className="text-white mt-2 text-[13px] font-medium">{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="mb-6">
      <Text className="section-title text-ios-label dark:text-iosd-label mb-2">
        {title ?? t("inbox.empty.title")}
      </Text>
      <Text className="text-ios-secondary dark:text-iosd-label2 mb-4">
        {message ?? t("inbox.empty.message")}
      </Text>

      {/* Dekorativni blok (blur + gradient) */}
      <View className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10">
        <BlurView intensity={30} tint={isDark ? "dark" : "light"}>
          <View className="p-4">
            <View className="h-28 rounded-2xl overflow-hidden mb-4">
              <Svg width="100%" height="100%" viewBox="0 0 320 112">
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <Stop
                      offset="0"
                      stopColor={primaryStart}
                      stopOpacity="0.6"
                    />
                    <Stop offset="1" stopColor={primaryEnd} stopOpacity="0.6" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="320" height="112" fill="url(#grad)" />
                <Circle cx="280" cy="20" r="10" fill="#fff" opacity="0.12" />
                <Circle cx="300" cy="88" r="16" fill="#fff" opacity="0.08" />
                <Circle cx="40" cy="92" r="10" fill="#fff" opacity="0.10" />
              </Svg>
            </View>

            {/* Prečice – po želji zadrži ili ukloni */}
            <View className="flex-row">
              <Action
                icon="document-text-outline"
                label={t("types.text")}
                onPress={() => setMenuOpen(true)}
                bg="bg-ios-blue/90"
              />
              <Action
                icon="mic-outline"
                label={t("types.audio")}
                onPress={() => setMenuOpen(true)}
                bg="bg-purple-500/90"
              />
              <Action
                icon="camera-outline"
                label={t("types.photo")}
                onPress={() => setMenuOpen(true)}
                bg="bg-green-500/90"
              />
            </View>

            <TouchableOpacity
              onPress={onAdd ?? (() => setMenuOpen(true))}
              activeOpacity={0.9}
              className="mt-4 self-start px-3 py-2 rounded-xl bg-apple-blue/10 border border-apple-blue/30"
            >
              <Text className="text-apple-blue font-medium">
                {t("inbox.empty.addNote")}
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}
