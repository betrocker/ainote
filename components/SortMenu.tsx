// components/SortMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SortOption = "newest" | "oldest" | "titleAsc" | "titleDesc" | "type";

type SortMenuProps = {
  visible: boolean;
  currentSort: SortOption; // ⭐ Dodaj ovo
  onSelectSort: (sort: SortOption) => void;
  onClose: () => void;
};

const SORT_OPTIONS: {
  value: SortOption;
  label: string;
  icon: string;
}[] = [
  { value: "newest", label: "Newest first", icon: "arrow-down" },
  { value: "oldest", label: "Oldest first", icon: "arrow-up" },
  { value: "titleAsc", label: "Title A-Z", icon: "text" },
  { value: "titleDesc", label: "Title Z-A", icon: "text" },
  { value: "type", label: "By type", icon: "albums" },
];

export default function SortMenu({
  visible,
  currentSort, // ⭐ Primaj prop
  onSelectSort,
  onClose,
}: SortMenuProps) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50">
          <TouchableWithoutFeedback>
            <View
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-iosd-bg rounded-t-3xl"
              style={{ paddingBottom: insets.bottom }}
            >
              {/* Header */}
              <View className="px-4 py-4 border-b border-ios-sep dark:border-iosd-sep">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
                    Sort by
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    className="w-8 h-8 rounded-full bg-ios-fill dark:bg-iosd-fill items-center justify-center"
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={isDark ? "#FFF" : "#000"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Options */}
              <View className="p-4">
                {SORT_OPTIONS.map((option) => {
                  const isSelected = currentSort === option.value; // ⭐ Check if selected

                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => onSelectSort(option.value)}
                      className={`flex-row items-center justify-between py-3 px-4 rounded-xl mb-2 ${
                        isSelected
                          ? "bg-ios-blue/15 border border-ios-blue/30" // ⭐ Selected style
                          : "bg-ios-fill dark:bg-iosd-fill"
                      }`}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center">
                        <View
                          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                            isSelected
                              ? "bg-ios-blue"
                              : "bg-ios-gray6 dark:bg-white/10"
                          }`}
                        >
                          <Ionicons
                            name={option.icon as any}
                            size={20}
                            color={isSelected ? "#FFF" : "#8E8E93"}
                          />
                        </View>
                        <Text
                          className={`text-base font-medium ${
                            isSelected
                              ? "text-ios-blue"
                              : "text-ios-label dark:text-iosd-label"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </View>

                      {isSelected && (
                        <Ionicons name="checkmark" size={24} color="#0A84FF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
