// app/(tabs)/index.tsx
import LargeHeader, { HeaderButton } from "@/components/LargeHeader";
import ScreenScroll from "@/components/ScreenScroll";
import { useNotes } from "@/context/NotesContext";
import { usePlural } from "@/hooks/usePlural";
import ScreenBackground from "@components/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

function MiniWeekChart({ counts }: { counts: number[] }) {
  const { t } = useTranslation("common");
  const max = Math.max(1, ...counts);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <View className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 p-4">
      <Text className="text-ios-label dark:text-iosd-label font-semibold mb-3">
        {t("home.thisWeek")}
      </Text>
      <View className="flex-row justify-between items-end h-24">
        {counts.map((v, i) => {
          const h = Math.round((v / max) * 100);
          return (
            <View key={i} className="items-center" style={{ width: 24 }}>
              <View
                className="w-3 rounded-lg bg-ios-blue"
                style={{ height: `${h}%` }}
              />
              <Text className="mt-2 text-[11px] text-ios-secondary dark:text-iosd-secondary">
                {days[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation("common");
  const plural = usePlural();
  const router = useRouter();
  const { notes } = useNotes();

  // ⭐ Stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const total = notes.length;
    const pinned = notes.filter((n) => n.pinned).length;
    const todayCount = notes.filter(
      (n) => new Date(n.createdAt).toDateString() === todayStr
    ).length;

    const byType = {
      text: notes.filter((n) => n.type === "text").length,
      audio: notes.filter((n) => n.type === "audio").length,
      photo: notes.filter((n) => n.type === "photo").length,
      video: notes.filter((n) => n.type === "video").length,
    };

    const withTags = notes.filter((n) => n.tags && n.tags.length > 0).length;
    const withSummary = notes.filter((n) => n.ai?.summary).length;

    // Weekly counts (Mon-Sun)
    const weekCounts = [0, 0, 0, 0, 0, 0, 0];
    const getWeekIndex = (d: Date) => {
      const js = d.getDay(); // 0=Sun
      return (js + 6) % 7; // 0=Mon
    };

    notes.forEach((n) => {
      const created = new Date(n.createdAt);
      const idx = getWeekIndex(created);
      weekCounts[idx]++;
    });

    return {
      total,
      pinned,
      todayCount,
      byType,
      withTags,
      withSummary,
      weekCounts,
    };
  }, [notes]);

  // ⭐ Upcoming dates
  const upcomingNotes = useMemo(() => {
    return notes
      .filter((n) => n.ai?.facts?.some((f) => f.predicate === "due_on"))
      .sort((a, b) => {
        const dateA = a.ai?.facts?.find(
          (f) => f.predicate === "due_on"
        )?.object;
        const dateB = b.ai?.facts?.find(
          (f) => f.predicate === "due_on"
        )?.object;
        return (dateA || "").localeCompare(dateB || "");
      });
  }, [notes]);

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title="Home"
        rightButtons={
          <HeaderButton
            icon="settings-outline"
            onPress={() => router.push("/settings")}
          />
        }
      />

      <ScreenScroll
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero pozdrav */}
        <View className="mb-6">
          <Text className="text-ios-secondary dark:text-iosd-label2 text-[16px]">
            {t("home.welcome")}
          </Text>

          <Text className="text-2xl font-bold text-ios-label dark:text-iosd-label mt-1">
            {stats.todayCount} {plural(stats.todayCount, "home.note")}{" "}
            {t("home.today")}
          </Text>
        </View>

        {/* ⭐ Kompaktna Stats kartica */}
        <View className="mb-6 p-4 bg-white/70 dark:bg-white/10 rounded-2xl border border-black/10 dark:border-white/10">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-ios-label dark:text-iosd-label">
              {t("home.overview")}
            </Text>
            <View className="bg-ios-blue/15 rounded-full px-2 py-1">
              <Text className="text-xs font-semibold text-ios-blue">
                {stats.total} {t("home.total")}
              </Text>
            </View>
          </View>

          {/* Grid sa 4 key metrics - horizontal layout */}
          <View className="flex-row flex-wrap gap-y-3">
            {/* Text */}
            <View className="flex-row items-center w-[48%]">
              <View className="w-8 h-8 rounded-full bg-ios-blue/15 items-center justify-center mr-2">
                <Ionicons name="document-text" size={16} color="#0A84FF" />
              </View>
              <Text className="text-base font-semibold text-ios-label dark:text-iosd-label mr-1">
                {stats.byType.text}
              </Text>
              <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                Text
              </Text>
            </View>

            {/* Audio */}
            <View className="flex-row items-center w-[48%]">
              <View className="w-8 h-8 rounded-full bg-purple-500/15 items-center justify-center mr-2">
                <Ionicons name="mic" size={16} color="#A855F7" />
              </View>
              <Text className="text-base font-semibold text-ios-label dark:text-iosd-label mr-1">
                {stats.byType.audio}
              </Text>
              <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                Audio
              </Text>
            </View>

            {/* Photo */}
            <View className="flex-row items-center w-[48%]">
              <View className="w-8 h-8 rounded-full bg-green-500/15 items-center justify-center mr-2">
                <Ionicons name="image" size={16} color="#10B981" />
              </View>
              <Text className="text-base font-semibold text-ios-label dark:text-iosd-label mr-1">
                {stats.byType.photo}
              </Text>
              <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                Photo
              </Text>
            </View>

            {/* Video */}
            <View className="flex-row items-center w-[48%]">
              <View className="w-8 h-8 rounded-full bg-amber-500/15 items-center justify-center mr-2">
                <Ionicons name="videocam" size={16} color="#F59E0B" />
              </View>
              <Text className="text-base font-semibold text-ios-label dark:text-iosd-label mr-1">
                {stats.byType.video}
              </Text>
              <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                Video
              </Text>
            </View>
          </View>

          {/* Dodatni metrics (samo ako postoje) */}
          {(stats.pinned > 0 ||
            stats.withTags > 0 ||
            stats.withSummary > 0) && (
            <View className="mt-3 pt-3 border-t border-ios-sep dark:border-iosd-sep flex-row flex-wrap gap-2">
              {stats.pinned > 0 && (
                <View className="flex-row items-center px-2 py-1 rounded-full bg-amber-500/10">
                  <Ionicons name="pin" size={12} color="#F59E0B" />
                  <Text>
                    {stats.pinned} {t("note.singular", { count: stats.pinned })}
                  </Text>
                </View>
              )}
              {stats.withTags > 0 && (
                <View className="flex-row items-center px-2 py-1 rounded-full bg-blue-500/10">
                  <Ionicons name="pricetag" size={12} color="#3B82F6" />
                  <Text className="text-xs ml-1 text-blue-600 dark:text-blue-400">
                    {stats.withTags} tagged
                  </Text>
                </View>
              )}
              {stats.withSummary > 0 && (
                <View className="flex-row items-center px-2 py-1 rounded-full bg-purple-500/10">
                  <Ionicons name="sparkles" size={12} color="#A855F7" />
                  <Text className="text-xs ml-1 text-purple-600 dark:text-purple-400">
                    {stats.withSummary} AI
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ⭐ Weekly Chart */}
        <View className="mb-6">
          <MiniWeekChart counts={stats.weekCounts} />
        </View>

        {/* ⭐ Quick links ka kategorijama */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-ios-label dark:text-iosd-label mb-3">
            {t("home.browse")}
          </Text>

          {/* Pinned link */}
          {stats.pinned > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/inbox")} // Inbox će imati pinned na vrhu
              className="flex-row items-center justify-between p-4 mb-2 bg-white/70 dark:bg-white/10 rounded-2xl border border-black/10 dark:border-white/10 active:opacity-70"
              activeOpacity={1}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-amber-500/15 items-center justify-center mr-3">
                  <Ionicons name="pin" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text className="text-base font-semibold text-ios-label dark:text-iosd-label">
                    Pinned Notes
                  </Text>
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2">
                    {stats.pinned} {stats.pinned === 1 ? "note" : "notes"}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}

          {/* Upcoming link */}
          {upcomingNotes.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/inbox")}
              className="flex-row items-center justify-between p-4 mb-2 bg-white/70 dark:bg-white/10 rounded-2xl border border-black/10 dark:border-white/10 active:opacity-70"
              activeOpacity={1}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-red-500/15 items-center justify-center mr-3">
                  <Ionicons name="calendar-outline" size={20} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-base font-semibold text-ios-label dark:text-iosd-label">
                    {t("home.upcoming")}
                  </Text>
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2">
                    {upcomingNotes.length} with due dates
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}

          {/* All notes link */}
          <TouchableOpacity
            onPress={() => router.push("/inbox")}
            className="flex-row items-center justify-between p-4 bg-ios-blue/15 rounded-2xl border border-ios-blue/30 active:opacity-70"
            activeOpacity={1}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-ios-blue/20 items-center justify-center mr-3">
                <Ionicons name="albums-outline" size={20} color="#0A84FF" />
              </View>
              <View>
                <Text className="text-base font-semibold text-ios-blue">
                  {t("home.allNotes")}
                </Text>
                <Text className="text-xs text-ios-blue">
                  {t("home.viewAll")}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0A84FF" />
          </TouchableOpacity>
        </View>

        {/* Empty state */}
        {stats.total === 0 && (
          <View className="items-center justify-center py-20 px-8">
            <View className="w-20 h-20 rounded-full bg-ios-fill dark:bg-iosd-fill items-center justify-center mb-4">
              <Ionicons
                name="document-text-outline"
                size={40}
                color="#8E8E93"
              />
            </View>
            <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label mb-1 text-center">
              {t("home.empty.title")}
            </Text>
            <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center">
              {t("home.empty.subtitle")}
            </Text>
          </View>
        )}
      </ScreenScroll>
    </ScreenBackground>
  );
}
