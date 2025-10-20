// components/TagChip.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  tag: string;
  onRemove?: () => void;
  onPress?: () => void;
  variant?: "default" | "removable";
  selected?: boolean; // ⭐ NOVO
};

export default function TagChip({
  tag,
  onRemove,
  onPress,
  variant = "default",
  selected = false, // ⭐ NOVO
}: Props) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      className={[
        "flex-row items-center px-3 py-1.5 rounded-full mr-2 mb-2 border",
        selected
          ? "bg-ios-blue border-ios-blue" // ⭐ Active state
          : "bg-ios-blue/15 dark:bg-ios-blue/20 border-ios-blue/30",
      ].join(" ")}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons
        name="pricetag"
        size={12}
        color={selected ? "#FFF" : "#0A84FF"} // ⭐ White ikona kada je selected
        style={{ marginRight: 4 }}
      />
      <Text
        className={[
          "text-sm font-medium mr-1",
          selected ? "text-white" : "text-ios-blue", // ⭐ White text kada je selected
        ].join(" ")}
      >
        {tag}
      </Text>

      {variant === "removable" && onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="ml-1"
        >
          <Ionicons name="close-circle" size={16} color="#0A84FF" />
        </TouchableOpacity>
      )}
    </Container>
  );
}
