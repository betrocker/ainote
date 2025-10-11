import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  children?: React.ReactNode;
}

export default function AppModal({
  visible,
  onClose,
  title,
  message,
  children,
}: AppModalProps) {
  const [showModal, setShowModal] = useState(visible);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

  if (!showModal) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      {/* Blur overlay */}
      <Pressable className="flex-1" onPress={onClose}>
        <BlurView
          intensity={40}
          tint="default"
          style={{ position: "absolute", inset: 0 }}
        />
      </Pressable>

      {/* Modal content */}
      <View className="absolute inset-0 justify-center items-center px-4">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            width: "92%",
            maxWidth: 420,
          }}
        >
          <View className="rounded-[28px] overflow-hidden border border-black/10 dark:border-white/10">
            <LinearGradient
              colors={
                colorScheme === "dark"
                  ? ["rgba(0,0,0,0.4)", "rgba(18,18,18,1)"]
                  : ["rgba(255,255,255,0.8)", "rgba(230,230,230,1)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ borderRadius: 28 }}
            >
              {/* JEDNAK padding za sve – naslov, tekst, content i dugmad */}
              <View className="px-6 pt-6 pb-6">
                {title ? (
                  <Text className="text-xl font-monaBold text-ios-label dark:text-white mb-2">
                    {title}
                  </Text>
                ) : null}

                {message ? (
                  <Text className="text-base font-mona text-ios-secondary dark:text-white/70 mb-4">
                    {message}
                  </Text>
                ) : null}

                {/* children = Input + Actions iz providera */}
                {children}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
