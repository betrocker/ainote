// components/ScreenBackground.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import React from "react";
import { ColorValue, StyleSheet, View, ViewProps } from "react-native";

type Props = ViewProps & {
  children?: React.ReactNode;
  /**
   * "plain"    (default) — systemBackground (surface)
   * "grouped"  — systemGroupedBackground
   * "gradient" — linearni gradient
   */
  variant?: "plain" | "grouped" | "gradient";
  /**
   * Tint overlay za kontrast
   */
  tint?: "none" | "soft" | "medium" | "strong";
  className?: string;
};

export default function ScreenBackground({
  children,
  variant = "plain",
  tint = "none",
  className = "",
  style,
  ...rest
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // odredi baznu pozadinu
  const baseBg =
    variant === "grouped"
      ? "bg-ios-bg dark:bg-iosd-bg"
      : "bg-ios-surface dark:bg-iosd-surface";

  // gradient paleta
  const gradientColors: [ColorValue, ColorValue, ...ColorValue[]] = isDark
    ? ["#0F2027", "#203A43", "#2C5364"]
    : ["#A1C4FD", "#C2E9FB"];

  // tint overlay
  const tintClass =
    tint === "soft"
      ? "bg-black/10 dark:bg-white/10"
      : tint === "medium"
        ? "bg-black/20 dark:bg-white/20"
        : tint === "strong"
          ? "bg-black/30 dark:bg-white/30"
          : "";

  return (
    <View className={`flex-1 ${baseBg} ${className}`} style={style} {...rest}>
      {variant === "gradient" && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {tint !== "none" && (
        <View
          pointerEvents="none"
          className={`absolute inset-0 ${tintClass}`}
        />
      )}

      {children}
    </View>
  );
}
