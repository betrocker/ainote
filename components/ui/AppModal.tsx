import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
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
  const { colorScheme } = useColorScheme(); // NativeWind hook
  const isDark = colorScheme === "dark";

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
  }, [visible, scaleAnim, opacityAnim]);

  if (!showModal) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessible={false}
      >
        {/* Solid pozadina */}
        <View
          style={StyleSheet.absoluteFill}
          className="bg-black/70 dark:bg-black/85"
        />

        {/* Blur overlay */}
        <BlurView
          intensity={isDark ? 80 : 50}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>

      {/* Modal content */}
      <View style={styles.contentContainer} pointerEvents="box-none">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            width: "92%",
            maxWidth: 420,
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} accessible={false}>
            <View className="rounded-[28px] overflow-hidden border-2 border-black/15 dark:border-white/20 shadow-2xl">
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(28, 28, 30, 0.98)", "rgba(18, 18, 18, 0.98)"]
                    : ["rgba(255, 255, 255, 0.95)", "rgba(242, 242, 247, 0.95)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ borderRadius: 28 }}
              >
                <View className="px-6 pt-6 pb-6">
                  {title ? (
                    <Text className="text-xl font-bold text-ios-label dark:text-white mb-2">
                      {title}
                    </Text>
                  ) : null}

                  {message ? (
                    <Text className="text-base text-ios-secondary dark:text-white/90 mb-4">
                      {message}
                    </Text>
                  ) : null}

                  {children}
                </View>
              </LinearGradient>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
});
