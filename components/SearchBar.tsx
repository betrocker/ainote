// components/SearchBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onClear?: () => void; // ⭐ OPCIONI
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  autoFocus = false,
  onClear, // ⭐ Opcioni prop
}: SearchBarProps) {
  const { colorScheme } = useColorScheme();

  const handleClear = () => {
    if (onClear) {
      onClear(); // Pozovi custom onClear ako postoji
    } else {
      onChangeText(""); // Default: resetuj value
    }
  };

  return (
    <View className="flex-row items-center px-3 py-2 rounded-xl bg-ios-fill dark:bg-iosd-fill border border-ios-sep dark:border-iosd-sep">
      <Ionicons
        name="search"
        size={18}
        color={colorScheme === "dark" ? "#8E8E93" : "#8E8E93"}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        autoFocus={autoFocus}
        className="flex-1 ml-2 text-ios-label dark:text-iosd-label text-base py-1"
      />

      {/* ⭐ Clear button (prikazuje se samo ako ima tekst) */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          className="ml-2 w-5 h-5 rounded-full bg-ios-gray6 dark:bg-white/20 items-center justify-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={12} color="#8E8E93" />
        </TouchableOpacity>
      )}
    </View>
  );
}
