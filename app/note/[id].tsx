// app/note/[id].tsx
import CustomPaywall from "@/components/CustomPaywall";
import ImageFullscreenViewer from "@/components/ImageFullscreenViewer";
import TagChip from "@/components/TagChip";
import TagInput from "@/components/TagInput";
import VideoFullscreenPlayer from "@/components/VideoFullscreenPlayer";
import { useNotes } from "@/context/NotesContext";
import { usePremium } from "@/context/PremiumContext";
import { usePrivate } from "@/context/PrivateContext";
import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatDateFromISO(iso: string, t: any): string {
  try {
    const date = new Date(iso + "T00:00:00");
    const now = new Date();
    const diffDays = Math.round(
      (+date - +new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
        86400000
    );

    if (diffDays === 0) return t("noteDetail.date.today");
    if (diffDays === 1) return t("noteDetail.date.tomorrow");
    if (diffDays === 2) return t("noteDetail.date.dayAfterTomorrow");
    if (diffDays === -1) return t("noteDetail.date.yesterday");
    if (diffDays > 1 && diffDays <= 7)
      return t("noteDetail.date.inDays", { count: diffDays });
    if (diffDays < -1 && diffDays >= -7)
      return t("noteDetail.date.daysAgo", { count: -diffDays });

    return date.toLocaleDateString("sr-RS", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function NoteDetailScreen() {
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    notes,
    editNote,
    deleteNote,
    transcribeNote,
    extractPhotoText,
    transcribingNotes,
    addTagToNote,
    removeTagFromNote,
    togglePinNote,
    generateTitle,
    generatingTitles,
    generateNoteSummary,
    generatingSummaries,
  } = useNotes();

  const { isPremium } = usePremium();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showPaywall, setShowPaywall] = useState(false);

  const note = notes.find((n) => n.id === id);

  // ⭐ State hooks
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(note?.text || "");
  const [showImageFullscreen, setShowImageFullscreen] = useState(false);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  // Audio state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);

  // ⭐ Derived state
  const isTranscribing = transcribingNotes.has(id || "");
  const isGeneratingTitle = generatingTitles.has(id || "");
  const isGeneratingSummary = generatingSummaries.has(id || "");
  const hasSummary = !!note?.ai?.summary && note.ai.summary.length > 0;
  const canGenerateSummary = !!note?.text && note.text.length > 50;

  const { isAuthAvailable } = usePrivate();

  // Toggle funkcija:
  // Toggle funkcija sa premium proverom
  const togglePrivate = async () => {
    if (!note) return;

    // ✅ Proveri premium ako pokušava da OZNAČI kao privatnu
    if (!note.isPrivate && !isPremium) {
      Alert.alert(
        t("noteDetail.private.premiumRequired") || "Premium Feature",
        t("noteDetail.private.premiumMessage") ||
          "Private folder is a Premium feature. Upgrade to protect your sensitive notes.",
        [
          { text: t("noteDetail.actions.cancel") || "Cancel", style: "cancel" },
          {
            text: t("noteDetail.actions.upgrade") || "Upgrade",
            onPress: () => setShowPaywall(true),
          },
        ]
      );
      return;
    }

    // Ako već jeste privatna, dozvoli da se ukloni privatnost (bez premium provere)
    await editNote(note.id, { isPrivate: !note.isPrivate });
  };

  // ⭐ Premium check helper
  const checkPremiumAndProceed = async (
    action: () => void,
    featureName: string
  ) => {
    console.log("🎯 [Note] Checking premium for:", featureName);

    if (!isPremium) {
      console.log("❌ [Note] User is not premium, showing paywall");
      setShowPaywall(true);
      return;
    }

    console.log("✅ [Note] User has premium, proceeding with:", featureName);
    action();
  };

  // ⭐ Log kada se otvori screen
  useEffect(() => {
    if (id) {
      console.log("📝 NoteDetailScreen opened with ID:", id);
      console.log("📝 Note found:", !!note);
      console.log("🎯 Premium status:", isPremium);
    }
  }, [id, note, isPremium]);

  // ⭐ Update editedText kada se note promeni
  useEffect(() => {
    if (note?.text) {
      setEditedText(note.text);
    }
  }, [note?.text]);

  // ⭐ Load audio ako je audio tip
  useEffect(() => {
    if (note?.type === "audio" && note.fileUri) {
      let mounted = true;

      const loadAudio = async () => {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: note.fileUri! },
            {
              shouldPlay: false,
              progressUpdateIntervalMillis: 250,
              isLooping: false,
            },
            (status) => {
              if (!mounted || !status.isLoaded) return;
              const st = status as AVPlaybackStatusSuccess;
              setAudioLoaded(true);
              setAudioPlaying(st.isPlaying);
              setAudioDuration(st.durationMillis || 0);
              setAudioPosition(st.positionMillis || 0);

              if (st.didJustFinish && mounted) {
                setAudioPlaying(false);
                setAudioPosition(0);
              }
            }
          );
          soundRef.current = sound;
        } catch (error) {
          console.error("❌ Audio load error:", error);
        }
      };

      loadAudio();

      return () => {
        mounted = false;
        (async () => {
          try {
            await soundRef.current?.unloadAsync();
          } catch {}
          soundRef.current = null;
        })();
      };
    }
  }, [note?.type, note?.fileUri]);

  // ⭐ Toggle audio playback
  const toggleAudioPlayback = async () => {
    if (!audioLoaded || !soundRef.current) return;
    try {
      if (audioPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        const st =
          (await soundRef.current.getStatusAsync()) as AVPlaybackStatusSuccess;
        if (
          st.isLoaded &&
          st.positionMillis >= (st.durationMillis ?? 0) - 150
        ) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error("❌ Audio playback error:", error);
    }
  };

  // Format audio duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ⭐ Early return POSLE svih hooks
  if (!id) {
    return (
      <View className="flex-1 bg-ios-bg dark:bg-iosd-bg items-center justify-center p-4">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label mt-4 text-center">
          {t("noteDetail.errors.invalidId")}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 bg-ios-blue rounded-full"
        >
          <Text className="text-white font-monaBold">
            {t("noteDetail.actions.back")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!note) {
    return (
      <View className="flex-1 bg-ios-bg dark:bg-iosd-bg items-center justify-center p-4">
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text className="text-sm text-ios-secondary dark:text-iosd-label2 mt-4">
          {t("noteDetail.errors.loading")}
        </Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (editedText.trim() !== note.text) {
      await editNote(note.id, { text: editedText.trim() });
    }
    setIsEditing(false);
  };

  const handleShare = async () => {
    try {
      const message = `${note.title}\n\n${note.text || ""}`;
      await Share.share({ message });
    } catch (error) {
      console.error("❌ Share error:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("noteDetail.delete.title"),
      t("noteDetail.delete.message"),
      [
        {
          text: t("noteDetail.delete.cancel"),
          style: "cancel",
        },
        {
          text: t("noteDetail.delete.confirm"),
          style: "destructive",
          onPress: async () => {
            await deleteNote(note.id);
            router.back();
          },
        },
      ],
      { cancelable: true }
    );
  };

  // ⭐ AI Feature handlers sa premium check
  const handleGenerateTitle = () => {
    checkPremiumAndProceed(() => generateTitle(note.id), "Generate Title");
  };

  const handleGenerateSummary = () => {
    checkPremiumAndProceed(
      () => generateNoteSummary(note.id),
      "Generate Summary"
    );
  };

  const handleTranscribe = () => {
    if (!note.fileUri) return;
    checkPremiumAndProceed(
      () => transcribeNote(note.id, note.fileUri!),
      "Transcribe"
    );
  };

  const handleExtractText = () => {
    if (!note.fileUri) return;
    checkPremiumAndProceed(
      () => extractPhotoText(note.id, note.fileUri!),
      "Extract Text"
    );
  };

  const handleRegenerateSummary = async () => {
    checkPremiumAndProceed(async () => {
      await editNote(note.id, {
        ai: { ...(note?.ai || {}), summary: undefined },
      });
      setTimeout(() => generateNoteSummary(note.id), 100);
    }, "Regenerate Summary");
  };

  // Helper za boje prema tipu
  const getTypeColor = () => {
    if (note.type === "audio")
      return {
        bg: "bg-purple-500/15",
        text: "text-purple-600 dark:text-purple-400",
        icon: "#A855F7",
      };
    if (note.type === "photo")
      return {
        bg: "bg-green-500/15",
        text: "text-green-600 dark:text-green-400",
        icon: "#10B981",
      };
    if (note.type === "video")
      return {
        bg: "bg-amber-500/15",
        text: "text-amber-600 dark:text-amber-400",
        icon: "#F59E0B",
      };
    return { bg: "bg-ios-blue/15", text: "text-ios-blue", icon: "#0A84FF" };
  };

  const typeColor = getTypeColor();

  const getTypeIcon = () => {
    if (note.type === "audio") return "mic-outline";
    if (note.type === "photo") return "image-outline";
    if (note.type === "video") return "videocam-outline";
    return "document-text-outline";
  };

  return (
    <View className="flex-1 bg-ios-bg dark:bg-iosd-bg">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white/80 dark:bg-black/40 border-b border-ios-sep dark:border-iosd-sep">
        <View className="flex-row items-center justify-between mb-4">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full items-center justify-center bg-ios-fill dark:bg-iosd-fill active:opacity-70"
            activeOpacity={1}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDark ? "#FFF" : "#000"}
            />
          </TouchableOpacity>

          {/* Actions */}
          <View className="flex-row gap-2">
            {/* ⭐ Premium Badge (ako nema premium) */}
            {!isPremium && (
              <View className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-1">
                <Text className="text-white text-[10px] font-monaBold">
                  {t("noteDetail.premium.badge")}
                </Text>
              </View>
            )}

            {/* Pin dugme */}
            <TouchableOpacity
              onPress={() => togglePinNote(note.id)}
              className={[
                "w-9 h-9 rounded-full items-center justify-center active:opacity-70",
                note.pinned ? "bg-amber-500" : "bg-amber-500/15",
              ].join(" ")}
              activeOpacity={1}
            >
              <Ionicons
                name={note.pinned ? "pin" : "pin-outline"}
                size={18}
                color={note.pinned ? "#FFF" : "#F59E0B"}
              />
            </TouchableOpacity>

            {/* Private Toggle dugme */}
            {isAuthAvailable && (
              <TouchableOpacity
                onPress={togglePrivate}
                className={[
                  "w-9 h-9 rounded-full items-center justify-center active:opacity-70",
                  note.isPrivate ? "bg-green-500" : "bg-green-500/15",
                ].join(" ")}
                activeOpacity={1}
              >
                <Ionicons
                  name={note.isPrivate ? "lock-closed" : "lock-open-outline"}
                  size={18}
                  color={note.isPrivate ? "#FFF" : "#48BB78"}
                />
              </TouchableOpacity>
            )}

            {note.type === "text" && (
              <TouchableOpacity
                onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
                className="px-4 h-9 rounded-full items-center justify-center bg-ios-blue active:opacity-80"
                activeOpacity={1}
              >
                <Text className="text-white font-monaBold text-sm">
                  {isEditing
                    ? t("noteDetail.actions.save")
                    : t("noteDetail.actions.edit")}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleShare}
              className="w-9 h-9 rounded-full items-center justify-center bg-ios-fill dark:bg-iosd-fill active:opacity-70"
              activeOpacity={1}
            >
              <Ionicons
                name="share-outline"
                size={18}
                color={isDark ? "#FFF" : "#000"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="w-9 h-9 rounded-full items-center justify-center bg-red-500/15 active:opacity-70"
              activeOpacity={1}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Naslov i Type badge */}
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-2xl font-monaBold text-ios-label dark:text-iosd-label mr-3">
            {note.title}
          </Text>

          <View
            className={`px-3 py-1.5 rounded-full flex-row items-center ${typeColor.bg}`}
          >
            <Ionicons name={getTypeIcon()} size={14} color={typeColor.icon} />
            <Text className={`text-xs font-monaBold ml-1 ${typeColor.text}`}>
              {note.type.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ⭐ Generate Title dugme - SA PREMIUM LOCK */}
        {note.text && note.text.length > 20 && (
          <Pressable
            onPress={handleGenerateTitle}
            disabled={isGeneratingTitle}
            className="mt-3 flex-row items-center justify-center px-4 py-2 rounded-xl bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 active:opacity-70"
          >
            {isGeneratingTitle ? (
              <>
                <ActivityIndicator size="small" color="#A855F7" />
                <Text className="ml-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  {t("noteDetail.ai.generatingTitle")}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={16} color="#A855F7" />
                <Text className="ml-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  {t("noteDetail.ai.generateTitle")}
                </Text>
                {!isPremium && (
                  <View className="ml-2 bg-yellow-500 rounded-full px-1.5 py-0.5">
                    <Text className="text-[9px] font-monaBold text-white">
                      {t("noteDetail.premium.proBadge")}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Pressable>
        )}

        {/* Datum kreacije */}
        <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-2">
          {new Date(note.createdAt).toLocaleString("sr-RS", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 30,
        }}
      >
        <View className="p-4">
          {/* Description kartica */}
          {note.description && (
            <View className="mb-4 p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color="#6B7280"
                />
                <Text className="ml-2 text-xs font-monaBold text-ios-secondary dark:text-iosd-label2 uppercase tracking-wide">
                  {t("noteDetail.sections.description")}
                </Text>
              </View>
              <Text className="text-base text-ios-label dark:text-iosd-label leading-6">
                {note.description}
              </Text>
            </View>
          )}

          {/* ⭐ AI SUMMARY SEKCIJA - SA PREMIUM LOCK */}
          {canGenerateSummary && (
            <View className="mb-4">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-purple-500/15 dark:bg-purple-500/20 items-center justify-center mr-2">
                    <Ionicons name="sparkles" size={16} color="#A855F7" />
                  </View>
                  <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
                    {t("noteDetail.sections.aiSummary")}
                  </Text>
                  {!isPremium && (
                    <View className="ml-2 bg-yellow-500 rounded-full px-2 py-0.5">
                      <Text className="text-[9px] font-monaBold text-white">
                        {t("noteDetail.premium.proBadge")}
                      </Text>
                    </View>
                  )}
                </View>

                {!hasSummary ? (
                  <TouchableOpacity
                    onPress={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="flex-row items-center px-3 py-1.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20"
                    activeOpacity={0.7}
                  >
                    {isGeneratingSummary ? (
                      <>
                        <ActivityIndicator size="small" color="#A855F7" />
                        <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {t("noteDetail.ai.generatingSummary")}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name="add-circle-outline"
                          size={16}
                          color="#A855F7"
                        />
                        <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {t("noteDetail.ai.generateSummary")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="p-1"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#A855F7"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Summary Content */}
              {hasSummary && isSummaryExpanded && (
                <View className="p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                  <Text className="text-base text-ios-label dark:text-iosd-label leading-6">
                    {note?.ai?.summary}
                  </Text>

                  {/* Regenerate dugme */}
                  <TouchableOpacity
                    onPress={handleRegenerateSummary}
                    disabled={isGeneratingSummary}
                    className="mt-3 flex-row items-center justify-center py-2 px-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30"
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={14}
                      color="#A855F7"
                    />
                    <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {t("noteDetail.ai.regenerate")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Collapsed placeholder */}
              {hasSummary && !isSummaryExpanded && (
                <View className="p-3 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                  <Text className="text-sm text-ios-secondary dark:text-iosd-label2 italic text-center">
                    {t("noteDetail.ai.clickToView")}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ⭐ PHOTO content - SA PREMIUM LOCK za extract */}
          {note.type === "photo" && note.fileUri && (
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setShowImageFullscreen(true)}
                activeOpacity={0.95}
                className="rounded-2xl overflow-hidden border border-ios-sep dark:border-iosd-sep"
              >
                <Image
                  source={{ uri: note.fileUri }}
                  style={{ width: "100%", aspectRatio: 4 / 3 }}
                  contentFit="cover"
                />
                <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center">
                  <Ionicons name="expand-outline" size={14} color="#FFF" />
                  <Text className="text-white text-xs font-medium ml-1">
                    {t("noteDetail.media.tapToZoom")}
                  </Text>
                </View>
              </TouchableOpacity>

              <View className="mt-4 p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                      {note.text
                        ? t("noteDetail.media.extractedText")
                        : t("noteDetail.media.extractText")}
                    </Text>
                    {!isPremium && (
                      <View className="ml-2 bg-yellow-500 rounded-full px-1.5 py-0.5">
                        <Text className="text-[8px] font-monaBold text-white">
                          {t("noteDetail.premium.proBadge")}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleExtractText}
                    disabled={isTranscribing}
                    className="flex-row items-center px-3 py-1.5 rounded-lg bg-green-500/10 dark:bg-green-500/20"
                  >
                    {isTranscribing ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Ionicons
                        name={note.text ? "refresh-outline" : "scan-outline"}
                        size={14}
                        color="#10B981"
                      />
                    )}
                    <Text className="ml-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                      {isTranscribing
                        ? t("noteDetail.media.processing")
                        : note.text
                        ? t("noteDetail.media.reExtract")
                        : t("noteDetail.media.extractText")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {note.text && (
                  <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                    {note.text}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ⭐ VIDEO content - SA PREMIUM LOCK za transcribe */}
          {note.type === "video" && note.fileUri && (
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setShowVideoFullscreen(true)}
                activeOpacity={0.95}
                className="rounded-2xl overflow-hidden border border-ios-sep dark:border-iosd-sep bg-black"
              >
                <View
                  style={{ width: "100%", aspectRatio: 16 / 9 }}
                  className="items-center justify-center"
                >
                  <View className="bg-white/20 rounded-full p-6">
                    <Ionicons name="play" size={40} color="#FFF" />
                  </View>
                </View>

                <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center">
                  <Ionicons name="play-circle-outline" size={14} color="#FFF" />
                  <Text className="text-white text-xs font-medium ml-1">
                    {t("noteDetail.media.tapToPlay")}
                  </Text>
                </View>
              </TouchableOpacity>

              <View className="mt-4 p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                      {note.text
                        ? t("noteDetail.media.transcription")
                        : t("noteDetail.media.transcribe")}
                    </Text>
                    {!isPremium && (
                      <View className="ml-2 bg-yellow-500 rounded-full px-1.5 py-0.5">
                        <Text className="text-[8px] font-monaBold text-white">
                          {t("noteDetail.premium.proBadge")}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleTranscribe}
                    disabled={isTranscribing}
                    className="flex-row items-center px-3 py-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20"
                  >
                    {isTranscribing ? (
                      <ActivityIndicator size="small" color="#A855F7" />
                    ) : (
                      <Ionicons
                        name={note.text ? "refresh-outline" : "mic-outline"}
                        size={14}
                        color="#A855F7"
                      />
                    )}
                    <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {isTranscribing
                        ? t("noteDetail.media.processing")
                        : note.text
                        ? t("noteDetail.media.reTranscribe")
                        : t("noteDetail.media.transcribe")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {note.text && (
                  <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                    {note.text}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ⭐ AUDIO content - SA PREMIUM LOCK za transcribe */}
          {note.type === "audio" && note.fileUri && (
            <View className="mb-6">
              <View className="p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                <View className="flex-row items-center mb-4">
                  <TouchableOpacity
                    onPress={toggleAudioPlayback}
                    disabled={!audioLoaded}
                    className={`w-14 h-14 rounded-full items-center justify-center mr-4 ${
                      audioPlaying ? "bg-red-500" : "bg-ios-blue"
                    } ${!audioLoaded ? "opacity-50" : ""}`}
                    activeOpacity={0.8}
                  >
                    {!audioLoaded ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons
                        name={audioPlaying ? "pause" : "play"}
                        size={24}
                        color="#FFF"
                      />
                    )}
                  </TouchableOpacity>

                  <View className="flex-1">
                    <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
                      {t("noteDetail.media.voiceNote")}
                    </Text>
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2 mt-0.5">
                      {formatDuration(audioPosition)} /{" "}
                      {formatDuration(audioDuration)}
                    </Text>
                  </View>

                  <View className="w-10 h-10 rounded-full bg-purple-500/15 items-center justify-center">
                    <Ionicons name="pulse-outline" size={20} color="#A855F7" />
                  </View>
                </View>

                <View className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-ios-blue rounded-full"
                    style={{
                      width:
                        audioDuration > 0
                          ? `${(audioPosition / audioDuration) * 100}%`
                          : "0%",
                    }}
                  />
                </View>
              </View>

              <View className="mt-4 p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                      {note.text
                        ? t("noteDetail.media.transcription")
                        : t("noteDetail.media.transcribe")}
                    </Text>
                    {!isPremium && (
                      <View className="ml-2 bg-yellow-500 rounded-full px-1.5 py-0.5">
                        <Text className="text-[8px] font-monaBold text-white">
                          {t("noteDetail.premium.proBadge")}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleTranscribe}
                    disabled={isTranscribing}
                    className="flex-row items-center px-3 py-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20"
                  >
                    {isTranscribing ? (
                      <ActivityIndicator size="small" color="#A855F7" />
                    ) : (
                      <Ionicons
                        name={note.text ? "refresh-outline" : "mic-outline"}
                        size={14}
                        color="#A855F7"
                      />
                    )}
                    <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {isTranscribing
                        ? t("noteDetail.media.processing")
                        : note.text
                        ? t("noteDetail.media.reTranscribe")
                        : t("noteDetail.media.transcribe")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {note.text && (
                  <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                    {note.text}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* TEXT content */}
          {note.type === "text" && (
            <View className="mb-6">
              {isEditing ? (
                <TextInput
                  value={editedText}
                  onChangeText={setEditedText}
                  multiline
                  autoFocus
                  className="text-base leading-6 text-ios-label dark:text-iosd-label bg-ios-fill dark:bg-iosd-fill rounded-2xl p-4 min-h-[200px]"
                  placeholder={t("noteDetail.text.placeholder")}
                  placeholderTextColor="#8E8E93"
                />
              ) : (
                <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                  {note.text || t("noteDetail.text.noContent")}
                </Text>
              )}
            </View>
          )}

          {/* AI Insights sekcija */}
          {note.ai?.facts && note.ai.facts.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-full bg-ios-blue/15 dark:bg-ios-blue/20 items-center justify-center mr-2">
                  <Ionicons name="sparkles" size={16} color="#0A84FF" />
                </View>
                <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
                  {t("noteDetail.sections.aiInsights")}
                </Text>
              </View>

              <View className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-ios-sep dark:border-iosd-sep">
                {note.ai.facts.map((fact, idx) => (
                  <View
                    key={idx}
                    className={`flex-row items-start py-2 ${
                      idx !== note.ai!.facts!.length - 1
                        ? "border-b border-ios-sep dark:border-iosd-sep"
                        : ""
                    }`}
                  >
                    <View
                      className={`px-2 py-1 rounded-lg mr-3 ${
                        fact.predicate === "due_on"
                          ? "bg-red-500/15"
                          : fact.predicate === "number"
                          ? "bg-blue-500/15"
                          : fact.predicate === "topic"
                          ? "bg-green-500/15"
                          : "bg-gray-500/10"
                      }`}
                    >
                      <Ionicons
                        name={
                          fact.predicate === "due_on"
                            ? "calendar-outline"
                            : fact.predicate === "number"
                            ? "calculator-outline"
                            : fact.predicate === "topic"
                            ? "pricetag-outline"
                            : "document-text-outline"
                        }
                        size={16}
                        color={
                          fact.predicate === "due_on"
                            ? "#EF4444"
                            : fact.predicate === "number"
                            ? "#3B82F6"
                            : fact.predicate === "topic"
                            ? "#10B981"
                            : "#6B7280"
                        }
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-medium text-ios-label dark:text-iosd-label">
                        {fact.predicate === "due_on"
                          ? formatDateFromISO(fact.object, t)
                          : fact.predicate === "number"
                          ? fact.object
                          : fact.predicate === "topic"
                          ? fact.object.charAt(0).toUpperCase() +
                            fact.object.slice(1)
                          : fact.object.slice(0, 60) + "..."}
                      </Text>
                      {fact.subject && fact.predicate !== "note_contains" && (
                        <Text className="text-xs text-ios-secondary dark:text-iosd-label2 mt-0.5">
                          {fact.subject}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAGOVI SEKCIJA */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-ios-blue/15 dark:bg-ios-blue/20 items-center justify-center mr-2">
                <Ionicons name="pricetags" size={16} color="#0A84FF" />
              </View>
              <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
                {t("noteDetail.sections.tags")}
              </Text>
            </View>

            <View className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-ios-sep dark:border-iosd-sep">
              <TagInput
                onAddTag={(tag) => addTagToNote(note.id, tag)}
                existingTags={note.tags || []}
              />

              {note.tags && note.tags.length > 0 && (
                <View className="flex-row flex-wrap mt-3">
                  {note.tags.map((tag) => (
                    <TagChip
                      key={tag}
                      tag={tag}
                      variant="removable"
                      onRemove={() => removeTagFromNote(note.id, tag)}
                    />
                  ))}
                </View>
              )}

              {(!note.tags || note.tags.length === 0) && (
                <Text className="text-sm text-ios-secondary dark:text-iosd-label2 text-center mt-3">
                  {t("noteDetail.tags.noTags")}
                </Text>
              )}
            </View>
          </View>

          {/* Metadata sekcija */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-gray-500/10 dark:bg-gray-500/20 items-center justify-center mr-2">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#6B7280"
                />
              </View>
              <Text className="text-lg font-monaBold text-ios-label dark:text-iosd-label">
                {t("noteDetail.sections.info")}
              </Text>
            </View>

            <View className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-ios-sep dark:border-iosd-sep">
              {note.pinned && (
                <MetadataRow
                  label={t("noteDetail.metadata.status")}
                  value={t("noteDetail.metadata.pinned")}
                  icon="pin"
                />
              )}
              <MetadataRow
                label={t("noteDetail.metadata.created")}
                value={new Date(note.createdAt).toLocaleString("sr-RS")}
                icon="time-outline"
              />
              {note.updatedAt && (
                <MetadataRow
                  label={t("noteDetail.metadata.updated")}
                  value={new Date(note.updatedAt).toLocaleString("sr-RS")}
                  icon="create-outline"
                />
              )}
              <MetadataRow
                label={t("noteDetail.metadata.type")}
                value={note.type}
                icon="albums-outline"
              />
              {note.fileUri && (
                <MetadataRow
                  label={t("noteDetail.metadata.media")}
                  value={t("noteDetail.metadata.yes")}
                  icon="attach-outline"
                  isLast
                />
              )}
            </View>
          </View>
          {/* Custom Paywall */}
          <CustomPaywall
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
            onSuccess={() => {
              setShowPaywall(false);
              // Optional: refresh premium status
              // Može automatski retry action nakon kupovine
            }}
          />
        </View>
      </ScrollView>

      {/* Fullscreen modali */}
      {note.type === "photo" && note.fileUri && (
        <ImageFullscreenViewer
          visible={showImageFullscreen}
          imageUri={note.fileUri}
          onClose={() => setShowImageFullscreen(false)}
        />
      )}

      {note.type === "video" && note.fileUri && (
        <VideoFullscreenPlayer
          visible={showVideoFullscreen}
          videoUri={note.fileUri}
          onClose={() => setShowVideoFullscreen(false)}
        />
      )}
    </View>
  );
}

function MetadataRow({
  label,
  value,
  icon,
  isLast,
}: {
  label: string;
  value: string;
  icon?: string;
  isLast?: boolean;
}) {
  const isPinned = label === "Status" && value === "Pinned";

  return (
    <View
      className={`flex-row items-center justify-between py-3 ${
        !isLast ? "border-b border-ios-sep dark:border-iosd-sep" : ""
      }`}
    >
      <View className="flex-row items-center flex-1">
        {icon && (
          <Ionicons
            name={icon as any}
            size={16}
            color={isPinned ? "#F59E0B" : "#6B7280"}
            style={{ marginRight: 8 }}
          />
        )}
        <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
          {label}
        </Text>
      </View>

      {isPinned ? (
        <View className="bg-amber-500 rounded-full px-2 py-1 flex-row items-center">
          <Ionicons name="pin" size={10} color="#FFF" />
          <Text className="text-xs font-monaBold text-white ml-1">{value}</Text>
        </View>
      ) : (
        <Text className="text-sm text-ios-label dark:text-iosd-label font-medium">
          {value}
        </Text>
      )}
    </View>
  );
}
