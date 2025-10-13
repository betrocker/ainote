// app/note-compose.tsx
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "@/components/Header";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenScroll from "@/components/ScreenScroll";
import { useNotes } from "@/context/NotesContext";

export default function NoteCompose() {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotes();
  const { t } = useTranslation("common");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const titleRef = useRef<TextInput>(null);
  const bodyRef = useRef<TextInput>(null);

  const handleClose = () => {
    titleRef.current?.blur();
    bodyRef.current?.blur();
    router.back();
  };

  const handleSave = async () => {
    const tTitle = (title || "").trim() || t("note.untitled");
    const tBody = (body || "").trim();
    titleRef.current?.blur();
    bodyRef.current?.blur();
    await addNote({ type: "text", title: tTitle, content: tBody });
    router.back();
  };

  return (
    <ScreenBackground variant="grouped">
      <Header
        title={t("screen.noteCompose.title")}
        leftIcon="arrow-back"
        onLeftPress={handleClose}
        rightIcon="checkmark"
        onRightPress={handleSave}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenScroll
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom + 24, 120),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2">
            {/* Title (prva linija) */}
            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              placeholder={t("note.placeholder.title")}
              placeholderTextColor="rgba(60,60,67,0.6)"
              returnKeyType="next"
              onSubmitEditing={() => bodyRef.current?.focus()}
              autoFocus
              numberOfLines={1}
              className="text-2xl font-semibold text-ios-label dark:text-iosd-label"
              style={{ paddingVertical: 8 }}
            />

            {/* Body (ostatak ekrana) */}
            <TextInput
              ref={bodyRef}
              value={body}
              onChangeText={setBody}
              placeholder={t("note.placeholder.body")}
              placeholderTextColor="rgba(60,60,67,0.45)"
              multiline
              textAlignVertical="top"
              returnKeyType="default"
              className="text-base text-ios-label dark:text-iosd-label"
              style={{ minHeight: 300, paddingTop: 6, paddingBottom: 8 }}
            />
          </View>
        </ScreenScroll>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}
