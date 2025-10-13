// app/(tabs)/inbox.tsx
import NoteCard from "@/components/NoteCard";
import ScreenScroll from "@/components/ScreenScroll";
import { useModal } from "@/context/ModalContext";
import { useNotes } from "@/context/NotesContext";
import Header from "@components/Header";
import ScreenBackground from "@components/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function InboxScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { notes, deleteNote } = useNotes();
  const { confirm } = useModal();

  const isEmpty = !notes || notes.length === 0;

  // Pulse animacija za plavi blob
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <ScreenBackground variant="grouped">
      <Header
        title={t("screen.inbox.title")}
        rightIcon="settings-outline"
        onRightPress={() => router.push("/settings")}
      />

      <ScreenScroll
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View className="items-center mt-4">
            {/* Frosted art kartica */}
            <View className="w-40 h-40 rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 relative mb-5">
              <BlurView
                intensity={24}
                tint="light"
                className="absolute inset-0"
              />

              {/* Pulse-ujući plavi blob */}
              <Animated.View
                style={blob1Style}
                className="absolute -top-6 -left-8 w-28 h-28 rounded-full bg-ios-blue/20 dark:bg-iosd-blue/15"
              />
              {/* Sivi blob za dubinu */}
              <View className="absolute -bottom-8 -right-6 w-24 h-24 rounded-full bg-black/5 dark:bg-white/5" />

              {/* Ikonica */}
              <View className="flex-1 items-center justify-center">
                <Ionicons
                  name="document-text-outline"
                  size={44}
                  color={"#7b7b7c"}
                />
              </View>
            </View>

            {/* Naslov / podnaslov */}
            <Text className="text-[22px] mb-6 font-semibold text-ios-label dark:text-iosd-label">
              {t("inbox.empty.title")}
            </Text>
            <Text className="text-[17px] mt-1 text-ios-label dark:text-iosd-label text-center px-3">
              {t("inbox.empty.subtitle")}
            </Text>

            <Text className="text-[15px] mt-4 text-ios-label dark:text-iosd-label text-center">
              {t("inbox.empty.hint")}
            </Text>
          </View>
        ) : (
          // prikaz beleški ako postoje
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPress={() => router.push(`/note-edit/${note.id}`)} // ili šta već koristiš
              onEdit={() => router.push(`/note-edit/${note.id}`)}
              onDelete={() =>
                confirm(
                  "Obrisati ovu belešku?",
                  () => deleteNote(note.id),
                  "Brisanje"
                )
              }
            />
          ))
        )}
      </ScreenScroll>
    </ScreenBackground>
  );
}
