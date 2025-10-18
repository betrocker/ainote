// components/VideoFullscreenPlayer.tsx

import { Ionicons } from "@expo/vector-icons";
import * as AVAudio from "expo-av"; // ⭐ Koristi namespace import
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import { Modal, StatusBar, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  videoUri: string;
  onClose: () => void;
};

export default function VideoFullscreenPlayer({
  visible,
  videoUri,
  onClose,
}: Props) {
  // ⭐ Postavi audio mode ODMAH kada se komponenta mountuje
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await AVAudio.Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("✅ Audio mode set to speaker");
      } catch (error) {
        console.error("Audio mode error:", error);
      }
    };

    setupAudio();
  }, []);

  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = false;
    player.volume = 1.0; // ⭐ Osiguraj punu glasnoću
  });

  useEffect(() => {
    if (visible) {
      // Malo kašnjenje da se video učita
      const timer = setTimeout(() => {
        player.volume = 1.0; // ⭐ Ponovo postavi volume
        player.play();
        console.log("▶️ Video playing");
      }, 200);
      return () => clearTimeout(timer);
    } else {
      player.pause();
      player.currentTime = 0;
    }
  }, [visible, player]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View className="flex-1 bg-black items-center justify-center">
        <TouchableOpacity
          onPress={onClose}
          className="absolute top-[50px] right-5 w-11 h-11 rounded-full bg-black/60 items-center justify-center z-10"
          activeOpacity={0.9}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls
          contentFit="contain"
        />
      </View>
    </Modal>
  );
}
