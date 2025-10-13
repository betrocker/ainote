import ScreenScroll from "@/components/ScreenScroll";
import Button from "@/components/ui/Button";
import { useNotes } from "@/context/NotesContext";
import { useAuth } from "@clerk/clerk-expo";
import Header from "@components/Header";
import ScreenBackground from "@components/ScreenBackground";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AssistantScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const { addNote, notes } = useNotes();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSave = async ({
    title,
    content,
  }: {
    title: string;
    content: string;
  }) => {
    await addNote({ type: "text", title, content });
  };

  return (
    <ScreenBackground variant="grouped">
      {/* Header fiksiran na vrhu */}
      <Header
        title={t("screen.assistant.title")}
        rightIcon="settings-outline"
        onRightPress={() => router.push("/settings")}
      />

      {/* Skrolujući sadržaj */}
      <ScreenScroll
        contentContainerStyle={{
          // 👈 gura sadržaj ispod hedera
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Button
          title="New Note"
          variant="secondary"
          onPress={() => router.push("/note-compose")}
        />
      </ScreenScroll>
    </ScreenBackground>
  );
}
