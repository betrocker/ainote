// app/(tabs)/index.tsx
import LargeHeader, { HeaderButton } from "@/components/LargeHeader";
import ScreenScroll from "@/components/ScreenScroll";
import { useNotes } from "@/context/NotesContext";
import { usePremium } from "@/context/PremiumContext";
import ScreenBackground from "@components/ScreenBackground";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

function MiniWeekChart({
  counts,
  days,
  thisWeekLabel,
}: {
  counts: number[];
  days: string[];
  thisWeekLabel: string;
}) {
  const max = Math.max(1, ...counts);

  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify()}
      className="rounded-2xl border border-ios-sepSoft dark:border-iosd-sepSoft bg-white/70 dark:bg-white/10 p-4"
    >
      <Text className="text-ios-label dark:text-iosd-label font-monaBold mb-3">
        {thisWeekLabel}
      </Text>
      <View className="flex-row justify-between items-end h-24">
        {counts.map((v, i) => {
          const h = Math.max(8, Math.round((v / max) * 100));
          return (
            <Animated.View
              key={i}
              entering={FadeInUp.delay(250 + i * 50).springify()}
              className="items-center"
              style={{ width: 24 }}
            >
              <View
                className="w-3 rounded-lg bg-ios-blue"
                style={{ height: `${h}%` }}
              />
              <Text className="mt-2 text-[11px] text-ios-secondary dark:text-iosd-secondary">
                {days[i]}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

// Reusable stat card component
function StatCard({
  icon,
  iconColor,
  iconBg,
  count,
  label,
  delay = 0,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  count: number;
  label: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="flex-row items-center w-[48%]"
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-2"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon as any} size={16} color={iconColor} />
      </View>
      <Text className="text-base font-monaBold text-ios-label dark:text-iosd-label mr-1">
        {count}
      </Text>
      <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
        {label}
      </Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { notes, isLoading } = useNotes();
  const { isPremium } = usePremium();

  // ⭐ Stats - dodaj private count
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const total = notes.length;
    const pinned = notes.filter((n: any) => n.pinned).length;
    const todayCount = notes.filter(
      (n: any) => new Date(n.createdAt).toDateString() === todayStr
    ).length;

    const byType: Record<string, number> = {
      text: notes.filter((n: any) => n.type === "text").length,
      audio: notes.filter((n: any) => n.type === "audio").length,
      photo: notes.filter((n: any) => n.type === "photo").length,
      video: notes.filter((n: any) => n.type === "video").length,
    };

    const withTags = notes.filter(
      (n: any) => n.tags && n.tags.length > 0
    ).length;
    const withSummary = notes.filter((n: any) => n.ai?.summary).length;

    // ⭐ DODAJ: Private notes count
    const privateCount = notes.filter((n: any) => n.isPrivate).length;

    const weekCounts = [0, 0, 0, 0, 0, 0, 0];
    const getWeekIndex = (d: Date) => {
      const js = d.getDay();
      return (js + 6) % 7;
    };

    notes.forEach((n: any) => {
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
      privateCount, // ⭐ DODAJ u return
      weekCounts,
    };
  }, [notes]);

  // ⭐ SVE TRANSLATION STRINGOVE NA VRHU
  const weekLabels = [
    t("week.monShort"),
    t("week.tueShort"),
    t("week.wedShort"),
    t("week.thuShort"),
    t("week.friShort"),
    t("week.satShort"),
    t("week.sunShort"),
  ];

  // ⭐ Loading state
  if (isLoading) {
    return (
      <ScreenBackground variant="grouped">
        <LargeHeader
          title={t("home.title")}
          rightButtons={
            <HeaderButton
              icon="settings-outline"
              onPress={() => router.push("/settings")}
            />
          }
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A84FF" />
        </View>
      </ScreenBackground>
    );
  }

  const upcomingNotes = useMemo(() => {
    return notes
      .filter((n: any) =>
        n.ai?.facts?.some((f: any) => f.predicate === "due_on")
      )
      .sort((a: any, b: any) => {
        const dateA = a.ai?.facts?.find(
          (f: any) => f.predicate === "due_on"
        )?.object;
        const dateB = b.ai?.facts?.find(
          (f: any) => f.predicate === "due_on"
        )?.object;
        return (dateA || "").localeCompare(dateB || "");
      });
  }, [notes]);

  return (
    <ScreenBackground variant="grouped">
      <LargeHeader
        title={t("home.title")}
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
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
          className="mb-6"
        >
          <Text className="text-ios-secondary dark:text-iosd-label2 text-[16px]">
            {t("home.welcome")}
          </Text>

          <Text className="text-2xl font-monaBold text-ios-label dark:text-iosd-label mt-1">
            {t("home.todayCount", {
              count: stats.todayCount,
            })}
          </Text>
        </Animated.View>

        {/* Stats kartica */}
        {stats.total > 0 && (
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="mb-6 p-4 bg-white/70 dark:bg-white/10 rounded-2xl border border-ios-sepSoft dark:border-iosd-sepSoft"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
                {t("home.overview")}
              </Text>
              <View className="bg-ios-blue/15 rounded-full px-2 py-1">
                <Text className="text-xs font-monaBold text-ios-blue">
                  {t("home.totalCount", { count: stats.total })}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-y-3">
              <StatCard
                icon="document-text"
                iconColor="#0A84FF"
                iconBg="rgba(10, 132, 255, 0.15)"
                count={stats.byType.text}
                label={t("home.types.text")}
                delay={150}
              />

              <StatCard
                icon="mic"
                iconColor="#A855F7"
                iconBg="rgba(168, 85, 247, 0.15)"
                count={stats.byType.audio}
                label={t("home.types.audio")}
                delay={200}
              />

              <StatCard
                icon="image"
                iconColor="#10B981"
                iconBg="rgba(16, 185, 129, 0.15)"
                count={stats.byType.photo}
                label={t("home.types.photo")}
                delay={250}
              />

              <StatCard
                icon="videocam"
                iconColor="#F59E0B"
                iconBg="rgba(245, 158, 11, 0.15)"
                count={stats.byType.video || 0}
                label={t("home.types.video")}
                delay={300}
              />
            </View>

            {(stats.pinned > 0 ||
              stats.withTags > 0 ||
              stats.withSummary > 0 ||
              (isPremium && stats.privateCount > 0)) && (
              <Animated.View
                entering={FadeInDown.delay(350).springify()}
                className="mt-3 pt-3 border-t border-ios-sep dark:border-iosd-sep flex-row flex-wrap gap-2"
              >
                {stats.pinned > 0 && (
                  <View className="flex-row items-center px-2 py-1 rounded-full bg-amber-500/10">
                    <Ionicons name="pin" size={12} color="#F59E0B" />
                    <Text className="text-xs ml-1 text-amber-600 dark:text-amber-400">
                      {t("home.pinnedCount", { count: stats.pinned })}
                    </Text>
                  </View>
                )}

                {stats.withTags > 0 && (
                  <View className="flex-row items-center px-2 py-1 rounded-full bg-blue-500/10">
                    <Ionicons name="pricetag" size={12} color="#3B82F6" />
                    <Text className="text-xs ml-1 text-blue-600 dark:text-blue-400">
                      {t("home.taggedCount", { count: stats.withTags })}
                    </Text>
                  </View>
                )}
                {stats.withSummary > 0 && (
                  <View className="flex-row items-center px-2 py-1 rounded-full bg-purple-500/10">
                    <Ionicons name="sparkles" size={12} color="#A855F7" />
                    <Text className="text-xs ml-1 text-purple-600 dark:text-purple-400">
                      {t("home.aiCount", { count: stats.withSummary })}
                    </Text>
                  </View>
                )}

                {/* ⭐ SAMO BADGE za private - NE TouchableOpacity! */}
                {isPremium && stats.privateCount > 0 && (
                  <View className="flex-row items-center px-2 py-1 rounded-full bg-red-500/10">
                    <Ionicons name="lock-closed" size={12} color="#EF4444" />
                    <Text className="text-xs ml-1 text-red-600 dark:text-red-400">
                      {t("home.privateCount", { count: stats.privateCount })}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Weekly Chart - ⭐ UVIJEK RENDERUJ */}
        {stats.total > 0 && (
          <View className="mb-6">
            <MiniWeekChart
              counts={stats.weekCounts}
              days={weekLabels}
              thisWeekLabel={t("home.thisWeek")}
            />
          </View>
        )}

        {/* Quick links */}
        {stats.total > 0 && (
          <View className="mb-6">
            <Animated.Text
              entering={FadeInDown.delay(400).springify()}
              className="text-lg font-monaBold text-ios-label dark:text-iosd-label mb-3"
            >
              {t("home.browse")}
            </Animated.Text>

            {/* ⭐ PRIVATE FOLDER LINK - PRVO! */}
            {isPremium && stats.privateCount > 0 && (
              <Animated.View entering={FadeInDown.delay(425).springify()}>
                <TouchableOpacity
                  onPress={() => router.push("/private")}
                  className="flex-row items-center justify-between p-4 mb-2 bg-white/70 dark:bg-white/10 rounded-2xl border border-ios-sepSoft dark:border-iosd-sepSoft active:opacity-70"
                  activeOpacity={1}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-red-500/15 items-center justify-center mr-3">
                      <Ionicons name="lock-closed" size={20} color="#EF4444" />
                    </View>
                    <View>
                      <Text className="text-base font-monaBold text-ios-label dark:text-iosd-label">
                        {t("home.links.private")}
                      </Text>
                      <Text className="text-xs text-ios-secondary dark:text-iosd-label2">
                        {t("home.privateCount", { count: stats.privateCount })}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {stats.pinned > 0 && (
              <Animated.View entering={FadeInDown.delay(450).springify()}>
                <TouchableOpacity
                  onPress={() => router.push("/inbox")}
                  className="flex-row items-center justify-between p-4 mb-2 bg-white/70 dark:bg-white/10 rounded-2xl border border-ios-sepSoft dark:border-iosd-sepSoft active:opacity-70"
                  activeOpacity={1}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-amber-500/15 items-center justify-center mr-3">
                      <Ionicons name="pin" size={20} color="#F59E0B" />
                    </View>
                    <View>
                      <Text className="text-base font-monaBold text-ios-label dark:text-iosd-label">
                        {t("home.links.pinned")}
                      </Text>
                      <Text className="text-xs text-ios-secondary dark:text-iosd-label2">
                        {t("home.pinnedCount", { count: stats.pinned })}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </Animated.View>
            )}

            {upcomingNotes.length > 0 && (
              <Animated.View entering={FadeInDown.delay(500).springify()}>
                <TouchableOpacity
                  onPress={() => router.push("/inbox")}
                  className="flex-row items-center justify-between p-4 mb-2 bg-white/70 dark:bg-white/10 rounded-2xl border border-ios-sepSoft dark:border-iosd-sepSoft active:opacity-70"
                  activeOpacity={1}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-red-500/15 items-center justify-center mr-3">
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </View>
                    <View>
                      <Text className="text-base font-monaBold text-ios-label dark:text-iosd-label">
                        {t("home.upcoming")}
                      </Text>
                      <Text className="text-xs text-ios-secondary dark:text-iosd-label2">
                        {t("home.withDueDates", {
                          count: upcomingNotes.length,
                        })}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(550).springify()}>
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
                    <Text className="text-base font-monaBold text-ios-blue">
                      {t("home.allNotes")}
                    </Text>
                    <Text className="text-xs text-ios-blue">
                      {t("home.viewAll")}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#0A84FF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Empty state */}
        {stats.total === 0 && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="items-center py-12 px-6"
          >
            <View className="w-24 h-24 rounded-full bg-ios-blue/10 items-center justify-center mb-4">
              <Ionicons name="sparkles" size={48} color="#0A84FF" />
            </View>
            <Text className="text-2xl font-monaBold text-ios-label dark:text-iosd-label mb-2 text-center">
              {t("home.empty.title")}
            </Text>
            <Text className="text-base text-ios-secondary dark:text-iosd-label2 text-center mb-8">
              {t("home.empty.subtitle")}
            </Text>

            <View className="w-full">
              <Animated.View
                entering={FadeInDown.delay(300).springify()}
                className="flex-row items-start p-4 bg-white/70 dark:bg-white/10 rounded-xl mb-4"
              >
                <View className="w-8 h-8 rounded-full bg-ios-blue/15 items-center justify-center mr-3">
                  <Text className="text-ios-blue font-monaBold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-monaBold text-ios-label dark:text-iosd-label">
                    {t("home.empty.tutorial.step1.title")}
                  </Text>
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-1">
                    {t("home.empty.tutorial.step1.description")}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(400).springify()}
                className="flex-row items-start p-4 bg-white/70 dark:bg-white/10 rounded-xl mb-4"
              >
                <View className="w-8 h-8 rounded-full bg-purple-500/15 items-center justify-center mr-3">
                  <Text className="text-purple-500 font-monaBold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-monaBold text-ios-label dark:text-iosd-label">
                    {t("home.empty.tutorial.step2.title")}
                  </Text>
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-1">
                    {t("home.empty.tutorial.step2.description")}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(500).springify()}
                className="flex-row items-start p-4 bg-white/70 dark:bg-white/10 rounded-xl"
              >
                <View className="w-8 h-8 rounded-full bg-green-500/15 items-center justify-center mr-3">
                  <Text className="text-green-500 font-monaBold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-monaBold text-ios-label dark:text-iosd-label">
                    {t("home.empty.tutorial.step3.title")}
                  </Text>
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-1">
                    {t("home.empty.tutorial.step3.description")}
                  </Text>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        )}
      </ScreenScroll>
    </ScreenBackground>
  );
}
