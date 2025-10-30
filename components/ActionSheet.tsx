// components/ActionSheetNote.tsx
import Input from "@/components/ui/Input";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (note: { title: string; content: string }) => void;
  title?: string;
  content?: string;
  sheetTitle?: string;
};

export default function ActionSheet({
  visible,
  onClose,
  onSave,
  title: initialTitle = "",
  content: initialContent = "",
  sheetTitle = "New note",
}: Props) {
  // ⬇️ Dodaj na vrh komponentе (unutar function ActionSheetNote)
  // na vrhu
  const isKeyboardVisible = useRef(false);
  const saveQueued = useRef<null | { title: string; content: string }>(null);
  const saving = useRef(false);

  useEffect(() => {
    const sh = Keyboard.addListener(
      "keyboardDidShow",
      () => (isKeyboardVisible.current = true)
    );
    const hi = Keyboard.addListener("keyboardDidHide", () => {
      isKeyboardVisible.current = false;
      if (saveQueued.current && !saving.current) {
        const payload = saveQueued.current;
        saveQueued.current = null;
        actuallySave(payload!.title, payload!.content);
      }
    });
    return () => {
      sh.remove();
      hi.remove();
    };
  }, []);

  const actuallySave = (t: string, c: string) => {
    if (saving.current) return;
    saving.current = true;
    const safeTitle = t.trim().length ? t.trim() : "Untitled";
    const safeContent = c.trim();
    closeWithAnim(() => {
      onSave({ title: safeTitle, content: safeContent });
      onClose();
      saving.current = false;
    });
  };

  const handleSavePress = () => {
    if (saving.current) return;
    saving.current = true;

    // 1) ručno ugasi fokus (brže i pouzdanije od Keyboard.dismiss())
    titleRef.current?.blur();
    contentRef.current?.blur();

    // 2) normalizuj i odmah zatvori + snimi
    const safeTitle = (title || "").trim() || "Untitled";
    const safeContent = (content || "").trim();

    closeWithAnim(() => {
      onSave({ title: safeTitle, content: safeContent });
      onClose();
      saving.current = false;
    });
  };

  const titleRef = useRef<TextInput>(null);
  const contentRef = useRef<TextInput>(null); // 👈 novo

  const { bottom } = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  const slideY = useRef(new Animated.Value(1)).current; // 1=offscreen, 0=onscreen
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const blurTint: "light" | "dark" = isDark ? "dark" : "light";
  const headerIcon = isDark ? "#FFF" : "#111";

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setContent(initialContent);
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => setTimeout(() => titleRef.current?.focus(), 80));
    } else {
      // ako ga spolja ugasiš
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const closeWithAnim = (after?: () => void) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 1,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => after && after());
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={() => closeWithAnim(onClose)}
    >
      {/* OVERLAY (blur + dim) */}
      <Animated.View
        style={{ position: "absolute", inset: 0, opacity: overlayOpacity }}
      >
        <BlurView
          intensity={20}
          tint={blurTint}
          style={{ position: "absolute", inset: 0 }}
        />
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.25)",
          }}
        />
      </Animated.View>

      {/* Klik van sheeta zatvara */}
      <Pressable
        onPress={() => closeWithAnim(onClose)}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* SHEET zona (bottom) + keyboard push */}
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="px-3" style={{ paddingBottom: Math.max(bottom, 12) }}>
          <Animated.View
            className="rounded-3xl overflow-hidden border border-black/10 dark:border-white/10"
            style={{
              transform: [
                {
                  translateY: slideY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 600],
                  }),
                },
              ],
            }}
          >
            {/* 👇 DODATO: ScrollView oko celog sadrzaja kartice */}
            <ScrollView
              keyboardShouldPersistTaps="always"
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "none"
              }
              contentInsetAdjustmentBehavior="never"
            >
              {/* Header */}
              <BlurView intensity={28} tint={blurTint} className="w-full">
                <View className="h-[56px] flex-row items-center justify-between px-3">
                  <Pressable
                    onPress={() => closeWithAnim(onClose)}
                    hitSlop={12}
                    className="p-2 rounded-xl active:opacity-80"
                  >
                    <Ionicons name="close" size={22} color={headerIcon} />
                  </Pressable>

                  <Text className="text-base font-monaBold text-ios-label dark:text-white">
                    {sheetTitle}
                  </Text>

                  {/* ✓ sada je unutar ScrollView, pa prvi tap prolazi i sa otvorenom tastaturom */}
                  <Pressable
                    onPress={handleSavePress}
                    hitSlop={12}
                    className="p-2 rounded-xl active:opacity-80"
                  >
                    <Ionicons name="checkmark" size={24} color={headerIcon} />
                  </Pressable>
                </View>
              </BlurView>

              {/* Body */}
              <View className="bg-white/80 dark:bg-white/10 px-4 pt-3 pb-4">
                <Input
                  ref={titleRef}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => contentRef.current?.focus()} // 👈 prebacuje fokus
                  className="mb-3"
                />

                <Input
                  ref={contentRef} // 👈 poveži
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your note…"
                  multiline
                  textAlignVertical="top"
                  style={{ minHeight: 140 }}
                  returnKeyType="done"
                />
              </View>
            </ScrollView>
            {/* 👆 KRAJ ScrollView-a */}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
