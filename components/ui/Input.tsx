// components/ui/Input.tsx
import { useColorScheme } from "nativewind";
import React, { forwardRef, useState } from "react";
import { Platform, StyleSheet, TextInput, TextInputProps } from "react-native";

const Input = forwardRef<TextInput, TextInputProps>(
  ({ className = "", autoCapitalize = "none", ...props }, ref) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [focused, setFocused] = useState(false);

    // iOS nijanse
    const placeholder = "#8E8E93"; // systemGray
    const caret = isDark ? "#0A84FF" : "#007AFF";

    // tvoje boje za “pill” pozadinu
    const fillBg = isDark
      ? "bg-[rgba(118,118,128,0.24)]"
      : "bg-[rgba(118,118,128,0.12)]";

    // mekana ivica (najbliže iOS fill stilu)
    const borderColor = focused
      ? isDark
        ? "rgba(10,132,255,0.55)"
        : "rgba(0,122,255,0.55)"
      : isDark
        ? "rgba(235,235,245,0.18)"
        : "rgba(60,60,67,0.12)";

    return (
      <TextInput
        ref={ref}
        {...props}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={placeholder}
        selectionColor={caret}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        underlineColorAndroid="transparent"
        // className zadržavamo radi tvojih tailwind tokena
        className={[
          "w-full mb-3 rounded-2xl px-4 py-3",
          "text-ios-label dark:text-iosd-label",
          // mali “elevation” kao na kartici sa slike
          "shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
          className,
        ].join(" ")}
        style={[
          {
            backgroundColor: fillBg,
            borderWidth:
              Platform.OS === "android"
                ? Math.max(1, StyleSheet.hairlineWidth * 1.5)
                : StyleSheet.hairlineWidth,
            borderColor,
          },
        ]}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;
