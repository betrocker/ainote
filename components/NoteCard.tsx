import CustomPaywall from "@/components/CustomPaywall";
import { useNotes } from "@/context/NotesContext";
import { usePremium } from "@/context/PremiumContext";
import { usePrivate } from "@/context/PrivateContext";
import type { Note } from "@/types/note";
import { Ionicons } from "@expo/vector-icons";
import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import { Href, useRouter } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EditNoteModal from "./EditNoteModal";
import ImageFullscreenViewer from "./ImageFullscreenViewer";
import TagChip from "./TagChip";
import VideoFullscreenPlayer from "./VideoFullscreenPlayer";

type Props = {
  note: Note;
  onPress?: (n: Note) => void;
  className?: string;
};

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NoteCard({ note, onPress, className = "" }: Props) {
  const {
    transcribingNotes,
    extractPhotoText,
    transcribeNote,
    editNote,
    togglePinNote,
  } = useNotes();
  const router = useRouter();
  const { authenticateUser, isInPrivateFolder } = usePrivate();
  const { isPremium, checkPremiumStatus } = usePremium();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const isAudio = note.type === "audio";
  const isVideo = note.type === "video";
  const isPhoto = note.type === "photo";

  const isTranscribing = transcribingNotes.has(note.id);
  const hasTranscription = isAudio && !!note.text && note.text !== "Voice note";
  const hasUri = !!note.fileUri;

  const [showImageFullscreen, setShowImageFullscreen] = useState(false);
  const [showVideoFullscreen, setShowVideoFullscreen] = useState(false);

  const iconName = isAudio
    ? "mic-outline"
    : isPhoto
    ? "image-outline"
    : isVideo
    ? "videocam-outline"
    : "document-text-outline";

  const iconColor = isAudio
    ? "#A855F7"
    : isPhoto
    ? "#10B981"
    : isVideo
    ? "#F59E0B"
    : "#0A84FF";

  const bgColor = isAudio
    ? "bg-purple-500/15 dark:bg-purple-500/22"
    : isPhoto
    ? "bg-green-500/15 dark:bg-green-500/22"
    : isVideo
    ? "bg-amber-500/15 dark:bg-amber-500/22"
    : "bg-ios-blue/15 dark:bg-ios-blue/22";

  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  const [thumbLoading, setThumbLoading] = useState(false);

  useEffect(() => {
    if (isVideo && hasUri) {
      setThumbLoading(true);
      VideoThumbnails.getThumbnailAsync(note.fileUri!, {
        time: 0,
        quality: 0.7,
      })
        .then(({ uri }) => setVideoThumb(uri))
        .catch((err) => console.log("Video thumbnail error:", err))
        .finally(() => setThumbLoading(false));
    }
  }, [isVideo, hasUri, note.fileUri]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);

  // ⭐ CLEANUP - Ukloni useEffect i napravi jednostavniji pristup
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isAudio || !hasUri) return;

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: note.fileUri! },
          {
            shouldPlay: false,
            progressUpdateIntervalMillis: 250,
            isLooping: false, // ⭐ VAŽNO
          },
          // ⭐ SAMO JEDAN LISTENER - ovde
          (status) => {
            if (!mounted || !status.isLoaded) return;

            const st = status as AVPlaybackStatusSuccess;

            // ⭐ KLJUČNO: Proveri didJustFinish
            if (st.didJustFinish) {
              console.log("🎵 [NoteCard] Audio finished");
              setIsPlaying(false);
              setAudioPosition(0);
              // NE pozivaj setPositionAsync ovde - samo update UI
              return;
            }

            // Update state
            setIsLoaded(true);
            setIsPlaying(st.isPlaying);

            if (st.durationMillis) {
              setAudioDuration(st.durationMillis);
            }

            if (st.positionMillis !== undefined) {
              setAudioPosition(st.positionMillis);
            }
          }
        );

        soundRef.current = sound;
      } catch (error) {
        console.error("[NoteCard] Audio load error:", error);
      }
    };

    load();

    return () => {
      mounted = false;
      (async () => {
        try {
          const sound = soundRef.current;
          if (sound) {
            // ⭐ VAŽNO: Stop pa unload
            await sound.stopAsync().catch(() => {});
            await sound.unloadAsync().catch(() => {});
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        } finally {
          soundRef.current = null;
        }
      })();
    };
  }, [isAudio, hasUri, note.fileUri]);

  // ⭐ SIMPLIFIKOVANA togglePlayback funkcija
  const togglePlayback = async () => {
    if (!isLoaded || !soundRef.current) return;

    try {
      const status = await soundRef.current.getStatusAsync();

      if (!status.isLoaded) return;

      const st = status as AVPlaybackStatusSuccess;

      if (st.isPlaying) {
        // ⭐ Pause
        console.log("🎵 [NoteCard] Pausing");
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // ⭐ Play - proveri da li je na kraju
        const isAtEnd =
          st.durationMillis &&
          st.positionMillis !== undefined &&
          st.positionMillis >= st.durationMillis - 100;

        if (isAtEnd) {
          console.log("🎵 [NoteCard] Restarting from beginning");
          await soundRef.current.setPositionAsync(0);
        }

        console.log("🎵 [NoteCard] Playing");
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("[NoteCard] Playback error:", error);
      setIsPlaying(false);
    }
  };

  const handlePress = async () => {
    console.log("🔵 [NoteCard] Pressed note:", note.id.slice(0, 8));

    if (note.isPrivate) {
      if (!isInPrivateFolder) {
        console.log("🔴 [NoteCard] Private note - requesting authentication");
        const authenticated = await authenticateUser();
        if (!authenticated) {
          console.log("🔴 [NoteCard] Authentication failed, not opening");
          return;
        }
      }
    }

    if (onPress) {
      console.log("🔵 [NoteCard] Using custom onPress");
      onPress(note);
    } else {
      console.log("🔵 [NoteCard] Navigating to detail view");
      router.push({
        pathname: "/note/[id]",
        params: { id: note.id },
      } as Href);
    }
  };

  const handleSave = async (id: string, title: string, description: string) => {
    await editNote(id, { title, description });
  };

  const handleEditPress = (e: any) => {
    e.stopPropagation();
    setIsEditModalVisible(true);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={[
        "mx-4 mb-3 rounded-[24px] overflow-hidden",
        "bg-white/85 dark:bg-black/35",
        note.pinned
          ? "border-2 border-amber-500/60 dark:border-amber-400/60"
          : "border border-black/10 dark:border-white/15",
        "p-4",
        className,
      ].join(" ")}
    >
      <View className="flex-row items-start">
        <View className="relative">
          <View
            className={[
              "w-10 h-10 rounded-2xl mr-3 items-center justify-center",
              bgColor,
              "border border-black/10 dark:border-white/12",
            ].join(" ")}
          >
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>

          {note.pinned && (
            <View className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 items-center justify-center border border-white dark:border-black">
              <Ionicons name="pin" size={8} color="#FFF" />
            </View>
          )}

          {note.isPrivate && (
            <View className="absolute top-0 right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center border border-white dark:border-black">
              <Ionicons name="lock-closed" size={8} color="#FFF" />
            </View>
          )}
        </View>

        <View className="flex-1 pr-2">
          <View className="flex-row items-center justify-between">
            <Text
              className="flex-1 text-lg font-monaBold text-ios-label dark:text-iosd-label"
              numberOfLines={1}
            >
              {note.title?.trim() || "Untitled"}
            </Text>

            {note.ai?.summary && (
              <View className="bg-purple-500/15 rounded-full px-1.5 py-0.5">
                <Ionicons name="sparkles" size={10} color="#A855F7" />
              </View>
            )}

            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  togglePinNote(note.id);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="mr-2 p-1"
              >
                <Ionicons
                  name={note.pinned ? "pin" : "pin-outline"}
                  size={18}
                  color={note.pinned ? "#F59E0B" : iconColor}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEditPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="ml-2 p-1"
              >
                <Ionicons name="pencil-outline" size={18} color={iconColor} />
              </TouchableOpacity>
            </View>
          </View>

          {note.description && (
            <Text
              className="mt-1 text-xs text-ios-secondary dark:text-iosd-label2"
              numberOfLines={1}
            >
              {note.description}
            </Text>
          )}

          <Text className="mt-0.5 text-xs text-ios-secondary dark:text-iosd-label2">
            {formatDate(note.createdAt)}
          </Text>

          {note.tags && note.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-2">
              {note.tags.slice(0, 3).map((tag) => (
                <TagChip key={tag} tag={tag} variant="default" />
              ))}
              {note.tags.length > 3 && (
                <View className="px-2 py-1 rounded-full bg-ios-fill dark:bg-iosd-fill">
                  <Text className="text-xs text-ios-secondary dark:text-iosd-label2">
                    +{note.tags.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {isPhoto && hasUri && (
            <TouchableOpacity
              onPress={() => setShowImageFullscreen(true)}
              activeOpacity={0.9}
              className="mt-3 rounded-2xl overflow-hidden"
            >
              <Image
                source={{ uri: note.fileUri }}
                style={{ width: "100%", aspectRatio: 16 / 9 }}
                resizeMode="cover"
              />
              <View className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                <Ionicons name="expand-outline" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          )}

          {isPhoto && hasUri && !note.text && (
            <TouchableOpacity
              onPress={() => {
                if (!isPremium) {
                  setShowPaywall(true);
                  return;
                }
                extractPhotoText(note.id, note.fileUri!);
              }}
              disabled={isTranscribing}
              className="mt-2 flex-row items-center justify-center py-2 px-4 rounded-xl bg-green-500/15 dark:bg-green-500/22"
            >
              {isTranscribing ? (
                <>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text className="ml-2 text-green-600 dark:text-green-400">
                    OCR u toku...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="scan-outline" size={18} color="#10B981" />
                  <Text className="ml-2 text-green-600 dark:text-green-400">
                    Izvuci tekst sa slike
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isPhoto && note.text && (
            <>
              <Text
                numberOfLines={3}
                className="mt-2 text-[13px] leading-5 text-ios-secondary dark:text-iosd-label2"
              >
                {note.text}
              </Text>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (!isPremium) {
                    setShowPaywall(true);
                    return;
                  }
                  extractPhotoText(note.id, note.fileUri!);
                }}
                disabled={isTranscribing}
                className="mt-2 flex-row items-center justify-center py-1.5 px-3 rounded-xl bg-green-500/10 dark:bg-green-500/20 border border-green-500/30"
              >
                {isTranscribing ? (
                  <>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text className="ml-2 text-xs text-green-600 dark:text-green-400">
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
            </>
          )}

          {isVideo && (
            <TouchableOpacity
              onPress={() => setShowVideoFullscreen(true)}
              activeOpacity={0.9}
              className="mt-3 rounded-2xl overflow-hidden relative"
            >
              {thumbLoading ? (
                <View
                  style={{ width: "100%", aspectRatio: 16 / 9 }}
                  className="bg-ios-fill dark:bg-iosd-fill items-center justify-center"
                >
                  <ActivityIndicator size="small" />
                </View>
              ) : videoThumb ? (
                <>
                  <Image
                    source={{ uri: videoThumb }}
                    style={{ width: "100%", aspectRatio: 16 / 9 }}
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-black/60 rounded-full p-3">
                      <Ionicons name="play" size={28} color="white" />
                    </View>
                  </View>
                </>
              ) : (
                <View
                  style={{ width: "100%", aspectRatio: 16 / 9 }}
                  className="bg-ios-fill dark:bg-iosd-fill items-center justify-center"
                >
                  <Ionicons name="videocam-outline" size={40} color="#999" />
                </View>
              )}
            </TouchableOpacity>
          )}

          {isVideo && hasUri && !note.text && (
            <View className="mt-2 flex-row items-center justify-center py-2 px-4 rounded-xl bg-gray-500/15 dark:bg-gray-500/22">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#666"
              />
              <Text className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
                Video transkripcija dolazi uskoro
              </Text>
            </View>
          )}

          {isVideo && note.text && (
            <Text
              numberOfLines={3}
              className="mt-2 text-[13px] leading-5 text-ios-secondary dark:text-iosd-label2"
            >
              {note.text}
            </Text>
          )}

          {isAudio && (
            <View className="mt-3 flex-row items-center gap-3">
              <TouchableOpacity
                onPress={togglePlayback}
                disabled={!hasUri || !isLoaded}
                accessibilityLabel={isPlaying ? "Pause" : "Play"}
                activeOpacity={0.9}
                className={[
                  "w-11 h-11 rounded-full items-center justify-center",
                  isPlaying ? "bg-red-500" : "bg-ios-blue",
                  !hasUri || !isLoaded ? "opacity-50" : "opacity-100",
                ].join(" ")}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color="white"
                />
              </TouchableOpacity>

              <View className="flex-1">
                <Text className="text-ios-label dark:text-iosd-label font-medium">
                  Voice note
                </Text>

                {isTranscribing && (
                  <View className="mt-2 space-y-2">
                    <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-full animate-pulse" />
                    <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 animate-pulse" />
                  </View>
                )}

                {!isTranscribing && hasTranscription && (
                  <View>
                    <Text
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      className="mt-2 text-[13px] leading-5 text-ios-secondary dark:text-iosd-label2"
                    >
                      {note.text}
                    </Text>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();

                        if (!isPremium) {
                          console.log(
                            "🔒 [NoteCard] Not premium - showing paywall"
                          );
                          setShowPaywall(true);
                          return;
                        }

                        console.log(
                          "✅ [NoteCard] Premium user - re-transcribing"
                        );
                        transcribeNote(note.id, note.fileUri!);
                      }}
                      className="mt-2 flex-row items-center justify-center py-1.5 px-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30"
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={14}
                        color="#A855F7"
                      />
                      <Text className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                        Re-transcribe
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isTranscribing && !hasTranscription && (
                  <Text className="mt-2 text-[13px] leading-5 text-ios-label dark:text-iosd-label italic">
                    Nema transkripcije
                  </Text>
                )}
              </View>
            </View>
          )}

          {note.type === "text" && !!note.text && (
            <Text
              numberOfLines={2}
              className="mt-2 text-[13px] leading-5 text-ios-secondary dark:text-iosd-label2"
            >
              {note.text}
            </Text>
          )}
        </View>

        {isTranscribing && (
          <View className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View className="h-full bg-ios-blue w-2/3 animate-pulse" />
          </View>
        )}

        {isPhoto && hasUri && (
          <ImageFullscreenViewer
            visible={showImageFullscreen}
            imageUri={note.fileUri!}
            onClose={() => setShowImageFullscreen(false)}
          />
        )}

        {isVideo && hasUri && (
          <VideoFullscreenPlayer
            visible={showVideoFullscreen}
            videoUri={note.fileUri!}
            onClose={() => setShowVideoFullscreen(false)}
          />
        )}

        <EditNoteModal
          isVisible={isEditModalVisible}
          note={note}
          onClose={() => setIsEditModalVisible(false)}
          onSave={handleSave}
        />

        <CustomPaywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSuccess={async () => {
            await checkPremiumStatus();
            setShowPaywall(false);
          }}
        />
      </View>
    </TouchableOpacity>
  );
}
