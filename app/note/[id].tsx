// app/note/[id].tsx
import ImageFullscreenViewer from "@/components/ImageFullscreenViewer";
import TagChip from "@/components/TagChip";
import TagInput from "@/components/TagInput";
import VideoFullscreenPlayer from "@/components/VideoFullscreenPlayer";
import { useNotes } from "@/context/NotesContext";
import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
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

function formatDateFromISO(iso: string): string {
  try {
    const date = new Date(iso + "T00:00:00");
    const now = new Date();
    const diffDays = Math.round(
      (+date - +new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
        86400000
    );

    if (diffDays === 0) return "Danas";
    if (diffDays === 1) return "Sutra";
    if (diffDays === 2) return "Prekosutra";
    if (diffDays === -1) return "Juče";
    if (diffDays > 1 && diffDays <= 7) return `Za ${diffDays} dana`;
    if (diffDays < -1 && diffDays >= -7) return `Pre ${-diffDays} dana`;

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

  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const note = notes.find((n) => n.id === id);

  // ⭐ Svi hooks na vrhu
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

  // ⭐ Derived state sa optional chaining
  const isTranscribing = transcribingNotes.has(id || "");
  const isGeneratingTitle = generatingTitles.has(id || "");
  const isGeneratingSummary = generatingSummaries.has(id || "");
  const hasSummary = !!note?.ai?.summary && note.ai.summary.length > 0;
  const canGenerateSummary = !!note?.text && note.text.length > 50;

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
            { shouldPlay: false, progressUpdateIntervalMillis: 250 },
            (status) => {
              if (!mounted || !status.isLoaded) return;
              const st = status as AVPlaybackStatusSuccess;
              setAudioLoaded(true);
              setAudioPlaying(st.isPlaying);
              setAudioDuration(st.durationMillis || 0);
              setAudioPosition(st.positionMillis || 0);

              if (st.didJustFinish) {
                setAudioPlaying(false);
                sound.setPositionAsync(0);
              }
            }
          );
          soundRef.current = sound;
        } catch (error) {
          console.log("Audio load error:", error);
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
      console.log("Audio playback error:", error);
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
  if (!note) {
    return (
      <View className="flex-1 bg-ios-bg dark:bg-iosd-bg items-center justify-center">
        <ActivityIndicator size="large" />
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
      console.log("Share error:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Obriši belešku?",
      "Ova akcija se ne može poništiti.",
      [
        {
          text: "Otkaži",
          style: "cancel",
        },
        {
          text: "Obriši",
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

            {note.type === "text" && (
              <TouchableOpacity
                onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
                className="px-4 h-9 rounded-full items-center justify-center bg-ios-blue active:opacity-80"
                activeOpacity={1}
              >
                <Text className="text-white font-semibold text-sm">
                  {isEditing ? "Sačuvaj" : "Izmeni"}
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
          <Text className="flex-1 text-2xl font-bold text-ios-label dark:text-iosd-label mr-3">
            {note.title}
          </Text>

          <View
            className={`px-3 py-1.5 rounded-full flex-row items-center ${typeColor.bg}`}
          >
            <Ionicons name={getTypeIcon()} size={14} color={typeColor.icon} />
            <Text className={`text-xs font-semibold ml-1 ${typeColor.text}`}>
              {note.type.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Generate Title dugme */}
        {note.text && note.text.length > 20 && (
          <Pressable
            onPress={() => generateTitle(note.id)}
            disabled={isGeneratingTitle}
            className="mt-3 flex-row items-center justify-center px-4 py-2 rounded-xl bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 active:opacity-70"
          >
            {isGeneratingTitle ? (
              <>
                <ActivityIndicator size="small" color="#A855F7" />
                <Text className="ml-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  Generiše naslov...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={16} color="#A855F7" />
                <Text className="ml-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  AI Naslov
                </Text>
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
                <Text className="ml-2 text-xs font-semibold text-ios-secondary dark:text-iosd-label2 uppercase tracking-wide">
                  Opis
                </Text>
              </View>
              <Text className="text-base text-ios-label dark:text-iosd-label leading-6">
                {note.description}
              </Text>
            </View>
          )}

          {/* AI SUMMARY SEKCIJA */}
          {canGenerateSummary && (
            <View className="mb-4">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-purple-500/15 dark:bg-purple-500/20 items-center justify-center mr-2">
                    <Ionicons name="sparkles" size={16} color="#A855F7" />
                  </View>
                  <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label">
                    AI Sažetak
                  </Text>
                </View>

                {!hasSummary ? (
                  <TouchableOpacity
                    onPress={() => generateNoteSummary(note.id)}
                    disabled={isGeneratingSummary}
                    className="flex-row items-center px-3 py-1.5 rounded-full bg-purple-500/15 dark:bg-purple-500/20"
                    activeOpacity={0.7}
                  >
                    {isGeneratingSummary ? (
                      <>
                        <ActivityIndicator size="small" color="#A855F7" />
                        <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                          Generiše...
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
                          Generiši
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
                    onPress={async () => {
                      await editNote(note.id, {
                        ai: { ...(note?.ai || {}), summary: undefined },
                      });
                      setTimeout(() => generateNoteSummary(note.id), 100);
                    }}
                    disabled={isGeneratingSummary}
                    className="mt-3 flex-row items-center justify-center py-2 px-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/30"
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={14}
                      color="#A855F7"
                    />
                    <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                      Regeneriši
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Collapsed placeholder */}
              {hasSummary && !isSummaryExpanded && (
                <View className="p-3 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                  <Text className="text-sm text-ios-secondary dark:text-iosd-label2 italic text-center">
                    Klikni da vidiš sažetak
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* PHOTO content */}
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
                    Tap to zoom
                  </Text>
                </View>
              </TouchableOpacity>

              {note.text && (
                <View className="mt-4 p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                      Izvučeni tekst:
                    </Text>

                    <TouchableOpacity
                      onPress={() => extractPhotoText(note.id, note.fileUri!)}
                      disabled={isTranscribing}
                      className="flex-row items-center px-3 py-1.5 rounded-lg bg-green-500/10 dark:bg-green-500/20"
                    >
                      {isTranscribing ? (
                        <>
                          <ActivityIndicator size="small" color="#10B981" />
                          <Text className="ml-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                            Processing...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="refresh-outline"
                            size={14}
                            color="#10B981"
                          />
                          <Text className="ml-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                            Re-extract
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                    {note.text}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* VIDEO content */}
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
                    Tap to play
                  </Text>
                </View>
              </TouchableOpacity>

              {note.text && (
                <View className="mt-4 p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-ios-secondary dark:text-iosd-label2">
                      Transkripcija:
                    </Text>

                    <TouchableOpacity
                      onPress={() => transcribeNote(note.id, note.fileUri!)}
                      disabled={isTranscribing}
                      className="flex-row items-center px-3 py-1.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20"
                    >
                      {isTranscribing ? (
                        <>
                          <ActivityIndicator size="small" color="#A855F7" />
                          <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                            Processing...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="refresh-outline"
                            size={14}
                            color="#A855F7"
                          />
                          <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                            Re-transcribe
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                    {note.text}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* AUDIO content */}
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
                    <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label">
                      Voice Note
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

              {note.text && (
                <View className="mt-4 p-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-ios-sep dark:border-iosd-sep">
                  <Text className="text-sm text-ios-secondary dark:text-iosd-label2 mb-2">
                    Transkripcija:
                  </Text>
                  <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                    {note.text}
                  </Text>
                </View>
              )}
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
                  placeholder="Upiši tekst..."
                  placeholderTextColor="#8E8E93"
                />
              ) : (
                <Text className="text-base leading-6 text-ios-label dark:text-iosd-label">
                  {note.text || "Nema tekstualnog sadržaja"}
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
                <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label">
                  AI Insights
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
                          ? formatDateFromISO(fact.object)
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
              <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label">
                Tagovi
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
                  Nema tagova. Dodaj prvi tag iznad.
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
              <Text className="text-lg font-semibold text-ios-label dark:text-iosd-label">
                Informacije
              </Text>
            </View>

            <View className="bg-white/70 dark:bg-white/5 rounded-2xl p-4 border border-ios-sep dark:border-iosd-sep">
              {note.pinned && (
                <MetadataRow label="Status" value="Pinned" icon="pin" />
              )}
              <MetadataRow
                label="Kreirano"
                value={new Date(note.createdAt).toLocaleString("sr-RS")}
                icon="time-outline"
              />
              {note.updatedAt && (
                <MetadataRow
                  label="Izmenjeno"
                  value={new Date(note.updatedAt).toLocaleString("sr-RS")}
                  icon="create-outline"
                />
              )}
              <MetadataRow
                label="Tip"
                value={note.type}
                icon="albums-outline"
              />
              {note.fileUri && (
                <MetadataRow
                  label="Medija"
                  value="Da"
                  icon="attach-outline"
                  isLast
                />
              )}
            </View>
          </View>
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
          <Text className="text-xs font-bold text-white ml-1">{value}</Text>
        </View>
      ) : (
        <Text className="text-sm text-ios-label dark:text-iosd-label font-medium">
          {value}
        </Text>
      )}
    </View>
  );
}
