// app/assistant.tsx
import LargeHeader, { HeaderButton } from "@/components/LargeHeader";
import { useNotes } from "@/context/NotesContext";
import { ask } from "@/utils/ai";
import ScreenBackground from "@components/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = {
  id: string;
  type: "user" | "assistant";
  text: string;
  noteId?: string | null;
  timestamp: number;
};

const SUGGESTED_QUERIES = [
  { icon: "calendar-outline", text: "Kada idem u Niš?" },
  { icon: "car-outline", text: "Kada zamena ulja?" },
  { icon: "calculator-outline", text: "50000 km" },
  { icon: "time-outline", text: "Šta je sutra?" },
  { icon: "trending-up-outline", text: "Završi projekat" },
];

const TAB_BAR_HEIGHT = 70;

export default function AssistantScreen() {
  const router = useRouter();
  const { notes } = useNotes();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0); // ⭐ Keyboard state

  // ⭐ Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const onAsk = useCallback(
    async (customQuery?: string) => {
      const q = (customQuery || query).trim();
      if (!q) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        text: q,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setQuery("");
      setLoading(true);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);

      try {
        const result = ask(q, notes);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          text: result.answer,
          noteId: result.topNoteId,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.log("🤖 [Assistant] Error:", error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          text: "Došlo je do greške. Pokušaj ponovo.",
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [query, notes]
  );

  const handleClear = () => {
    setMessages([]);
    setQuery("");
  };

  const handleSuggestionPress = (text: string) => {
    onAsk(text);
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title="Assistant"
        rightButtons={
          <HeaderButton icon="trash-outline" onPress={handleClear} />
        }
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 80,
          // ⭐ Dinamički padding - dodaje keyboard height
          paddingBottom:
            100 +
            (keyboardHeight > 0
              ? keyboardHeight
              : TAB_BAR_HEIGHT + insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {/* Welcome/Empty State */}
        {messages.length === 0 && (
          <>
            {/* Hero */}
            <View className="items-center py-8 mb-6">
              <View className="w-20 h-20 rounded-full bg-ios-blue/15 dark:bg-ios-blue/20 items-center justify-center mb-4">
                <Ionicons name="sparkles" size={40} color="#0A84FF" />
              </View>
              <Text className="text-2xl font-monaBold text-ios-label dark:text-iosd-label mb-2 text-center">
                AI Asistent
              </Text>
              <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center px-8">
                Pitaj me bilo šta o tvojim belešama
              </Text>
            </View>

            {/* Suggested Queries */}
            <View className="mb-6">
              <Text className="text-sm font-monaBold text-ios-secondary dark:text-iosd-label2 mb-3 px-1">
                Predlozi:
              </Text>
              {SUGGESTED_QUERIES.map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSuggestionPress(suggestion.text)}
                  className="mb-2 px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 active:opacity-70 flex-row items-center"
                  activeOpacity={1}
                >
                  <View className="w-8 h-8 rounded-full bg-ios-blue/15 items-center justify-center mr-3">
                    <Ionicons
                      name={suggestion.icon as any}
                      size={16}
                      color="#0A84FF"
                    />
                  </View>
                  <Text className="flex-1 text-ios-label dark:text-iosd-label">
                    {suggestion.text}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats */}
            <View className="p-4 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10">
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#8E8E93"
                />
                <Text className="ml-2 text-sm font-monaBold text-ios-secondary dark:text-iosd-label2">
                  Dostupno
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <View className="flex-row items-center px-2 py-1 rounded-full bg-ios-blue/10">
                  <Text className="text-xs text-ios-blue">
                    {notes.length} beleški
                  </Text>
                </View>
                <View className="flex-row items-center px-2 py-1 rounded-full bg-purple-500/10">
                  <Text className="text-xs text-purple-600 dark:text-purple-400">
                    {
                      notes.filter((n) => n.ai?.facts && n.ai.facts.length > 0)
                        .length
                    }{" "}
                    sa facts
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Conversation History */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`mb-3 ${
              msg.type === "user" ? "items-end" : "items-start"
            }`}
          >
            <View
              className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                msg.type === "user"
                  ? "bg-ios-blue rounded-br-md"
                  : "bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-bl-md"
              }`}
            >
              <Text
                className={`text-base leading-6 ${
                  msg.type === "user"
                    ? "text-white"
                    : "text-ios-label dark:text-iosd-label"
                }`}
              >
                {msg.text}
              </Text>

              {msg.noteId && (
                <TouchableOpacity
                  onPress={() => handleNotePress(msg.noteId!)}
                  className="mt-2 pt-2 border-t border-white/20 dark:border-white/10 flex-row items-center"
                >
                  <Ionicons
                    name="document-text-outline"
                    size={14}
                    color={isDark ? "#8E8E93" : "#6B7280"}
                  />
                  <Text className="ml-1 text-xs text-ios-secondary dark:text-iosd-label2">
                    Prikaži belešku
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-xs text-ios-tertiary dark:text-iosd-tertiary mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString("sr-RS", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}

        {loading && (
          <View className="items-start mb-3">
            <View className="px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-bl-md flex-row items-center">
              <ActivityIndicator size="small" color="#0A84FF" />
              <Text className="ml-2 text-ios-secondary dark:text-iosd-label2">
                Razmišljam...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ⭐ Fixed Input Bar - pomera se sa tastaturom */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-ios-sep dark:border-iosd-sep bg-white dark:bg-iosd-bg"
        style={{
          // ⭐ Dinamički bottom - keyboard height ili tab bar
          bottom: keyboardHeight > 0 ? keyboardHeight : 0,
          paddingBottom:
            keyboardHeight > 0 ? 0 : TAB_BAR_HEIGHT + insets.bottom,
        }}
      >
        <View className="px-4 py-2 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center px-3 py-2 rounded-2xl bg-ios-fill dark:bg-iosd-fill border border-ios-sep dark:border-iosd-sep">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Pitaj nešto..."
              placeholderTextColor="#8E8E93"
              className="flex-1 text-ios-label dark:text-iosd-label text-base py-1"
              returnKeyType="send"
              onSubmitEditing={() => onAsk()}
              editable={!loading}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            onPress={() => onAsk()}
            disabled={loading || !query.trim()}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              loading || !query.trim()
                ? "bg-ios-fill dark:bg-iosd-fill"
                : "bg-ios-blue"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={22}
                color={query.trim() ? "#FFF" : "#8E8E93"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenBackground>
  );
}
