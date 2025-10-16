import { useModal } from "@/context/ModalContext";
import { useNotes } from "@/context/NotesContext";
import { useTab } from "@/context/TabContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/** ========== Konstante / stil ========== */
const FAB_SIZE = 56;
const BLUR_INTENSITY = 20;
const MIN_MENU_W = 160;
const MIN_MENU_H = 44;
const MENU_PAD_H = 30;
const MENU_PAD_V = 15;
const ITEM_VPAD = 10;
const OPEN_RADIUS = 30;
const EASE = Easing.bezier(0.22, 0.95, 0.21, 1);

export default function FabMenu() {
  const { menuOpen, setMenuOpen } = useTab();
  const { addNote, addNoteFromText, addNoteFromPhoto, addNoteFromVideo } =
    useNotes();
  const { openModal, closeModal, alert } = useModal();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const blurTint: "dark" | "light" = isDark ? "dark" : "light";
  const router = useRouter();

  /** ========== Animacija ========== */
  const open = useSharedValue(0);
  const [naturalW, setNaturalW] = React.useState<number>(MIN_MENU_W);
  const [naturalH, setNaturalH] = React.useState<number>(MIN_MENU_H);
  const targetW = Math.max(MIN_MENU_W, Math.ceil(naturalW));
  const targetH = Math.max(MIN_MENU_H, Math.ceil(naturalH));

  React.useEffect(() => {
    open.value = withTiming(menuOpen ? 1 : 0, { duration: 280, easing: EASE });
  }, [menuOpen]);

  const containerStyle = useAnimatedStyle(() => {
    const w = interpolate(open.value, [0, 1], [FAB_SIZE, targetW]);
    const h = interpolate(open.value, [0, 1], [FAB_SIZE, targetH]);
    const r = interpolate(open.value, [0, 1], [FAB_SIZE / 2, OPEN_RADIUS]);
    return {
      width: w,
      height: h,
      borderRadius: r,
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor:
        open.value < 0.02
          ? isDark
            ? "rgba(0,0,0,0.28)"
            : "rgba(255,255,255,0.28)"
          : "transparent",
    };
  });

  const outlineStyle = useAnimatedStyle(() => {
    const r = interpolate(open.value, [0, 1], [FAB_SIZE / 2, OPEN_RADIUS]);
    return {
      borderRadius: r,
      borderWidth:
        Platform.OS === "android"
          ? Math.max(1, StyleSheet.hairlineWidth * 1.5)
          : StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(235,235,245,0.30)" : "rgba(60,60,67,0.28)",
    };
  });

  const OPEN_TINT = isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)";
  const overlayStyle = useAnimatedStyle(() => ({ opacity: open.value }));

  const toggle = () => setMenuOpen(!menuOpen);
  const rAF = (cb: () => void) => requestAnimationFrame(cb);

  const iconColor = isDark ? "#FFF" : "#111";
  const textColor = isDark ? "text-white" : "text-black";
  const sepColor = isDark ? "rgba(235,235,245,0.28)" : "rgba(60,60,67,0.18)";
  const Divider = () => (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: sepColor,
        marginLeft: 26,
        marginRight: 10,
      }}
    />
  );

  /** ========== Akcije ========== */

  // TEXT (quick add preko modala)
  const onText = () => {
    rAF(() => {
      let draft = "";
      openModal({
        title: "Quick Text",
        content: (
          <View className="px-2 pt-2">
            <Text className="text-ios-secondary dark:text-iosd-label2 mb-2 px-2">
              Zabeleži misao (npr. “sledeća zamena ulja na 100000 km”)
            </Text>
            <TextInput
              autoFocus
              placeholder="Upiši ovde…"
              placeholderTextColor="#8E8E93"
              onChangeText={(t) => (draft = t)}
              className="rounded-xl px-4 py-3 bg-ios-fill dark:bg-iosd-fill text-ios-label dark:text-iosd-label border border-ios-sepSoft dark:border-iosd-sepSoft"
            />
            <View className="flex-row justify-center gap-3 mt-4">
              <TouchableOpacity
                onPress={closeModal}
                className="min-w-[120px] px-6 py-3 rounded-full items-center justify-center bg-[#2C2C2E]"
                activeOpacity={0.9}
              >
                <Text className="text-white font-semibold">Otkaži</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const text = (draft || "").trim();
                  if (!text) return;

                  if (typeof addNoteFromText === "function") {
                    await addNoteFromText(text);
                  } else {
                    await addNote({
                      type: "text",
                      title: text.split("\n")[0]?.slice(0, 80) || "New note",
                      text,
                    });
                  }

                  closeModal();
                  setMenuOpen(false);
                }}
                className="min-w-[120px] px-6 py-3 rounded-full items-center justify-center bg-[#007AFF]"
                activeOpacity={0.9}
              >
                <Text className="text-white font-semibold">Sačuvaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        ),
      });
    });
  };

  // AUDIO – placeholder (čuva se na posebnom ekranu)
  const onAudio = () => {
    setMenuOpen(false);
    rAF(() => router.push("/audio-capture"));
  };

  // PHOTO/VIDEO – direktno kroz ImagePicker i kreiranje note
  const onCamera = () => {
    rAF(() => {
      openModal({
        title: "Camera",
        message: "Šta želiš da zabeležiš?",
        content: (
          <View className="px-2 pt-2">
            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 active:opacity-90"
              onPress={async () => {
                try {
                  const { status } =
                    await ImagePicker.requestCameraPermissionsAsync();
                  if (status !== "granted") {
                    alert("Kamera nije dozvoljena.");
                    return;
                  }
                  const res = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.9,
                  });
                  if (!res.canceled && res.assets?.[0]?.uri) {
                    if (typeof addNoteFromPhoto === "function") {
                      await addNoteFromPhoto(res.assets[0].uri);
                    } else {
                      await addNote({
                        type: "photo",
                        title: "Photo",
                        fileUri: res.assets[0].uri,
                      });
                    }
                  }
                } catch (e) {
                  console.log("Photo capture error", e);
                } finally {
                  closeModal();
                  setMenuOpen(false);
                }
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="camera-outline" size={18} color={iconColor} />
                <Text className={`ml-2 text-base ${textColor}`}>
                  Take Photo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>

            <View className="h-2" />

            <TouchableOpacity
              className="flex-row items-center justify-between px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-black/10 dark:border-white/10 active:opacity-90"
              onPress={async () => {
                try {
                  const { status } =
                    await ImagePicker.requestCameraPermissionsAsync();
                  if (status !== "granted") {
                    alert("Kamera nije dozvoljena.");
                    return;
                  }
                  const res = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                    videoMaxDuration: 60,
                  });
                  if (!res.canceled && res.assets?.[0]?.uri) {
                    if (typeof addNoteFromVideo === "function") {
                      await addNoteFromVideo(res.assets[0].uri);
                    } else {
                      await addNote({
                        type: "video",
                        title: "Video",
                        fileUri: res.assets[0].uri,
                      });
                    }
                  }
                } catch (e) {
                  console.log("Video capture error", e);
                } finally {
                  closeModal();
                  setMenuOpen(false);
                }
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="videocam-outline" size={18} color={iconColor} />
                <Text className={`ml-2 text-base ${textColor}`}>
                  Record Video
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        ),
      });
    });
  };

  /** ========== Meni sadržaj (3 akcije) ========== */
  const MenuContent = () => (
    <View
      style={{
        justifyContent: "center",
        paddingHorizontal: MENU_PAD_H,
        paddingVertical: MENU_PAD_V,
      }}
    >
      <TouchableOpacity
        onPress={onText}
        activeOpacity={0.85}
        className="flex-row items-center"
        style={{ paddingVertical: ITEM_VPAD }}
      >
        <Ionicons name="create-outline" size={20} color={iconColor} />
        <Text className={`ml-2 text-base ${textColor}`}>Zabelezi misao</Text>
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        onPress={onAudio}
        activeOpacity={0.85}
        className="flex-row items-center"
        style={{ paddingVertical: ITEM_VPAD }}
      >
        <Ionicons name="mic-outline" size={20} color={iconColor} />
        <Text className={`ml-2 text-base ${textColor}`}>Audio</Text>
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        onPress={onCamera}
        activeOpacity={0.85}
        className="flex-row items-center"
        style={{ paddingVertical: ITEM_VPAD }}
      >
        <Ionicons name="camera-outline" size={20} color={iconColor} />
        <Text className={`ml-2 text-base ${textColor}`}>Camera</Text>
      </TouchableOpacity>
    </View>
  );

  /** ========== Merenje prirodnih dimenzija ========== */
  const onGhostLayout = (e: LayoutChangeEvent) => {
    if (menuOpen) return;
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w && h) {
      setNaturalW(w);
      setNaturalH(h);
    }
  };

  /** ========== Render ========== */
  return (
    <>
      {/* Nevidljivi “ghost” za merenje */}
      <View
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
        onLayout={onGhostLayout}
      >
        <MenuContent />
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={toggle}>
        <Animated.View
          style={containerStyle}
          className="overflow-hidden shadow-md shadow-black/40"
        >
          <BlurView
            intensity={BLUR_INTENSITY}
            tint={blurTint}
            className="absolute inset-0"
          />

          <Animated.View
            pointerEvents="none"
            style={[
              { position: "absolute", inset: 0, backgroundColor: OPEN_TINT },
              overlayStyle,
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", inset: 0 }, outlineStyle]}
          />

          {!menuOpen ? (
            <View className="absolute inset-0 items-center justify-center">
              <Ionicons name="add" size={26} color={iconColor} />
            </View>
          ) : (
            <MenuContent />
          )}
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}
