// components/TagInput.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onAddTag: (tag: string) => void;
  existingTags?: string[];
};

export default function TagInput({ onAddTag, existingTags = [] }: Props) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !existingTags.includes(trimmed)) {
      onAddTag(trimmed);
      setInputValue("");
    }
  };

  return (
    <View className="flex-row items-center bg-ios-fill dark:bg-iosd-fill rounded-xl px-3 py-2 border border-ios-sep dark:border-iosd-sep">
      <Ionicons
        name="pricetag-outline"
        size={16}
        color="#8E8E93"
        style={{ marginRight: 8 }}
      />

      <TextInput
        value={inputValue}
        onChangeText={setInputValue}
        placeholder="Dodaj tag..."
        placeholderTextColor="#8E8E93"
        className="flex-1 text-base text-ios-label dark:text-iosd-label"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleAdd}
      />

      {inputValue.length > 0 && (
        <TouchableOpacity
          onPress={handleAdd}
          className="w-8 h-8 rounded-full bg-ios-blue items-center justify-center"
        >
          <Ionicons name="add" size={18} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
