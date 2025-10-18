// components/ImageFullscreenViewer.tsx
import { Ionicons } from "@expo/vector-icons";
import { Zoomable } from "@likashefqet/react-native-image-zoom";
import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import React from "react";
import { Modal, StatusBar, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
};

export default function ImageFullscreenViewer({
  visible,
  imageUri,
  onClose,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View className="flex-1 bg-black items-center justify-center">
        {/* Close dugme */}
        <TouchableOpacity
          onPress={onClose}
          className={`absolute top-[50px] right-5 w-11 h-11 rounded-full items-center justify-center z-10 ${
            isDark ? "bg-black/60" : "bg-black/40"
          }`}
          activeOpacity={0.9}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Zoomable slika */}
        <Zoomable
          minScale={1}
          maxScale={5}
          doubleTapScale={3}
          isDoubleTapEnabled
          isSingleTapEnabled
          onSingleTap={onClose}
          style={{ width: "100%", height: "100%" }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        </Zoomable>
      </View>
    </Modal>
  );
}
