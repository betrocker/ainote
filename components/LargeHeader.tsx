// components/LargeHeader.tsx
import { haptics } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React, { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LargeHeaderProps = {
  title: string;
  rightButtons?: ReactNode;
  expandableContent?: ReactNode;
  isExpanded?: boolean;
};

export default function LargeHeader({
  title,
  rightButtons,
  expandableContent,
  isExpanded = false,
}: LargeHeaderProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (isExpanded) {
      // Opening animation - ostaje isto
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          delay: 50,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          delay: 50,
          useNativeDriver: true,
        }),
      ]).start(() => {});
    } else {
      Keyboard.dismiss();

      setTimeout(() => {
        Animated.parallel([
          // ⭐ Height - smooth quadratic easing
          Animated.timing(heightAnim, {
            toValue: 0,
            duration: 300, // ⭐ Brže (bilo 400)
            easing: Easing.bezier(0.25, 0.1, 0.25, 1), // ⭐ Smooth quadratic out
            useNativeDriver: false,
          }),
          // ⭐ Opacity - brži fade out
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200, // ⭐ Mnogo brže (bilo 350)
            easing: Easing.out(Easing.quad), // ⭐ Quick fade
            useNativeDriver: true,
          }),
          // ⭐ TranslateY - quick slide up
          Animated.timing(translateYAnim, {
            toValue: -15, // ⭐ Malo manji translate (bilo -20)
            duration: 250, // ⭐ Brže (bilo 350)
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {});
      }, 80); // ⭐ Manji delay (bilo 100)
    }
  }, [isExpanded]);

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 800],
  });

  return (
    <View
      className="px-4 pb-3 bg-white/95 dark:bg-black/95 border-b border-ios-sep dark:border-iosd-sep"
      style={{
        paddingTop: insets.top + 8,
      }}
    >
      {/* Title row */}
      <View className="flex-row items-center justify-between">
        <Text className="text-3xl font-monaBold text-ios-label dark:text-iosd-label">
          {title}
        </Text>

        {rightButtons && (
          <View className="flex-row items-center gap-2">{rightButtons}</View>
        )}
      </View>

      {/* Animated expandable content */}
      <Animated.View
        style={{
          maxHeight,
          overflow: "hidden",
        }}
        pointerEvents={isExpanded ? "auto" : "none"}
      >
        <Animated.View
          style={{
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }],
          }}
        >
          {expandableContent && (
            <View className="mt-2">{expandableContent}</View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// HeaderButton component
export function HeaderButton({
  icon,
  onPress,
  active = false,
}: {
  icon: string;
  onPress: () => void;
  active?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    haptics.light();
    Animated.spring(scaleAnim, {
      toValue: 0.8,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`w-9 h-9 rounded-full items-center justify-center ${
          active ? "bg-ios-blue" : "bg-ios-fill dark:bg-iosd-fill"
        }`}
        activeOpacity={1}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={active ? "#FFF" : colorScheme === "dark" ? "#FFF" : "#000"}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}
