import Header from "@/components/Header";
import ScreenBackground from "@/components/ScreenBackground";
import { useNotes } from "@/context/NotesContext";
import { Ionicons } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AudioCapture() {
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 60;
  const { addNoteFromAudio, editNote, transcribeNote } = useNotes();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);

  const [ready, setReady] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);
      if (!status.granted) return;
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false, // speaker by default
      } as any);
      setReady(true);
    })();
  }, []);

  const testWhisperAuth = async () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        console.log("❌ API key nije definisan");
        return;
      }

      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.ok) {
        console.log("✅ API key validan");
        console.log(
          "✅ Tier info dostupan na platform.openai.com/settings/organization/limits"
        );
      } else {
        const err = await res.json();
        console.log("❌ API error:", err);
      }
    } catch (e) {
      console.log("❌ Network error:", e);
    }
  };

  // Pozovi na mount (DEV only)
  useEffect(() => {
    if (__DEV__) testWhisperAuth();
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => setElapsedMs((m) => m + 200), 200);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startRecording = async () => {
    if (!(await AudioModule.requestRecordingPermissionsAsync()).granted) return;
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    } as any);
    await recorder.prepareToRecordAsync();
    recorder.record();
    setElapsedMs(0);
    startTimer();
  };

  const stopRecording = async () => {
    if (!recState.isRecording) return;

    console.log("🎙️ [1] Stopping recording...");

    try {
      await recorder.stop();
    } finally {
      stopTimer();
    }

    console.log("🎙️ [2] Recording stopped");

    requestAnimationFrame(async () => {
      const uri = recorder.uri;
      console.log("🎙️ [3] Recorder URI:", uri);

      if (!uri) {
        console.log("🎙️ [4] No URI - exiting");
        requestAnimationFrame(() => router.back());
        return;
      }

      console.log("🎙️ [5] Saving audio note...");
      const id = await addNoteFromAudio(uri);
      console.log("🎙️ [6] Note saved with ID:", id);

      // ⭐ Prosleđuj URI direktno
      console.log("🎙️ [7] Starting background transcription...");
      transcribeNote(id, uri).catch((err) => {
        console.log("🎙️ [ERROR] Transcription failed:", err);
      });

      console.log("🎙️ [8] Restoring audio mode...");
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false,
        } as any);
      } catch {}

      console.log("🎙️ [9] Going back...");
      requestAnimationFrame(() => router.back());
    });
  };

  const mm = Math.floor(elapsedMs / 1000 / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((elapsedMs / 1000) % 60)
    .toString()
    .padStart(2, "0");

  if (!ready) {
    return (
      <ScreenBackground variant="plain">
        <Header
          title="Audio"
          leftIcon="close"
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 items-center justify-center">
          <Text className="text-ios-secondary dark:text-iosd-label2">
            Preparing…
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  if (permissionGranted === false) {
    return (
      <ScreenBackground variant="plain">
        <Header
          title="Audio"
          leftIcon="close"
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-ios-label dark:text-iosd-label">
            Mikrofon nije dozvoljen u podešavanjima.
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="plain">
      <Header
        title="Audio"
        leftIcon="close"
        onLeftPress={() => router.back()}
      />
      <View
        style={{ paddingTop: headerHeight, flex: 1 }}
        className="items-center justify-center px-8"
      >
        <Text className="text-4xl font-monaBold text-ios-label dark:text-iosd-label mb-8">
          {mm}:{ss}
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={recState.isRecording ? stopRecording : startRecording}
          className={`w-28 h-28 rounded-full items-center justify-center ${
            recState.isRecording ? "bg-red-500" : "bg-ios-blue"
          } shadow-lg`}
        >
          <Ionicons
            name={recState.isRecording ? "stop" : "mic"}
            size={36}
            color="white"
          />
        </TouchableOpacity>

        <Text className="mt-6 text-ios-secondary dark:text-iosd-label2">
          {recState.isRecording
            ? "Tap to stop and save"
            : "Tap to start recording"}
        </Text>
      </View>
    </ScreenBackground>
  );
}
