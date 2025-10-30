import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 3D Voice Recording Illustration
function VoiceIllustration() {
  return (
    <View className="w-full h-[380px] relative justify-center items-center">
      {/* Base shadow - softer and larger */}
      <View
        className="absolute bottom-8 w-[220px] h-3 rounded-full bg-black/20"
        style={{ transform: [{ scaleX: 1.2 }] }}
      />

      {/* Stacked platforms with more depth */}
      <View className="absolute bottom-[20px]">
        <LinearGradient
          colors={["#FFD700", "#FFC700", "#FFB600"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[200px] h-[50px] rounded-full"
          style={{
            shadowColor: "#FFD700",
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 0.35,
            shadowRadius: 25,
            elevation: 15,
          }}
        >
          <View className="absolute top-1 left-8 right-8 h-3 rounded-full bg-white/20" />
        </LinearGradient>
      </View>

      <View className="absolute bottom-[65px]">
        <LinearGradient
          colors={["#2D3748", "#1A202C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[170px] h-[45px] rounded-full"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          <View className="absolute top-1 left-6 right-6 h-2.5 rounded-full bg-white/10" />
        </LinearGradient>
      </View>

      <View className="absolute bottom-[105px]">
        <LinearGradient
          colors={["#4299E1", "#3182CE", "#2C5282"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[140px] h-[40px] rounded-full"
          style={{
            shadowColor: "#4299E1",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          <View className="absolute top-1 left-4 right-4 h-2 rounded-full bg-white/15" />
        </LinearGradient>
      </View>

      {/* Main microphone card with better 3D */}
      <View
        className="absolute top-[15px]"
        style={{ transform: [{ rotate: "-10deg" }] }}
      >
        <LinearGradient
          colors={["#FF6B6B", "#FF5252", "#FF4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[130px] h-[180px] rounded-3xl items-center justify-center"
          style={{
            shadowColor: "#FF6B6B",
            shadowOffset: { width: -5, height: 25 },
            shadowOpacity: 0.55,
            shadowRadius: 35,
            elevation: 20,
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
            className="absolute top-0 left-0 right-0 h-[90px] rounded-t-3xl"
          />

          <View className="w-20 h-20 rounded-full bg-white/25 items-center justify-center mb-4">
            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="mic" size={44} color="#fff" />
            </View>
          </View>

          <View className="items-center gap-2.5">
            <View className="w-16 h-2 rounded-full bg-white/40" />
            <View className="w-20 h-2 rounded-full bg-white/35" />
            <View className="w-14 h-2 rounded-full bg-white/30" />
          </View>
        </LinearGradient>
      </View>

      {/* Floating decorative cubes */}
      <View
        className="absolute left-[20px] top-[35px]"
        style={{ transform: [{ rotate: "-8deg" }] }}
      >
        <LinearGradient
          colors={["#E6FFFA", "#B2F5EA", "#81E6D9"]}
          className="w-[50px] h-[50px] rounded-xl"
          style={{
            shadowColor: "#81E6D9",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          <View className="absolute top-1 left-1 right-8 h-3 rounded-lg bg-white/30" />
        </LinearGradient>
      </View>

      <View
        className="absolute right-[25px] top-[55px]"
        style={{ transform: [{ rotate: "12deg" }] }}
      >
        <LinearGradient
          colors={["#FED7D7", "#FEB2B2", "#FC8181"]}
          className="w-[40px] h-[40px] rounded-lg"
          style={{
            shadowColor: "#FC8181",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View className="absolute top-0.5 left-0.5 right-6 h-2.5 rounded-md bg-white/30" />
        </LinearGradient>
      </View>
    </View>
  );
}

// 3D AI Search Illustration
function AISearchIllustration() {
  return (
    <View className="w-full h-[380px] relative justify-center items-center">
      <View
        className="absolute bottom-12 w-[180px] h-3 rounded-full bg-black/20"
        style={{ transform: [{ scaleX: 1.3 }] }}
      />

      <View className="absolute left-8 bottom-[50px]">
        <LinearGradient
          colors={["#BEE3F8", "#90CDF4", "#63B3ED"]}
          className="w-[100px] h-[38px] rounded-full"
          style={{
            shadowColor: "#63B3ED",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View className="absolute top-1 left-3 right-3 h-2 rounded-full bg-white/20" />
        </LinearGradient>
      </View>

      <View className="absolute right-8 bottom-[60px]">
        <LinearGradient
          colors={["#C4F1F9", "#9DECF9", "#76E4F7"]}
          className="w-[95px] h-[36px] rounded-full"
          style={{
            shadowColor: "#76E4F7",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View className="absolute top-1 left-3 right-3 h-2 rounded-full bg-white/20" />
        </LinearGradient>
      </View>

      <View className="absolute bottom-[65px]">
        <LinearGradient
          colors={["#4299E1", "#3182CE", "#2B6CB0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[160px] h-[220px] rounded-3xl overflow-hidden"
          style={{
            shadowColor: "#2B6CB0",
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.35,
            shadowRadius: 25,
            elevation: 15,
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.6 }}
            className="absolute top-0 left-0 right-0 h-[120px]"
          />
          <View className="absolute top-6 left-4 right-4 h-[70px] bg-white/10 rounded-2xl" />
        </LinearGradient>

        <LinearGradient
          colors={["#63B3ED", "#4299E1"]}
          className="absolute -top-[18px] w-[160px] h-[40px] rounded-full"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <View className="absolute top-1 left-6 right-6 h-2.5 rounded-full bg-white/20" />
        </LinearGradient>
      </View>

      <View
        className="absolute top-0"
        style={{ transform: [{ rotate: "6deg" }] }}
      >
        <LinearGradient
          colors={["#FF6B6B", "#FF5252", "#FF4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[135px] h-[185px] rounded-3xl items-center justify-center"
          style={{
            shadowColor: "#FF6B6B",
            shadowOffset: { width: 5, height: 28 },
            shadowOpacity: 0.6,
            shadowRadius: 40,
            elevation: 25,
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.3)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
            className="absolute top-0 left-0 right-0 h-[95px] rounded-t-3xl"
          />

          <View className="w-24 h-24 rounded-full bg-white/25 items-center justify-center mb-4">
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
              <Ionicons name="sparkles" size={52} color="#fff" />
            </View>
          </View>

          <View className="items-center gap-2.5">
            <View className="w-16 h-2 rounded-full bg-white/40" />
            <View className="w-20 h-2 rounded-full bg-white/35" />
            <View className="w-14 h-2 rounded-full bg-white/30" />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

// 3D OCR Illustration
function OCRIllustration() {
  return (
    <View className="w-full h-[380px] relative justify-center items-center">
      <View
        className="absolute bottom-6 w-[240px] h-3 rounded-full bg-black/20"
        style={{ transform: [{ scaleX: 1.2 }] }}
      />

      <View className="absolute bottom-[15px]">
        <LinearGradient
          colors={["#E6FFFA", "#B2F5EA", "#81E6D9"]}
          className="w-[240px] h-[60px] rounded-full"
          style={{
            shadowColor: "#81E6D9",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View className="absolute top-2 left-10 right-10 h-3 rounded-full bg-white/25" />
        </LinearGradient>
      </View>

      <View className="absolute bottom-[65px] right-[25px]">
        <LinearGradient
          colors={["#FEEBC8", "#FBD38D", "#F6AD55"]}
          className="w-[150px] h-[45px] rounded-2xl"
          style={{
            shadowColor: "#F6AD55",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          <View className="absolute top-1 left-4 right-4 h-2.5 rounded-xl bg-white/20" />
        </LinearGradient>
      </View>

      <View
        className="absolute top-[20px] right-[15px]"
        style={{ transform: [{ rotate: "10deg" }, { perspective: 1000 }] }}
      >
        <LinearGradient
          colors={["#FF6B6B", "#FF5252", "#FF4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[165px] h-[210px] rounded-3xl p-5"
          style={{
            shadowColor: "#FF6B6B",
            shadowOffset: { width: 8, height: 25 },
            shadowOpacity: 0.6,
            shadowRadius: 35,
            elevation: 20,
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.25)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.6 }}
            className="absolute top-0 left-0 right-0 h-[120px] rounded-t-3xl"
          />

          <LinearGradient
            colors={["#FFF", "#F7FAFC", "#EDF2F7"]}
            className="w-[50px] h-[40px] rounded-lg mb-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <View className="absolute top-1 left-1 right-1 h-2 rounded bg-white/40" />
          </LinearGradient>

          <View className="gap-2.5 mb-6">
            <View className="w-18 h-2 rounded-full bg-white/35" />
            <View className="w-24 h-2 rounded-full bg-white/35" />
          </View>

          <View className="flex-1 justify-end flex-row items-end gap-2">
            <View className="w-4 h-[35px] rounded-t-lg bg-white/30" />
            <View className="w-4 h-[60px] rounded-t-lg bg-white/40" />
            <View className="w-4 h-[45px] rounded-t-lg bg-white/30" />
            <View className="w-4 h-[75px] rounded-t-lg bg-white/50" />
          </View>
        </LinearGradient>
      </View>

      <View
        className="absolute left-[35px] top-[115px]"
        style={{
          shadowColor: "#FFD700",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.45,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <LinearGradient
          colors={["#FFD700", "#FFC700", "#FFB600"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[90px] h-[90px] rounded-full items-center justify-center"
        >
          <View className="w-[80px] h-[80px] rounded-full border-[3px] border-white/25 items-center justify-center">
            <View className="w-[70px] h-[70px] rounded-full border-[2px] border-white/15 items-center justify-center">
              <Text className="text-white text-3xl font-monaBold">$</Text>
            </View>
          </View>
          <View className="absolute top-2 left-4 w-8 h-8 rounded-full bg-white/20" />
        </LinearGradient>
      </View>

      <View
        className="absolute right-[10px] bottom-[80px]"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 18,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]}
          className="w-[120px] h-[145px] rounded-3xl border-2 border-white/30 p-4"
        >
          <View className="flex-1 justify-between">
            <View className="h-0.5 bg-white/20 rounded" />
            <View className="h-0.5 bg-white/20 rounded" />
            <View className="h-0.5 bg-white/20 rounded" />
            <View className="h-0.5 bg-white/20 rounded" />
          </View>
          <View className="absolute bottom-4 left-4 right-4 h-[70px] bg-blue-400/20 rounded-t-2xl" />
        </LinearGradient>
      </View>
    </View>
  );
}

// 3D Private Folder Illustration
function PrivateFolderIllustration() {
  return (
    <View className="w-full h-[380px] relative justify-center items-center">
      {/* Base shadow */}
      <View
        className="absolute bottom-6 w-[200px] h-3 rounded-full bg-black/20"
        style={{ transform: [{ scaleX: 1.2 }] }}
      />

      {/* Main platform */}
      <View className="absolute bottom-[15px]">
        <LinearGradient
          colors={["#C4F1F9", "#9DECF9", "#76E4F7"]}
          className="w-[200px] h-[55px] rounded-full"
          style={{
            shadowColor: "#76E4F7",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View className="absolute top-2 left-8 right-8 h-3 rounded-full bg-white/25" />
        </LinearGradient>
      </View>

      {/* Locked folder - main element */}
      <View
        className="absolute top-[50px]"
        style={{ transform: [{ rotate: "-5deg" }] }}
      >
        <LinearGradient
          colors={["#48BB78", "#38A169", "#2F855A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="w-[160px] h-[200px] rounded-3xl p-5"
          style={{
            shadowColor: "#38A169",
            shadowOffset: { width: -8, height: 25 },
            shadowOpacity: 0.6,
            shadowRadius: 35,
            elevation: 20,
          }}
        >
          {/* Shine effect */}
          <LinearGradient
            colors={["rgba(255,255,255,0.25)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.6 }}
            className="absolute top-0 left-0 right-0 h-[110px] rounded-t-3xl"
          />

          {/* Lock icon container */}
          <View className="flex-1 items-center justify-center">
            <View className="w-24 h-24 rounded-full bg-white/25 items-center justify-center mb-3">
              <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="lock-closed" size={48} color="#fff" />
              </View>
            </View>

            {/* Face ID indicator */}
            <View className="mt-4 items-center gap-2">
              <View className="w-16 h-2 rounded-full bg-white/35" />
              <View className="w-12 h-2 rounded-full bg-white/30" />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Shield decoration */}
      <View
        className="absolute right-[25px] top-[40px]"
        style={{ transform: [{ rotate: "15deg" }] }}
      >
        <LinearGradient
          colors={["#FED7D7", "#FEB2B2", "#FC8181"]}
          className="w-[55px] h-[55px] rounded-2xl items-center justify-center"
          style={{
            shadowColor: "#FC8181",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          <View className="absolute top-1 left-1 right-8 h-3 rounded-lg bg-white/30" />
          <Ionicons name="shield-checkmark" size={28} color="#fff" />
        </LinearGradient>
      </View>

      {/* Key decoration */}
      <View
        className="absolute left-[30px] bottom-[90px]"
        style={{ transform: [{ rotate: "-12deg" }] }}
      >
        <LinearGradient
          colors={["#FEEBC8", "#FBD38D", "#F6AD55"]}
          className="w-[45px] h-[45px] rounded-xl items-center justify-center"
          style={{
            shadowColor: "#F6AD55",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View className="absolute top-0.5 left-0.5 right-6 h-2.5 rounded-md bg-white/30" />
          <Ionicons name="key" size={24} color="#fff" />
        </LinearGradient>
      </View>

      {/* Fingerprint decoration */}
      <View
        className="absolute left-[25px] top-[100px]"
        style={{
          shadowColor: "#4299E1",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={["#BEE3F8", "#90CDF4", "#63B3ED"]}
          className="w-[60px] h-[60px] rounded-full items-center justify-center"
        >
          <View className="w-[50px] h-[50px] rounded-full border-2 border-white/20 items-center justify-center">
            <Ionicons name="finger-print" size={32} color="#fff" />
          </View>
        </LinearGradient>
      </View>
    </View>
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
      titleKey: "onboarding.slides.voice.title",
      subtitleKey: "onboarding.slides.voice.subtitle",
      badgeKey: "onboarding.slides.voice.badge", // 🆕
      illustration: <VoiceIllustration />,
    },
    {
      titleKey: "onboarding.slides.search.title",
      subtitleKey: "onboarding.slides.search.subtitle",
      badgeKey: "onboarding.slides.search.badge", // 🆕
      illustration: <AISearchIllustration />,
    },
    {
      titleKey: "onboarding.slides.scan.title",
      subtitleKey: "onboarding.slides.scan.subtitle",
      badgeKey: "onboarding.slides.scan.badge", // 🆕
      illustration: <OCRIllustration />,
    },
    {
      titleKey: "onboarding.slides.private.title",
      subtitleKey: "onboarding.slides.private.subtitle",
      badgeKey: "onboarding.slides.private.badge", // 🆕
      illustration: <PrivateFolderIllustration />,
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
    }
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <LinearGradient
      colors={["#4169E1", "#5B7FDB", "#7195E0"]}
      className="flex-1"
    >
      {/* Top Bar */}
      <View
        className="flex-row justify-between items-center px-6 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        {/* Progress dots */}
        <View className="flex-row gap-2">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-8 bg-white" : "w-1 bg-white/40"
              }`}
            />
          ))}
        </View>

        {/* Skip button */}
        <Pressable onPress={completeOnboarding} className="active:opacity-70">
          <Text className="text-white/90 text-[15px] font-medium">
            {isLastSlide
              ? t("onboarding.buttons.later")
              : t("onboarding.buttons.skip")}
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
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
            className="items-center pt-6"
            style={{ width: SCREEN_WIDTH }}
          >
            {/* Text Content */}
            <View className="items-center px-10 mb-8">
              <Text className="text-[32px] font-monaBold text-white text-center leading-tight mb-3">
                {t(slide.titleKey)}
              </Text>

              {/* Badge - novi element */}
              <View
                className="px-4 py-2 rounded-full border border-white/20 mb-3"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <Text className="text-[13px] text-white/90 font-medium">
                  {t(slide.badgeKey)}
                </Text>
              </View>

              <Text className="text-[15px] text-white/80 text-center leading-6">
                {t(slide.subtitleKey)}
              </Text>
            </View>

            {/* Illustration */}
            <View className="flex-1 justify-center items-center px-4">
              {slide.illustration}
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Bottom Section */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 24 }}>
        {/* Main Button */}
        <Pressable
          className="bg-white w-full py-5 rounded-3xl items-center mb-3 active:opacity-90"
          onPress={isLastSlide ? completeOnboarding : goToNextSlide}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <Text className="text-[#4169E1] text-[16px] font-semibold tracking-wide">
            {isLastSlide
              ? t("onboarding.buttons.start")
              : t("onboarding.buttons.next")}
          </Text>
        </Pressable>

        {/* Login text */}
        {isLastSlide && (
          <Pressable
            onPress={completeOnboarding}
            className="py-2 active:opacity-70"
          >
            <Text className="text-white/90 text-center text-[15px] font-medium">
              Login
            </Text>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}
