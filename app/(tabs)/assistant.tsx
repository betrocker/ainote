// app/assistant.tsx
import ScreenScroll from "@/components/ScreenScroll";
import { useNotes } from "@/context/NotesContext";
import { useSemanticNotes } from "@/context/SemanticNotesContext";
import Header from "@components/Header";
import ScreenBackground from "@components/ScreenBackground";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AssistantScreen() {
  const router = useRouter();

  // Notes za lokalni demo upit (askAI – čisto da vidiš da radi)
  const { notes } = useNotes();
  //   useEffect(() => {
  //     const demo = askAI("zamena menjača sutra", notes);
  //     console.log(demo.answer, demo.matches);
  //   }, [notes]);

  // Nemoj da desktruktuiraš u { ask } (može shadow sa importima ili eslint rule)
  const semantic = useSemanticNotes(); // <- jasnije
  // Ako ti je tip ovde opcioni, semantic može biti undefined – guard ispod to rešava

  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const onAsk = useCallback(async () => {
    if (!q.trim()) return;
    if (!semantic?.ask) {
      console.warn("SemanticNotes provider nije spreman ili nema ask()");
      return;
    }
    const res = await semantic.ask(q.trim());
    setAnswer(res.answer);
  }, [q, semantic]);

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
        <View className="mb-4 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 p-4">
          <Text className="text-ios-label dark:text-iosd-label font-semibold mb-2">
            Ask your brain
          </Text>

          <View className="flex-row items-center">
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Pitaj npr. “kada treba da zamenim ulje?”"
              placeholderTextColor="#8E8E93"
              className="flex-1 px-3 py-2 rounded-xl bg-ios-fill dark:bg-iosd-fill text-ios-label dark:text-iosd-label"
              returnKeyType="search"
              onSubmitEditing={onAsk}
            />
            <TouchableOpacity
              onPress={onAsk}
              className="ml-3 px-4 py-2 rounded-xl bg-ios-blue active:opacity-90"
            >
              <Text className="text-white font-semibold">Ask</Text>
            </TouchableOpacity>
          </View>

          {!!answer && (
            <View className="mt-3">
              <Text className="text-ios-secondary dark:text-iosd-label2">
                Odgovor:
              </Text>
              <Text className="text-ios-label dark:text-iosd-label text-lg mt-1">
                {answer}
              </Text>
            </View>
          )}
        </View>
      </ScreenScroll>
    </ScreenBackground>
  );
}
