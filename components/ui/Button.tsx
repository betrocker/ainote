// components/ui/Button.tsx
import clsx from "clsx";
import { useColorScheme } from "nativewind";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "default";
export type ButtonSize = "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  title,
  variant = "secondary", // "default" mapira na secondary
  size = "md",
  loading = false,
  disabled,
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const v = variant === "default" ? "secondary" : variant;

  const height = size === "lg" ? 52 : 44;
  const textSize = size === "lg" ? "text-[17px]" : "text-[15px]";

  const base = clsx(
    "items-center justify-center border",
    !fullWidth && "min-w-[160px]",
    fullWidth && "w-full",
    "rounded-[24px]"
  );

  // Primarni koristi tvoje tokene: bg-ios-blue / dark:bg-iosd-blue
  const primaryClasses =
    "bg-ios-blue dark:bg-iosd-blue border-transparent text-white";

  // Sekundarni i Destruktivni: iOS glass (isti fill u oba slučaja), drugačiji label
  const glassFill =
    "bg-[rgba(118,118,128,0.12)] dark:bg-[rgba(118,118,128,0.24)]";
  const glassBorder = "border-white/50 dark:border-black/50";

  const containerClasses = clsx(
    base,
    v === "primary" ? primaryClasses : clsx(glassFill, glassBorder),
    disabled || loading ? "opacity-60" : "active:opacity-85",
    className
  );

  const labelClasses = clsx(
    "font-monaBold text-center",
    textSize,
    v === "primary"
      ? "text-white"
      : v === "destructive"
        ? "text-red-500"
        : "text-black dark:text-white"
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      className={containerClasses}
      style={{
        height,
        paddingHorizontal: 20,
        alignSelf: fullWidth ? "stretch" : "flex-start",
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            v === "destructive" ? (isDark ? "#FF453A" : "#FF453A") : "#FFFFFF"
          }
        />
      ) : (
        <Text className={labelClasses} numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
