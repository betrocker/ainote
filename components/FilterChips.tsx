// components/FilterChips.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";

export type FilterType = "all" | "text" | "audio" | "photo" | "video";

type Props = {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
};

const filters: Array<{
  type: FilterType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}> = [
  {
    type: "all",
    label: "Sve",
    icon: "apps-outline",
    color: "#6B7280",
    bgColor: "bg-gray-500/15",
  },
  {
    type: "text",
    label: "Tekst",
    icon: "document-text-outline",
    color: "#0A84FF",
    bgColor: "bg-ios-blue/15",
  },
  {
    type: "audio",
    label: "Audio",
    icon: "mic-outline",
    color: "#A855F7",
    bgColor: "bg-purple-500/15",
  },
  {
    type: "photo",
    label: "Foto",
    icon: "image-outline",
    color: "#10B981",
    bgColor: "bg-green-500/15",
  },
  {
    type: "video",
    label: "Video",
    icon: "videocam-outline",
    color: "#F59E0B",
    bgColor: "bg-amber-500/15",
  },
];

export default function FilterChips({ activeFilter, onFilterChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mx-4 mb-3"
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.type;
        return (
          <TouchableOpacity
            key={filter.type}
            onPress={() => onFilterChange(filter.type)}
            className={[
              "flex-row items-center px-4 py-2 rounded-full mr-2 border",
              isActive
                ? `${filter.bgColor} border-current`
                : "bg-ios-fill dark:bg-iosd-fill border-ios-sep dark:border-iosd-sep",
            ].join(" ")}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={isActive ? filter.color : "#8E8E93"}
              style={{ marginRight: 6 }}
            />
            <Text
              className={[
                "text-sm font-semibold",
                isActive ? "" : "text-ios-secondary dark:text-iosd-label2",
              ].join(" ")}
              style={isActive ? { color: filter.color } : {}}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
