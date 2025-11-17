import CustomPaywall from "@/components/CustomPaywall"; // ⭐ ДОДАЈ
import LargeHeader, { HeaderButton } from "@/components/LargeHeader";
import NoteCard from "@/components/NoteCard";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenScroll from "@/components/ScreenScroll";
import { useNotes } from "@/context/NotesContext";
import { usePremium } from "@/context/PremiumContext";
import { usePrivate } from "@/context/PrivateContext";
import { haptics } from "@/utils/haptics"; // ⭐ ДОДАЈ
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivateFolderScreen() {
  const {
    isPremium,
    loading: premiumLoading,
    checkPremiumStatus,
  } = usePremium(); // ⭐ ДОДАЈ checkPremiumStatus
  const [showPaywall, setShowPaywall] = useState(false); // ⭐ ДОДАЈ state за modal
  const {
    isUnlocked,
    authenticateUser,
    lockFolder,
    isAuthAvailable,
    setIsInPrivateFolder,
  } = usePrivate();
  const { notes } = useNotes();
  const insets = useSafeAreaInsets();
  const [showContent, setShowContent] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation("common");

  const privateNotes = notes.filter((note) => note.isPrivate);

  useEffect(() => {
    if (isUnlocked) {
      setShowContent(true);
      setIsInPrivateFolder(true);
    } else {
      setShowContent(false);
      setIsInPrivateFolder(false);
    }
  }, [isUnlocked]);

  const handleUnlock = async () => {
    const success = await authenticateUser();
    if (success) {
      setShowContent(true);
    }
  };

  if (premiumLoading) {
    return (
      <ScreenBackground variant="grouped">
        <LargeHeader title={t("privateFolder.title")} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      </ScreenBackground>
    );
  }

  // ⭐ PREMIUM PAYWALL
  if (!isPremium) {
    return (
      <>
        <ScreenBackground variant="grouped">
          <LargeHeader
            title={t("privateFolder.title")}
            rightButtons={
              <HeaderButton
                icon="settings-outline"
                onPress={() => router.push("/settings")}
              />
            }
          />
          <View className="flex-1 items-center justify-center px-8">
            {/* Premium Icon */}
            <View className="relative mb-8">
              <LinearGradient
                colors={["#FFD700", "#FFA500", "#FF8C00"]}
                className="w-32 h-32 rounded-full items-center justify-center"
                style={{
                  shadowColor: "#FFD700",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                }}
              >
                <Ionicons name="star" size={64} color="#fff" />
              </LinearGradient>

              <View
                className="absolute -bottom-2 -right-2 bg-ios-blue rounded-full px-3 py-1"
                style={{
                  shadowColor: "#0A84FF",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                }}
              >
                <Text className="text-white font-monaBold text-xs">
                  PREMIUM
                </Text>
              </View>
            </View>

            <Text className="text-2xl text-center font-monaBold text-ios-label dark:text-iosd-label mb-2">
              {t("privateFolder.premiumRequired")}
            </Text>

            <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center mb-8">
              {t("privateFolder.premiumMessage")}
            </Text>

            {/* Features */}
            <View className="w-full max-w-sm mb-8 gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-ios-blue/10 dark:bg-ios-blue/20 rounded-full items-center justify-center">
                  <Ionicons name="lock-closed" size={20} color="#0A84FF" />
                </View>
                <Text className="flex-1 text-ios-label dark:text-iosd-label">
                  {t("privateFolder.feature1")}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-ios-blue/10 dark:bg-ios-blue/20 rounded-full items-center justify-center">
                  <Ionicons name="shield-checkmark" size={20} color="#0A84FF" />
                </View>
                <Text className="flex-1 text-ios-label dark:text-iosd-label">
                  {t("privateFolder.feature2")}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-ios-blue/10 dark:bg-ios-blue/20 rounded-full items-center justify-center">
                  <Ionicons name="eye-off" size={20} color="#0A84FF" />
                </View>
                <Text className="flex-1 text-ios-label dark:text-iosd-label">
                  {t("privateFolder.feature3")}
                </Text>
              </View>
            </View>

            {/* ⭐ CTA Button - Отвара CustomPaywall modal */}
            <Pressable
              onPress={() => setShowPaywall(true)} // ⭐ ИСПРАВЉЕНО
              className="bg-ios-blue px-8 py-4 rounded-full active:opacity-80 w-full max-w-sm"
              style={{
                shadowColor: "#0A84FF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="star" size={24} color="#fff" />
                <Text className="text-white font-monaBold text-base">
                  {t("privateFolder.upgradeToPremium")}
                </Text>
              </View>
            </Pressable>

            {/* Note count teaser */}
            {privateNotes.length > 0 && (
              <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center mt-8">
                {t("privateFolder.notesCount", { count: privateNotes.length })}
              </Text>
            )}
          </View>
        </ScreenBackground>

        {/* ⭐ CustomPaywall Modal - Исти pattern као у settings.tsx */}
        <CustomPaywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSuccess={async () => {
            await checkPremiumStatus();
            haptics.success();
            setShowPaywall(false);
          }}
        />
      </>
    );
  }

  // Биометрија није подешена
  if (!isAuthAvailable) {
    return (
      <ScreenBackground variant="grouped">
        <LargeHeader title={t("privateFolder.title")} />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="lock-closed" size={64} color="#999" />
          <Text className="text-lg text-ios-label dark:text-iosd-label text-center mt-4 mb-2">
            {t("privateFolder.biometricNotAvailable")}
          </Text>
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center">
            {t("privateFolder.biometricError")}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  // Locked state
  if (!isUnlocked || !showContent) {
    return (
      <ScreenBackground variant="grouped">
        <LargeHeader
          title={t("privateFolder.title")}
          rightButtons={
            isUnlocked && (
              <Pressable onPress={lockFolder}>
                <Ionicons name="lock-open" size={24} color="#0A84FF" />
              </Pressable>
            )
          }
        />

        <View className="flex-1 items-center justify-center px-8">
          <View className="relative w-52 h-52 items-center justify-center mb-8">
            <BlurView
              intensity={30}
              tint="light"
              className="w-44 h-44 rounded-[40px] items-center justify-center overflow-hidden"
              style={{
                backgroundColor: "rgba(72, 187, 120, 0.2)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.35,
                shadowRadius: 30,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
              }}
            >
              <LinearGradient
                colors={[
                  "rgba(72, 187, 120, 0.3)",
                  "rgba(56, 161, 105, 0.2)",
                  "rgba(47, 133, 90, 0.15)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute inset-0"
              />

              <View
                className="absolute -top-10 -left-10 w-32 h-32 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              />

              <View className="items-center justify-center">
                <View
                  className="w-10 h-7 border-4 rounded-t-3xl"
                  style={{
                    borderColor: "#48BB78",
                    borderBottomWidth: 0,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                  }}
                />

                <View
                  className="w-20 h-16 rounded-2xl"
                  style={{
                    backgroundColor: "#48BB78",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                  }}
                >
                  <View className="flex-1 items-center justify-center gap-1">
                    <View
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: "#2F855A" }}
                    />
                    <View
                      className="w-2 h-5"
                      style={{ backgroundColor: "#2F855A", borderRadius: 1 }}
                    />
                  </View>
                </View>
              </View>
            </BlurView>

            <View
              className="absolute -top-3 -right-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
              }}
            >
              <LinearGradient
                colors={["#F6AD55", "#ED8936", "#DD6B20"]}
                className="w-14 h-14 rounded-full items-center justify-center"
              >
                <View
                  className="absolute top-1 left-1 w-6 h-6 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
              </LinearGradient>
            </View>

            <View
              className="absolute -bottom-2 -left-3"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
              }}
            >
              <LinearGradient
                colors={["#4299E1", "#3182CE", "#2B6CB0"]}
                className="w-14 h-14 rounded-full items-center justify-center"
              >
                <View
                  className="absolute top-1 left-1 w-6 h-6 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
                <Ionicons name="finger-print" size={24} color="#fff" />
              </LinearGradient>
            </View>

            <View
              className="absolute top-12 -left-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              }}
            >
              <LinearGradient
                colors={["#FBBF24", "#F59E0B", "#D97706"]}
                className="w-12 h-12 rounded-full items-center justify-center"
              >
                <View
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
                <Ionicons name="key" size={20} color="#fff" />
              </LinearGradient>
            </View>
          </View>

          <Text className="text-2xl text-center font-monaBold text-ios-label dark:text-iosd-label mb-2">
            <Text>{t("privateFolder.title")}</Text>
          </Text>
          <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center mb-8">
            <Text>{t("privateFolder.description")}</Text>
          </Text>

          <Pressable
            onPress={handleUnlock}
            className="bg-ios-blue px-8 py-4 rounded-full active:opacity-80"
            style={{
              shadowColor: "#0A84FF",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="finger-print" size={24} color="#fff" />
              <Text className="text-white font-monaBold text-base">
                {t("privateFolder.unlock")}
              </Text>
            </View>
          </Pressable>

          <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center mt-8">
            {t("privateFolder.notesCount", { count: privateNotes.length })}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  // Unlocked state
  return (
    <ScreenBackground>
      <LargeHeader
        title="Private"
        rightButtons={
          <Pressable onPress={lockFolder} className="active:opacity-70">
            <Ionicons name="lock-open" size={24} color="#0A84FF" />
          </Pressable>
        }
      />

      {privateNotes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="shield-checkmark-outline" size={64} color="#999" />
          <Text className="text-lg text-ios-label dark:text-iosd-label text-center mt-4 mb-2">
            No Private Notes
          </Text>
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center">
            Mark notes as private from the note menu
          </Text>
        </View>
      ) : (
        <ScreenScroll
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 20, 40),
          }}
          showsVerticalScrollIndicator={false}
        >
          {privateNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </ScreenScroll>
      )}
    </ScreenBackground>
  );
}
