import { useTab } from "@/context/TabContext";
import FabMenu from "@components/FabMenu";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef } from "react";
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
    default:
      return "ellipse-outline";
  }
};

const BASE_TABBAR_HEIGHT = 64; // h-16
const ANDROID_FALLBACK_BOTTOM = 16; // kad insets.bottom = 0 na 3-dugmeta navi

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  currentIndex,
  onTabPress,
  tabs,
}) => {
  const { setActive, menuOpen, setMenuOpen } = useTab();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === "dark";
  const blurTint = isDark ? "dark" : "light";

  // realan bottom spacing (Android fallback ako je 0)
  const bottomSpace =
    Platform.OS === "android"
      ? insets.bottom && insets.bottom > 0
        ? insets.bottom
        : ANDROID_FALLBACK_BOTTOM
      : insets.bottom;

  const segmentW = useSharedValue(0);
  const pillX = useSharedValue(0);
  const pillScale = useSharedValue(1);
  const prevWidth = useRef(0);

  const movePill = useCallback(
    (index: number) => {
      if (segmentW.value <= 0) return;
      const newWidth = segmentW.value * 0.9;
      const segmentCenter = index * segmentW.value + segmentW.value / 2;
      const targetX = segmentCenter - newWidth / 2;
      pillX.value = withTiming(targetX, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    },
    [segmentW]
  );

  const triggerBounce = useCallback(() => {
    pillScale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withTiming(1.05, { duration: 110 }),
      withSpring(1, { damping: 16, stiffness: 220 })
    );
  }, []);

  useEffect(() => {
    movePill(currentIndex);
  }, [currentIndex, movePill]);

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
    [tabs.length, currentIndex]
  );

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
          <BlurView
            intensity={20}
            tint={blurTint}
            className="absolute inset-0"
          />
          <View className="absolute inset-0 bg-black/35" />
          <Pressable
            onPress={() => setMenuOpen(false)}
            className="absolute inset-0"
          />
        </Animated.View>
      )}

      {/* TAB BAR – levo 70%, podignut za bottomSpace */}
      {!menuOpen && (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(220)}
          className="absolute left-4 w-[70%] rounded-full overflow-visible"
          style={{ bottom: bottomSpace + 4 }} // umesto bottom-4
          pointerEvents="box-none"
        >
          <BlurView
            intensity={50}
            tint={blurTint}
            className="rounded-full overflow-hidden h-16 border border-black/10 dark:border-white/10"
          >
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
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </AnimatedTouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* FAB – desno, pozicioniran iznad nav bara */}
      <View
        className="absolute right-6 z-50"
        style={{ bottom: bottomSpace + 6 }} // umesto bottom-4
        pointerEvents="box-none"
      >
        <FabMenu />
      </View>
    </View>
  );
};

export default CustomTabBar;
