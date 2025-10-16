import Header from "@/components/Header";
import ScreenBackground from "@/components/ScreenBackground";
import { useNotes } from "@/context/NotesContext";
import { transcribeAudio } from "@/utils/ai";
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
  const { addNoteFromAudio, editNote } = useNotes();

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

    try {
      await recorder.stop();
    } finally {
      stopTimer();
    }

    requestAnimationFrame(async () => {
      const uri = recorder.uri;
      if (!uri) {
        requestAnimationFrame(() => router.back());
        return;
      }

      // 1) Sačuvaj audio belešku
      const id = await addNoteFromAudio(uri);

      // 2) Best-effort transkripcija
      try {
        const text = await transcribeAudio(uri, {
          language: "sr",
          prompt:
            "Kratka glasovna beleška, upiši čist tekst bez vremenskih oznaka.",
        });
        if (text?.trim()) {
          await editNote(id, { text }); // NotesContext će generisati facts za ASK
        }
      } catch {}

      // 3) Vrati playback mod i speaker rutiranje
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false, // ANDROID → speaker
        } as any);
      } catch {}

      // 4) Back
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
        <Text className="text-4xl font-semibold text-ios-label dark:text-iosd-label mb-8">
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
