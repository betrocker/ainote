// components/AnimatedSplash.tsx
import React, { useEffect } from "react";
import { Image, View } from "react-native";
import Animated, {
  Easing,
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
    scale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    opacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    rotation.value = withSequence(
      withTiming(-5, { duration: 300 }),
      withTiming(5, { duration: 300 }),
      withTiming(0, { duration: 300 })
    );

    opacity.value = withDelay(1400, withTiming(0, { duration: 400 }));

    const timer = setTimeout(onFinish, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <View
      // ⭐ IZMENA: Ukloni 'absolute' - bude full screen component
      className="flex-1 items-center justify-center bg-white"
      style={{ flex: 1 }} // ⭐ DODAJ style za sigurnost
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={require("@/assets/images/splash.png")}
          className="w-[250px] h-[250px]"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
