import { useModal } from "@/context/ModalContext";
import type { Note } from "@/context/NotesContext";
import { useNotes } from "@/context/NotesContext";
import { Ionicons } from "@expo/vector-icons";
import {
  Audio,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from "expo-av";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  note: Note;
  onPress?: (n: Note) => void;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
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

export default function NoteCard({
  note,
  onPress,
  onEdit,
  onDelete,
  className = "",
}: Props) {
  const { deleteNote, transcribingNotes } = useNotes();
  const { confirm } = useModal();

  const isAudio = note.type === "audio";
  const isTranscribing = transcribingNotes.has(note.id);
  const hasTranscription = isAudio && !!note.text && note.text !== "Voice note";
  const hasUri = !!note.fileUri;

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
  // -----------------------------------------

  // Delete sa potvrdom
  const handleDelete = useMemo(
    () => async () => {
      const ok = await confirm({
        title: "Delete note?",
        message: "This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        destructive: true,
      });
      if (!ok) return;

      if (onDelete) return onDelete();

      try {
        await deleteNote(note.id);
      } catch {}
    },
    [confirm, onDelete, deleteNote, note.id]
  );

  return (
    <View
      onTouchEnd={onPress ? () => onPress(note) : undefined}
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
            isAudio
              ? "bg-purple-500/15 dark:bg-purple-500/22"
              : "bg-ios-blue/15 dark:bg-ios-blue/22",
            "border border-black/10 dark:border-white/12",
          ].join(" ")}
        >
          <Ionicons
            name={isAudio ? "mic-outline" : "document-text-outline"}
            size={20}
            color={isAudio ? "#A855F7" : "#0A84FF"}
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

        {/* Akcije */}
        <View className="flex-row items-center ml-1 self-center">
          {onEdit && (
            <TouchableOpacity
              accessibilityLabel="Edit note"
              onPress={onEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 rounded-xl items-center justify-center bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/12 active:opacity-90 mr-1.5"
            >
              <Ionicons name="create-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityLabel="Delete note"
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 rounded-xl items-center justify-center bg-red-500/12 dark:bg-red-500/20 border border-red-500/25 dark:border-red-500/30 active:opacity-90"
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
