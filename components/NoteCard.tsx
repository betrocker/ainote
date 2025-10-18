import type { Note } from "@/context/NotesContext";
import { useNotes } from "@/context/NotesContext";
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
import ImageFullscreenViewer from "./ImageFullscreenViewer";
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
  const { transcribingNotes, extractPhotoText } = useNotes();
  const router = useRouter();

  // ⭐ DEBUG - dodaj ovo na početku komponente
  useEffect(() => {
    console.log("🎯 [NoteCard] Debug info:", {
      id: note.id.slice(0, 8),
      type: note.type,
      typeOf: typeof note.type,
      title: note.title,
      hasUri: !!note.fileUri,
    });
  }, [note.type, note.id, note.title, note.fileUri]);

  const isAudio = note.type === "audio";
  const isVideo = note.type === "video";
  const isPhoto = note.type === "photo";

  // ⭐ DEBUG - proveri vrednosti
  console.log("🔍 Type checks:", {
    isAudio,
    isVideo,
    isPhoto,
    actualType: note.type,
  });

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

  // ⭐ DODAJ - Video thumbnail state
  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  const [thumbLoading, setThumbLoading] = useState(false);

  // ⭐ DODAJ - Generisanje video thumbnail-a
  useEffect(() => {
    if (isVideo && hasUri) {
      setThumbLoading(true);
      VideoThumbnails.getThumbnailAsync(note.fileUri!, {
        time: 0, // prvi frejm
        quality: 0.7,
      })
        .then(({ uri }) => setVideoThumb(uri))
        .catch((err) => console.log("Video thumbnail error:", err))
        .finally(() => setThumbLoading(false));
    }
  }, [isVideo, hasUri, note.fileUri]);

  // ⭐ DEBUG LOG
  useEffect(() => {
    if (isAudio) {
      console.log(`📝 [NoteCard ${note.id.slice(0, 8)}]:`, {
        text: note.text,
        hasTranscription,
        isTranscribing,
        textLength: note.text?.length || 0,
      });
    }
  }, [note.text, isAudio, hasTranscription, isTranscribing]);

  // --- expo-av playback (bez Reanimated) ---
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isAudio || !hasUri) return;

      // Playback režim i speaker rutiranje
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false, // SPEAKER, ne earpiece
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: note.fileUri! },
        { shouldPlay: false, progressUpdateIntervalMillis: 250 },
        (status) => {
          if (!mounted || !status.isLoaded) return;
          const st = status as AVPlaybackStatusSuccess;
          setIsLoaded(true);
          setIsPlaying(st.isPlaying);
          if (st.didJustFinish) {
            setIsPlaying(false);
            soundRef.current?.setPositionAsync(0);
          }
        }
      );
      soundRef.current = sound;
    };

    load().catch(() => {});

    return () => {
      mounted = false;
      (async () => {
        try {
          await soundRef.current?.unloadAsync();
        } catch {}
        soundRef.current = null;
      })();
    };
  }, [isAudio, hasUri, note.fileUri]);

  const togglePlayback = async () => {
    if (!isLoaded || !soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
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
        setIsPlaying(true);
      }
    } catch {}
  };

  const handlePress = () => {
    console.log("🔵 [NoteCard] Pressed note:", note.id.slice(0, 8));

    if (onPress) {
      console.log("🔵 [NoteCard] Using custom onPress");
      onPress(note);
    } else {
      console.log("🔵 [NoteCard] Navigating to detail view");
      // ⭐ Koristi href objekat umesto stringa
      router.push({
        pathname: "/note/[id]",
        params: { id: note.id },
      } as Href);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={[
        "mx-4 mb-3 rounded-[24px] overflow-hidden",
        "bg-white/85 dark:bg-black/35",
        "border border-black/10 dark:border-white/15",
        "p-4",
        className,
      ].join(" ")}
    >
      <View className="flex-row items-start">
        {/* tip ikona */}
        <View
          className={[
            "w-10 h-10 rounded-2xl mr-3 items-center justify-center",
            bgColor, // ⭐ NE getBgColor() !!!
            "border border-black/10 dark:border-white/12",
          ].join(" ")}
        >
          <Ionicons
            name={iconName} // ⭐ NE getIconName() !!!
            size={20}
            color={iconColor} // ⭐ NE getIconColor() !!!
          />
        </View>

        {/* tekstualni deo */}
        <View className="flex-1 pr-2">
          <View className="flex-row items-center">
            <Text
              className="flex-1 text-lg font-semibold text-ios-label dark:text-iosd-label"
              numberOfLines={1}
            >
              {note.title?.trim() || "Untitled"}
            </Text>
          </View>

          <Text className="mt-0.5 text-xs text-ios-secondary dark:text-iosd-label2">
            {formatDate(note.createdAt)}
          </Text>

          {/* ⭐ PHOTO preview - dodaj onPress */}
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
              {/* Zoom indikator ikona */}
              <View className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                <Ionicons name="expand-outline" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          )}

          {/* ⭐ OCR dugme za fotografije */}
          {isPhoto && hasUri && !note.text && (
            <TouchableOpacity
              onPress={() => extractPhotoText(note.id, note.fileUri!)}
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

          {/* Prikaz OCR teksta */}
          {isPhoto && note.text && (
            <Text
              numberOfLines={3}
              className="mt-2 text-[13px] leading-5 text-ios-secondary dark:text-iosd-label2"
            >
              {note.text}
            </Text>
          )}

          {/* ⭐ VIDEO preview - dodaj onPress */}
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
                  {/* Play ikona overlay */}
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

          {/* ⭐ Dugme za transkripciju videa */}
          {/* Privremeno onemogući video transkripciju */}
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

          {/* Prikaz transkripcije ako postoji */}
          {isVideo && note.text && (
            <Text
              numberOfLines={3}
              className="mt-2 text-[13px] leading-5 text-ios-secondary dark:text-iosd-label2"
            >
              {note.text}
            </Text>
          )}

          {/* AUDIO mini-player */}
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
                {/* ⭐ Status transkripcije */}
                {isTranscribing && (
                  <View className="mt-2 space-y-2">
                    <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-full animate-pulse" />
                    <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 animate-pulse" />
                  </View>
                )}

                {/* ⭐ Prikaz transkripcije (prve 2 linije) */}
                {!isTranscribing && hasTranscription && (
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    className="mt-2 text-[13px] leading-5 text-ios-secondary dark:text-iosd-label2"
                  >
                    {note.text}
                  </Text>
                )}

                {/* ⭐ Placeholder ako nema transkripcije */}
                {!isTranscribing && !hasTranscription && (
                  <Text className="mt-2 text-[13px] leading-5 text-ios-label dark:text-iosd-label italic">
                    Nema transkripcije
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* TEXT preview */}
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

        {/* ⭐ Fullscreen modali */}
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
      </View>
    </TouchableOpacity>
  );
}
