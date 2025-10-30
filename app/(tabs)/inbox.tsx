// app/inbox.tsx
import LargeHeader, { HeaderButton } from "@/components/LargeHeader";
import NoteCard from "@/components/NoteCard";
import ScreenScroll from "@/components/ScreenScroll";
import SearchBar from "@/components/SearchBar";
import SortMenu from "@/components/SortMenu";
import TagChip from "@/components/TagChip";
import { useNotes } from "@/context/NotesContext";
import { haptics } from "@/utils/haptics";
import ScreenBackground from "@components/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Text, TouchableOpacity, View } from "react-native";

type FilterType = "all" | "text" | "audio" | "photo" | "video";
type SortOption = "newest" | "oldest" | "titleAsc" | "titleDesc" | "type";

export default function InboxScreen() {
  const { t } = useTranslation("common");
  const { notes, getAllTags } = useNotes();

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const allTags = getAllTags();
  const hasActiveFilters = filterType !== "all" || selectedTags.length > 0;

  const filteredNotes = useMemo(() => {
    let filtered = notes.filter((note) => !note.isPrivate); // ⭐ DODAJ - Isključi privatne beleške

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((note) => {
        return (
          note.title?.toLowerCase().includes(q) ||
          note.text?.toLowerCase().includes(q) ||
          note.description?.toLowerCase().includes(q)
        );
      });
    }

    if (filterType !== "all") {
      filtered = filtered.filter((note) => note.type === filterType);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((note) =>
        selectedTags.every((tag) => note.tags?.includes(tag))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "titleAsc":
          return (a.title || "").localeCompare(b.title || "");
        case "titleDesc":
          return (b.title || "").localeCompare(a.title || "");
        case "type":
          return (a.type || "").localeCompare(b.type || "");
        default:
          return 0;
      }
    });

    return sorted;
  }, [notes, searchQuery, filterType, selectedTags, sortBy]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setSelectedTags([]);
  };

  const toggleSearch = () => {
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
      setTimeout(() => {
        setSearchQuery("");
        setFilterType("all");
        setSelectedTags([]);
      }, 450);
    } else {
      setIsSearchExpanded(true);
    }
  };

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("screen.inbox.title")}
        isExpanded={isSearchExpanded}
        rightButtons={
          <>
            <HeaderButton
              icon={isSearchExpanded ? "close" : "search"}
              onPress={toggleSearch}
              active={isSearchExpanded}
            />
            <HeaderButton
              icon="swap-vertical"
              onPress={() => setShowSortMenu(true)}
            />
          </>
        }
        expandableContent={
          <>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("inbox.search.placeholder")}
              autoFocus={false}
            />

            {/* Filter Type Pills */}
            <View className="flex-row gap-2 mt-3 flex-wrap">
              <FilterPill
                label={t("inbox.filters.all")}
                active={filterType === "all"}
                onPress={() => setFilterType("all")}
                icon="albums-outline"
              />
              <FilterPill
                label={t("types.text")}
                active={filterType === "text"}
                onPress={() => setFilterType("text")}
                icon="document-text"
              />
              <FilterPill
                label={t("types.audio")}
                active={filterType === "audio"}
                onPress={() => setFilterType("audio")}
                icon="mic"
              />
              <FilterPill
                label={t("types.photo")}
                active={filterType === "photo"}
                onPress={() => setFilterType("photo")}
                icon="image"
              />
              <FilterPill
                label={t("types.video")}
                active={filterType === "video"}
                onPress={() => setFilterType("video")}
                icon="videocam"
              />
            </View>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <View className="mt-3">
                <Text className="text-xs font-monaBold text-ios-secondary dark:text-iosd-label2 mb-2">
                  {t("inbox.filters.byTags")}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <TagChip
                      key={tag}
                      tag={tag}
                      variant={
                        selectedTags.includes(tag) ? "selected" : "default"
                      }
                      onPress={() => handleTagToggle(tag)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={handleClearFilters}
                className="mt-3 py-2 px-3 rounded-full bg-red-500/10 border border-red-500/30 self-start"
                activeOpacity={0.7}
              >
                <Text className="text-xs font-monaBold text-red-600 dark:text-red-400">
                  {t("inbox.filters.clear")}
                </Text>
              </TouchableOpacity>
            )}

            {/* Results counter */}
            <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-2">
              {t("inbox.resultsCount", { count: filteredNotes.length })}
            </Text>
          </>
        }
      />

      {/* Notes List */}
      <ScreenScroll
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => <NoteCard key={note.id} note={note} />)
        ) : (
          <View className="items-center justify-center py-20 px-8">
            <View className="w-20 h-20 rounded-full bg-ios-fill dark:bg-iosd-fill items-center justify-center mb-4">
              <Ionicons
                name={searchQuery ? "search" : "document-text-outline"}
                size={40}
                color="#8E8E93"
              />
            </View>
            <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label mb-1 text-center">
              {searchQuery
                ? t("inbox.empty.noResults")
                : t("inbox.empty.title")}
            </Text>
            <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center">
              {searchQuery
                ? t("inbox.empty.tryDifferent")
                : t("inbox.empty.subtitle")}
            </Text>
          </View>
        )}
      </ScreenScroll>

      {/* Sort Menu Modal */}
      <SortMenu
        visible={showSortMenu}
        currentSort={sortBy}
        onSelectSort={(sort) => {
          setSortBy(sort);
          setShowSortMenu(false);
        }}
        onClose={() => setShowSortMenu(false)}
      />
    </ScreenBackground>
  );
}

// FilterPill component sa bounce animacijom
function FilterPill({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    haptics.selection();

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        tension: 400,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        className={`flex-row items-center px-3 py-1.5 rounded-full border ${
          active
            ? "bg-ios-blue border-ios-blue"
            : "bg-ios-fill dark:bg-iosd-fill border-ios-sep dark:border-iosd-sep"
        }`}
        activeOpacity={1}
      >
        <Ionicons
          name={icon as any}
          size={14}
          color={active ? "#FFF" : "#8E8E93"}
        />
        <Text
          className={`ml-1.5 text-xs font-monaBold ${
            active ? "text-white" : "text-ios-label dark:text-iosd-label"
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
