// components/CustomTabBar.tsx
import FabMenu from "@/components/FabMenu";
import { useTab } from "@/context/TabContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CustomTabBarProps {
  currentIndex: number;
  onTabPress: (index: number) => void;
  tabs: readonly string[];
}

const getIconByRouteName = (route: string, isFocused: boolean) => {
  const r = route.toLowerCase();
  switch (r) {
    case "home":
      return isFocused ? "home" : "home-outline";
    case "inbox":
      return isFocused ? "mail" : "mail-outline";
    case "assistant":
      return isFocused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
    case "private":
      return isFocused ? "lock-closed" : "lock-closed-outline";
    default:
      return "ellipse-outline";
  }
};

const BASE_TABBAR_HEIGHT = 64;
const ANDROID_FALLBACK_BOTTOM = 16;
const ACTIVE_TAB_WIDTH = 100;
const INACTIVE_TAB_WIDTH = 48;

const TabBarContent = ({
  children,
  blurTint,
  isDark,
}: {
  children: React.ReactNode;
  blurTint: "dark" | "light";
  isDark: boolean;
}) => {
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={50}
        tint={blurTint}
        className="rounded-full overflow-hidden h-16 border border-black/10 dark:border-white/10"
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      className={`rounded-full overflow-hidden h-16 border ${
        isDark
          ? "bg-gray-900/95 border-white/10"
          : "bg-white/95 border-black/10"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {children}
    </View>
  );
};

type TabButtonProps = {
  tab: string;
  index: number;
  currentIndex: number;
  onPress: () => void;
  isDark: boolean;
  blurTint: "dark" | "light";
  getTabLabel: (tab: string) => string;
};

const TabButton: React.FC<TabButtonProps> = ({
  tab,
  index,
  currentIndex,
  onPress,
  isDark,
  blurTint,
  getTabLabel,
}) => {
  const isFocused = currentIndex === index;

  const animatedStyle = useAnimatedStyle(
    () => ({
      width: withTiming(
        currentIndex === index ? ACTIVE_TAB_WIDTH : INACTIVE_TAB_WIDTH,
        {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        }
      ),
    }),
    [currentIndex, index]
  );

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        className="h-full items-center justify-center"
        activeOpacity={1}
      >
        {isFocused ? (
          <BlurView
            intensity={20}
            tint={isDark ? "dark" : "light"}
            className="flex-row items-center gap-1 px-4 py-3 rounded-full overflow-hidden"
            style={{
              backgroundColor: isDark
                ? "rgba(10, 132, 255, 0.2)"
                : "rgba(0, 122, 255, 0.18)",
            }}
          >
            <Ionicons
              name={getIconByRouteName(tab, isFocused)}
              size={22}
              color={isDark ? "#0A84FF" : "#007AFF"}
            />

            <Animated.Text
              className="text-xs font-semibold text-ios-blue dark:text-iosd-blue"
              numberOfLines={1}
            >
              {getTabLabel(tab)}
            </Animated.Text>
          </BlurView>
        ) : (
          <View className="w-12 h-12 items-center justify-center">
            <Ionicons
              name={getIconByRouteName(tab, isFocused)}
              size={22}
              color={isDark ? "#EBEBF599" : "#3C3C4399"}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  currentIndex,
  onTabPress,
  tabs,
}) => {
  const { t } = useTranslation("common");
  const { menuOpen, setMenuOpen } = useTab();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === "dark";
  const blurTint: "dark" | "light" = isDark ? "dark" : "light";

  const bottomSpace =
    Platform.OS === "android"
      ? insets.bottom && insets.bottom > 0
        ? insets.bottom
        : ANDROID_FALLBACK_BOTTOM
      : insets.bottom;

  const tabsArray = (
    tabs && tabs.length > 0 ? Array.from(tabs) : []
  ) as string[];

  const getTabLabel = (tab: string) => {
    const lowercaseTab = tab.toLowerCase();
    return t(`tabs.${lowercaseTab}`);
  };

  const totalWidth =
    (tabsArray.length - 1) * INACTIVE_TAB_WIDTH + ACTIVE_TAB_WIDTH + 16;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      {menuOpen && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(180)}
          className="absolute inset-0 z-40"
          pointerEvents="auto"
        >
          {Platform.OS === "ios" ? (
            <>
              <BlurView
                intensity={20}
                tint={blurTint}
                className="absolute inset-0"
              />
              <View className="absolute inset-0 bg-black/35" />
            </>
          ) : (
            <View className="absolute inset-0 bg-black/60" />
          )}
          <Pressable
            onPress={() => setMenuOpen(false)}
            className="absolute inset-0"
          />
        </Animated.View>
      )}

      {/* TAB BAR */}
      {!menuOpen && (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(220)}
          className="absolute left-4 rounded-full overflow-visible"
          style={{
            bottom: bottomSpace + 4,
            width: totalWidth,
          }}
          pointerEvents="box-none"
        >
          <TabBarContent blurTint={blurTint} isDark={isDark}>
            <View className="relative flex-row h-full items-center px-2">
              {tabsArray.map((tab, index) => (
                <TabButton
                  key={tab}
                  tab={tab}
                  index={index}
                  currentIndex={currentIndex}
                  onPress={() => onTabPress(index)}
                  isDark={isDark}
                  blurTint={blurTint}
                  getTabLabel={getTabLabel}
                />
              ))}
            </View>
          </TabBarContent>
        </Animated.View>
      )}

      {/* FAB */}
      <View
        className="absolute right-6 z-50"
        style={{ bottom: bottomSpace + 6 }}
        pointerEvents="box-none"
      >
        <FabMenu />
      </View>
    </View>
  );
};

export default CustomTabBar;
