import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function AnimatedIcon({
  name,
  size,
  color,
  animation,
}: {
  name: any;
  size: number;
  color: string;
  animation: string;
}) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (animation === "pulse") {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.ease }),
          withTiming(1, { duration: 1000, easing: Easing.ease })
        ),
        -1,
        false
      );
    } else if (animation === "sparkle") {
      rotate.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  // 🔧 Jednostavnije - bez opacity animacije
  return (
    <Animated.View style={animatedStyle}>
      <View style={{ backgroundColor: "transparent" }}>
        <Ionicons name={name} size={size} color={color} />
      </View>
    </Animated.View>
  );
}

function SocialProof() {
  const { t } = useTranslation();

  return (
    <BlurView
      intensity={30}
      tint="dark"
      className="rounded-2xl overflow-hidden px-4 py-3 flex-row items-center"
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <View className="flex-row -space-x-2 mr-3">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="w-8 h-8 rounded-full bg-blue-500 border-2 border-black items-center justify-center"
          >
            <Text className="text-white text-xs font-bold">👤</Text>
          </View>
        ))}
      </View>
      <Text className="text-white text-sm font-medium">
        {t("onboarding.socialProof")}
      </Text>
    </BlurView>
  );
}

function FeatureBadge({ text }: { text: string }) {
  return (
    <BlurView
      intensity={20}
      tint="dark"
      className="rounded-full overflow-hidden px-4 py-2"
      style={{
        backgroundColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
      }}
    >
      <Text className="text-white text-sm font-semibold">✨ {text}</Text>
    </BlurView>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const slides = [
    {
      icon: "mic" as const,
      titleKey: "onboarding.slides.voice.title",
      subtitleKey: "onboarding.slides.voice.subtitle",
      benefitKey: "onboarding.slides.voice.badge",
      gradient: ["#667eea", "#764ba2"],
      accentColor: "#667eea",
      animation: "pulse",
    },
    {
      icon: "star" as const,
      titleKey: "onboarding.slides.search.title",
      subtitleKey: "onboarding.slides.search.subtitle",
      benefitKey: "onboarding.slides.search.badge",
      gradient: ["#f093fb", "#f5576c"],
      accentColor: "#f093fb",
      animation: "sparkle",
    },
    {
      icon: "camera" as const,
      titleKey: "onboarding.slides.scan.title",
      subtitleKey: "onboarding.slides.scan.subtitle",
      benefitKey: "onboarding.slides.scan.badge",
      gradient: ["#4facfe", "#00f2fe"],
      accentColor: "#4facfe",
      animation: "scan",
    },
    {
      icon: "lock-closed" as const,
      titleKey: "onboarding.slides.private.title",
      subtitleKey: "onboarding.slides.private.subtitle",
      benefitKey: "onboarding.slides.private.badge",
      gradient: ["#43e97b", "#38f9d7"],
      accentColor: "#43e97b",
      animation: "lock",
      cta: true,
    },
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const completeOnboarding = async () => {
    await AsyncStorage.setItem("@viewedOnboarding", "true");
    router.replace("/(tabs)/home");
  };

  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      // @ts-ignore
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  };

  const isLastSlide = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex];

  // Background animation
  const backgroundScale = useSharedValue(1);
  useEffect(() => {
    backgroundScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 8000, easing: Easing.ease }),
        withTiming(1, { duration: 8000, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, []);

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backgroundScale.value }],
  }));

  return (
    <View className="flex-1 bg-black">
      {/* Animated Gradient Background */}
      <Animated.View
        style={[
          { position: "absolute", width: "100%", height: "100%" },
          backgroundStyle,
        ]}
      >
        <LinearGradient
          colors={[
            currentSlide.gradient[0],
            currentSlide.gradient[1],
            "#000000",
          ]}
          style={{
            flex: 1,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Floating Orbs */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.3,
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: currentSlide.accentColor,
            top: -100,
            left: -100,
            opacity: 0.2,
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: currentSlide.accentColor,
            bottom: 100,
            right: -50,
            opacity: 0.15,
          }}
        />
      </View>

      {/* Top Social Proof */}
      <View className="pt-16 px-6">
        <SocialProof />
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentIndex(index);
        }}
      >
        {slides.map((slide, index) => (
          <View
            key={index}
            style={{ width: SCREEN_WIDTH }}
            className="items-center justify-center px-8 pt-12"
          >
            {/* Animated Icon Card */}
            <View className="mb-10 items-center justify-center">
              <LinearGradient
                colors={[`${slide.accentColor}25`, `${slide.accentColor}05`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: SCREEN_WIDTH * 0.5,
                  height: SCREEN_WIDTH * 0.5,
                  borderRadius: (SCREEN_WIDTH * 0.5) / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <AnimatedIcon
                  name={slide.icon}
                  size={90}
                  color={slide.accentColor}
                  animation={slide.animation}
                />
              </LinearGradient>
            </View>

            {/* Badge */}
            <View className="mb-6">
              <FeatureBadge text={t(slide.benefitKey)} />
            </View>

            {/* Title */}
            <Text
              className="text-5xl font-black text-center leading-tight px-4 mb-6"
              style={{ color: "#ffffff" }}
            >
              {t(slide.titleKey)}
            </Text>

            {/* Subtitle */}
            <Text className="text-xl text-gray-300 text-center leading-7 px-6">
              {t(slide.subtitleKey)}
            </Text>

            {/* CTA for last slide */}
            {slide.cta && (
              <View className="mt-8">
                <Text className="text-gray-400 text-center text-sm mb-2">
                  {t("onboarding.slides.private.securityNote")}
                </Text>
              </View>
            )}
          </View>
        ))}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View className="flex-row justify-center mb-8">
        {slides.map((slide, index) => {
          const dotStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ];

            const width = interpolate(
              scrollX.value,
              inputRange,
              [10, 30, 10],
              Extrapolation.CLAMP
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.4, 1, 0.4],
              Extrapolation.CLAMP
            );

            return {
              width,
              opacity,
              backgroundColor: slide.accentColor,
            };
          });

          return (
            <Animated.View
              key={index}
              className="h-2.5 rounded-full mx-1"
              style={dotStyle}
            />
          );
        })}
      </View>

      {/* Bottom Buttons */}
      <View
        className="px-6"
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 16 }}
      >
        {isLastSlide ? (
          <LinearGradient
            colors={[currentSlide.accentColor, currentSlide.gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 20,
              shadowColor: currentSlide.accentColor,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Pressable
              onPress={completeOnboarding}
              className="py-5 items-center active:opacity-80"
            >
              <Text className="text-white font-black text-lg">
                {t("onboarding.buttons.start")}
              </Text>
            </Pressable>
          </LinearGradient>
        ) : (
          <View className="flex-row gap-3">
            <BlurView
              intensity={40}
              tint="dark"
              className="flex-1 rounded-2xl overflow-hidden"
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <Pressable
                onPress={completeOnboarding}
                className="py-5 items-center active:opacity-60"
              >
                <Text className="text-white font-semibold text-base">
                  {t("onboarding.buttons.skip")}
                </Text>
              </Pressable>
            </BlurView>

            <LinearGradient
              colors={[currentSlide.accentColor, currentSlide.gradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-1 rounded-2xl overflow-hidden"
              style={{
                shadowColor: currentSlide.accentColor,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Pressable
                onPress={goToNextSlide}
                className="py-5 items-center active:opacity-70"
              >
                <Text className="text-white font-bold text-base">
                  {t("onboarding.buttons.next")}
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {isLastSlide && (
          <Text className="text-gray-400 text-center text-xs mt-4 leading-5">
            {t("onboarding.pricing.trial", { price: "299" })}
            {"\n"}
            {t("onboarding.pricing.features")}
          </Text>
        )}
      </View>
    </View>
  );
}
