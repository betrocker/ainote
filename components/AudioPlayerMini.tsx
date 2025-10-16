import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

function fmt(t: number | undefined) {
  const s = Math.max(0, Math.floor(t ?? 0));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function AudioPlayerMini({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri, { updateInterval: 250 });
  const st = useAudioPlayerStatus(player); // { playing, currentTime, duration, isLoaded, ... }

  const toggle = () => {
    if (!st.isLoaded) return;
    if (st.playing) player.pause();
    else player.play();
  };

  return (
    <View className="flex-row items-center gap-3 px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/5">
      <TouchableOpacity
        onPress={toggle}
        className={`w-10 h-10 rounded-full items-center justify-center ${st.playing ? "bg-red-500" : "bg-ios-blue"}`}
        activeOpacity={0.9}
      >
        <Ionicons
          name={st.playing ? "pause" : "play"}
          size={20}
          color="white"
        />
      </TouchableOpacity>

      <View className="flex-1">
        <Text className="text-ios-label dark:text-iosd-label font-medium">
          Voice note
        </Text>
        <Text className="text-ios-secondary dark:text-iosd-label2">
          {fmt(st.currentTime)} / {fmt(st.duration)}
        </Text>
      </View>
    </View>
  );
}
