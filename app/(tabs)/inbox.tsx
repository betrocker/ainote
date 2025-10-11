import ScreenScroll from "@/components/ScreenScroll";
import { useNotes } from "@/context/NotesContext";
import EmptyInbox from "@components/EmptyInbox";
import Header from "@components/Header";
import ScreenBackground from "@components/ScreenBackground";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function InboxScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notes, deleteNote, addNote } = useNotes();

  // ista visina kao u Header.tsx
  const isEmpty = !notes || notes.length === 0;

  return (
    <ScreenBackground variant="plain">
      {/* Header fiksiran na vrhu */}
      <Header
        title={t("screen.inbox.title")}
        rightIcon="settings-outline"
        onRightPress={() => router.push("/settings")}
      />

      {/* Skrolujući sadržaj */}
      <ScreenScroll
        contentContainerStyle={{
           // gura sadržaj ispod hedera
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!notes || notes.length === 0 ? (
          <EmptyInbox
            onAdd={() =>
              addNote({
                type: "text", // ⇦ DODATO: ispunjava Omit<Note, "id" | "createdAt">
                title: "Untitled",
                content: "",
              })
            }
          />
        ) : (
          notes.map((note) => (
            <View
              key={note.id}
              className="mb-4 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10"
            >
              <View className="p-4">
                <Text className="text-ios-label dark:text-iosd-label font-semibold mb-1">
                  {note.title || "Untitled"}
                </Text>
                {!!note.content && (
                  <Text className="text-ios-secondary dark:text-iosd-secondary">
                    {note.content}
                  </Text>
                )}
              </View>

              <View className="px-4 pb-3">
                <TouchableOpacity
                  onPress={() => deleteNote(note.id)}
                  activeOpacity={0.8}
                  className="self-start px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <Text className="text-red-500 font-medium">{t("inbox.delete")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScreenScroll>
    </ScreenBackground>
  );
}