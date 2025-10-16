// app/(tabs)/inbox.tsx
import EmptyInbox from "@/components/EmptyInbox";
import Header from "@/components/Header";
import NoteCard from "@/components/NoteCard";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenFlatList from "@/components/ScreenFlatList";
import { useNotes } from "@/context/NotesContext";
import React, { useMemo } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 44;
  const { notes, deleteNote } = useNotes();

  // (opciono) Ako želiš najnovije prve i ovde – mada već radimo sort u Context-u
  const data = useMemo(() => (Array.isArray(notes) ? [...notes] : []), [notes]);

  const isEmpty = !data || data.length === 0;

  return (
    <ScreenBackground variant="grouped">
      <Header title="Inbox" />

      {isEmpty ? (
        <View style={{ paddingTop: headerHeight, flex: 1 }}>
          <EmptyInbox />
        </View>
      ) : (
        <>
          {/* DEV traka – vidi realan count; ukloni kad sve radi */}
          {/* <Text className="mx-4 mt-3 mb-1 text-xs text-ios-secondary dark:text-iosd-label2">
            Notes: {data.length}
          </Text> */}

          <ScreenFlatList
            data={data}
            keyExtractor={(n) => n.id}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() => {
                  // po želji: otvori detalj/uređivanje
                  // router.push({ pathname: "/note-compose", params: { id: item.id } });
                }}
                onEdit={() => {
                  // router.push({ pathname: "/note-compose", params: { id: item.id } });
                }}
                onDelete={async () => {
                  await deleteNote(item.id);
                  // ⬅️ nema router.push – state već osvežava listu
                }}
                className="mx-4"
              />
            )}
            extraTop={12}
            contentContainerStyle={{ paddingBottom: 100 }}
            // (stabilnost/performanse)
            initialNumToRender={10}
            windowSize={10}
            removeClippedSubviews
          />
        </>
      )}
    </ScreenBackground>
  );
}
