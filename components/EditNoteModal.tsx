// components/EditNoteModal.tsx
import { Note } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type EditNoteModalProps = {
  isVisible: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (id: string, title: string, description: string) => void;
};

export default function EditNoteModal({
  isVisible,
  note,
  onClose,
  onSave,
}: EditNoteModalProps) {
  const { colorScheme } = useColorScheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setDescription(note.description || "");
    }
  }, [note]);

  useEffect(() => {
    validateForm();
  }, [title]);

  const validateForm = () => {
    let newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = "Naslov je obavezan";
    } else if (title.length < 3) {
      newErrors.title = "Naslov mora imati najmanje 3 karaktera";
    } else if (title.length > 100) {
      newErrors.title = "Naslov može imati maksimalno 100 karaktera";
    }

    setErrors(newErrors);
  };

  const isFormValid = !errors.title && title.trim().length > 0;

  const handleSave = () => {
    if (isFormValid && note) {
      onSave(note.id, title.trim(), description.trim());
      onClose();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!note) return null;

  const getIcon = () => {
    switch (note.type) {
      case "audio":
        return "mic";
      case "video":
        return "videocam";
      case "photo":
        return "camera";
      default:
        return "document-text";
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={handleClose}
        >
          <Pressable
            className="w-[85%] max-h-[80%]"
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
                      name={getIcon()}
                      size={24}
                      color={colorScheme === "dark" ? "#fff" : "#000"}
                    />
                    <Text className="text-2xl font-bold text-ios-label dark:text-iosd-label">
                      Izmeni belešku
                    </Text>
                  </View>
                  <Pressable onPress={handleClose} hitSlop={8}>
                    <Ionicons
                      name="close-circle"
                      size={28}
                      color={colorScheme === "dark" ? "#9CA3AF" : "#6B7280"}
                    />
                  </Pressable>
                </View>

                <ScrollView
                  className="max-h-96"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Title Input */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2 text-ios-label dark:text-iosd-label">
                      Naslov *
                    </Text>
                    <TextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Unesi naslov beleške"
                      placeholderTextColor={
                        colorScheme === "dark" ? "#6B7280" : "#9CA3AF"
                      }
                      className={`px-4 py-3 rounded-xl text-base ${
                        colorScheme === "dark"
                          ? "bg-white/10 text-white"
                          : "bg-gray-100 text-gray-900"
                      } ${errors.title ? "border-2 border-red-500" : ""}`}
                      maxLength={100}
                    />
                    {errors.title && (
                      <Text className="text-red-500 text-xs mt-1 ml-1">
                        {errors.title}
                      </Text>
                    )}
                    <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-1 ml-1">
                      {title.length}/100
                    </Text>
                  </View>

                  {/* Description Input */}
                  <View className="mb-6">
                    <Text className="text-sm font-semibold mb-2 text-ios-label dark:text-iosd-label">
                      Opis (opciono)
                    </Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Dodaj opis..."
                      placeholderTextColor={
                        colorScheme === "dark" ? "#6B7280" : "#9CA3AF"
                      }
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      className={`px-4 py-3 rounded-xl text-base min-h-[100px] ${
                        colorScheme === "dark"
                          ? "bg-white/10 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                      maxLength={500}
                    />
                    <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-1 ml-1">
                      {description.length}/500
                    </Text>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-2">
                  <Pressable
                    onPress={handleClose}
                    className="flex-1 py-3 rounded-xl bg-ios-fill dark:bg-iosd-fill active:opacity-70"
                  >
                    <Text className="text-center font-semibold text-ios-label dark:text-iosd-label">
                      Otkaži
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    disabled={!isFormValid}
                    className={`flex-1 py-3 rounded-xl ${
                      isFormValid
                        ? "bg-ios-blue active:opacity-70"
                        : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        isFormValid
                          ? "text-white"
                          : "text-gray-400 dark:text-gray-600"
                      }`}
                    >
                      Sačuvaj
                    </Text>
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
