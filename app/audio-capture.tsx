import Header from "@/components/Header";
import ScreenBackground from "@/components/ScreenBackground";
import { useNotes } from "@/context/NotesContext";
import { usePremium } from "@/context/PremiumContext";
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
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AudioCapture() {
  const { t } = useTranslation("common");
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 60;
  const { addNoteFromAudio, transcribeNote } = useNotes();
  const { isPremium, checkPremiumStatus } = usePremium();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);

  const [ready, setReady] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ⭐ Setup audio sa cleanup
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);
      if (!status.granted) return;
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
      } as any);
      setReady(true);
    })();

    // ⭐ CLEANUP za timer
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // ⭐ Test Whisper auth sa cleanup
  useEffect(() => {
    let mounted = true;

    const testWhisperAuth = async () => {
      if (!mounted) return;

      try {
        const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
          console.log("❌ API key nije definisan");
          return;
        }

        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!mounted) return;

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
        if (!mounted) return;
        console.log("❌ Network error:", e);
      }
    };

    if (__DEV__) {
      testWhisperAuth();
    }

    return () => {
      mounted = false;
    };
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

    // ⭐ Mala pauza da se URI sigurno sačuva
    await new Promise((resolve) => setTimeout(resolve, 100));

    const uri = recorder.uri;
    console.log("🎙️ [3] Recorder URI:", uri);

    if (!uri) {
      console.log("🎙️ [4] No URI - going to inbox");
      router.replace("/inbox");
      return;
    }

    setIsSaving(true);

    try {
      console.log("🎙️ [5] Saving audio note...");
      const id = await addNoteFromAudio(uri);
      console.log("🎙️ [6] Note saved with ID:", id);

      // ⭐ Refresh premium status
      console.log("🎙️ [7] Refreshing premium status...");
      await checkPremiumStatus();
      console.log("🎙️ [7.1] Premium status:", isPremium);

      // ⭐ SAMO premium korisnici dobijaju auto-transcription
      if (isPremium) {
        console.log("🎙️ [8] Premium user - starting transcription");
        transcribeNote(id, uri).catch((err) => {
          console.log("🎙️ [ERROR] Transcription failed:", err);
        });
      } else {
        console.log("🎙️ [8] Non-premium user - skipping transcription");
      }

      console.log("🎙️ [9] Restoring audio mode...");
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldRouteThroughEarpiece: false,
        } as any);
      } catch {}

      console.log("🎙️ [10] Navigating...");
      if (id) {
        console.log("🎙️ [10.1] Opening note detail:", id);
        router.replace({
          pathname: "/note/[id]",
          params: { id },
        });
      } else {
        console.log("🎙️ [10.2] No ID - fallback to inbox");
        router.replace("/inbox");
      }
    } catch (error) {
      console.error("🎙️ [ERROR] Failed to save note:", error);
      router.replace("/inbox");
    } finally {
      setIsSaving(false);
    }
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
          title={t("audioCapture.title")}
          leftIcon="close"
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A84FF" />
          <Text className="text-ios-secondary dark:text-iosd-label2 mt-4">
            {t("audioCapture.preparing")}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  if (permissionGranted === false) {
    return (
      <ScreenBackground variant="plain">
        <Header
          title={t("audioCapture.title")}
          leftIcon="close"
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons
            name="mic-off-outline"
            size={64}
            color="#EF4444"
            style={{ marginBottom: 16 }}
          />
          <Text className="text-center text-lg font-monaBold text-ios-label dark:text-iosd-label mb-2">
            {t("audioCapture.permissionDenied")}
          </Text>
          <Text className="text-center text-ios-secondary dark:text-iosd-label2">
            {t("audioCapture.permissionInstructions")}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="plain">
      <Header
        title={t("audioCapture.title")}
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
          disabled={isSaving}
          className={`w-28 h-28 rounded-full items-center justify-center ${
            recState.isRecording ? "bg-red-500" : "bg-ios-blue"
          } shadow-lg ${isSaving ? "opacity-50" : ""}`}
        >
          <Ionicons
            name={recState.isRecording ? "stop" : "mic"}
            size={36}
            color="white"
          />
        </TouchableOpacity>

        <Text className="mt-6 text-ios-secondary dark:text-iosd-label2 text-center">
          {recState.isRecording
            ? t("audioCapture.tapToStop")
            : t("audioCapture.tapToStart")}
        </Text>

        {!isPremium && !recState.isRecording && (
          <View className="mt-8 px-4 py-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
            <Text className="text-xs text-center text-amber-600 dark:text-amber-400">
              {t("audioCapture.premiumHint")}
            </Text>
          </View>
        )}
      </View>

      {/* ⭐ Loading overlay */}
      {isSaving && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white dark:bg-iosd-elevated rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color="#0A84FF" />
            <Text className="text-ios-label dark:text-iosd-label font-monaBold mt-4">
              {t("audioCapture.saving")}
            </Text>
          </View>
        </View>
      )}
    </ScreenBackground>
  );
}
