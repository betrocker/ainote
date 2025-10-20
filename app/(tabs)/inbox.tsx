// app/(tabs)/inbox.tsx
import EmptyInbox from "@/components/EmptyInbox";
import FilterChips, { FilterType } from "@/components/FilterChips";
import Header from "@/components/Header";
import NoteCard from "@/components/NoteCard";
import ScreenBackground from "@/components/ScreenBackground";
import ScreenFlatList from "@/components/ScreenFlatList";
import SearchBar from "@/components/SearchBar";
import SortMenu, { SortOption } from "@/components/SortMenu";
import TagChip from "@/components/TagChip";
import { useNotes } from "@/context/NotesContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 44;
  const { notes, getAllTags } = useNotes();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  // ⭐ Dobavi sve tagove
  const allTags = useMemo(() => getAllTags(), [notes]);

  const filteredNotes = useMemo(() => {
    if (!Array.isArray(notes)) return [];

    let result = [...notes];

    // Filter po tipu
    if (activeFilter !== "all") {
      result = result.filter((note) => note.type === activeFilter);
    }

    // Filter po tagu
    if (selectedTag) {
      result = result.filter((note) => note.tags?.includes(selectedTag));
    }

    // Pretraga
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((note) => {
        const title = note.title?.toLowerCase() || "";
        const description = note.description?.toLowerCase() || "";
        const text = note.text?.toLowerCase() || "";

        return (
          title.includes(query) ||
          description.includes(query) ||
          text.includes(query)
        );
      });
    }

    // ⭐ SORTIRANJE
    result.sort((a, b) => {
      // Prvo pinned beležke (uvek na vrh)
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Zatim primeni izabrano sortiranje
      switch (sortOption) {
        case "date-desc":
          return b.createdAt - a.createdAt;
        case "date-asc":
          return a.createdAt - b.createdAt;
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "type":
          const typeOrder = { text: 0, audio: 1, photo: 2, video: 3 };
          return typeOrder[a.type] - typeOrder[b.type];
        default:
          return 0;
      }
    });

    return result;
  }, [notes, activeFilter, searchQuery, selectedTag, sortOption]);

  const isEmpty = filteredNotes.length === 0;
  const hasNotes = notes && notes.length > 0;

  // ⭐ Dinamička visina search/filter sekcije
  // Dodaj 48px ako ima tagova
  const baseHeight = 132;
  const tagRowHeight = allTags.length > 0 ? 48 : 0;
  const searchFilterHeight = baseHeight + tagRowHeight;

  return (
    <ScreenBackground variant="grouped">
      <Header title="Inbox" />

      {/* Search & Filter sekcija */}
      {hasNotes && (
        <View
          style={{
            position: "absolute",
            top: headerHeight + 16,
            left: 0,
            right: 0,
            zIndex: 9,
          }}
        >
          <BlurView
            intensity={60}
            tint={theme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />

          <View className="bg-white/20 dark:bg-black/10 border-b border-ios-sep dark:border-iosd-sep">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={() => setSearchQuery("")}
            />

            <FilterChips
              activeFilter={activeFilter}
              onFilterChange={(filter) => {
                setActiveFilter(filter);
                // Reset tag filter kada menjamo type filter
                setSelectedTag(null);
              }}
            />

            {/* TAG FILTER CHIPS */}
            {allTags.length > 0 && (
              <View className="mb-3">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mx-4"
                  contentContainerStyle={{ paddingRight: 16 }}
                >
                  {allTags.map((tag) => (
                    <TagChip
                      key={tag}
                      tag={tag}
                      variant="default"
                      selected={selectedTag === tag} // ⭐ Prikaži selected state
                      onPress={() => {
                        setSelectedTag(selectedTag === tag ? null : tag);
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Results count */}
            <View className="mx-4 mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                {filteredNotes.length}{" "}
                {filteredNotes.length === 1 ? "beležka" : "beležaka"}
              </Text>

              {/* ⭐ Active tag indicator */}
              {selectedTag && (
                <View className="flex-row items-center px-2 py-1 rounded-full bg-ios-blue/20 dark:bg-ios-blue/30">
                  <Ionicons name="pricetag" size={12} color="#0A84FF" />
                  <Text className="text-xs font-semibold text-ios-blue ml-1">
                    {selectedTag}
                  </Text>
                </View>
              )}

              {/* ⭐ Sort menu */}
              <SortMenu
                activeSortOption={sortOption}
                onSortChange={setSortOption}
              />
            </View>
          </View>
        </View>
      )}

      {/* Sadržaj */}
      {isEmpty && !hasNotes ? (
        <View style={{ paddingTop: headerHeight + 16, flex: 1 }}>
          <EmptyInbox />
        </View>
      ) : isEmpty && hasNotes ? (
        <View
          style={{ paddingTop: headerHeight + searchFilterHeight + 32 }}
          className="items-center justify-center py-20 flex-1"
        >
          <View className="w-20 h-20 rounded-full bg-ios-fill dark:bg-iosd-fill items-center justify-center mb-4">
            <Ionicons name="search-outline" size={40} color="#8E8E93" />
          </View>
          <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label mb-1">
            Nema rezultata
          </Text>
          <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center px-8">
            {selectedTag
              ? `Nema beleški sa tagom "${selectedTag}"`
              : "Pokušaj sa drugačijim pojmom"}
          </Text>
        </View>
      ) : (
        <ScreenFlatList
          data={filteredNotes}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <NoteCard note={item} className="mx-4" />}
          extraTop={hasNotes ? searchFilterHeight + 24 : 12}
          contentContainerStyle={{ paddingBottom: 100 }}
          initialNumToRender={10}
          windowSize={10}
          removeClippedSubviews
        />
      )}
    </ScreenBackground>
  );
}
