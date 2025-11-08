// components/AnimatedSplash.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Icon scale up + fade in
    scale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    // Subtle rotation effect
    rotation.value = withSequence(
      withTiming(-5, { duration: 300 }),
      withTiming(5, { duration: 300 }),
      withTiming(0, { duration: 300 })
    );

    // Fade out after showing
    opacity.value = withDelay(
      1400,
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF9500", "#FF6B00", "#FF9500"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={animatedStyle}>
        <Image
          source={require("@/assets/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 200,
    height: 200,
  },
});
