// app/assistant.tsx
import LargeHeader, { HeaderButton } from "@/components/LargeHeader";
import { useNotes } from "@/context/NotesContext";
import { ask } from "@/utils/ai";
import ScreenBackground from "@components/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type QAPair = {
  id: string;
  question: string;
  answer: string;
  noteId?: string | null;
  timestamp: number;
};

export default function AssistantScreen() {
  const router = useRouter();
  const { notes } = useNotes();
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [query, setQuery] = useState("");
  const [currentQA, setCurrentQA] = useState<QAPair | null>(null);
  const [history, setHistory] = useState<QAPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // KLJUČNO: Praćenje tastature
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        console.log("⌨️ Keyboard height:", e.endCoordinates.height);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        console.log("⌨️ Keyboard hidden");
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const QUICK_SUGGESTIONS = [
    { text: t("assistant.quickSuggestions.one") },
    { text: t("assistant.quickSuggestions.two") },
    { text: t("assistant.quickSuggestions.three") },
    { text: t("assistant.quickSuggestions.four") },
    { text: t("assistant.quickSuggestions.five") },
  ];

  const onAsk = useCallback(
    async (customQuery?: string) => {
      const q = (customQuery || query).trim();
      if (!q) return;

      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setLoading(true);
      setQuery("");
      Keyboard.dismiss();

      try {
        const result = ask(q, notes);

        const newQA: QAPair = {
          id: Date.now().toString(),
          question: q,
          answer: result.answer,
          noteId: result.topNoteId,
          timestamp: Date.now(),
        };

        setCurrentQA(newQA);
        setHistory((prev) => [newQA, ...prev]);
      } catch (error) {
        console.log("🤖 [Assistant] Error:", error);
        const errorQA: QAPair = {
          id: Date.now().toString(),
          question: q,
          answer: t("assistant.errors.failed"),
          timestamp: Date.now(),
        };
        setCurrentQA(errorQA);
      } finally {
        setLoading(false);
      }
    },
    [query, notes, t]
  );

  const handleClear = () => {
    Alert.alert(t("assistant.clearAll"), t("assistant.clearConfirm"), [
      { text: t("assistant.cancel"), style: "cancel" },
      {
        text: t("assistant.delete"),
        style: "destructive",
        onPress: () => {
          setCurrentQA(null);
          setHistory([]);
          setQuery("");
        },
      },
    ]);
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  const handleQuickHistory = (qa: QAPair) => {
    setCurrentQA(qa);
  };

  const lastFiveQA = history.slice(0, 5);

  // KRITIČNO: Pravilna kalkulacija bottom pozicije
  const bottomPosition =
    keyboardHeight > 0 ? keyboardHeight + 65 : insets.bottom + 75;

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("assistant.title")}
        rightButtons={
          currentQA || history.length > 0 ? (
            <HeaderButton icon="trash-outline" onPress={handleClear} />
          ) : undefined
        }
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingTop: 0,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        {/* Stats Header */}
        <View className="px-4 py-4 flex-row gap-2">
          <View className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-ios-blue/15 to-ios-blue/5 border border-ios-blue/20">
            <Text className="text-xs text-ios-secondary dark:text-iosd-label2 font-monaRegular">
              {t("assistant.stats.questions")}
            </Text>
            <Text className="text-lg font-monaBold text-ios-blue mt-0.5">
              {history.length}
            </Text>
          </View>
          <View className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/20">
            <Text className="text-xs text-ios-secondary dark:text-iosd-label2 font-monaRegular">
              {t("assistant.stats.notes")}
            </Text>
            <Text className="text-lg font-monaBold text-green-600 dark:text-green-500 mt-0.5">
              {notes.length}
            </Text>
          </View>
          <View className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/20">
            <Text className="text-xs text-ios-secondary dark:text-iosd-label2 font-monaRegular">
              {t("assistant.stats.aiReady")}
            </Text>
            <Text className="text-lg font-monaBold text-purple-600 dark:text-purple-500 mt-0.5">
              {notes.filter((n) => n.ai?.facts && n.ai.facts.length > 0).length}
            </Text>
          </View>
        </View>

        {/* Quick Suggestions */}
        {!currentQA && history.length === 0 && (
          <View className="mb-6">
            <Text className="text-xs font-monaBold text-ios-secondary dark:text-iosd-label2 px-4 mb-2 uppercase tracking-wide">
              {t("assistant.quickQuestions")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {QUICK_SUGGESTIONS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => onAsk(item.text)}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-ios-blue/10 to-purple-500/10 border border-ios-blue/30 dark:border-ios-blue/20 active:opacity-60"
                  activeOpacity={1}
                >
                  <Text className="text-sm font-monaMedium text-ios-label dark:text-iosd-label whitespace-nowrap">
                    {item.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Content */}
        <View className="px-4">
          {/* Welcome */}
          {!currentQA && history.length === 0 && (
            <View className="items-center py-8">
              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-ios-blue/20 to-purple-500/20 items-center justify-center mb-4">
                <Ionicons name="sparkles" size={40} color="#0A84FF" />
              </View>
              <Text className="text-2xl font-monaBold text-ios-label dark:text-iosd-label mb-2 text-center">
                {t("assistant.title_main")}
              </Text>
              <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center px-4 leading-5">
                {t("assistant.subtitle")}
              </Text>
            </View>
          )}

          {/* Current Q&A */}
          {currentQA && (
            <View className="mb-6">
              {/* Question Card - WIĘKSZE I BOLD */}
              <View className="mb-4 p-5 rounded-3xl bg-gradient-to-br from-ios-blue/15 to-ios-blue/5 border border-ios-blue/30 dark:border-ios-blue/20 backdrop-blur-xl">
                <View className="flex-row items-center mb-3">
                  <View className="w-8 h-8 rounded-full bg-ios-blue/20 items-center justify-center">
                    <Ionicons name="help-circle" size={16} color="#0A84FF" />
                  </View>
                  <Text className="ml-2 text-xs font-monaBold text-ios-blue uppercase tracking-wider">
                    {t("assistant.question")}
                  </Text>
                </View>
                <Text className="text-2xl leading-8 text-ios-label2 dark:text-iosd-label2 font-monaBold">
                  {currentQA.question}
                </Text>
              </View>

              {/* Answer Card - DIREKTNO ISPOD */}
              {loading ? (
                <View className="p-6 rounded-3xl bg-gradient-to-br from-white/60 to-white/40 dark:from-white/10 dark:to-white/5 border border-white/40 dark:border-white/20 backdrop-blur-xl items-center justify-center min-h-32">
                  <ActivityIndicator size="large" color="#0A84FF" />
                  <Text className="mt-3 text-sm text-ios-secondary dark:text-iosd-label2 font-monaMedium">
                    {t("assistant.searching")}
                  </Text>
                </View>
              ) : (
                <View className="p-5 rounded-3xl bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/30 dark:border-green-500/20 backdrop-blur-xl">
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center">
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#34C759"
                      />
                    </View>
                    <Text className="ml-2 text-xs font-monaBold text-green-600 dark:text-green-500 uppercase tracking-wider">
                      {t("assistant.answer")}
                    </Text>
                  </View>
                  <Text className="text-base leading-7 text-ios-label dark:text-iosd-label font-monaRegular mb-4">
                    {currentQA.answer}
                  </Text>

                  {currentQA.noteId && (
                    <TouchableOpacity
                      onPress={() => handleNotePress(currentQA.noteId!)}
                      className="mt-3 pt-3 border-t border-green-500/20 flex-row items-center active:opacity-60"
                    >
                      <View className="w-7 h-7 rounded-full bg-green-500/15 items-center justify-center mr-2">
                        <Ionicons
                          name="document-text"
                          size={14}
                          color="#34C759"
                        />
                      </View>
                      <Text className="flex-1 text-sm text-green-600 dark:text-green-500 font-monaMedium">
                        {t("assistant.showNote")}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#34C759"
                      />
                    </TouchableOpacity>
                  )}

                  <Text className="mt-3 text-xs text-ios-label2 dark:text-iosd-label2 font-monaRegular">
                    {new Date(currentQA.timestamp).toLocaleString("sr-RS", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Last 5 Questions - SA DATUMOM I VREMENOM */}
          {lastFiveQA.length > 0 && (
            <View className="mt-6">
              <Text className="text-xs font-monaBold text-ios-secondary dark:text-iosd-label2 mb-3 uppercase tracking-wide">
                {t("assistant.lastQuestions")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 16 }}
              >
                {lastFiveQA.map((qa) => (
                  <TouchableOpacity
                    key={qa.id}
                    onPress={() => handleQuickHistory(qa)}
                    activeOpacity={1}
                    style={{ width: 280 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-ios-blue/20 to-purple-500/15 border border-ios-blue/40 dark:border-ios-blue/35 backdrop-blur-xl active:opacity-60"
                  >
                    {/* Question */}
                    <View className="flex-row items-start mb-2">
                      <Ionicons
                        name="help-circle-outline"
                        size={14}
                        color="#0A84FF"
                        style={{ marginTop: 1, marginRight: 6 }}
                      />
                      <Text
                        className="flex-1 text-sm font-monaMedium text-ios-label dark:text-iosd-label leading-5"
                        numberOfLines={2}
                      >
                        {qa.question}
                      </Text>
                    </View>

                    {/* Answer */}
                    <View className="flex-row items-start border-t border-ios-blue/20 dark:border-ios-blue/25 pt-2 mb-2">
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={13}
                        color="#34C759"
                        style={{ marginTop: 1, marginRight: 6 }}
                      />
                      <Text
                        className="flex-1 text-xs font-monaRegular text-ios-label dark:text-iosd-label2 leading-4"
                        numberOfLines={2}
                      >
                        {qa.answer}
                      </Text>
                    </View>

                    {/* Timestamp - DATUM I VREME */}
                    <View className="flex-row items-center pl-5 border-t border-ios-blue/20 dark:border-ios-blue/25 pt-2">
                      <Ionicons
                        name="calendar"
                        size={12}
                        color="#8E8E93"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-xs text-ios-label2 dark:text-iosd-label2 font-monaRegular">
                        {new Date(qa.timestamp).toLocaleString("sr-RS", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FLOATING INPUT - KLJUČNO */}
      <View
        className="absolute left-0 right-0"
        style={{
          bottom: bottomPosition,
          paddingHorizontal: 16,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
          zIndex: 9999,
        }}
      >
        <View
          className="flex-row items-center px-4 py-3 rounded-full bg-white/95 dark:bg-iosd-bg/95 backdrop-blur-2xl border border-white/60 dark:border-white/20"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 28,
            elevation: 25,
          }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("assistant.placeholder")}
            placeholderTextColor="#8E8E93"
            className="flex-1 text-base text-ios-label dark:text-iosd-label font-monaRegular"
            returnKeyType="send"
            onSubmitEditing={() => onAsk()}
            editable={!loading}
          />

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPress={() => onAsk()}
              disabled={loading || !query.trim()}
              className={`ml-3 p-2.5 rounded-full items-center justify-center ${
                loading || !query.trim()
                  ? "bg-ios-fill dark:bg-iosd-fill"
                  : "bg-ios-blue"
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={query.trim() ? "#FFF" : "#8E8E93"}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </ScreenBackground>
  );
}
