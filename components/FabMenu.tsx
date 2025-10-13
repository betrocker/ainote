import { useNotes } from "@/context/NotesContext";
import { useTab } from "@/context/TabContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
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

const FAB_SIZE = 56;

// Blur – radi stabilnosti držimo ga konstantnim (nema “flash” efekta)
const BLUR_INTENSITY = 20;

// Minimalne mere (ako merenje na prvom frame-u vrati 0)
const MIN_MENU_W = 160;
const MIN_MENU_H = 44;

// Padding i radijus u otvorenom stanju
const MENU_PAD_H = 30;
const MENU_PAD_V = 15;
const ITEM_VPAD = 10;
const OPEN_RADIUS = 30;

// Easing kriva “iOS-asta”
const EASE = Easing.bezier(0.22, 0.95, 0.21, 1);

export default function FabMenu() {
  const { t } = useTranslation("common");
  const { menuOpen, setMenuOpen } = useTab();
  const { addNote } = useNotes();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const blurTint: "dark" | "light" = isDark ? "dark" : "light";

  // Jedan “progress” umesto više odvojenih animacija
  const open = useSharedValue(0);

  // Prirodne (izmerene) dimenzije sadržaja
  const [naturalW, setNaturalW] = React.useState<number>(MIN_MENU_W);
  const [naturalH, setNaturalH] = React.useState<number>(MIN_MENU_H);
  const targetW = Math.max(MIN_MENU_W, Math.ceil(naturalW));
  const targetH = Math.max(MIN_MENU_H, Math.ceil(naturalH));

  React.useEffect(() => {
    open.value = withTiming(menuOpen ? 1 : 0, { duration: 280, easing: EASE });
  }, [menuOpen]);

  // Kontejner: interpoliramo širinu/visinu/radius iz open (0→1)
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
      // samo kad je skoro zatvoreno stavljamo staklasti fill,
      // u otvorenom stanju rely na overlay (ispod).
      backgroundColor:
        open.value < 0.02
          ? isDark
            ? "rgba(0,0,0,0.28)"
            : "rgba(255,255,255,0.28)"
          : "transparent",
    };
  });

  // Outline uvek prisutan, radius prati interpolaciju
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

  // Overlay preko blura – animiramo samo opacity (0→1)
  const OPEN_TINT = isDark ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)";
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: open.value, // linearno 0→1
  }));

  const toggle = () => setMenuOpen(!menuOpen);

  const addTextNote = () => {
    addNote?.({ type: "text", title: t("note.untitled"), content: "" });
    setMenuOpen(false);
  };
  const addAudioNote = () => {
    addNote?.({ type: "audio", title: t("fab.newAudio"), content: "" });
    setMenuOpen(false);
  };
  const addPhotoNote = () => {
    addNote?.({ type: "photo", title: t("fab.newPhoto"), content: "" });
    setMenuOpen(false);
  };
  const addVideoNote = () => {
    addNote?.({ type: "video", title: t("fab.newVideo"), content: "" });
    setMenuOpen(false);
  };

  const afterTwoFrames = (cb: () => void) =>
    requestAnimationFrame(() => requestAnimationFrame(cb));

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

  const MenuContent = () => (
    <View
      style={{
        justifyContent: "center",
        paddingHorizontal: MENU_PAD_H,
        paddingVertical: MENU_PAD_V,
      }}
    >
      <TouchableOpacity
        onPress={addAudioNote}
        activeOpacity={0.85}
        className="flex-row items-center"
        style={{ paddingVertical: ITEM_VPAD }}
      >
        <Ionicons name="mic-outline" size={20} color={iconColor} />
        <Text className={`ml-2 text-base ${textColor}`}>
          {t("fab.newAudio")}
        </Text>
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        onPress={addPhotoNote}
        activeOpacity={0.85}
        className="flex-row items-center"
        style={{ paddingVertical: ITEM_VPAD }}
      >
        <Ionicons name="camera-outline" size={20} color={iconColor} />
        <Text className={`ml-2 text-base ${textColor}`}>
          {t("fab.newPhoto")}
        </Text>
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        onPress={addVideoNote}
        activeOpacity={0.85}
        className="flex-row items-center"
        style={{ paddingVertical: ITEM_VPAD }}
      >
        <Ionicons name="videocam-outline" size={20} color={iconColor} />
        <Text className={`ml-2 text-base ${textColor}`}>
          {t("fab.newVideo")}
        </Text>
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        onPress={() => {
          setMenuOpen(false); // zatvori meni
          afterTwoFrames(() => {
            router.push("/note-compose"); // tek onda navigiraj
          });
        }}
        activeOpacity={0.85}
        className="flex-row items-center"
        style={{ paddingVertical: ITEM_VPAD }}
      >
        <Ionicons name="document-text-outline" size={20} color={iconColor} />
        <Text className={`ml-2 text-base ${textColor}`}>
          {t("fab.newText")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Ghost measurer – merimo prirodne mere; dok je otvoren, ignorišemo update da ne “preskače”
  const onGhostLayout = (e: LayoutChangeEvent) => {
    if (menuOpen) return;
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w && h) {
      setNaturalW(w);
      setNaturalH(h);
    }
  };

  return (
    <>
      {/* Ghost measurer (nevidljiv) – isti sadržaj/padding kao pravi meni */}
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
          {/* Blur sa konstantnim intensity da ne “flashuje” */}
          <BlurView
            intensity={BLUR_INTENSITY}
            tint={blurTint}
            className="absolute inset-0"
          />

          {/* Overlay tint – animirani opacity (0→1) */}
          <Animated.View
            pointerEvents="none"
            style={[
              { position: "absolute", inset: 0, backgroundColor: OPEN_TINT },
              overlayStyle,
            ]}
          />

          {/* Outline uvek prisutan */}
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", inset: 0 }, outlineStyle]}
          />

          {/* Sadržaj */}
          {!menuOpen ? ( // ✅ koristi boolean iz React state-a/konteksta
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
