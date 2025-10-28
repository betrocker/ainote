// components/CustomTabBar.tsx
import FabMenu from "@/components/FabMenu";
import { useTab } from "@/context/TabContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next"; // ✅ Dodato
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CustomTabBarProps {
  currentIndex: number;
  onTabPress: (index: number) => void;
  tabs: readonly string[];
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const getIconByRouteName = (route: string) => {
  const r = route.toLowerCase();
  switch (r) {
    case "home":
      return "home-outline";
    case "inbox":
      return "mail-outline";
    case "assistant":
      return "chatbubble-ellipses-outline";
    case "private":
      return "lock-closed-outline";
    default:
      return "ellipse-outline";
  }
};

const BASE_TABBAR_HEIGHT = 64;
const ANDROID_FALLBACK_BOTTOM = 16;

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  currentIndex,
  onTabPress,
  tabs,
}) => {
  const { t } = useTranslation("common"); // ✅ Dodato
  const { setActive, menuOpen, setMenuOpen } = useTab();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === "dark";
  const blurTint = isDark ? "dark" : "light";

  const bottomSpace =
    Platform.OS === "android"
      ? insets.bottom && insets.bottom > 0
        ? insets.bottom
        : ANDROID_FALLBACK_BOTTOM
      : insets.bottom;

  // ====== Shared i anim vrednosti ======
  const segmentW = useSharedValue(0);
  const pillX = useSharedValue(0);
  const pillScale = useSharedValue(1);
  const currentIdxSV = useSharedValue(currentIndex);

  useEffect(() => {
    currentIdxSV.value = currentIndex;
  }, [currentIndex, currentIdxSV]);

  const triggerBounce = useCallback(() => {
    pillScale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withTiming(1.05, { duration: 110 }),
      withSpring(1, { damping: 16, stiffness: 220 })
    );
  }, [pillScale]);

  useDerivedValue(() => {
    if (segmentW.value <= 0) return;
    const newWidth = segmentW.value * 0.9;
    const segmentCenter =
      currentIdxSV.value * segmentW.value + segmentW.value / 2;
    const targetX = segmentCenter - newWidth / 2;
    pillX.value = withTiming(targetX, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  });

  const pillStyle = useAnimatedStyle(() => {
    if (segmentW.value <= 0) return {};
    return {
      width: segmentW.value * 0.9,
      height: 46,
      borderRadius: 9999,
      position: "absolute",
      top: "50%",
      transform: [
        { translateY: -23 },
        { translateX: pillX.value },
        { scale: pillScale.value },
      ],
    };
  });

  const prevWidth = useRef(0);
  const onLayout = useCallback(
    (event: any) => {
      const w = event.nativeEvent.layout.width;
      if (tabs.length > 0 && w > 0 && w !== prevWidth.current) {
        prevWidth.current = w;
        const segWidth = w / tabs.length;
        segmentW.value = segWidth;

        const newWidth = segWidth * 0.9;
        const segmentCenter = currentIndex * segWidth + segWidth / 2;
        pillX.value = segmentCenter - newWidth / 2;
      }
    },
    [tabs.length, currentIndex, segmentW, pillX]
  );

  // ✅ Helper funkcija za dobijanje tab label-a
  const getTabLabel = (tab: string) => {
    const lowercaseTab = tab.toLowerCase();
    return t(`tabs.${lowercaseTab}`);
  };

  // Wrapper komponenta za Tab Bar sa platform-specific stilom
  const TabBarContent = ({ children }: { children: React.ReactNode }) => {
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

    // Android fallback - solid background sa opacity
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

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay kad je FAB meni otvoren */}
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
          className="absolute left-4 w-[70%] rounded-full overflow-visible"
          style={{ bottom: bottomSpace + 4 }}
          pointerEvents="box-none"
        >
          <TabBarContent>
            <View
              className="relative flex-row h-full items-center"
              onLayout={onLayout}
            >
              <Animated.View
                style={[pillStyle, { minWidth: 80 }]}
                className="absolute bg-gray-800/[0.15] dark:bg-white/15 border border-gray-800/[0.2] dark:border-white/20"
              />
              {tabs.map((tab, index) => {
                const isFocused = currentIndex === index;
                return (
                  <AnimatedTouchableOpacity
                    key={tab}
                    layout={LinearTransition.springify().damping(16)}
                    onPress={() => {
                      onTabPress(index);
                      triggerBounce();
                    }}
                    className="flex-1 items-center justify-center h-full"
                  >
                    <Ionicons
                      name={getIconByRouteName(tab)}
                      size={22}
                      color={
                        isFocused
                          ? isDark
                            ? "#0A84FF"
                            : "#007AFF"
                          : isDark
                            ? "#EBEBF599"
                            : "#3C3C4399"
                      }
                    />
                    <Text
                      className={`mt-1 text-xs font-medium ${
                        isFocused
                          ? "text-ios-blue dark:text-iosd-blue"
                          : "text-ios-label2 dark:text-iosd-label2"
                      }`}
                    >
                      {getTabLabel(tab)} {/* ✅ Promenjeno */}
                    </Text>
                  </AnimatedTouchableOpacity>
                );
              })}
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
