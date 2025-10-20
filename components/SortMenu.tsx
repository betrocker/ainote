// components/SortMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export type SortOption =
  | "date-desc"
  | "date-asc"
  | "title-asc"
  | "title-desc"
  | "type";

type Props = {
  activeSortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

const sortOptions: Array<{
  value: SortOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "date-desc", label: "Najnovije prve", icon: "arrow-down" },
  { value: "date-asc", label: "Najstarije prve", icon: "arrow-up" },
  { value: "title-asc", label: "Naslov (A-Z)", icon: "text-outline" },
  { value: "title-desc", label: "Naslov (Z-A)", icon: "text-outline" },
  { value: "type", label: "Po tipu", icon: "albums-outline" },
];

export default function SortMenu({ activeSortOption, onSortChange }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const { colorScheme } = useColorScheme();

  const activeLabel =
    sortOptions.find((opt) => opt.value === activeSortOption)?.label ||
    "Sortiraj";

  const handleSelect = (option: SortOption) => {
    onSortChange(option);
    setIsVisible(false);
  };

  return (
    <>
      {/* Trigger button */}
      <Pressable
        onPress={() => setIsVisible(true)}
        className="flex-row items-center px-3 py-2 rounded-full bg-ios-fill dark:bg-iosd-fill border border-ios-sep dark:border-iosd-sep active:opacity-70"
      >
        <Ionicons
          name="funnel-outline"
          size={16}
          color="#8E8E93"
          style={{ marginRight: 6 }}
        />
        <Text className="text-sm font-medium text-ios-secondary dark:text-iosd-label2">
          {activeLabel}
        </Text>
      </Pressable>

      {/* Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => setIsVisible(false)}
        >
          <Pressable
            className="w-[85%] max-w-md"
            onPress={(e) => e.stopPropagation()}
          >
            <BlurView
              intensity={colorScheme === "dark" ? 80 : 100}
              tint={colorScheme === "dark" ? "dark" : "light"}
              className="rounded-3xl overflow-hidden border border-black/10 dark:border-white/15"
            >
              <View className="p-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name="funnel"
                      size={24}
                      color={colorScheme === "dark" ? "#fff" : "#000"}
                    />
                    <Text className="text-2xl font-bold text-ios-label dark:text-iosd-label">
                      Sortiraj po
                    </Text>
                  </View>
                  <Pressable onPress={() => setIsVisible(false)} hitSlop={8}>
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={colorScheme === "dark" ? "#9CA3AF" : "#6B7280"}
                    />
                  </Pressable>
                </View>

                {/* Options */}
                <View className="mb-4">
                  {sortOptions.map((option, idx) => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSelect(option.value)}
                      className={[
                        "flex-row items-center px-4 py-3 rounded-xl mb-2 active:opacity-70",
                        activeSortOption === option.value
                          ? colorScheme === "dark"
                            ? "bg-ios-blue/25"
                            : "bg-ios-blue/15"
                          : colorScheme === "dark"
                            ? "bg-white/10"
                            : "bg-gray-100",
                      ].join(" ")}
                    >
                      <View
                        className={[
                          "w-10 h-10 rounded-full items-center justify-center mr-3",
                          activeSortOption === option.value
                            ? "bg-ios-blue"
                            : colorScheme === "dark"
                              ? "bg-white/10"
                              : "bg-gray-200",
                        ].join(" ")}
                      >
                        <Ionicons
                          name={option.icon}
                          size={20}
                          color={
                            activeSortOption === option.value
                              ? "#FFF"
                              : colorScheme === "dark"
                                ? "#9CA3AF"
                                : "#6B7280"
                          }
                        />
                      </View>

                      <Text
                        className={[
                          "flex-1 text-base font-medium",
                          activeSortOption === option.value
                            ? "text-ios-blue dark:text-ios-blue"
                            : "text-ios-label dark:text-iosd-label",
                        ].join(" ")}
                      >
                        {option.label}
                      </Text>

                      {activeSortOption === option.value && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#0A84FF"
                        />
                      )}
                    </Pressable>
                  ))}
                </View>

                {/* Cancel Button */}
                <Pressable
                  onPress={() => setIsVisible(false)}
                  className="py-3 rounded-xl bg-ios-fill dark:bg-iosd-fill active:opacity-70"
                >
                  <Text className="text-center font-semibold text-ios-label dark:text-iosd-label">
                    Otkaži
                  </Text>
                </Pressable>
              </View>
            </BlurView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
