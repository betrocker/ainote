// components/SearchBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = "Pretraži beležke...",
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="mx-4 mb-3">
      <View className="flex-row items-center bg-ios-fill dark:bg-iosd-fill rounded-xl px-3 py-2.5 border border-ios-sep dark:border-iosd-sep">
        {/* Search icon */}
        <Ionicons
          name="search-outline"
          size={18}
          color={isDark ? "#8E8E93" : "#8E8E93"}
          style={{ marginRight: 8 }}
        />

        {/* Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          className="flex-1 text-base text-ios-label dark:text-iosd-label"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Clear button */}
        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-6 h-6 rounded-full bg-ios-secondary/20 dark:bg-iosd-label2/20 items-center justify-center"
          >
            <Ionicons name="close" size={14} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
