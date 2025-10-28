import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    icon: "mic-outline",
    iconSet: "Ionicons",
    title: "AI Transkripcija",
    description: "Snimi audio ili video - AI će automatski pretvoriti u tekst",
    backgroundColor: "#007AFF",
  },
  {
    id: 2,
    icon: "robot-outline",
    iconSet: "MaterialCommunityIcons",
    title: "Pametna Pretraga",
    description:
      "Postavi pitanje - AI pretražuje sve tvoje beleške i daje odgovor",
    backgroundColor: "#5856D6",
  },
  {
    id: 3,
    icon: "scan-outline",
    iconSet: "Ionicons",
    title: "OCR Tehnologija",
    description:
      "Fotografiši tekst i automatski ga pretvori u digitalne beleške",
    backgroundColor: "#FF9500",
  },
  {
    id: 4,
    icon: "lock-closed-outline",
    iconSet: "Ionicons",
    title: "Privatne Beleške",
    description: "Zaštiti osetljive informacije sa Face ID ili Touch ID",
    backgroundColor: "#34C759",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleSkip = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(tabs)/home");
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSkip();
    }
  };

  return (
    <View className="flex-1 bg-black">
      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <OnboardingItem item={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Skip Button */}
      <View className="absolute top-14 right-6">
        <Pressable onPress={handleSkip} className="px-4 py-2 active:opacity-60">
          <Text className="text-white/60 text-base font-medium">Preskoči</Text>
        </Pressable>
      </View>

      {/* Pagination Dots */}
      <View className="absolute bottom-32 w-full items-center">
        <View className="flex-row gap-2">
          {onboardingData.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              scrollX={scrollX}
              currentIndex={currentIndex}
            />
          ))}
        </View>
      </View>

      {/* Next/Get Started Button */}
      <View className="absolute bottom-12 w-full px-6">
        <Pressable
          onPress={handleNext}
          className="bg-white rounded-2xl py-4 active:opacity-80"
        >
          <Text className="text-black text-center text-base font-semibold">
            {currentIndex === onboardingData.length - 1 ? "Započni" : "Dalje"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// Onboarding Item Component
function OnboardingItem({ item, index, scrollX }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8]);

    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      onboardingData.map((_, i) => i * width),
      onboardingData.map((item) => item.backgroundColor)
    );

    return { backgroundColor };
  });

  // Render icon based on iconSet
  const renderIcon = () => {
    const iconProps = {
      name: item.icon,
      size: 80,
      color: "white",
    };

    if (item.iconSet === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons {...iconProps} />;
    }
    return <Ionicons {...iconProps} />;
  };

  return (
    <View
      style={{ width, height }}
      className="justify-center items-center px-8"
    >
      <Animated.View style={backgroundStyle} className="absolute inset-0" />

      <Animated.View style={animatedStyle} className="items-center">
        {/* Icon Container with Glass Effect */}
        <BlurView
          intensity={20}
          tint="dark"
          className="w-40 h-40 rounded-full items-center justify-center mb-12 overflow-hidden"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
        >
          {renderIcon()}
        </BlurView>

        {/* Title */}
        <Text className="text-white text-4xl font-bold text-center mb-4">
          {item.title}
        </Text>

        {/* Description */}
        <Text className="text-white/70 text-lg text-center leading-7 px-4">
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );
}

// Pagination Dot Component
function PaginationDot({ index, scrollX, currentIndex }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8]);

    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);

    return {
      width: withSpring(dotWidth, { damping: 15 }),
      opacity: withSpring(opacity),
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className="h-2 bg-white rounded-full"
    />
  );
}
