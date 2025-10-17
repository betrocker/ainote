// app/assistant.tsx - REFAKTORISANO
import ScreenScroll from "@/components/ScreenScroll";
import { useNotes } from "@/context/NotesContext";
import { ask } from "@/utils/ai"; // ⭐ Direktan import
import Header from "@components/Header";
import ScreenBackground from "@components/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AssistantScreen() {
  const router = useRouter();
  const { notes } = useNotes();

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topNoteId, setTopNoteId] = useState<string | null>(null);

  const onAsk = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    console.log("🤖 [Assistant] Query:", q);
    console.log("🤖 [Assistant] Notes count:", notes.length);

    setLoading(true);
    setAnswer(null);

    try {
      // ⭐ Koristi facts-based ask funkciju
      const result = ask(q, notes);

      console.log("🤖 [Assistant] Matches:", result.matches.length);
      console.log("🤖 [Assistant] Top note:", result.topNoteId);
      console.log("🤖 [Assistant] Answer:", result.answer);
      console.log("🤖 [Assistant] Due on:", result.dueOn);

      setAnswer(result.answer);
      setTopNoteId(result.topNoteId);
    } catch (error) {
      console.log("🤖 [Assistant] Error:", error);
      setAnswer("Došlo je do greške. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  }, [query, notes]);

  const handleClear = () => {
    setQuery("");
    setAnswer(null);
    setTopNoteId(null);
  };

  return (
    <ScreenBackground variant="grouped">
      <Header
        title="Assistant"
        rightIcon="settings-outline"
        onRightPress={() => router.push("/settings")}
      />

      <ScreenScroll
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Card */}
        <View className="mb-4 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 p-4">
          <Text className="text-ios-label dark:text-iosd-label font-semibold mb-2">
            Ask your brain
          </Text>

          <View className="flex-row items-center">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder='Pitaj: "kada zamena ulja?" ili "50000 km"'
              placeholderTextColor="#8E8E93"
              className="flex-1 px-3 py-2 rounded-xl bg-ios-fill dark:bg-iosd-fill text-ios-label dark:text-iosd-label"
              returnKeyType="search"
              onSubmitEditing={onAsk}
              editable={!loading}
            />

            {query.length > 0 && !loading && (
              <TouchableOpacity
                onPress={handleClear}
                className="ml-2 w-8 h-8 rounded-full items-center justify-center bg-ios-gray6/50 dark:bg-white/10"
              >
                <Ionicons name="close" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onAsk}
              disabled={loading || !query.trim()}
              className={`ml-2 px-4 py-2 rounded-xl ${
                loading || !query.trim()
                  ? "bg-ios-gray6 dark:bg-white/10"
                  : "bg-ios-blue active:opacity-90"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text
                  className={`font-semibold ${
                    loading || !query.trim()
                      ? "text-ios-secondary"
                      : "text-white"
                  }`}
                >
                  Ask
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Answer Card */}
          {!!answer && (
            <View className="mt-4 p-3 rounded-xl bg-ios-blue/10 dark:bg-ios-blue/20 border border-ios-blue/20 dark:border-ios-blue/30">
              <View className="flex-row items-center mb-2">
                <Ionicons name="bulb" size={18} color="#0A84FF" />
                <Text className="ml-2 text-ios-blue dark:text-ios-blue font-semibold">
                  Odgovor
                </Text>
              </View>
              <Text className="text-ios-label dark:text-iosd-label text-base leading-6">
                {answer}
              </Text>

              {/* Debug info (opciono - ukloni u production) */}
              {__DEV__ && topNoteId && (
                <Text className="mt-2 text-xs text-ios-tertiary dark:text-iosd-tertiary">
                  Note ID: {topNoteId.slice(0, 8)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Example Queries (opciono) */}
        <View className="mb-4">
          <Text className="text-ios-secondary dark:text-iosd-label2 text-sm mb-3 px-1">
            Probaj pitanja:
          </Text>
          {[
            "kada idem u Nis",
            "kada zamena ulja?",
            "50000 km",
            "sutra",
            "za 5 dana",
          ].map((example, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setQuery(example)}
              className="mb-2 px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 active:opacity-90"
            >
              <Text className="text-ios-label dark:text-iosd-label">
                {example}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Debug: Show all notes with facts (opciono) */}
        {__DEV__ && (
          <View className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Text className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
              DEBUG: Notes sa facts
            </Text>
            {notes
              .filter((n) => n.ai?.facts && n.ai.facts.length > 0)
              .map((n) => (
                <View key={n.id} className="mb-2">
                  <Text className="text-xs text-yellow-800 dark:text-yellow-200">
                    {n.title} ({n.ai?.facts?.length} facts)
                  </Text>
                  {n.ai?.facts?.map((f, i) => (
                    <Text
                      key={i}
                      className="text-xs text-yellow-700 dark:text-yellow-300 ml-2"
                    >
                      • {f.predicate}: {f.object.slice(0, 30)}
                    </Text>
                  ))}
                </View>
              ))}
          </View>
        )}
      </ScreenScroll>
    </ScreenBackground>
  );
}
